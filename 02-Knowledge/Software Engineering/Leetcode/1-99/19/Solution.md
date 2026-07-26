---
title: Daily-Note
summary: A short description will make the document more useful.
tags:
  - daily
created: 2026-05-20
---
> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity: O(1)

```java
class Solution {  
    public ListNode removeNthFromEnd(ListNode head, int n) {  
        if (head == null) return null;  
  
        ListNode previous = null;  
        ListNode current = head;  
        ListNode high = head;  
        for (int i = 1; i < n; i++) {  
            high = high.next;  
        }  
  
        while (high.next != null) {  
            previous = current;  
            current = current.next;  
            high = high.next;  
        }  
  
        if (current == head) return head.next;  
  
        previous.next = current.next;  
        current = null;  
  
        return head;  
    }  
}
```

