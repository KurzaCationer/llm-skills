const fs = require('fs');
const path = require('path');

async function fetchFile(url) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();
      
      const isHtml = contentType.includes('text/html') || 
                     text.trim().toLowerCase().startsWith('<!doctype html') || 
                     text.trim().toLowerCase().startsWith('<html');

      if (isHtml) {
        throw new Error('Detected HTML content.');
      }
      return text;
    } else {
      // Log non-200 responses
      // console.log(`\nDEBUG: ${url} returned ${response.status}`);
    }
  } catch (error) {
    if (error.message.includes('Detected HTML')) {
        throw error;
    }
    // console.log(`\nDEBUG: Error fetching ${url}: ${error.message}`);
  }
  return null;
}

async function main() {
  const targetUrls = process.argv.slice(2);
  if (targetUrls.length === 0) {
    console.error('Usage: node fetch_llms_txt.cjs <URL1> [URL2] ...');
    process.exit(1);
  }

  const outputDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const metadataPath = path.join(outputDir, 'metadata.json');
  let metadata = { sources: [], files: {} };
  if (fs.existsSync(metadataPath)) {
    try {
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    } catch (e) {
      // Keep defaults
    }
  }

  let totalFoundCount = 0;
  
  for (const targetUrl of targetUrls) {
    if (!metadata.sources.includes(targetUrl)) {
      metadata.sources.push(targetUrl);
    }

    const urlObj = new URL(targetUrl);
    const origin = urlObj.origin;
    const hostname = urlObj.hostname;
    const baseUrl = targetUrl.endsWith('/') ? targetUrl.slice(0, -1) : targetUrl;
    
    // Clean up existing directory for this host to ensure a fresh fetch
    const hostDir = path.join(outputDir, hostname);
    if (fs.existsSync(hostDir)) {
      console.log(`🧹 Cleaning up existing documentation for ${hostname}...`);
      fs.rmSync(hostDir, { recursive: true, force: true });
    }
    const initialCandidates = [
      targetUrl,
      `${baseUrl}/llms.txt`,
      `${baseUrl}/llms-full.txt`,
      `${baseUrl}/.well-known/llms.txt`,
      `${baseUrl}/.well-known/llms-full.txt`,
    ];

    if (baseUrl !== origin) {
      initialCandidates.push(
        `${origin}/llms.txt`,
        `${origin}/llms-full.txt`,
        `${origin}/.well-known/llms.txt`,
        `${origin}/.well-known/llms-full.txt`
      );
    }

    const visitedUrls = new Set();
    const queue = initialCandidates.map(url => ({ url, depth: 0 }));
    let foundCount = 0;
    let totalChecked = 0;
    let skippedCount = 0;

    const urlToLocalPath = new Map();
    const savedFiles = [];

    console.log(`🔍 Discovering and fetching documentation for: ${targetUrl}`);

    while (queue.length > 0) {
      const { url, depth } = queue.shift();
      if (visitedUrls.has(url) || depth > 5) continue;
      visitedUrls.add(url);
      totalChecked++;

      process.stdout.write(`\rProgress: ${totalChecked} checked, ${foundCount} saved, ${skippedCount} skipped...`);
      let content;
      try {
          content = await fetchFile(url);
      } catch (e) {
          skippedCount++;
          continue;
      }
      
      if (content) {
        const urlObj = new URL(url);
        const hostDir = path.join(outputDir, urlObj.hostname);
        const pathSegments = urlObj.pathname.split('/').filter(Boolean);
        let targetSubDir = hostDir;
        let finalFileName = pathSegments.pop() || 'llms.txt';

        const processedSegments = [];
        for (const segment of pathSegments) {
          if (segment.includes('llms.txt') || segment.includes('llms-full.txt')) {
            const prefix = segment.replace('.txt', '');
            finalFileName = `${prefix}-${finalFileName}`;
          } else {
            processedSegments.push(segment);
          }
        }

        targetSubDir = path.join(hostDir, ...processedSegments);
        if (!fs.existsSync(targetSubDir)) {
          fs.mkdirSync(targetSubDir, { recursive: true });
        }

        if (!path.extname(finalFileName)) {
          finalFileName += '.txt';
        }
        const filePath = path.join(targetSubDir, finalFileName);
        
        try {
          fs.writeFileSync(filePath, content);
          foundCount++;
          totalFoundCount++;
          
          urlToLocalPath.set(url, filePath);
          savedFiles.push({ url, filePath, content });
          
          const relativePath = path.relative(outputDir, filePath);
          metadata.files[url] = relativePath;
        } catch (e) {
          // Silently handle save errors during progress
        }

        if ((url.includes('llms.txt') || url.includes('llms-full.txt')) && depth < 5) {
          const links = extractLinks(content, url);
          for (const link of links) {
            if (!visitedUrls.has(link)) {
              queue.push({ url: link, depth: depth + 1 });
            }
          }
        }
      }
    }

    for (const { filePath, content } of savedFiles) {
      let updatedContent = content;
      const sortedUrls = [...urlToLocalPath.keys()].sort((a, b) => b.length - a.length);
      
      for (const url of sortedUrls) {
        const localPath = urlToLocalPath.get(url);
        const relativeLocalPath = path.relative(path.dirname(filePath), localPath);
        const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        updatedContent = updatedContent.replace(new RegExp(escapedUrl, 'g'), relativeLocalPath);
      }
      fs.writeFileSync(filePath, updatedContent);
    }
    process.stdout.write('\n');
  }

  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  updateGeminiIndex(outputDir, metadata);

  process.stdout.write('\n');
  if (totalFoundCount === 0) {
    console.log('❌ No llms.txt or llms-full.txt found for any provided URLs.');
  } else {
    console.log('✅ Documentation fetch complete.');
    console.log(`- Total files saved: ${totalFoundCount}`);
    console.log(`- Documentation root: ${outputDir}`);
    console.log('- Index file: docs/GEMINI.md');
    console.log('- Metadata file: docs/metadata.json');
    console.log('\nAI Instructions: Use docs/GEMINI.md to navigate the discovered documentation.');
  }
}

function extractLinks(content, baseUrl) {
  const links = [];
  // Target markdown links or plain URLs that include llms.txt or llms-full.txt
  const regex = /\[.*?\]\((.*?llms(?:-full)?\.txt.*?)\)|(https?:\/\/\S*?llms(?:-full)?\.txt\S*)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    let link = match[1] || match[2];
    if (link) {
      try {
        const absoluteUrl = new URL(link, baseUrl).href;
        links.push(absoluteUrl);
      } catch (e) {
        // Skip invalid URLs
      }
    }
  }
  return links;
}

function updateGeminiIndex(outputDir, metadata) {
  const geminiPath = path.join(outputDir, 'GEMINI.md');
  
  let content = '# Project Documentation Index\n\nThis directory contains documentation fetched via llms.txt discovery. Detailed URL mappings can be found in [metadata.json](metadata.json).\n\n## Imported Libraries\n\n';

  const hostnames = new Set();
  for (const url in metadata.files) {
    try {
        hostnames.add(new URL(url).hostname);
    } catch (e) {}
  }

  for (const host of Array.from(hostnames).sort()) {
    content += `- **${host}**: [View Files](./${host})\n`;
  }

  fs.writeFileSync(geminiPath, content);
}

main();