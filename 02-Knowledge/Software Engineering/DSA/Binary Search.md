---
title: Binary Search
summary: Binary search algorithm — from fundamentals to advanced patterns, including Lower/Upper Bound and classic problem types.
tags:
  - dsa
  - binary-search
  - algorithm
created: 2026-05-28
---

## 1. Core Idea

Binary Search is a search algorithm that operates on a **sorted or monotonically structured** search space. Instead of scanning every element $O(n)$, each step **eliminates half** of the remaining space, achieving $O(\log n)$ time complexity.

> [!important] Prerequisite for Applying Binary Search
> The search space must satisfy a **monotonic property**:  
> There exists a threshold $k$ such that `f(x) = false` for all `x < k` and `f(x) = true` for all `x >= k` (or vice versa).  
> A sorted array is simply a special case of this property.

---

## 2. Standard Templates

There are **3 core templates**. Understanding each one prevents off-by-one errors.

### 2.1 Exact Search (Classic Binary Search)

![[Binary Search-1779936430673.webp]]

```cpp
// Find target in a sorted array. Return its index, or -1 if not found.
int binarySearch(vector<int>& nums, int target) {
    int lo = 0, hi = nums.size() - 1;

    while (lo <= hi) {               // condition: lo <= hi
        int mid = lo + (hi - lo) / 2; // avoids integer overflow
        
        if (nums[mid] == target) return mid;
        else if (nums[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1; // not found
}
```

> [!note] Why `mid = lo + (hi - lo) / 2` instead of `(lo + hi) / 2`?
> If both `lo` and `hi` are near `INT_MAX`, the sum `lo + hi` causes **integer overflow**. The formula `lo + (hi - lo) / 2` is safe because `(hi - lo)` is always non-negative and well within range.

---

### 2.2 Lower Bound — First index `≥ target`

<mark style="background:#d3f8b6">Lower Bound</mark> returns the **smallest index** `i` such that `nums[i] >= target`.  
If all elements are smaller than `target`, it returns `n` (past the end).

```cpp
// Equivalent to: std::lower_bound(nums.begin(), nums.end(), target)
int lowerBound(vector<int>& nums, int target) {
    int lo = 0, hi = nums.size(); // hi = n (not n-1)

    while (lo < hi) {              // condition: lo < hi (NO equal sign)
        int mid = lo + (hi - lo) / 2;
        
        if (nums[mid] < target) lo = mid + 1;
        else hi = mid;             // nums[mid] >= target: narrow right side
    }
    return lo; // lo == hi, the first position >= target
}
```

**Step-by-step trace:**
```
nums   = [1, 3, 5, 5, 7, 9]
target = 5

Step 1: lo=0, hi=6, mid=3 → nums[3]=5 >= 5 → hi=3
Step 2: lo=0, hi=3, mid=1 → nums[1]=3 < 5  → lo=2
Step 3: lo=2, hi=3, mid=2 → nums[2]=5 >= 5 → hi=2
End:    lo=hi=2 → return 2  ✓ (first occurrence of 5)
```

---

### 2.3 Upper Bound — First index `> target`

<mark style="background:#d3f8b6">Upper Bound</mark> returns the **smallest index** `i` such that `nums[i] > target`.  
Used to find the **end of a range** of equal values.

```cpp
// Equivalent to: std::upper_bound(nums.begin(), nums.end(), target)
int upperBound(vector<int>& nums, int target) {
    int lo = 0, hi = nums.size();

    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        
        if (nums[mid] <= target) lo = mid + 1; // note: <= instead of <
        else hi = mid;
    }
    return lo;
}
```

**Step-by-step trace:**
```
nums   = [1, 3, 5, 5, 7, 9]
target = 5

Step 1: lo=0, hi=6, mid=3 → nums[3]=5 <= 5 → lo=4
Step 2: lo=4, hi=6, mid=5 → nums[5]=9 > 5  → hi=5
Step 3: lo=4, hi=5, mid=4 → nums[4]=7 > 5  → hi=4
End:    lo=hi=4 → return 4  ✓ (first position after the range of 5s)
```

---

### 2.4 Lower Bound vs Upper Bound — Comparison

| | Lower Bound | Upper Bound |
|---|---|---|
| **Returns** | First index `≥ target` | First index `> target` |
| **Shrink condition** | `nums[mid] < target` → `lo = mid + 1` | `nums[mid] <= target` → `lo = mid + 1` |
| **C++ STL** | `std::lower_bound` | `std::upper_bound` |
| **Use case** | Find the start of target's range | Find the end of target's range |

**Combining both to count occurrences:**
```cpp
int countOccurrences(vector<int>& nums, int target) {
    int lo = lowerBound(nums, target);
    int hi = upperBound(nums, target);
    return hi - lo; // number of elements equal to target
}
// [1,3,5,5,7,9], target=5 → lo=2, hi=4 → count = 2 ✓
```

---

## 3. General Framework: Binary Search on Answer

Many problems are not about "searching in an array" but about **"finding an optimal value"** — we binary search directly on the answer space.

> [!tip] Recognizing a "Binary Search on Answer" Problem
> - The problem asks: *"Find the **minimum/maximum** value satisfying condition X"*
> - A `check(mid)` function can be written in $O(n)$ or $O(n \log n)$
> - The result is monotonic: if `x` satisfies the condition, then all `y > x` (or `y < x`) also satisfy it

**General template:**
```cpp
// Find the MINIMUM value satisfying the condition
int lo = MIN_VAL, hi = MAX_VAL;

while (lo < hi) {
    int mid = lo + (hi - lo) / 2;
    if (check(mid)) hi = mid;   // mid could be the answer, shrink right
    else lo = mid + 1;          // mid fails, discard it
}
return lo;

// Find the MAXIMUM value satisfying the condition
while (lo < hi) {
    int mid = lo + (hi - lo + 1) / 2; // +1 to avoid infinite loop
    if (check(mid)) lo = mid;   // mid satisfies, try for larger
    else hi = mid - 1;
}
return lo;
```

> [!warning] When finding MAX: use `mid = lo + (hi - lo + 1) / 2`
> If `lo = mid` and `mid = (lo + hi) / 2`, when `lo = hi - 1` then `mid = lo` → infinite loop.  
> Rounding up (`+1`) ensures `mid` always moves toward `hi`.

---

## 4. Classic Problems

### 4.1 Sqrt(x) — Integer Square Root

> Find the largest integer `k` such that `k * k <= x`.

```cpp
int mySqrt(int x) {
    if (x < 2) return x;
    int lo = 1, hi = x / 2; // sqrt(x) <= x/2 for x >= 4
    
    while (lo < hi) {
        long long mid = lo + (hi - lo + 1) / 2; // find max → round up
        if (mid * mid <= x) lo = mid;
        else hi = mid - 1;
    }
    return lo;
}
// x=8 → return 2 (since 2²=4≤8, 3²=9>8)
```

---

### 4.2 Koko Eating Bananas — Binary Search on Speed

> Koko has `n` piles of bananas and `h` hours. She eats at speed `k` bananas/hour from one pile.  
> Find the minimum `k` to finish all bananas within `h` hours.

```cpp
bool canFinish(vector<int>& piles, int k, int h) {
    long long hours = 0;
    for (int pile : piles)
        hours += (pile + k - 1) / k; // ceil(pile / k)
    return hours <= h;
}

int minEatingSpeed(vector<int>& piles, int h) {
    int lo = 1, hi = *max_element(piles.begin(), piles.end());
    
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (canFinish(piles, mid, h)) hi = mid; // find min → shrink right
        else lo = mid + 1;
    }
    return lo;
}
```

---

### 4.3 Minimum in Rotated Sorted Array

> Find the minimum element in a sorted array that has been rotated.

```cpp
// [4,5,6,7,0,1,2] → return 0
int findMin(vector<int>& nums) {
    int lo = 0, hi = nums.size() - 1;
    
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        // If mid > hi, the minimum lies in the right half
        if (nums[mid] > nums[hi]) lo = mid + 1;
        // Otherwise, the minimum lies in the left half (including mid)
        else hi = mid;
    }
    return nums[lo];
}
```

**Visual trace:**
```
[4, 5, 6, 7, 0, 1, 2]
 lo          hi
       mid=3: nums[3]=7 > nums[6]=2 → lo=4

[4, 5, 6, 7, 0, 1, 2]
             lo hi
          mid=5: nums[5]=1 ≤ nums[6]=2 → hi=5

[4, 5, 6, 7, 0, 1, 2]
             lo=hi=4 → return nums[4] = 0 ✓
```

---

### 4.4 Search in Rotated Sorted Array

> Find `target` in a rotated sorted array. Return its index or -1.

```cpp
int search(vector<int>& nums, int target) {
    int lo = 0, hi = nums.size() - 1;
    
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] == target) return mid;
        
        // Determine which half is sorted
        if (nums[lo] <= nums[mid]) { // left half is sorted
            if (nums[lo] <= target && target < nums[mid])
                hi = mid - 1; // target lies in left half
            else
                lo = mid + 1;
        } else {                     // right half is sorted
            if (nums[mid] < target && target <= nums[hi])
                lo = mid + 1; // target lies in right half
            else
                hi = mid - 1;
        }
    }
    return -1;
}
```

---

### 4.5 Find Peak Element

> Find any peak element (greater than its neighbors). The array is not necessarily sorted.

```cpp
// [1,2,3,1] → return 2 (nums[2]=3 is a peak)
int findPeakElement(vector<int>& nums) {
    int lo = 0, hi = nums.size() - 1;
    
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        // If mid < mid+1: the slope is rising, a peak must be on the right
        if (nums[mid] < nums[mid + 1]) lo = mid + 1;
        else hi = mid; // a peak is on the left (including mid)
    }
    return lo;
}
```

> [!note] Why does Binary Search work here even though the array is unsorted?
> Because a local monotonic property still holds: if `nums[mid] < nums[mid+1]`, there must be at least one peak to the right (the array cannot keep rising forever since it has finite length).

---

### 4.6 Capacity To Ship Packages — Binary Search on Load

> Given `n` packages with `weights[i]`, a ship must deliver all packages within `D` days.  
> Find the minimum ship capacity required.

```cpp
bool canShip(vector<int>& weights, int capacity, int days) {
    int daysNeeded = 1, currentLoad = 0;
    for (int w : weights) {
        if (currentLoad + w > capacity) {
            daysNeeded++;
            currentLoad = 0;
        }
        currentLoad += w;
    }
    return daysNeeded <= days;
}

int shipWithinDays(vector<int>& weights, int days) {
    // lo = max(weights): must carry the heaviest single package
    // hi = sum(weights): worst case, ship everything in one day
    int lo = *max_element(weights.begin(), weights.end());
    int hi = accumulate(weights.begin(), weights.end(), 0);
    
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (canShip(weights, mid, days)) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}
```

---

### 4.7 Median of Two Sorted Arrays — Binary Search on Partition

> Find the median of two sorted arrays in $O(\log(\min(m,n)))$.

```cpp
double findMedianSortedArrays(vector<int>& A, vector<int>& B) {
    if (A.size() > B.size()) swap(A, B); // ensure A is the shorter array
    int m = A.size(), n = B.size();
    int lo = 0, hi = m;
    
    while (lo <= hi) {
        int i = lo + (hi - lo) / 2; // partition index in A
        int j = (m + n + 1) / 2 - i; // partition index in B
        
        int maxLeftA  = (i == 0) ? INT_MIN : A[i - 1];
        int minRightA = (i == m) ? INT_MAX : A[i];
        int maxLeftB  = (j == 0) ? INT_MIN : B[j - 1];
        int minRightB = (j == n) ? INT_MAX : B[j];
        
        if (maxLeftA <= minRightB && maxLeftB <= minRightA) {
            // Found the correct partition
            if ((m + n) % 2 == 0)
                return (max(maxLeftA, maxLeftB) + min(minRightA, minRightB)) / 2.0;
            else
                return max(maxLeftA, maxLeftB);
        } else if (maxLeftA > minRightB) {
            hi = i - 1; // move partition A to the left
        } else {
            lo = i + 1; // move partition A to the right
        }
    }
    return -1;
}
```

---

### 4.8 Aggressive Cows (SPOJ) — Binary Search on Distance

> There are `n` stalls on a number line and `k` cows to place. Maximize the minimum distance between any two cows.

```cpp
bool canPlace(vector<int>& stalls, int k, int minDist) {
    int count = 1, last = stalls[0];
    for (int i = 1; i < stalls.size(); i++) {
        if (stalls[i] - last >= minDist) {
            count++;
            last = stalls[i];
            if (count == k) return true;
        }
    }
    return false;
}

int aggressiveCows(vector<int>& stalls, int k) {
    sort(stalls.begin(), stalls.end());
    int lo = 1, hi = stalls.back() - stalls[0];
    
    while (lo < hi) {
        int mid = lo + (hi - lo + 1) / 2; // find max → round up
        if (canPlace(stalls, k, mid)) lo = mid;
        else hi = mid - 1;
    }
    return lo;
}
```

---

### 4.9 Kth Smallest Element in Sorted Matrix

> In an `n x n` matrix where each row and column is sorted in ascending order, find the k-th smallest element.

```cpp
// Count elements in matrix that are <= mid
int countLessEqual(vector<vector<int>>& matrix, int mid) {
    int n = matrix.size(), count = 0;
    int row = n - 1, col = 0; // start from bottom-left corner
    while (row >= 0 && col < n) {
        if (matrix[row][col] <= mid) {
            count += row + 1; // all elements above this column are <= mid
            col++;
        } else {
            row--;
        }
    }
    return count;
}

int kthSmallest(vector<vector<int>>& matrix, int k) {
    int n = matrix.size();
    int lo = matrix[0][0], hi = matrix[n-1][n-1];
    
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (countLessEqual(matrix, mid) >= k) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}
```

---

### 4.10 Split Array Largest Sum — Binary Search + Greedy

> Split array into `k` non-empty contiguous subarrays to minimize the maximum subarray sum.

```cpp
bool canSplit(vector<int>& nums, int k, int maxSum) {
    int parts = 1, currentSum = 0;
    for (int num : nums) {
        if (currentSum + num > maxSum) {
            parts++;
            currentSum = 0;
            if (parts > k) return false;
        }
        currentSum += num;
    }
    return true;
}

int splitArray(vector<int>& nums, int k) {
    int lo = *max_element(nums.begin(), nums.end());
    int hi = accumulate(nums.begin(), nums.end(), 0);
    
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (canSplit(nums, k, mid)) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}
```

---

## 5. Binary Search on Floating Point Numbers

When the answer is a real number, use a fixed iteration count instead of `lo < hi`.

```cpp
// Example: Find the cube root of x
double cubicRoot(double x) {
    double lo = -1000, hi = 1000;
    
    for (int iter = 0; iter < 100; iter++) { // 100 iterations ≈ 10^-30 precision
        double mid = (lo + hi) / 2.0;
        if (mid * mid * mid < x) lo = mid;
        else hi = mid;
    }
    return lo;
}

// Alternatively, use epsilon
double bsReal(double lo, double hi) {
    const double EPS = 1e-9;
    while (hi - lo > EPS) {
        double mid = (lo + hi) / 2.0;
        if (check(mid)) hi = mid;
        else lo = mid;
    }
    return (lo + hi) / 2.0;
}
```

---

## 6. Summary & Checklist

### Template Comparison Table

| Template | Loop Condition | Mid Formula | When to Use |
|---|---|---|---|
| Classic | `lo <= hi` | `lo + (hi-lo)/2` | Exact match, return immediately when found |
| Lower Bound | `lo < hi` | `lo + (hi-lo)/2` | First position `>= target` |
| Upper Bound | `lo < hi` | `lo + (hi-lo)/2` | First position `> target` |
| Find Maximum | `lo < hi` | `lo + (hi-lo+1)/2` | Binary search on answer (maximize) |
| Find Minimum | `lo < hi` | `lo + (hi-lo)/2` | Binary search on answer (minimize) |

### Binary Search Checklist

- [ ] Identify the **search space**: searching in an array, or searching over possible answers?
- [ ] Verify **monotonicity**: is the check function truly monotonic?
- [ ] Set **lo and hi** correctly (does the answer lie within `[lo, hi]`?)
- [ ] Choose between `lo <= hi` vs `lo < hi`
- [ ] When finding MAX: use `mid = lo + (hi-lo+1)/2` to avoid infinite loop
- [ ] Double-check **off-by-one**: `hi = mid` or `hi = mid-1`? `lo = mid` or `lo = mid+1`?
- [ ] Handle **edge cases**: empty array, single element, target not present

---

## 7. Complexity

| | Time Complexity | Space Complexity |
|---|---|---|
| Classic Binary Search | $O(\log n)$ | $O(1)$ |
| Binary Search on Answer | $O(\log(\text{range}) \times O(\text{check}))$ | $O(1)$ |
| Lower / Upper Bound | $O(\log n)$ | $O(1)$ |

---

# Quiz

> [!question] Array `nums = [1,3,5,7,9]`, `target = 6`. What does Lower Bound return?
> a) 2  
> b) 3  
> c) 4  
> d) -1  
>> [!success]- Answer
>> b) 3
>> 
>> Lower Bound finds the smallest index where the value is `>= 6`. `nums[3] = 7 >= 6` and no smaller index satisfies this. Note: it returns the **index**, not the value.

> [!question] Why do we use `mid = lo + (hi - lo + 1) / 2` when searching for the maximum value?
> a) To speed up the search  
> b) To prevent an infinite loop when `lo = hi - 1` and we set `lo = mid`  
> c) Because integer division always rounds down  
> d) Both b and c  
>> [!success]- Answer
>> d) Both b and c
>> 
>> When `lo = hi - 1` and we do `lo = mid`, using `mid = (lo+hi)/2` gives `mid = lo` → the loop never terminates. Rounding up with `+1` ensures `mid = hi` in this case, making progress.

> [!question] Which of the following problems CANNOT be solved with Binary Search?
> a) Find the median of two sorted arrays  
> b) Find the k-th smallest element in a row-and-column sorted matrix  
> c) Find the shortest period of a string  
> d) Find the minimum ship capacity to deliver packages within D days  
>> [!success]- Answer
>> c) Find the shortest period of a string
>> 
>> String period detection has no suitable monotonic property for binary search. The other problems all have a monotonic search space with a well-defined check function.

> [!question] For Binary Search on Answer to work, what must the `check(mid)` function satisfy?
> a) It must run in O(1)  
> b) It must return a monotonic result: if `check(x) = true`, then `check(y) = true` for all `y > x` (or all `y < x`)  
> c) It must be implemented recursively  
> d) The search space must consist of integers only  
>> [!success]- Answer
>> b) Monotonic result
>> 
>> This is the fundamental requirement: the monotonicity of the check function guarantees that Binary Search can eliminate half the search space at every step.
