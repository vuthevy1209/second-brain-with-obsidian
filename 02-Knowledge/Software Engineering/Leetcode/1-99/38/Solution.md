> [!check] Complexity
> Time Complexity: 
> Space Complexity: O(n): n call stack

```java
class Solution {  
    public String hash(String s) {  
        StringBuilder ans = new StringBuilder();  
  
  
        for (int i = 0; i < s.length(); i++) {  
            char c = s.charAt(i);  
            int count = 0;  
  
            while (i < s.length() && s.charAt(i) == c) {  
                i++;  
                count++;  
            }  
  
            ans.append(String.valueOf(count)).append(String.valueOf(c));  
            i--;  
        }  
  
        return ans.toString();  
    }  
  
    public String countAndSay(int n) {  
        if (n == 1) return "1";  
  
        return hash(countAndSay(n - 1));  
    }  
}
```
