# Confignore

Quickly add selected files and folders to common ignore files from the Explorer context menu. Supports a submenu with relevant ignore targets detected from your workspace structure.

## Features

- Right-click any file or folder in the Explorer and choose "Add to Ignore"
- Submenu items for:
  - .gitignore
  - .dockerignore
  - .eslintignore
  - .prettierignore
  - .npmignore
  - .stylelintignore
  - .vscodeignore
- Targets are shown only when relevant files/configs are detected in your workspace
- Works with multi-selection and multi-root workspaces
- Creates ignore files if they don't exist and appends unique entries

## Requirements

No additional requirements. The extension uses built-in VS Code APIs.

## Extension Settings

This extension currently contributes no settings.

## Known Issues

- Entries already covered by a broader ignore pattern (e.g. a parent folder) are not detected; duplicates by exact line are avoided.

## Release Notes

Users appreciate release notes as you update your extension.

### 0.0.1

Initial release with Explorer submenu and Quick Pick for ignore targets.

---

## Running and Debugging

Press F5 to launch a new Extension Development Host. In the Explorer of the new window, right-click any file or folder to find the "Add to Ignore" submenu.

## Governance

This project follows the repository constitution for quality gates and workflow.
See `.specify/memory/constitution.md`.
