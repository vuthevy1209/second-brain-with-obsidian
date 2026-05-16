# Header

> [!check] Complexity
> Time Complexity: O(n) n = the number of node of entire tree.
> Space Complexity: O(h) h = the depth tree
> - ap  = [root, ..., p]  → O(h) phần tử
> - aq  = [root, ..., q]  → O(h) phần tử
> - call stack đệ quy     → O(h)
> - The worse case: cây lệch => h = n => O(n)

```java
class Solution {  
    boolean dfs(TreeNode node, TreeNode target, List<TreeNode> ancestors) {  
        if (node == null) return false;  
  
        ancestors.add(node);  
        if (node == target) return true;  
  
        if (dfs(node.left, target, ancestors)) return true;  
        if (dfs(node.right, target, ancestors)) return true;  
  
        ancestors.removeLast(); // backtrack  
        return false;  
    }  
  
    public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {  
        List<TreeNode> ap = new ArrayList<>();  
        List<TreeNode> aq = new ArrayList<>();  
        dfs(root, p, ap);  
        dfs(root, q, aq);  
  
        // compare two lists and find the last identical value.  
        int i = 0;  
        while (i < ap.size() && i < aq.size()){  
            if (ap.get(i) != aq.get(i)) break;  
            i++;  
        }  
  
        return ap.get(i-1);  
    }  
}
```
