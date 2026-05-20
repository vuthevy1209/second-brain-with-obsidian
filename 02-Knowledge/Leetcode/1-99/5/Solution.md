- Khác với bên Simulation. Ở đây tại mỗi i, ta xét luôn cả 2 trường hợp mở rộng (của cả chẵn và lẻ) cho mọi chuỗi.

> [!check] Complexity
> Time Complexity: O(n^2)
> - Vòng `for` chạy **n** lần
> - Mỗi lần gọi `expand()` tệ nhất expand ra **n/2** bước
> - Gọi 2 lần (odd + even) nhưng vẫn là O(n)
> 
> Space Complexity: O(n)

```java
class Solution {  
    public String longestPalindrome(String s) {  
        if (s.isEmpty()) return "";  
        if (s.length() == 1) return s;  
  
        int max = 0;  
        String ans = String.valueOf("");  
  
        for (int i = 0; i < s.length(); i++) {  
            // Odd: center tại i  
            String odd = expand(s, i, i);  
            // Even: center tại i và i+1  
            String even = expand(s, i, i + 1);  
  
            String better = odd.length() >= even.length() ? odd : even;  
            if (better.length() > max) {  
                max = better.length();  
                ans = better;  
            }  
        }  
  
        return ans;  
    }  
  
    private String expand(String s, int left, int right) {  
        while (left >= 0 && right <= s.length() - 1 
                       && s.charAt(left) == s.charAt(right)) {  
                left--;  
                right++;  
        }  
        // left+1 và right-1 vì đã đi quá 1 bước  
        return s.substring(left + 1, right);  
    }  
}
```
