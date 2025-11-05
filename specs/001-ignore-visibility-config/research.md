# Research: Ignore visibility and config updates

## Decisions

- Precedence: config-based excludes > project ignore files > workspace settings
  - Rationale: Config represents explicit toolchain intent; users expect project config to win over ignore files for build/format/lint behavior. Workspace settings considered last.
  - Alternatives: (A) project ignore > config > workspace (rejected: contradicts explicit config intent); (C) most specific rule wins (rejected: complex conflict resolution and messaging).

- v1 config targets: TypeScript (tsconfig include/exclude), Prettier, ESLint
  - Rationale: High-impact, common tools; aligns with existing commands and user expectations.
  - Alternatives: TypeScript-only (rejected: too narrow); broader set (rejected: increases complexity for first iteration).

- No automatic creation of missing config files
  - Rationale: Avoids surprise writes; reduces risk of invalid defaults; respects minimalism.
  - Alternatives: Auto-create or prompt-to-create (rejected for v1 to keep scope tight; may revisit with prompt in future).

## Patterns & Best Practices

- VS Code context menus: use `setContext` keys to drive `menus` visibility (`when` clauses). Update on selection changes and on activation. Provide mixed-state handling for multi-select.
- Safe config edits: read-modify-write; preserve comments/formatting when possible; validate structure; write atomically; handle JSON/JSONC for tsconfig.
- Multi-root workspaces: resolve selection to workspace folder; scope detection and updates to that root.
- Tests: unit-test resolution and writers; command-level tests with @vscode/test-electron; simulate multi-selection and config presence/absence.

## Open Questions (resolved)

- None; clarifications captured in the spec.
