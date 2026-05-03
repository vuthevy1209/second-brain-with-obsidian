---
title: What is Claude Code?
summary: Overview of Claude Code as an agentic coding tool by Anthropic
tags: [claude-code, ai-agent, tool]
created: 2026-05-03
---

# Summarize

Claude Code is an agentic coding tool by Anthropic that runs in terminal, VS Code, Claude Desktop, web, and JetBrains IDEs. It acts as an AI agent with direct access to your codebase, files, and terminal — eliminating copy-paste workflows. Core capabilities: reading/understanding code, editing files across a project, running terminal commands (builds, tests, package installs), and searching the web for documentation. Key usage notes: it operates within a context window (working memory), asks permission before actions, and can make mistakes — review its output.

# What is Claude Code ?

**<font color="#fac08f">Claude Code</font>** is an agentic coding tool that understands yours codebase, edits your files, run commands, and integrates with your existing developer tools to help you get things done faster. It's available in your <font color="#0c0c0c">terminal</font>, Visual Studio Code, the Claude Desktop app, on the web, and in JetBrains IDEs.

![[Pasted image 20260503190907.png]]

### What separates Claude Code from Claude ?

Claude Code is a **AI Agent** as Cursor, has direct access to your files, your terminal, and your entire codebase. Instead of copying and pasting code back and forth.

An AI Agent is software that can interact with its environment and perform actions to complete a defined goal. At its core, this works based on a LLM operating in a loop in real time. AI Agent can have access to tools, external services, or even other AI Agents to help reach their goals.

### What can Claude Code Actually Do ?

- **Read and understand codebase:** You can ask Claude Code to explain a feature or trace a bug throughout your code.
- **Edit files across your project:** Claude Code can refactor a function and update every file that references it.
- **Run terminal commands:** It can execute your build script, run yours tests, install packages, and use the output to decide what to do next.
- **Search the web:** If it needs documentation or the latest API, it can look that for you.

### Using Claude Code Effectively

To use Claude Code effectively, **keep there concepts in mind**:

- **The context window:** Think of this as Claude's working memory. It can hold a lot, but not everything at once. Claude finds strategic ways to locate answers within your codebase without loading the entire thing into context.
- **It asks for permission:** Claude Code will ask you before running commands or making changes.
- **In can make mistakes:** Just like any tool, Claude Code isn't perfect. It might misunderstand your intent, introduce a bug, or over-engineer a solution.