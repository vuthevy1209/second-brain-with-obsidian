"""Normalize the gap between multi-column blocks so the Multi-Column plugin shows no "Warning in region".
Usage: python3 fix_spacing.py FILE.md [FILE2.md ...]
Only changes blank lines between `--- end-multi-column` and the next `--- start-multi-column` (min 8 newlines, like the reference note).
"""
import re, sys

GAP = "\n" * 8
for f in sys.argv[1:]:
    s = open(f).read()
    new, n = re.subn(r"(--- end-multi-column)\n+(--- start-multi-column)", r"\1" + GAP + r"\2", s)
    open(f, "w").write(new)
    print(f, n, "gaps normalized")
