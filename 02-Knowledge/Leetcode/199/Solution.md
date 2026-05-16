# Time Limit Exceed

![[Solution-1778927660304.webp]]

**Bạn đang enqueue `null` nodes vào queue** — đây là root cause.

Khi một node là `null`, bạn vẫn tiếp tục thêm `null, null` vào queue. Điều này khiến queue tăng trưởng **theo cấp số nhân** (exponential), dù cây thực tế chỉ có vài node.

Ví dụ với cây lệch hoàn toàn (skewed tree) sâu `n` tầng:
- Tầng 1: 1 node thật + 1 null → enqueue 2 nulls
- Tầng 2: 2 nulls → enqueue 4 nulls
- Tầng k: enqueue `2^k` nulls

<mark style="background:#d3f8b6">→ Tổng số phần tử được enqueue: **O(2^n)** thay vì O(n).</mark>

> [!check] Complexity
> Time Complexity: O(2^h) với h = số tầng
> - Tổng số node được enqueue là 2^h (kể cả node null và 2 con null của null mà ta giả sử)
> 
> Space Complexity: O(2^k + n) với n = số node
> - `stacks` O(n) Mỗi tầng chỉ lưu node thật
> - `queue` O(2^k) Tại tầng cuối queue chứa 2^n nulls

```java
class Solution {  
    int maxDepth(TreeNode node) {  
        if (node == null) return 0;  
        if (node.left == null && node.right == null) return 1;  
  
        return Math.max(1 + maxDepth(node.left), 1 + maxDepth(node.right));  
    }  
  
    public List<Integer> rightSideView(TreeNode root) {  
        if (root == null) return new ArrayList<>();  
        if (root.left == null && root.right == null) return List.of(root.val);  
  
        int maxDepth = maxDepth(root);  
  
        // init  
        List<Stack<Integer>> stacks = new ArrayList<>(maxDepth);  
        for (int i = 0; i < maxDepth; i++) {  
            stacks.add(new Stack<>());  
        }  
  
        Queue<TreeNode> queue = new LinkedList<>();  
        queue.add(root);  
  
        int countNode = 0;  
        int depth = 0;  
        while (!queue.isEmpty()) {  
            TreeNode node = queue.poll();  
  
            countNode++;  
            if (countNode > Math.pow(2, depth)) {  
                countNode = 1;  
                depth++;  
                if (depth > maxDepth) break;  
            }  
  
            if (node != null) {  
                stacks.get(depth).push(node.val);  
            }  
  
            if (node == null) {  
                queue.add(null);  
                queue.add(null);  
            } else if (node.left == null) {  
                queue.add(null);  
                queue.add(node.right);  
            } else if (node.right == null) {  
                queue.add(node.left);  
                queue.add(null);  
            } else {  
                queue.add(node.left);  
                queue.add(node.right);  
            }  
        }  
  
        List<Integer> result = new ArrayList<>();  
        for (int i = 0; i < maxDepth; i++) {  
            result.add(stacks.get(i).pop());  
        }  
  
        return result;  
    }  
}
```


# Improve

> [!check] Complexity
> Time Complexity: O(n) với n = số node
> Space Complexity: O(n)

Hãy tự hỏi: _"Tại sao mình cần track null nodes?"_

Mục tiêu thực sự chỉ là biết **node nào ở cuối cùng bên phải mỗi tầng**. BFS theo từng tầng (level-by-level) có thể cho bạn biết điều đó mà **không cần null sentinel** — chỉ cần xử lý các node thật, và biết khi nào hết một tầng.

Gợi ý: dùng **kích thước của queue tại đầu mỗi vòng lặp tầng** thay vì dùng `countNode` và `Math.pow`.

``` java
class Solution {
    public List<Integer> rightSideView(TreeNode root) {
        List<Integer> result = new ArrayList<>();
        if (root == null) return result;

        Queue<TreeNode> queue = new LinkedList<>();
        queue.add(root);

        while (!queue.isEmpty()) {
            int levelSize = queue.size();

            for (int i = 0; i < levelSize; i++) {
                TreeNode node = queue.poll();

                if (i == levelSize - 1) {
                    result.add(node.val);
                }

                if (node.left != null) queue.add(node.left);
                if (node.right != null) queue.add(node.right);
            }
        }

        return result;
    }
}
```

**Nhận xét:** Ngay trước khi bắt đầu xử lý một tầng, **toàn bộ queue lúc đó chính xác là các node của tầng đó** — không hơn, không kém.
#### Time Complexity: **O(n)**

Mỗi node được **enqueue 1 lần, dequeue 1 lần** — không node nào bị xử lý lại.

#### Space Complexity: **O(n)**

Queue tại bất kỳ thời điểm nào chứa **tối đa một tầng**. Tầng rộng nhất của cây nhị phân có thể chứa **n/2 node** (tầng cuối) → O(n).

```
        1
       / \
      2   3
     / \ / \
    4  5 6  7   ← tầng này có n/2 node
```

> `result` cũng tốn O(n) nhưng đây là output space, thường không tính vào space complexity.

