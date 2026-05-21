# Brute Force

> [!check] Complexity
> Time Complexity: **O(n × m × L)** 
> — duyệt tất cả cặp số, rất chậm khi mảng lớn.
>
> Space Complexity: O(1)

```java
class Solution {  
    private int countCommonPrefix(int num1, int num2) {  
        String s1 = String.valueOf(num1);  
        String s2 = String.valueOf(num2);  
  
        int i = 0;  
        int j = 0;  
        int count = 0;  
        while (i < s1.length() && j < s2.length()  
	                && Objects.equals(s1.charAt(i), s2.charAt(j))) {  
            count++;  
            i++;  
            j++;  
        }  
        return count;  
    }  
  
    public int longestCommonPrefix(int[] arr1, int[] arr2) {  
        int max = 0;  
        for(int i = 0; i < arr1.length; i++) {  
            for (int j = 0; j < arr2.length; j++) {  
                max = Math.max(max, countCommonPrefix(arr1[i], arr2[j]));  
            }  
        }  
  
        return max;  
    }  
}
```


# use Set
#### Ý tưởng: Dùng HashSet lưu tất cả prefix của arr1

Với mỗi số trong `arr1`, sinh ra tất cả prefix của nó và lưu vào Set. Sau đó với mỗi số trong `arr2`, kiểm tra prefix dài nhất có tồn tại trong Set không.

> [!check] Complexity
> Time Complexity: O((n + m) × L)
> Space Complexity: **O(n × L²)** 
> - Mỗi số trong arr1 sinh ra tối đa **L prefix**
> - Mỗi prefix dài tối đa **L ký tự**


```java
class Solution {
    public int longestCommonPrefix(int[] arr1, int[] arr2) {
        Set<String> prefixes = new HashSet<>();

        // Lưu tất cả prefix của arr1
        for (int num : arr1) {
            String s = String.valueOf(num);
            for (int i = 1; i <= s.length(); i++) {
                prefixes.add(s.substring(0, i));
            }
        }

        int max = 0;

        // Với mỗi số trong arr2, kiểm tra prefix dài nhất khớp
        for (int num : arr2) {
            String s = String.valueOf(num);
            for (int i = 1; i <= s.length(); i++) {
                if (prefixes.contains(s.substring(0, i))) {
                    max = Math.max(max, i);
                }
            }
        }

        return max;
    }
}
```

# Trie

``` java
class TrieNode{  
    TrieNode[] child;  
  
    TrieNode(){  
        child=new TrieNode[10];  
    }  
}  
  
  
  
class Solution {  
    public int longestCommonPrefix(int[] arr1, int[] arr2) {  
        TrieNode root=new TrieNode();  
  
        for(int num:arr1){  
            insert(root,num);  
        }  
  
        int maxPrefix=0;  
        for(int num:arr2){  
            maxPrefix=Math.max(maxPrefix,search(root,num));  
        }  
        return maxPrefix;  
    }  
    private int search(TrieNode root, int num){  
        String s=String.valueOf(num);  
        TrieNode node=root;  
        int count=0;  
        for(char c:s.toCharArray()){  
            int d=c-'0';  
            if(node.child[d]==null){  
                break;  
            }  
            node=node.child[d];  
            count++;  
        }  
        return count;  
    }  
  
    private void insert(TrieNode root, int num) {  
        TrieNode node = root;  
        String s = String.valueOf(num);  
  
        for (char c : s.toCharArray()) {  
            int d = c - '0';  
            if (node.child[d] == null) {  
                node.child[d] = new TrieNode();  
            }  
            node = node.child[d];  
        }  
    }  
}
```