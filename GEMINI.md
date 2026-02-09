# Skill Development Mandates

STRICT ADHERENCE REQUIRED. NO EXCEPTIONS.

1. **Scaffold**: Use `init_skill.cjs` for all new skills.
2. **Package**: Every change to `skills/` MUST be immediately followed by packaging into `dist/`.
3. **Commits**: Follow Conventional Commits strictly (`<type>: <description>`). Description MUST be all lowercase (except brand names). Always push commits.

### Packaging (Python Fallback)
```bash
python3 -c "import zipfile, os; s_p='skills/<name>'; o_f='dist/<name>.skill'; os.makedirs('dist', exist_ok=True);
with zipfile.ZipFile(o_f, 'w', zipfile.ZIP_DEFLATED) as z:
    for r, d, fs in os.walk(s_p):
        for f in fs:
            fp = os.path.join(r, f); z.write(fp, os.path.relpath(fp, s_p))"
```
