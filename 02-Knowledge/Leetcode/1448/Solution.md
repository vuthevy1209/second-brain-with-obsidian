> [!check] Complexity
> Time Complexity: 
> Space Complexity: 

```java
class Pair {  
    TreeNode node;  
    int maxValueInPath;  
  
    Pair(TreeNode node, int value) {  
        this.node = node;  
        this.maxValueInPath = value;  
    }  
}  
  
class Solution {  
    public int goodNodes(TreeNode root) {  
        Stack<Pair> stack = new Stack<>();  
        stack.push(new Pair(root, root.val));  
        int countGoodNode = 1;  
  
        while (!stack.isEmpty()) {  
            Pair top = stack.pop();  
  
            if (top.node.left != null) {  
                int maxValue = Math.max(top.maxValueInPath,
                                        top.node.left.val);  
                if (top.node.left.val >= top.maxValueInPath) {  
                    countGoodNode++;  
                }  
  
                stack.push(new Pair(top.node.left, maxValue));  
  
            }  
  
            if (top.node.right != null) {  
                int maxValue = Math.max(top.maxValueInPath, 
                                        top.node.right.val);  
                if (top.node.right.val >= top.maxValueInPath) {  
                    countGoodNode++;  
                }  
  
                stack.push(new Pair(top.node.right, maxValue));  
  
            }  
        }  
  
        return countGoodNode;  
    }  
}
```