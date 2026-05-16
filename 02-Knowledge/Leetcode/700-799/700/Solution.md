# Header

> [!check] Complexity
> Time Complexity: O(h) h = max depth
> Space Complexity: O(h)

```java
class Solution {  
    public TreeNode searchBST(TreeNode root, int val) {  
        if (root == null) return null;  
        Stack<TreeNode> stack = new Stack<>();  
        stack.push(root);  
  
        while (!stack.isEmpty()) {  
            TreeNode node = stack.pop();  
            if (node == null) continue;  
  
            if (node.val == val) return node;  
            else if (val < node.val) {  
                stack.push(node.left);  
            } else {  
                stack.push(node.right);  
            }  
        }  
  
        return null;  
    }  
}
```
