``` sql
SELECT (
	SELECT DISTINCT salary
	FROM Employee
	ORDER BY salary DESC
	LIMIT 1 OFFSET 1
) AS SecondHighestSalary;
```

- `LIMIT 1` — lấy 1 dòng
- `OFFSET 1` — bỏ qua 1 dòng đầu (cao nhất) → còn lại là cao thứ 2
# Sai lầm

``` sql
-- ❌ Trả về empty nếu không có giá trị thứ 2
SELECT DISTINCT salary AS SecondHighestSalary
FROM Employee
ORDER BY salary DESC
LIMIT 1 OFFSET 1;

-- ✅ Trả về NULL nếu không có giá trị thứ 2
SELECT (
    SELECT DISTINCT salary
    FROM Employee
    ORDER BY salary DESC
    LIMIT 1 OFFSET 1
) AS ;
```

Subquery scalar `SELECT (...)` **luôn trả về đúng 1 row** — nếu subquery bên trong empty thì giá trị đó là `NULL`.