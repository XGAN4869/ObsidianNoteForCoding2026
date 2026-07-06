---
name: daily-function-deep-dive
description: "拆解前端函数、computed、watch、校验、初始化、回显、提交、筛选、权限判断和数据转换逻辑，把一个函数变成每日练习笔记。Use when Codex needs to explain a single frontend function to a junior developer, extract a reusable writing pattern, create a small practice task, and optionally save a Markdown note."
---

# Daily Function Deep Dive

## Goal

Use this skill to turn one frontend function into a daily learning unit: understand what it does, why it is written that way, how to imitate it, and how to rewrite a similar function by hand.

Default stance: explain and teach. Do not modify source code unless the user explicitly asks for implementation.

## Workflow

1. Identify the exact function, `computed`, `watch`, event handler, validator, formatter, initializer, submit method, or permission helper to analyze.
2. If the user gives only a file, scan the file and pick the most valuable function for daily practice, usually submit, initialization,回显, validation, filtering, or API payload building.
3. Read the surrounding context needed to understand the function: state declarations, template usage, API method, constants, types, props, emits, route/store usage, and related helper functions.
4. Classify the function type:
   - initialization/loading
   - API request
   - form validation
   - submit/save
   - detail回显
   - search/filter/reset
   - data formatting/mapping
   - permission/status judgment
   - `computed` derived value
   - `watch` field linkage
5. Explain the function in simple Chinese: what problem it solves, what it receives, what it changes, what it returns, and what side effects it has.
6. Convert the code into a step-by-step mental template before showing any imitation code.
7. Point out one or two syntax or Vue knowledge points that matter for this function.
8. Summarize the reusable pattern so the user can write a similar function tomorrow.
9. Create a short practice task: same pattern, different field names or business scene.
10. Save the final analysis as a Markdown note under `ObsidianNote/` unless the user asks not to write files.

## Explanation Rules

Keep the explanation beginner-friendly:

- Say "先做什么、再做什么、最后做什么".
- Prefer business names over abstract words.
- Explain why the order matters.
- Explain hidden dependencies such as `formRef`, `route.query`, store state, selected table rows, or API response shape.
- Mention edge cases: empty value, missing id, duplicate submit, API failure, stale data, permission denied, and reset behavior.
- When showing imitation code, keep it short and commented.

## Common Patterns

Use these mental templates when relevant:

- Submit: validate -> build payload -> call API -> handle success/failure -> refresh or navigate.
- Detail回显: get id -> call detail API -> map response to form -> fill options/status -> handle missing data.
- Search: update query -> reset page -> call list API -> update table and total.
- Reset: restore query defaults -> reset page -> clear selections -> reload list.
- Formatter: receive raw value -> check empty -> map status/options -> return display text.
- Permission: get role/status/action -> compare rules -> return boolean.
- `computed`: read source state -> derive display/disabled/result value -> avoid manual syncing.
- `watch`: observe one source -> guard invalid values -> update linked field or trigger side effect.

## Output Format

Use these headings:

- 今天练哪个 function
- 它解决什么问题
- 输入 / 依赖
- 输出 / 副作用
- 执行顺序
- 关键语法点
- 可以仿写的固定套路
- 边界情况
- 带注释仿写版本
- 今日练习题
- 一句话总结

## Note Rules

When writing a note:

- Put it under `ObsidianNote/`.
- Use a clear filename such as `function-handle-submit-deep-dive.md`, `computed-can-submit-deep-dive.md`, or `watch-form-linkage-deep-dive.md`.
- Keep company code excerpts short.
- Include the reusable pattern and one practice task.
- End with a one-sentence memory hook the user can repeat before writing code.

