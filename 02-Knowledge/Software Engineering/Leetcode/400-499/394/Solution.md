> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity: O(n)

``` java
import java.util.Stack;  
  
class Solution {  
  
    public boolean isNumber(String s) {  
        try {  
            Integer.parseInt(s);  
            return true;  
        } catch (NumberFormatException e) {  
            return false;  
        }  
    }  
  
    public String decodeString(String s) {  
        StringBuilder result = new StringBuilder();  
        Stack<String> stack = new Stack<>();  
  
        for (int i = 0; i < s.length(); i++) {  
            if (s.charAt(i) != ']')  
                stack.push(String.valueOf(s.charAt(i)));  
            else {  
                StringBuilder temp = new StringBuilder();  
                while (!stack.peek().equals("[")) {  
                    temp.insert(0, stack.pop());  
                }  
  
                stack.pop(); // remove "["  
                StringBuilder count = new StringBuilder();  
                while (!stack.empty() && isNumber(stack.peek())) {  
                    count.insert(0, stack.pop());  
                }  
  
                StringBuilder tempDecode = new StringBuilder();  
               for (int k = 1; k <= Integer.parseInt(count.toString()); k++){  
                    tempDecode.append(temp.toString());  
                }  
  
                stack.push(tempDecode.toString());  
            }  
        }  
  
        while (!stack.isEmpty()) {  
            result.insert(0, stack.pop());  
        }  
  
        return result.toString();  
    }  
}
```

### Phân tích Độ phức tạp

#### `isNumber(String s)`

- **Time:** `O(n)` — `Integer.parseInt()` duyệt qua từng ký tự
- **Space:** `O(1)`

#### `decodeString(String s)`

- `n` = độ dài chuỗi đầu vào
- `k` = số lần lặp lớn nhất (số trong ngoặc)
- `L` = độ dài chuỗi đầu ra sau khi decode

##### Time Complexity: **O(k × L)**

| Đoạn code                              | Độ phức tạp        | Lý do                           |
| -------------------------------------- | ------------------ | ------------------------------- |
| `for (int i = 0; i < s.length(); i++)` | O(n)               | duyệt từng ký tự                |
| `temp.insert(0, stack.pop())`          | O(m²)              | insert vào đầu tốn O(m) mỗi lần |
| `isNumber(stack.peek())`               | O(d) <br>but d = 1 | d = số chữ số của con số        |
| `tempDecode.append(temp)` lặp k lần    | O(k × m)           | nhân bản chuỗi k lần            |
| `result.insert(0, stack.pop())`        | O(L²)              | insert vào đầu ở cuối           |

Bottleneck chính là **nhân bản chuỗi** `k × m` lần, với đầu ra lồng nhau có thể đạt **O(k × L)**

##### Space Complexity: **O(k × L)**

- Stack chứa các chuỗi trung gian sau mỗi lần decode
- Trường hợp xấu nhất: `3[2[a]]` → stack chứa `"aa"` rồi `"aaaaaa"`

#### Điểm yếu hiệu năng

```java
// ❌ insert(0, ...) tốn O(m) mỗi lần → cả vòng while là O(m²)
temp.insert(0, stack.pop());

// ✅ Nên dùng append() rồi reverse() một lần → O(m)
temp.append(stack.pop());
// sau vòng while:
temp.reverse();
```

```java
// ❌ insert(0, ...) ở cuối cũng tốn O(L²)
result.insert(0, stack.pop());

// ✅ Nên dùng append() rồi reverse()
result.append(stack.pop());
// sau vòng while:
result.reverse();
```
