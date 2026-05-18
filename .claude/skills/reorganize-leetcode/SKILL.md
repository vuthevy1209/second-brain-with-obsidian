---
name: reorganize-leetcode
description: Reorganize Leetcode notes from 02-Knowledge/Leetcode/New folder to range folders, update LEETCODE.md, and link solutions
---

# Leetcode Reorganization Skill

This skill moves Leetcode problems from the `02-Knowledge/Leetcode/New` folder to their appropriate numbered range folders in `02-Knowledge/Leetcode`, updates the LEETCODE.md with the problem link, and adds links from problem notes to their Solution/Simulation files.

## Usage

Read all folders in New and with each folder, Ex: `02-Knowledge/Leetcode/New/{problem_number}/{problem_name}.md`, run this skill to:
1. Move the problem folder to the correct range folder (e.g., problem 700 → `700-799/`)
2. Update `02-Knowledge/Leetcode/LEETCODE.md` with the new problem link.
3. Add links from problem note to Solution/Simulation files

## How It Works

1. **Identify the problem number** from the file path (e.g., `New/700/...` → problem 700)
2. **Determine the range folder** (100 ranges: 1-99, 100-199, 200-299, etc.)
3. **Move the problem folder** to the appropriate range directory. Do not delete the New folder.
4. Read the assignment content to assign tags and write title and description in properties
    ---
    title: ""
    summary: ""
    tags:
    - "#stack"
    - "#tree"
    - "#BFS"
    - "#DFS"
    created: 2026-05-15
    ---
    Important: Do not change the problem content, just write the properties section.
5. **Add link to problem note**:
   - In the problem note: Add a "## Solution" section with links to Solution.md and/or Simulation.md if they exist
6. **Update LEETCODE.md** with:
   - Add link to the "Topics Overview" section if applicable
   - Add entry to the "Problems by Number Range" section.

## Link Structure

### Problem Note (e.g., "Search in a Binary Search Tree.md")
Adds at the end:
```markdown
## Solution

- [[Solution]]
```

If Simulation.md exists:
```markdown
## Solution

- [[Solution]]
- [[Simulation]]
```

### Solution/Simulation Notes
No changes - left as-is.

# Example

Before:
```
02-Knowledge/Leetcode/New/700/Search in a Binary Search Tree.md
02-Knowledge/Leetcode/New/700/Solution.md
02-Knowledge/Leetcode/New/700/Simulation.md
```

After:
```
02-Knowledge/Leetcode/700-799/700/Search in a Binary Search Tree.md
02-Knowledge/Leetcode/700-799/700/Solution.md
02-Knowledge/Leetcode/700-799/700/Simulation.md
```
And in the `Search in a Binary Search Tree.md` will add section:
```markdown
## Solution

- [[02-Knowledge/Leetcode/700-799/700/Solution|Solution]]
- [[02-Knowledge/Leetcode/700-799/700/Simulation|Simulation]]
```

=> Important: add full link to avoid conflicts.

LEETCODE.md gets updated with the new problem entry in the appropriate sections.

