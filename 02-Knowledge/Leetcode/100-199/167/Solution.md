# Binary search

> [!check] Complexity
> Time Complexity: O(nlogN)
> Space Complexity: O(1)

```java
class Solution {  
    public int[] twoSum(int[] numbers, int target) {  
        for (int i = 0; i < numbers.length; i++) {  
            int k = Arrays.binarySearch(numbers, i + 1, numbers.length, target - numbers[i]);  
            if (k >= 0) {  
                return new int[]{i + 1, k + 1};  
            }  
        }  
  
        return new int[]{-1, -1};  
    }  
}
```
