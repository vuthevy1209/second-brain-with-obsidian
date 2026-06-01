# DFS

> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity: O(h)

```java
class Solution {  
    public int countNodes(TreeNode root) {  
        Stack<TreeNode> stack = new Stack<>();  
        stack.add(root);  
        int count = 0;  
  
        while (!stack.isEmpty()) {  
            TreeNode node = stack.pop();  
            if (node == null) continue;  
  
            count++;  
  
            stack.add(node.left);  
            stack.add(node.right);  
        }  
  
        return count;  
    }  
}
```

# Đây là lời giải `O(log² n)` chuẩn của LeetCode:

1 << h = 2 ^ h Vì mỗi lần dịch trái 1 bit là nhân đôi giá trị.

- Xác định bên nào là **perfect tree**.
- Tính số node của bên đó bằng công thức ngay lập tức.
- Chỉ tiếp tục xử lý **cây con còn lại** bằng cách lặp lại cùng một logic.

| Biểu thức | Nhị phân | Kết quả |
| --------- | -------- | ------- |
| `1 << 0`  | `0001`   | 1       |
| `1 << 1`  | `0010`   | 2       |
| `1 << 2`  | `0100`   | 4       |
| `1 << 3`  | `1000`   | 8       |
| `1 << 4`  | `10000`  | 16      |
> [!check] Complexity
> Time Complexity: O(log² n)
> Space Complexity:

```java
class Solution {
    public int countNodes(TreeNode root) {
        if (root == null) {
            return 0;
        }

        int leftHeight = getHeight(root.left);
        int rightHeight = getHeight(root.right);

        if (leftHeight == rightHeight) {
            // Cây con trái là perfect tree
            return (1 << leftHeight) + countNodes(root.right);
        } else {
            // Cây con phải là perfect tree
            return (1 << rightHeight) + countNodes(root.left);
        }
    }

    private int getHeight(TreeNode node) {
        int height = 0;

        while (node != null) {
            height++;
            node = node.left;
        }

        return height;
    }
}
```
