# Sort - O(nlogn) 

> [!check] Complexity
> Time Complexity: O(nlogn)
> Space Complexity: O(1)

```java
class Solution { 
	public int findKthLargest(int[] nums, int k) { 
		Arrays.sort(nums); 
		return nums[nums.length - k]; 
	} 
}
```

# Max Heap - O(nlogn)

> [!check] Complexity
> Time Complexity: O(nlogn)
> Space Complexity: O(n)

```java
class Solution {  
    public int findKthLargest(int[] nums, int k) {  
        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(  
                Collections.reverseOrder()  
        );  
  
        // O(n log n)  
        for (int num : nums) {  
            maxHeap.offer(num);  
        }  
  
        // bỏ đi k - 1 phần tử lớn nhất  
        for (int i = 1; i < k; i++) {  
            maxHeap.poll();  
        }  
  
        return maxHeap.peek();  
    }  
}
```

# Min Heap - O(nlogk)

> [!check] Complexity
> Time Complexity: O(nlogk)
> - Duyệt n lần, mỗi lần thao tác trên heap với k phần tử nên logk
> 
> Space Complexity: O(k)
> - Lưu tối đa k phần tử

```java
class Solution {  
  
    public int findKthLargest(int[] nums, int k) {  
        // min heap  
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();  
  
        for (int num : nums) {  
  
            minHeap.offer(num);  
  
            // chỉ giữ lại k phần tử lớn nhất  
            if (minHeap.size() > k) {  
                minHeap.poll();  
            }  
        }  
  
        // phần tử nhỏ nhất trong k phần tử lớn nhất  
        return minHeap.peek();  
    }  
}
```


# Quick Select

Ý tưởng của Quickselect giống Quick Sort.

Mục tiêu: Không cần sort lại toàn bộ mảng, chỉ cần tìm đúng vị trí của **kth largest** (là cái vị trí mà nếu sắp xếp toàn bộ mảng nó cũng sẽ nằm ở đó)

=> Ý tưởng partition của quick sort (dùng LOMUTO). Khi phân hoạch xong, ta có index của pivot. Thì đống bên trái chắc chắn nhỏ hơn pivot (tương tự bên phải). Ví dụ:

```
[3,2,1,5,6,4] - n = 6
chọn pivot = 4

Sau partition:
[3,2,1,4,6,5] -> 4 nằm ở index 3

Có nghĩa là có 3 số nhỏ hơn 4

Vậy giả sử đề bài yêu cầu tìm số lớn thứ 2 trong mảng trên. Thì nếu cái mảng này mà được sắp xếp lại thì vị trí của số lớn thứ 2 này là 6 - 2 = 4

Sau phân hoạch, ta thấy index 3 kia nhỏ hơn 4. Vậy thì ta chỉ cần đi sang trái để phân hoạch là xong.
```

> [!check] Complexity
> Time Complexity: 
> Space Complexity:

```java
class Solution {
	private void swap(int[] nums, int a, int b) {
        int tmp = nums[a];
        nums[a] = nums[b];
        nums[b] = tmp;
    }

    private int partition(int[] nums, int left, int right) {
        int pivot = nums[right]; // chọn phần tử cuối làm pivot
        int i = left;

        for (int j = left; j < right; j++) {
            if (nums[j] <= pivot) {
                swap(nums, i, j);
                i++;
            }
        }
        swap(nums, i, right); // đưa pivot vào đúng vị trí
        return i;
    }

    public int findKthLargest(int[] nums, int k) {
        // Kth largest = phần tử ở index (n-k) theo thứ tự tăng dần
        return quickSelect(nums, 0, nums.length - 1, nums.length - k);
    }

    private int quickSelect(int[] nums, int left, int right, int targetIndex) {
        if (left == right) return nums[left];

        int pivotIndex = partition(nums, left, right);

        if (pivotIndex == targetIndex) {
            return nums[pivotIndex];         // Tìm thấy
        } else if (pivotIndex < targetIndex) {
            return quickSelect(nums, pivotIndex + 1, right, targetIndex);  // Đi phải
        } else {
            return quickSelect(nums, left, pivotIndex - 1, targetIndex);   // Đi trái
        }
    }
}
```

### Phân tích độ phức tạp QuickSelect

#### Time Complexity

##### Best / Average Case: O(n)

Mỗi lần partition, ta **loại bỏ được một nửa** mảng:

```
Lần 1: xử lý n   phần tử
Lần 2: xử lý n/2 phần tử
Lần 3: xử lý n/4 phần tử
...
```

Tổng số phép tính:

```
n + n/2 + n/4 + ... = n × (1 + 1/2 + 1/4 + ...) = n × 2 = O(n)
```

Đây là **chuỗi hình học**, hội tụ về **2n** → O(n).

---

##### Worst Case: O(n²)

Xảy ra khi pivot **luôn là min hoặc max** → chỉ loại được 1 phần tử mỗi lần:

```
Lần 1: xử lý n   phần tử  →  loại được 1
Lần 2: xử lý n-1 phần tử  →  loại được 1
Lần 3: xử lý n-2 phần tử  →  loại được 1
...
```

Tổng: `n + (n-1) + (n-2) + ... + 1 = n(n+1)/2` → **O(n²)**

Với **random pivot**, xác suất để worst case xảy ra **liên tiếp** là cực kỳ thấp → expected vẫn là **O(n)**.

---

#### Space Complexity

QuickSelect dùng **đệ quy**, nên tốn stack space:

|Case|Số lần đệ quy|Space|
|---|---|---|
|Average|O(log n)|**O(log n)**|
|Worst|O(n)|**O(n)**|

> Có thể tối ưu thành **O(1)** space bằng cách đổi sang vòng lặp (iterative):

java

```java
private int quickSelect(int[] nums, int left, int right, int targetIndex) {
    while (left < right) {           // thay đệ quy bằng loop
        int pivot = partition(nums, left, right);

        if (targetIndex > pivot)
            left = pivot + 1;
        else if (targetIndex < pivot)
            right = pivot - 1;
        else
            return nums[targetIndex];
    }
    return nums[left];
}
```