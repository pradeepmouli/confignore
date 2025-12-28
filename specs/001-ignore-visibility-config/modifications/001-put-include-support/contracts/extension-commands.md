# Contracts: Modified Commands and Context Keys

## Modified Commands

### confignore.include (modified from original)
- Input: selection (URI[]), workspaceFolder, source? (optional when known)
- **Preconditions** (NEW):
  - `ignorer.features.includeSupport` configuration MUST be `true`
  - Command MUST be registered only when feature flag is enabled
- Behavior: Remove selection from applicable exclusion source per precedence.
- Output: Notification; context keys recomputed.

## New Context Keys

### ignorer.features.includeSupport
- Type: boolean
- Source: VS Code configuration `ignorer.features.includeSupport`
- Updated: On activation, on configuration change
- Purpose: Gate include-related menu items via `when` clauses

## Modified Menu Visibility (when clauses)

### Original Include Command Menu
- **Was**: `when: confignore.selectionExcluded`
- **Now**: `when: ignorer.features.includeSupport && confignore.selectionExcluded`
- **Reason**: Only show include commands when both feature is enabled AND selection is excluded

### Ignore Command Menus (unchanged)
- `when: confignore.selectionMixed || !confignore.selectionExcluded`
- Still functions to hide ignore commands when selection is excluded (even if include commands not available)

## Configuration Change Events

### Listener: onDidChangeConfiguration
- Filter: `ignorer.features`
- Action on change:
  1. Read new value of `ignorer.features.includeSupport`
  2. Update context key `ignorer.features.includeSupport` via `setContext`
  3. Show information notification: "Include support [enabled/disabled]. Reload window to update available commands."
  4. Provide "Reload Window" action in notification

Note: Command registration happens at activation time. Configuration changes update context keys immediately but do not dynamically register/unregister commands (requires window reload).

## Unchanged Contracts

All ignore commands and their contracts remain unchanged:
- confignore.addToIgnore.quickPick
- confignore.addToIgnore.git
- confignore.addToIgnore.docker
- confignore.addToIgnore.eslint
- confignore.addToIgnore.prettier
- confignore.addToIgnore.npm
- confignore.addToIgnore.stylelint
- confignore.addToIgnore.vscode
- confignore.addToIgnore.tsconfig

Context keys for config existence remain unchanged:
- confignore.hasTsconfig
- confignore.hasPrettierConfig
- confignore.hasEslintConfig

Context keys for selection state remain unchanged:
- confignore.selectionExcluded
- confignore.selectionMixed
