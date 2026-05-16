> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity: O(1)

``` java
class ListNode {  
  int val;  
  ListNode next;  
  ListNode() {}  
  ListNode(int val) {  
      this.val = val;  
  }  
  ListNode(int val, ListNode next) {  
      this.val = val;  
      this.next = next;  
  }  
}  
  
class Solution {  
    public ListNode oddEvenList(ListNode head) {  
        if (head == null || head.next == null) return head;  
        ListNode lastNode = null;  
  
        int count = 0;  
        ListNode temp = head;  
        while (temp != null) {  
            count++;  
  
            if (count % 2 == 1) {  
                lastNode = temp;  
            }  
  
            temp = temp.next;  
        }  
  
        ListNode checkLastOddNode = lastNode;  
        ListNode evenLastNode = lastNode.next != null ? lastNode.next : null;  
  
        temp = head;  
        while (temp != checkLastOddNode) {  
            ListNode evenNode = temp.next;  
            temp.next = evenNode.next;  
            evenNode.next = null;  
            lastNode.next = evenNode;  
            lastNode = evenNode;  
  
            temp = temp.next;  
        }  
  
        lastNode.next = evenLastNode;  
  
        return head;  
    }  
}
```


# Better Way

``` java
class Solution {  
  
  
    // Approach  
    // - Maintain odd pointer    
    // - Maintain even pointer    
    // - Maintain evenHead pointer  
    public ListNode oddEvenList(ListNode head) {  
  
        // List with 0 or 1 elements  
        if (head == null || head.next == null) {  
            return head;  
        }  
  
        ListNode odd = head;  
        ListNode even = head.next;  
        ListNode evenHead = even;  
  
        while (even != null && even.next != null) {  
  
            odd.next = even.next;  
            odd = odd.next;  
  
            even.next = odd.next;  
            even = even.next;  
        }  
  
        odd.next = evenHead;  
  
        return head;  
    }  
}
```

