> [!check] Complexity
> Time:  O(N + L×H)  →  worst case O(N²)
> Space: O(N + L×H)  →  worst case O(N²)
>     N = tổng số node, L = số lá thỏa mãn, H = chiều cao cây


``` java
class Solution {  
    int countPath = 0;  
    List<List<Integer>> results = new ArrayList<>();  
  
    void flood(TreeNode node, long targetSum, long sum, List<Integer> path) {  
        if (node == null) return; 
  
        sum += node.val;  
        path.add(node.val);  
        if (sum == targetSum && node.left == null && node.right == null) {  
            countPath++;  
            List<Integer> copyPath = List.copyOf(path);  
            results.add(copyPath);  
        }  
  
        flood(node.left, targetSum, sum, path);  
        flood(node.right, targetSum, sum, path);  
  
        // backtrack  
        path.removeLast();  
    }  
  
    public List<List<Integer>> pathSum(TreeNode root, int targetSum) {  
        if (root == null) return results;  
        List<Integer> path = new ArrayList<>();  
        flood(root, targetSum, 0, path);  
  
        return results;  
    }  
}
```

![[Solution-1778899788153.webp]]
