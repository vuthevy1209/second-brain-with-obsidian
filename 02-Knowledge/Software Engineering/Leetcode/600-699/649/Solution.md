> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity: O(n)

``` java
import java.util.*;  
  
class Solution {  
    public String predictPartyVictory(String senate) {  
        Queue<Integer> radiant = new LinkedList<>();  
        Queue<Integer> dire = new LinkedList<>();  
  
        // Lưu index của từng senator  
        for (int i = 0; i < senate.length(); i++) {  
            if (senate.charAt(i) == 'R') radiant.offer(i);  
            else dire.offer(i);  
        }  
  
        // So sánh và ban nhau  
        while (!radiant.isEmpty() && !dire.isEmpty()) {  
            int r = radiant.poll();  
            int d = dire.poll();  
  
            // Ai có index nhỏ hơn thì hành động trước => thắng  
            if (r < d)  
                radiant.offer(r + senate.length()); // R thắng, vào vòng tiếp  
            else  
                dire.offer(d + senate.length());    // D thắng, vào vòng tiếp  
        }  
  
        return radiant.isEmpty() ? "Dire" : "Radiant";  
    }  
}
```