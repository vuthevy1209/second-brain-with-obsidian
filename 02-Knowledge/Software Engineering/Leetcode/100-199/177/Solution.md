
``` sql
CREATE FUNCTION getNthHighestSalary(N INT) RETURNS INT
BEGIN
  DECLARE M INT;
  SET M = N - 1;  -- OFFSET bắt đầu từ 0 nên phải trừ 1
  RETURN (
    SELECT (
        SELECT DISTINCT salary
        FROM Employee
        ORDER BY salary DESC
        LIMIT 1 OFFSET M
    ) AS getNthHighestSalary
  );
END
```

**MySQL không cho phép dùng variable/parameter trực tiếp trong `LIMIT`/`OFFSET`** — đây là giới hạn của MySQL parser.

```mysql
-- ❌ Lỗi syntax
LIMIT 1 OFFSET N

-- ✅ Phải là literal hoặc local variable được DECLARE/SET
LIMIT 1 OFFSET M
```

`LIMIT`/`OFFSET` trong MySQL chỉ chấp nhận:

- **Integer literal** — `LIMIT 1 OFFSET 2`
- **Local variable** được khai báo bằng `DECLARE` trong stored procedure/function

Còn **parameter của function** (`N INT`) tuy trông giống variable nhưng MySQL parser **không resolve** nó trong mệnh đề `LIMIT`/`OFFSET`.