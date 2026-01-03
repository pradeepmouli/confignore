# Quickstart: AI Agent Ignore Integration

**Feature**: 002-ai-agent-ignore | **Date**: January 3, 2026 | **Phase**: 1 (Design)

## For Users: Configuring AI Ignore Patterns

### Quick Start (2 minutes)

**Goal**: Exclude sensitive files from AI agent context

#### Option A: VS Code Workspace Settings (Easiest)

1. Open `.vscode/settings.json` (or create it)
2. Add:
   ```json
   {
     "confignore.aiIgnore": [
       "*.env",
       "secrets/**",
       "api_keys.json"
     ]
   }
   ```
3. Save. Confignore immediately shows badges on matching files.

**Result**: ✅ AI agents will be notified these files are excluded from context

#### Option B: Claude Agent Config (If using Claude)

1. Create `.claude/settings.json` in project root
2. Add:
   ```json
   {
     "ignore": [
       "node_modules/**",
       ".git/**",
       "*.log"
     ]
   }
   ```
3. Save. Confignore detects and aggregates these patterns.

**Result**: ✅ Claude reads this config; Confignore shows both workspace and Claude patterns

#### Option C: Combine Both (Recommended)

Workspace settings for project-wide rules + agent config for agent-specific rules:

**`.vscode/settings.json`**:
```json
{
  "confignore.aiIgnore": [
    "secrets/",
    ".env*",
    "private_keys.pem"
  ]
}
```

**`.claude/settings.json`**:
```json
{
  "ignore": [
    "node_modules/**",
    "vendor/**",
    ".git/"
  ]
}
```

**Result**: ✅ Patterns from both files aggregated and displayed together

---

### Common Patterns

**Exclude secrets**:
```json
{
  "confignore.aiIgnore": [
    "*.env",
    "*.env.local",
    "secrets/",
    "**/private_key*",
    "credentials.json"
  ]
}
```

**Exclude build artifacts**:
```json
{
  "confignore.aiIgnore": [
    "dist/",
    "build/",
    ".next/",
    "out/",
    "*.min.js",
    "*.min.css"
  ]
}
```

**Exclude dependencies**:
```json
{
  "confignore.aiIgnore": [
    "node_modules/",
    "vendor/",
    ".venv/",
    "__pycache__/"
  ]
}
```

**Exclude system files**:
```json
{
  "confignore.aiIgnore": [
    ".DS_Store",
    "Thumbs.db",
    ".vscode/**/cache",
    ".git/",
    ".hg/"
  ]
}
```

**Exclude large data files** (speeds up AI context):
```json
{
  "confignore.aiIgnore": [
    "*.sql",
    "*.db",
    "data/csv/**",
    "datasets/**",
    "*.tar.gz"
  ]
}
```

---

### Checking What's Ignored

**VS Code UI**:
1. Open file explorer
2. Look for badge on files/folders (🤖 icon overlay)
3. Hover over badge → tooltip shows "Ignored for AI agents"

**Command (Future)**:
```
Confignore: Check AI Ignore Status
```
Shows which patterns matched a selected file.

---

### Pattern Syntax Guide

Based on gitignore syntax (familiar if you use `.gitignore`):

| Pattern | Matches |
|---------|---------|
| `*.env` | All files ending in `.env` (anywhere in tree) |
| `secrets/` | All `secrets` directories |
| `node_modules/**` | Everything inside `node_modules` |
| `/root_only` | File/folder at project root only |
| `**/*.log` | Any `.log` file in any subdirectory |
| `!important.js` | **Exception**: Include this despite other excludes |
| `dir/**/*.test.js` | Test files in `dir` and subdirectories |

**Tips**:
- Use `/` at start to anchor to workspace root
- Use `**` to match any nested path
- Use `!` to create exceptions
- No circular references (e.g., `**/**` is inefficient but works)

---

### Troubleshooting

**Issue**: File has no badge, but I added pattern

**Solution**:
1. Check pattern syntax (see table above)
2. Verify file matches pattern (e.g., `*.env` won't match `config.yaml`)
3. Reload window: Cmd+Shift+P → "Reload Window"

**Issue**: Badge shows but pattern doesn't seem to work

**Solution**:
1. Check tooltip (hover badge) to see which pattern matched
2. Pattern matched correctly; AI agent may not respect extension settings
3. Contact AI tool support if it ignores `.claude/settings.json` or similar

**Issue**: Too many badges; need to exclude more files

**Solution**:
1. Use wildcard patterns: `**/*.tmp` instead of listing files
2. Exclude directories: `build/`, `dist/` instead of individual files
3. Use negation to refine: `!important.js` to allow exceptions

---

## For Developers: Integration Points

### Architecture Overview

```
┌────────────────────────────────────────┐
│  Confignore Extension (Feature 002)    │
├────────────────────────────────────────┤
│                                        │
│  1. Detect AI ignore config files      │
│  2. Parse workspace settings           │
│  3. Evaluate patterns for each file    │
│  4. Display badges in file explorer    │
│  5. Expose command API for queries     │
│                                        │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  AI Agents (Claude, Copilot, etc.)    │
├────────────────────────────────────────┤
│                                        │
│  1. Read agent config files            │
│  2. Read VS Code extension settings    │
│  3. Respect confignore.aiIgnore        │
│  4. Query via confignore.isIgnoredForAI│
│                                        │
└────────────────────────────────────────┘
```

### Using the Command API

**For Other Extensions**:

Example: AI agent extension wants to check if file should be included in context

```typescript
import * as vscode from 'vscode';

async function checkIfIgnoredForAI(fileUri: vscode.Uri): Promise<boolean> {
  const isIgnored = await vscode.commands.executeCommand(
    'confignore.isIgnoredForAI',
    fileUri
  );
  return isIgnored;
}

// Usage:
const secretsJson = vscode.Uri.file('/project/secrets.json');
const ignored = await checkIfIgnoredForAI(secretsJson);
if (!ignored) {
  // Safe to include in AI context
  // ...send to AI model
}
```

**Command Signature**:
```
confignore.isIgnoredForAI(fileUri: Uri): Promise<boolean>
```

Returns `true` if file matches any AI ignore pattern, `false` otherwise.

---

### Extending with New Agent Formats

**To add support for new AI agent config format**:

1. Add to `agentConfigDetector.ts`:
   ```typescript
   async function detectNewAgentConfig(workspaceUri: Uri): Promise<AiIgnorePattern[]> {
     const configPath = vscode.Uri.joinPath(workspaceUri, '.newagent/config.json');
     try {
       const file = await vscode.workspace.fs.readFile(configPath);
       const config = JSON.parse(file.toString());
       return config.ignorePatterns || [];
     } catch {
       return [];  // Config not found or parse error
     }
   }
   ```

2. Call in main detection function:
   ```typescript
   const allPatterns = [
     ...workspaceSettingsPatterns,
     ...claudePatterns,
     ...copilotPatterns,
     ...detectNewAgentConfig(workspaceUri)  // Add this
   ];
   ```

3. Document in research.md and data-model.md

**Note**: Feature 001 infrastructure handles pattern validation and matching; new agent configs just need parsing.

---

### Event Handling

**Pattern changes** trigger badge updates:

```typescript
// When user edits .vscode/settings.json or .claude/settings.json
// Confignore listens for file changes and updates decorations
// No manual reload needed
```

**Listeners registered**:
1. `onDidChangeConfiguration` → Invalidate cache, refresh badges
2. `FileSystemWatcher(.claude/settings.json)` → Re-parse Claude config
3. `FileSystemWatcher(.copilotignore)` → Re-parse Copilot config
4. `onDidChangeTextEditors` → Update UI decorations

---

### Performance Expectations

**Configuration Load Time**:
- Small projects (< 100 files): ~10ms
- Medium projects (100–1k files): ~20ms
- Large projects (1k–10k files): ~50ms
- Very large projects (10k+ files): ~100–200ms

**Pattern Evaluation Per-File**:
- First evaluation: ~1ms (including validation)
- Cached evaluation: <0.01ms (hash lookup)

**Badge Rendering**:
- Initial render: 50–100ms
- Incremental (on config change): 20–50ms

**Memory Overhead**:
- Cache (1000 entries): ~100KB
- Config parsing: ~50KB
- Total: <200KB overhead

---

### Testing the Integration

**Manual Testing Steps**:

1. Create test project:
   ```bash
   mkdir test-ai-ignore
   cd test-ai-ignore
   git init
   ```

2. Create config:
   ```json
   // .vscode/settings.json
   {
     "confignore.aiIgnore": [
       "*.env",
       "secrets/"
     ]
   }
   ```

3. Create test files:
   ```bash
   touch file.env
   mkdir secrets
   touch secrets/key.json
   touch normal.js
   ```

4. Open in VS Code
5. Verify badges appear on `file.env` and `secrets/`
6. Verify no badge on `normal.js`

**Automated Testing**:
- Unit tests for pattern matching (reuse feature 001 tests)
- Unit tests for config detection and parsing
- Integration tests for command API
- UI tests for badge rendering

---

## Next Steps

1. **Review data-model.md** for technical structure
2. **Review contracts/extension-commands.md** for API details
3. **Begin Phase 2 (Tasks)** to start implementation
4. **Test with real projects** once feature is complete

---

## FAQ

**Q: Do AI agents automatically use Confignore?**

A: Depends on the agent:
- Claude: Yes (reads `.claude/settings.json`)
- GitHub Copilot: Partially (reads `.copilotignore`)
- ChatGPT: Not yet (future extension)
- Custom agents: Can use `confignore.isIgnoredForAI` command

Confignore's role: Display what's ignored + provide API for other tools.

**Q: Can I exclude more files than gitignore?**

A: Yes! AI ignore is independent from gitignore. You can:
- Include files in git but exclude from AI: `!.env` in git, but in aiIgnore
- Exclude more from AI than git: More patterns in aiIgnore
- Different exclusions per context: Freedom to manage separately

**Q: How often are patterns re-evaluated?**

A: Continuously as you edit:
- After saving config file
- After changing workspace settings
- Cached results used to keep UI responsive (<100ms)

**Q: Can I use regex patterns?**

A: No, only glob patterns (like gitignore). Glob is simpler, faster, and familiar to most developers.

**Q: Performance impact on large projects?**

A: Minimal with caching:
- First decoration: 50–100ms
- Updates: 20–50ms
- Queries: <50ms
- Memory: <200KB overhead
