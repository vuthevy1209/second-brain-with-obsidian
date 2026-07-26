# Brute force

> [!check] Complexity
> Time Complexity: O(n^2)
> Space Complexity: O(1)

![[Solution-1780656785057.webp]]

```java
class Solution {  
    public boolean containsNearbyDuplicate(int[] nums, int k) {  
        int count = 0;  
        for (int i = 0; i < nums.length; i++) {  
            for (int j = i + 1; j < nums.length; j++) {  
                if (nums[i] == nums[j] && Math.abs(i - j) <= k) {  
                    return true;  
                }  
            }  
        }  
  
        return false;  
    }  
}
```

# Sliding window

> [!check] Complexity
> Time Complexity: O(k^2 + nk), mà k <= n nên cuối cùng là O(n^2)
> Space Complexity: O(1)

```java
class Solution {  
    public boolean containsNearbyDuplicate(int[] nums, int k) {  
        if (k == 0) return false;  
  
        // first check  
        for (int i = 0; i <= k; i++) {  
            for (int j = i + 1; j <= k; j++) {  
                if (i >= nums.length || j >= nums.length) return false;  
                if (i != j && nums[i] == nums[j])  
                    return true;  
            }  
        }  
  
        int lo = 1;  
        int hi = k + 1;  
        while (hi < nums.length) {  
            for (int i = lo; i <= hi - 1; i++) {  
                if (nums[i] == nums[hi])  
                    return true;  
            }  
  
            hi++;  
            lo++;  
        }  
  
        return false;  
    }  
}
```


# Dùng HashSet để theo dõi window

> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity: O(k)

```java
import java.util.HashSet;
import java.util.Set;

class Solution {
    public boolean containsNearbyDuplicate(int[] nums, int k) {
        Set<Integer> set = new HashSet<>();
        
        for (int i = 0; i < nums.length; i++) {
            // Remove the element that is now outside the window
            if (i > k) {
                set.remove(nums[i - k - 1]);
            }
            
            // Try to add the current element. If it fails, a duplicate exists.
            if (!set.add(nums[i])) {
                return true;
            }
        }
        
        return false;
    }
}
```

