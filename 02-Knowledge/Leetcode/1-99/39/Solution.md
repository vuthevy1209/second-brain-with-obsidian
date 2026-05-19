

> [!check] Complexity
> Time Complexity: 
> Space Complexity:

```java
class Solution {  
    private List<List<Integer>> result = new ArrayList<>();  
    private List<Integer> list = new ArrayList<>();  
  
    public List<List<Integer>> combinationSum(int[] candidates, int target) {  
        buildSet(candidates, target, 0);  
  
        return result;  
    }  
  
    void buildSet(int[] candidates, int target, int index) {  
        if (list.stream().reduce(0, Integer::sum) == target) {  
            result.add(new ArrayList<>(list));  
            return;  
        }  
  
        // cắt sớm  
        if (list.stream().reduce(0, Integer::sum) > target)  
            return;  
  
        for (int i = index; i < candidates.length; i++) {  
            list.add(candidates[i]);  
            buildSet(candidates, target, i);  
  
            // backtrack  
            list.removeLast();  
        }  
    }  
}
```

### Time Complexity

**Worst case: O(n^(T/M))**

Trong đó:

- `n` = số lượng candidates
- `T` = target
- `M` = giá trị nhỏ nhất trong candidates

**Lý do:** Cây đệ quy có chiều cao tối đa `T/M` (ví dụ target=7, min=2 → sâu tối đa 3-4 tầng). Mỗi node có tối đa `n` nhánh con.

```
                    []
          /      /     \     \
        [2]    [3]    [6]    [7]
       / | \    |\ 
    [2,2][2,3][2,6] [3,3]...
    / \
[2,2,2][2,2,3] ✅
```

---

### Space Complexity

**O(T/M)** — chiều sâu tối đa của call stack (không tính output)