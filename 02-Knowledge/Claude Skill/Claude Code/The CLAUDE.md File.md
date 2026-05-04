---
title: The CLAUDE.md File
summary: Overview of CLAUDE.md feature in Claude Code for persistent project memory
tags: [claude-code, claude-md, configuration, team-collaboration]
created: 2026-05-04
---
# The CLAUDE.md File

> [!done] Tips
> One of the most useful features in Claude Code is the CLAUDE.md file. It gives Claude Code persistent memory about your project

#### The Problem It Solve

- When you open CLaude Code without a CLAUDE.md file, it starts fresh every time. It has to re-explore your codebase, figure out what dependencies are needed, and understand what feature are already implemented. Which make it harder to steer Claude in the right direction.
- CLAUDE.md solves this. It's a Markdown file you add to the root of your project, and Claude Code reads it automatically every time you start as session.
- The contents of the CLAUDE.md file are appended to your prompt.

#### An Example

Here's what a typical CLAUDE.md file looks like:

![[assets/The CLAUDE.md File-1777893914853.webp]]

It's straightforward. Now if you ask Claude Code to create a React component, it already knows to use Tailwind for styling and to follow your code conventions.

# CLAUDE.md is for Teams

You can (add should) commit your CLAUE.md to version control so your team benefits from it:

- **Projet-level CLAUDE.md** lives in the root directory of your project. Shared with the team.
- **User-level CLAUDE.md** live in your configuration folder. This is just for you and applies across all your project. Put your personal preferences here.