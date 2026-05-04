# Second Brain Wiki

This is an LLM-optimized knowledge base using Obsidian + Claude Code.

## Architecture Overview

The system uses a **modified PARA-style organization** with these core components:
1. **Markdown File Collection** - Your knowledge base stored as interconnected .md files
2. **Consistent Note Structure** - Standardized format enabling efficient information retrieval
3. **Claude Code Interface** - Natural language query system that reads, synthesizes, and updates your files

### Organization Method

Your vault structure follows a **numbered folder system** with category-based grouping:

- **01-Inbox** - Capture bucket for unsorted notes (GTD-style inbox)
- **02-Knowledge** - Permanent knowledge notes (similar to PARA's "Resources" but broader)
- **03-Projects** - Active project documentation (PARA's "Projects")
- **04-References** - Reference material and cheatsheets
- **05-Archive** - Completed/inactive items (PARA's "Archives")
- **06 In The Future** - Backlog and ideas (not in standard PARA)
- **07-Clippings** - Web clippings from Chrome extension

This is a **custom hybrid** combining PARA principles with GTD inbox processing and specialized folders for references, clippings, and future ideas.

## Project Structure

```
├── 01-Inbox/           # Unsorted notes, capture anything here first
├── 02-Knowledge/       # Main knowledge notes (research, concepts, learnings)
│   └── Claude Skill/   # Claude-related skills and techniques
│       └── Claude Code/ # Claude Code specific notes
├── 03-Projects/        # Project-specific documentation
├── 04-References/      # Reference material, cheatsheets, external resources
├── 05-Archive/         # Archived/inactive notes
├── 06 In The Future/   # Backlog, ideas, future plans
├── 07-Clippings/       # Web clippings saved via Chrome extension web clipper
├── Templates/           # Note templates
└── Excalidraw/          # Drawings and diagrams
```

## Note Format

All notes should follow this structure for optimal Claude Code performance:

```markdown
---
title: Note Title
summary: One-line description of what this note contains
tags: [tag1, tag2]
created: YYYY-MM-DD
---

## Recap
Brief summary here.

## Content
Your notes here. If the document I note has heading structures, replace the content with that.

## Related
- [[Related Note 1]]
- [[Related Note 2]]
```

## Available Commands

- `/inbox` - Review and organize notes in 01-Inbox/. Reads only from 01-Inbox/ and performs file moves to classify notes into appropriate folders based on content. Updates frontmatter (title, summary, tags) and moves associated assets to matching asset folders.
- `/search <topic>` - Search all notes for a topic using semantic and keyword matching
- `/tags` - Show all tags and their associated notes
- `/recent` - Show recently modified notes across the vault
- `/template <name>` - Insert a predefined note template
## Best Practices for Effective Use

Following these practices significantly improves Claude's ability to work with your knowledge base:

### Write Meaningful Summaries
The one-line summary helps Claude quickly determine relevance without reading entire notes. Invest 10 seconds to write clear summaries that capture the essence.

### Use Consistent Terminology
Pick canonical terms for concepts (e.g., always use "RAG" or always use "retrieval augmented generation") and add aliases when needed. This reduces ambiguity in searches.

### Link Related Notes
Obsidian's `[[wiki link]]` format creates a knowledge graph. Claude follows these connections to build richer context than isolated files provide.

### Keep Notes Focused
Split broad topics into specific notes. Ten focused 1000-word notes are more queryable than one 10,000-word catch-all document.

### Use the Inbox Pattern
Capture fleeting thoughts in `001-Inbox/` first, then let Claude help organize them later with commands like `/inbox`.

## How to Interact with Your Knowledge Base

### Asking Questions
Describe what you need in plain language:
- "What do I know about X?"
- "Find my notes on topic Y"
- "What decisions did I make about Z?"
- "Summarize my thoughts on [topic]"
- "Compare X and Y based on my notes"

### Creating Content
Ask Claude to create notes in appropriate locations:
- "Create a note about X in 002-Knowledge"
- "Add this to my project notes in 003-Projects"
- "Make a template for meeting notes"

### Organizing Information
Have Claude sort and classify your notes:
- "Review my inbox and suggest where each note should go"
- "Add appropriate tags to this note based on content"
- "Find duplicate or overlapping notes"
- "Suggest a hierarchy for these project notes"

### Searching and Discovery
Claude can search across all files using various techniques:
- "Search for anything about X" (keyword search)
- "What topics have tag Y?" (tag-based search)
- "Show me notes modified in the last week"
- "Find notes related to [concept] through wiki links"
- "What have I written about [topic] recently?"
