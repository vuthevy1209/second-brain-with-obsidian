> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity: O(n) - Toàn bộ list StringBuilder sẽ lưu n ký tự

```java
class Solution {  
    public String convert(String s, int numRows) {  
        if (numRows == 1) return s;  
  
        List<StringBuilder> list = new ArrayList<>(numRows);  
        for (int i = 1; i <= numRows; i++) {  
            list.add(new StringBuilder());  
        }  
  
        int count = 1;  
        boolean down = true; // false will go up  
        for (int i = 0; i < s.length(); i++) {  
            list.get(count - 1).append(s.charAt(i));  
            if (down) {  
                count++;  
                if (count == numRows) down = false;  
            } else {  
                count--;  
                if (count == 1) down = true;  
            }  
        }  
  
        StringBuilder ans = new StringBuilder();  
        for (StringBuilder sub : list) {  
            ans.append(sub);  
        }  
  
        return ans.toString();  
    }  
}
```
