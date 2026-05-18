---
name: reorganize-leetcode
description: Reorganize Leetcode problem notes from the New folder into numbered range folders, update LEETCODE.md index, and wire up solution links. Use this skill whenever the user says "reorganize leetcode", "move leetcode notes", "process new leetcode problems", "organize leetcode", or any request involving moving problems out of the New folder in their Leetcode vault.
---

# Leetcode Reorganization Skill

Move every problem folder from `02-Knowledge/Leetcode/New/` to the correct range folder, enrich each problem note with frontmatter + solution links, and update `LEETCODE.md`.

---

## Pre-flight: Discover what needs moving

```bash
ls "02-Knowledge/Leetcode/New/"
```

- If the New folder is empty or does not exist → tell the user, stop.
- Each immediate subdirectory is one problem. Its name is the **problem number** (e.g., `700`).

Process every problem folder one at a time, in numeric order.

---

## For each problem folder

### 1. Determine paths

Given problem number `N` (integer):

**Range folder rule:**
- Problems 1–99 → `1-99`
- Problems 100–199 → `100-199`
- Problems 200–299 → `200-299`
- General formula: `floor(N/100)*100` to `floor(N/100)*100 + 99`
- Exception: if N < 100, range is `1-99`

```
SOURCE = 02-Knowledge/Leetcode/New/{N}/
DEST   = 02-Knowledge/Leetcode/{range}/{N}/
```

### 2. List files in the problem folder

```bash
ls "02-Knowledge/Leetcode/New/{N}/"
```

Identify:
- **Problem note**: the `.md` file that is NOT `Solution.md` and NOT `Simulation.md`
- **Solution file**: `Solution.md` — check if it exists before assuming
- **Simulation file**: `Simulation.md` — check if it exists before assuming

Store these names. Always verify with `ls` — never assume file existence.

### 3. Read the problem note

```bash
cat "02-Knowledge/Leetcode/New/{N}/{problem_note_filename}"
```

Read the full content to derive tags and summary for the frontmatter.

### 4. Write frontmatter to the problem note

Prepend a YAML frontmatter block. If the file already starts with `---`, replace the existing frontmatter block instead of prepending a new one.

Fields:
- `title`: problem name (from filename or first heading in content)
- `summary`: one sentence describing what the problem asks
- `tags`: 2–5 relevant tags based on the problem topic
- `created`: today's date in `YYYY-MM-DD` format

Common tags: `#array`, `#BST`, `#BFS`, `#DFS`, `#stack`, `#dp`, `#two-pointers`, `#sliding-window`, `#graph`, `#tree`, `#binary-search`, `#hash-map`, `#linked-list`, `#recursion`, `#greedy`, `#backtracking`

**Do NOT modify any content below the frontmatter.**

Result format:
```markdown
---
title: "Search in a Binary Search Tree"
summary: "Find a node with a given value in a BST and return its subtree."
tags:
- "#BST"
- "#tree"
- "#recursion"
created: 2026-05-18
---

(original content unchanged)
```

### 5. Append solution links to the problem note

After writing frontmatter, append at the **very end** of the file.

Skip this step if a `## Solution` section already exists in the file.

Use the **destination** path (after moving), not the New path. Always use full Obsidian wikilinks.

If both Solution.md and Simulation.md exist:
```markdown

## Solution
- [[02-Knowledge/Leetcode/{range}/{N}/Solution|Solution]]
- [[02-Knowledge/Leetcode/{range}/{N}/Simulation|Simulation]]
```

If only Solution.md exists:
```markdown

## Solution
- [[02-Knowledge/Leetcode/{range}/{N}/Solution|Solution]]
```

### 6. Move the folder

```bash
mkdir -p "02-Knowledge/Leetcode/{range}/"
mv "02-Knowledge/Leetcode/New/{N}" "02-Knowledge/Leetcode/{range}/{N}"
```

Verify:
```bash
ls "02-Knowledge/Leetcode/{range}/{N}/"
```

Do **not** delete the `New` folder itself.

---

## Update LEETCODE.md

After all problems are moved, update `02-Knowledge/Leetcode/LEETCODE.md`.

### Read current state

```bash
cat "02-Knowledge/Leetcode/LEETCODE.md"
```

### Problems by Number Range section

For each moved problem, add one entry under the correct range subsection, in numeric order:

```markdown
- [[02-Knowledge/Leetcode/{range}/{N}/{note_name_no_extension}|{N}. {Title}]]
```

- Create the range subsection if it doesn't exist yet, placed in numeric order.
- Skip if an entry for this problem number already exists.

### Topics Overview section

If LEETCODE.md has a Topics Overview section, add a link under any topic heading that clearly matches the problem's tags. Skip if unsure.

---

## Error handling

| Situation | Action |
|-----------|--------|
| New folder is empty | Tell user, stop |
| Destination folder already exists | Warn user, skip that problem |
| Problem note (.md) not found | Warn user, skip that problem |
| LEETCODE.md not found | Warn user; still move files, skip LEETCODE.md update |
| `mv` fails | Report exact error, stop |

Never silently overwrite files. Report conflicts to the user.

---

## Summary report

After completing, print:

```
Moved N problems:
  - 700 → 700-799/700 (Search in a Binary Search Tree)
  - ...

LEETCODE.md updated with N new entries.
```