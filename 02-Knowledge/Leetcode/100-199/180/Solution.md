Consecutive appearing means the Id of the Num are next to each others. Since this problem asks for numbers appearing at least three times consecutively, we can use 3 aliases for this table **Logs**, and then check whether 3 consecutive numbers are all the same.

```sql
SELECT DISTINCT l1.num as ConsecutiveNums
FROM
	Logs l1,
	Logs l2,
	Logs l3
WHERE
	l1.Id = l2.Id - 1
	AND l2.Id = l3.Id - 1
	AND l1.Num = l2.Num
	AND l2.Num = l3.Num
;
```
