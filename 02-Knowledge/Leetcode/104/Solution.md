
# Use Recursion

> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity: O(n)

``` java
class Solution {  
    public int maxDepth(TreeNode root) {  
        if (root == null) return 0;  
        // leaf node  
        if (root.left == null && root.right == null) return 1;  
  
        int maxLeft = maxDepth(root.left);
		int maxRight = maxDepth(root.right);
  
        return 1 + Math.max(maxLeft, maxRight);  
    }  
}
```

#### Time Complexity — O(n)

The function visits **every node exactly once**, where n is the total number of nodes.

- At each node, only O(1) work is done (comparison + max)
- The two early-exit checks (`root == null`, leaf node) don't reduce the asymptotic complexity 
- In the worst case (a skewed tree with no leaves until the end), nearly every node is visited anyway

#### Space Complexity — O(h)

Space is consumed by the **call stack** during recursion, where h is the height of the tree.


# DFS

- BFS is also similar (use Queue instead Stack)

``` java
class Pair {  
    TreeNode node;  
    int depth;  
  
    Pair(TreeNode node, int depth) {  
        this.node = node;  
        this.depth = depth;  
    }  
}  
  
  
class Solution {  
    public int maxDepth(TreeNode root) {  
        if (root == null) return 0;  
  
        int maxDepth = 0;  
        Stack<Pair> stack = new Stack<>();  
        stack.push(new Pair(root, 1));  
  
        while (!stack.empty()) {  
            Pair top = stack.pop();  
  
            if (top.node.left == null && top.node.right == null) {  
                maxDepth = Math.max(top.depth, maxDepth);  
            }  
  
            if (top.node.left != null) 
		        stack.push(new Pair(top.node.left, top.depth + 1));  
            if (top.node.right != null) 
	            stack.push(new Pair(top.node.right, top.depth + 1));  
        }  
  
        return maxDepth;  
    }  
}
```

