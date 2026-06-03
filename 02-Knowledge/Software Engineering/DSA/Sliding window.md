---
title: Sliding Window
summary: Sliding window technique — fixed and variable window patterns, with detailed problem types and implementation templates.
tags:
  - dsa
  - sliding-window
  - algorithm
  - two-pointers
created: 2026-05-31
---

## 1. Core Idea

Sliding Window là kỹ thuật dùng để xử lý **các bài toán liên quan đến subarray hoặc substring liên tiếp** trong một mảng hay chuỗi. Thay vì duyệt tất cả các cặp `(i, j)` — tức là $O(n^2)$ — ta duy trì một **cửa sổ** `[left, right]` và **trượt** nó qua mảng, đạt $O(n)$.

**Ý tưởng cốt lõi**: Khi ta mở rộng cửa sổ sang phải bằng cách tăng `right`, ta chỉ cần *thêm* phần tử mới vào trạng thái. Khi cửa sổ vi phạm điều kiện, ta *thu hẹp* từ trái bằng cách tăng `left` — không cần tính lại từ đầu.

```
Mảng:  [a, b, c, d, e, f, g]
        L--------R             ← Cửa sổ bắt đầu
           L--------R          ← Trượt sang phải
              L--------R       ← Trượt tiếp
```

![[Sliding window-1780216651547.webp]]

**Điều kiện áp dụng Sliding Window:**
- Bài toán liên quan đến **subarray / substring liên tiếp** (contiguous).
- Có thể mô tả điều kiện hợp lệ của cửa sổ bằng một hàm **monotonic**: khi cửa sổ mở rộng và vi phạm điều kiện, thu hẹp từ trái sẽ cải thiện tình hình.
- Cần tìm **min / max / count / exists** của một window thoả mãn điều kiện nào đó.

**Không dùng Sliding Window khi:**
- Subarray không nhất thiết phải liên tiếp (dùng DP).
- Điều kiện không monotonic (thu hẹp window không đảm bảo cải thiện).

## 2. Hai Dạng Chính

### 2.1 Fixed-Size Window — Cửa sổ kích thước cố định

Kích thước cửa sổ `k` được cho trước. Ta trượt cửa sổ từ trái sang phải, mỗi bước thêm một phần tử mới và bỏ phần tử cũ nhất.

**Template:**

```java
// Tìm max/min/sum của subarray có độ dài đúng bằng k
int fixedWindow(int[] nums, int k) {
    int n = nums.length;
    int windowSum = 0, result = Integer.MIN_VALUE;

    for (int right = 0; right < n; right++) {
        windowSum += nums[right];           // Mở rộng: thêm phần tử mới

        if (right >= k) {
            windowSum -= nums[right - k];   // Thu hẹp: loại phần tử ngoài cửa sổ
        }

        if (right >= k - 1) {               // Cửa sổ đủ kích thước k
            result = Math.max(result, windowSum);
        }
    }
    return result;
}
```

**Trace ví dụ** — `nums = [2, 1, 5, 1, 3, 2]`, `k = 3`:

```
right=0: sum=2,  window=[2]         (chưa đủ k)
right=1: sum=3,  window=[2,1]       (chưa đủ k)
right=2: sum=8,  window=[2,1,5]     → result=8
right=3: sum=7,  window=[1,5,1]     → result=8
right=4: sum=9,  window=[5,1,3]     → result=9
right=5: sum=6,  window=[1,3,2]     → result=9
```

### 2.2 Variable-Size Window — Cửa sổ kích thước linh hoạt

Kích thước cửa sổ thay đổi. Ta mở rộng `right` liên tục; khi cửa sổ vi phạm điều kiện, ta co `left` lại cho đến khi hợp lệ trở lại.

**Template — Tìm window NGẮN NHẤT thoả điều kiện:**

```java
int shortestWindow(int[] nums, int target) {
    int left = 0, windowState = 0;
    int result = Integer.MAX_VALUE;

    for (int right = 0; right < nums.length; right++) {
        // === Bước 1: Mở rộng, thêm nums[right] vào window ===
        windowState += nums[right];

        // === Bước 2: Thu hẹp, loại bỏ từ trái khi window hợp lệ ===
        while (windowState >= target) {  // điều kiện thoả mãn
            result = Math.min(result, right - left + 1);
            windowState -= nums[left];
            left++;
        }
    }
    return result == Integer.MAX_VALUE ? 0 : result;
}
```

**Template — Tìm window DÀI NHẤT thoả điều kiện:**

```java
int longestWindow(int[] nums) {
    int left = 0, windowState = 0;
    int result = 0;

    for (int right = 0; right < nums.length; right++) {
        // === Bước 1: Mở rộng, thêm nums[right] vào window ===
        windowState += nums[right];

        // === Bước 2: Thu hẹp, loại bỏ từ trái khi window VI PHẠM ===
        while (/* window vi phạm điều kiện */) {
            windowState -= nums[left];
            left++;
        }

        // === Bước 3: Cập nhật kết quả — window hiện tại luôn hợp lệ ===
        result = Math.max(result, right - left + 1);
    }
    return result;
}
```

**Tư duy chọn template:**

| Mục tiêu | Template | Cập nhật result khi nào |
|---|---|---|
| Window ngắn nhất | Thu hẹp khi **hợp lệ** | Bên trong vòng `while` thu hẹp |
| Window dài nhất | Thu hẹp khi **vi phạm** | Sau vòng `while`, với window đang hợp lệ |
| Đếm số window hợp lệ | Tuỳ bài | `result += (right - left + 1)` hoặc `result++` |

## 3. Cấu trúc dữ liệu hỗ trợ trong Window

Nhiều bài toán không chỉ tính tổng đơn giản mà cần theo dõi trạng thái phức tạp hơn:

| Trạng thái cần theo dõi | Cấu trúc dữ liệu | Ví dụ bài toán |
|---|---|---|
| Tổng / tích | `int sum` | Subarray sum ≥ k |
| Tần suất ký tự | `int[] freq = new int[26]` hoặc `HashMap` | Longest substring no repeat |
| Số phần tử phân biệt | `HashMap` + count | At most K distinct characters |
| Max / Min trong window | `Deque<Integer>` (monotonic deque) | Sliding window maximum |
| Số cặp thoả mãn | `HashMap` | Subarray sum equals k |

## 4. Các Dạng Bài Đặc Thù

### 4.1 Maximum Sum Subarray of Size K

**Bài toán**: Cho mảng `nums` và số nguyên `k`. Tìm tổng lớn nhất của subarray có độ dài đúng `k`.

```java
int maxSumSubarray(int[] nums, int k) {
    int n = nums.length;
    int windowSum = 0, maxSum = Integer.MIN_VALUE;

    for (int right = 0; right < n; right++) {
        windowSum += nums[right];

        if (right >= k) windowSum -= nums[right - k];

        if (right >= k - 1) maxSum = Math.max(maxSum, windowSum);
    }
    return maxSum;
}
// nums=[2,1,5,1,3,2], k=3 → 9  (subarray [5,1,3])
```

**Độ phức tạp**: $O(n)$ thời gian, $O(1)$ không gian.

### 4.2 Longest Substring Without Repeating Characters

**Bài toán**: Cho chuỗi `s`. Tìm độ dài substring dài nhất không có ký tự lặp.

**Ý tưởng**: Dùng `HashMap` theo dõi **vị trí cuối cùng** của mỗi ký tự. Khi gặp ký tự lặp, nhảy `left` thẳng tới sau vị trí lặp đó.

```java
int lengthOfLongestSubstring(String s) {
    Map<Character, Integer> lastSeen = new HashMap<>(); // char → last index seen
    int left = 0, result = 0;

    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);

        // Nếu c đã xuất hiện và nằm trong cửa sổ hiện tại
        if (lastSeen.containsKey(c) && lastSeen.get(c) >= left) {
            left = lastSeen.get(c) + 1; // Nhảy left qua vị trí lặp
        }

        lastSeen.put(c, right);
        result = Math.max(result, right - left + 1);
    }
    return result;
}
// s="abcabcbb" → 3 ("abc")
// s="pwwkew"   → 3 ("wke")
```

**Trace** — `s = "abcabcbb"`:

```
right=0 (a): window=[a],      left=0, result=1
right=1 (b): window=[a,b],    left=0, result=2
right=2 (c): window=[a,b,c],  left=0, result=3
right=3 (a): a lặp tại 0 → left=1, window=[b,c,a], result=3
right=4 (b): b lặp tại 1 → left=2, window=[c,a,b], result=3
right=5 (c): c lặp tại 2 → left=3, window=[a,b,c], result=3
right=6 (b): b lặp tại 4 → left=5, window=[c,b],   result=3
right=7 (b): b lặp tại 6 → left=7, window=[b],      result=3
```

### 4.3 Minimum Window Substring

**Bài toán**: Cho chuỗi `s` và `t`. Tìm substring ngắn nhất của `s` chứa tất cả ký tự trong `t` (kể cả lặp).

**Ý tưởng**: Dùng `freq` map để đếm ký tự cần thiết và biến `have` / `need` để biết khi nào window đã "đủ".

```java
String minWindow(String s, String t) {
    if (s.isEmpty() || t.isEmpty()) return "";

    Map<Character, Integer> need = new HashMap<>();
    for (char c : t.toCharArray()) need.merge(c, 1, Integer::sum);

    Map<Character, Integer> have = new HashMap<>();
    int formed = 0;                  // số ký tự đã đủ số lần
    int required = need.size();      // số ký tự phân biệt cần đủ

    int left = 0, minLen = Integer.MAX_VALUE, minLeft = 0;

    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        have.merge(c, 1, Integer::sum);

        // Kiểm tra ký tự c vừa thêm có đủ số lần chưa
        if (need.containsKey(c) && have.get(c).equals(need.get(c))) formed++;

        // Thu hẹp từ trái khi window đã chứa đủ tất cả ký tự
        while (formed == required) {
            if (right - left + 1 < minLen) {
                minLen = right - left + 1;
                minLeft = left;
            }
            char lc = s.charAt(left);
            have.merge(lc, -1, Integer::sum);
            if (need.containsKey(lc) && have.get(lc) < need.get(lc)) formed--;
            left++;
        }
    }
    return minLen == Integer.MAX_VALUE ? "" : s.substring(minLeft, minLeft + minLen);
}
// s="ADOBECODEBANC", t="ABC" → "BANC"
```

**Độ phức tạp**: $O(|s| + |t|)$ thời gian, $O(|\Sigma|)$ không gian (với $\Sigma$ là bảng chữ cái).

### 4.4 Longest Substring with At Most K Distinct Characters

**Bài toán**: Cho chuỗi `s` và số `k`. Tìm độ dài substring dài nhất có **tối đa `k` ký tự phân biệt**.

```java
int lengthOfLongestSubstringKDistinct(String s, int k) {
    Map<Character, Integer> freq = new HashMap<>();
    int left = 0, result = 0;

    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        freq.merge(c, 1, Integer::sum);

        // Thu hẹp khi có hơn k ký tự phân biệt
        while (freq.size() > k) {
            char lc = s.charAt(left);
            freq.merge(lc, -1, Integer::sum);
            if (freq.get(lc) == 0) freq.remove(lc);
            left++;
        }

        result = Math.max(result, right - left + 1);
    }
    return result;
}
// s="eceba", k=2 → 3 ("ece")
// s="aa",    k=1 → 2 ("aa")
```

**Mở rộng**: Bài toán "Exactly K distinct" = `atMost(k) - atMost(k-1)`.

### 4.5 Longest Repeating Character Replacement

**Bài toán** (LeetCode 424): Cho chuỗi `s` và số `k`. Ta được phép thay đổi **tối đa `k` ký tự** trong một substring. Tìm độ dài substring dài nhất mà sau khi thay đổi, toàn bộ là một ký tự.

**Ý tưởng**: Trong một window `[left, right]`, số ký tự cần thay = `(độ dài window) - (tần suất ký tự xuất hiện nhiều nhất)`. Nếu số này `> k` thì vi phạm.

```java
int characterReplacement(String s, int k) {
    int[] freq = new int[26];
    int left = 0, maxFreq = 0, result = 0;

    for (int right = 0; right < s.length(); right++) {
        freq[s.charAt(right) - 'A']++;
        maxFreq = Math.max(maxFreq, freq[s.charAt(right) - 'A']);

        // (window size) - maxFreq = số ký tự cần đổi
        int windowSize = right - left + 1;
        if (windowSize - maxFreq > k) {
            // Thu hẹp từ trái
            freq[s.charAt(left) - 'A']--;
            left++;
            // Không cần cập nhật maxFreq vì window ngắn hơn không bao giờ
            // cho kết quả tốt hơn result hiện tại
        }

        result = Math.max(result, right - left + 1);
    }
    return result;
}
// s="AABABBA", k=1 → 4 ("AABA" hoặc "ABBA")
```

**Lưu ý quan trọng**: `maxFreq` không bao giờ giảm trong thuật toán này. Tại sao lại đúng? Vì ta chỉ quan tâm tìm window **dài hơn** window tốt nhất đã biết. Nếu `maxFreq` giảm, window mới sẽ không dài hơn được.

### 4.6 Minimum Size Subarray Sum

**Bài toán**: Cho mảng số nguyên dương `nums` và số nguyên `target`. Tìm độ dài subarray ngắn nhất có tổng `>= target`.

```java
int minSubArrayLen(int target, int[] nums) {
    int left = 0, sum = 0;
    int result = Integer.MAX_VALUE;

    for (int right = 0; right < nums.length; right++) {
        sum += nums[right];

        // Thu hẹp khi tổng đã đủ
        while (sum >= target) {
            result = Math.min(result, right - left + 1);
            sum -= nums[left++];
        }
    }
    return result == Integer.MAX_VALUE ? 0 : result;
}
// nums=[2,3,1,2,4,3], target=7 → 2 (subarray [4,3])
```

**Tại sao không dùng được với số âm?** Nếu có số âm, thu hẹp window từ trái không đảm bảo tổng giảm → tính monotonic bị phá vỡ. Trường hợp đó dùng Prefix Sum + Binary Search: $O(n \log n)$.

### 4.7 Sliding Window Maximum

**Bài toán**: Cho mảng `nums` và số `k`. Tìm giá trị lớn nhất trong mỗi window kích thước `k`.

**Ý tưởng**: Dùng **Monotonic Deque** (hàng đợi đơn điệu giảm dần). Deque lưu **chỉ số** các phần tử, đảm bảo `nums[deque.peekFirst()]` luôn là max của window hiện tại.

```java
int[] maxSlidingWindow(int[] nums, int k) {
    Deque<Integer> dq = new ArrayDeque<>(); // lưu chỉ số, nums[dq.peekFirst()] là max
    int[] result = new int[nums.length - k + 1];
    int idx = 0;

    for (int right = 0; right < nums.length; right++) {
        // Loại bỏ phần tử đã ra khỏi window từ phía trước
        while (!dq.isEmpty() && dq.peekFirst() < right - k + 1)
            dq.pollFirst();

        // Loại bỏ từ sau các phần tử nhỏ hơn nums[right]
        // (chúng không bao giờ là max khi nums[right] còn trong window)
        while (!dq.isEmpty() && nums[dq.peekLast()] < nums[right])
            dq.pollLast();

        dq.offerLast(right);

        // Bắt đầu ghi kết quả khi window đủ kích thước k
        if (right >= k - 1)
            result[idx++] = nums[dq.peekFirst()];
    }
    return result;
}
// nums=[1,3,-1,-3,5,3,6,7], k=3 → [3,3,5,5,6,7]
```

**Trace** — `nums = [1,3,-1,-3,5,3,6,7]`, `k = 3`:

```
right=0 (1):  dq=[0]                 → (chưa đủ k)
right=1 (3):  3>1, pop 0 → dq=[1]    → (chưa đủ k)
right=2 (-1): dq=[1,2]               → result=[3]   (max=nums[1]=3)
right=3 (-3): dq=[1,2,3]             → result=[3,3] (max=nums[1]=3)
right=4 (5):  5>-1>-3, pop 3,2 → dq=[1,4], 1<2 pop 1 → dq=[4]
              result=[3,3,5]
right=5 (3):  dq=[4,5]               → result=[3,3,5,5]
right=6 (6):  6>3, pop 5 → dq=[4,6], 6>5, pop 4 → dq=[6]
              result=[3,3,5,5,6]
right=7 (7):  7>6, pop 6 → dq=[7]    → result=[3,3,5,5,6,7]
```

**Độ phức tạp**: $O(n)$ thời gian (mỗi phần tử vào/ra deque đúng 1 lần), $O(k)$ không gian.

### 4.8 Subarray Product Less Than K

**Bài toán**: Cho mảng số nguyên dương `nums` và số `k`. Đếm số subarray có tích **nhỏ hơn `k`**.

**Ý tưởng**: Với mỗi `right`, tìm `left` nhỏ nhất sao cho tích `[left..right] < k`. Số subarray kết thúc tại `right` và thoả mãn là `right - left + 1`.

```java
int numSubarrayProductLessThanK(int[] nums, int k) {
    if (k <= 1) return 0; // tích luôn >= 1 (phần tử dương)

    int left = 0, product = 1, result = 0;

    for (int right = 0; right < nums.length; right++) {
        product *= nums[right];

        while (product >= k) {
            product /= nums[left++];
        }

        // Các subarray kết thúc tại right: [right], [right-1,right], ..., [left,right]
        result += right - left + 1;
    }
    return result;
}
// nums=[10,5,2,6], k=100 → 8
```

**Tại sao `result += right - left + 1`?** Với mỗi `right`, tất cả subarray `[left..right], [left+1..right], ..., [right..right]` đều hợp lệ (tích nhỏ hơn k), vì tích chỉ tăng khi ta mở rộng subarray sang trái.

### 4.9 Find All Anagrams in a String

**Bài toán**: Cho chuỗi `s` và `p`. Tìm tất cả chỉ số bắt đầu của các anagram của `p` trong `s`.

**Ý tưởng**: Anagram của `p` = substring có **cùng tần suất ký tự** với `p`. Dùng fixed window kích thước `len(p)`, so sánh freq array.

```java
List<Integer> findAnagrams(String s, String p) {
    List<Integer> result = new ArrayList<>();
    if (s.length() < p.length()) return result;

    int[] pFreq = new int[26], wFreq = new int[26];
    for (char c : p.toCharArray()) pFreq[c - 'a']++;

    int k = p.length();

    for (int right = 0; right < s.length(); right++) {
        wFreq[s.charAt(right) - 'a']++;

        // Loại phần tử ra khỏi cửa sổ khi vượt kích thước k
        if (right >= k) wFreq[s.charAt(right - k) - 'a']--;

        // So sánh hai freq array (O(26) = O(1))
        if (right >= k - 1 && Arrays.equals(wFreq, pFreq))
            result.add(right - k + 1);
    }
    return result;
}
// s="cbaebabacd", p="abc" → [0, 6]
```

**Tối ưu hơn**: Thay vì so sánh hai mảng $O(26)$, dùng biến `matches` đếm số ký tự đã khớp tần suất — giảm constant factor.

### 4.10 Longest Subarray with Ones After Deletion

**Bài toán** (LeetCode 1493): Cho mảng nhị phân `nums`. Xoá đúng một phần tử. Tìm độ dài subarray chỉ gồm `1` dài nhất sau khi xoá.

**Ý tưởng**: Tương tự "At most K zeros" — cho phép tối đa **1 số 0** trong window.

```java
int longestSubarray(int[] nums) {
    int left = 0, zeros = 0, result = 0;

    for (int right = 0; right < nums.length; right++) {
        if (nums[right] == 0) zeros++;

        while (zeros > 1) {
            if (nums[left] == 0) zeros--;
            left++;
        }

        // -1 vì phải xoá đúng một phần tử
        result = Math.max(result, right - left); // right - left + 1 - 1
    }
    return result;
}
// [1,1,0,1] → 3  (xoá phần tử 0, còn [1,1,1])
// [0,1,1,1,0,1,1,0,1] → 5
```

### 4.11 Permutation in String

**Bài toán** (LeetCode 567): Cho hai chuỗi `s1` và `s2`. Kiểm tra xem có permutation nào của `s1` là substring của `s2` không.

```java
boolean checkInclusion(String s1, String s2) {
    if (s1.length() > s2.length()) return false;

    int[] need = new int[26], have = new int[26];
    for (char c : s1.toCharArray()) need[c - 'a']++;

    int k = s1.length();
    int matches = 0; // số ký tự đã đúng tần suất

    for (int right = 0; right < s2.length(); right++) {
        int c = s2.charAt(right) - 'a';
        have[c]++;
        if (have[c] == need[c]) matches++;          // thêm vào làm khớp
        else if (have[c] == need[c] + 1) matches--; // thêm vào làm vỡ khớp

        if (right >= k) {
            int lc = s2.charAt(right - k) - 'a';
            if (have[lc] == need[lc]) matches--;          // bỏ ra làm vỡ khớp
            else if (have[lc] == need[lc] + 1) matches++; // bỏ ra làm khớp trở lại
            have[lc]--;
        }

        if (matches == 26) return true;
    }
    return false;
}
// s1="ab", s2="eidbaooo" → true ("ba" là permutation của "ab")
```

### 4.12 Max Consecutive Ones III (At Most K Zeros)

**Bài toán** (LeetCode 1004): Cho mảng nhị phân `nums` và số `k`. Cho phép flip tối đa `k` số `0` thành `1`. Tìm độ dài subarray toàn `1` dài nhất.

**Ý tưởng cốt lõi**: Flip tối đa `k` số `0` ↔ Window có tối đa `k` số `0`.

```java
int longestOnes(int[] nums, int k) {
    int left = 0, zeros = 0, result = 0;

    for (int right = 0; right < nums.length; right++) {
        if (nums[right] == 0) zeros++;

        // Thu hẹp khi vi phạm: window có hơn k số 0
        while (zeros > k) {
            if (nums[left] == 0) zeros--;
            left++;
        }

        result = Math.max(result, right - left + 1);
    }
    return result;
}
// nums=[1,1,1,0,0,0,1,1,1,1,0], k=2 → 6
```

**Pattern chung**: Bài toán dạng "flip/replace tối đa k phần tử" thường quy về "window có tối đa k phần tử xấu".

### 4.13 Subarrays with K Different Integers

**Bài toán** (LeetCode 992): Đếm số subarray có **đúng `k` số nguyên phân biệt**.

**Trick quan trọng**: `exactly(k) = atMost(k) - atMost(k-1)`.

```java
int atMost(int[] nums, int k) {
    Map<Integer, Integer> freq = new HashMap<>();
    int left = 0, result = 0;

    for (int right = 0; right < nums.length; right++) {
        freq.merge(nums[right], 1, Integer::sum);

        while (freq.size() > k) {
            freq.merge(nums[left], -1, Integer::sum);
            if (freq.get(nums[left]) == 0) freq.remove(nums[left]);
            left++;
        }

        result += right - left + 1; // đếm tất cả subarray kết thúc tại right
    }
    return result;
}

int subarraysWithKDistinct(int[] nums, int k) {
    return atMost(nums, k) - atMost(nums, k - 1);
}
// nums=[1,2,1,2,3], k=2 → 7
```

**Tại sao trick này hoạt động?**

```
exactly(k)  = {windows có đúng k distinct}
atMost(k)   = {windows có ≤ k distinct} = exactly(1) + exactly(2) + ... + exactly(k)
atMost(k-1) = {windows có ≤ k-1 distinct} = exactly(1) + ... + exactly(k-1)
→ atMost(k) - atMost(k-1) = exactly(k)
```


## 6. Checklist & Nhận Dạng Bài Toán

### Dấu hiệu nhận biết

- Đề bài có từ khoá: **"subarray", "substring", "contiguous", "consecutive"**
- Yêu cầu: tìm **min/max length, count, exists** của subarray/substring
- Có điều kiện kiểu: **"sum >= k", "at most k distinct", "no repeating"**
- Kích thước cửa sổ được cho hoặc cần tìm
