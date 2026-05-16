# Header

> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity: O(n)

```java
class Solution {  
    public int maxLevelSum(TreeNode root) {  
        Queue<TreeNode> queue = new LinkedList<>();  
        queue.add(root);  
  
        int max = -Integer.MAX_VALUE;  
        int level = 0;  
        int result = 0;  
  
        while (!queue.isEmpty()) {  
            int size = queue.size();  
            level++;  
  
            int sum = 0;  
            for (int i = 0; i < size; i++) {  
                TreeNode node = queue.poll();  
                sum = sum + node.val;  
  
                if (node.left != null) queue.add(node.left);  
                if (node.right != null) queue.add(node.right);  
            }  
  
            if (sum > max) {  
                max = sum;  
                result = level;  
            }  
        }  
  
        return result;  
    }  
}
```
