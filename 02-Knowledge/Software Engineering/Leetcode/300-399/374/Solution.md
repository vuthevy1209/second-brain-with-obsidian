- The problem have predefined guess function.
- You call a pre-defined API `int guess(int num)`, which returns three possible results:
	- `-1`: Your guess is higher than the number I picked (i.e. `num > pick`).
	- `1`: Your guess is lower than the number I picked (i.e. `num < pick`).
	- `0`: your guess is equal to the number I picked (i.e. `num == pick`).

> [!check] Complexity
> Time Complexity: O(LogN)
> Space Complexity: O(1)

```java
public class Solution extends GuessGame {  
    public int guessNumber(int n) {  
        int left = 1;  
        int right = n;  
  
        while (left <= right) {  
            int num = left + (right - left) / 2;  
            int guess = guess(num);  
            if (guess == 0)  
                return num;  
            else if (guess == 1) // 1 if num is lower than the picked number  
                left = num + 1;  
            else                // -1 if num is higher than the picked number 
                right = num - 1;  
  
        }  
  
        return -1;  
    }  
}
```
