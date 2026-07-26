# Binary search

- Khá giống với bài koko ăn chuối. 
- Với bài này ta sẽ xét các giá trị h có thể là đáp án => đó là từ 1 đến citations.length (số bài đăng của giáo sư này). 
- Tại mỗi h thì ta thử xem giáo sư này có đủ số bài sao cho citations[i] >= h (bài thứ i được bao nhiêu lượt trích dẫn) hay không.

> [!check] Complexity
> Time Complexity: O(nlogn)
> Space Complexity: O(1)

```java
class Solution {  
    public int hIndex(int[] citations) {  
        int ans = 0;  
        int left = 0;  
        int right = citations.length;  
  
        while (left <= right) {  
            int mid = left + (right - left) / 2;  
  
            if (isValid(citations, mid)) {  
                ans = mid;  
                left = mid + 1;  
            } else {  
                right = mid - 1;  
            }  
        }  
  
        return ans;  
    }  
  
    boolean isValid(int[] citations, int h) {  
        int count = 0;  
        int i = citations.length - 1;  
        while (i >= 0 && citations[i] >= h) {  
            count++;  
            i--;  
        }  
  
        return count >= h;  
    }  
}
```
