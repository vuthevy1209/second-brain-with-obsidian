# Brute Force : Quét sạch toàn bộ tổ hợp chập k của nums1 => Dùng Backtracking

> [!fail]
> Definitely time limit

# Sort + Min Heap

> [!cite] Ý tưởng:
> - Thay vì ta có quét hết tất cả C(k, n) của nums1 sau đó với mỗi bộ, ta đi tìm thằng min bên nums2 ứng với chỉ số của bộ được chọn
> 
> - Thì bây giờ ta đổi tư duy lại là xét toàn bộ các giá trị có thể làm min: 
> 	- Tại mỗi giá trị min lấy ở nums2 (giả sử ở vị trí i), thì ta đang có nums1[i] là một giá trị thuộc bộ đang xét. 
> 	- Công việc của ta là tìm k - 1 giá trị còn lại ở nums1 mà sao cho giá trị tương ứng ở nums2 không thể nhỏ hơn giá trị min đang xét 
> 		- => Ta sẽ sort nums2 giảm dần và khi pick chọn num2[i] = min thì ta chỉ xét các số từ 0 đến i ở nums1 => Như vậy sẽ đảm bảo các số được chọn ở nums1 sẽ không có nums2 tương ứng lớn hơn min đang xét.
> 	- Và tất nhiên thì ta chọn k - 1 số còn lại sao cho nó to nhất => Dùng Heap để giải quyết vấn đề này.

> [!check] Complexity
> Time Complexity: O(n log n)
> Space Complexity: O(n)

```java
class Pair<T, K> {  
    T first;  
    K second;  
  
    Pair(T first, K second) {  
        this.first = first;  
        this.second = second;  
    }  
}  
  
class Solution {  
    public long maxScore(int[] nums1, int[] nums2, int k) {  
        List<Pair<Integer, Integer>> sortNums2 = new ArrayList<>();  
        for (int i = 0; i < nums2.length; i++) {  
            sortNums2.add(new Pair<>(nums2[i], i));  
        }  
  
        // Sort descending  
        Collections.sort(sortNums2, (a, b)  
                -> Integer.compare(b.first, a.first));  
  
        long max = -Integer.MAX_VALUE;  
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();  
        long sum = 0;  
        for (Pair<Integer, Integer> num2 : sortNums2) {  
            minHeap.offer(nums1[num2.second]);  
            sum += nums1[num2.second];  
            if (minHeap.size() < k) continue;  
            if (minHeap.size() > k) {  
                sum -= minHeap.poll();  
            }  
  
            max = Math.max(max, sum * num2.first);  
        }  
  
        return max;  
    }  
}
```

# Improve

- Không cần khai báo Pair => Tốn không gian

``` java
class Solution {
    public long maxScore(int[] nums1, int[] nums2, int k) {
        int n = nums1.length;
        int[][] pairs = new int[n][2];
        for (int i = 0; i < n; i++) {
            pairs[i][0] = nums1[i];
            pairs[i][1] = nums2[i];
        }

        Arrays.sort(pairs, (a, b) -> b[1] - a[1]); // sort nums2 giảm dần

        PriorityQueue<Integer> minHeap = new PriorityQueue<>();
        long sum = 0, max = 0;

        for (int[] pair : pairs) {
            minHeap.offer(pair[0]);
            sum += pair[0];
            if (minHeap.size() > k) {
                sum -= minHeap.poll();
            }
            if (minHeap.size() == k) {
                max = Math.max(max, sum * pair[1]);
            }
        }

        return max;
    }
}
```