
> [!check] Complexity
> Time Complexity: O(E + Q × (V + E))
> Space Complexity: O(V + E + Q)

```java
import java.util.*;

class Solution {  
    private final Map<String, Map<String, Double>> graph = new HashMap<>();  
    Set<String> visited;  
  
    public double[] calcEquation(List<List<String>> equations, double[] values, List<List<String>> queries) {  
        buildGraph(equations, values);  
  
        double[] results = new double[queries.size()];  
  
        int i = 0;  
        for(List<String> query : queries) {  
            String nodeA = query.get(0);  
            String nodeB = query.get(1);  
            visited = new HashSet<>();  
  
            if (!graph.containsKey(nodeA) || !graph.containsKey(nodeB)) {  
                results[i] = -1.0;  
            } else {  
                double result = dfs(nodeA, nodeB, 1);  
                results[i] = Math.round(result * 100000.0) / 100000.0;  
            }  
  
            i++;  
        }  
  
        return results;  
    }  
  
    double dfs(String nodeA, String nodeB, double product) {  
        if (nodeA.equals(nodeB)) {  
            return product;  
        }  
  
        visited.add(nodeA);  
  
        Map<String, Double> adj = graph.get(nodeA);  
        for (Map.Entry<String, Double> entry : adj.entrySet()){  
            if (visited.contains(entry.getKey())) continue;  
            // chỉ return khi tìm được đường, không return -1 ngay  
            double result = dfs(entry.getKey(), nodeB, product * entry.getValue());  
            if (result != -1) return result;  
        }  
  
        return -1;  
    }  
  
    void buildGraph(List<List<String>> equations, double[] values) {  
        for (int i = 0; i < equations.size(); i++) {  
            String val1 = equations.get(i).get(0);  
            String val2 = equations.get(i).get(1);  
  
            Map<String, Double> map1 = graph.getOrDefault(val1, new HashMap<>());  
            map1.put(val2, values[i]);  
            graph.put(val1, map1);  
  
            Map<String, Double> map2 = graph.getOrDefault(val2, new HashMap<>());  
            map2.put(val1, 1 / values[i]);  
            graph.put(val2, map2);  
        }  
    }  
}
```

### Complexity Analysis

#### Time Complexity

**`buildGraph`** — **O(E)**

- Duyệt qua `E` equations, mỗi lần thao tác HashMap là O(1)

**`dfs`** — **O(V + E)**

- Mỗi node chỉ visit **1 lần** nhờ `visited` set
- Mỗi edge được duyệt tối đa **1 lần**

**`calcEquation`** — **O(Q × (V + E))**

- `Q` queries, mỗi query chạy DFS tốn O(V + E)
- Reset `visited` mỗi query: O(1)

```
Tổng: O(E + Q × (V + E))
```

---

#### Space Complexity

|Thành phần|Space|Lý do|
|---|---|---|
|`graph`|O(V + E)|V node, mỗi node lưu các edge|
|`visited`|O(V)|Tối đa V node trong 1 lần DFS|
|DFS call stack|O(V)|Tệ nhất DFS đi qua hết V node|
|`results`|O(Q)|Mảng kết quả|

```
Tổng: O(V + E + Q)
```


#### Trong bài này cụ thể

- **V** = số biến phân biệt (vd: `"a"`, `"b"`, `"c"`)
- **E** = số equations (mỗi equation tạo **2 edge** do graph vô hướng)
- **Q** = số queries
