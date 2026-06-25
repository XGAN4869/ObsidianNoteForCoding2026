---
name: frontend-learning-journal
description: Record successful frontend code work in this repository as long-term learning notes under `docs/frontend-learning/`. Use when frontend code has been successfully produced or modified and the workflow should automatically accumulate learning notes by topic. Organize notes with a topic summary and phase-based markdown files. Each phase note must explain `steps步骤 + 知识点 + 场景运用`.
---

# Frontend Learning Journal

Accumulate frontend learning notes from real successful coding work in this repository.

## Hard Rules

1. Use this skill after successful frontend code generation or modification.
2. Write notes only under:
   - `docs/frontend-learning/`
3. Organize notes by topic, not by date.
4. The note directory structure must not exceed 2 levels under `docs/frontend-learning/`.
5. Every topic should use this structure:
   - `docs/frontend-learning/<topic>/summary.md`
   - `docs/frontend-learning/<topic>/phases/`
   - `docs/frontend-learning/<topic>/phases/<phase-file>.md`
6. Do not create deeper nesting than the structure above.
7. Do not write generic filler. Base the notes on the current repository task.

## Purpose

This skill is for turning successful frontend implementation work into a reusable learning knowledge base.

The notes should help the user answer:
- What was done
- What frontend knowledge was used
- Where the same ideas can be reused later

## Output Location

All outputs must live under:

`docs/frontend-learning/`

## Required Structure

For each topic:

- Keep one `summary.md`
- Keep one `phases/` directory
- Keep phase notes inside `phases/`

Do not exceed 2 levels inside the topic directory.

## Required Content Structure

Every phase note must contain these 3 sections in order:

1. `steps步骤`
2. `知识点`
3. `场景运用`

The topic `summary.md` should contain:

- topic overview
- core implementation route
- reusable frontend principles
- most important pitfalls or validation lessons

## Writing Requirements

- Write in Chinese
- Keep the content practical and concise
- Tie the content to the actual repository work
- Prefer reusable frontend patterns over abstract theory
- Write for a beginner frontend learner

## Workflow

1. Confirm that the task was frontend work
2. Confirm that the code work succeeded
3. Identify the correct topic
4. Create the topic directory if missing
5. Update or create:
   - `summary.md`
   - phase files inside `phases/`
6. For each phase, write:
   - what was done
   - what frontend knowledge was used
   - where it can be reused
7. Keep the notes cumulative under the same topic over time

## Topic Guidance

Choose topics by reusable frontend area, not by date.

Good topic examples:
- `approval-page`
- `table-page`
- `form-page`
- `layout-system`
- `mock-and-api-mapping`

Avoid date-based topic names as the primary grouping.

## Phase Guidance

Use only the phases that actually happened in the task.

Common phases:
- 需求与拆分
- 结构与骨架
- mock与数据结构
- 交互与状态
- 样式与响应式
- 验证与复盘

These phases are reference options, not mandatory sections.

Only write a phase when the current project or task actually used it.

Do not force all phases if they are not relevant.

## Content Guidance

### `steps步骤`

Write the actual execution order used in the task.

### `知识点`

Extract the frontend concept behind the work.

### `场景运用`

Explain where the same idea can be reused in future frontend tasks.

## What Not To Do

- Do not record unfinished work
- Do not record backend-only tasks
- Do not write outside `docs/frontend-learning/`
- Do not create deeper nested directories than the allowed structure
- Do not turn the notes into raw logs
