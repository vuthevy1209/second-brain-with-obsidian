> [!check] Complexity
> Time Complexity: 
> Space Complexity:

```java
class Solution {  
    public int reverse(int x) {  
        StringBuilder ans = new StringBuilder();  
        if (x < 0)  
            ans.append("-");  
  
        ans.append(new StringBuilder(String.valueOf(Math.abs(x))).reverse());  
  
        try {  
            return Integer.parseInt(ans.toString());  
        } catch (Exception e) {  
            return 0;  
        }  
    }  
}
```


# Improve

``` java
class Solution {  
    public int reverse(int x) {  
        int z = 0;  
  
        while (x != 0) {  
            int r = x % 10;  
  
            // Check overflow  
            if (z > Integer.MAX_VALUE / 10 || z < Integer.MIN_VALUE / 10) {  
                return 0;  
            }  
  
            z = z * 10 + r;  
            x = x / 10;  
        }  
  
        return z;  
    }  
}
```
