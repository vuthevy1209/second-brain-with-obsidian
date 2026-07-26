# Sliding window

> [!check] Complexity
> Time Complexity: O(n * k): với k = 10
> Space Complexity: O(n)

```java
class Solution {  
    public List<String> findRepeatedDnaSequences(String s) {  
        Map<String, Integer> hashMap = new HashMap<>();  
        List<String> ans = new ArrayList<>();  
        if (s.length() < 10) return ans;  
  
        int lo = 0;  
        StringBuilder sub = new StringBuilder();  
        for (int hi = 0; hi < s.length(); hi++) {  
            sub.append(s.charAt(hi));  
            if (sub.length() == 10) {  
                String dna = sub.toString();  
                hashMap.put(dna, hashMap.getOrDefault(dna, 0) + 1);  
                sub.deleteCharAt(0);  
                lo++;  
            }  
        }  
  
        for (Map.Entry<String, Integer> entry : hashMap.entrySet()) {  
            if (entry.getValue() > 1)  
                ans.add(entry.getKey());  
        }  
  
        return ans;  
    }  
}
```
