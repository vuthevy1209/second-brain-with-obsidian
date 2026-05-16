> [!check] Complexity
> **Time Complexity:** O(n2)
> **Space Complexity:** O(n2)

``` java
import java.util.*;  
  
class Solution {  
    public int equalPairs(int[][] grid) {  
        Map<List<Integer>, Integer> mapRow = new HashMap<>(grid.length);  
  
        for (int i = 0; i < grid.length; i++) {  
            List<Integer> list = Arrays.stream(grid[i]).boxed().toList();  
            mapRow.put(list, mapRow.getOrDefault(list, 0) + 1);  
        }  
  
        int count = 0;  
        // check with each column  
        for (int i = 0; i < grid.length; i++) {  
            List<Integer> list = new ArrayList<>();  
            for (int j = 0; j < grid.length; j++) {  
                list.add(grid[j][i]);  
            }  
            count += mapRow.getOrDefault(list, 0);  
        }  
  
        return count;  
    }  
}
```

### Complexity Analysis

![[Solution-1778684698643.webp]]
![[Solution-1778684711594.webp]]
