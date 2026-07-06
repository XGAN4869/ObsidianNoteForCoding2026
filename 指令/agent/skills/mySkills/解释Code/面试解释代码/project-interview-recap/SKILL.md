---
name: project-interview-recap
description: Generate an interview-ready project recap Markdown document from a user-provided "面试.md" template and one or more project files. Use when the user asks to analyze frontend or project code for 面试复盘, 项目讲解, 转正答辩, 技术汇报, PPT整理, or wants code logic rewritten as "我做了什么、为什么这样做、解决了什么问题、面试怎么讲" instead of line-by-line comments.
---

# Project Interview Recap

## Overview

Use this skill to turn real project code into a concise, beginner-friendly interview or defense recap. The output should help the user understand the feature, explain it aloud, prepare slides, and answer follow-up questions.

Do not modify user code unless the user explicitly asks for code changes.

## Required Inputs

Require these inputs:

- A `面试.md` template or equivalent recap document.
- One or more project files to analyze.

If the template path or project files cannot be found, search the workspace first. Ask the user only when the files still cannot be located.

## Workflow

1. Read `面试.md` first.
2. Extract its title hierarchy, section order, expression style, question breakdown method, and summary pattern.
3. Identify how it converts "code behavior" into "interview expression".
4. Read the specified project files.
5. Find the core feature, key variables, functions, components, API calls, state management, validation rules, data flow, and user interactions.
6. Rewrite the project content using the template's structure and tone.
7. Output a Markdown document. Do not output a code review unless the user asks for one.

## Template Analysis Checklist

When reading `面试.md`, capture:

- Main heading style.
- Numbered section style.
- Whether it uses "作用 / 关键逻辑 / 面试表达" blocks.
- Whether it explains from business flow to code module to interview Q&A.
- Common phrases that make the explanation easy to recite.
- How it summarizes value without becoming vague.

Follow the template closely, but do not copy long passages from it.

## Code Analysis Checklist

Focus on details that are useful in interviews or technical reports:

- Data unified management.
- Clear template binding.
- Extracted configuration constants.
- `computed` for derived data.
- `watch` for field linkage.
- Centralized form validation rules.
- Separation of initialization logic and echo/backfill logic.
- Standard submit flow.
- API calls, loading state, duplicate-submit prevention, and error prompts.
- Component splitting, function encapsulation, and code reuse.
- User interaction flow from page action to state update.

Tie every technical point to concrete code from the provided files. Prefer file names, function names, variable names, and component names over vague claims.

## Output Rules

Write in Chinese unless the user requests another language.

Keep sentences short. Use an interview recap tone. Explain what was done, why it was done, what problem it solved, and how to say it in an interview.

Do not:

- Copy large blocks of source code.
- Explain every line.
- Produce only comments.
- Make generic claims such as "提升了可维护性" without saying the exact mechanism.
- Invent features not present in the project files.
- Refactor or edit code.

## Recommended Markdown Structure

Adapt section names to match `面试.md` when possible. If the template has no clear structure, use this structure:

```markdown
# XXX 功能项目解析

## 1. 功能概述

这个功能主要解决了什么问题。

## 2. 业务流程

1. 用户做了什么
2. 前端触发了什么
3. 数据如何处理
4. 接口如何调用
5. 页面如何更新

## 3. 核心代码模块

### 3.1 XXX 模块

作用：

关键逻辑：

面试表达：

## 4. 关键函数解析

### functionName

作用：

输入：

输出：

为什么这样写：

面试怎么说：

## 5. 数据流转

接口数据 -> 标准化处理 -> 状态保存 -> 页面绑定 -> 用户提交 -> 接口更新

## 6. 技术亮点

### 亮点一：XXX

代码中怎么体现：

解决了什么问题：

面试表达：

## 7. 可能被问到的问题

### Q1：为什么这里要这样封装？

A：因为……

### Q2：这个功能的数据流是怎样的？

A：……

## 8. 一句话总结

这个功能本质上是通过 XXX，把 XXX 流程规范化，提升了 XXX。
```

## Required Content

Ensure the final Markdown includes:

1. 项目功能概述
2. 核心业务流程
3. 关键代码模块拆解
4. 数据从哪里来、如何处理、如何展示
5. 重要函数说明
6. 关键技术点总结
7. 可用于面试/答辩的表达
8. 可能被问到的问题
9. 每个问题的简洁回答
10. 一句话总结该功能的价值

## Interview Expression Pattern

Convert code into speech with this pattern:

- "我负责的是……"
- "这个功能的核心流程是……"
- "数据先从……获取，然后在……里统一处理。"
- "这里没有直接写死在模板里，而是通过……管理。"
- "这样做的原因是……"
- "它解决的问题是……"
- "面试中我会这样讲：……"

Prefer concrete expressions:

- Instead of "提升可维护性", say "把表单规则集中在 `rules` 中，后续新增字段时不用在多个事件里重复判断。"
- Instead of "优化用户体验", say "提交时用 `loading` 和禁用状态防止用户连续点击，失败时通过消息提示告诉用户原因。"
- Instead of "代码复用", say "把重复的接口参数组装放到 `buildParams`，列表查询和筛选重置都复用同一套参数来源。"

# 最后整理内容在 .md文件中，并放到根目录下的 Presentation 文件夹中
