# Header

> [!check] Complexity
> Time Complexity: O(N + E) Where **N** = number of rooms, **E** = total number of keys across all rooms.
> 
> Space Complexity: O(N + E) 
> - `isVisited` list: O(N) - One boolean per room
> - Stack (worst case): O(E) - All keys pushed before any pop

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
    public boolean canVisitAllRooms(List<List<Integer>> rooms) {  
        int numberOfNode = rooms.size();  
        List<Boolean> isVisited = new ArrayList<>(numberOfNode);  
        for (int i = 1; i <= numberOfNode; i++) isVisited.add(false);  
  
        Stack<Pair<Integer, List<Integer>>> stack = new Stack<>();  
        stack.push(new Pair<>(0, rooms.getFirst()));  
  
        while (!stack.isEmpty()) {  
            Pair<Integer, List<Integer>> node = stack.pop();  
            if (isVisited.get(node.first)) continue;  
  
            isVisited.set(node.first, true);  
            List<Integer> keys = node.second;  
            for (int room : keys) {  
                List<Integer> keyOfThisRoom = rooms.get(room);  
                stack.push(new Pair<>(room, keyOfThisRoom));  
            }  
        }  
  
        for (Boolean v : isVisited) {  
            if (v == false) return false;  
        }  
  
        return true;  
    }  
}
```

# Clean

``` java
Stack<Integer> stack = new Stack<>();
stack.push(0);
while (!stack.isEmpty()) {
    int room = stack.pop();
    if (isVisited.get(room)) continue;
    isVisited.set(room, true);
    for (int key : rooms.get(room))
        stack.push(key);
}
```