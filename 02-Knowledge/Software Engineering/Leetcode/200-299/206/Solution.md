> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity: O(1)

``` java
class Solution {  
    public ListNode reverseList(ListNode head) {  
        ListNode temp = null;  
        ListNode newHead = null;  
  
        while (head != null) {  
            if (head.next == null) newHead = head;  
  
            ListNode current = head;  
            head = head.next;  
            current.next = temp;  
            temp = current;  
        }  
  
        return newHead;  
    }  
}
```

## Using Recursively

> [!check] Complexity
> Time Complexity: O(n) Each call does **O(1)** work → total **O(n) time, O(n) space** (stack).
> Space Complexity: O(n) The recursion stack goes `n` levels deep (one frame per node), so stack space is linear.

``` java
class Solution {
    public ListNode reverseList(ListNode head) {
        if (head == null || head.next == null) return head;

        ListNode newHead = reverseList(head.next);

        // head.next is already pointing to the tail of reversed sublist
        head.next.next = head;
        head.next = null;

        return newHead;
    }
}
```