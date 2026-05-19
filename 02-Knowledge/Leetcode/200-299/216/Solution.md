

> [!check] Complexity
> Time Complexity: O(k × C(9,k))
> - **Số lượng tổ hợp** chọn k từ 9 số = C(9,k)
> - Mỗi lần tìm được tổ hợp hợp lệ, tốn thêm **O(k)** để: `reduce()` tính tổng và copy list.
> 
> Space Complexity: O(k)
> - `list` (current path) - O(k)
> - Call stack (đệ quy sâu tối đa k lớp) - O(k)
>  


```java
class Solution {  
    private List<List<Integer>> result = new ArrayList<>();  
    private List<Integer> list = new ArrayList<>();  
  
    public List<List<Integer>> combinationSum3(int k, int n) {  
        buildSet(k, n, 1);  
        return result;  
    }  
  
    void buildSet(int k, int n, int index) {  
        if (list.size() == k) {  
            if (list.stream().reduce(0, Integer::sum) == n)  
                result.add(new ArrayList<>(list));  
            return;  
        }  
  
        for (int i = index; i <= 9; i++) {  
            list.add(i);  
            buildSet(k, n, i + 1);  
              
            // backtrack  
            list.removeLast();  
        }  
    }  
}
```
