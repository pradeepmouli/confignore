# Confignore

Quickly add selected files and folders to common ignore files and config-based exclusions from the Explorer context menu. Automatically detects if selections are already ignored and adapts menu visibility.

## Features

- **Smart menu visibility**: Automatically hides "Ignore" actions when selections are already excluded; shows "Include" action instead
- **Right-click any file or folder** in the Explorer and choose actions from the "Add to Ignore" submenu
- **Ignore file support**:
  - .gitignore
  - .dockerignore
  - .eslintignore
  - .prettierignore
  - .npmignore
  - .stylelintignore
  - .vscodeignore
- **Config-based exclusion support** (new in 0.0.3):
  - tsconfig.json (exclude array)
  - .eslintrc.json (ignorePatterns)
  - .prettierrc / .prettierrc.json (overrides excludedFiles)
- **Include command**: Remove selections from config-based exclusions
- Targets are shown only when relevant files/configs are detected in your workspace
- Works with multi-selection and multi-root workspaces
- Creates ignore files if they don't exist and appends unique entries
- **Never auto-creates config files**: Actions are hidden if configs don't exist

## How It Works

The extension evaluates each selection against supported sources and determines effective exclusion state. Precedence order: config-based excludes > project ignore files > workspace settings. Menu visibility adapts accordingly:

- When a selection is **excluded**: "Ignore" actions are hidden, "Include" is shown
- When a selection is **not excluded**: "Ignore" actions are shown, "Include" is hidden
- With **mixed-state multi-select**: both groups may appear based on majority state

## Requirements

No additional requirements. The extension uses built-in VS Code APIs.

## Extension Settings

This extension contributes the following settings:

- **`ignorer.features.includeSupport`** (boolean, default: false)
  - Enables the experimental "Include" command and config-based inclusion updates
  - When enabled, allows removing selections from config-based exclusions (tsconfig.json, .eslintrc.json, .prettierrc)
  - **Note**: After toggling this setting, you must reload the VS Code window for changes to take effect

## Known Issues

- Entries already covered by a broader ignore pattern (e.g., a parent folder) are not detected; duplicates by exact line are avoided.
- Negation patterns in ignore files (lines starting with `!`) are recognized but not fully tested across all edge cases.

## Release Notes

### 0.0.3

- Added smart menu visibility based on effective exclusion state
- Added support for config-based exclusions (tsconfig, ESLint, Prettier)
- Added "Include" command to remove from config exclusions
- Improved pattern matching for nested paths and glob patterns
- Output channel logging for debugging state changes

### 0.0.2

Previous release with Explorer submenu and Quick Pick for ignore targets.

### 0.0.1

Initial release.

---

## Running and Debugging

Press F5 to launch a new Extension Development Host. In the Explorer of the new window, right-click any file or folder to find the "Add to Ignore" submenu. Open the "confignore" output channel to see state resolution logs.

## Governance

This project follows the repository constitution for quality gates and workflow.
See `.specify/memory/constitution.md`.

## CI/CD and Publishing

This extension uses GitHub Actions for automated builds, releases, and marketplace publishing.

- **CI**: Runs on every push/PR with build, type-check, lint, and tests
- **Release**: Creates GitHub releases with `.vsix` packages when version tags are pushed
- **Publish**: Automatically deploys to VS Code Marketplace when releases are published

For setup instructions and configuration details, see [`.github/GITHUB_ACTIONS.md`](.github/GITHUB_ACTIONS.md).
