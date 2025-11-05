# Data Model: Ignore visibility and config updates

## Entities

### EffectiveState
- path: string | URI
- excluded: boolean           # true if selection is effectively excluded
- mixed: boolean              # true for multi-selection with mixed states
- source: Source | null       # provenance of decision for UI messaging
- sourcesApplied: Source[]    # all matching sources for diagnostics

### Source (enum)
- ConfigTsconfig
- ConfigPrettier
- ConfigEslint
- IgnoreFileGit
- IgnoreFileDocker
- IgnoreFileEslint
- IgnoreFilePrettier
- IgnoreFileNpm
- IgnoreFileStylelint
- IgnoreFileVscode
- WorkspaceSettings

### ConfigTarget
- type: 'tsconfig' | 'prettier' | 'eslint'
- filePath: string
- exists: boolean
- read(): ConfigShape
- write(update: (c: ConfigShape) => ConfigShape): Promise<void>

### ConfigShape (per target)
- tsconfig: { include?: string[]; exclude?: string[] }
- prettier: { ignorePath?: string; overrides?: any[] }  # writer will update ignore-related entries as applicable
- eslint: { ignorePatterns?: (string|object)[]; overrides?: any[] }

## Relationships
- EffectiveState is computed from zero or more Sources.
- ConfigTarget implements read/write for its respective config file under a workspace folder.

## Validation Rules
- Paths added to exclude lists must be workspace-relative and normalized.
- Writers MUST not auto-create missing config files.
- Writers MUST preserve unrelated settings and formatting; no partial writes.

## State Transitions
- include action: if path present in target exclusion → remove; recompute EffectiveState.
- exclude action: if path absent in target exclusion → add; recompute EffectiveState.
