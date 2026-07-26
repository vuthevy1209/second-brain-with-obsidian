# Dynamic Programing

- Gọi dp[i] là chuỗi con tăng dần dài nhất kết thúc tại vị trí i.
- Chắc chắn dp[0] = 1 vì nó là số đầu tiên trong mảng.
- Với cái i > 0, ta xét các giá trị j < i => Sao cho nếu dãy con tăng dần dài nhất kết thúc tại j mà kết hợp thêm giá trị i hiện tại cũng tạo thành dãy tăng dần => Nó lơn hơn dp[i] hiện tại.
- Thì ta tiến hành cập nhật lại.

> [!check] Complexity
> Time Complexity: O(n^2)
> Space Complexity: O(n)

```java
class Solution {  
    public int lengthOfLIS(int[] nums) {  
        int n = nums.length;  
        int[] dp = new int[n];  
        Arrays.fill(dp, 1);  
  
        for (int i = 0; i < n; i++) {  
            for (int j = 0; j < i; j++) {  
                if (nums[j] < nums[i] && dp[j] + 1 > dp[i]) {  
                    dp[i] = dp[j] + 1;  
                }  
            }  
        }  
  
        return Arrays.stream(dp).max().getAsInt();  
    }  
}
```

# Greedy with Binary Search

- Let's construct the idea from following example.
- Consider the example `nums = [2, 6, 8, 3, 4, 5, 1]`, let's try to build the increasing subsequences starting with an empty one: `sub1 = []`.
    1. Let pick the first element, `sub1 = [2]`.
    2. `6` is greater than previous number, `sub1 = [2, 6]`
    3. `8` is greater than previous number, `sub1 = [2, 6, 8]`
    4. `3` is less than previous number, we can't extend the subsequence `sub1`, but we must keep `3` because in the future there may have the longest subsequence start with `[2, 3]`, `sub1 = [2, 6, 8], sub2 = [2, 3]`.
    5. With `4`, we can't extend `sub1`, but we can extend `sub2`, so `sub1 = [2, 6, 8], sub2 = [2, 3, 4]`.
    6. With `5`, we can't extend `sub1`, but we can extend `sub2`, so `sub1 = [2, 6, 8], sub2 = [2, 3, 4, 5]`.
    7. With `1`, we can't extend neighter `sub1` nor `sub2`, but we need to keep `1`, so `sub1 = [2, 6, 8], sub2 = [2, 3, 4, 5], sub3 = [1]`.
    8. Finally, length of longest increase subsequence = `len(sub2)` = 4.
- In the above steps, we need to keep different `sub` arrays (`sub1`, `sub2`..., `subk`) which causes poor performance. But we notice that we can just keep one `sub` array, when new number `x` is not greater than the last element of the subsequence `sub`, we do binary search to find the smallest element >= `x` in `sub`, and replace with number `x`.
- Let's run that example `nums = [2, 6, 8, 3, 4, 5, 1]` again:
    1. Let pick the first element, `sub = [2]`.
    2. `6` is greater than previous number, `sub = [2, 6]`
    3. `8` is greater than previous number, `sub = [2, 6, 8]`
    4. `3` is less than previous number, so we can't extend the subsequence `sub`. We need to find the smallest number >= `3` in `sub`, it's `6`. Then we overwrite it, now `sub = [2, 3, 8]`.
    5. `4` is less than previous number, so we can't extend the subsequence `sub`. We overwrite `8` by `4`, so `sub = [2, 3, 4]`.
    6. `5` is greater than previous number, `sub = [2, 3, 4, 5]`.
    7. `1` is less than previous number, so we can't extend the subsequence `sub`. We overwrite `2` by `1`, so `sub = [1, 3, 4, 5]`.
    8. Finally, length of longest increase subsequence = `len(sub)` = 4.

> [!check] Complexity
> Time Complexity: O(nlogn)
> Space Complexity: O(1)

```java
class Solution {  
    public int lengthOfLIS(int[] nums) {  
        List<Integer> sub = new ArrayList<>();  
  
        for (int i = 0; i < nums.length; i++) {  
            if (sub.isEmpty() || sub.getLast() < nums[i])  
                sub.add(nums[i]);  
            else {  
                // find the element >= nums[i] and replace  
                // lower bound                
                int k = Collections.binarySearch(sub, nums[i]);  
                if (k < 0) k = -(k + 1);  
                sub.set(k, nums[i]);  
            }  
  
        }  
  
        return sub.size();  
    }  
}
```

- Mô phỏng => Như vậy ta có thể bao trọn được các đáp án.

![[Solution-1780459848761.webp]]