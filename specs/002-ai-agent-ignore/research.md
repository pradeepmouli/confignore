# Research: AI Agent Ignore Support

**Feature**: 002-ai-agent-ignore | **Date**: January 3, 2026 | **Phase**: 0 (Research)

## Objective

Research existing AI agent configuration formats and ignore patterns to inform the technical design of the AI agent ignore support feature. Identify:
1. Which AI agents have ignore/exclusion mechanisms
2. Standard config file formats and locations
3. Pattern syntax compatibility with gitignore
4. Precedence and conflict resolution patterns in existing tools
5. Performance considerations for pattern matching at scale

## Research Questions

### Q1: What AI agents need ignore pattern support?

**Answer**: Primary targets identified in clarification:
- **Claude** (Anthropic): Uses `.claude/settings.json` or `claude.json` in workspace
- **GitHub Copilot**: Configurable via VS Code settings and `.copilotignore` file
- **GitHub Codex**: Shares configuration with GitHub Copilot (`.copilotignore` or Copilot settings)
- **Google Gemini**: Uses `.geminiignore` gitignore-style file or Gemini-specific settings
- **ChatGPT** (OpenAI): Context via API or VS Code extension; respects `.openaiignore` if standard established
- **Other LLM integrations**: Cursor IDE uses `.cursorignore`, Codeium uses similar patterns

**Relevance**: Users want a single, unified ignore configuration for AI agents rather than managing separate ignore files for each tool. This justifies the multi-agent detection approach.

### Q2: What are the standard config file formats for AI agents?

**Findings**:

| Agent | Primary Config | Alternate Formats | Pattern Syntax | Typical Location |
|-------|-----------------|-------------------|-----------------|------------------|
| Claude | `.claude/settings.json` | `claude.json` | JSON with `ignore` array | Root or `.claude/` |
| GitHub Copilot | VS Code settings + `.copilotignore` | Environment variables | gitignore style OR JSON | Workspace settings / root |
| GitHub Codex | `.copilotignore` (shared with Copilot) | VS Code settings | gitignore style | Root |
| Google Gemini | `.geminiignore` | Gemini settings file | gitignore style | Root |
| Cursor | `.cursorignore` | `cursor.json` | gitignore style | Root |
| Codeium | `.codeiumignore` | Settings file | gitignore style | Root |
| LLM-based tools | Varies | `.aiignore` (proposed standard) | Usually gitignore-compatible | Root |

**Design Implication**:
- Support multiple formats (JSON config files + gitignore-style files)
- Treat JSON-based configs as read-only detection (don't auto-create)
- Standardize on gitignore glob syntax internally for consistency
- Phase 1 focus: `.claude/settings.json`, `.geminiignore` + workspace settings; extend to other formats in Phase 2
- Note: Codex shares Copilot's configuration, simplifying implementation

### Q3: Is gitignore pattern syntax compatible with AI ignore requirements?

**Findings**:

Gitignore glob syntax covers all use cases:
- **Wildcards**: `*.log`, `**/*.tmp` — supported by feature 001 pattern matching
- **Negation**: `!important.js` — allows exceptions to broader exclusions
- **Directory specificity**: `node_modules/`, `**/dist/` — supported
- **Anchored paths**: `/config` vs `config` — relative to workspace root

**Compatibility Assessment**:
- ✅ All required pattern types supported by existing `matchPattern` utility in feature 001
- ✅ Can reuse glob matching library (minimatch or similar already in use)
- ✅ No new pattern syntax needed; leverage existing infrastructure
- ⚠️ Validation needed: Some glob patterns may be ambiguous (e.g., `*.` without extension)

**Design Implication**:
- Reuse feature 001's pattern matching for consistency
- Validate patterns at config parse time with clear error messages
- Document glob syntax limitations (e.g., circular directory references)

### Q4: How do existing tools handle conflicts between ignore rules?

**Findings**:

| Tool | Approach | Behavior |
|------|----------|----------|
| Git | Gitignore wins (files ignored for git) | If file ignored in gitignore, can't be included by user |
| Prettier | Ignore patterns win | Precedence: `.prettierignore` > `ignorePatterns` config > files included |
| ESLint | Config excludes win | `overrides` in config can override root ignorePatterns |
| VS Code | Settings override files | Workspace settings take precedence over user settings |

**Independent Evaluation Justification**:
- AI ignore patterns should NOT defer to gitignore (clarification Q4 answer: "B - Independent evaluation")
- A file can be `ignored for AI` but `tracked in git` (and vice versa)
- Example use case: Sensitive data tracked in git, but excluded from AI context to prevent leakage in prompts

**Design Implication**:
- No precedence relationship between gitignore and aiIgnore
- Evaluate both independently
- Allow developers to configure different exclusion rules per context
- This is simplest and maintains user intent

### Q5: What are performance considerations for pattern matching?

**Findings**:

**Scale Scenarios**:
- **Small projects** (< 100 files): Pattern matching is instant (< 1ms)
- **Medium projects** (100–10k files): Glob matching per-file can accumulate (10–100ms for full traversal)
- **Large projects** (10k+ files): Need caching to avoid repeated evaluations (without cache: 500ms+)

**Optimization Strategies**:
1. **Caching**: Evaluate patterns once per file, cache result (key: `<file_path> + <pattern_hash>`)
2. **Memoization**: Cache entire directory traversal results; invalidate on config change
3. **Lazy evaluation**: Only evaluate when explicitly requested (via command or UI interaction)
4. **Batch operations**: When decorating multiple files, process in batches with cache hits

**Feature 001 Approach**: Already uses pattern matching; check if caching implemented
- **Current**: `matchPattern` is called per-file in `stateResolver`; no visible cache layer
- **Recommendation**: Add caching in `aiIgnoreResolver` to handle 1000+ patterns efficiently

**Design Implication**:
- Implement caching layer in `AiIgnoreResolver`
- Invalidate cache on workspace setting changes or config file updates
- Target: <50ms for command queries (SC-003); cache enables this with 1000+ patterns

## Configuration Format Specifications

### Claude Configuration (Primary Format)

**File**: `.claude/settings.json`

```json
{
  "ignore": [
    "node_modules/**",
    "*.test.js",
    "dist/",
    ".git/"
  ],
  "other_settings": {}
}
```

**Detection Logic**:
1. Check if `.claude/settings.json` exists in workspace root
2. If exists, parse JSON and extract `ignore` array
3. If not array or field missing, treat as empty patterns
4. If file malformed, log warning and skip

**Fallback**: VS Code workspace settings (`confignore.aiIgnore`)

### Workspace Settings Format (Primary for User Configuration)

**File**: `.vscode/settings.json`

```json
{
  "confignore.aiIgnore": [
    "**/*.env",
    "secrets/",
    "api_keys.json"
  ]
}
```

**Detection Logic**:
1. Query VS Code workspace settings for `confignore.aiIgnore`
2. Expect array of glob patterns
3. If not array, treat as empty
4. Validate each pattern for glob syntax issues

### GitHub Copilot Format (Secondary)

**Files**: `.copilotignore` or VS Code settings

`.copilotignore` (gitignore style):
```
# Copilot ignore file
node_modules/
*.key
secret_*
```

VS Code settings:
```json
{
  "github.copilot.ignorePatterns": [
    "node_modules/**",
    "*.key"
  ]
}
```

**Detection Logic**:
1. Check for `.copilotignore` file
2. Parse line-by-line (skip comments, blank lines)
3. Aggregate with VS Code settings if present
4. Deduplicate patterns

## Implementation Decisions

### Decision 1: Configuration Priority Order

**Chosen**: Aggregate all sources, evaluate independently per source

**Rationale**:
- Users may have patterns in both workspace settings and agent-specific configs
- Aggregating ensures comprehensive coverage
- Independent evaluation prevents unexpected conflicts
- Each source has provenance (shown to user)

**Algorithm**:
```
patterns = []
if (workspace_settings.confignore.aiIgnore exists)
  patterns += workspace_settings.confignore.aiIgnore
if (.claude/settings.json exists)
  patterns += .claude/settings.json.ignore
if (.copilotignore exists)
  patterns += parse(.copilotignore)
// Deduplicate exact matches; similar patterns kept for clarity
return deduplicate(patterns)
```

### Decision 2: Pattern Validation Strategy

**Chosen**: Validate at parse time, skip invalid patterns with warning

**Rationale**:
- Early detection of configuration errors
- Prevents silent failures during file decoration
- Clear feedback to user about malformed patterns
- Alignment with constitution principle (clear error messages)

**Validation Checks**:
- Glob syntax: Check for unbalanced brackets, invalid characters
- Reserved paths: Warn if pattern references `.git`, `.vscode` (rarely intended)
- Circular refs: Warn if pattern could cause infinite matches

### Decision 3: Caching Strategy

**Chosen**: Two-tier cache (file-level + workspace-level)

**Rationale**:
- Meets <50ms performance target (SC-003)
- Invalidation simple (watch config files for changes)
- Memory overhead acceptable (hash + boolean)

**Cache Key**: `workspace_uri:file_path:pattern_hash`

**Invalidation Triggers**:
- Workspace settings change (via onDidChangeConfiguration)
- Agent config file save (via FileSystemWatcher)
- Manual clear (user command)

### Decision 4: Error Handling for Agent Config Files

**Chosen**: Graceful degradation with user warnings

**Strategy**:
- JSON parse error → log warning, skip file
- Missing `ignore` field → treat as empty
- Non-array `ignore` → log warning, skip
- File permissions error → log warning, skip
- Continue evaluation with other sources

**User Impact**: Users see warnings in Output Channel; feature still works with available patterns

## Open Questions for Design Phase

1. **Should we auto-create `.claude/settings.json` if user adds AI patterns via UI?**
   - Current plan: NO (matches feature 001 philosophy—don't auto-create configs)
   - Alternative: Create with user confirmation

2. **How to handle nested workspace folders in multi-root?**
   - Current plan: Each folder has independent config
   - Alternative: Root-level config applies to all folders

3. **Should pattern matching be recursive through .claude/ nested configs?**
   - Current plan: Only top-level `.claude/settings.json`
   - Alternative: Support nested folders (complex, rare use case)

## Recommended Next Steps

1. **Phase 1 (Data Model)**: Define `AiIgnorePattern` and `AiIgnoreConfig` types based on findings
2. **Phase 1 (Quickstart)**: Document how users configure AI ignores in workspace
3. **Phase 1 (Contracts)**: Specify command API signature for `confignore.isIgnoredForAI`
4. **Phase 2 (Tasks)**: Break implementation into executable tasks
