---
name: git-commit-format
description: Applies a consistent git commit message format for this Obsidian vault. Automatically activates when committing changes or discussing commit messages.
---

# Git Commit Message Format

This vault uses a simple, consistent commit message format suitable for a personal Obsidian knowledge base.

## Format

```
type: description

[optional body]
```

- `type` is lowercase
- Always use a colon followed by a single space
- `description` is in imperative mood (e.g., "add note" not "added note")
- Keep the subject line under 72 characters
- Do not end the subject line with a period
- Blank line separates subject from optional body
- Wrap body text at 72 characters

## Allowed Types

| Type       | When to use                                      |
|------------|--------------------------------------------------|
| `add`      | New notes, new folders, new templates, new config |
| `update`   | Modified notes, revised content, reorganized structure |
| `fix`      | Correcting errors in notes, fixing broken links    |
| `delete`   | Removing notes, folders, or unused files          |
| `refactor` | Restructuring vault layout without changing content meaning |
| `docs`     | Changes to documentation, README, CLAUDE.md, skill files |
| `config`   | Changes to `.obsidian/`, `.claude/`, or other config |

## Examples

### Good Commit Messages

```
add: weekly journal for week 18

update: reorganize MOC for programming concepts

fix: broken wikilinks in DevOps folder

delete: deprecated meeting notes from March

refactor: flatten nested folder structure in Zettelkasten

docs: update CLAUDE.md with new folder conventions

config: add custom snippet for callouts
```

### Bad Commit Messages (and corrections)

| Bad                              | Why it is bad                    | Good                          |
|----------------------------------|----------------------------------|-------------------------------|
| `summarize claude folder`        | No type prefix                   | `docs: summarize claude folder` |
| `add: MCP and Hook docs into Claude Skill` | >72 chars | `docs: add MCP and Hook docs to Claude skills` |
| `periodically clean up: 18:48 04/05/2026` | Invalid type, timestamp noise | `delete: remove stale periodic notes` |
| `Added new note about AI`         | Wrong mood, no prefix            | `add: note on AI concepts` |
| `fix: fixed the link`             | Wrong mood ("fixed" vs "fix") | `fix: correct broken wikilink in dashboard` |

## Behavior When Committing

When the user asks to commit changes, or when commit-related work is detected:

1. Run `git status`, `git diff --staged`, and `git log --oneline -10` in parallel to understand current state and recent message style
2. Classify the change using the type table above
3. Draft the subject line in the correct format
4. Add optional body if the change needs explanation (separate with blank line)
5. Present the full message to the user before committing
6. Use this commit command format for multi-line messages:

```bash
git commit -m "$(cat <<'EOF'
docs: add git commit format skill

Defines consistent commit message format with type prefixes
and optional body for the Obsidian vault.
EOF
)"
```

## Edge Cases

- **Multiple types in one change:** Ask the user if they want separate commits or suggest the dominant type
- **User provides their own message:** Gently rewrite it to match the format and ask for confirmation
- **User says "just commit it":** Follow their instruction but note the preferred format for next time
- **Changes span config + content:** Use `config:` if primarily config, or ask the user
