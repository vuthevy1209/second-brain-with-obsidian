> [!check] Complexity
> Time Complexity:  O(N²) trung bình, O(N³) worst case
> Space Complexity: O(N)

``` java
class Solution {  
    int countPath = 0;  
  
    void flood(TreeNode node, long targetSum, long sum) {  
        if (node == null) return;  
  
        sum += node.val;  
        if (sum == targetSum) countPath++;  
  
        flood(node.left, targetSum, sum);  
        flood(node.right, targetSum, sum);  
    }  
  
    public int pathSum(TreeNode root, int targetSum) {  
        if (root == null) return 0;  
  
        Stack<TreeNode> stack = new Stack<>();  
        stack.push(root);  
  
        while (!stack.isEmpty()) {  
            TreeNode top = stack.pop();  
  
            flood(top, (long) targetSum, 0);  
  
            if (top.left != null) stack.push(top.left);  
            if (top.right != null) stack.push(top.right);  
        }  
  
        return countPath;  
    }  
}
```

### Phân tích độ phức tạp

#### Thời gian — O(N²) trung bình, O(N³) worst case

Code có **2 vòng lặp lồng nhau**:
**Vòng ngoài** — duyệt qua N node bằng stack → **O(N)**
**Vòng trong** — `flood()` tại mỗi node, đệ quy xuống hết các node con của nó:

```
flood(node) duyệt qua tất cả node trong subtree của node đó
```

| Trường hợp     | Cây                    | Chi phí flood mỗi node  | Tổng           |
| -------------- | ---------------------- | ----------------------- | -------------- |
| **Balanced**   | Cân bằng               | O(N/2) trung bình       | **O(N log N)** |
| **Worst case** | Cây lệch (linked list) | Node 1→N, Node 2→N-1... | **O(N²)**      |

![[Solution-1778891176349.webp]]

![[Solution-1778891192470.webp]]
#### Không gian — O(N)

|Thành phần|Chi phí|
|---|---|
|Stack duyệt (vòng ngoài)|O(H) — chiều cao cây|
|Call stack của `flood()`|O(H) — đệ quy sâu nhất = chiều cao cây|
|Worst case (cây lệch)|H = N → **O(N)**|

# <mark style="background:#d3f8b6">Improve (Use PrefixSum)</mark>

![[Solution-1778894548308.webp]]
![[Solution-1778893322807.webp]]


``` java
class Solution {
    public int pathSum(TreeNode root, int targetSum) {
        Map<Long, Integer> prefixCount = new HashMap<>();
        prefixCount.put(0L, 1); // path từ root, chưa đi bước nào
        return dfs(root, 0L, targetSum, prefixCount);
    }

    int dfs(TreeNode node, long currentSum, int targetSum, Map<Long, Integer> prefixCount) {
        if (node == null) return 0;

        currentSum += node.val;

        // Có bao nhiêu path kết thúc tại node này?
        int count = prefixCount.getOrDefault(currentSum - targetSum, 0);

        // Thêm currentSum vào map trước khi đi xuống
        prefixCount.merge(currentSum, 1, Integer::sum);

        count += dfs(node.left, currentSum, targetSum, prefixCount);
        count += dfs(node.right, currentSum, targetSum, prefixCount);

        // Xóa khi backtrack — không ảnh hưởng nhánh khác
        prefixCount.merge(currentSum, -1, Integer::sum);

        return count;
    }
}
```

