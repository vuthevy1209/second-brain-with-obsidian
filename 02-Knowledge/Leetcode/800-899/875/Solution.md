Use Binary Search to find k in [1, max(piles)].
For each k, try to see if at a rate of **k fruit/hour**, koko can eat all the bananas in h hours.
- If it can, try with smaller k
- If not, try with larger k

> [!check] Complexity
> Time Complexity: O(n + n log(max(piles)))
> Space Complexity: O(1)

``` java
class Solution {  
    public int minEatingSpeed(int[] piles, int h) {  
        int left = 1;  
        int right = piles[0];  
        for (int pile : piles) {  
            right = Math.max(right, pile);  
        }  
  
        while (left < right) {  
            int k = left + (right - left) / 2;  
            boolean canFinish = canFinish(piles, h, k);  
            if (canFinish) {  
                right = k; // Try with smaller k  
            } else {  
                left = k + 1; // Try with larger k  
            }  
        }  
  
        return left;  
    }  
  
    boolean canFinish(int[] piles, int h, int k) {  
        int totalHours = 0;  
        for (int i = 0; i < piles.length; i++) {  
            totalHours += (int) Math.ceil((double) piles[i] / k);  
        }  
  
        if (totalHours <= h)  
            return true;  
  
        return false;  
    }  
}
```
