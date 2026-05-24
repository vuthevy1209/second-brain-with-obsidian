# Use 27 set => Phế vật Nếu đề bài đổi bàn cờ không còn cố định 9x9 là chết

> [!check] Complexity
> Time Complexity: 
> Space Complexity:

```java
class Solution {  
    public boolean isValidSudoku(char[][] board) {  
        List<Set<Character>> subBox = new ArrayList<>(9);  
        List<Set<Character>> rows = new ArrayList<>(9);  
        List<Set<Character>> columns = new ArrayList<>(9);  
        for (int i = 0 ; i < 9; i++) {  
            subBox.add(new HashSet<>());  
            rows.add(new HashSet<>());  
            columns.add(new HashSet<>());  
        }  
  
        int count = 0;  
  
        for (int i = 0; i < board.length; i++) {  
            for (int j = 0; j < board.length; j++) {  
                if (board[j][i] != '.')  
                    columns.get(i).add(board[j][i]);  
  
                if (board[i][j] == '.') continue;  
                rows.get(i).add(board[i][j]);  
  
                count++;  
  
                if (i >= 0 && i <= 2) {  
                    if (j >= 0 && j <= 2)  
                        subBox.get(0).add(board[i][j]);  
                    else if (j >= 3 && j <= 5)  
                        subBox.get(1).add(board[i][j]);  
                    else if (j >= 6 && j <= 8)  
                        subBox.get(2).add(board[i][j]);  
                } else if (i >= 3 && i <= 5) {  
                    if (j >= 0 && j <= 2)  
                        subBox.get(3).add(board[i][j]);  
                    else if (j >= 3 && j <= 5)  
                        subBox.get(4).add(board[i][j]);  
                    else if (j >= 6 && j <= 8)  
                        subBox.get(5).add(board[i][j]);  
                } else if (i >= 6 && i <= 8){  
                    if (j >= 0 && j <= 2)  
                        subBox.get(6).add(board[i][j]);  
                    else if (j >= 3 && j <= 5)  
                        subBox.get(7).add(board[i][j]);  
                    else if (j >= 6 && j <= 8)  
                        subBox.get(8).add(board[i][j]);  
                }  
            }  
        }  
  
        int sum = 0;  
        for (Set<Character> c : subBox) {  
            sum += c.size();  
        }  
        if (sum != count) return false;  
  
        sum = 0;  
        for (Set<Character> c : rows) {  
            sum += c.size();  
        }  
        if (sum != count) return false;  
  
        sum = 0;  
        for (Set<Character> c : columns) {  
            sum += c.size();  
        }  
        if (sum != count) return false;  
  
        return true;  
    }  
}
```

# Improved

- `(i / 3) * 3` → xác định **hàng** của box (0, 3, 6)
- `j / 3` → xác định **cột** của box (0, 1, 2)

``` java
class Solution {  
    public boolean isValidSudoku(char[][] board) {  
        boolean[][] rows = new boolean[9][9];  
        boolean[][] columns = new boolean[9][9];  
        boolean[][] boxes = new boolean[9][9];  
  
        for (int i = 0; i < board.length; i++) {  
            for (int j = 0; j < board.length; j++) {  
                if (board[i][j] == '.') continue;  
                int indexBox = (i / 3) * 3 + j / 3;  
                int temp = board[i][j] - '1';  
  
                if (rows[i][temp] || columns[j][temp] || boxes[indexBox][temp])  
                    return false;  
  
                rows[i][temp] = columns[j][temp] = boxes[indexBox][temp] = true;  
            }  
        }  
  
        return true;  
    }  
}
```