# Binary Search

> [!check] Complexity
> Time Complexity: O(NlogN + N^2)
> Space Complexity: O(1)

```java
class Solution {  
    public int threeSumClosest(int[] nums, int target) {  
        Arrays.sort(nums);  
  
        int ans = Integer.MAX_VALUE - target;  
        for (int i = 0; i < nums.length; i++) {  
            int num1 = nums[i];  
            int left = i + 1;  
            int right = nums.length - 1;  
  
            while (left < right) {  
                int sum = num1 + nums[left] + nums [right];  
                if (sum < target) {  
                    if (Math.abs(sum - target) < Math.abs(ans - target))  
                        ans = sum;  
                    left++;  
                } else if (sum > target) {  
                    if (Math.abs(sum - target) < Math.abs(ans - target))  
                        ans = sum;  
                    right--;  
                } else {  
                    return target;  
                }  
            }  
        }  
  
        return ans;  
    }  
}
```
