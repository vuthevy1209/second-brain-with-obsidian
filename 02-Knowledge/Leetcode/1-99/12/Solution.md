### 7 ký hiệu cơ bản

![[Solution-1779263209188.webp]]

### Các quy tắc

<mark style="background:#d3f8b6">Quy tắc 1 — Không bắt đầu bằng 4 hoặc 9:</mark> Chọn ký hiệu có giá trị lớn nhất mà ≤ số hiện tại, gắn vào kết quả, trừ đi giá trị đó, rồi xử lý phần còn lại.

> Ví dụ: `14` → chọn `X` (10) → còn `4` → dùng `IV` → kết quả: **XIV**

<mark style="background:#d3f8b6">Quy tắc 2 — Bắt đầu bằng 4 hoặc 9 (dạng trừ):</mark> Chỉ có 6 dạng đặc biệt:

![[Solution-1779263237785.webp]]

<mark style="background:#d3f8b6">Quy tắc 3 — Giới hạn lặp ký hiệu:</mark>

- `I`, `X`, `C`, `M` (lũy thừa của 10): lặp tối đa **3 lần**
- `V`, `L`, `D`: **không** được lặp
- Nếu cần dùng 4 lần → chuyển sang dạng trừ (ví dụ: `IIII` → `IV`)


# Greedy

- Ưu tiên những cái lớn trước thì chúng ta sẽ không phải xử lý quy tắc 3.

```java
class Solution {  
    public String intToRoman(int num) {  
        List<Pair<Integer, String>> romanNumeral = new ArrayList<>();  
        romanNumeral.add(new Pair<>(1000, "M"));  
        romanNumeral.add(new Pair<>(900, "CM"));  
        romanNumeral.add(new Pair<>(500, "D"));  
        romanNumeral.add(new Pair<>(400, "CD"));  
        romanNumeral.add(new Pair<>(100, "C"));  
        romanNumeral.add(new Pair<>(90, "XC"));  
        romanNumeral.add(new Pair<>(50, "L"));  
        romanNumeral.add(new Pair<>(40, "XL"));  
        romanNumeral.add(new Pair<>(10, "X"));  
        romanNumeral.add(new Pair<>(9, "IX"));  
        romanNumeral.add(new Pair<>(5, "V"));  
        romanNumeral.add(new Pair<>(4, "IV"));  
        romanNumeral.add(new Pair<>(1, "I"));  
  
        StringBuilder ans = new StringBuilder();  
  
        for (Pair<Integer, String> pair : romanNumeral) {  
            while (num >= pair.first) {  
                ans.append(pair.second);  
                num = num - pair.first;  
            }  
        }  
  
        return ans.toString();  
    }  
}
```
