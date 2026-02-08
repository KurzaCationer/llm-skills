# llm-skills

A repository for custom Gemini CLI skills.

## Available Skills

- **llms-docs-fetcher**: Discovers and fetches `llms.txt` and `llms-full.txt` documentation. Useful for keeping local AI-friendly documentation up-to-date.

## Installation

To install a skill from this repository, use the raw link to the `.skill` file in the `dist/` directory:

```bash
gemini skills install https://raw.githubusercontent.com/<user>/llm-skills/main/dist/<skill-name>.skill
```

After installation, reload your skills:
```bash
/skills reload
```
