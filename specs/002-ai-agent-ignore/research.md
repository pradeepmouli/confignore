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

**Answer**: Phase 1 targets identified in clarification:

- **Claude Code (Anthropic)**: Supports blocking access to specific files via permission rules in `settings.json`. The current recommended mechanism is `.claude/settings.json` → `permissions.deny` entries like `Read(./secrets/**)` (this replaces the deprecated `ignorePatterns`).
- **GitHub Copilot (GitHub/Microsoft)**:
  - **GitHub (remote)**: Supports “content exclusion” configured in GitHub repository/organization/enterprise settings (not a repo file). Patterns are configured as paths (YAML) using `fnmatch` matching.
  - **IDE Agent mode / Copilot CLI / Copilot coding agent**: GitHub documents that these do **not** support content exclusion.
- **OpenAI Codex (CLI + IDE extension)**: Official docs describe sandbox + approval controls and an execution-policy system, but do not document any per-file ignore/exclusion pattern mechanism (no supported `.codexignore`). The configuration file is `~/.codex/config.toml`.
- **Gemini Code Assist (Google Cloud)**: Supports excluding files via `.aiexclude` and optionally `.gitignore` (with documented precedence and IDE settings to select the context exclusion file). Gemini CLI separately supports `.geminiignore`.

**Phase 2 scope** (deferred): Cursor IDE (`.cursorignore`), Codeium (`.codeiumignore`), and other LLM integrations

**Relevance**: Users want a single, unified ignore configuration for AI agents rather than managing separate ignore files for each tool. This justifies the multi-agent detection approach. Phase 1 focuses on most popular/documented agents; Phase 2 expands coverage.

### Q2: What are the standard config file formats for AI agents?

**Findings**:

| Agent                        | Primary Config                      | Alternate Formats                                        | Pattern Syntax                                                                       | Typical Location                             |
| ---------------------------- | ----------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------- |
| Claude Code (Phase 1)        | `.claude/settings.json`             | `.claude/settings.local.json`, `~/.claude/settings.json` | Permission rules (not gitignore): `permissions.deny` entries like `Read(./path)`     | Repo root `.claude/` + user home             |
| GitHub Copilot (Phase 1)     | GitHub “Content exclusion” settings | —                                                        | YAML paths using `fnmatch` pattern matching                                          | GitHub repo/org/enterprise settings (remote) |
| OpenAI Codex (Phase 1)       | `~/.codex/config.toml`              | `managed_config.toml` (managed)                          | No documented per-file ignore patterns; sandbox/approvals + exec policy for commands | User home + managed locations                |
| Gemini Code Assist (Phase 1) | `.aiexclude`                        | `.gitignore` (optional), Gemini CLI: `.geminiignore`     | `.aiexclude` follows `.gitignore` syntax; `.aiexclude` preempts `.gitignore`         | Repo root                                    |
| Cursor (Phase 2)             | `.cursorignore`                     | `cursor.json`                                            | gitignore style                                                                      | Root                                         |
| Codeium (Phase 2)            | `.codeiumignore`                    | Settings file                                            | gitignore style                                                                      | Root                                         |

**Design Implication**:

- **Claude** and **Gemini** have local, file-based exclusion mechanisms that can be parsed/imported.
- **Copilot** exclusions are configured remotely (GitHub UI/settings), and GitHub explicitly notes that Copilot CLI, Copilot coding agent, and Agent mode in Copilot Chat in IDEs do not support content exclusion.
- **Codex** does not document per-file exclusions; the only reliable “suppression” mechanism is to keep sensitive files outside the workspace roots Codex can see.
- Confignore should remain the _authoritative_ per-project ignore list (`confignore.aiIgnore`) and optionally import from Claude/Gemini sources where feasible.

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

- Reuse feature 001's glob matching for Confignore’s own `confignore.aiIgnore` patterns.
- When importing from agent configs, normalize into a consistent internal glob representation where possible:
  - Gemini `.aiexclude` is already `.gitignore`-syntax.
  - Claude Code uses permission rules like `Read(./secrets/**)`; Confignore should extract the path inside `Read(...)` and treat it as a glob.
  - Copilot content exclusion uses `fnmatch` syntax in remote YAML; Confignore cannot reliably import this without GitHub API access.
  - Codex has no supported per-file ignore mechanism to import.

### Q4: How do existing tools handle conflicts between ignore rules?

**Findings**:

| Tool     | Approach                               | Behavior                                                                 |
| -------- | -------------------------------------- | ------------------------------------------------------------------------ |
| Git      | Gitignore wins (files ignored for git) | If file ignored in gitignore, can't be included by user                  |
| Prettier | Ignore patterns win                    | Precedence: `.prettierignore` > `ignorePatterns` config > files included |
| ESLint   | Config excludes win                    | `overrides` in config can override root ignorePatterns                   |
| VS Code  | Settings override files                | Workspace settings take precedence over user settings                    |

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

### Claude Code (Anthropic) configuration

**File**: `.claude/settings.json`

Claude Code uses permission rules to control file access. To block file reads, add `Read(...)` entries under `permissions.deny`.

```json
{
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Read(./config/credentials.json)"
    ]
  }
}
```

**Notes**:

- Anthropic docs state this replaces the deprecated `ignorePatterns` configuration.
- Confignore can import `Read(...)` deny paths as glob patterns.

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

**GitHub (remote) content exclusion** is configured in repository/org/enterprise settings, not via a checked-in ignore file.

Patterns are entered as YAML paths and support `fnmatch` pattern matching. Example (repository settings):

```yaml
- "/scripts/**"
- "secrets.json"
- "secret*"
- "*.cfg"
```

**Important limitation** (per GitHub docs): Copilot CLI, Copilot coding agent, and Agent mode in Copilot Chat in IDEs do **not** support content exclusion.

**Confignore implication**: Confignore should not claim to parse `.copilotignore` files. If we ever support importing Copilot exclusions, it would require GitHub API integration and appropriate permissions.

## Implementation Decisions

### Decision 1: Configuration Priority Order

**Chosen**: Aggregate all sources, evaluate independently per source

**Rationale**:

- Users may have patterns in both workspace settings and agent-specific configs
- Aggregating ensures comprehensive coverage
- Independent evaluation prevents unexpected conflicts
- Each source has provenance (shown to user)

**Algorithm (Phase 1, supported sources only)**:

```
patterns = []

// Confignore is authoritative
patterns += workspace_settings.confignore.aiIgnore

// Optional imports (best-effort)
patterns += extractClaudeDeniedReads(.claude/settings.json)  // Read(...) entries
patterns += parseGitignoreStyle(.aiexclude)                  // Gemini Code Assist

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

- Claude settings JSON parse error → log warning, skip import
- Claude `permissions.deny` missing/not an array → treat as empty
- Non-`Read(...)` deny rules → ignore (not file read exclusions)
- Gemini `.aiexclude` read/parse errors → log warning, skip import
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
