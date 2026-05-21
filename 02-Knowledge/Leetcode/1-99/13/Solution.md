> [!check] Complexity
> Time Complexity: O(N)
> Space Complexity: O(1)

```java
//List<Pair<Integer, String>> romanNumeral = new ArrayList<>();  
//romanNumeral.add(new Pair<>(1000, "M"));  
//romanNumeral.add(new Pair<>(900, "CM"));  
//romanNumeral.add(new Pair<>(500, "D"));  
//romanNumeral.add(new Pair<>(400, "CD"));  
//romanNumeral.add(new Pair<>(100, "C"));  
//romanNumeral.add(new Pair<>(90, "XC"));  
//romanNumeral.add(new Pair<>(50, "L"));  
//romanNumeral.add(new Pair<>(40, "XL"));  
//romanNumeral.add(new Pair<>(10, "X"));  
//romanNumeral.add(new Pair<>(9, "IX"));  
//romanNumeral.add(new Pair<>(5, "V"));  
//romanNumeral.add(new Pair<>(4, "IV"));  
//romanNumeral.add(new Pair<>(1, "I"));  
  
class Solution {  
    public int romanToInt(String s) {  
        int num = 0;  
  
        for (int i = 0; i < s.length(); i++) {  
            if (s.charAt(i) == 'M') num += 1000;  
            if (s.charAt(i) == 'D') num += 500;  
            if (s.charAt(i) == 'L') num += 50;  
            if (s.charAt(i) == 'V') num += 5;  
  
            // CM, CD, C  
            if (s.charAt(i) == 'C') {  
                if (i + 1 < s.length() &&  s.charAt(i + 1) == 'M') {  
                    num += 900;  
                    i++;  
                } else if (i + 1 < s.length() && s.charAt(i + 1) == 'D') {  
                    num += 400;  
                    i++;  
                } else {  
                    num += 100;  
                }  
            }  
  
            // XC, XL, X  
            if (s.charAt(i) == 'X') {  
                if (i + 1 < s.length() && s.charAt(i + 1) == 'C') {  
                    num += 90;  
                    i++;  
                } else if (i + 1 < s.length() && s.charAt(i + 1) == 'L'){  
                    num += 40;  
                    i++;  
                } else {  
                    num += 10;  
                }  
            }  
  
            // IX, IV, I  
            if (s.charAt(i) == 'I') {  
                if (i + 1 < s.length() && s.charAt(i + 1) == 'X') {  
                    num += 9;  
                    i++;  
                } else if (i + 1 < s.length() && s.charAt(i + 1) == 'V'){  
                    num += 4;  
                    i++;  
                } else {  
                    num += 1;  
                }  
            }  
        }  
  
        return num;  
    }  
}
```
