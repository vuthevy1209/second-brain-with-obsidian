>In addition to Notion, I will use Obsidian to take notes more effectively. You can sync it with git, open it in VS Code, view it in Obsidian, push it to a private GitHub repo, or read it in a terminal. The knowledge is yours in the most literal sense.

- **Traditional notes app**: You remember where something is and navigate to it
- **LLM wiki**: You describe what you need in plain language, and Claude finds and synthesizes it across your entire knowledge base
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