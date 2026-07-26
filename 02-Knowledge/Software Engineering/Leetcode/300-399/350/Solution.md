# Using count array

> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity: O(10001)

```java
class Solution {  
    public int[] intersect(int[] nums1, int[] nums2) {  
        int[] count = new int[10001];  
        for (int num1 : nums1){  
            count[num1]++;  
        }  
  
        List<Integer> ans = new ArrayList<>();  
        for (int num2 : nums2) {  
            if (count[num2] > 0) {  
                ans.add(num2);  
                count[num2]--;  
            }  
        }  
  
        return ans.stream().mapToInt(Integer::intValue).toArray();  
    }  
}
```
