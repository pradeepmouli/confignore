# Quickstart: Feature Flag for Include Support

## Overview

This modification adds a feature flag `ignorer.features.includeSupport` to gate all include/unignore functionality. By default, the flag is disabled (`false`), meaning include commands are not available. Users must explicitly opt-in to enable this experimental feature.

## Enabling Include Support

### For End Users

1. Open VS Code Settings (Cmd+, on macOS, Ctrl+, on Windows/Linux)
2. Search for `ignorer.features.includeSupport`
3. Check the checkbox to enable
4. Reload the VS Code window when prompted (or use Command Palette → "Developer: Reload Window")

### Via settings.json

Add to your User or Workspace settings:

```json
{
  "ignorer.features.includeSupport": true
}
```

Then reload the window.

### Via Command Palette (for testing)

1. Open Command Palette (Cmd+Shift+P / Ctrl+Shift+P)
2. Run "Preferences: Open Settings (JSON)"
3. Add `"ignorer.features.includeSupport": true`
4. Save and reload window

## Disabling Include Support

Set `ignorer.features.includeSupport` to `false` (or remove the setting to use default) and reload the window.

## Development Setup

### Running Tests with Flag Enabled

```typescript
// In test setup (before each or before all):
import * as vscode from 'vscode';

await vscode.workspace.getConfiguration('ignorer.features')
  .update('includeSupport', true, vscode.ConfigurationTarget.Global);

// Run tests...

// Clean up (after each or after all):
await vscode.workspace.getConfiguration('ignorer.features')
  .update('includeSupport', undefined, vscode.ConfigurationTarget.Global);
```

### Testing Both Flag States

Use parameterized tests:

```typescript
[true, false].forEach(flagEnabled => {
  suite(`Include Support: ${flagEnabled ? 'Enabled' : 'Disabled'}`, () => {
    suiteSetup(async () => {
      await vscode.workspace.getConfiguration('ignorer.features')
        .update('includeSupport', flagEnabled, vscode.ConfigurationTarget.Global);
      // Reload extension or restart test instance
    });

    test('include commands visibility', async () => {
      // Verify command registration state matches flag
      const commands = await vscode.commands.getCommands(true);
      const hasIncludeCommand = commands.includes('confignore.include');
      assert.strictEqual(hasIncludeCommand, flagEnabled);
    });
  });
});
```

### Verifying Command Registration

```typescript
// Check if include commands are registered:
const commands = await vscode.commands.getCommands(true);
const includeCommandRegistered = commands.includes('confignore.include');

// Should match feature flag:
const flagEnabled = vscode.workspace.getConfiguration('ignorer.features')
  .get<boolean>('includeSupport', false);

assert.strictEqual(includeCommandRegistered, flagEnabled);
```

### Verifying Context Keys

```typescript
// Context keys can be verified via when clause evaluation
// Or by checking extension internals if exposed for testing

// Example: Verify menu item visibility logic
const flagEnabled = vscode.workspace.getConfiguration('ignorer.features')
  .get<boolean>('includeSupport', false);

const selectionExcluded = true; // Simulate excluded file

// Include command should be visible only if: flagEnabled && selectionExcluded
const shouldShowInclude = flagEnabled && selectionExcluded;
```

## Configuration Scope

The `ignorer.features.includeSupport` setting has **window** scope, meaning:
- Applies to the entire VS Code window
- Not per-workspace-folder
- Can be set at User level (global) or Workspace level
- Workspace setting overrides User setting

## Expected Behavior

### When Flag is Disabled (default)
- Include commands NOT registered → not available in Command Palette
- Include menu items NOT shown in context menus (even on excluded files)
- Ignore commands still work normally
- Ignore commands still hidden when file is excluded (but no include alternative shown)

### When Flag is Enabled
- Include commands registered → available in Command Palette
- Include menu items shown in context menus when file/folder is excluded
- Config-based include updates work (tsconfig, prettier, eslint)
- Full original feature behavior as specified in main spec

## Troubleshooting

### "Include command not showing after enabling flag"
- **Solution**: Reload the VS Code window. Command registration happens at activation.

### "Changes not taking effect"
- **Solution**: Verify setting is saved, check for typos (`ignorer.features.includeSupport` not `ignorer.includeSupport`)

### "Tests failing intermittently"
- **Solution**: Ensure test setup/teardown properly sets and clears the flag. Use `suiteSetup`/`suiteTeardown` or `beforeEach`/`afterEach` consistently.

## Rollout Plan Reference

- **Phase 1 (Alpha)**: Flag defaults to `false`. Early adopters enable manually.
- **Phase 2 (Beta)**: Monitor feedback, fix issues, gather usage data.
- **Phase 3 (GA)**: Flip default to `true` in future minor version, deprecate flag in later release.

See `modification-spec.md` for full rollout strategy.
