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
    public ListNode deleteMiddle(ListNode head) {  
        if (head.next == null) return null;  
  
        int count = 0;  
        ListNode temp = head;  
        while (temp != null) {  
            count++;  
            temp = temp.next;  
        }  
  
        int mid = (count / 2) + 1;  
  
        temp = head;  
        count = 0;  
        ListNode previous = null;  
  
        while (temp != null) {  
            count++;  
            previous = temp;  
            temp = temp.next;  
  
            if (count == mid - 1) {  
                previous.next = temp.next;  
                break;  
            }  
        }  
  
        return head;  
  
    }  
}
```