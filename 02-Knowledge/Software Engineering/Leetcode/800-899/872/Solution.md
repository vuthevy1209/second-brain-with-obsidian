> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity: O(n)

``` java
class Solution {  

    List<Integer> dfs(TreeNode root1) {  
        List<Integer> list = new LinkedList<>();  
        Stack<TreeNode> stack = new Stack<>();  
        stack.push(root1);  
  
        while (!stack.isEmpty()) {  
            TreeNode top = stack.pop();  
  
            if (top.left == null && top.right == null) {  
                list.add(top.val);  
            }  
  
            if (top.left != null) stack.push(top.left);  
            if (top.right != null) stack.push(top.right);  
        }  
  
        return list;  
    }  
  
    public boolean leafSimilar(TreeNode root1, TreeNode root2) {  
        List<Integer> list1 = dfs(root1);  
        List<Integer> list2 = dfs(root2);  
  
        return list1.equals(list2);  
    }  
}
```

### Phân tích độ phức tạp

#### Hàm `dfs(TreeNode root)`

**Thời gian — O(N)**

Duyệt qua tất cả node của cây đúng một lần bằng stack, mỗi node được push và pop đúng 1 lần.

**Không gian — O(N)**

- **Stack** lưu tối đa O(H) node (H là chiều cao cây), nhưng worst case cây lệch hoàn toàn thì H = N → **O(N)**
- **List** lưu các lá, tối đa O(N) lá

#### Hàm `leafSimilar(root1, root2)`

![[Solution-1778851861991.webp]]

> N₁, N₂ là số node của cây 1 và cây 2; L₁, L₂ là số lá tương ứng.

Bước `list1.equals(list2)` so sánh từng phần tử tốn **O(min(L₁, L₂))**, nhưng con số này bị N₁ + N₂ nuốt mất nên không ảnh hưởng big-O tổng.