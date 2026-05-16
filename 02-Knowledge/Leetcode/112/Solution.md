> [!check] Complexity
> Time Complexity: O(n) because at each node => O(1) and the flood function traverses the entire tree (n node)
> Space Complexity: O(H) H = max tree depth

```java
class Solution {  
    int countPath = 0;  
  
    void flood(TreeNode node, long targetSum, long sum) {  
        if (node == null) return;  
  
        sum += node.val;  
        if (sum == targetSum && node.left == null && node.right == null)  
            countPath++;  
  
        flood(node.left, targetSum, sum);  
        flood(node.right, targetSum, sum);  
    }  
  
    public boolean hasPathSum(TreeNode root, int targetSum) {  
        if (root == null) return false;  
  
        flood(root, targetSum, 0);  
  
        return countPath != 0;  
    }  
}
```