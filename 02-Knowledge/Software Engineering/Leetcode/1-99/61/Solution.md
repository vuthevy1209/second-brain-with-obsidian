# Dùng Dequeue

> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity: O(n)

```java
class Solution {  
    public ListNode rotateRight(ListNode head, int k) {  
        if (head == null || head.next == null) return head;  
  
        int count = 0;  
  
        Deque<Integer> deque = new LinkedList<>();  
        ListNode temp = head;  
        while (temp != null) {  
            deque.addLast(temp.val);  
            temp = temp.next;  
            count++;  
        }  
  
        k = k % count;  
  
        for (int i = 1; i <= k; i++) {  
            Integer last = deque.pollLast();  
            deque.addFirst(last);  
        }  
  
        temp = head;  
        while (temp != null && !deque.isEmpty()) {  
            temp.val = deque.pollFirst();  
            temp = temp.next;  
        }  
  
        return head;  
    }  
}
```

# Dùng phép chia dư và thay đổi con trỏ trực tiếp => không dùng thêm space

> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity: O(1)

```java
class Solution {  
    public ListNode rotateRight(ListNode head, int k) {  
        if (head == null || head.next == null) return head;  
  
        int count = 0;  
        ListNode temp = head;  
        while (temp != null) {  
            temp = temp.next;  
            count++;  
        }  
        k = k % count;  
  
        ListNode lo = head;  
        ListNode hi = head;  
        while (k != 0) {  
            hi = hi.next;  
            k--;  
        }  
  
        while (hi.next != null) {  
            lo = lo.next;  
            hi = hi.next;  
        }  
  
        hi.next = head;  
        head = lo.next;  
        lo.next = null;  
  
  
        return head;  
    }  
}
```
