- Ý tưởng của bài này là chúng ta sẽ tính giá trị mid dựa trên left và right. Sau đó chúng ra kiểm tra nửa bên trái hoặc nửa bên phải, cái nào là nửa đăng đảm bảo thứ tự tăng dần và target nó nằm giữa 2 giá trị biên ta cập nhật left/right về khoảng đó. Nếu không thì làm điều tương tự với nửa còn lại.
- Lưu ý bài này là do các phần tử nó là khác nhau trong mảng nên ta hoàn toàn có thể kiểm tra xem nửa nào nó đang tăng dần dựa vào 2 cái đầu mút.

![[Solution-1780021319143.webp]]

> [!check] Complexity
> Time Complexity: O(logN)
> Space Complexity: O(1)

```java
class Solution {  
  
    public int search(int[] nums, int target) {  
        int left = 0;  
        int right = nums.length - 1;  
  
        while (left <= right) {  
            int mid = left + (right - left) / 2;  
            if (nums[mid] == target) return mid;  
  
            if (nums[left] < nums[mid]){  
                if (nums[left] <= target && target <= nums[mid]) {  
                    right = mid - 1;  
                } else {  
                    left = mid + 1;  
                }  
  
            } else {  
                if (nums[mid] <= target && target <= nums[right]) {  
                    left = mid + 1;  
                } else {  
                   right = mid - 1;  
                }  
            }  
        }  
  
        return -1;  
    }  
}
```
