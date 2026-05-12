This solution is using Map to keep track of the number of vowels.

> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity: O(1)


``` java
import java.util.HashMap;  
import java.util.Map;  
  
class Solution {  
  
    public int countVowels(Map<Character, Integer> vowels) {  
        int count = 0;  
        for (Map.Entry<Character, Integer> entry : vowels.entrySet()) {  
            count = count + entry.getValue();  
        }  
  
        return count;  
    }  
  
    public int maxVowels(String s, int k) {  
        Map<Character, Integer> vowels = new HashMap<>();  
        vowels.put('u', 0);  
        vowels.put('e', 0);  
        vowels.put('i', 0);  
        vowels.put('a', 0);  
        vowels.put('o', 0);  
  
        for (int i = 0; i < k; i++) {  
            char c = s.charAt(i);  
            if (vowels.containsKey(c)) {  
                vowels.put(c, vowels.getOrDefault(c, 0) + 1);  
            }  
        }  
  
        int result = countVowels(vowels);  
  
        int left = 0;  
  
        for (int right = k; right < s.length(); right++) {  
            char cLeft = s.charAt(left);  
            if (vowels.containsKey(cLeft)) {  
                vowels.put(cLeft, vowels.getOrDefault(cLeft, 0) - 1);  
            }  
  
            char cRight = s.charAt(right);  
            if (vowels.containsKey(cRight)) {  
                vowels.put(cRight, vowels.getOrDefault(cRight, 0) + 1);  
            }  
  
            result = Math.max(result, countVowels(vowels));  
            left++;  
        }  
  
        return result;  
    }  
}
```



# More improved

> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity: O(1)

``` java
class Solution {  
  
    public boolean isVowels(Character c) {  
        return c == 'u' || c == 'e' || c == 'i' || c == 'a' || c == 'o';  
    }  
  
    public int maxVowels(String s, int k) {  
        int countVowels = 0;  
  
        for (int i = 0; i < k; i++) {  
            char c = s.charAt(i);  
            if (isVowels(c)) countVowels++;  
        }  
  
        int result = countVowels;  
  
        int left = 0;  
  
        for (int right = k; right < s.length(); right++) {  
            char cLeft = s.charAt(left);  
            if (isVowels(cLeft)) {  
                countVowels--;  
            }  
  
            char cRight = s.charAt(right);  
            if (isVowels(cRight)) {  
                countVowels++;  
            }  
  
            result = Math.max(result, countVowels);  
            left++;  
        }  
  
        return result;  
    }  
}
```