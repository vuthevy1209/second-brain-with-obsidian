## Intuition

Split the linked list into groups of k consecutive nodes, reverse each group, then reconnect them. If the last group has fewer than k nodes, leave it unchanged.

![[Solution-1779355391204.webp]]

## Approach

Traverse the list while counting nodes. Once we count exactly k nodes, we have all the information needed: `from` (group head), `end` (group tail), `pre` (node just before the group), and `next` (node just after the group).

The `reverse(from, end, pre, next)` helper reverses the segment `[from..end]` in-place by iterating from `from` to `end`, flipping each `next` pointer. It initializes `previous = next` so the tail of the reversed group automatically connects to the rest of the list. After reversing, `pre.next` is updated to point to `end` (the new group head).

Key bookkeeping after each reversal:

- `pre` becomes `from` (the old head is now the group tail, which connects to the next group)
- `from` advances to `from.next` (the start of the next unprocessed group)
- `count` resets to 0

Special case: if the very first group is reversed, `head` is updated to the new front node.

> [!check] Complexity
> Time Complexity: O(n)
> - each node is visited at most twice (once during counting, once during reversal)
> 
> Space Complexity: O(1)
> - only a constant number of pointers are used, no extra data structures

```java
class Solution {  
    ListNode reverse(ListNode from, ListNode end, ListNode pre, ListNode next) {  
        if (from == null || from.next == null) return from;  
        ListNode previous = next;  
        ListNode current = from;  
  
        while (current != end) {  
            ListNode temp = current.next;  
            current.next = previous;  
            previous = current;  
            current = temp;  
        }  
  
        end.next = previous;  
        if (pre != null)  
            pre.next = end;  
  
  
        return end;  
    }  
  
    public ListNode reverseKGroup(ListNode head, int k) {  
        if (head == null || head.next == null) return head;  
  
        ListNode from = head;  
        ListNode end = null;  
        ListNode pre = null;  
        ListNode next = null;  
  
        ListNode node = head;  
  
        boolean checkReverse = false;  
  
        int count = 0;  
        while (node != null) {  
            checkReverse = false;  
            count++;  
            if (count == k) {  
                end = node;  
                next = node.next;  
  
                ListNode x = reverse(from, end, pre, next);  
                if (from == head) head = x;  
                node = next;  
                checkReverse = true;  
  
                pre = from;  
                from = from.next;  
                count = 0;  
            }  
  
            if (!checkReverse)  
                node = node.next;  
        }  
  
        return head;  
    }  
}
```
