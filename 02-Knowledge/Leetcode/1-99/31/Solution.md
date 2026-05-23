
> [!check] Complexity
> Time Complexity: O(nlogn)
> Space Complexity: O(1)

```java
class Solution {  
    public void nextPermutation(int[] nums) {  
        int index = nums.length - 1;  
        while (index >= 1 && nums[index - 1] >= nums[index]) {  
            index--;  
        }  
  
        if (index == 0) {  
            Arrays.sort(nums);  
            return;  
        }  
  
        int target = nums[index - 1];  
        int min = index;  
        for (int i = index; i < nums.length; i++) {  
            if (nums[i] < nums[min] && nums[i] > target) {  
                min = i;  
            }  
        }  
  
        // swap  
        nums[index - 1] = nums[min];  
        nums[min] = target;  
  
        Arrays.sort(nums, index, nums.length);  
    }  
}
```
