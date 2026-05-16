---
title: Daily-Note
summary: A short description will make the document more useful.
tags:
  - daily
created: 2026-05-14
---

> [!check] Complexity
> Time Complexity: O(n)
> Space Complexity: O(n)

``` java
import java.util.*;  
  
class Solution {  
    public int[] asteroidCollision(int[] asteroids) {  
        Stack<Integer> primaryStack = new Stack<>();  
        Stack<Integer> secondStack = new Stack<>();  
        List<Integer> queue = new ArrayList<>();  
  
        for (int i = 0; i < asteroids.length; i++) {  
            primaryStack.push(asteroids[i]);  
        }  
  
        while (!primaryStack.isEmpty()) {  
            Integer topPrimary = primaryStack.pop();  
            if (topPrimary > 0) {  
                if (secondStack.isEmpty()) {  
                    queue.add(topPrimary);  
                } else {  
                    while (!secondStack.isEmpty()) {  
                        Integer peekSecond = secondStack.peek();  
                        if (topPrimary > Math.abs(peekSecond)) {  
                            secondStack.pop();  
                            if (secondStack.isEmpty()) queue.add(topPrimary);  
                        }  
                        else if (topPrimary == Math.abs(peekSecond)) {  
                            secondStack.pop();  
                            break;  
                        } else {  
                            break;  
                        }  
                    }  
                }  
            } else {  
                secondStack.push(topPrimary);  
            }  
        }  
  
        while (!secondStack.isEmpty()) {  
            primaryStack.push(secondStack.pop());  
        }  
  
        while (!primaryStack.isEmpty()) {  
            queue.add(primaryStack.pop());  
        }  
  
        Collections.reverse(queue);  
        return queue.stream().mapToInt(Integer::intValue).toArray();  
    }  
}
```

### Complexity Analysis

#### Time Complexity: **O(n)**

Each asteroid is processed at most a constant number of times across all operations:

- **Initial push to `primaryStack`** — O(n)
- **Main `while` loop** — each element is popped from `primaryStack` exactly once
- **Inner `while` loop** (collision resolution) — each element pushed to `secondStack` is popped at most once _total_ across all outer iterations, not per iteration. This is the key insight — it's an **amortized O(1)** per element
- **Draining `secondStack` → `primaryStack`** -> O(k) where k ≤ n
- **Draining `primaryStack` → `queue`** -> O(k)
- **`Collections.reverse()`** -> O(n)
- **Stream `.toArray()`** -> O(n)

Every element is pushed and popped a **bounded constant number of times** across all stacks, so total work is **O(n)**.

#### Space Complexity: **O(n)**

|Structure|Worst-case size|
|---|---|
|`primaryStack`|O(n) — holds all asteroids initially|
|`secondStack`|O(n) — e.g., all asteroids are negative|
|`queue` (ArrayList)|O(n) — holds final survivors|

All three structures together hold at most O(n) elements at any point, so space is **O(n)**.


# Improve

- I just need one stack

``` java
import java.util.*;  
  
class Solution {  
    public int[] asteroidCollision(int[] asteroids) {  
        // Stack simulates the "space" 
        // holds asteroids that have survived so far
        Stack<Integer> stack = new Stack<>();  

        for (int a : asteroids) {  
	        // Tracks whether the current asteroid survives all collisions
            boolean alive = true;

            // Collision condition: current asteroid moves left (a < 0),
            // and the top of the stack moves right (stack.peek() > 0)
            while (alive && a < 0 && !stack.isEmpty() && stack.peek() > 0) {  
                if (stack.peek() < -a)
                    // Current asteroid is bigger 
                    // destroy the top and keep checking
                    stack.pop();  
                else if (stack.peek() == -a) {  
                    // Equal size — both destroy each other
                    stack.pop();  
                    alive = false;  
                }  
                else
                    // Top asteroid is bigger — current asteroid is destroyed
                    alive = false;  
            }  

            // Only add to stack if the asteroid wasn't destroyed
            if (alive) stack.push(a);  
        }  

        // Convert stack to int array for the result
        return stack.stream().mapToInt(i -> i).toArray();  
    }  
}
```