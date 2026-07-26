# Dùng Min heap

Có mảng `costs[]`, mỗi phiên tuyển dụng:

- Xét **`candidates` phần tử đầu** và **`candidates` phần tử cuối** của mảng còn lại
- Chọn phần tử **nhỏ nhất** (nếu bằng nhau thì chọn **index nhỏ hơn**)
- Loại phần tử đó khỏi mảng, cộng vào tổng

Làm **k lần**, trả về **tổng chi phí**.
![[Solution-1779173231678.webp]]

> [!check] Complexity
> Time Complexity: O((k + candidates) × log(candidates))
> - Khởi tạo 2 heap: O(candidates × log(candidates))
> - Vòng lặp k lần, mỗi lần poll/offer heap: O(k × log(candidates))
> - Heap luôn có tối đa `candidates` phần tử → mỗi thao tác poll/offer tốn O(log(candidates))
> 
> Space Complexity: O(candidates)
> - 2 heap, mỗi cái tối đa `candidates` phần tử → O(candidates)

```java
class Solution {  
    public long totalCost(int[] costs, int k, int candidates) {  
        int i = 0;  
        int j = costs.length - 1;  
        PriorityQueue<Integer> minHeapLeft = new PriorityQueue<>();  
        PriorityQueue<Integer> minHeapRight = new PriorityQueue<>();  
  
        while (i < candidates) {  
            minHeapLeft.offer(costs[i]);  
            i++;  
        }  
  
        int cnt = 0;  
        while (cnt < candidates) {  
            if (j >= i) { // tránh thêm phần tử đã có trong left heap  
                minHeapRight.offer(costs[j]);  
                j--;  
            }  
            cnt++;  
        }  
  
        long cost = 0;  
  
        while (k != 0 && i <= j) {  
            int min1 = minHeapLeft.peek();  
            int min2 = minHeapRight.peek();  
  
            if (min1 <= min2) {  
                cost += minHeapLeft.poll();  
                if (i <= j) {  
                    minHeapLeft.offer(costs[i]);  
                    i++;  
                }  
            } else {  
                cost += minHeapRight.poll();  
                if (i <= j) {  
                    minHeapRight.offer(costs[j]);  
                    j--;  
                }  
            }  
            k--;  
        }  
  
        while (k != 0) {  
            int min1 = minHeapLeft.isEmpty() ? Integer.MAX_VALUE : minHeapLeft.peek();  
            int min2 = minHeapRight.isEmpty() ? Integer.MAX_VALUE : minHeapRight.peek();  
  
            if (min1 <= min2)  
                cost += minHeapLeft.poll();  
            else  
                cost += minHeapRight.poll();  
  
            k--;  
        }  
  
        return cost;  
    }  
}
```

