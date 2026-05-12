## Hint

- Using prefix sum technique.

![[Solution-1778598403944.webp]]

# Code

> [!check] Complexity
> **Time Complexity:** O(n)
> **Space Complexity:** O(n) because we using a array for building the prefix sum.

``` java
import java.util.Arrays;  
  
class Solution {  
  
    public int[] buildPrefixSim(int[] gain) {  
        int[] prefixSum = new int[gain.length];  
        prefixSum[0] = gain[0];  
  
        for (int i = 1; i < gain.length; i++) {  
            prefixSum[i] = prefixSum[i - 1] + gain[i];  
        }  
  
        return prefixSum;  
    }  
  
    public int largestAltitude(int[] gain) {  
        int[] prefixSum = buildPrefixSim(gain);  
  
        int max = 0;  
  
        return Math.max(max, Arrays.stream(prefixSum).max().getAsInt());  
    }  
}
```


# Improve

- We can update the maximum result while building the prefix sum.

```java
import java.util.Arrays;  
  
class Solution {  
    public int largestAltitude(int[] gain) {  
        int[] prefixSum = new int[gain.length +1];  
        prefixSum[0] = 0;  
        int max = 0;  
        
        for(int i = 0; i < gain.length; i++){  
            prefixSum[i + 1] = prefixSum[i] + gain[i];  
            max = Math.max(max, prefixSum[i+1]);  
        }  
        return max;  
  
    }  
}
```

