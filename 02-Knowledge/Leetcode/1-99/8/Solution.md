
> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity: O(1)

```java
class Solution {  
    public int myAtoi(String s) {  
        int num = 0;  
        boolean negative = false;  
        boolean signSeen = false;  
        boolean checkNum = false;  
  
        for (int i = 0; i < s.length(); i++) {  
            char c = s.charAt(i);  
  
            if (c == ' ' && !signSeen && !checkNum) continue;  
  
            if ((c == '-' || c == '+') && !signSeen && !checkNum) {  
                signSeen = true;  
                negative = (c == '-');  
                continue;  
            }  
  
            if (c < '0' || c > '9') break;  
  
            int digit = c - '0';  
  
            if (num > (Integer.MAX_VALUE - digit) / 10) {  
                return negative ? Integer.MIN_VALUE : Integer.MAX_VALUE;  
            }  
  
            num = num * 10 + digit;  
            checkNum = true;  
        }  
  
        return negative ? -num : num;  
    }  
}
```

# Explain

Ta muốn kiểm tra xem `num * 10 + digit` có vượt quá `Integer.MAX_VALUE` (2147483647) không **trước khi** thực sự tính — vì nếu tính trước thì đã tràn rồi.

Biến đổi toán học
```
				num * 10 + digit > MAX_VALUE
				num * 10 > MAX_VALUE - digit
				num > (MAX_VALUE - digit) / 10
```

#### Tại sao không dùng `long`?

Cũng được, nhưng cách này **không cần ép kiểu**, tận dụng toán học thuần túy để tránh tràn.

```java
// Cách dùng long (đơn giản hơn nhưng cần ép kiểu):
if ((long) num * 10 + digit > Integer.MAX_VALUE) { ... }
```
