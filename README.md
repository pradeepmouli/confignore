# Confignore

Quickly add selected files and folders to common ignore files and config-based exclusions from the Explorer context menu.

## Features

- **Right-click any file or folder** in the Explorer and choose actions from the "Add to Ignore" submenu
- **Ignore file support**:
  - .gitignore
  - .dockerignore
  - .eslintignore
  - .prettierignore
  - .npmignore
  - .stylelintignore
  - .vscodeignore
- **Config-based exclusion support**:
  - tsconfig.json (exclude array)
  - .eslintrc.json (ignorePatterns)
  - .prettierrc / .prettierrc.json (overrides excludedFiles)
- **Include command**: Remove selections from config-based exclusions
- Targets are shown only when relevant files/configs are detected in your workspace
- Works with multi-selection and multi-root workspaces
- Creates ignore files if they don't exist and appends unique entries
- **Never auto-creates config files**: Actions are hidden if configs don't exist

## Extension Settings

This extension contributes the following settings:

* `confignore.enableSmartMenuVisibility`: Enable smart menu visibility based on file exclusion state. When enabled, the extension automatically hides "Ignore" actions when selections are already excluded and shows "Include" action instead. **This feature is experimental and currently has known issues, so it is disabled by default.**

## How It Works

The extension provides quick access to add files and folders to various ignore files directly from the Explorer context menu.

When the experimental smart menu visibility feature is enabled (via `confignore.enableSmartMenuVisibility`), the extension evaluates each selection against supported sources and determines effective exclusion state:

- When a selection is **excluded**: "Ignore" actions are hidden, "Include" is shown
- When a selection is **not excluded**: "Ignore" actions are shown, "Include" is hidden
- With **mixed-state multi-select**: both groups may appear based on majority state

**Note**: The smart menu visibility feature is currently disabled by default due to known issues. You can enable it in settings if you want to try it out.

## Known Issues

- **Smart menu visibility feature has known issues**: The experimental feature that automatically shows/hides menu items based on exclusion state is currently disabled by default. It can be enabled via the `confignore.enableSmartMenuVisibility` setting, but may not work correctly in all scenarios.
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
