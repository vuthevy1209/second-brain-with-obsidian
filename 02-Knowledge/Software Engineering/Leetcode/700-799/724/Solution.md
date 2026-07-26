> [!check] Complexity
> **Time Complexity: O(n)**
>      - O(n) for building the prefix sum.
>      - O(n) for browsing the array and considering each index.
> **Space Complexity: O(n)**
>      - We are using a array with n = gain.length element for building prefix sum.


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
  
    public int pivotIndex(int[] nums) {  
        int[] prefixSum = buildPrefixSim(nums);  
        int numsLength = nums.length;  
  
        // special case: pivot index = 0 => sumLeft = 0 and sumRight = total 1 -> nums.length - 1  
        int sumLeft = 0;  
        int sumRight = prefixSum[numsLength - 1] - prefixSum[0];  
        if (sumRight == 0) {  
            return 0;  
        }  
  
        for (int i = 1; i < numsLength - 1; i++) {  
            sumLeft = prefixSum[i - 1];  
            sumRight = prefixSum[numsLength - 1] - prefixSum[i];  
  
            if (sumLeft == sumRight) return i;  
        }  
  
        sumLeft = prefixSum[numsLength - 2];  
  
        if (sumLeft == 0) return numsLength - 1;  
        else return -1;  
    }  
}
```

