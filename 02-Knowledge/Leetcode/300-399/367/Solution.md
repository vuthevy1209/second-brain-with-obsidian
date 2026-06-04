# Math.sqrt()

- `Math.sqrt(num)` tính căn bậc hai của một số.
- Trong phân tích thuật toán thông thường, các phép toán số học cơ bản (`+`, `-`, `*`, `/`, `sqrt`) được coi là thực hiện trong thời gian hằng số.

> [!check] Complexity
> Time Complexity: O(1)
> Space Complexity: O(1)

```java
class Solution {  
    public boolean isPerfectSquare(int num) {  
        return (int) Math.sqrt(num) * (int) Math.sqrt(num) == num;  
    }  
}
```

# Binary Search

> [!check] Complexity
> Time Complexity: O(log n)
> Space Complexity: O(1)

```java
class Solution {  
    public boolean isPerfectSquare(int num) {  
        int left = 0;  
        int right = num / 2 + 1;  
  
        while (left <= right) {  
            int mid = left + (right - left) / 2;  
  
            long product = (long) mid * mid;  
            if (product == num) return true;  
            else if (product < num) {  
                left = mid + 1;  
            } else {  
                right = mid - 1;  
            }  
        }  
  
        return false;  
    }  
}
```
