
> [!check] Complexity
> Time Complexity: O (m x n)
> - Initialization (first loop): O(m × n): Browse the entire matrix to find rotten oranges and count fresh oranges.
> - Main BFS: O(m × n): Each cell in the matrix can only be added to the queue exactly once (because when grid[i][j] changes from 1 → 2, it is never considered again). Therefore the total number of processing times through all BFS loops = O(m × n).
> - Each cell considers 4 directions → O(4 × m × n) = O(m × n).
> - Final check: O(m × n)
> 
> Space Complexity: O (m x n): 
> - Queue has the maximum m x n elements.
> - directions are fixed and do not change => O(1)

```java
class Solution {  
    public int orangesRotting(int[][] grid) {  
        // matrix mxn  
        int m = grid.length;  
        int n = grid[0].length;  
  
        int minute = 0;  
        Queue<int[]> queue = new LinkedList<>();  
        int[][] directions = new int[][]{{1, 0}, {-1, 0}, {0, 1}, {0, -1}};  
  
        int countFreshOrange = 0;  
  
        // minute 0 : Add all rotten oranges into queue  
        for (int i = 0; i < m; i++) {  
            for (int j = 0; j < n; j++) {  
                if (grid[i][j] == 2) {  
                    queue.add(new int[]{i, j});  
                }  
                if (grid[i][j] == 1) countFreshOrange++;  
            }  
        }  
  
        // if there are not any fresh orange  
        if (countFreshOrange == 0) return 0;  
  
        // if there are not any rotten orange  
        if (queue.isEmpty()) return -1;  
  
  
        while (!queue.isEmpty()) {  
            int size = queue.size();  
            minute++;  
  
            for (int i = 0; i < size; i++) {  
                int[] orange = queue.poll();  
                for (int[] direction : directions) {  
                    int newRow = orange[0] + direction[0];  
                    int newCol = orange[1] + direction[1];  
                    if (newRow < 0 || newRow >= m || newCol < 0 || newCol >= n) continue;  
                    if (grid[newRow][newCol] == 1) {  
                        grid[newRow][newCol] = 2;  
                        int[] adjOrange = new int[]{newRow, newCol};  
                        queue.add(adjOrange);  
                    }  
                }  
            }  
        }  
  
  
        // Check to see if there are any fresh oranges left  
        for (int i = 0; i < m; i++) {  
            for (int j = 0; j < n; j++) {  
                if (grid[i][j] == 1)  
                    return -1;  
            }  
        }  
  
        return minute - 1;  
    }  
}
```
