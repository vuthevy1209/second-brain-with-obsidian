> [!check] Complexity
> Time Complexity: O(n) with n = s.length
> Space Complexity: O(n)


``` java
import java.util.Stack;  
  
class Solution {  
    public String removeStars(String s) {  
        Stack<Character> stack = new Stack<>();  
  
        for (int i = s.length() - 1; i >= 0; i--) {  
            stack.push(s.charAt(i));  
        }  
  
        StringBuilder result = new StringBuilder();  
  
        while (!stack.isEmpty()) {  
            Character c = stack.pop();  
            if (c == '*') {  
                result.deleteCharAt(result.length() - 1);  
            } else {  
                result.append(c);  
            }  
        }  
  
        return result.toString();  
    }  
}
```

## Improve

I can use the StringBuilder as Stack, and loop from left to right.

``` java
class Solution {
    public String removeStars(String s) {
        StringBuilder sb = new StringBuilder();

        for (char c : s.toCharArray()) {
            if (c == '*') {
                sb.deleteCharAt(sb.length() - 1);
            } else {
                sb.append(c);
            }
        }

        return sb.toString();
    }
}
```