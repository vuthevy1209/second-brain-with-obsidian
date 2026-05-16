
``` java
import java.util.LinkedList;  
import java.util.Queue;  
  
class RecentCounter {  
  
    Queue<Integer> queue;  
  
    public RecentCounter() {  
        this.queue = new LinkedList<>();  
    }  
  
    public int ping(int t) {  
        this.queue.add(t);  
        int left = t - 3000;  
        int right = t;  
  
        while (!queue.isEmpty() && queue.peek() < left) {  
            queue.poll();  
        }  
  
        return queue.size();  
    }  
}
```