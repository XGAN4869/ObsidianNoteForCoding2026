#!/usr/bin/env python3
"""Validate a vue-module-readme output document."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


COMPONENT_SECTIONS = {
    "一句话说明",
    "快速开始",
    "Props",
    "Emits",
    "Slots",
    "v-model",
    "真实场景",
    "常见坑",
}

COMPOSABLE_SECTIONS = {
    "一句话说明",
    "快速开始",
    "选项对象",
    "返回值",
    "真实场景",
    "生命周期与调用时机",
    "常见坑",
}

UTILITY_SECTIONS = {
    "一句话说明",
    "函数签名",
    "参数",
    "返回值",
    "示例",
    "边界情况",
    "常见坑",
}

RELATION_SECTIONS = {"调用关系", "综合示例"}

TYPE_SECTION_MAP = {
    "Vue 组件": COMPONENT_SECTIONS,
    "组合式 Hook": COMPOSABLE_SECTIONS,
    "工具函数": UTILITY_SECTIONS,
}


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("file", nargs="?", help="README Markdown file; stdin is used when omitted")
    return parser.parse_args()


def read_source(path: str | None) -> str:
    if path:
        return Path(path).read_text(encoding="utf-8")
    return sys.stdin.read()


def validate_code_fences(text: str, errors: list[str]) -> None:
    lines = text.splitlines()
    fence_count = sum(1 for line in lines if re.match(r"^\s*```", line))
    if fence_count % 2 != 0:
        errors.append("代码围栏数量为奇数，存在未闭合的 Markdown 代码块。")

    in_fence = False
    for line_number, line in enumerate(lines, start=1):
        if re.match(r"^\s*```", line):
            in_fence = not in_fence
            continue
        if in_fence and ("..." in line or "…" in line):
            errors.append(f"第 {line_number} 行代码块包含省略号，示例必须完整。")


def parse_sections(text: str) -> tuple[list[tuple[str, dict[str, list[str]]]], list[str]]:
    modules: list[tuple[str, dict[str, list[str]]]] = []
    errors: list[str] = []
    current_module: str | None = None
    current_sections: dict[str, list[str]] | None = None
    current_section: str | None = None

    for line in text.splitlines():
        heading = re.match(r"^(#{1,6})\s+(.*)$", line)
        if not heading:
            if current_sections is not None and current_section is not None:
                current_sections[current_section].append(line)
            continue

        level = len(heading.group(1))
        title = heading.group(2).strip()

        if level >= 4:
            errors.append(f"标题“{title}”超过三级。")
            continue

        if level == 2:
            current_module = title
            current_sections = {}
            modules.append((title, current_sections))
            current_section = None
            continue

        if level == 3:
            if current_sections is None:
                errors.append(f"三级标题“{title}”没有所属模块。")
                continue
            current_section = title
            current_sections.setdefault(title, [])

    return modules, errors


def module_type(title: str) -> str | None:
    for type_name in TYPE_SECTION_MAP:
        if type_name in title:
            return type_name
    return None


def validate_modules(
    modules: list[tuple[str, dict[str, list[str]]]], errors: list[str]
) -> None:
    if not modules:
        errors.append("没有找到二级模块标题。")
        return

    relation_found = False
    content_module_count = 0

    for title, sections in modules:
        if title == "模块之间的关系":
            relation_found = True
            missing = RELATION_SECTIONS - set(sections)
            if missing:
                errors.append(f"“模块之间的关系”缺少小节：{', '.join(sorted(missing))}")
            continue

        selected_type = module_type(title)
        if selected_type is None:
            errors.append(f"模块“{title}”未标明 Vue 组件、组合式 Hook 或工具函数。")
            continue

        content_module_count += 1
        required = TYPE_SECTION_MAP[selected_type]
        missing = required - set(sections)
        if missing:
            errors.append(f"{selected_type}“{title}”缺少小节：{', '.join(sorted(missing))}")

        for section_name, lines in sections.items():
            content = "\n".join(lines).strip()
            if not content:
                errors.append(f"“{title}”的“{section_name}”为空。")

    if content_module_count == 0:
        errors.append("没有可识别的业务模块。")
    if not relation_found:
        errors.append("缺少“## 模块之间的关系”。")


def validate_todos(text: str, errors: list[str]) -> None:
    allowed_todo = "<!-- TODO: 待作者确认 -->"
    for line_number, line in enumerate(text.splitlines(), start=1):
        if "TODO" in line and allowed_todo not in line:
            errors.append(
                f"第 {line_number} 行使用了不合规 TODO，只允许 {allowed_todo}"
            )


def main() -> int:
    args = parse_arguments()
    text = read_source(args.file)
    errors: list[str] = []

    if not text.lstrip().startswith("# "):
        errors.append("文档必须以一级标题开始。")

    validate_code_fences(text, errors)
    modules, parse_errors = parse_sections(text)
    errors.extend(parse_errors)
    validate_modules(modules, errors)
    validate_todos(text, errors)

    if errors:
        for error in errors:
            print(f"[ERROR] {error}", file=sys.stderr)
        return 1

    print("[OK] README structure and code block checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
