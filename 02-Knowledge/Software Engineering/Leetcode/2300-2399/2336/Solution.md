- Dùng biến count để giả lập vô hạn tập hợp từ 1 đến infinity
- Dùng priority queue để tận dụng Min Heap. Thao tác lấy là O(logN)

```java
class SmallestInfiniteSet {  
  
    PriorityQueue<Integer> priorityQueue;  
    int count = 1;  
  
    public SmallestInfiniteSet() {  
        // Assume that this queue is infinite  
        // count = 1, means, top queue = 1        
        this.priorityQueue = new PriorityQueue<>();  
    }  
  
    public int popSmallest() {  
        int top = 0;  
        if (priorityQueue.isEmpty()){  
            top = count;  
            count++;  
            return top;  
        }  
  
        top = priorityQueue.poll();  
        if (top >= count) {  
            count++;  
        }  
  
        return top;  
    }  
  
    public void addBack(int num) {  
        if (num >= count) return;  
        else {  
            if (priorityQueue.contains(num)) return;  
            priorityQueue.offer(num);  
        }  
    }  
}
```
