# Binary search

> [!check] Complexity
> Time Complexity: O(nLogn)
> Space Complexity: O(1)

```java
class Solution {  
    public int[] intersection(int[] nums1, int[] nums2) {  
        Arrays.sort(nums2);  
        Set<Integer> set = new HashSet<>();  
  
        for (int num : nums1) {  
            int k = Arrays.binarySearch(nums2, num);  
            if (k < 0) continue;  
  
            set.add(num);  
        }  
  
        return set.stream().mapToInt(Integer::intValue).toArray();  
    }  
}
```

# Set

> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity: O(n)

```java
class Solution {  
    public int[] intersection(int[] nums1, int[] nums2) {  
        Set<Integer> set = new HashSet<>();  
        for (int num2 : nums2) {  
            set.add(num2);  
        }  
  
        Set<Integer> ans = new HashSet<>();  
        for (int num1 : nums1) {  
            if (set.contains(num1))  
                ans.add(num1);  
        }  
  
        return ans.stream().mapToInt(Integer::intValue).toArray();  
    }  
}
```

# Use check array

> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity O(1001)

```java
class Solution {  
    public int[] intersection(int[] nums1, int[] nums2) {  
        boolean[] values1 = new boolean[1001];  
        int[] temps = new int[Math.min(nums1.length, nums2.length)];  
        int count = 0;  
  
        for (int num : nums1) {  
            values1[num] = true;  
        }  
  
        for (int num : nums2) {  
            if (values1[num]) {  
                temps[count] = num;  
                count++;  
                values1[num] = false;  
            }  
        }  
        return Arrays.copyOf(temps, count);  
    }  
}
```
