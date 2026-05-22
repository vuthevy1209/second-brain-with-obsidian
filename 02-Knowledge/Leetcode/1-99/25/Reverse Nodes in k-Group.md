---
title: "Reverse Nodes in k-Group"
summary: "Reverse the nodes of a linked list k at a time and return the modified list."
tags:
  - "#linked-list"
  - "#recursion"
  - "#two-pointers"
created: 2026-05-22
---
Given the `head` of a linked list, reverse the nodes of the list `k` at a time, and return _the modified list_.

`k` is a positive integer and is less than or equal to the length of the linked list. If the number of nodes is not a multiple of `k` then left-out nodes, in the end, should remain as it is.

You may not alter the values in the list's nodes, only nodes themselves may be changed.

**Example 1:**

![](https://assets.leetcode.com/uploads/2020/10/03/reverse_ex1.jpg)

**Input:** head = [1,2,3,4,5], k = 2
**Output:** [2,1,4,3,5]

**Example 2:**

![](https://assets.leetcode.com/uploads/2020/10/03/reverse_ex2.jpg)

**Input:** head = [1,2,3,4,5], k = 3
**Output:** [3,2,1,4,5]

**Constraints:**

- The number of nodes in the list is `n`.
- `1 <= k <= n <= 5000`
- `0 <= Node.val <= 1000`
## Solution
- [[02-Knowledge/Leetcode/1-99/25/Solution|Solution]]
- [[02-Knowledge/Leetcode/1-99/25/Simulation|Simulation]]
