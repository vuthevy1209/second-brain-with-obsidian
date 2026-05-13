# Complexity

> [!check] Complexity
> Time Complexity: O(2m + 2n) with m = nums1.length, n = nums1.length
> Space Complexity: O(2m + 2n) with m = nums1.length, n = nums1.length

``` java
import java.util.ArrayList;  
import java.util.HashSet;  
import java.util.List;  
import java.util.Set;  
  
class Solution {  
    public List<List<Integer>> findDifference(int[] nums1, int[] nums2) {  
        int lengthNums1 = nums1.length;  
        int lengthNums2 = nums2.length;  
  
        Set<Integer> distinctNums1 = new HashSet<>(lengthNums1);  
        Set<Integer> distinctNums2 = new HashSet<>(lengthNums2);  
  
        Set<Integer> setNums1 = new HashSet<>(lengthNums1);  
        Set<Integer> setNums2 = new HashSet<>(lengthNums2);  
  
        for (int i : nums1) {  
            setNums1.add(i);  
        }  
  
        for (int i : nums2) {  
            setNums2.add(i);  
        }  
  
        for (int i : nums1) {  
            if (!setNums2.contains(i)){  
                distinctNums1.add(i);  
            }  
        }  
  
        for (int i : nums2) {  
            if (!setNums1.contains(i)){  
                distinctNums2.add(i);  
            }  
        }  
  
        return List.of(
                 new ArrayList<>(distinctNums1), 
                 new ArrayList<>(distinctNums2)
        );  
    }  
}
```

# Improve

``` java
import java.util.ArrayList;  
import java.util.HashSet;  
import java.util.List;  
import java.util.Set;  
  
class Solution {  
    public List<List<Integer>> findDifference(int[] nums1, int[] nums2) {  
        Set<Integer> set1 = new HashSet<>();  
        Set<Integer> set2 = new HashSet<>();  
        for (int n : nums1) set1.add(n);  
        for (int n : nums2) set2.add(n);  
  
        Set<Integer> diff1 = new HashSet<>(set1);  
        Set<Integer> diff2 = new HashSet<>(set2);  
        diff1.removeAll(set2);  
        diff2.removeAll(set1);  
  
        return List.of(new ArrayList<>(diff1), new ArrayList<>(diff2));  
    }  
}
```
