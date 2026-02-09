# Skill Development Mandates

STRICT ADHERENCE REQUIRED. NO EXCEPTIONS.

1. **Skill**: Use the `skill-creator` skill to start a new skill or modify an existing skill.
1. **Scaffold**: Use `init_skill.cjs` for initalization of all new skills.
2. **Package**: Every change to `skills/` MUST be immediately followed by packaging into `dist/`.
3. **Commits**: Follow Conventional Commits strictly (`<type>: <description>`). Description MUST be all lowercase (except brand names). Always push commits.
4. **No Installs**: Don't ever try to install the skills inside of this repository. This is the responsibility of the user.

# Packaging (Python Fallback)
```bash
python3 -c "import zipfile, os; s_p='skills/<name>'; o_f='dist/<name>.skill'; os.makedirs('dist', exist_ok=True);
with zipfile.ZipFile(o_f, 'w', zipfile.ZIP_DEFLATED) as z:
    for r, d, fs in os.walk(s_p):
        for f in fs:
            fp = os.path.join(r, f); z.write(fp, os.path.relpath(fp, s_p))"
```