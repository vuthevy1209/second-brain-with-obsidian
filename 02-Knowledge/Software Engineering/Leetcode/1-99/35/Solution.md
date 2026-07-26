
> [!check] Complexity
> Time Complexity: O(logN)
> Space Complexity: O(1)

```java
class Solution {  
    public int searchInsert(int[] nums, int target) {  
        int left = 0;  
        int right = nums.length - 1;  
  
        while (left < right) {  
            int mid = left + (right - left) / 2;  
  
            if (target > nums[mid]) {  
                left = mid + 1;  
            } else if (target < nums[mid]) {  
                right = mid - 1;  
            } else {  
                return mid;  
            }  
        }  
  
        if (target > nums[left])  
            return left + 1;  
  
        return left;  
    }  
}
```
