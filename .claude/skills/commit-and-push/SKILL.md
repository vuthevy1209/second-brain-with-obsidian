---
name: commit-and-push
description: Automatically stage all changes, generate a smart commit message based on the diff (one summary line + bullet points), then push to the remote. Use this skill whenever the user says "commit", "push", "push my code", "commit and push", "save changes to git", "ship it", or any variation of wanting to stage, commit, and push code to a git repository. Trigger even for short requests like "commit this", "push it up", or "git push".
---

# Commit and Push Skill

Analyze the git diff, generate a structured commit message, stage everything, commit, and push.

## Workflow

### Step 1 – Check repo status

```bash
git status
git diff --stat HEAD
```

- If no changes detected → tell the user, stop.
- If not a git repo → report the error clearly.

### Step 2 – Read the full diff

```bash
git diff HEAD

# Also capture untracked/new files
git diff --cached
git status --short
```

Read the diff carefully. Understand:
- Which files changed and why
- What logic or behavior was added, removed, or modified
- Any new files, deletions, or renames

### Step 3 – Generate the commit message

Based on the diff, write a commit message with this structure:

```
<one-line summary in imperative mood, max 72 chars>

- <bullet: specific change 1>
- <bullet: specific change 2>
- <bullet: specific change 3>
...
```

**Rules for the summary line:**
- Imperative mood: "Add", "Fix", "Refactor", "Remove", "Update" — not "Added" or "Adding"
- Specific, not vague: "Add user auth with JWT" not "Update code"
- Max 72 characters

**Rules for bullets:**
- Each bullet describes one concrete change
- Keep bullets to 1 short sentence each
- 2–6 bullets is typical; more only if genuinely needed
- Skip bullets if the summary alone fully covers a tiny change

**Examples of good commit messages:**

```
Add dark mode toggle to settings page

- Add ThemeContext with light/dark state
- Wire toggle switch in SettingsPanel component
- Persist theme preference to localStorage
- Update CSS variables for dark palette
```

```
Fix null pointer crash on empty cart checkout

- Guard against undefined items array in CartService
- Add early return when cart is empty in checkout flow
```

### Step 4 – Stage, commit, and push

Use a temp file for the commit message to handle multi-line cleanly:

```bash
git add .

# Write commit message to temp file
cat > /tmp/commit_msg.txt << 'EOF'
<summary line>

- <bullet 1>
- <bullet 2>
- <bullet 3>
EOF

git commit -F /tmp/commit_msg.txt
git push
```

### Step 5 – Confirm result

After pushing, show the user:
- The commit hash and message
- Which branch was pushed to

If `git push` fails because no upstream is set, try:

```bash
git push --set-upstream origin $(git branch --show-current)
```

If it still fails, show the error and suggest fixes — do not silently retry.

## Edge Cases

| Situation | Action |
|-----------|--------|
| No changes at all | Tell user "Nothing to commit", stop |
| Untracked files only | Include via `git add .`, proceed normally |
| Merge conflicts present | Warn user, do NOT commit, list conflicted files |
| Detached HEAD | Warn user before pushing |
| Push rejected (non-fast-forward) | Report error, suggest `git pull --rebase` first |
| No remote configured | Report error, show how to add one |

## Notes

- Always use `git add .` to stage everything unless the user specifies otherwise.
- Never amend, force-push, or rebase unless explicitly asked.
- If the user provides their own commit message, use it as the summary line and skip auto-generation.