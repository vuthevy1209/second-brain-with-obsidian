# Max heap

> [!check] Complexity
> Time Complexity: O(nlogn)
> Space Complexity: O(k)

```java
class Solution {  
    public int[] maxSlidingWindow(int[] nums, int k) {  
        List<Integer> ans = new ArrayList<>();  
        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());  
  
        for (int i = 0; i < nums.length; i++) {  
            maxHeap.add(nums[i]);  
            if (i >= k) {  
                maxHeap.remove(nums[i - k]);  
            }  
  
            if (maxHeap.size() == k) {  
                ans.add(maxHeap.peek());  
            }  
        }  
  
        return ans.stream().mapToInt(Integer::intValue).toArray();  
    }  
}
```


# Dequeue

> [!check] Complexity
> Time Complexity: 
> Space Complexity:

```java
import java.util.ArrayList;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;

class Solution {
    public int[] maxSlidingWindow(int[] nums, int k) {
        int n = nums.length;
        List<Integer> ansList = new ArrayList<>();
        Deque<Integer> dq = new ArrayDeque<>(); 

        for (int i = 0; i < n; i++) {
            // Xóa index đã ra khỏi window ở front
            if (!dq.isEmpty() && dq.peekFirst() < i - k + 1)
                dq.pollFirst();

            // Xóa các index ở back có giá trị <= nums[i] (vô dụng)
            while (!dq.isEmpty() && nums[dq.peekLast()] <= nums[i])
                dq.pollLast();

            dq.offerLast(i);

            // Bắt đầu ghi kết quả khi window đủ k phần tử
            if (i >= k - 1) {
                ansList.add(nums[dq.peekFirst()]);
            }
        }

        // Sử dụng Stream để convert List<Integer> thành int[] trên 1 dòng
        return ansList.stream().mapToInt(Integer::intValue).toArray();
    }
}    
```
