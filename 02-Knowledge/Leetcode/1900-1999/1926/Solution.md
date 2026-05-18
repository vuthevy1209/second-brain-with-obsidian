# <font color="#00b050">Brute Force + BFS</font>
![[Solution-1779090678904.webp]]

```java
class Solution {

    private int nearest = Integer.MAX_VALUE;
    private int[][] directions;
    private boolean[][] visited;
    private int[] originalEntrance;

    public int nearestExit(char[][] maze, int[] entrance) {
        directions = new int[][]{{0, 1}, {0, -1}, {1, 0}, {-1, 0}};
        visited = new boolean[maze.length][maze[0].length];
        originalEntrance = entrance;

        flood(maze, entrance, 0);
        return nearest == Integer.MAX_VALUE ? -1 : nearest;
    }

    void flood(char[][] maze, int[] entrance, int count) {
        int row = entrance[0];
        int col = entrance[1];

        int lengthRow = maze.length;
        int lengthCol = maze[0].length;

        if (row < 0 || row >= lengthRow || col < 0 || col >= lengthCol) return;
        if (maze[row][col] == '+' || visited[row][col]) return;

        // Pruning: nếu count đã >= nearest thì không cần đi tiếp
        if (count >= nearest) return;

        visited[row][col] = true;

        if (row == 0 || row == lengthRow - 1 || col == 0 || col == lengthCol - 1) {
            if (!(row == originalEntrance[0] && col == originalEntrance[1])) {
                nearest = Math.min(nearest, count);
                visited[row][col] = false; // ✅ backtrack
                return;
            }
        }

        for (int[] direction : directions) {
            int newRow = row + direction[0];
            int newCol = col + direction[1];
            flood(maze, new int[]{newRow, newCol}, count + 1);
        }

        visited[row][col] = false; // ✅ backtrack
    }
}
```

# DFS

![[Solution-1779090994987.webp]]

- ### Vấn đề: DFS không tìm được đường ngắn nhất

- Code dùng **DFS** nhưng bài yêu cầu **shortest path** → DFS tìm được **một đường** nhưng không đảm bảo đó là đường **ngắn nhất**.

![[Solution-1779091026536.webp]]

``` java
class Solution {  
  
    private int nearest = Integer.MAX_VALUE;  
    private int directions[][];  
    private boolean[][] visited;  
    private int[] originalEntrance;  
  
    public int nearestExit(char[][] maze, int[] entrance) {  
        directions = new int[][]{{0, 1}, {0, -1}, {1, 0}, {-1, 0}};  
        visited =  new boolean[maze.length][maze[0].length];  
        originalEntrance = entrance;  
  
        flood(maze, entrance, 0);  
        return nearest == Integer.MAX_VALUE ? -1 : nearest;  
    }  
  
    void flood(char[][] maze, int[] entrance, int count) {  
        int row = entrance[0];  
        int col = entrance[1];  
  
        int lengthRow = maze.length;  
        int lengthCol = maze[0].length;  
  
        // Check the border of the row and col  
        if (row < 0 || row >= lengthRow || col < 0 || col >= lengthCol) return;  
        if (maze[row][col] == '+' || visited[row][col]) return;  
  
        // Pruning: nếu count đã >= nearest thì không cần đi tiếp  
        if (count >= nearest) return;  
        visited[row][col] = true;  
          
        // if cell is a boundary  
        if (row == 0 || row == lengthRow - 1 || col == 0 || col == lengthCol - 1) {  
            if (!(row == originalEntrance[0] && col == originalEntrance[1]))  
                nearest = Math.min(nearest, count);  
        }  
  
        for (int[] direction : directions) {  
            int newRow = row + direction[0];  
            int newCol = col + direction[1];  
            int[] newEntrance = new int[]{newRow, newCol};  
            flood(maze, newEntrance, count + 1);  
        }  
    }  
}
```

# BFS (Best Solution)

> [!check] Complexity
> Time Complexity: O(mxn)
> Space Complexity: O(mxn)


``` java
class Solution {
    public int nearestExit(char[][] maze, int[] entrance) {
        int rows = maze.length, cols = maze[0].length;
        int[][] directions = {{0,1},{0,-1},{1,0},{-1,0}};
        boolean[][] visited = new boolean[rows][cols];

        Queue<int[]> queue = new LinkedList<>();
        queue.offer(new int[]{entrance[0], entrance[1], 0}); // {row, col, steps}
        visited[entrance[0]][entrance[1]] = true;

        while (!queue.isEmpty()) {
            int[] curr = queue.poll();
            int row = curr[0], col = curr[1], steps = curr[2];

            for (int[] dir : directions) {
                int newRow = row + dir[0];
                int newCol = col + dir[1];

                if (newRow < 0 || newRow >= rows || newCol < 0 || newCol >= cols) continue;
                if (visited[newRow][newCol] || maze[newRow][newCol] == '+') continue;

                // Tìm được exit đầu tiên → chắc chắn là gần nhất
                if (newRow == 0 || newRow == rows-1 || newCol == 0 || newCol == cols-1) {
                    return steps + 1;
                }

                visited[newRow][newCol] = true;
                queue.offer(new int[]{newRow, newCol, steps + 1});
            }
        }

        return -1;
    }
}
```