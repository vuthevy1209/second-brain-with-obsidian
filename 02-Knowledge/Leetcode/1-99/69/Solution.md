# Binary Search

> [!check] Complexity
> Time Complexity: O(logN)
> Space Complexity: O(1)

```java
class Solution {  
    public int mySqrt(int x) {  
        if (x == 1) return 1;  
  
        int left = 0;  
        int right = x;  
  
        while (right - left > 1) {  
            int mid = left + (right - left) / 2;  
  
            long product = (long) mid * mid;  
            if (product == x) return mid;  
            else if (product > x) {  
                right = mid;  
            } else {  
                left = mid;  
            }  
        }  
  
        return left;  
    }  
}
```
