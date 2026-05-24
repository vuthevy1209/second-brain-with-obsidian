---
name: obsidian-quiz-formatter
description: >
  Format raw or "dirty" quiz content into Obsidian Quiz Generator plugin syntax,
  editing the file in-place. Use this skill whenever the user provides a file (upload
  or path) and wants it formatted as Obsidian quiz questions. Trigger on phrases like
  "format quiz", "tạo quiz obsidian", "format thành quiz", "chuyển sang quiz obsidian",
  "format file này", "sửa file quiz", or when the user uploads a file with quiz-like
  content (numbered questions, A/B/C choices, true/false, fill in the blank, etc.)
  and asks to clean it up or convert it. Always edit the uploaded file content directly
  and return the fully rewritten file — do NOT create a separate output file unless
  the user explicitly asks for one.
---

# Obsidian Quiz Formatter Skill

Reads a "dirty" quiz file (handwritten notes, numbered questions, A/B/C choices,
loose text) and rewrites it **in-place** using the correct syntax for the
[Obsidian Quiz Generator plugin](https://github.com/ECuiDev/obsidian-quiz-generator).

---

## Workflow

### 1. Read the file

- If the user uploads a file → read from `/mnt/user-data/uploads/<filename>`
- If the user pastes content directly → use that content
- If neither → ask the user to provide the file or content

### 2. Clarify output style (if not specified)

Ask **one** question only:

> Bạn muốn dùng **Callout** (hiển thị đẹp trong Obsidian reading view) hay **Spaced Repetition** (dùng với plugin luyện thẻ)?

- Default to **Callout** if the user doesn't respond or says they don't know.
- For Spaced Repetition, also confirm separators if needed:
  - Inline separator (default `::`)
  - Multiline separator (default `?`)

Do **not** ask about question types — infer them automatically from content.

### 3. Parse the raw content

Handle any of these "dirty" input patterns:

| Raw pattern | Detected as |
|---|---|
| `1. Question` / `Q1:` / bare numbered items | Question stem |
| `A.` / `B.` / `a)` / `(A)` / bullet choices | Answer choices |
| `Answer: C` / `Đáp án: B` / `*C` / `✓ C` / bold/marked choice | Correct answer indicator |
| `True/False:` / yes/no question | True or False |
| `___` / `...` / `[blank]` / `( )` in question | Fill in the Blank |
| Two-column list / "Match X to Y" | Matching |
| Open question, no choices | Short or Long Answer |
| Multiple marked correct answers | Select All That Apply |

**If the correct answer is not explicitly marked**, flag that question with a comment:
```
<!-- ⚠️ Câu X: chưa rõ đáp án đúng — cần bổ sung -->
```
and still format the question structure, leaving the answer block empty for the user to fill in.

### 4. Rewrite the entire file

- Keep any non-quiz content (headings, notes, paragraphs) **as-is**.
- Replace each raw question block with the properly formatted version.
- Preserve the original order of questions.
- Renumber or relabel choices to match plugin requirements (a, b, c… or a–m / n–z for Matching).
- Strip out raw answer keys, markings, or redundant labels from the question body.

### 5. Return the result

- **Always** output the full rewritten file content inside a markdown code block.
- Save the rewritten content to `/mnt/user-data/outputs/<original_filename>` (overwrite/same name).
- Present the file using `present_files`.
- After the code block, show a short summary:
  - How many questions were formatted
  - Breakdown by type (e.g. "5 Multiple Choice, 2 True/False, 1 Short Answer")
  - How many questions had missing answers (if any)

---

## Format Reference

### True or False

**Callout:**
```
> [!question] {question}
>> [!success]- Answer
>> True
```

**Spaced Repetition:**
```
True or False: {question} :: True
```

---

### Multiple Choice (1 correct answer)

**Callout:**
```
> [!question] {question}
> a) {Choice 1}
> b) {Choice 2}
> c) {Choice 3}
> d) {Choice 4}
>> [!success]- Answer
>> a) {text of correct choice}
```

**Spaced Repetition:**
```
Multiple Choice: {question}
a) {Choice 1}
b) {Choice 2}
c) {Choice 3}
d) {Choice 4}
?
a) {text of correct choice}
```

> Letters start at `a)`, go in order. Up to 26 choices.

---

### Select All That Apply (≥2 correct answers)

**Callout:**
```
> [!question] {question}
> a) {Choice 1}
> b) {Choice 2}
> c) {Choice 3}
> d) {Choice 4}
> e) {Choice 5}
>> [!success]- Answer
>> a) {correct}
>> c) {correct}
>> e) {correct}
```

**Spaced Repetition:**
```
Select All That Apply: {question}
a) {Choice 1}
...
?
a) {correct}
c) {correct}
```

> Must have ≥2 correct answers or plugin treats it as Multiple Choice.

---

### Fill in the Blank

Each blank → `` `____` `` (backtick-wrapped underscores).
Answers comma-separated in blank order, with space after comma.

**Callout:**
```
> [!question] The `____` was signed in `____`.
>> [!success]- Answer
>> Declaration of Independence, 1863
```

**Spaced Repetition:**
```
Fill in the Blank: The `____` was signed in `____`. :: Declaration of Independence, 1863
```

---

### Matching

Group A: `a`–`m`. Group B: `n`–`z`. Up to 13 pairs.

**Callout:**
```
> [!question] {question}
>> [!example] Group A
>> a) {item}
>> b) {item}
>
>> [!example] Group B
>> n) {match}
>> o) {match}
>
>> [!success]- Answer
>> a) -> n)
>> b) -> o)
```

**Spaced Repetition:**
```
Matching: {question}
Group A
a) {item}
b) {item}
Group B
n) {match}
o) {match}
?
a) -> n)
b) -> o)
```

---

### Short Answer

**Callout:**
```
> [!question] {question}
>> [!success]- Answer
>> {1–3 sentence answer}
```

**Spaced Repetition:**
```
Short Answer: {question} :: {answer}
```

---

### Long Answer

**Callout:**
```
> [!question] {question}
>> [!success]- Answer
>> {Multi-paragraph answer}
```

**Spaced Repetition:**
```
Long Answer: {question} :: {answer}
```

---

## Critical formatting rules

- The `-` in `[!success]-` is **required** — it makes the answer collapsible. Never omit it.
- Multiline types (Multiple Choice, Matching, Select All) → use `?` separator in SR mode.
- Single-line types (T/F, Short/Long, Fill in Blank) → use `::` separator in SR mode.
- Matching Group A: `a`–`m` only. Group B: `n`–`z` only. Never mix.
- Select All That Apply: answer block must have ≥2 lines.
- Fill in the Blank answers: separated by `, ` (comma + space), never just comma.
- Blanks must be `` `____` `` — backtick-wrapped, not bare underscores.
- Remove all raw answer keys (e.g. "Answer: C", "Đáp án: B") from the formatted output — the answer belongs only inside `[!success]-`.