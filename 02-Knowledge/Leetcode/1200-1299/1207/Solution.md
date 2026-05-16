> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity: O(n)

``` java
import java.util.HashMap;  
import java.util.HashSet;  
import java.util.Map;  
import java.util.Set;  
  
class Solution {  
    public boolean uniqueOccurrences(int[] arr) {  
        Map<Integer, Integer> map = new HashMap<>();  
  
        for (int i : arr) {  
            map.put(i, map.getOrDefault(i, 0) + 1);  
        }  
  
        Set<Integer> set = new HashSet<>();  
  
        for (Map.Entry<Integer, Integer> entry : map.entrySet()) {  
            set.add(entry.getValue());  
        }  
  
        return set.size() == map.size();  
    }  
}
```

