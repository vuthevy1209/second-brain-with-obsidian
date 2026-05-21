# Binary search

> [!check] Complexity
> Time Complexity: O(nlogn + O(n^3))
> Space Complexity: O(1)

```java
class Solution {  
    public List<List<Integer>> fourSum(int[] nums, int target) {  
        Arrays.sort(nums);  
  
        Set<List<Integer>> ans = new HashSet<>();  
  
        for (int i = 0; i < nums.length; i++) {  
            for (int j = i + 1; j < nums.length; j++) {  
                int num1 = nums[i];  
                int num2 = nums[j];  
  
                int left = j + 1;  
                int right = nums.length - 1;  
                while (left < right) {  
                    long sum = (long) num1 + num2 + nums[left] + nums[right];  
                    if (sum < target) {  
                        left++;  
                    } else if (sum > target) {  
                        right--;  
                    } else {  
                        ans.add(List.of(num1, num2, nums[left], nums[right]));  
                        left++;  
                        right--;  
                    }  
                }  
            }  
        }  
  
        return ans.stream().toList();  
    }  
}
```

# Improve

``` java
class Solution {
    public List<List<Integer>> fourSum(int[] nums, int target) {
        Arrays.sort(nums);
        List<List<Integer>> ans = new ArrayList<>();
        int n = nums.length;

        for (int i = 0; i < n - 3; i++) {
            // Skip duplicate cho i
            if (i > 0 && nums[i] == nums[i - 1]) continue;

            // Pruning: 4 số nhỏ nhất đã > target
            if ((long) nums[i] + nums[i+1] + nums[i+2] + nums[i+3] > target) break;
            // Pruning: 4 số lớn nhất vẫn < target
            if ((long) nums[i] + nums[n-1] + nums[n-2] + nums[n-3] < target) continue;

            for (int j = i + 1; j < n - 2; j++) {
                // Skip duplicate cho j
                if (j > i + 1 && nums[j] == nums[j - 1]) continue;

                // Pruning tương tự cho vòng j
                if ((long) nums[i] + nums[j] + nums[j+1] + nums[j+2] > target) break;
                if ((long) nums[i] + nums[j] + nums[n-1] + nums[n-2] < target) continue;

                int left = j + 1, right = n - 1;
                while (left < right) {
                    long sum = (long) nums[i] + nums[j] + nums[left] + nums[right];
                    if (sum < target) {
                        left++;
                    } else if (sum > target) {
                        right--;
                    } else {
                        ans.add(List.of(nums[i], nums[j], nums[left], nums[right]));
                        // Skip duplicate cho left và right
                        while (left < right && nums[left] == nums[left + 1]) left++;
                        while (left < right && nums[right] == nums[right - 1]) right--;
                        left++;
                        right--;
                    }
                }
            }
        }

        return ans;
    }
}
```

### Các điểm cải thiện chính

**1. Pruning (quan trọng nhất)** — cắt sớm khi không thể có kết quả:

java

```java
if (nums[i] + nums[i+1] + nums[i+2] + nums[i+3] > target) break;  // quá lớn rồi
if (nums[i] + nums[n-1] + nums[n-2] + nums[n-3] < target) continue; // quá nhỏ rồi
```

**2. Skip duplicate không dùng Set:**

```java
if (i > 0 && nums[i] == nums[i - 1]) continue;
```

**3. Bound chặt hơn:** `i < n - 3` thay vì `i < n` — tránh các vòng lặp thừa không thể tạo đủ 4 phần tử.