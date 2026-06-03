---
title: Dynamic Programming
summary: Dynamic Programming — từ tư duy đệ quy đến tối ưu bằng memoization/tabulation, bao gồm các pattern cốt lõi và bài toán kinh điển.
tags:
  - dsa
  - dynamic-programming
  - algorithm
  - optimization
created: 2026-06-03
---

## 1. Core Idea

Dynamic Programming (DP) là kỹ thuật giải bài toán tối ưu bằng cách **chia nhỏ thành các bài toán con chồng lấp nhau**, lưu lại kết quả (memoize) để tránh tính toán lại.

DP áp dụng khi bài toán có **hai tính chất**:

| Tính chất | Giải thích |
|---|---|
| **Optimal Substructure** | Nghiệm tối ưu của bài toán lớn được xây từ nghiệm tối ưu của các bài toán con |
| **Overlapping Subproblems** | Các bài toán con xuất hiện lặp lại nhiều lần nếu dùng đệ quy thuần |

**Tư duy thiết kế DP:**

```
1. Định nghĩa state: dp[i] hoặc dp[i][j] = "ý nghĩa gì?"
2. Xác định transition: dp[i] phụ thuộc dp[j] như thế nào?
3. Xác định base case: dp[0], dp[1], v.v.
4. Xác định thứ tự tính (top-down hay bottom-up)
5. Đọc kết quả từ dp[n] hoặc max/min toàn bộ mảng
```

## 2. Two Approaches

### 2.1 Top-Down (Memoization)

Giữ nguyên đệ quy, thêm cache để lưu kết quả đã tính.

```java
Map<Integer, Long> memo = new HashMap<>();

long fib(int n) {
    if (n <= 1) return n;
    if (memo.containsKey(n)) return memo.get(n); // cache hit
    long result = fib(n - 1) + fib(n - 2);
    memo.put(n, result);
    return result;
}
```

### 2.2 Bottom-Up (Tabulation)

Tính từ base case lên, không cần đệ quy.

```java
long fib(int n) {
    if (n <= 1) return n;
    long[] dp = new long[n + 1];
    dp[0] = 0; dp[1] = 1;
    for (int i = 2; i <= n; i++)
        dp[i] = dp[i - 1] + dp[i - 2];
    return dp[n];
}
```

### 2.3 So sánh

| | Top-Down | Bottom-Up |
|---|---|---|
| **Cách viết** | Đệ quy + cache | Vòng lặp |
| **Trực quan** | Dễ ánh xạ từ bài toán | Cần hình dung thứ tự |
| **Stack overflow** | Có thể xảy ra với input lớn | Không |
| **Tối ưu bộ nhớ** | Chỉ tính state cần thiết | Tính tất cả state |
| **Tốc độ** | Thường chậm hơn (HashMap overhead) | Nhanh hơn (array access) |

> [!tip] Chiến lược học DP
> Bắt đầu với **Top-Down** để hiểu bài toán, sau đó chuyển sang **Bottom-Up** để tối ưu.

## 3. DP Patterns

### Pattern 1: Linear DP — 1D Array

**State:** `dp[i]` phụ thuộc `dp[j]` với `j < i`.

#### 3.1.1 Fibonacci / Climbing Stairs

```java
// LC 70: Climbing Stairs — bao nhiêu cách leo n bậc, mỗi bước 1 hoặc 2 bậc
// dp[i] = số cách leo đến bậc i
int climbStairs(int n) {
    if (n <= 2) return n;
    int prev2 = 1, prev1 = 2;
    for (int i = 3; i <= n; i++) {
        int curr = prev1 + prev2;
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}
// Space optimization: chỉ cần 2 biến thay vì mảng n phần tử
```

#### 3.1.2 House Robber

```java
// LC 198: Không thể cướp 2 nhà liên tiếp, tối đa hóa tiền
// dp[i] = max tiền khi xét đến nhà i
int rob(int[] nums) {
    int n = nums.length;
    if (n == 1) return nums[0];
    int prev2 = nums[0];
    int prev1 = Math.max(nums[0], nums[1]);
    for (int i = 2; i < n; i++) {
        int curr = Math.max(prev1, prev2 + nums[i]);
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}
// Transition: dp[i] = max(dp[i-1], dp[i-2] + nums[i])
```

#### 3.1.3 Longest Increasing Subsequence (LIS)

```java
// LC 300: Tìm độ dài dãy con tăng dài nhất
// dp[i] = độ dài LIS kết thúc tại nums[i]
int lengthOfLIS(int[] nums) {
    int n = nums.length;
    int[] dp = new int[n];
    Arrays.fill(dp, 1); // mỗi phần tử tự thành dãy con độ dài 1
    int ans = 1;
    for (int i = 1; i < n; i++) {
        for (int j = 0; j < i; j++) {
            if (nums[j] < nums[i])
                dp[i] = Math.max(dp[i], dp[j] + 1);
        }
        ans = Math.max(ans, dp[i]);
    }
    return ans;
}
// Time: O(n²) | Có thể tối ưu xuống O(n log n) bằng Patience Sorting
```

**LIS tối ưu O(n log n) — Binary Search + Greedy:**

```java
int lengthOfLIS_Fast(int[] nums) {
    List<Integer> tails = new ArrayList<>(); // tails[i]: phần tử nhỏ nhất cuối dãy LIS độ dài i+1
    for (int num : nums) {
        int pos = Collections.binarySearch(tails, num);
        if (pos < 0) pos = -(pos + 1); // vị trí chèn
        if (pos == tails.size()) tails.add(num);
        else tails.set(pos, num);
    }
    return tails.size();
}
```

### Pattern 2: Knapsack — Tối ưu trên tập hợp

#### 3.2.1 0/1 Knapsack

**Bài toán:** Có `n` vật, mỗi vật có trọng lượng `w[i]` và giá trị `v[i]`. Túi chứa tối đa `W`. Tìm giá trị lớn nhất.

```java
// dp[j] = giá trị tối đa với sức chứa j
// Mỗi vật chỉ dùng được 1 lần → duyệt j từ W về 0 (backward)
int knapsack01(int[] w, int[] v, int W) {
    int n = w.length;
    int[] dp = new int[W + 1];
    for (int i = 0; i < n; i++) {
        for (int j = W; j >= w[i]; j--) { // backward để tránh dùng lại vật i
            dp[j] = Math.max(dp[j], dp[j - w[i]] + v[i]);
        }
    }
    return dp[W];
}
```

**Giải thích chiều lặp:**

```
Duyệt j từ W → w[i]:
  dp[j] = max(không lấy i: dp[j], lấy i: dp[j-w[i]] + v[i])

Nếu duyệt forward (0 → W), dp[j-w[i]] đã được cập nhật bởi item i
→ tức là lấy item i nhiều lần → sai với 0/1 knapsack
```

#### 3.2.2 Unbounded Knapsack (Có thể lấy nhiều lần)

```java
// dp[j] duyệt forward → dp[j-w[i]] có thể đã dùng item i → đúng ý
int unboundedKnapsack(int[] w, int[] v, int W) {
    int[] dp = new int[W + 1];
    for (int i = 0; i < w.length; i++) {
        for (int j = w[i]; j <= W; j++) { // forward
            dp[j] = Math.max(dp[j], dp[j - w[i]] + v[i]);
        }
    }
    return dp[W];
}
```

#### 3.2.3 Coin Change (Minimum Coins)

```java
// LC 322: Số đồng xu ít nhất để tạo thành amount
// dp[j] = số xu tối thiểu để đạt tổng j
int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1); // INF
    dp[0] = 0;
    for (int coin : coins) {
        for (int j = coin; j <= amount; j++) { // forward = unbounded
            dp[j] = Math.min(dp[j], dp[j - coin] + 1);
        }
    }
    return dp[amount] > amount ? -1 : dp[amount];
}
```

#### 3.2.4 Coin Change II (Số cách)

```java
// LC 518: Bao nhiêu cách để tạo thành amount (thứ tự không quan trọng)
// dp[j] = số cách tạo tổng j
int change(int amount, int[] coins) {
    int[] dp = new int[amount + 1];
    dp[0] = 1; // 1 cách tạo tổng 0: không dùng xu nào
    for (int coin : coins) {       // duyệt coin ngoài → đếm combination
        for (int j = coin; j <= amount; j++) {
            dp[j] += dp[j - coin];
        }
    }
    return dp[amount];
}

// LƯU Ý: Nếu đổi thứ tự vòng lặp (j ngoài, coin trong) → đếm PERMUTATION
// Ví dụ: 1+2 và 2+1 sẽ tính là 2 cách
```

**Bảng so sánh Knapsack:**

| Loại | Item dùng | Chiều lặp j | Ví dụ bài |
|---|---|---|---|
| 0/1 Knapsack | Tối đa 1 lần | `W → 0` (backward) | Partition Equal Subset Sum |
| Unbounded Knapsack | Không giới hạn | `0 → W` (forward) | Coin Change, Ribbon Cut |
| Counting (Combination) | Coin ngoài, j trong | forward | Coin Change II |
| Counting (Permutation) | j ngoài, coin trong | forward | Combination Sum IV |

### Pattern 3: 2D DP — Two Sequences / Grid

#### 3.3.1 Longest Common Subsequence (LCS)

```java
// LC 1143: Dãy con chung dài nhất của 2 chuỗi
// dp[i][j] = LCS của text1[0..i-1] và text2[0..j-1]
int longestCommonSubsequence(String text1, String text2) {
    int m = text1.length(), n = text2.length();
    int[][] dp = new int[m + 1][n + 1];
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (text1.charAt(i - 1) == text2.charAt(j - 1))
                dp[i][j] = dp[i - 1][j - 1] + 1;
            else
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
    }
    return dp[m][n];
}
```

**Trực quan bảng DP với `text1 = "abcde"`, `text2 = "ace"`:**

```
    ""  a  c  e
""   0  0  0  0
a    0  1  1  1
b    0  1  1  1
c    0  1  2  2
d    0  1  2  2
e    0  1  2  3   ← LCS = 3 ("ace")
```

#### 3.3.2 Edit Distance

```java
// LC 72: Số thao tác ít nhất (insert/delete/replace) để đổi word1 → word2
// dp[i][j] = edit distance giữa word1[0..i-1] và word2[0..j-1]
int minDistance(String word1, String word2) {
    int m = word1.length(), n = word2.length();
    int[][] dp = new int[m + 1][n + 1];
    for (int i = 0; i <= m; i++) dp[i][0] = i; // xóa i ký tự
    for (int j = 0; j <= n; j++) dp[0][j] = j; // thêm j ký tự

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (word1.charAt(i - 1) == word2.charAt(j - 1))
                dp[i][j] = dp[i - 1][j - 1]; // khớp, không cần thao tác
            else
                dp[i][j] = 1 + Math.min(dp[i - 1][j - 1],  // replace
                                Math.min(dp[i - 1][j],       // delete
                                         dp[i][j - 1]));     // insert
        }
    }
    return dp[m][n];
}
```

#### 3.3.3 Unique Paths

```java
// LC 62: Robot đi từ (0,0) đến (m-1,n-1), chỉ đi xuống hoặc sang phải
// dp[i][j] = số đường đi đến ô (i,j)
int uniquePaths(int m, int n) {
    int[][] dp = new int[m][n];
    for (int i = 0; i < m; i++) dp[i][0] = 1; // chỉ 1 cách đi cột 0
    for (int j = 0; j < n; j++) dp[0][j] = 1; // chỉ 1 cách đi hàng 0
    for (int i = 1; i < m; i++)
        for (int j = 1; j < n; j++)
            dp[i][j] = dp[i - 1][j] + dp[i][j - 1];
    return dp[m - 1][n - 1];
}
// Space O(n): chỉ cần 1 hàng dp vì dp[i][j] chỉ phụ thuộc hàng trên và cột trái
```

### Pattern 4: Interval DP

Bài toán trên một **đoạn** `[i, j]`, kết quả phụ thuộc vào cách chia đoạn.

```
dp[i][j] = kết quả tối ưu cho đoạn [i, j]
Transition: dp[i][j] = f(dp[i][k], dp[k+1][j]) với mọi k ∈ [i, j-1]
Thứ tự tính: từ đoạn ngắn đến đoạn dài (len = 2, 3, ..., n)
```

#### 3.4.1 Burst Balloons

```java
// LC 312: Nổ bóng bay theo thứ tự để tối đa hóa điểm. Khi nổ bóng i:
// điểm = nums[left] * nums[i] * nums[right] (left, right là hàng xóm còn sót)
// dp[i][j] = điểm tối đa khi nổ hết bóng trong đoạn (i, j) (exclusive boundaries)
int maxCoins(int[] nums) {
    int n = nums.length;
    int[] arr = new int[n + 2]; // thêm biên giả 1 ở đầu và cuối
    arr[0] = arr[n + 1] = 1;
    for (int i = 0; i < n; i++) arr[i + 1] = nums[i];
    int m = n + 2;
    int[][] dp = new int[m][m];

    for (int len = 2; len < m; len++) { // độ dài đoạn
        for (int i = 0; i < m - len; i++) {
            int j = i + len;
            for (int k = i + 1; k < j; k++) { // k là quả bóng nổ CUỐI CÙNG trong (i,j)
                dp[i][j] = Math.max(dp[i][j],
                    dp[i][k] + arr[i] * arr[k] * arr[j] + dp[k][j]);
            }
        }
    }
    return dp[0][m - 1];
}
```

> [!note] Trick "nổ cuối cùng"
> Thay vì nghĩ "nổ bóng nào đầu tiên" (khó xác định hàng xóm), hãy nghĩ "bóng nào là **cuối cùng được nổ**" trong đoạn `[i,j]`. Khi đó, `arr[i]` và `arr[j]` chắc chắn còn đó.

#### 3.4.2 Matrix Chain Multiplication

```java
// Tính chi phí nhân ma trận tối thiểu
// dims[i-1] x dims[i] là kích thước ma trận i
// dp[i][j] = chi phí tối thiểu nhân ma trận i đến j
int matrixChain(int[] dims) {
    int n = dims.length - 1; // số ma trận
    int[][] dp = new int[n][n];
    for (int len = 2; len <= n; len++) {
        for (int i = 0; i <= n - len; i++) {
            int j = i + len - 1;
            dp[i][j] = Integer.MAX_VALUE;
            for (int k = i; k < j; k++) {
                int cost = dp[i][k] + dp[k + 1][j] + dims[i] * dims[k + 1] * dims[j + 1];
                dp[i][j] = Math.min(dp[i][j], cost);
            }
        }
    }
    return dp[0][n - 1];
}
```

### Pattern 5: State Machine DP

Mô hình hóa trạng thái của bài toán như một **máy trạng thái** (state machine). Mỗi state là một tình huống, transition là quyết định được đưa ra.

#### 3.5.1 Best Time to Buy and Sell Stock with Cooldown

```java
// LC 309: Sau khi bán phải nghỉ 1 ngày (cooldown)
// States:
//   held   = đang nắm cổ phiếu
//   sold   = vừa bán xong (ngày cooldown)
//   rest   = đang nghỉ / chưa mua
int maxProfit(int[] prices) {
    int held = Integer.MIN_VALUE, sold = 0, rest = 0;
    for (int price : prices) {
        int prevHeld = held, prevSold = sold, prevRest = rest;
        held = Math.max(prevHeld, prevRest - price); // giữ tiếp hoặc mua từ rest
        sold = prevHeld + price;                     // bán cổ phiếu đang nắm
        rest = Math.max(prevRest, prevSold);         // tiếp tục nghỉ hoặc hết cooldown
    }
    return Math.max(sold, rest);
}
```

**State Machine Diagram:**

```
         buy              sell
rest --------→ held --------→ sold
 ↑                              |
 └──────────── cooldown ────────┘
rest → rest (giữ nguyên)
```

#### 3.5.2 Best Time to Buy and Sell Stock with Transaction Fee

```java
// LC 714: Có thể giao dịch bao nhiêu lần, nhưng mỗi lần bán mất phí fee
int maxProfit(int[] prices, int fee) {
    int cash = 0;          // không nắm cổ phiếu
    int hold = -prices[0]; // đang nắm cổ phiếu
    for (int i = 1; i < prices.length; i++) {
        cash = Math.max(cash, hold + prices[i] - fee); // bán
        hold = Math.max(hold, cash - prices[i]);        // mua
    }
    return cash;
}
```

### Pattern 6: DP on Trees / Graphs

#### 3.6.1 House Robber III (DP on Binary Tree)

```java
// LC 337: Cây nhị phân, không thể lấy node cha và node con cùng lúc
// Trả về [rob_root, skip_root]
int[] dfs(TreeNode node) {
    if (node == null) return new int[]{0, 0};
    int[] left  = dfs(node.left);
    int[] right = dfs(node.right);

    // lấy root: không thể lấy con
    int robRoot  = node.val + left[1] + right[1];
    // bỏ root: con có thể lấy hoặc không
    int skipRoot = Math.max(left[0], left[1]) + Math.max(right[0], right[1]);

    return new int[]{robRoot, skipRoot};
}

int rob(TreeNode root) {
    int[] res = dfs(root);
    return Math.max(res[0], res[1]);
}
```

## 4. Classic Problems & Patterns Table

| Bài toán | Pattern | State định nghĩa | Transition |
|---|---|---|---|
| Fibonacci | Linear DP | `dp[i]` = số Fibonacci thứ i | `dp[i] = dp[i-1] + dp[i-2]` |
| Climbing Stairs | Linear DP | `dp[i]` = số cách đến bậc i | `dp[i] = dp[i-1] + dp[i-2]` |
| House Robber | Linear DP | `dp[i]` = max tiền đến nhà i | `dp[i] = max(dp[i-1], dp[i-2]+nums[i])` |
| LIS | Linear DP | `dp[i]` = LIS kết thúc tại i | `dp[i] = max(dp[j]+1)` với `j<i, nums[j]<nums[i]` |
| 0/1 Knapsack | Knapsack | `dp[j]` = max value với capacity j | `dp[j] = max(dp[j], dp[j-w]+v)` backward |
| Coin Change | Unbounded Knapsack | `dp[j]` = min coins cho tổng j | `dp[j] = min(dp[j], dp[j-coin]+1)` forward |
| LCS | 2D DP | `dp[i][j]` = LCS của prefix i và j | Match: `+1`, else: `max(left, up)` |
| Edit Distance | 2D DP | `dp[i][j]` = khoảng cách chỉnh sửa | Match: `dp[i-1][j-1]`, else: `1+min(3 hướng)` |
| Burst Balloons | Interval DP | `dp[i][j]` = max điểm đoạn (i,j) | `dp[i][k] + arr[i]*arr[k]*arr[j] + dp[k][j]` |
| Stock Cooldown | State Machine | 3 state: held/sold/rest | Theo transition diagram |

## 5. Space Optimization

### 5.1 Tối ưu từ 2D xuống 1D

Nhiều bài 2D DP chỉ cần hàng hiện tại và hàng trước.

```java
// LCS tối ưu space: O(min(m,n)) thay vì O(m*n)
int lcsOptimized(String s1, String s2) {
    int m = s1.length(), n = s2.length();
    int[] dp = new int[n + 1];
    for (int i = 1; i <= m; i++) {
        int prev = 0; // dp[i-1][j-1]
        for (int j = 1; j <= n; j++) {
            int temp = dp[j]; // lưu dp[i-1][j] trước khi ghi đè
            if (s1.charAt(i - 1) == s2.charAt(j - 1))
                dp[j] = prev + 1;
            else
                dp[j] = Math.max(dp[j], dp[j - 1]);
            prev = temp;
        }
    }
    return dp[n];
}
```

### 5.2 Rolling Array

```java
// Tối ưu space cho bài toán phụ thuộc 2 hàng liên tiếp
int[] curr = new int[n + 1];
int[] prev = new int[n + 1];
for (int i = 1; i <= m; i++) {
    // ... tính curr từ prev
    int[] temp = prev;
    prev = curr;
    curr = temp; // swap để tái sử dụng mảng
}
```

## 6. Nhận diện bài DP

```
🔍 Từ khóa gợi ý:
  - "Tối đa / tối thiểu" (maximize / minimize)
  - "Bao nhiêu cách" (number of ways / count)
  - "Có thể hay không" (can we / is it possible)
  - "Dãy con / substring" (subsequence / subarray)
  - "Partition / split"

⚠️ Phân biệt:
  - DP vs Greedy: DP xét mọi lựa chọn, Greedy chọn tham lam nhất ở mỗi bước
  - DP vs Backtracking: DP lưu kết quả trung gian, Backtracking thử hết
  - DP vs Divide & Conquer: Subproblems của D&C độc lập, của DP chồng lấp
```

## 7. Complexity Summary

| Pattern | Time | Space (Full) | Space (Optimized) |
|---|---|---|---|
| Linear DP | $O(n)$ hoặc $O(n^2)$ | $O(n)$ | $O(1)$ hoặc $O(n)$ |
| 0/1 Knapsack | $O(n \cdot W)$ | $O(n \cdot W)$ | $O(W)$ |
| 2D DP (LCS, Edit Distance) | $O(m \cdot n)$ | $O(m \cdot n)$ | $O(\min(m,n))$ |
| Interval DP | $O(n^3)$ | $O(n^2)$ | $O(n^2)$ |
| LIS (binary search) | $O(n \log n)$ | $O(n)$ | $O(n)$ |
| DP on Tree | $O(n)$ | $O(h)$ stack | — |

## 8. Template Tổng Quát

```java
// ===== TOP-DOWN TEMPLATE =====
Map<StateKey, Answer> memo = new HashMap<>();

Answer solve(State state) {
    // 1. Base case
    if (isBaseCase(state)) return baseAnswer(state);

    // 2. Check memo
    if (memo.containsKey(state)) return memo.get(state);

    // 3. Try all choices
    Answer best = worstCase();
    for (Choice choice : allChoices(state)) {
        State nextState = transition(state, choice);
        Answer candidate = combine(choice, solve(nextState));
        best = updateBest(best, candidate);
    }

    // 4. Cache and return
    memo.put(state, best);
    return best;
}

// ===== BOTTOM-UP TEMPLATE =====
// 1. Khởi tạo dp array với base cases
// 2. Duyệt theo thứ tự tăng dần của state
// 3. Mỗi state tính từ các state nhỏ hơn đã biết
// 4. Trả về dp[target_state]
```

# Quiz

> [!question] `dp[i][j]` trong bài Coin Change II là gì nếu tách thành 2D?
> a) Số cách dùng đúng `i` đồng xu để đạt tổng `j`  
> b) Số cách dùng `coins[0..i-1]` để đạt tổng `j`  
> c) Giá trị lớn nhất khi dùng `i` đồng xu đầu  
> d) Tổng nhỏ nhất dùng `i` loại xu  
>> [!success]- Đáp án
>> b) Số cách dùng `coins[0..i-1]` để đạt tổng `j`
>> 
>> Vòng lặp `coin` ngoài đảm bảo mỗi loại xu chỉ được "quyết định" một lần → đếm combination, không đếm permutation.

> [!question] Tại sao 0/1 Knapsack phải duyệt `j` từ `W` về `w[i]`, không phải từ `w[i]` lên `W`?
> a) Để tránh tràn số nguyên  
> b) Để đảm bảo mỗi item chỉ được dùng tối đa 1 lần  
> c) Để cải thiện cache locality  
> d) Vì `dp[j - w[i]]` chưa được tính nếu duyệt forward  
>> [!success]- Đáp án
>> b) Để đảm bảo mỗi item chỉ được dùng tối đa 1 lần
>> 
>> Duyệt backward đảm bảo khi tính `dp[j]`, `dp[j - w[i]]` vẫn là giá trị từ **vòng lặp trước** (chưa bao gồm item `i`). Duyệt forward sẽ khiến `dp[j - w[i]]` đã được cập nhật → item `i` có thể được dùng nhiều lần.

> [!question] Khi nào dùng Interval DP thay vì Linear DP?
> a) Khi input là mảng 2D  
> b) Khi kết quả của đoạn `[i,j]` phụ thuộc vào cách chia đôi đoạn đó  
> c) Khi cần tối ưu space  
> d) Khi bài toán có nhiều hơn 2 biến  
>> [!success]- Đáp án
>> b) Khi kết quả của đoạn `[i,j]` phụ thuộc vào cách chia đôi đoạn đó
>> 
>> Ví dụ: Burst Balloons, Matrix Chain Multiplication, Palindrome Partitioning. Đặc điểm: cần thử tất cả điểm chia `k` trong `[i,j]` → `O(n³)`.

> [!question] Trick "nổ cuối cùng" trong Burst Balloons giúp gì?
> a) Giảm time complexity từ O(n³) xuống O(n²)  
> b) Cho phép xác định chắc chắn giá trị của hai biên khi tính điểm  
> c) Tránh trường hợp dp âm  
> d) Cho phép áp dụng Greedy  
>> [!success]- Đáp án
>> b) Cho phép xác định chắc chắn giá trị của hai biên khi tính điểm
>> 
>> Nếu nghĩ "nổ đầu tiên", ta không biết hàng xóm của bóng vừa nổ là gì (vì chúng thay đổi sau mỗi lần nổ). Nhưng nếu nghĩ "nổ cuối cùng" trong đoạn `[i,j]`, thì `arr[i]` và `arr[j]` chắc chắn còn nguyên → tính điểm được.
