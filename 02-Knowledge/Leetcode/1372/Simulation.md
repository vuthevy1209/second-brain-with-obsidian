---

excalidraw-plugin: parsed
tags: [excalidraw]

---
==⚠  Switch to EXCALIDRAW VIEW in the MORE OPTIONS menu of this document. ⚠== You can decompress Drawing data with the command palette: 'Decompress current Excalidraw file'. For more info check in plugin settings under 'Saving'


# Excalidraw Data

## Text Elements
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

        return maxZigZagLength;
    }
} ^FEu2pXQr

max = 0 ^BAtpsTKJ

## Embedded Files
dc076e77346de46dcd5b6d7baaccc896199063e9: [[Pasted Image 20260516102055_077.png]]

%%
## Drawing
```compressed-json
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

0i6O326rAEkjoBAnCEbMrPEiAA==
```
%%