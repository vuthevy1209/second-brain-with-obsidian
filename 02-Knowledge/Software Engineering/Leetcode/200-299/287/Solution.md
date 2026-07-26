# Brute force

![[Solution-1780391306291.webp]]

> [!check] Complexity
> Time Complexity: O(n^2)
> Space Complexity: O(1)

```java
class Solution {  
    public int findDuplicate(int[] nums) {  
        for (int i = 0; i < nums.length; i++) {  
            int num = nums[i];  
            for (int j = i + 1; j < nums.length; j++) {  
                if (num == nums[j]) return num;  
            }  
        }  
  
        return -1;  
    }  
}
```

# Marking visited value within the array

Since all values of the array are between [1…n] and the array size is n+1, while scanning the array from left to right, we set the nums[n] to its negative value.

With extra O(1) space, with modifying the input.

> [!check] Complexity
> Time Complexity: 
> Space Complexity:

```java
class Solution {  
    public int findDuplicate(int[] nums) {  
        for (int i = 0; i < nums.length; i++) {  
            int idx = Math.abs(nums[i]);  
            if (nums[idx] < 0) return idx  
            nums[idx] = - nums[idx];  
  
        }  
          
        return -1;  
    }  
}
```

# Binary search

- Ta search trên miền giá trị là 1 -> n. Vì số lặp là một trong các số 1,2,3,..,n
- Tại mỗi bước ta pick ngẫu nhiên (ở đây ta chọn giá trị mid).
- Mô phỏng cho dễ hiểu: Mảng 5 phần tử [1,3,4,2,2], thì giá trị của mảng có thể là 1 -> 4. Số đang bị lặp cũng chỉ có thể là 1, 2, 3, 4.
	- Bước 1: Ta xét 2 liệu có là cái đang lặp, ta sẽ đếm có bao nhiêu giá trị trong mảng input mà nhỏ hơn hoặc bằng 2. Thì ta thấy có 3 giá trị thỏa mãn (1, 2, 2). Theo lý thuyết thì chỉ có 2 số thỏa là 1 và 2 vì mảng chỉ nhận giá trị từ 1 -> n. Nhưng tại sao ta lại đếm ra 3 => có nghĩa là số đang lặp chỉ có thể là 1 -> 2.
	- Bước 2: Thu khoảng tìm kiểm về 1->2 và lặp lại logic.

> [!check] Complexity
> Time Complexity: O(nlogn)
> Space Complexity: O(1)

```java
public static int findDuplicate_bs(int[] nums) {  
    int len = nums.length;  
    int low = 1;  
    int high = len - 1;  
    while (low < high) {  
        int mid = low + (high - low) / 2;  
        int cnt = 0;  
        for (int i = 0; i < len; i++) {  
            if (nums[i] <= mid) {  
                cnt++;  
            }  
        }  
  
        if (cnt <= mid) {  
            low = mid + 1;  
        } else {  
            high = mid;  
        }  
    }  
  
    return low;  
}
```
