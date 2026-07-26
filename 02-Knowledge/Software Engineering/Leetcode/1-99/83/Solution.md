

> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity: O(1)

```java
class Solution {  
    public ListNode deleteDuplicates(ListNode head) {  
        if (head == null || head.next == null) return head;  
  
        ListNode temp = head;  
        while (temp.next != null) {  
            while (temp.next != null && temp.val == temp.next.val) {  
                ListNode delNode = temp.next;  
                temp.next = delNode.next;  
                delNode.next = null;  
            }  
  
            if (temp.next != null)  
                temp = temp.next;  
        }  
  
        return head;  
    }  
}
```

## Đơn giản hơn

```java
class Solution {
    public ListNode deleteDuplicates(ListNode head) {
        ListNode temp = head;
        while (temp != null && temp.next != null) {
            if (temp.val == temp.next.val)
                temp.next = temp.next.next;
            else
                temp = temp.next;
        }
        return head;
    }
}
```