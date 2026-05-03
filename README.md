---
created: 2026-05-03
---
## What Makes This Different From a Normal Notes App

[LLM Wiki By Karpathy](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)

https://www.youtube.com/watch?v=40GPEEj3ijg

>In addition to Notion, I will use Obsidian to take notes more effectively. You can sync it with git, open it in VS Code, view it in Obsidian, push it to a private GitHub repo, or read it in a terminal. The knowledge is yours in the most literal sense.

- **Traditional notes app**: You remember where something is and navigate to it
- **LLM wiki**: You describe what you need in plain language, and Claude finds and synthesizes it across your entire knowledge bases

![[Pasted image 20260503140511.png]]
## How Karpathy’s LLM Wiki Actually Works

The architecture is minimal. There are three components:

**1. A folder of markdown files** This is your knowledge base. It can contain anything: research notes, meeting summaries, project documentation, book notes, personal reference material, code snippets with explanations.

**2. A consistent structure within each file** Good LLM wikis use a consistent internal format — a title, a brief summary, tagged topics, and then the content. The model uses this structure to locate relevant information faster.

**3. Claude Code as the query interface** You open a terminal, navigate to your wiki folder, launch Claude Code, and ask it a question. Claude reads the files it needs, synthesizes an answer, and can even update or add notes when you ask it to.

>That’s it. No database. No vector embeddings (though you can add them later). No server. Just files and a capable model.

### The Role of Claude Code

Claude Code is Anthropic’s terminal-based coding agent. Unlike Claude in a browser, Claude Code runs in your local environment and has direct access to your filesystem. It can:

- Read specific files or entire directories
- Search across files for relevant content
- Create new files or update existing ones
- Execute shell commands to search, filter, or organize your notes

This makes it genuinely useful as a knowledge base interface. You’re not copy-pasting chunks of text into a chat window — the model is working directly with your files.

## Best Practice for a Queryable Knowledge Base

A few structural habits make a significant difference in how well Claude can work with your wiki.

#### Write Summaries, Not Just Content

> The one-line summary at the top of each note is surprisingly important. Claude reads it to decide whether the full note is relevant. A good summarize costs you ten seconds and saves the model from reading files that don't apply.
#### Use Consistent Terminology

> If you write "RAG" in some notes and "retrieval augmented generation" in others, Claude can still connect them - but you will get cleaner results if you pick one term and use it consistently. Add a brief alias line if a concept has multiple names.

#### Link Notes to Each Other

> Obsidian's `[[wiki link]]` format creates connection between notes. Claude can follow these connections, which means a well-linked wiki gives the model a richer graph to reason over than a flat collection of isolated files.

#### Keep Notes Focused

> A 10,000-word catch-all document is harder to query than ten focused 1000-word notes. If a note is covering multiple distinct topics, split it. The more specific each file, the more precisely Claude can locate and apply it.

#### Use a `/inbox` Pattern for Capture

>Don't let `perfect` be the enemy of `useful`, just capture your thoughts in the inbox and let Claude help you sort them out later.
> => Claude: Look at my inbox folder and suggest where each note should be filed and what tags it should get._

### ## Advanced: Adding Semantic Search

This is where RAG (Retrieval Augmented Generation) comes in. Tools like [LlamaIndex](https://www.llamaindex.ai/) let you build a vector index over your markdown files, which Claude can query to retrieve the most semantically relevant chunks before synthesizing an answer.
