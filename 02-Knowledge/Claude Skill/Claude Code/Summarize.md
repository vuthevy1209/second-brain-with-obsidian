---
title: Claude Code Knowledge Summary
summary: Comprehensive summary of all Claude Code concepts, workflows, and features
tags: [claude-code, summary, reference]
created: 2026-05-05
---

![[Summarize-1777965294309.webp]]

## Recap
Complete reference guide covering Claude Code's core concepts: agentic loop, context management, workflows (Explore → Plan → Code → Commit), subagents, skills, MCP servers, hooks, and code review practices.

## What is Claude Code
Claude Code is an agentic coding tool by Anthropic that runs in terminal, VS Code, Claude Desktop, web, and JetBrains IDEs. Unlike Claude (chat), it has direct access to your codebase, files, and terminal.

**Core capabilities:**
- Read and understand codebase
- Edit files across your project
- Run terminal commands (builds, tests, installs)
- Search the web for documentation

**Key concepts:**
- Context window: Claude's working memory (~200k tokens)
- Permission modes: asks before actions, can make mistakes

## How Claude Code Works

### Agentic Loop
1. You enter a prompt
2. Claude gathers context via model calls (returns text or tool calls)
3. Takes actions (edit files, run commands)
4. Verifies results against your goal
5. Loops back if not complete

### Context Window
- **200,000 tokens** (~150,000 words)
- Includes: system prompt, conversation history, file contents
- Auto-compaction at ~167k tokens (33k buffer reserved)
- Older messages summarized, recent ones preserved
- Use `/context` to view usage, `/clear` to reset, `/compact` to manually compact

### Tools
Claude uses semantic understanding to call tools (file reading, web search, etc.) when needed.

### Permissions
- **Default:** Asks permission for file edits and commands
- **Auto-accept:** Files auto-edited, commands still need approval
- **Plan Mode:** Read-only tools compile action plan before execution
- Cycle modes with `Shift + Tab`

## Working Modes
- **Approval mode:** Asks permission each time
- **Auto-accept mode:** File edits automatic, commands require approval
- **Plan Mode:** Analyzes codebase first, returns detailed plan, great for complex changes

## Workflow: Explore → Plan → Code → Commit

### Explore and Plan
Use Plan Mode (`Shift + Tab`) to gather context before coding:
- Claude reads relevant files, runs web searches
- Returns actionable plan
- Course-correct before any code is written

### Code
- Define success criteria explicitly
- Add tools (e.g., Chrome extension for UI testing)
- Include test suites for continuous validation
- Save recurring solutions to CLAUDE.md

### Commit
- Run subagent code review before pushing
- Use `/commit-push-pr` for full flow (commit → push → PR)
- Resume PR sessions with `claude --from-pr <N>`

## The CLAUDE.md File
Persistent memory file in project root, auto-read every session.

**Benefits:**
- Eliminates fresh starts (re-exploring codebase)
- Teams share via version control
- Personal preferences in user-level CLAUDE.md (`~/.claude/`)

**Tips:**
- Use `/init` to generate initial CLAUDE.md
- Save corrections to memory explicitly
- Reference project docs with `@` symbol

**Scope:**
- Project-level: root directory, shared via git
- User-level: `~/.claude/settings.json`, personal

## Context Management
- **200k token window** with intelligent compaction
- **Auto-compact:** Triggers at ~167k tokens, summarizes older content
- **Preserved:** Recent messages, decisions, active file state
- `/clear` removes everything; `/compact` triggers manual compaction

## Code Review
- **Subagent review:** Unbiased, fresh context, read-only tools
- **`/commit-push-pr`:** Commit + push + PR creation in one step
- **`claude --from-pr <N>`:** Resume PR session for reviews/fixes
- Configure Slack MCP for automatic team notifications

## Subagents
Run agents in background with isolated context windows to keep main context clean.

**Types:**
- Built-in (e.g., research subagent)
- Custom (user-defined with system prompt, tools, permissions)
- Team (parallel multi-agent workflows)

**Structure:**
```
.claude/
├── agents/                # Agent definitions (.md files)
│   └── agent-name.md     # YAML frontmatter + system prompt
└── agent-memory/          # Persistent memory per agent
    └── agent-name/
        └── MEMORY.md     # Index of learned facts
```

**Agent frontmatter:**
```yaml
---
name: "agent-name"
description: "When to use this agent"
model: haiku | sonnet | opus
color: cyan
memory: project | user
---
```

**Use when:** Searching large codebases, heavy file reads, parallel research, keeping main conversation focused.

## Skills
- **CLAUDE.md:** Loaded every conversation (persistent memory)
- **Skills:** Loaded on-demand when needed (slash commands)

Skills are specialized capabilities invoked via `/skill-name` or automatically when matched.

## MCP (Model Context Protocol)
Open standard connecting Claude Code to external tools and data sources.

**Architecture:**
- **Host:** AI app (Claude Desktop, Cursor) providing environment
- **MCP Client:** Enables communication with MCP servers
- **MCP Server:** Exposes tools, resources, and prompts

**Adding servers:**
```bash
claude mcp add --transport http notion https://mcp.notion.com/mcp
```

**Scopes:**
- Local: current project, just for you (`~/.claude/settings.json`)
- User: all projects, just for you (`~/.claude/settings.json`)
- Project: `.mcp.json` file, shared via git

**Context cost:** MCP servers add tool definitions to context even when not used. Use `/mcp` to manage connections and `allowedTools` in CLAUDE.md to restrict actions.

## Hooks
Deterministic commands that run at specific lifecycle points — always execute (unlike CLAUDE.md instructions).

**Events:** PreToolUse, PostToolUse, UserPromptSubmit, Stop, Notification

**Use cases:**
- Auto-formatting (e.g., Prettier after edits)
- Command logging for compliance
- Blocking dangerous operations
- Sending notifications on task completion

**Configure via:** `/hook` command or `.claude/settings.json`

**Example — Auto-format with Prettier:**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "command": "npx prettier --write \"$TOOL_INPUT_FILE_PATH\""
      }
    ]
  }
}
```

## Related
- [[1.What is Claude Code]]
- [[2.How Claude Code Works]]
- [[3.Working Mode]]
- [[4.Workflow in Claude Code]]
- [[5.Context Management]]
- [[6.Code Review]]
- [[7.Subagents]]
- [[8.Skills]]
- [[9.MCP]]
- [[10.Hooks]]
- [[The CLAUDE.md File]]
- [[Core Component]]
