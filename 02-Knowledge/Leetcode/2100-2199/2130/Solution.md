> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity: O(n)

``` java
class Solution {  
    public int pairSum(ListNode head) {  
        Stack<Integer> stack = new Stack<>();  
        int count = 0;  
  
        ListNode temp = head;  
        while (temp != null){  
            count++;  
            stack.push(temp.val);  
            temp = temp.next;  
        }  
  
        int numberOfPairs = count / 2;  
        int max = 0;  
        count = 0;  
        temp = head;  
  
        while (count != numberOfPairs) {  
            count++;  
            int val = temp.val;  
            int twin = stack.pop();  
  
            max = Math.max(max, val + twin);  
            temp = temp.next;  
        }  
  
        return max;  
    }  
}
```

# Improve (No additional Data structure)

- Use reverse the other half of the list

> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity: O(1)

``` java
class Solution {  
    public int pairSum(ListNode head) {  
        ListNode slow = head;  
        ListNode fast = head;  
  
        while (fast != null && fast.next != null) {  
            slow = slow.next;  
            fast = fast.next.next;  
        }  
  
        ListNode prev = null;  
        ListNode curr = slow;  
  
        while (curr != null) {  
            ListNode nextNode = curr.next;  
            curr.next = prev;  
            prev = curr;  
            curr = nextNode;  
        }  
  
        ListNode first = head;  
        ListNode second = prev;  
  
        int maxSum = 0;  
  
        while (second != null) {  
            int sum = first.val + second.val;  
            maxSum = Math.max(maxSum, sum);  
  
            first = first.next;  
            second = second.next;  
        }  
  
        return maxSum;  
    }  
}
```