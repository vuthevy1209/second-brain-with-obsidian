
> [!check] Complexity
> Time Complexity: O(n^2)
> Space Complexity: O(n)

```java
class Solution {  
    public int findCircleNum(int[][] isConnected) {  
        int numberOfNode = isConnected.length;  
  
        int countProvince = 0;  
        boolean[] isVisited = new boolean[numberOfNode];  
  
        for (int i = 0; i < numberOfNode; i++) {  
            if (isVisited[i]) continue;  
            countProvince++;  
            visitProvince(i, isConnected, isVisited);  
        }  
  
        return countProvince;  
    }  
  
    void visitProvince(Integer node, int[][] isConnected, boolean[] isVisited) {  
        Stack<Integer> stack = new Stack<>();  
        stack.push(node);  
  
        while (!stack.isEmpty()) {  
            Integer n = stack.pop();  
            if (isVisited[n]) continue;  
  
            isVisited[n] = true;  
            for (int i = 0; i < isConnected.length; i++){  
                if (isConnected[n][i] == 1)   
                    stack.push(i);  
            }  
        }  
    }  
}
```

# Use Adjacency List

> [!check] Complexity
> Time Complexity: O(n^2)
> Space Complexity: O(n^2)

```java
class Solution {  
    public int findCircleNum(int[][] isConnected) {  
        int numberOfNode = isConnected.length;  
        List<List<Integer>> adjacencyLists = new ArrayList<>();  
        for (int i = 1; i <= numberOfNode; i++)  
            adjacencyLists.add(new ArrayList<>());  
  
        for (int i = 0; i < numberOfNode; i++) {  
            for (int j = 0; j < numberOfNode; j++) {  
                if (isConnected[i][j] == 1) {  
                    adjacencyLists.get(i).add(j);  
                }  
            }  
        }  
          
        int countProvince = 0;  
        boolean[] isVisited = new boolean[numberOfNode];  
          
        for (int i = 0; i < numberOfNode; i++) {  
            if (isVisited[i]) continue;  
            countProvince++;  
            visitProvince(i, adjacencyLists, isVisited);  
        }  
  
        return countProvince;  
    }  
  
    void visitProvince(Integer node, List<List<Integer>> adjacencyLists, boolean[] isVisited) {  
        Stack<Integer> stack = new Stack<>();  
        stack.push(node);  
          
        while (!stack.isEmpty()) {  
            Integer n = stack.pop();  
            if (isVisited[n]) continue;  
              
            isVisited[n] = true;  
            List<Integer> adjList = adjacencyLists.get(n);  
            for (int i = 0; i < adjList.size(); i++) {  
                stack.push(adjList.get(i));  
            }  
        }  
    }  
}
```

