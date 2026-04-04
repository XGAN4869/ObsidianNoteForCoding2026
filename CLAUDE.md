# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This repository is an **Obsidian vault** for personal knowledge management, containing coding notes, interview preparation materials, and blog drafts. It uses markdown files with Obsidian-specific features like wikilinks, tags, and properties. The vault is configured for automatic Git backups via the obsidian-git plugin.

## Key Directories

- `面试整理/` - Interview preparation notes (Chinese)
- `Blog/` - Currently empty, intended for blog drafts
- `.obsidian/` - Obsidian configuration and plugins
- `.agents/skills/` - Installed Claude Code skills for Obsidian interaction

## Obsidian Configuration

The vault uses the following core plugins (enabled in `.obsidian/core-plugins.json`):
- File explorer, graph, backlink, canvas, tag pane, properties, daily notes, templates, command palette, bookmarks, outline, word count, sync, bases.

Community plugin:
- **obsidian-git**: Automatic version control with Git.

See `.obsidian/app.json` for general settings (currently empty).

## Skills and Tooling

This vault has several Obsidian-related skills installed for Claude Code:

- **obsidian-cli**: Interact with the vault using the `obsidian` CLI command. Requires Obsidian app to be running. Use for reading, creating, searching, and managing notes.
- **obsidian-markdown**: Reference for Obsidian's extended markdown syntax (callouts, embeds, properties).
- **obsidian-bases**: Functions for working with Obsidian's Bases plugin.
- **json-canvas**: Skills for Obsidian Canvas JSON manipulation.
- **defuddle**: Skill for cleaning up markdown content.

Common `obsidian` CLI commands:
```bash
obsidian read file="Note Name"
obsidian create name="New Note" content="# Title"
obsidian search query="keyword"
obsidian append file="Note" content="New line"
obsidian property:set name="status" value="done"
```

## Git Workflow

The **obsidian-git** plugin is configured to auto-commit changes every minute with commit message `"vault backup: {{date}}"`. This creates frequent commits. Manual commits can be made via standard Git commands, but note that the plugin may also stage and commit changes automatically.

Key plugin settings (see `.obsidian/plugins/obsidian-git/data.json`):
- `autoSaveInterval`: 1 (auto-commit every minute)
- `autoPullOnBoot`: true
- `pullBeforePush`: true

Note: `.obsidian/.gitignore` is configured to ignore `workspace.json` and `workspace-mobile.json`, but `workspace.json` is currently tracked (modifications appear in git status). This may cause conflicts if the file changes frequently.

## Note Structure

- Notes are in Markdown with `.md` extension.
- Use wikilinks for internal linking: `[[Note Name]]` or `[[Note Name|display text]]`.
- Frontmatter properties (YAML at top of file) can be used for metadata.
- Tags can be added inline with `#tag` or in frontmatter as `tags: [tag1, tag2]`.
- Many notes are written in Chinese, particularly interview preparation content.

Current notes:
- `Obsidian怎么玩.md` - Instructions for using Obsidian and Git sync (Chinese)
- `面试整理/前端面试记录解析.md` - Detailed frontend interview questions and answers (Chinese)

## Development Notes

- This is not a software project; there are no build scripts, tests, or package management.
- Focus on markdown content creation, organization, and knowledge management.
- When editing notes, consider Obsidian's features like backlinks, graph view, and properties.
- Use the installed skills to interact with the vault programmatically via Claude Code.

## Useful References

- Obsidian Help: https://help.obsidian.md/
- Obsidian CLI documentation: https://help.obsidian.md/cli
- Installed skills documentation in `.agents/skills/`