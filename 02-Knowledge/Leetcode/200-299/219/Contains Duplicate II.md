---
title: "Contains Duplicate II"
summary: "Check if any two distinct indices i and j exist such that nums[i] == nums[j] and abs(i - j) <= k."
tags:
  - "#hash-map"
  - "#sliding-window"
  - "#array"
created: 2026-06-05
---
Given an integer array `nums` and an integer `k`, return `true` _if there are two **distinct indices**_ `i` _and_ `j` _in the array such that_ `nums[i] == nums[j]` _and_ `abs(i - j) <= k`.

**Example 1:**

**Input:** nums = [1,2,3,1], k = 3
**Output:** true

**Example 2:**

**Input:** nums = [1,0,1,1], k = 1
**Output:** true

**Example 3:**

**Input:** nums = [1,2,3,1,2,3], k = 2
**Output:** false

**Constraints:**

- `1 <= nums.length <= 105`
- `-109 <= nums[i] <= 109`
- `0 <= k <= 105`

## Solution
- [[02-Knowledge/Leetcode/200-299/219/Solution|Solution]]