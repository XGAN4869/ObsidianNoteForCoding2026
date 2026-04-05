---
name: context-hygiene
description: Keep Claude Code sessions small, focused, and resilient to context-window limits. Use when tasks span multiple files, the conversation is getting long, the user mentions context overflow, token limits, /compact, /clear, or asks Claude Code to avoid bloated prompts and repeated history.
---

# Context Hygiene

Keep the active thread focused on the current task. Prefer preserving useful state in files and short summaries instead of carrying long conversational history.

## Work Narrow

- Start from the smallest viable scope: the exact goal, the relevant files, and the current blocker.
- Read only the files that are needed for the next decision.
- Prefer targeted search (`rg`, file paths, error snippets) over broad repository scans.
- Avoid re-pasting or re-summarizing old conversation unless it changes the next action.

## Manage Long Tasks

- When the task shifts to a new problem, explicitly drop stale subproblems and continue with a fresh short recap.
- After a meaningful milestone, produce a compact checkpoint:
  - goal
  - files touched
  - current status
  - next step
- If the user will likely continue in a fresh session, write the checkpoint so it can be pasted into a new chat without extra cleanup.

Use this checkpoint template:

```text
Goal: ...
Relevant files: ...
Status: ...
Next step: ...
```

## Control Token Growth

- Quote only the smallest useful slice of logs, diffs, or file contents.
- Do not restate large tool outputs when a one-line takeaway is enough.
- Prefer "read X and Y" over loading unrelated files "just in case".
- Keep plans short and update them instead of repeating them from scratch.

## When Context Starts To Bloat

If the thread is getting long or the user mentions context pressure:

1. Summarize the current state in 4 lines or fewer.
2. Suggest using `/compact` if continuity matters.
3. Suggest using `/clear` or starting a fresh `cc` session if the topic has shifted or the thread is already noisy.
4. Continue using only the compact summary plus currently relevant files.

## User Guidance

When helping the user avoid future overflow, recommend these habits:

- One task or one bug per session.
- Use `/compact` before the thread becomes huge.
- Store durable project rules in `CLAUDE.md`, not in chat history.
- Paste only the needed error snippet, file path, and goal.
- Start a fresh session after finishing a feature, bug, or review pass.

## This Repository

This repository already has a `CLAUDE.md`. Treat that file as the durable memory layer. Prefer adding long-lived workflow rules there rather than relying on the current chat to remember them.
