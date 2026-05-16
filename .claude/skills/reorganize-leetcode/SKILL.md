---
name: reorganize-leetcode
description: Reorganize Leetcode notes from New folder to range folders, update README, and link solutions
---

# Leetcode Reorganization Skill

This skill moves Leetcode problems from the `New` folder to their appropriate numbered range folders, updates the README.md with the problem link, and adds links from problem notes to their Solution/Simulation files.

## Usage

After creating a new Leetcode note in `02-Knowledge/Leetcode/New/{problem_number}/{problem_name}.md`, run this skill to:
1. Move the problem folder to the correct range folder (e.g., problem 700 → `700-799/`)
2. Update `02-Knowledge/Leetcode/README.md` with the new problem link
3. Add links from problem note to Solution/Simulation files

## How It Works

1. **Identify the problem number** from the file path (e.g., `New/700/...` → problem 700)
2. **Determine the range folder** (100 ranges: 1-99, 100-199, 200-299, etc.)
3. **Move the problem folder** to the appropriate range directory
4. **Extract problem topic/tags** from the note content
5. **Add link to problem note**:
   - In the problem note: Add a "## Solution" section with links to Solution.md and/or Simulation.md if they exist
6. **Update README.md** with:
   - Add link to the "Topics Overview" section if applicable
   - Add entry to the "Problems by Number Range" table
   - Update statistics (total count, etc.)

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

## Example

Before:
```
02-Knowledge/Leetcode/New/700/Search in a Binary Search Tree.md
02-Knowledge/Leetcode/New/700/Solution.md
```

After:
```
02-Knowledge/Leetcode/700-799/700/Search in a Binary Search Tree.md
02-Knowledge/Leetcode/700-799/700/Solution.md
```

Problem note gets added "## Solution" section with link to Solution.md.
Solution.md remains unchanged.

README.md gets updated with the new problem entry in the appropriate sections.