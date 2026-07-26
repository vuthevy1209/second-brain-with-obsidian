Cái khó của bài này so với bài [[02-Knowledge/Software Engineering/Leetcode/1-99/33/Search in Rotated Sorted Array|Search in Rotated Sorted Array]] là chúng ta chẳng thể biết được khi đứng tại mid thì nửa bên trái hay nửa bên phải là đang tăng dần. Vì đề bài không có điều kiện các phần tử trong mảng không là duy nhất.

![[Solution-1780022272404.webp]]

Ý tưởng thì vẫn sẽ làm như cũ thôi. Chúng ta cứ check bên phải, nếu nó là tăng dần và target nằm ở khoảng đó thì ta thu hẹp vào vùng này. Nếu không thì thu về bên trái.

Nhưng trường hợp xấu là mid và right mà bằng nhau thì ta không thể xác định rằng nửa bên phải có là tăng dần hay không. Vì thế chỉ cần thu right-- là được. Vậy xấu nhất là O(n)

> [!check] Complexity
> Time Complexity: O(logN), Khi không có phần tử trùng nhau, binary search hoạt động bình thường, mỗi bước loại một nửa mảng.
> - Trường hợp xấu nhất: O(n), ums = [1, 1, 1, 1, 1, 1, 3, 1], target = 3. Khi `nums[m] == nums[r]`, code chỉ làm được `r--` vì không thể xác định nửa nào đã sorted. Điều này dẫn đến duyệt tuần tự trong worst case.
>
> Space Complexity: O(1)

```java
class Solution {  
    public boolean search(int[] nums, int target) {  
        int l = 0;  
        int r = nums.length - 1;  
  
        while (l <= r) {  
            int m = l + (r - l) / 2;  
            if (nums[m] == target) return true;  
  
  
            // the right part is sorted non-decreasing  
            if (nums[m] < nums[r]) {  
                if (nums[m] < target && target <= nums[r]) {  
                    l = m + 1;  
                } else {  
                    r = m - 1;  
                }  
            }  
            // the left part is sorted non-decreasing  
            else if (nums[m] > nums[r]){  
                if (nums[l] <= target && target < nums[m]) {  
                    r = m - 1;  
                } else {  
                    l = m + 1;  
                }  
            } else {  
                r--;  
            }  
        }  
  
        return false;  
    }  
}
```
