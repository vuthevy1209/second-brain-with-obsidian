# Use Set

> [!check] Complexity
> Time Complexity: O(nlogn)
> Space Complexity: O(n)

```java
class Solution {  
    public int removeDuplicates(int[] nums) {  
        Set<Integer> set = new HashSet<>();  
        for (int i = 0; i < nums.length; i++) {  
            set.add(nums[i]);  
        }  
  
        List<Integer> list = new ArrayList<>(set.stream().toList());  
        Collections.sort(list);  
        for (int i = 0; i < set.size(); i++) {  
            nums[i] = list.get(i);  
        }  
        return set.size();  
    }  
}
```

# Improve

> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity: O(1)

```java
class Solution {
    public int removeDuplicates(int[] nums) {
        int i = 0;

        for(int j = 1; j < nums.length; j++){

            if(nums[i] != nums[j]){
                i++;
                nums[i] = nums[j];
            }
        }

        return i + 1;
    }
}
