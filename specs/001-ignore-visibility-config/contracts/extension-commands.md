# Contracts: VS Code Commands and Context Keys

## Commands

### confignore.addToIgnore.quickPick

- Input: selection (URI[]), workspaceFolder
- Behavior: Show targets picker; dispatch to appropriate writer/ignore-file updater.
- Output: success/failure notification; updates EffectiveState and context keys.

### confignore.addToIgnore.git|docker|eslint|prettier|npm|stylelint|vscode

- Input: selection (URI[]), workspaceFolder
- Behavior: Update respective ignore files (existing behavior).
- Output: Notification; context keys recomputed.

### confignore.addToIgnore.tsconfig

- Input: selection (URI[]), workspaceFolder
- Preconditions: tsconfig present in workspace folder
- Behavior: Update tsconfig exclude/include accordingly; does not create tsconfig if missing.
- Output: Notification; context keys recomputed.

### confignore.include (new)

- Input: selection (URI[]), workspaceFolder, source? (optional when known)
- Behavior: Remove selection from applicable exclusion source per precedence.
- Output: Notification; context keys recomputed.

## Context Keys (set via setContext)

- confignore.selectionExcluded: boolean
- confignore.selectionMixed: boolean
- confignore.hasTsconfig: boolean
- confignore.hasPrettierConfig: boolean
- confignore.hasEslintConfig: boolean

## Menu Visibility (when clauses)

- Show Ignore submenu when selectionMixed || !selectionExcluded
- Hide Ignore targets for configs when corresponding has\*Config is false
- Show Include command when selectionExcluded

## Errors

- Missing config target → present info message and no changes
- Malformed config file → show error, no partial writes
