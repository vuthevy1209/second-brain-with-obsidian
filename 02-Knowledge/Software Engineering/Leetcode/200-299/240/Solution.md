# Brute Force

> [!check] Complexity
> Time Complexity: O(mxn)
> Space Complexity: O(1)

```java
class Solution {  
    public boolean searchMatrix(int[][] matrix, int target) {  
        for (int i = 0; i < matrix.length; i++) {  
            for (int j = 0; j < matrix[i].length; j++) {  
                if (matrix[i][j] == target) return true;  
            }  
        }  
  
        return false;  
    }  
}
```


# Tìm đường đến dựa trên tính chất của đề bài

- Mỗi hàng được sắp xếp tăng dần từ trái sang phải
- Mỗi cột được sắp xếp tăng dần từ trên xuống dưới

Chọn góc **trên-phải** (hoặc **dưới-trái**) lại là điểm xuất phát lý tưởng.
Tại vì tại điểm này ta có thể đi theo 2 hướng (1 cái là tăng dần, một cái là giảm dần). Nếu chọn xuất phát từ 2 góc còn lại thì không tận dụng được tính chất này.

![[Solution-1780369525475.webp]]

> [!check] Complexity
> Time Complexity: O(m + n)
> Space Complexity: O(1)

```java
class Solution {  
    public boolean searchMatrix(int[][] matrix, int target) {  
        int m = matrix.length - 1;  
        int n = matrix[0].length - 1;  
        int row = 0;  
        int col = matrix[0].length - 1;  
  
        while (row >= 0 && row <= m && col >= 0 && col <= n) {  
            if (matrix[row][col] > target) {  
                col--;  
            } else if (matrix[row][col] < target) {  
                row++;  
            } else {  
                return true;  
            }  
        }  
  
        return false;  
    }  
}
```
