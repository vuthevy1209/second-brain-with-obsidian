# Slide Window

> [!check] Complexity
> Time Complexity: O(n), Mặc dù có vòng lặp `while` lồng trong `for`, nhưng mỗi phần tử chỉ được **xử lý tối đa 2 lần**:
> - **1 lần** khi `hi` đi qua (thêm vào `sum`)
> - **1 lần** khi `lo` đi qua (trừ khỏi `sum`)
> 
> Space Complexity: O(1)

```java
class Solution {  
    public int minSubArrayLen(int target, int[] nums) {  
        int ans = Integer.MAX_VALUE;  
        int sum = 0;  
  
        int lo = 0;  
        for (int hi = 0; hi < nums.length; hi++) {  
            sum = sum + nums[hi];  
            while (sum >= target) {  
                ans = Math.min(ans, hi - lo + 1);  
                sum -= nums[lo];  
                lo++;  
            }  
        }  
  
        return ans == Integer.MAX_VALUE ? 0 : ans;  
    }  
}
```
