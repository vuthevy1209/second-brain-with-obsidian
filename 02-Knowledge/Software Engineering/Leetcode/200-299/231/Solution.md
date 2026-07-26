# Loop

> [!check] Complexity
> Time Complexity: O(logN)
> Space Complexity: O(1)

```java
class Solution {  
    public boolean isPowerOfTwo(int n) {  
        if (n == 0) return false;  
        if (n == 1) return true;  
        if ( n % 2 == 1) return false;  
  
        while (n % 2 == 0) {  
            n = n / 2;  
        }  
  
        if (n == 1) return true;  
        return false;  
    }  
}
```


# Bit Manipulation 

``` java
class Solution {
    public boolean isPowerOfTwo(int n) {
        return n > 0 && (n & (n - 1)) == 0;
    }
}
```

Số là lũy thừa của 2 khi biểu diễn nhị phân **chỉ có đúng 1 bit = 1**:

```
1  → 00000001  ✓
2  → 00000010  ✓
4  → 00000100  ✓
8  → 01000000  ✓
6  → 00000110  ✗ (2 bit = 1)
```

#### Trick: `n & (n - 1) == 0`

Khi trừ 1, bit cao nhất bị "xóa" và các bit thấp hơn bị "bật":

```
n     = 8 → 1000
n - 1 = 7 → 0111
              ----
n & (n-1)  → 0000  ✓ là lũy thừa 2

n     = 6 → 0110
n - 1 = 5 → 0101
              ----
n & (n-1)  → 0100  ✗ không phải
```

Nếu `n` là lũy thừa 2 → chỉ có 1 bit = 1 → `n & (n-1)` triệt tiêu hoàn toàn → **bằng 0**.