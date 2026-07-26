# Recursive way

- Đệ quy tận dụng **call stack để tự động lưu node cha**, nên không cần quản lý thủ công như iterative.

> [!check] Complexity với N = số node
> Time Complexity: 
> - Balanced Tree O(logN).
> - Worse case => Skewed tree: O(N)
> 
> Space Complexity:
> - Balanced Tree O(logN): chồng call stack có thể tối đa là depth = logN tầng.
> - Worse case: Skewed tree: O(N) => Nếu N quá lớn có thể StackOverFlow

```java
class Solution {
    public TreeNode deleteNode(TreeNode root, int key) {
        if (root == null) return null;

        if (key < root.val) {
            root.left = deleteNode(root.left, key);
        } else if (key > root.val) {
            root.right = deleteNode(root.right, key);
        } else {
            // Tìm thấy node cần xóa
            if (root.left == null) return root.right;
            if (root.right == null) return root.left;

            // Có cả 2 con: tìm successor (nhỏ nhất bên phải)
            TreeNode successor = root.right;
            while (successor.left != null) successor = successor.left;

            root.val = successor.val;
            root.right = deleteNode(root.right, successor.val);
        }

        return root;
    }
}
```

```
						Xóa 5 khỏi cây:
						        5
						       / \
						      3   7
						     / \ / \
						    2  4 6  8
						
						1. root.val == 5 → có 2 con
						2. Successor = min(right subtree) = 6
						3. Gán root.val = 6
						4. Đệ quy xóa 6 khỏi cây con phải
						
						        6
						       / \
						      3   7
						     / \   \
						    2   4   8
```

# iterative Way

> [!check] Complexity
> Time Complexity: 
> Space Complexity:

```java
class Solution {  
    public TreeNode deleteNode(TreeNode root, int key) {  
        TreeNode parent = null;  
        TreeNode node = root;  
  
        // Tìm node cần xóa và node cha của nó  
        while (node != null && node.val != key) {  
            parent = node;  
            if (key < node.val)  
                node = node.left;  
            else  
                node = node.right;  
        }  
  
        if (node == null) return root;  
  
        node = replace(node);  
  
        // Nối cha với node thay thế  
        if (parent == null)  
            return node; // Xóa root  
        if (parent.left != null && parent.left.val == key)  
            parent.left  = node;  
        else  
            parent.right = node;  
  
        return root;  
    }  
  
    // Trả về node thay thế sau khi xóa  
    private TreeNode replace(TreeNode node) {  
        if (node.left == null && node.right == null) {  
            return null;  
        } else if (node.right == null) {  
            return node.left;  
        } else if (node.left == null) {  
            return node.right;  
        } else {  
            // Có cả 2 con: tìm successor (nhỏ nhất bên phải)  
            TreeNode successorParent = node;  
            TreeNode successor = node.right;  
            while (successor.left != null) {  
                successorParent = successor;  
                successor = successor.left;  
            }  
            // Tách successor khỏi vị trí cũ  
            if (successorParent == node)  
                successorParent.right = successor.right;  
            else  
                successorParent.left  = successor.right;  
  
            // Gắn 2 con của node bị xóa vào successor  
            successor.left  = node.left;  
            successor.right = node.right;  
            return successor;  
        }  
    }  
}
```
