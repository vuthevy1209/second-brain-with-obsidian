> [!check] Complexity: n = digit.size
> Time Complexity: : **O(4ⁿ × n)**
> - Mỗi số điện thoại chứa 3 đến 4 chữ
> - Mỗi lần gọi đệ quy sẽ có một vòng lặp để gọi đệ quy tiếp => có 3 hoặc 3 lần gọi. Đệ quy gọi sâu đến lúc đủ số lượng chữ cái. Ngoài ra, Mỗi node lá gọi toString mất thêm O(n)
> - Thực tế nhỏ hơn vì chỉ '7' và '9' có 4 chữ cái, còn lại có 3 → trung bình ~3
>
> Space Complexity: O(n)
> - `StringBuilder sub` - O(n) Tối đa n ký tự
> - Call stack (đệ quy) - O(n) Sâu tối đa n tầng
> - `ans` (output) - O(4ⁿ × n) Không tính vào auxiliary space

```java
class Solution {  
    private Map<Character, String[]> phoneNumber;  
    private List<String> ans;  
  
    public List<String> letterCombinations(String digits) {  
        phoneNumber = new HashMap<>();  
        phoneNumber.put('2', new String[]{"a", "b", "c"});  
        phoneNumber.put('3', new String[]{"d", "e", "f"});  
        phoneNumber.put('4', new String[]{"g", "h", "i"});  
        phoneNumber.put('5', new String[]{"j", "k", "l"});  
        phoneNumber.put('6', new String[]{"m", "n", "o"});  
        phoneNumber.put('7', new String[]{"p", "q", "r", "s"});  
        phoneNumber.put('8', new String[]{"t", "u", "v"});  
        phoneNumber.put('9', new String[]{"w", "x", "y", "z"});  
  
        ans = new ArrayList<>();  
        buildString(digits, new StringBuilder());  
  
        return ans;  
    }  
  
    public void buildString(String digits, StringBuilder sub) {  
        if (sub.length() == digits.length()) {  
            ans.add(sub.toString());  
            return;  
        }  
  
        char number = String.valueOf(digits.charAt(sub.length())).charAt(0);  
  
        for (String s : phoneNumber.get(number)) {  
            sub.append(s);  
            buildString(digits, sub);  
            // backtrack  
            sub.deleteCharAt(sub.length() - 1);  
        }  
    }  
}
```
