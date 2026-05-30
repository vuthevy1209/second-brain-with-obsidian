# Binary search

bản chất cách tiếp cận là khi mảng bị xoay thì cái nửa bên mà không tăng dần sẽ chứa min.
Ví dụ 3, 4, 5, 1, 2 => Thì nửa bên phải 5, 1, 2 là không tăng thì sẽ có min. Ta thu hẹp khoảng cách lại qua bên phải và lặp lại cho đến khi tìm ra.

> [!check] Complexity
> Time Complexity: O(logN)
> Space Complexity: O(1)

```java
class Solution {
    public int findMin(int[] nums) {
        int left = 0;
        int right = nums.length - 1;
        
        while (left < right) {
            int mid = left + (right - left) / 2;
            
            if (nums[mid] < nums[right]) {
                right = mid;           // mid có thể là min
            } else if (nums[mid] > nums[right]) {
                left = mid + 1;        // min chắc chắn bên phải mid
            }
        }
        
        return nums[left]; // left == right, đây là min
    }
}
```
