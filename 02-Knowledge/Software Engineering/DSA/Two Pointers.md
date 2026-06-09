---
title: Two Pointers
summary: Kỹ thuật Two Pointers — các biến thể Opposite Ends, Fast/Slow, Parallel, cùng template và bài tập đặc thù.
tags:
  - dsa
  - two-pointers
  - algorithm
  - array
  - string
created: 2026-06-09
---

## 1. Core Idea

Two Pointers là kỹ thuật dùng **hai biến con trỏ** (pointer) để duyệt mảng hoặc chuỗi. Thay vì dùng hai vòng lặp lồng nhau $O(n^2)$, ta di chuyển hai pointer theo quy tắc nhất định để đạt $O(n)$.

**Ý tưởng cốt lõi**: Khai thác tính chất **đã được sắp xếp** hoặc **cấu trúc đối xứng** của dữ liệu để loại bỏ các trường hợp không cần xét, từ đó thu hẹp không gian tìm kiếm về $O(n)$ thay vì $O(n^2)$.

```
Mảng:  [1, 2, 3, 4, 5, 6, 7, 8, 9]
        L                       R     ← Hai đầu, hội tụ vào giữa

Mảng:  [1, 2, 3, 4, 5, 6, 7, 8, 9]
        S                             ← Slow pointer
           F                          ← Fast pointer tiến nhanh hơn
```

**Điều kiện áp dụng Two Pointers:**
- Mảng / chuỗi đã **được sắp xếp** (Opposite Ends), hoặc
- Cần tìm **cặp / bộ phần tử** thoả điều kiện (sum, difference, …), hoặc
- Cần xử lý **in-place** trên mảng (xoá phần tử, partition, …), hoặc
- Cần phát hiện **cycle** hoặc tìm điểm giữa (Fast/Slow).

**Không dùng Two Pointers khi:**
- Mảng không có cấu trúc khai thác được (dùng HashMap để $O(n)$ thay thế).
- Cần tìm subarray/substring **liên tiếp** với điều kiện phức tạp (dùng [[Sliding window]]).

---

## 2. Các Biến Thể Chính

### 2.1 Opposite Ends — Hai Đầu Hội Tụ

Hai pointer xuất phát từ **hai đầu** của mảng đã sắp xếp và **tiến vào giữa** cho đến khi gặp nhau.

**Điều kiện áp dụng**: Mảng **đã sắp xếp**. Khi tổng/tích/điều kiện quá lớn → giảm `right`; quá nhỏ → tăng `left`.

**Template:**

```java
// Tìm cặp (nums[left], nums[right]) thoả điều kiện trong mảng đã sort
void oppositeEnds(int[] nums) {
    int left = 0, right = nums.length - 1;

    while (left < right) {
        int current = nums[left] + nums[right]; // hoặc điều kiện khác

        if (current == target) {
            // Xử lý kết quả
            left++;
            right--;
        } else if (current < target) {
            left++;   // Cần tăng tổng → tăng left
        } else {
            right--;  // Cần giảm tổng → giảm right
        }
    }
}
```

**Trace ví dụ** — `nums = [-2, 1, 2, 4, 7, 11]`, tìm cặp có tổng = 9:

```
left=0(-2), right=5(11): sum=9  → Tìm thấy! (-2, 11)
left=1(1),  right=4(7):  sum=8  → quá nhỏ, left++
left=2(2),  right=4(7):  sum=9  → Tìm thấy! (2, 7)
left=3(4),  right=3(4):  left >= right → dừng
```

---

### 2.2 Fast / Slow — Hai Tốc Độ

Hai pointer cùng xuất phát từ **đầu** mảng, nhưng di chuyển với **tốc độ khác nhau** hoặc theo **điều kiện khác nhau**.

Dùng để:
- **Xử lý in-place**: `slow` đánh dấu vị trí ghi, `fast` duyệt qua phần tử.
- **Phát hiện cycle** trong linked list (Floyd's Tortoise and Hare).
- **Tìm điểm giữa** của linked list.

**Template — In-place remove/partition:**

```java
// Xoá tất cả phần tử bằng val, trả về độ dài mảng mới
int removeElement(int[] nums, int val) {
    int slow = 0; // slow = vị trí tiếp theo sẽ ghi

    for (int fast = 0; fast < nums.length; fast++) {
        if (nums[fast] != val) {
            nums[slow] = nums[fast]; // Ghi phần tử hợp lệ vào vị trí slow
            slow++;
        }
        // Nếu nums[fast] == val → bỏ qua, fast tiến còn slow đứng yên
    }
    return slow; // Mảng hợp lệ: nums[0..slow-1]
}
// nums=[3,2,2,3], val=3 → nums=[2,2,_,_], return 2
```

**Template — Cycle detection (Floyd's Algorithm):**

```java
boolean hasCycle(ListNode head) {
    ListNode slow = head, fast = head;

    while (fast != null && fast.next != null) {
        slow = slow.next;       // Đi 1 bước
        fast = fast.next.next;  // Đi 2 bước

        if (slow == fast) return true; // Gặp nhau → có cycle
    }
    return false;
}
```

---

### 2.3 Parallel / Same Direction — Cùng Chiều

Hai (hoặc nhiều) pointer cùng di chuyển **từ trái sang phải** nhưng trên **hai mảng/chuỗi khác nhau**, hoặc cùng mảng với logic riêng.

Dùng để **merge hai mảng đã sort**, so sánh chuỗi, hoặc bài toán interval.

**Template — Merge hai mảng đã sort:**

```java
// Merge nums1 (có m phần tử hợp lệ) và nums2 (n phần tử) vào nums1
void merge(int[] nums1, int m, int[] nums2, int n) {
    int p1 = m - 1, p2 = n - 1, p = m + n - 1; // Điền từ cuối về đầu

    while (p1 >= 0 && p2 >= 0) {
        if (nums1[p1] > nums2[p2]) {
            nums1[p] = nums1[p1];
            p1--;
        } else {
            nums1[p] = nums2[p2];
            p2--;
        }
        p--;
    }

    // Nếu còn phần tử trong nums2 chưa copy
    while (p2 >= 0) {
        nums1[p--] = nums2[p2--];
    }
}
// nums1=[1,2,3,0,0,0], m=3, nums2=[2,5,6], n=3
// → nums1=[1,2,2,3,5,6]
```

---

## 3. So Sánh Các Biến Thể

| Biến thể | Xuất phát | Chiều di chuyển | Điều kiện dừng | Ứng dụng điển hình |
|---|---|---|---|---|
| **Opposite Ends** | Hai đầu | Hội tụ vào giữa | `left >= right` | Two Sum (sorted), Palindrome, Container With Most Water |
| **Fast / Slow** | Cùng đầu | Cùng chiều, tốc độ khác | `fast` ra khỏi mảng | Remove duplicates, Cycle detection, Middle of linked list |
| **Parallel** | Đầu hai mảng | Cùng chiều | Hết một trong hai | Merge sorted arrays, Intersection, Compare strings |

---

## 4. Các Dạng Bài Đặc Thù

### 4.1 Two Sum II — Input Array Is Sorted

**Bài toán** (LeetCode 167): Cho mảng đã sắp xếp `numbers`. Tìm hai chỉ số `[i, j]` (1-indexed) sao cho `numbers[i] + numbers[j] == target`.

```java
int[] twoSum(int[] numbers, int target) {
    int left = 0, right = numbers.length - 1;

    while (left < right) {
        int sum = numbers[left] + numbers[right];

        if (sum == target) return new int[]{left + 1, right + 1};
        else if (sum < target) left++;
        else right--;
    }
    return new int[]{-1, -1}; // không tìm thấy (đề đảm bảo luôn có đáp án)
}
// numbers=[2,7,11,15], target=9 → [1,2]
// numbers=[2,3,4],    target=6 → [1,3]
```

**Độ phức tạp**: $O(n)$ thời gian, $O(1)$ không gian.

**Tại sao đúng?** Mỗi lần, ta chỉ di chuyển một pointer → không bỏ sót đáp án vì:
- Nếu `sum < target`: mọi cặp `(left, j)` với `j < right` đều có `sum` nhỏ hơn → `left` không thể là đáp án với bất kỳ `j` nào nhỏ hơn `right` → an toàn tăng `left`.
- Tương tự cho `sum > target`.

---

### 4.2 Three Sum

**Bài toán** (LeetCode 15): Cho mảng `nums`. Tìm tất cả bộ ba `[a, b, c]` sao cho `a + b + c == 0`. Kết quả không được có bộ ba trùng lặp.

**Ý tưởng**: Sort mảng. Với mỗi phần tử `nums[i]`, dùng Two Pointers tìm cặp `(left, right)` trong phần còn lại sao cho `nums[left] + nums[right] == -nums[i]`.

```java
List<List<Integer>> threeSum(int[] nums) {
    Arrays.sort(nums);
    List<List<Integer>> result = new ArrayList<>();

    for (int i = 0; i < nums.length - 2; i++) {
        // Bỏ qua trùng lặp cho i
        if (i > 0 && nums[i] == nums[i - 1]) continue;
        // Tối ưu: nếu phần tử nhỏ nhất > 0, không thể có tổng = 0
        if (nums[i] > 0) break;

        int left = i + 1, right = nums.length - 1;
        int target = -nums[i];

        while (left < right) {
            int sum = nums[left] + nums[right];

            if (sum == target) {
                result.add(Arrays.asList(nums[i], nums[left], nums[right]));
                // Bỏ qua trùng lặp cho left và right
                while (left < right && nums[left] == nums[left + 1]) left++;
                while (left < right && nums[right] == nums[right - 1]) right--;
                left++;
                right--;
            } else if (sum < target) {
                left++;
            } else {
                right--;
            }
        }
    }
    return result;
}
// nums=[-1,0,1,2,-1,-4] → [[-1,-1,2],[-1,0,1]]
// nums=[0,0,0,0]        → [[0,0,0]]
```

**Trace** — `nums = [-4, -1, -1, 0, 1, 2]`:

```
i=0 (-4): left=1(-1), right=5(2): sum=1 > -4, right--
          left=1(-1), right=4(1): sum=0 > -4, right--
          left=1(-1), right=3(0): sum=-1 > -4, right--
          left=1(-1), right=2(-1): sum=-2 == -(-4)? No, -2 > -4, right--
          left=1 >= right=1 → dừng

i=1 (-1): left=2(-1), right=5(2): sum=1 == 1 ✓ → [-1,-1,2]
          skip dup: left=3, right=4
          left=3(0), right=4(1): sum=1 == 1 ✓ → [-1,0,1]
          left=4 >= right=4 → dừng

i=2: nums[2]==nums[1] → skip
...
```

**Độ phức tạp**: $O(n^2)$ thời gian, $O(1)$ không gian phụ (ngoài output).

---

### 4.3 Container With Most Water

**Bài toán** (LeetCode 11): Cho mảng `height`. Tìm hai đường thẳng tạo thành container chứa được nhiều nước nhất.

**Ý tưởng**: Diện tích = `min(height[left], height[right]) * (right - left)`. Pointer ở cạnh **thấp hơn** di chuyển vào giữa (vì giữ cạnh thấp không bao giờ tăng được diện tích).

```java
int maxArea(int[] height) {
    int left = 0, right = height.length - 1;
    int maxWater = 0;

    while (left < right) {
        int water = Math.min(height[left], height[right]) * (right - left);
        maxWater = Math.max(maxWater, water);

        // Di chuyển pointer ở cạnh thấp hơn
        if (height[left] < height[right]) left++;
        else right--;
    }
    return maxWater;
}
// height=[1,8,6,2,5,4,8,3,7] → 49  (left=1(8), right=8(7): min=7, width=7)
```

**Trace** — `height = [1, 8, 6, 2, 5, 4, 8, 3, 7]`:

```
left=0(1),  right=8(7): water=min(1,7)*8=8,  max=8,  1<7 → left++
left=1(8),  right=8(7): water=min(8,7)*7=49, max=49, 8>7 → right--
left=1(8),  right=7(3): water=min(8,3)*6=18, max=49, 8>3 → right--
left=1(8),  right=6(8): water=min(8,8)*5=40, max=49, 8==8 → right--
...
```

**Tại sao di chuyển pointer thấp hơn là đúng?** Nếu ta di chuyển pointer cao hơn, chiều rộng giảm, còn chiều cao bị giới hạn bởi cạnh thấp hơn → diện tích chỉ có thể bằng hoặc nhỏ hơn. Di chuyển cạnh thấp hơn còn có cơ hội tìm cạnh cao hơn để bù đắp.

---

### 4.4 Valid Palindrome

**Bài toán** (LeetCode 125): Kiểm tra chuỗi `s` có phải là palindrome sau khi loại bỏ ký tự không phải chữ/số và chuyển thành chữ thường không.

```java
boolean isPalindrome(String s) {
    int left = 0, right = s.length() - 1;

    while (left < right) {
        // Bỏ qua ký tự không hợp lệ
        while (left < right && !Character.isLetterOrDigit(s.charAt(left)))  left++;
        while (left < right && !Character.isLetterOrDigit(s.charAt(right))) right--;

        if (Character.toLowerCase(s.charAt(left)) != Character.toLowerCase(s.charAt(right)))
            return false;

        left++;
        right--;
    }
    return true;
}
// s="A man, a plan, a canal: Panama" → true
// s="race a car"                    → false
```

**Độ phức tạp**: $O(n)$ thời gian, $O(1)$ không gian.

---

### 4.5 Remove Duplicates from Sorted Array

**Bài toán** (LeetCode 26): Cho mảng đã sắp xếp `nums`. Xoá phần tử trùng lặp **in-place**, trả về số lượng phần tử không trùng.

```java
int removeDuplicates(int[] nums) {
    int slow = 1; // slow bắt đầu từ 1, vị trí sẽ ghi phần tử tiếp theo

    for (int fast = 1; fast < nums.length; fast++) {
        // Chỉ ghi khi fast khác phần tử trước nó (tức là unique)
        if (nums[fast] != nums[fast - 1]) {
            nums[slow] = nums[fast];
            slow++;
        }
    }
    return slow;
}
// nums=[1,1,2]       → return 2, nums=[1,2,_]
// nums=[0,0,1,1,1,2,2,3,3,4] → return 5, nums=[0,1,2,3,4,_,_,_,_,_]
```

**Mở rộng — Cho phép tối đa 2 lần lặp** (LeetCode 80):

```java
int removeDuplicatesII(int[] nums) {
    int slow = 2; // Hai phần tử đầu luôn hợp lệ

    for (int fast = 2; fast < nums.length; fast++) {
        // Hợp lệ khi khác phần tử ở vị trí slow-2 (giữ tối đa 2)
        if (nums[fast] != nums[slow - 2]) {
            nums[slow] = nums[fast];
            slow++;
        }
    }
    return slow;
}
// nums=[1,1,1,2,2,3] → return 5, nums=[1,1,2,2,3,_]
```

---

### 4.6 Sort Colors — Dutch National Flag

**Bài toán** (LeetCode 75): Sắp xếp mảng chỉ gồm `0`, `1`, `2` **in-place** trong một lần duyệt.

**Ý tưởng** (Dutch National Flag — Dijkstra): Dùng 3 pointer `low`, `mid`, `high`.

```
[0..low-1]  : vùng đã xác nhận là 0
[low..mid-1]: vùng đã xác nhận là 1
[mid..high] : vùng chưa xử lý
[high+1..n-1]: vùng đã xác nhận là 2
```

```java
void sortColors(int[] nums) {
    int low = 0, mid = 0, high = nums.length - 1;

    while (mid <= high) {
        if (nums[mid] == 0) {
            // Swap với low, cả low và mid tiến lên
            swap(nums, low++, mid++);
        } else if (nums[mid] == 1) {
            mid++; // 1 đúng chỗ rồi
        } else { // nums[mid] == 2
            // Swap với high, high lùi, mid KHÔNG tiến (phần tử mới chưa xét)
            swap(nums, mid, high--);
        }
    }
}

void swap(int[] nums, int i, int j) {
    int tmp = nums[i]; nums[i] = nums[j]; nums[j] = tmp;
}
// nums=[2,0,2,1,1,0] → [0,0,1,1,2,2]
```

**Trace** — `nums = [2, 0, 2, 1, 1, 0]`:

```
low=0, mid=0, high=5: nums[0]=2 → swap(0,5) → [0,0,2,1,1,2], high=4
low=0, mid=0, high=4: nums[0]=0 → swap(0,0) → [0,0,2,1,1,2], low=1, mid=1
low=1, mid=1, high=4: nums[1]=0 → swap(1,1) → [0,0,2,1,1,2], low=2, mid=2
low=2, mid=2, high=4: nums[2]=2 → swap(2,4) → [0,0,1,1,2,2], high=3
low=2, mid=2, high=3: nums[2]=1 → mid=3
low=2, mid=3, high=3: nums[3]=1 → mid=4
mid=4 > high=3 → dừng → [0,0,1,1,2,2] ✓
```

**Độ phức tạp**: $O(n)$ thời gian, $O(1)$ không gian — một lần duyệt duy nhất.

---

### 4.7 Trapping Rain Water

**Bài toán** (LeetCode 42): Cho mảng `height` biểu diễn độ cao của các cột. Tính lượng nước tích được sau mưa.

**Ý tưởng**: Lượng nước tại vị trí `i` = `min(maxLeft[i], maxRight[i]) - height[i]`. Dùng Two Pointers để tránh tạo mảng phụ $O(n)$.

```java
int trap(int[] height) {
    int left = 0, right = height.length - 1;
    int maxLeft = 0, maxRight = 0;
    int water = 0;

    while (left < right) {
        if (height[left] <= height[right]) {
            // maxLeft quyết định lượng nước tại left
            if (height[left] >= maxLeft) maxLeft = height[left];
            else water += maxLeft - height[left];
            left++;
        } else {
            // maxRight quyết định lượng nước tại right
            if (height[right] >= maxRight) maxRight = height[right];
            else water += maxRight - height[right];
            right--;
        }
    }
    return water;
}
// height=[0,1,0,2,1,0,1,3,2,1,2,1] → 6
// height=[4,2,0,3,2,5]             → 9
```

**Trace** — `height = [4, 2, 0, 3, 2, 5]`:

```
left=0(4),  right=5(5): 4<=5, maxLeft=4, 4>=4 → maxLeft=4, left++
left=1(2),  right=5(5): 2<=5, maxLeft=4, 2<4  → water+=4-2=2, left++
left=2(0),  right=5(5): 0<=5, maxLeft=4, 0<4  → water+=4-0=4, left++
left=3(3),  right=5(5): 3<=5, maxLeft=4, 3<4  → water+=4-3=1, left++
left=4(2),  right=5(5): 2<=5, maxLeft=4, 2<4  → water+=4-2=2, left++
left=5 == right=5 → dừng
Total water = 2+4+1+2 = 9 ✓
```

**Độ phức tạp**: $O(n)$ thời gian, $O(1)$ không gian.

**Tại sao xử lý phía `left` khi `height[left] <= height[right]`?** Vì khi đó, `maxRight` hiện tại đã đủ cao để xác định lượng nước tại `left` (bên phải chắc chắn có tường cao hơn hoặc bằng `height[left]`). Giá trị giới hạn nước chính là `maxLeft`.

---

### 4.8 Move Zeroes

**Bài toán** (LeetCode 283): Di chuyển tất cả số `0` về cuối mảng, giữ nguyên thứ tự phần tử khác, in-place.

```java
void moveZeroes(int[] nums) {
    int slow = 0; // slow = vị trí tiếp theo để đặt phần tử != 0

    for (int fast = 0; fast < nums.length; fast++) {
        if (nums[fast] != 0) {
            nums[slow] = nums[fast];
            slow++;
        }
    }

    // Điền 0 từ slow đến cuối
    while (slow < nums.length) {
        nums[slow++] = 0;
    }
}
// nums=[0,1,0,3,12] → [1,3,12,0,0]
// nums=[0,0,1]      → [1,0,0]
```

**Biến thể swap** (ít lần ghi hơn):

```java
void moveZeroesSwap(int[] nums) {
    int slow = 0;

    for (int fast = 0; fast < nums.length; fast++) {
        if (nums[fast] != 0) {
            // Swap chỉ khi cần thiết
            int tmp = nums[slow];
            nums[slow] = nums[fast];
            nums[fast] = tmp;
            slow++;
        }
    }
}
```

---

### 4.9 Squares of a Sorted Array

**Bài toán** (LeetCode 977): Cho mảng đã sắp xếp `nums` (có thể âm). Trả về mảng bình phương sắp xếp tăng dần.

**Ý tưởng**: Bình phương lớn nhất chỉ có thể ở hai đầu. Dùng Two Pointers điền từ **cuối** mảng kết quả về đầu.

```java
int[] sortedSquares(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];
    int left = 0, right = n - 1;
    int pos = n - 1; // Điền từ cuối về đầu

    while (left <= right) {
        int lSq = nums[left] * nums[left];
        int rSq = nums[right] * nums[right];

        if (lSq > rSq) {
            result[pos--] = lSq;
            left++;
        } else {
            result[pos--] = rSq;
            right--;
        }
    }
    return result;
}
// nums=[-4,-1,0,3,10] → [0,1,9,16,100]
// nums=[-7,-3,2,3,11] → [4,9,9,49,121]
```

**Trace** — `nums = [-4, -1, 0, 3, 10]`:

```
left=0(-4), right=4(10): lSq=16, rSq=100 → result[4]=100, right--
left=0(-4), right=3(3):  lSq=16, rSq=9  → result[3]=16,  left++
left=1(-1), right=3(3):  lSq=1,  rSq=9  → result[2]=9,   right--
left=1(-1), right=2(0):  lSq=1,  rSq=0  → result[1]=1,   left++
left=2(0),  right=2(0):  lSq=0,  rSq=0  → result[0]=0,   right--
left=2 > right=1 → dừng
result=[0,1,9,16,100] ✓
```

---

### 4.10 Four Sum

**Bài toán** (LeetCode 18): Tìm tất cả bộ bốn `[a, b, c, d]` sao cho `a + b + c + d == target`.

**Ý tưởng**: Mở rộng Three Sum — cố định hai vòng ngoài `i, j`, dùng Two Pointers cho phần còn lại.

```java
List<List<Integer>> fourSum(int[] nums, int target) {
    Arrays.sort(nums);
    List<List<Integer>> result = new ArrayList<>();
    int n = nums.length;

    for (int i = 0; i < n - 3; i++) {
        if (i > 0 && nums[i] == nums[i - 1]) continue; // skip dup i

        for (int j = i + 1; j < n - 2; j++) {
            if (j > i + 1 && nums[j] == nums[j - 1]) continue; // skip dup j

            int left = j + 1, right = n - 1;
            long need = (long) target - nums[i] - nums[j];

            while (left < right) {
                int sum = nums[left] + nums[right];

                if (sum == need) {
                    result.add(Arrays.asList(nums[i], nums[j], nums[left], nums[right]));
                    while (left < right && nums[left] == nums[left + 1]) left++;
                    while (left < right && nums[right] == nums[right - 1]) right--;
                    left++; right--;
                } else if (sum < need) left++;
                else right--;
            }
        }
    }
    return result;
}
// nums=[1,0,-1,0,-2,2], target=0 → [[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]
```

**Độ phức tạp**: $O(n^3)$ thời gian, $O(1)$ không gian phụ.

---

## 5. Two Pointers vs Sliding Window

Hai kỹ thuật này có liên hệ chặt chẽ — đều dùng `left` và `right`. Sự khác biệt là:

| Tiêu chí | Two Pointers | Sliding Window |
|---|---|---|
| **Cấu trúc** | Không nhất thiết là window liên tục | Luôn là window liên tục `[left..right]` |
| **Dữ liệu** | Thường cần mảng đã sort | Không cần sort |
| **Mục tiêu** | Tìm cặp/bộ phần tử thoả điều kiện | Tìm subarray/substring tối ưu |
| **Tốc độ di chuyển** | Có thể khác nhau (Fast/Slow) | Thường `right` tăng đều, `left` tăng khi vi phạm |
| **In-place** | Thường xuyên dùng in-place | Ít dùng in-place hơn |

> 💡 **Sliding Window là trường hợp đặc biệt của Two Pointers** — cụ thể là dạng Fast/Slow mà `right` luôn ≥ `left`, và ta quan tâm đến **toàn bộ nội dung** trong window.

---

## 6. Checklist & Nhận Dạng Bài Toán

### Dấu hiệu nhận biết

- Đề bài yêu cầu tìm **cặp / bộ phần tử** thoả điều kiện (sum, product, …)
- Mảng đầu vào **đã sắp xếp** và yêu cầu $O(n)$ hoặc $O(1)$ extra space
- Yêu cầu xử lý **in-place**: xoá phần tử, sắp xếp một phần, partition
- Bài toán liên quan đến **palindrome** (kiểm tra hoặc tìm)
- Bài toán **cycle detection** hoặc tìm **điểm giữa** trên linked list
- Từ khoá: **"in-place", "sorted", "pair", "two numbers", "k-sum"**

### Quy trình tư duy

```
1. Mảng đã sort?
   ├── Có → Thử Opposite Ends: left=0, right=n-1
   └── Không → Có thể sort trước? (nếu không cần preserve index)

2. Cần xử lý in-place?
   └── Dùng Fast/Slow: slow ghi, fast duyệt

3. Hai mảng riêng biệt?
   └── Dùng Parallel: hai pointer độc lập

4. Subarray liên tiếp với điều kiện?
   └── Dùng Sliding Window thay thế (xem [[Sliding window]])
```

### Bảng bài tập theo dạng

| Dạng | Bài tập | Độ khó |
|---|---|---|
| **Opposite Ends** | Two Sum II (167), 3Sum (15), 4Sum (18), Container With Most Water (11) | Medium |
| **Palindrome** | Valid Palindrome (125), Palindrome II (680) | Easy–Medium |
| **Fast/Slow (Array)** | Remove Element (27), Remove Duplicates (26, 80), Move Zeroes (283) | Easy |
| **Fast/Slow (Linked List)** | Linked List Cycle (141), Middle of Linked List (876), Find Duplicate (287) | Easy–Medium |
| **Partition** | Sort Colors (75), Partition Array (LeetCode generic) | Medium |
| **Water/Height** | Trapping Rain Water (42), Container With Most Water (11) | Hard–Medium |
| **K-Sum** | 3Sum Closest (16), 4Sum (18) | Medium |
