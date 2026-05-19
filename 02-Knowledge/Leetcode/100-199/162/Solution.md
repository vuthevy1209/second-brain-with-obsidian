1. No adjacent two numbers are the same
2. the two end of the arrays are -∞
3. You can return any peak.

![[Solution-1779180958491.webp]]


> [!check] Complexity
> Time Complexity: O(logN)
> Space Complexity: O(1)

```java
class Solution {  
    public int findPeakElement(int[] nums) {  
        int left = 0;  
        int right = nums.length - 1;  
        while (left < right) {  
            int mid = left + (right - left) / 2;  
            if (nums[mid] < nums[mid+1]) {  
                left = mid + 1;  
            } else {  
                right = mid;  
            }  
        }  
  
        return left;  
    }  
}
```
