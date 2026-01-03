# Data Model: AI Agent Ignore Support

**Feature**: 002-ai-agent-ignore | **Date**: January 3, 2026 | **Phase**: 1 (Design)

## Overview

This document defines the data structures, types, and relationships for AI agent ignore pattern support. It extends the existing data model from feature 001 with AI-specific entities.

## Core Entities

### 1. AI Ignore Pattern

**Definition**: A glob pattern string that matches files/directories to exclude from AI agent context.

```typescript
type AiIgnorePattern = string;

// Examples:
// "node_modules/**"
// "*.env"
// "!important.js" (negation pattern)
// "src/**/internal/*" (glob with wildcards)
```

**Characteristics**:
- Inherits gitignore glob syntax (see research.md Q3)
- Can be positive (exclude) or negative (include exception)
- Case-sensitive on Unix-like systems, case-insensitive on Windows
- Anchored to workspace root or folder-relative
- No circular references allowed

**Validation**:
```typescript
interface PatternValidation {
  valid: boolean;
  pattern: string;
  errors?: string[];  // e.g., ["Invalid bracket", "Reserved path warning"]
}

function validatePattern(pattern: string): PatternValidation
```

---

### 2. AI Ignore Config

**Definition**: Collection of all AI agent ignore patterns for a project, aggregated from multiple sources.

```typescript
interface AiIgnoreConfig {
  workspaceUri: Uri;
  patterns: AiIgnorePattern[];
  sources: AiIgnoreSource[];
  lastUpdated: Date;
  isValid: boolean;          // true if all patterns validated
  validationErrors?: string[]; // patterns with issues
}

interface AiIgnoreSource {
  source: 'workspace:settings' | 'agent:.claude/settings.json' | 'agent:.copilotignore' | 'agent:custom';
  patterns: AiIgnorePattern[];
  filePath?: string;         // path to agent config file
  errors?: string[];         // parsing errors for this source
}
```

**Responsibilities**:
- Store patterns from all detected sources
- Track provenance (which source contributed which patterns)
- Maintain validation state
- Support cache invalidation on source changes

**Example**:
```typescript
{
  workspaceUri: Uri { fsPath: '/user/project' },
  patterns: [
    'node_modules/**',
    '*.env',
    'secrets/',
    '.claude/settings.json' // from .claude/settings.json
  ],
  sources: [
    {
      source: 'workspace:settings',
      patterns: ['node_modules/**', '*.env'],
      filePath: '.vscode/settings.json'
    },
    {
      source: 'agent:.claude/settings.json',
      patterns: ['secrets/', '.claude/settings.json'],
      filePath: '.claude/settings.json'
    }
  ],
  lastUpdated: 2026-01-03T...,
  isValid: true
}
```

---

### 3. AI Ignore Status

**Definition**: Result of evaluating whether a file is ignored by AI agent patterns.

```typescript
interface AiIgnoreStatus {
  uri: Uri;
  isIgnored: boolean;        // true if matches any pattern
  matchedPatterns?: string[]; // patterns that matched
  source?: AiIgnoreSource;   // which source matched
  evaluatedAt: Date;
  cacheKey?: string;         // for cache lookup
}
```

**Usage**: Returned by `aiIgnoreResolver.isIgnored(uri)` and `confignore.isIgnoredForAI` command

**Example**:
```typescript
{
  uri: Uri { fsPath: '/project/node_modules/lib.js' },
  isIgnored: true,
  matchedPatterns: ['node_modules/**'],
  source: { source: 'workspace:settings', patterns: [...] },
  evaluatedAt: 2026-01-03T...,
  cacheKey: 'file:///project/node_modules/lib.js:pattern_hash_xyz'
}
```

---

### 4. Agent Config Detection Result

**Definition**: Result of discovering and parsing agent-specific configuration files.

```typescript
interface AgentConfigDetectionResult {
  workspaceUri: Uri;
  detectedConfigs: AgentConfigFile[];
  totalPatterns: number;
  parseErrors: AgentConfigError[];
}

interface AgentConfigFile {
  agentName: 'claude' | 'copilot' | 'cursor' | 'codeium' | 'custom';
  configPath: string;         // relative to workspace root
  patterns: AiIgnorePattern[];
  format: 'json' | 'gitignore-style';
  parseStatus: 'success' | 'partial' | 'failed';
  lastModified: Date;
}

interface AgentConfigError {
  configPath: string;
  errorType: 'parse' | 'validation' | 'permission' | 'not_found';
  message: string;
  lineNumber?: number;       // for gitignore-style files
}
```

---

## Type Extensions from Feature 001

### Extended Source Enum

```typescript
export enum Source {
  // Existing types (from feature 001)
  ConfigTsconfig = 'config:tsconfig',
  ConfigPrettier = 'config:prettier',
  ConfigEslint = 'config:eslint',
  IgnoreFileGit = 'ignore:.gitignore',
  IgnoreFileDocker = 'ignore:.dockerignore',
  IgnoreFileEslint = 'ignore:.eslintignore',
  IgnoreFilePrettier = 'ignore:.prettierignore',
  IgnoreFileNpm = 'ignore:.npmignore',
  IgnoreFileStylelint = 'ignore:.stylelintignore',
  IgnoreFileVscode = 'ignore:.vscodeignore',
  WorkspaceSettings = 'workspace:settings',

  // NEW: AI agent ignore types
  WorkspaceSettingsAiAgent = 'workspace:aiIgnore',
  IgnoreFileAiAgent = 'ignore:.aiignore',
  AgentConfigClaude = 'agent:.claude/settings.json',
  AgentConfigCopilot = 'agent:.copilotignore',
  AgentConfigCursor = 'agent:.cursorignore',
  AgentConfigCodeium = 'agent:.codeiumignore'
}
```

**Usage**: `Source` enum is used in `stateResolver.ts` to track which source contributed to an ignore decision.

### Extended EffectiveState (from Feature 001)

```typescript
export interface EffectiveState {
  // Existing fields
  path: Uri;
  excluded: boolean;
  mixed: boolean;
  source: Source | null;
  sourcesApplied: Source[];
  includeStateComputed?: boolean;

  // NEW: AI ignore fields
  aiIgnored?: boolean;           // true if matches AI patterns
  aiIgnoreSource?: Source;       // which AI source matched
  aiIgnoreReasons?: string[];    // which patterns matched
}
```

**Rationale**: Extends existing `EffectiveState` to include AI ignore information alongside git/config ignore status. Allows UI to display both ignore types together.

---

## Caching Model

### Cache Entry Structure

```typescript
interface AiIgnoreCacheEntry {
  key: string;                    // workspace_uri:file_path:pattern_hash
  isIgnored: boolean;
  matchedPatterns: string[];
  expiresAt: Date;                // TTL-based expiration
}

interface AiIgnoreCache {
  entries: Map<string, AiIgnoreCacheEntry>;
  patternHash: string;            // hash of all patterns (for invalidation)
  lastInvalidated: Date;
  maxSize: number;                // limit entries to avoid memory bloat
}
```

### Cache Invalidation Strategy

**Triggers** (via event listeners):
1. **Workspace Settings Change**: `onDidChangeConfiguration` → invalidate all entries
2. **Agent Config File Save**: FileSystemWatcher on `.claude/settings.json`, `.copilotignore`, etc. → invalidate related entries
3. **Manual Clear**: User command `confignore.clearAiIgnoreCache` → clear all entries
4. **TTL Expiration**: Old entries pruned (configurable, default 1 hour)

**Algorithm**:
```typescript
function invalidateCache(reason: 'settings' | 'file' | 'manual' | 'ttl'): void {
  if (reason === 'settings' || reason === 'manual') {
    cache.clear();  // Full clear
  } else if (reason === 'file') {
    cache.entries.forEach((entry, key) => {
      if (entry.expiresAt < Date.now()) delete cache.entries[key];
    });
  }
}
```

---

## Relationships & Dependencies

### Data Flow Diagram

```
Workspace Settings (confignore.aiIgnore)
    ↓
┌─────────────────────────┐
│  agentConfigDetector    │  ← Detects & parses agent configs
├─────────────────────────┤
│  Finds & reads:         │
│  - .claude/settings.json│
│  - .copilotignore       │
│  - .cursorignore        │
│  - etc.                 │
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│  aiIgnoreResolver       │  ← Evaluates patterns against files
├─────────────────────────┤
│  1. Get AiIgnoreConfig  │
│  2. Check cache         │
│  3. Match patterns      │
│  4. Return AiIgnoreStatus
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│  stateResolver          │  ← Integrates with feature 001
├─────────────────────────┤
│  Combine:               │
│  - Git ignore status    │
│  - Config ignore status │
│  - AI ignore status     │
│  → EffectiveState       │
└─────────────────────────┘
             ↓
┌─────────────────────────┐
│  UI / Commands          │  ← Display & query results
├─────────────────────────┤
│  - File decorations     │
│  - Context keys         │
│  - confignore.isIgn...  │
└─────────────────────────┘
```

---

## Validation Rules

### Pattern Validation

| Rule | Check | Action if Invalid |
|------|-------|-------------------|
| Non-empty | Pattern length > 0 | Skip pattern, log warning |
| Valid glob | No unbalanced brackets, valid escapes | Log warning, skip pattern |
| No reserved | Pattern doesn't match `.git`, `.vscode` (optional warning) | Log warning, but accept pattern |
| No circular | Pattern doesn't create infinite matches | Log warning, skip pattern |

### Config Validation

| Rule | Check | Action if Invalid |
|------|-------|-------------------|
| Format-specific | JSON is valid JSON, gitignore follows format | Log error, skip source |
| Pattern array | Field exists and is array (if expected) | Log warning, treat as empty |
| Encoding | File is UTF-8 or ASCII | Log error, skip file |
| Permissions | File is readable | Log warning, skip file |

---

## Example Scenario

**Workspace Setup**:
- `.vscode/settings.json`: `confignore.aiIgnore: ["node_modules/**", "*.env"]`
- `.claude/settings.json`: `ignore: ["secrets/", "api_keys.json"]`
- `.copilotignore`: Doesn't exist

**Detected Config**:
```typescript
AiIgnoreConfig {
  workspaceUri: Uri.file('/home/user/project'),
  patterns: [
    'node_modules/**',
    '*.env',
    'secrets/',
    'api_keys.json'
  ],
  sources: [
    { source: 'workspace:settings', patterns: ['node_modules/**', '*.env'], filePath: '.vscode/settings.json' },
    { source: 'agent:.claude/settings.json', patterns: ['secrets/', 'api_keys.json'], filePath: '.claude/settings.json' }
  ],
  lastUpdated: 2026-01-03T10:00:00Z,
  isValid: true
}
```

**File Evaluations**:
- `src/app.js` → `isIgnored: false`
- `node_modules/lib.js` → `isIgnored: true` (matches `node_modules/**`)
- `src/config.env` → `isIgnored: true` (matches `*.env`)
- `secrets/api_key.txt` → `isIgnored: true` (matches `secrets/`)
- `api_keys.json` → `isIgnored: true` (matches `api_keys.json`)

---

## Performance Considerations

**Memory**: Cache with ~1000 entries ≈ 100KB (small)

**CPU**: 
- Pattern matching per-file: ~0.1ms (gitignore library efficient)
- With cache hit: <0.01ms
- Config detection: ~10ms (file reads + parsing)
- Full workspace evaluation: 10–100ms depending on size

**Tradeoff**: Cache trades minimal memory for significant CPU savings.

---

## Next Steps

1. **Quickstart**: Document user-facing configuration workflow
2. **Contracts**: Define command API (`confignore.isIgnoredForAI`)
3. **Implementation**: Implement types in `src/models/types.ts`, create `aiIgnoreResolver.ts` and `agentConfigDetector.ts`
