# Brute force các cặp (i, j) trong window indexDiff

![[Solution-1780759721470.webp]]

> [!check] Complexity
> Time Complexity: 
> Space Complexity:

```java
class Solution {  
    public boolean containsNearbyAlmostDuplicate(int[] nums, int indexDiff, int valueDiff) {  
        if (indexDiff == 0) return false;  
  
        // first check  
        for (int i = 0; i <= indexDiff; i++) {  
            if (i >= nums.length) break;  
            for (int j = i + 1; j <= indexDiff; j++) {  
                if (j >= nums.length) break;  
                if (i != j && Math.abs(nums[i] - nums[j]) <= valueDiff)  
                    return true;  
            }  
        }  
  
        int lo = 1;  
        int hi = indexDiff + 1;  
        while (hi < nums.length) {  
            for (int i = lo; i <= hi - 1; i++) {  
                if (Math.abs(nums[i] - nums[hi]) <= valueDiff)  
                    return true;  
            }  
  
            hi++;  
            lo++;  
        }  
  
        return false;  
    }  
}
```

# Dùng HashSet để theo dõi window, giải trị tuyệt đối để xác định miền phạm vi các số thỏa mãn

![[Solution-1780761673353.webp]]

Vòng lặp `for (int j = low; j <= high; j++)` chạy **O(valueDiff)** lần — khi `valueDiff` lớn (tới 10⁹) thì TLE ngay.

> [!check] Complexity
> Time Complexity: O(n x valueDiff)
> Space Complexity: O(indexDiff)

```java
class Solution {  
    public boolean containsNearbyAlmostDuplicate(int[] nums, int indexDiff, int valueDiff) {  
        Set<Integer> set = new HashSet<>();  
  
        for (int i = 0; i < nums.length; i++) {  
            if (i > indexDiff) {  
                set.remove(nums[i - indexDiff - 1]);  
            }  
  
            int low = nums[i] - valueDiff;  
            int high = nums[i] + valueDiff;  
  
            for (int j = low; j <= high; j++) {  
                if (set.contains(j))  
                    return true;  
            }  
  
            set.add(nums[i]);  
        }  
  
        return false;  
    }  
}
```

# Dùng TreeSet thay cho HashSet để tận dụng các hàm tìm kiếm thay vì duyệt như bên trên

Thay `HashSet` bằng `TreeSet` để tận dụng các phương thức tìm kiếm nhị phân:

- **`floor(x)`** → phần tử lớn nhất ≤ x
- **`ceiling(x)`** → phần tử nhỏ nhất ≥ x

Thay vì duyệt từng giá trị trong `[nums[i] - valueDiff, nums[i] + valueDiff]`, chỉ cần hỏi TreeSet:

> _"Có phần tử nào trong window mà nằm trong khoảng đó không?"_

> [!check] Complexity
> Time Complexity: O(n x log(indexDiff))
> Space Complexity: O(indexDiff)

```java
class Solution {  
    public boolean containsNearbyAlmostDuplicate(int[] nums, int indexDiff, int valueDiff) {  
        TreeSet<Long> set = new TreeSet<>();  
  
        for (int i = 0; i < nums.length; i++) {  
            long val = (long) nums[i];  
  
            // Tìm phần tử nhỏ nhất >= val - valueDiff  
            Long candidate = set.ceiling(val - valueDiff);  
  
            // Nếu tồn tại và <= val + valueDiff → tìm thấy  
            if (candidate != null && candidate <= val + valueDiff)  
                return true;  
  
            set.add(val);  
  
            if (i > indexDiff)  
                set.remove((long) nums[i - indexDiff - 1]);  
        }  
  
        return false;  
    }  
}
```
