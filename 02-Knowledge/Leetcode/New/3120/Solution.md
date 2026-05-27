> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity: O(n)

```java
class Solution {  
    public int numberOfSpecialChars(String word) {  
        Set<Character> set = new HashSet();  
        for (int i = 0; i < word.length(); i++) {  
            char c = word.charAt(i);  
            if (c >= 'a' && c <= 'z'){  
                set.add(c);  
            }  
        }  
  
        int count = 0;  
        for (int i = 0; i < word.length(); i++) {  
            char c = word.charAt(i);  
            if (c >= 'A' && c <= 'Z' && 
			            set.contains(Character.toLowerCase(c))) {  
                set.remove(Character.toLowerCase(c));  
                count++;  
            }  
        }  
  
        return count;  
    }  
}
```

# Improve

```java
class Solution {  
  
    public int numberOfSpecialChars(String word) {  
  
        boolean[] lower = new boolean[26];  
        boolean[] upper = new boolean[26];  
  
        // Traverse string  
        for (char ch : word.toCharArray()) {  
  
            // lowercase  
            if (Character.isLowerCase(ch)) {  
                lower[ch - 'a'] = true;  
            }  
  
            // uppercase  
            else {  
                upper[ch - 'A'] = true;  
            }  
        }  
  
        int count = 0;  
  
        // Check both exist  
        for (int i = 0; i < 26; i++) {  
  
            if (lower[i] && upper[i]) {  
                count++;  
            }  
        }  
  
        return count;  
    }  
}
```