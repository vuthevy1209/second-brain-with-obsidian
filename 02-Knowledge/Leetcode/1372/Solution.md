# <font color="#ff0000">Brute Force (will encounter time limit exceed)</font>

- Flood at all node with countDepth = 0 starting from that node.

> [!check] Complexity
> Time Complexity: O(n*h) = O(n bình)
> - Độ phức tạp của vòng while đó là O(n) vì duyệt qua N node. tại mỗi node có thể gọi tối đa 2 flood. và mỗi flood thì có chi phí là O(h) vì flood chỉ đi zigzag đúng 1 đường (ko flush toàn con bên dưới). => O(n x 2 x h) = O(nh)
> - **Trường hợp tệ nhất**, cây lệch, h = n => O(n^2)
> - **Cây cân bằng:** h = log n => O(nlogn)
> 
> Space Complexity: O(h)
> - Dùng Stack để duyệt BFS nên sức chứa tối đa của stack là O(h)
> - Hàm flood là hàm gọi đệ quy và có thể chiếm stack là O(h)

![[Solution-1778902488471.webp|445x417]]


``` java
class Solution {  
    int maxZigZagLength = 0;  
  
    // direction = false -> turn left and vice versa  
    void flood(TreeNode node, boolean direction, int countDepthPath) {  
        if (node == null) return;  
  
        countDepthPath++;  
        maxZigZagLength = Math.max(countDepthPath, maxZigZagLength);  
  
        if (direction) {  
            flood(node.right, false, countDepthPath);  
        } else {  
            flood(node.left, true, countDepthPath);  
        }  
    }  
  
    public int longestZigZag(TreeNode root) {  
        if (root == null) return 0;  
        if (root.left == null && root.right == null) return 1;  
  
        Stack<TreeNode> stack = new Stack<>();  
        stack.push(root);  
  
        while (!stack.isEmpty()) {  
            TreeNode top = stack.pop();  
  
            if (top.left != null) {  
                flood(top, false, 0);  
                stack.push(top.left);  
            }  
  
            if (top.right != null) {  
                flood(top, true, 0);  
                stack.push(top.right);  
            }  
        }  
  
        return maxZigZagLength - 1;  
    }  
}
```


# Best Solution

> [!check] Complexity
> Time Complexity: O(2n) = O(n)
> - Hàm longestZigZag gọi 2 lần dfs tại root, và không làm thêm gì nên độ phức tạp là O(1). Chi phí phụ thuộc vào 2 lần dfs
> - Hàm dfs sẽ flood toàn bộ node của cây nên chi phí là O(n)
> - Lưu ý: phân tích độ phức tạp recursive function thì luôn đọc theo số node sẽ bị đụng chứ đừng nghĩ theo việc số lần gọi recursive
> 
> Space Complexity: O(h) 
> - Vì dfs là hàm đệ quy nên số stack chồng lên cao nhất là h = chiều cao cây


``` java
class Solution {
    int max = 0;

    public int longestZigZag(TreeNode root) {
        dfs(root, false, 0);
        dfs(root, true, 0);
        return max;
    }

    void dfs(TreeNode node, boolean goRight, int length) {
        if (node == null) return;

        max = Math.max(max, length);

        if (goRight) {
            dfs(node.right, false, length + 1); // đi đúng hướng → tiếp tục
            dfs(node.left, true, 1);             // đi sai hướng → reset về 1
        } else {
            dfs(node.left, true, length + 1);   // đi đúng hướng → tiếp tục
            dfs(node.right, false, 1);           // đi sai hướng → reset về 1
        }
    }
}
```

Khi đi sai hướng, path cũ bị phá vỡ. Nhưng bản thân bước đó vẫn là 1 bước zigzag mới
→ reset về 1, không phải 0