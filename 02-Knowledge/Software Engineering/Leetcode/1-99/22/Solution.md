
``` java
class Solution {  
    public List<String> generateParenthesis(int n) {  
        Set<String> ans = new HashSet<>();  
        buildString(new StringBuilder(), ans, n);  
        return ans.stream().toList();  
    }  
  
    boolean isValid(String s, int n) {  
        int count1 = 0;  
        int count2 = 0;  
        for (int i = 0; i < s.length(); i++) {  
            if (s.charAt(i) == '(') count1++;  
            else count2++;  
        }  
  
        if (count1 > n || count2 > n) return false;  
        else return true;  
    }  
  
    boolean isParenthesis(String s) {  
        int count = 0;  
        for (int i = 0; i < s.length(); i++) {  
            if (s.charAt(i) == '(') count++;  
            else {  
                count--;  
                if (count < 0) return false;  
            }  
        }  
  
        return true;  
    }  
  
    void buildString(StringBuilder parenthesis, Set<String> ans, int n) {  
        if (!isValid(parenthesis.toString(), n)) return;  
        if (parenthesis.length() / 2 == n && isParenthesis(parenthesis.toString())) {  
            ans.add(parenthesis.toString());  
            return;  
        }  
  
        char[] pa = new char[]{'(', ')'};  
        for (char c : pa) {  
            parenthesis.append(String.valueOf(c));  
            buildString(parenthesis, ans, n);  
            // backtrack  
  
            parenthesis.deleteCharAt(parenthesis.length() - 1);  
        }  
    }  
}
```

# Improve

**Vấn đề chính:** Sinh ra **mọi tổ hợp** rồi mới filter → rất lãng phí.

```
n=3: sinh ~2^6 = 64 nhánh, chỉ giữ 5 kết quả
```

### Cải thiện: Backtracking có điều kiện

Thay vì sinh xong rồi kiểm tra, **chỉ sinh nhánh hợp lệ ngay từ đầu:**

``` java
class Solution {
    public List<String> generateParenthesis(int n) {
        List<String> ans = new ArrayList<>();
        backtrack(new StringBuilder(), ans, 0, 0, n);
        return ans;
    }

    void backtrack(StringBuilder sb, List<String> ans, int open, int close, int n) {
        // Đủ độ dài → thêm kết quả
        if (sb.length() == 2 * n) {
            ans.add(sb.toString());
            return;
        }

        // Thêm '(' nếu chưa dùng hết
        if (open < n) {
            sb.append('(');
            backtrack(sb, ans, open + 1, close, n);
            sb.deleteCharAt(sb.length() - 1);
        }

        // Thêm ')' chỉ khi có '(' chưa đóng
        if (close < open) {
            sb.append(')');
            backtrack(sb, ans, open, close + 1, n);
            sb.deleteCharAt(sb.length() - 1);
        }
    }
}
```