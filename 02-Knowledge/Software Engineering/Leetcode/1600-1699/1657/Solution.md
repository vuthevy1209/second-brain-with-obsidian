> [!check] Time Complexity
> **Time Complexity:** O(nlogk) with n = length of word1 and word2, k = the count of distinct character in word1 or word2. Because, We are using sort algorithm. But k <= 26, so simplify O(n).
> **Space Complexity:** O(k) but k <= 26 => simplify O(1)


``` java
import java.util.*;  
  
class Solution {  
    public boolean closeStrings(String word1, String word2) {  
        int lengthWord1 = word1.length();  
        int lengthWord2 = word2.length();  
        
        // if two string is not the same lenth => false
        if (lengthWord1 != lengthWord2) return false;  
  
        Map<Character, Integer> map1 = new TreeMap<>();  
        Map<Character, Integer> map2 = new TreeMap<>();  
  
        for (int i = 0; i < lengthWord1; i++) {  
            char c1 = word1.charAt(i);  
            char c2 = word2.charAt(i);  
  
            map1.put(c1, map1.getOrDefault(c1, 0) + 1);  
            map2.put(c2, map2.getOrDefault(c2, 0) + 1);  
        }  
  
        // Set key  
        Set<Character> keySet1 = map1.keySet();  
        Set<Character> keySet2 = map2.keySet();  
  
        // List value đã sort  
        List<Integer> valueList1 = new ArrayList<>(map1.values());  
        List<Integer> valueList2 = new ArrayList<>(map2.values());  
        Collections.sort(valueList1);  
        Collections.sort(valueList2);  
  
        if (keySet1.equals(keySet2) && valueList1.equals(valueList2)) 
            return true;  
            
        return false;  
    }  
}
```


