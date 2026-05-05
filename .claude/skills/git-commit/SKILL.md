---
name: git-commit-format
description: Applies a concise git commit message format for this Obsidian vault. Automatically activates when the user asks to commit and push changes.
---

# Git Commit Message Format

This vault uses a concise commit message format.

## Format

```text
<Short summary of the changes>

- <Brief description of change 1>
- <Brief description of change 2>
```

### Rules
- **Summary Line:** Provide one short, high-level summary of all changes.
- **Bullet Points:** Use bullet points (`-`) to quickly describe the specific changes.
- **Exclude `.obsidian/`:** **CRITICAL:** Do NOT list or mention any file changes, additions, or deletions that occurred inside the `.obsidian/` directory in the commit message.

## Behavior When Committing

When the user asks to commit and push changes:

1. Run `git status` and `git diff --staged` (or `git diff`) to understand the current changes.
2. Draft the commit message exactly following the format and rules above.
3. Use this exact bash command format to commit the multi-line message:

```bash
git commit -m "$(cat <<'EOF'
<Short summary of the changes>

- <Brief description of change 1>
- <Brief description of change 2>
EOF
)"
```

4. Push the changes using `git push`.

## Example Commit Message

```text
Update notes and restructure folders

- Add weekly journal for week 18
- Reorganize MOC for programming concepts
- Fix broken wikilinks in DevOps folder
```
