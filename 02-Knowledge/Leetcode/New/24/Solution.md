> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity: O(1)

```java
class Solution {  
    public ListNode swapPairs(ListNode head) {  
        if (head == null || head.next == null) return head;  
  
        // swap head  
        ListNode temp = head.next;  
        head.next = temp.next;  
        temp.next = head;  
        head = temp;  
  
        ListNode node = head.next.next;  
        ListNode previous = head.next;  
  
        while (node != null) {  
            temp = node.next;  
            if (temp == null) break;  
            node.next = temp.next;  
            temp.next = node;  
            previous.next = temp;  
  
            previous = temp.next;  
            node = temp.next.next;  
        }  
  
        return head;  
    }  
}
```

