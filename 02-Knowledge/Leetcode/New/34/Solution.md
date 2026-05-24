
> [!check] Complexty
> Time Complexity: O(logN)
> Space Complexity: O(1)

```java
class Solution {  
    int findFirst(int[] nums, int target) {  
        int left = 0;  
        int right = nums.length - 1;  
        while (left < right) {  
            int mid = left + (right - left) / 2;  
  
            if (target > nums[mid]) {  
                left = mid + 1;  
            } else if (target <= nums[mid]) {  
                right = mid - 1;  
            }  
        }  
  
        if (nums[left] == target) {  
            return left;  
        }  
  
        if (left + 1 <= nums.length - 1 && nums[left + 1] == target)  
            return left + 1;  
  
        return -1;  
    }  
  
    int findLast(int[] nums, int target) {  
        int left = 0;  
        int right = nums.length - 1;  
        while (left < right) {  
            int mid = left + (right - left) / 2;  
  
            if (target >= nums[mid]) {  
                left = mid + 1;  
            } else if (target < nums[mid]) {  
                right = mid - 1;  
            }  
        }  
  
        if (nums[left] == target) {  
            return left;  
        }  
  
        if (left - 1 >= 0 && nums[left - 1] == target)  
            return left - 1;  
  
        return -1;  
    }  
  
    public int[] searchRange(int[] nums, int target) {  
        if (nums.length == 0)  
            return new int[]{-1, -1};  
  
        int first = findFirst(nums, target);  
        int last = findLast(nums, target);  
        return new int[]{first, last};  
    }  
}
```
