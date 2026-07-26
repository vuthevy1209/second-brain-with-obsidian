> [!done] Complexity
> Time Complexity: O(n)
> Space Complexity: O(1)

``` java
class Solution {  
    public int longestOnes(int[] nums, int k) {  
        int result = 0;  
        int countZeros = 0;  
        int left = 0;  
  
        for (int right = 0; right < nums.length; right++) {  
            // Expand: add right element  
            if (nums[right] == 0) countZeros++;  
  
            // Shrink: window invalid when zeros > k  
            while (countZeros > k) {  
                if (nums[left] == 0) countZeros--;  
                left++;  
            }  
  
            // Window is valid, record max size  
            result = Math.max(result, right - left + 1);  
        }  
  
        return result;  
    }  
}
```

### Complexity Analysis

#### Time Complexity — O(n)


```java
for (int right = 0; right < nums.length; right++)  // right moves 0 → n
    while (countZeros > k)
        left++;                                      // left moves 0 → n
```

- `right` traverses the array **once**: n steps
- `left` traverses the array **once** total (never resets): n steps
- Each element is **entered and exited the window exactly once**

> Total operations = 2n → **O(n)**

---

#### Space Complexity — O(1)

Only 3 variables regardless of input size:

java

```java
int result    = 0;   // O(1)
int countZeros = 0;  // O(1)
int left      = 0;   // O(1)
```

No extra arrays, maps, or data structures used.

> **O(1)**