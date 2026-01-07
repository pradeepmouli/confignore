# Data Model: Feature Flag for Include Support

## New Entities

### FeatureFlags

- includeSupport: boolean # Runtime value from VS Code configuration
- source: 'user' | 'workspace' # Configuration scope that provided the value

## Modified Entities

### EffectiveState

- path: string | URI
- excluded: boolean # true if selection is effectively excluded
- mixed: boolean # true for multi-selection with mixed states
- source: Source | null # provenance of decision for UI messaging
- sourcesApplied: Source[] # all matching sources for diagnostics
- **includeStateComputed**: boolean # NEW: true if include state was evaluated (when feature flag enabled)

## Relationships

- FeatureFlags is read from VS Code configuration at activation and on config changes
- EffectiveState.includeStateComputed depends on FeatureFlags.includeSupport
- Command registration depends on FeatureFlags.includeSupport
- Context key `ignorer.features.includeSupport` mirrors FeatureFlags.includeSupport value
- Menu visibility uses compound expression: `ignorer.features.includeSupport && confignore.selectionExcluded` for include commands

## New Validation Rules

- FeatureFlags.includeSupport must be boolean (enforced by VS Code configuration schema)
- When FeatureFlags.includeSupport is false:
  - Include commands MUST NOT be registered
  - EffectiveState.includeStateComputed MUST be false
  - Context key `confignore.selectionExcluded` MAY still be set (for hiding ignore commands) but include-related keys are irrelevant

## Modified State Transitions

- **Configuration change**:
  - When `ignorer.features.includeSupport` changes → update FeatureFlags.includeSupport
  - Update context key `ignorer.features.includeSupport`
  - Notify user to reload window if command registration affected

- **State resolution**:
  - If FeatureFlags.includeSupport is false → skip include-state computation, set includeStateComputed = false
  - If FeatureFlags.includeSupport is true → compute full state including exclusion detection, set includeStateComputed = true

- **Include action** (unchanged logic, but gated):
  - Precondition: FeatureFlags.includeSupport MUST be true (enforced by command not being registered)
  - If path present in target exclusion → remove; recompute EffectiveState

- **Exclude action** (unchanged):
  - Works regardless of FeatureFlags.includeSupport value
  - If path absent in target exclusion → add; recompute EffectiveState

## Context Keys Mapping

| Context Key                       | Source                                  | Purpose                   |
| --------------------------------- | --------------------------------------- | ------------------------- |
| `ignorer.features.includeSupport` | FeatureFlags.includeSupport             | Gate include menu items   |
| `confignore.selectionExcluded`    | EffectiveState.excluded (when computed) | Show include, hide ignore |
| `confignore.selectionMixed`       | EffectiveState.mixed                    | Handle multi-selection    |
| `confignore.hasTsconfig`          | ConfigTarget existence check            | Gate tsconfig commands    |
| `confignore.hasPrettierConfig`    | ConfigTarget existence check            | Gate prettier commands    |
| `confignore.hasEslintConfig`      | ConfigTarget existence check            | Gate eslint commands      |

Note: When `ignorer.features.includeSupport` is false, `confignore.selectionExcluded` may still be computed to hide ignore commands on excluded files, but include commands won't be registered regardless.
