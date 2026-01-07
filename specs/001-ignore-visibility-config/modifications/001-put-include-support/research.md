# Research: Feature Flag for Include Support

## Decisions

### Feature Flag Implementation Pattern

- **Decision**: Use VS Code configuration setting `ignorer.features.includeSupport` (boolean, default `false`)
- **Rationale**:
  - VS Code provides built-in configuration infrastructure with validation, UI, and per-workspace overrides
  - Boolean flag is simple and clear for users
  - Default `false` ensures safe initial rollout
  - Configuration changes can be detected via `vscode.workspace.onDidChangeConfiguration`
- **Alternatives considered**:
  - Environment variable (rejected: not user-friendly, requires VS Code reload)
  - Extension-specific settings file (rejected: reinvents VS Code configuration)
  - Command palette toggle (rejected: not persistent, harder to discover)

### Command Registration Strategy

- **Decision**: Conditional command registration at activation time based on flag value
- **Rationale**:
  - Commands not registered when flag is disabled = zero overhead
  - Cleaner than runtime checks in every command handler
  - Prevents commands from appearing in command palette
  - Requires reload when flag changes, but acceptable for feature flag use case
- **Alternatives considered**:
  - Register all commands, check flag in handlers (rejected: unnecessary overhead, commands visible in palette)
  - Dynamic registration/disposal on config change (rejected: complex lifecycle management, potential memory leaks)

### Context Key Gating

- **Decision**: Add `ignorer.features.includeSupport` context key updated on activation and config changes
- **Rationale**:
  - `when` clauses in menus can reference both flag and selection state
  - Enables/disables menu items dynamically without command re-registration
  - Consistent with VS Code extension patterns
  - Single source of truth for menu visibility
- **Alternatives considered**:
  - Only gate via command registration (rejected: doesn't hide menu items)
  - Separate context keys per include command (rejected: unnecessary complexity)

### State Resolution Optimization

- **Decision**: Skip include-state computation when flag is disabled
- **Rationale**:
  - Performance optimization - no need to determine if selection is excluded if include commands unavailable
  - Still compute ignore-state (needed to hide ignore commands on excluded files)
  - Reduces file system reads and pattern matching
- **Alternatives considered**:
  - Always compute full state (rejected: wastes resources when feature disabled)
  - Lazy computation (rejected: adds complexity without clear benefit)

## Patterns & Best Practices

### VS Code Feature Flag Patterns

- Use `contributes.configuration` in `package.json` to define settings schema
- Read config via `vscode.workspace.getConfiguration('ignorer').get('features.includeSupport')`
- Listen to `vscode.workspace.onDidChangeConfiguration` for live updates
- Set context keys via `vscode.commands.executeCommand('setContext', key, value)`
- Gate menu contributions with compound `when` clauses: `context1 && context2`

### Progressive Feature Rollout

- Default to disabled for initial release (alpha/beta phase)
- Document clearly in README with "Experimental Features" section
- Gather feedback before flipping default to enabled
- Consider telemetry (if privacy-compliant) to track adoption and issues
- Plan for eventual removal of flag once feature is stable

### Testing Strategy

- Parameterize tests with flag enabled/disabled
- Use VS Code test configuration overrides: `vscode.workspace.getConfiguration().update()`
- Test matrix: flag off (default), flag on (opt-in), flag toggled (config change)
- Verify command registration state matches flag
- Verify menu visibility matches flag + selection state

### Configuration Change Handling

- Inform user that reload may be required for command registration changes
- For context keys, update immediately on configuration change
- Consider showing notification: "Include support enabled/disabled. Reload window to update commands."
- Handle workspace vs user vs folder configuration scope appropriately

## Implementation Notes

### Package.json Configuration Schema

```json
"contributes": {
  "configuration": {
    "title": "Ignorer",
    "properties": {
      "ignorer.features.includeSupport": {
        "type": "boolean",
        "default": false,
        "description": "Enable include/unignore commands and config-based inclusion updates. Experimental feature. Reload window after changing.",
        "scope": "window"
      }
    }
  }
}
```

### Activation Flow

1. Read `ignorer.features.includeSupport` configuration
2. Set `ignorer.features.includeSupport` context key
3. Conditionally register include commands based on flag
4. Register configuration change listener
5. On config change: update context key, notify user to reload if commands affected

### File Impact Summary

- `package.json`: Add configuration contribution
- `src/extension.ts`: Read flag, conditional command registration, config listener
- `src/services/contextKeys.ts`: Add flag context key, compound when expressions
- `src/services/stateResolver.ts`: Skip include state when flag false
- `README.md`: Document feature flag in "Experimental Features" section

## Open Questions (resolved)

- **Q**: Should flag change trigger automatic reload?
  - **A**: No. User-initiated reload is safer and more predictable. Show notification with reload suggestion.

- **Q**: What scope for the configuration setting (window/resource/machine)?
  - **A**: `window` scope - applies to entire VS Code window, not per-workspace-folder. Simplifies implementation.

- **Q**: Should we track flag value in telemetry?
  - **A**: Out of scope for v1. No telemetry infrastructure currently. Can be added later if needed.

- **Q**: Should there be separate flags for include commands vs config-based updates?
  - **A**: No. Single flag is simpler. Include commands and config updates are tightly coupled - no value in separate flags.
