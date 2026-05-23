- Mảng tăng dần mà có xoay vòng thì chỉ có thể có duy nhất một điểm giảm: nums[i] > nums[(i + 1) % n]

> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity: O(1)

```java
class Solution {  
    public boolean check(int[] nums) {  
        int drops = 0;  
        int n = nums.length;  
  
        for (int i = 0; i < n; i++) {  
            if (nums[i] > nums[(i + 1) % n]) {  
                drops++;  
            }  
            if (drops > 1) return false;  
        }  
  
        return true;  
    }  
}
```
