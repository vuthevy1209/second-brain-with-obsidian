---
title: "Count Complete Tree Nodes"
summary: "Given the root of a complete binary tree, return the number of nodes in the tree using less than O(n) time."
tags:
  - "#tree"
  - "#binary-search"
  - "#DFS"
created: 2026-06-01
---
Given the `root` of a **complete** binary tree, return the number of the nodes in the tree.

According to **[Wikipedia](http://en.wikipedia.org/wiki/Binary_tree#Types_of_binary_trees)**, every level, except possibly the last, is completely filled in a complete binary tree, and all nodes in the last level are as far left as possible. It can have between `1` and `2h` nodes inclusive at the last level `h`.

Design an algorithm that runs in less than `O(n)` time complexity.

**Example 1:**

![|373x303](https://assets.leetcode.com/uploads/2021/01/14/complete.jpg)

**Input:** root = [1,2,3,4,5,6]
**Output:** 6

**Example 2:**

**Input:** root = []
**Output:** 0

**Example 3:**

**Input:** root = [1]
**Output:** 1

**Constraints:**

- The number of nodes in the tree is in the range `[0, 5 * 104]`.
- `0 <= Node.val <= 5 * 104`
- The tree is guaranteed to be **complete**.

## Solution
- [[02-Knowledge/Software Engineering/Leetcode/200-299/222/Solution|Solution]]