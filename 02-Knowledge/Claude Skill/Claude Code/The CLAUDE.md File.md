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

# Tips

**Save correction to memory:** If you find yourself correcting Claude repeatedly => explicitly ask Claude to save that rule to memory. Next time you open the project, it'll know.

![[The CLAUDE.md File-1777895537699.webp]]

**Reference project docs:** If you have documentation in your project that you want Claude to reference, use the `@` symbol with the file path: 

![[The CLAUDE.md File-1777895729022.webp]]

**Start without one:** We recommend staring a project without a **CLAUDE.md** file => run `/init` to have Claude generate one for you.