#### Dynamic Programming Bottom-Up

Định nghĩa `dp[i]` = chi phí tối thiểu để **đến được** bậc `i`.

**Base case:**

```
dp[0] = 0  (bắt đầu tại bậc 0, chưa trả phí) => Giả định: cầu thang không có bậc nào nên bước kiểu gì cũng qua không mất phí
dp[1] = 0  (có thể bắt đầu từ bậc 1, chưa trả phí) => Cầu thang chỉ có 1 bậc 0 thì ta nhảy thẳng vào bậc 1 là đã ra ngoài không cần phí.
```

**Transition:**

Để đến bậc `i`, ta có 2 lựa chọn:

- Từ bậc `i-1` bước 1 bậc → trả `cost[i-1]`
- Từ bậc `i-2` bước 2 bậc → trả `cost[i-2]`

```
dp[i] = min(dp[i-1] + cost[i-1], dp[i-2] + cost[i-2])
```

**Đích đến** là bậc `n` (ngoài mảng).

> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity: O(n)

```java
class Solution {  
    public int minCostClimbingStairs(int[] cost) {  
        if (cost.length == 0 || cost.length == 1)  
            return 0;  
  
        int minCost[] = new int[cost.length + 1];  
        minCost[0] = 0;  
        minCost[1] = 0;  
  
        //dp[i] = min(dp[i-1] + cost[i-1], dp[i-2] + cost[i-2])  
        for (int i = 2; i <= cost.length; i++) {  
            minCost[i] = Math.min(
			        minCost[i - 1] + cost[i - 1],
		            minCost[i - 2] + cost[i - 2]
		        );  
        }  
  
        return minCost[cost.length];  
    }  
}
```
