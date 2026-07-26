---

excalidraw-plugin: parsed
tags: [excalidraw]

---
==⚠  Switch to EXCALIDRAW VIEW in the MORE OPTIONS menu of this document. ⚠== You can decompress Drawing data with the command palette: 'Decompress current Excalidraw file'. For more info check in plugin settings under 'Saving'


# Excalidraw Data

## Text Elements
flood at each node and calculate the total when 
arriving at new nodes (counting from the flooded node)
   => if total = sumTarget => valid   ^bJtYAdqU

BFS to traverse the entire tree, at each node => flood ^EVutxJj6

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
} ^KUd9uFGz

## Embedded Files
8c5cc8502faba4a2caf4aa2184a238f32ed90d77: [[Pasted Image 20260515222508_167.png]]

%%
## Drawing
```compressed-json
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
```
%%