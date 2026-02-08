---
name: llms-docs-fetcher
description: Discovers and downloads llms.txt and llms-full.txt from websites. Use when the user asks to "fetch documentation" or when starting an implementation task for a library where local documentation is missing or outdated. Trigger this skill to proactively search for llms.txt patterns on the project's dependency domains.
---

# LLMS Docs Fetcher

This skill automates the discovery and local storage of `llms.txt` and `llms-full.txt` files.

## Workflow

1.  **Extract URL**: Identify the base URL from the user request or project dependencies.
2.  **Run Fetcher**: Execute the fetcher script to check common locations.
3.  **Storage**: Files are saved to a `docs/` directory with a `GEMINI.md` index.

## Proactive Discovery

When working on implementation tasks:
- **Missing Docs**: If you are asked to implement a feature using a library (e.g., Panda CSS, Next.js) and no local documentation is found in `docs/`, proactively check if the library provides an `llms.txt` file at its root or `/docs` path.
- **Outdated Docs**: If local documentation seems outdated, re-run the fetcher to refresh the specific host directory.

## Usage



Run the script using the following command:



```bash

node scripts/fetch_llms_txt.cjs <URL1> [URL2] [URL3] ...

```



## Example Requests



- "Download the documentation from https://example.com and https://another-docs.com"

- "Find the llms.txt for https://docs.github.com"

- "Fetch docs for https://openai.com and https://anthropic.com"
