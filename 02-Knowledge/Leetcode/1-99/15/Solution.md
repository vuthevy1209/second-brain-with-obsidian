# Sort + Two pointer

> [!check] Complexity
> Time Complexity: O(NlogN + N^2) = O(N^2)
> - Một lần sort mất O(NlogN)
> - Duyệt qua mảng mất O(N), tại mỗi i có vòng lặp while, vòng lặp while dừng khi left chạm right => mà tại mỗi bước hoặc chỉ left hoặc chỉ right hoặc cả 2 cùng di chuyển, nên vòng while mất O(N). Tổng vào là O(N^2).
> 
> Space Complexity:
> - O(N^2) nếu tính output, còn không thì là O(1).
> - Nếu phân tích chặt thì O(Tổ hợp chập 3 của N) = O(N^3). Tuy nhiên vì đề bài có giới hạn là không lấy trùng nên nghiệm không vượt qua O(N^2)
> ![[Solution-1779026195888.webp]]
> 
> - Sau khi sort:
> 	- mỗi cặp `(i, left)` gần như xác định tối đa một `right`.
> 	- thuật toán two pointers cũng chỉ tìm được tối đa khoảng `O(n)` nghiệm cho mỗi `i`
> 	- Có `n` giá trị `i`: nên O(N) x O(N) = O(N^2)
 

```java
class Solution {  
    public List<List<Integer>> threeSum(int[] nums) {  
        Arrays.sort(nums);  
  
        Set<List<Integer>> set = new HashSet<>();  
  
        int length = nums.length;  
        for (int i = 0; i < length; i++) {  
            int num1 = nums[i];  
            int left = i + 1;  
            int right = length - 1;  
  
            while (left < right) {  
                int sum = num1 + nums[left] + nums[right];  
                if (sum < 0)  
                    left++;  
                else if (sum > 0)  
                    right--;  
                else {  
                    set.add(List.of(num1, nums[left], nums[right]));  
                    left++;  
                    right--;  
                }  
            }  
        }  
  
        return new ArrayList<>(set);  
    }  
}
```

# Sort + BinarySearch


> [!check] Complexity
> Time Complexity: O(NlogN + O(N^2 x logN)) = O(N^2 x logN)
> Space Complexity: O(N^2)

```java
class Solution {  
    public List<List<Integer>> threeSum(int[] nums) {  
        Arrays.sort(nums);  
        Set<List<Integer>> set = new HashSet<>();  
  
        for (int i = 0; i < nums.length; i++){  
            for (int j = i + 1; j < nums.length; j++){  
			    int k = Arrays.binarySearch(nums, j + 1, nums.length, -nums[i] - nums[j]);  
  
                // k >= 0 means found, otherwise k < 0 is not found  
                if (k >= 0 && i != j && j != k && i != k){  
                    set.add(List.of(nums[i], nums[j], nums[k]));  
                }  
            }  
        }  
  
        return new ArrayList<>(set);  
    }  
}
```
