# Skill Development Guide

This repository uses a structured workflow for creating and maintaining skills.

## Structure

- `skills/`: Source code and `SKILL.md` for each skill.
- `dist/`: Packaged `.skill` files tracked in Git for direct consumption.

## Workflow

1.  **Initialize**: Use `init_skill.cjs` to scaffold a new skill in `skills/`.
2.  **Develop**: Edit `SKILL.md` and add resources to `scripts/`, `references/`, or `assets/`.
3.  **Package**: Every change to a skill must be followed by re-packaging it into `dist/`.
4.  **Sync**: Commit and push changes using conventional commits (all lowercase except brand names).

### Commit Format

Use the following format for commit messages:
`<type>: <description>`

- **type**: feat, fix, docs, refactor, etc.
- **description**: All lowercase except for brand names (e.g., `feat: add llms-docs-fetcher skill`).

### Packaging Command

If `zip` is not available on your system, use this Python fallback:

```bash
python3 -c "import zipfile, os; 
skill_path = 'skills/<skill-name>'; 
output_file = 'dist/<skill-name>.skill'; 
os.makedirs('dist', exist_ok=True);
with zipfile.ZipFile(output_file, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(skill_path):
        for file in files:
            file_path = os.path.join(root, file);
            arcname = os.path.relpath(file_path, skill_path);
            zipf.write(file_path, arcname)"
```