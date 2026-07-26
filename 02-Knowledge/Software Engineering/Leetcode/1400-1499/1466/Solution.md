- Treat the graph as undirected. Start a dfs from the root, if you come across an edge in the forward direction, you need to reverse the edge.

> [!check] Complexity
> Time Complexity: **O(V²)** - `List.contains()` is **O(degree)** per call, and it's called once per edge in the BFS/DFS. In the worst case (a star graph where one node connects to all others), a single node has O(N) neighbors, making that loop O(N) × O(N) = **O(N²)**.
>
> Space Complexity: O(V)
![[Solution-1779013528036.webp]]

```java
class Solution {  
    public int minReorder(int n, int[][] connections) {  
        List<List<Integer>> adjacencyLists = new ArrayList<>(n);  
        List<List<Integer>> directedAdjacencyList = new ArrayList<>();  
        for (int i = 0; i < n; i++)  
            adjacencyLists.add(new ArrayList<>());  
  
        for (int[] connection : connections) {  
            directedAdjacencyList.get(connection[0]).add(connection[1]);  
  
            // Treat the graph as undirected.  
            adjacencyLists.get(connection[0]).add(connection[1]);  
            adjacencyLists.get(connection[1]).add(connection[0]);  
        }  
  
        int count = 0;  
        Stack<Integer> stack = new Stack<>();  
        boolean[] isVisited = new boolean[n];  
        stack.push(0);  
  
        while (!stack.isEmpty()) {  
            int node = stack.pop();  
            isVisited[node] = true;  
  
            List<Integer> adj = adjacencyLists.get(node);  
            for (int i = 0; i < adj.size(); i++) {  
                if (isVisited[adj.get(i)]) continue;  
                stack.push(adj.get(i));  
                // check whether there is existed a path from node to adj node
                if (directedAdjacencyList.get(node).contains(adj.get(i)))  
                    count++;  
            }  
        }  
  
        return count;  
    }  
}
```


# Using HashSet instead of directedAdjacencyList

> [!check] Complexity
> Time Complexity:**O(V + E)** — each node and edge visited once; `HashSet.contains` is O(1)
> Space Complexity: **O(V + E)** — adjacency list + edge set

```java
class Solution {
    public int minReorder(int n, int[][] connections) {
        List<List<Integer>> adjacencyLists = new ArrayList<>(n);
        Set<Long> directedEdges = new HashSet<>();  // encode edge as single long

        for (int i = 0; i < n; i++)
            adjacencyLists.add(new ArrayList<>());

        for (int[] connection : connections) {
            // encode directed edge as: from * n + to
            directedEdges.add((long) connection[0] * n + connection[1]);

            adjacencyLists.get(connection[0]).add(connection[1]);
            adjacencyLists.get(connection[1]).add(connection[0]);
        }

        int count = 0;
        Stack<Integer> stack = new Stack<>();
        boolean[] isVisited = new boolean[n];
        stack.push(0);

        while (!stack.isEmpty()) {
            int node = stack.pop();
            isVisited[node] = true;

            for (int neighbor : adjacencyLists.get(node)) {
                if (isVisited[neighbor]) continue;
                stack.push(neighbor);
                if (directedEdges.contains((long) node * n + neighbor))
                    count++;
            }
        }

        return count;
    }
}
```
