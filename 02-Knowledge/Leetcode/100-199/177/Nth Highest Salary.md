---
title: "Nth Highest Salary"
summary: "Find the Nth highest distinct salary from the Employee table using a stored function, returning null if fewer than N distinct salaries exist."
tags:
  - "#sql"
  - "#subquery"
  - "#database"
created: 2026-05-23
---
Table: `Employee`

+-------------+------+
| Column Name | Type |
+-------------+------+
| id          | int  |
| salary      | int  |
+-------------+------+
id is the primary key (column with unique values) for this table.
Each row of this table contains information about the salary of an employee.

Write a solution to find the `nth` highest **distinct** salary from the `Employee` table. If there are less than `n` distinct salaries, return `null`.

The result format is in the following example.

**Example 1:**

**Input:** 
Employee table:
+----+--------+
| id | salary |
+----+--------+
| 1  | 100    |
| 2  | 200    |
| 3  | 300    |
+----+--------+
n = 2
**Output:** 
+------------------------+
| getNthHighestSalary(2) |
+------------------------+
| 200                    |
+------------------------+

**Example 2:**

**Input:** 
Employee table:
+----+--------+
| id | salary |
+----+--------+
| 1  | 100    |
+----+--------+
n = 2
**Output:** 
+------------------------+
| getNthHighestSalary(2) |
+------------------------+
| null                   |
+------------------------+
## Solution
- [[02-Knowledge/Leetcode/100-199/177/Solution|Solution]]
