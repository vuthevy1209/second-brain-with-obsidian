# Use Binary search

- Sort portions
- Browse spells. With each spell
    - Use Binary search to find the last position (j) in the portion so that the product = spell * portions[j] < success.
    - So there will be `potions.length - j - 1` element >= success

> [!check] Complexity
> Complexity: m = spells.length, n = portions.length
> - Time complexity: O(nlogn + mlogn)
> - Space complexity: O(1)


```java
class Solution {  
    public int[] successfulPairs(int[] spells, int[] potions, long success) {  
        int[] result = new int[spells.length];  
        Arrays.sort(potions);  
  
        for (int i = 0; i < spells.length; i++) {  
            // find the last position (j) in portion so that  
            // spells[i] * portion[j] < success            
            int left = 0, right = potions.length - 1;  
            int j = -1;  
            while (left <= right) {  
                int mid = left + (right - left) / 2;  
                long product = (long) spells[i] * potions[mid];  
                if (product < success) {  
                    j = mid;  
                    left = mid + 1;  
                } else {  
                    right = mid - 1;  
                }  
            }  
  
            result[i] = potions.length - j - 1;  
        }  
  
        return result;  
    }  
}
```
