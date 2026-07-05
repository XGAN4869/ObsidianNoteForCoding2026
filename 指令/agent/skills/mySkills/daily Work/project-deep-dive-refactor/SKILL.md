---
name: project-deep-dive-refactor
description: "梳理和复盘前端公司项目、Vue/React 页面、模块文件、路由、接口、权限、状态管理、组件拆分和重构方案。Use when Codex needs to read project files one by one, explain how a business module works to a junior frontend developer, produce Obsidian notes, and suggest conservative refactor steps without leaking company code."
---

# Project Deep Dive Refactor

## Goal

Use this skill to help a junior frontend developer understand a real company project file by file, then turn that understanding into a safe personal reconstruction plan.

Default stance: read, explain, map, and write notes. Do not modify source code unless the user explicitly asks for implementation.

## Workflow

1. Identify the target scope: one file, one page, one route module, or one business feature.
2. Read the target file first, then read only the nearest related files needed to understand it: imports, route config, store modules, API wrappers, types, child components, constants, and template bindings.
3. Use `rg` to find references when the ownership or call chain is unclear.
4. Classify the file: page, component, API module, store, composable, util, route config, type definition, or style/config file.
5. Explain its role in the project in plain Chinese, assuming the user has about three months of work experience.
6. Trace the runtime flow: route entry -> state setup -> initialization -> API request -> data rendering -> user action -> validation -> submit/update -> feedback/navigation.
7. List the core data: `ref`, `reactive`, `computed`, `watch`, props, emits, route params, query params, localStorage/sessionStorage, store state, API payloads, and status maps.
8. Separate "must understand now" from "can learn later" so the user does not drown in details.
9. Suggest conservative refactor steps that preserve behavior first.
10. Save the final analysis as a Markdown note under `ObsidianNote/` unless the user asks not to write files.

## Reading Checklist

For every analyzed file or module, answer these questions:

- What is this file responsible for?
- Who imports it, and what does it import?
- What data does it own?
- What data comes from route, store, parent component, browser storage, or API?
- What user actions does it handle?
- What API methods does it call?
- What fields are shown, edited, transformed, validated, or submitted?
- What loading, empty, error, and permission states exist?
- Which parts are business logic, and which parts are just UI display?
- Which code patterns are worth imitating?
- Which parts are risky to refactor too early?

## Refactor Guidance

Recommend small refactors in this order:

1. Rename confusing local variables only when it improves reading.
2. Extract repeated constants, status maps, and option lists.
3. Split long functions only when each new function has a clear business name.
4. Move API payload building into a helper only if it is reused or very long.
5. Use `computed` for values derived from existing state.
6. Use `watch` only for real field linkage or side effects.
7. Extract components only for stable repeated UI blocks.
8. Keep page behavior unchanged before improving structure.

Avoid recommending big architecture changes, new libraries, or premature abstractions.

## Output Format

Use these headings:

- 文件定位
- 这个文件负责什么
- 它依赖谁 / 谁依赖它
- 页面或模块运行流程
- 核心数据和接口
- 值得模仿的写法
- 可以重构的地方
- 小白重构路线
- 面试怎么讲
- 今日复刻任务
- 一句话总结

## Note Rules

When writing a note:

- Put it under `ObsidianNote/`.
- Use a clear filename such as `project-approval-page-deep-dive.md` or `project-user-store-deep-dive.md`.
- Include local file references, but do not paste large private company code blocks.
- Mask sensitive business names, tokens, private endpoints, and customer data.
- End with a small reconstruction task the user can complete independently.

