# Extension Commands Contract: AI Agent Ignore Support

**Feature**: 002-ai-agent-ignore | **Date**: January 3, 2026 | **Phase**: 1 (Design)

## Overview

This document specifies the public command API exposed by Confignore for other extensions to query AI agent ignore status.

---

## Primary Command: `confignore.isIgnoredForAI`

### Specification

**Purpose**: Determine whether a file is ignored for AI agents

**Signature**:

```typescript
confignore.isIgnoredForAI(fileUri: Uri): Promise<boolean>
```

**Parameters**:

- `fileUri` (Uri): Absolute file path to check

**Returns**:

- `Promise<boolean>`:
  - `true` if file matches any AI ignore pattern
  - `false` if file is not ignored

**Throws**:

- `Error` if fileUri is invalid or workspace not accessible

---

### Usage Examples

#### Example 1: Check if file should be in AI context (Synchronous wrapper)

```typescript
import * as vscode from 'vscode';

async function isFileIncludedInAiContext(file: vscode.Uri): Promise<boolean> {
  try {
    const isIgnored = await vscode.commands.executeCommand(
      'confignore.isIgnoredForAI',
      file
    );
    return !isIgnored;  // true if NOT ignored (i.e., included)
  } catch (error) {
    console.error('Confignore unavailable:', error);
    return true;  // Assume included if confignore fails
  }
}
```

#### Example 2: Filter files before sending to AI model

```typescript
async function filterFilesForAiContext(files: vscode.Uri[]): Promise<vscode.Uri[]> {
  const included: vscode.Uri[] = [];

  for (const file of files) {
    const ignored = await vscode.commands.executeCommand(
      'confignore.isIgnoredForAI',
      file
    );
    if (!ignored) {
      included.push(file);
    }
  }

  return included;
}
```

#### Example 3: Log why a file was excluded (Future enhancement)

```typescript
// Future: Extended version with reason
const result = await vscode.commands.executeCommand(
  'confignore.isIgnoredForAI:verbose',
  file
);
// Returns: { isIgnored: true, patterns: ['*.env'], source: 'workspace:settings' }
```

---

## Secondary Commands (Utility)

### `confignore.openAiIgnoreSettings`

**Purpose**: Open the AI ignore settings editor

**Signature**:

```typescript
confignore.openAiIgnoreSettings(): Promise<void>
```

**Behavior**:

1. Opens `.vscode/settings.json` or creates it
2. Positions cursor at `confignore.aiIgnore` array
3. Provides snippet/IntelliSense for common patterns

**Example Usage**:

```typescript
// User clicks "Configure AI Ignore" in UI
await vscode.commands.executeCommand('confignore.openAiIgnoreSettings');
```

---

### `confignore.reloadAiIgnoreConfig`

**Purpose**: Manually reload AI ignore configuration (normally automatic)

**Signature**:

```typescript
confignore.reloadAiIgnoreConfig(): Promise<void>
```

**Behavior**:

1. Re-reads `.vscode/settings.json`
2. Re-detects supported agent config files (`.claude/settings.json`, `.aiexclude`)
3. Invalidates cache
4. Updates file decorations
5. Returns when complete

**Example Usage**:

```typescript
// After user manually edits config file
// (normally not needed; auto-reloading on file save)
await vscode.commands.executeCommand('confignore.reloadAiIgnoreConfig');
```

---

### `confignore.showAiIgnoreStatus`

**Purpose**: Display AI ignore status for currently selected file

**Signature**:

```typescript
confignore.showAiIgnoreStatus(): Promise<void>
```

**Behavior**:

1. Gets currently selected file in editor
2. Evaluates AI ignore status
3. Shows information message with:
   - File path
   - Ignored status (yes/no)
   - Matching patterns (if ignored)
   - Source of patterns

**Example Output**:

```
File: src/secrets.json
Status: Ignored for AI agents

Matched patterns:
  - "secrets/" (from workspace:settings)
  - "*.json" (from .claude/settings.json)

Include in AI context? [Always Include] [Never] [Edit Settings]
```

---

## Context Keys

Context keys enable menu/keybinding visibility and programmatic queries.

### `confignore.aiIgnoredFile`

**Type**: `boolean`

**Value**:

- `true` if currently selected file is ignored for AI
- `false` if file is not ignored
- `undefined` if no file selected

**Usage in `package.json`**:

```json
{
  "menus": {
    "editor/context": [
      {
        "command": "confignore.unignoreForAi",
        "when": "confignore.aiIgnoredFile && !config.confignore.readOnly",
        "group": "1_modification"
      }
    ]
  }
}
```

---

### `confignore.aiIgnoreConfigured`

**Type**: `boolean`

**Value**:

- `true` if any AI ignore patterns exist (workspace + agent configs)
- `false` if no patterns configured

**Usage in `package.json`**:

```json
{
  "menus": {
    "command_palette": [
      {
        "command": "confignore.showAiIgnoreStatus",
        "when": "confignore.aiIgnoreConfigured"
      }
    ]
  }
}
```

---

## Error Handling

### Command Execution Errors

**Scenario**: Extension calls `confignore.isIgnoredForAI` but Confignore extension is not active

**Behavior**:

```typescript
try {
  const isIgnored = await vscode.commands.executeCommand(
    'confignore.isIgnoredForAI',
    fileUri
  );
} catch (error) {
  // Handle gracefully
  if (error instanceof Error && error.message.includes('command not found')) {
    console.warn('Confignore extension not active, assuming file is included');
    return false;  // Default: include if confignore unavailable
  }
  throw error;
}
```

### Invalid File URI

**Scenario**: Extension passes invalid or non-existent file URI

**Behavior**:

1. Command logs warning: "Invalid file URI: {uri}"
2. Returns `false` (file not ignored)
3. No exception thrown (graceful degradation)

### Workspace Not Open

**Scenario**: Command executed when no workspace is open

**Behavior**:

1. Returns `false` (file not ignored)
2. Logs: "No workspace open; AI ignore not available"

---

## Performance Expectations

### Command Latency

| Scenario                    | Latency | Notes                       |
| --------------------------- | ------- | --------------------------- |
| Cache hit                   | <0.1ms  | File pattern cached         |
| Cache miss (small project)  | <1ms    | < 100 files                 |
| Cache miss (medium project) | 5–10ms  | 100–1k files                |
| Cache miss (large project)  | 20–50ms | 1k–10k files                |
| Config parse (on reload)    | 10–50ms | Depends on config file size |

**Target**: <50ms for 99th percentile (SC-003)

### Batch Operations

**Recommended**: Batch file checks when possible to amortize cache misses

```typescript
// DON'T do this (5 commands):
for (const file of files) {
  await vscode.commands.executeCommand('confignore.isIgnoredForAI', file);
}

// DO this (1 cache load, 5 lookups):
const ignored = await Promise.all(
  files.map(file =>
    vscode.commands.executeCommand('confignore.isIgnoredForAI', file)
  )
);
```

---

## Activation Events

Commands are available after these events:

**Activation Triggers**:

- `onStartupFinished` — Confignore activates automatically on VS Code startup
- `onWorkspaceContains:.vscode/settings.json` — If workspace settings exist
- `onCommand:confignore.*` — Lazy activation on command invocation

**Command Availability**:

- All commands available within 100ms of VS Code startup
- No manual activation required

---

## Backward Compatibility

**Version 1.0** (Current):

- `confignore.isIgnoredForAI(fileUri)` — Core query command
- Context keys for UI menus
- Helper commands for settings/reload

**Future Versions**:

- `confignore.isIgnoredForAI:verbose` — Return detailed reason
- `confignore.bulkCheckIgnored` — Batch query for multiple files
- Webhooks for real-time ignore status updates

**Deprecation Policy**: Commands will be versioned (`confignore.isIgnoredForAI@v1`, etc.) if major changes occur.

---

## Testing Guide

### Unit Tests

```typescript
describe('confignore.isIgnoredForAI', () => {
  it('returns true for files matching aiIgnore patterns', async () => {
    // Setup: workspace with confignore.aiIgnore: ["*.env"]
    const result = await vscode.commands.executeCommand(
      'confignore.isIgnoredForAI',
      vscode.Uri.file('/workspace/file.env')
    );
    expect(result).toBe(true);
  });

  it('returns false for files not matching patterns', async () => {
    const result = await vscode.commands.executeCommand(
      'confignore.isIgnoredForAI',
      vscode.Uri.file('/workspace/file.js')
    );
    expect(result).toBe(false);
  });

  it('handles cache hits efficiently', async () => {
    const start = Date.now();
    // First call: cache miss
    await vscode.commands.executeCommand('confignore.isIgnoredForAI', file1);
    const firstLatency = Date.now() - start;

    // Second call: cache hit
    const start2 = Date.now();
    await vscode.commands.executeCommand('confignore.isIgnoredForAI', file2);
    const cachedLatency = Date.now() - start2;

    expect(cachedLatency).toBeLessThan(firstLatency / 10);
  });
});
```

### Integration Tests

```typescript
describe('confignore.isIgnoredForAI integration', () => {
  it('respects workspace settings changes', async () => {
    // Set initial pattern
    vscode.workspace.getConfiguration().update('confignore.aiIgnore', ['*.env']);

    let result = await vscode.commands.executeCommand(
      'confignore.isIgnoredForAI',
      testFile
    );
    expect(result).toBe(true);

    // Change pattern
    vscode.workspace.getConfiguration().update('confignore.aiIgnore', []);

    result = await vscode.commands.executeCommand(
      'confignore.isIgnoredForAI',
      testFile
    );
    expect(result).toBe(false);
  });

  it('aggregates patterns from multiple sources', async () => {
    // Workspace settings + .claude/settings.json
    // Command should respect both
  });
});
```

---

## Migration Guide

### For Existing Extensions

If your extension currently checks gitignore status, you can now also check AI ignore:

**Before** (only git-aware):

```typescript
const gitIgnored = await resolveState(file);
if (gitIgnored.excluded) {
  // Skip file
}
```

**After** (git + AI-aware):

```typescript
const gitIgnored = await resolveState(file);
const aiIgnored = await vscode.commands.executeCommand(
  'confignore.isIgnoredForAI',
  file.path
);

if (gitIgnored.excluded || aiIgnored) {
  // Skip file from processing
}
```

---

## Changelog

### v1.0.0 (Initial Release)

- ✅ `confignore.isIgnoredForAI` command
- ✅ Context keys for menu visibility
- ✅ Helper commands (openSettings, reload, showStatus)
- ✅ <50ms performance target achieved with caching
- ✅ Automatic config reloading
- ✅ Support for Claude, Copilot, and workspace settings

### v1.1.0 (Planned)

- 🔄 Verbose command variant (with pattern details)
- 🔄 Bulk query command for multiple files
- 🔄 Real-time webhook notifications
- 🔄 Config export/import utilities
