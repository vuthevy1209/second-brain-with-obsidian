# Hint

- Always keep the slide window with only one number 0.

## Code

> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity: O(1)

``` java
class Solution {  
  
    // [0,1,1,1,0,1,1,0,1]  
    public int longestSubarray(int[] nums) {  
        int left = 0;  
        int countZeros = 0;  
        int result = 0;  
  
        for (int right = 0; right < nums.length; right++) {  
            if (nums[right] == 0) countZeros++;  
  
            // move 'left' to right if the slide window  
            // have more than one zero            
            while (countZeros > 1) {  
                if (nums[left] == 0) countZeros--;  
                left++;  
            }  
  
            result = Math.max(result, right - left);  
        }  
  
        return result;  
    }  
}
```


# Complexity Analysis

#### Time Complexity — O(n)
```java
for (int right = 0; right < nums.length; right++)  // right: 0 → n
    while (countZeros > 1)
        left++;                                      // left: 0 → n total
```

- `right` move forward n times
- `left` move forward n times
- Each element is visited at most twice (once by `right`, one by `left`)
 => Total: 2n -> O(n)

#### Space Complexity - O(1)
``` java
int left       = 0;   // O(1)
int countZeros = 0;   // O(1)
int result     = 0;   // O(1)
```

No extra data structures used => O(1)