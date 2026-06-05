---
title: "Repeated DNA Sequences"
summary: "Find all 10-letter-long substrings that appear more than once in a DNA string."
tags:
  - "#hash-map"
  - "#sliding-window"
  - "#string"
created: 2026-06-05
---
The **DNA sequence** is composed of a series of nucleotides abbreviated as `'A'`, `'C'`, `'G'`, and `'T'`.

- For example, `"ACGAATTCCG"` is a **DNA sequence**.

When studying **DNA**, it is useful to identify repeated sequences within the DNA.

Given a string `s` that represents a **DNA sequence**, return all the **`10`-letter-long** sequences (substrings) that occur more than once in a DNA molecule. You may return the answer in **any order**.

**Example 1:**

**Input:** s = "AAAAACCCCCAAAAACCCCCCAAAAAGGGTTT"
**Output:** ["AAAAACCCCC","CCCCCAAAAA"]

**Example 2:**

**Input:** s = "AAAAAAAAAAAAA"
**Output:** ["AAAAAAAAAA"]

**Constraints:**

- `1 <= s.length <= 105`
- `s[i]` is either `'A'`, `'C'`, `'G'`, or `'T'`.

## Solution
- [[02-Knowledge/Leetcode/100-199/187/Solution|Solution]]