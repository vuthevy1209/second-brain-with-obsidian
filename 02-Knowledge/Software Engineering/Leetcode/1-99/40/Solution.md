# Backtrack

Điểm mẫu chốt của Combination Sum II là khả năng cắt tỉa cây sớm, Nếu ứng viên hiện tại bằng ứng viên trước đó trong cùng 1 level DFS thì ta không cần phải thử => Vì sẽ cho ra các bộ có trùng số tại vị trí đó.
``` java
if (i > index && candidates[i] == candidates[i - 1]) continue;
```

> [!check] Complexity
> Time Complexity: O(nlogn + n x 2^n), sắp xếp mất O(nlogn). Hàm buildCombination duyệt qua tất cả các node của cây backtracking (2^n). Tại mỗi node thì chi phí là O(1) ứng với cái lời gọi add, removeLast hoặc thậm chí không đụng đến vì bị cắt tỉa, tuy nhiên nếu tìm đc đáp án thì mất O(k) để copy list với k <= n. 
> 
> Space Complexity: O(n) Nếu không tính ans, còn nếu tính thì là 2^n vì ans có thể lưu đến 2^n bộ con.

```java
class Solution {  
    private Set<List<Integer>> ans;  
    private List<Integer> com;  
  
    public List<List<Integer>> combinationSum2(int[] candidates, int target) {  
        ans = new HashSet<>();  
        com = new ArrayList<>();  
        Arrays.sort(candidates);  
        buildCombination(candidates, target, 0, 0);  
  
        return ans.stream().toList();  
    }  
  
    void buildCombination(int[] candidates, int target, int index, int sum){  
        if (sum > target) return;  
        if (sum == target) {  
            ans.add(List.copyOf(com));  
            return;  
        }  
  
        for (int i = index; i < candidates.length; i++) {  
            if (i > index && candidates[i] == candidates[i - 1]) continue;  
            com.add(candidates[i]);  
            buildCombination(candidates, target, i + 1, sum + candidates[i]);  
  
            // backtrack  
            com.removeLast();  
        }  
    }  
}
```
