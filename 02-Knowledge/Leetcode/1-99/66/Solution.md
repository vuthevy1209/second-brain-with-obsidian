> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity (Worse case): O(n)

``` java
class Solution {  
    public int[] plusOne(int[] digits) {  
        int temp = 0;  
        for (int i = digits.length - 1; i >= 0; i--) {  
            int sum = digits[i] + temp + 1;  
            if (sum >= 10) {  
                digits[i] = sum % 10;  
            }  
            temp = sum / 10;  
        }  
  
        if (temp != 0) {  
            int[] ans = new int[digits.length + 1];  
            ans[0] = temp;  
  
            int i = 1;  
            for (int d : digits) {  
                ans[i] = d;  
                i++;  
            }  
  
            return ans;  
        }  
  
        return digits;  
    }  
}
```