# Binary search

- Tìm hàng cuối cùng mà có `matrix[row][0]` <= target
- Thì giá trị cần tìm nằm trong hàng row

> [!check] Complexity
> Time Complexity: O(logN)
> Space Complexity: O(1)

```java
class Solution {  
    public boolean searchMatrix(int[][] matrix, int target) {  
        int l = 0, r = matrix.length - 1;  
        int row = -1;  
        while (l <= r) {  
            int m = l + (r - l) / 2;  
  
            if (matrix[m][0] <= target) {  
                row = m;  
                l = m + 1;  
            }  
            else  
                r = m - 1;  
        }  
  
        if (row == -1) return false;  
  
        l = 0;  
        r = matrix[row].length - 1;  
        while (l <= r) {  
            int m = l + (r - l) / 2;  
  
            if (matrix[row][m] == target)  
                return true;  
            else if (matrix[row][m] > target)  
                r = m - 1;  
            else  
                l = m + 1;  
        }  
  
        return false;  
    }  
}
```
