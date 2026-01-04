# Feature Specification: AI Agent Ignore Support

**Feature Branch**: `002-ai-agent-ignore`
**Created**: January 2, 2026
**Status**: Draft
**Input**: User description: "add support for ignoring for ai agents"

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

## Dependencies

- **Feature 001 (Ignore Visibility Config)**: This feature extends the ignore configuration system established in 001-ignore-visibility-config. The AI agent ignore support reuses the existing ignore pattern evaluation framework, configuration storage mechanisms, and UI components where applicable. Integration ensures consistency across all ignore types (git, workspace, AI agent, etc.).

### User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure AI Agent Ignore Patterns (Priority: P1)

A developer wants to specify which files and directories should be excluded from AI agent context (e.g., ChatGPT, GitHub Copilot, Claude, Gemini, Codex) to improve response quality and reduce token usage. They need a configuration option in their project's ignore settings that explicitly designates patterns for AI agents.

**Why this priority**: This is the core feature request - the fundamental ability to configure AI-specific ignore patterns. Without this, the feature cannot deliver any value.

**Independent Test**: Can be fully tested by creating an AI agent ignore config and verifying that designated patterns are recognized and accessible to the extension.

**Acceptance Scenarios**:

1. **Given** a developer has opened their project workspace, **When** they add an `aiIgnore` configuration section to their ignore settings, **Then** the extension recognizes and parses the AI agent ignore patterns without errors
2. **Given** AI agent ignore patterns are configured, **When** the developer opens the settings, **Then** they can view and edit the patterns through the VS Code UI
3. **Given** invalid patterns are added to the AI agent ignore config, **When** the extension loads, **Then** it provides clear validation feedback indicating which patterns are malformed

---

### User Story 2 - Display AI-Specific Ignore Status (Priority: P1)

A developer wants to quickly understand which files and directories are ignored specifically for AI agents. They need visual feedback in VS Code that shows the ignore status for each file/folder, distinguishing between regular ignores and AI-specific ignores.

**Why this priority**: Essential for making the feature discoverable and useful - developers need to verify their configuration is working correctly and understand what's being excluded.

**Independent Test**: Can be fully tested by checking that appropriate indicators appear in the file explorer for files/directories matching AI agent ignore patterns.

**Acceptance Scenarios**:

1. **Given** files matching AI agent ignore patterns exist, **When** the developer views the file explorer, **Then** those files display a badge overlay (small icon on the file icon) showing they are ignored for AI agents
2. **Given** a file is ignored for AI agents but not ignored for version control, **When** the developer hovers over the badge, **Then** a tooltip explains the ignore scope
3. **Given** both regular and AI-specific ignores apply to a file, **When** the developer views the file, **Then** the badge and other decorations coexist without overlapping (following VS Code decoration composition rules)

---

### User Story 3 - Query AI-Specific Ignore Status Programmatically (Priority: P2)

A developer using VS Code extensions (including AI assistants integrated as extensions) needs to programmatically determine whether a file should be excluded from AI context. They need an API or context mechanism to query the AI ignore status of files.

**Why this priority**: Enables other extensions and AI tools to respect the ignore configuration, improving interoperability. Less critical than configuration and UI visibility, but important for ecosystem integration.

**Independent Test**: Can be fully tested by creating a test extension that queries the AI ignore status API and verifies correct results for various file paths.

**Acceptance Scenarios**:

1. **Given** an extension needs to check AI ignore status, **When** it executes the `confignore.isIgnoredForAI` command with a file path argument, **Then** it receives an accurate boolean indicating whether the file is ignored for AI agents
2. **Given** nested directories have different ignore patterns, **When** an extension checks a deeply nested file via the command, **Then** it correctly evaluates the combined patterns
3. **Given** no AI agent ignore patterns are configured, **When** an extension queries via the command, **Then** it receives `false` (not ignored)

---

### Edge Cases

- What happens when a file is ignored for AI agents but included in version control?
- How does the system handle symlinks and circular references in the ignore patterns?
- What is the behavior when AI agent ignore configuration is invalid or malformed during extension initialization?
- How should the system handle very large ignore pattern sets (hundreds or thousands of patterns)?
- What happens when ignore patterns use complex glob syntax that may be ambiguous?
- How should the system respond when agent-specific configuration files (e.g., `.claude/settings.json`) have parsing errors?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST extend the existing ignore configuration framework from feature 001 to support AI agent ignore type, reusing pattern parsing and evaluation infrastructure
- **FR-002**: System MUST support configuration of AI agent ignore patterns through VS Code workspace settings (`.vscode/settings.json`) as primary source, and MUST also detect and parse patterns from other AI agent configuration files (`.claude/settings.json`, GitHub Copilot settings, and similar agent-specific formats)
- **FR-003**: System MUST parse and evaluate glob patterns for AI agent ignores (supporting wildcards, negation, and directory-specific patterns)
- **FR-004**: Users MUST be able to define AI agent ignore patterns per project in workspace settings, and the system MUST respect patterns defined in AI agent-specific configuration files (read-only detection)
- **FR-005**: System MUST provide visual indicators in VS Code file explorer using badge overlays on file icons for files matching AI agent ignore patterns, consistent with VS Code's standard decoration conventions
- **FR-006**: System MUST expose a public VS Code command API (e.g., `confignore.isIgnoredForAI`) that other extensions can invoke to query whether a file is ignored for AI agents, returning accurate boolean results
- **FR-007**: System MUST support both positive patterns (files to exclude) and negation patterns (exceptions to exclusions)
- **FR-008**: System MUST handle relative paths correctly, resolving them against the workspace root
- **FR-009**: System MUST provide clear error messages when ignore patterns are invalid or malformed
- **FR-010**: System MUST evaluate AI agent ignore patterns independently from gitignore rules with no precedence relationship—a file can be ignored for AI but tracked in git (or vice versa) without conflict
- **FR-011**: System MUST cache ignore evaluation results to maintain performance with large pattern sets

### Key Entities

- **AI Ignore Pattern**: A glob pattern string that matches files/directories to exclude from AI agent context (stored in workspace settings or agent-specific config files)
- **AI Ignore Config**: The collection of all AI agent ignore patterns for a project, aggregated from VS Code workspace settings and detected agent-specific configuration files (`.claude/settings.json`, Copilot settings, etc.)
- **Ignore Status**: The result of evaluating whether a specific file path matches AI agent ignore patterns (ignored/not ignored)
- **Configuration Context**: VS Code workspace settings that store AI ignore patterns and preferences for AI agent ignore display

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can configure AI agent ignore patterns and have them recognized by the extension without errors
- **SC-002**: Visual indicators for AI-ignored files are visible in VS Code file explorer within 100ms of file tree rendering
- **SC-003**: Ignore status queries return results in under 50ms for individual file checks (even with 1000+ patterns)
- **SC-004**: 95% of AI agent ignore patterns match their intended targets correctly
- **SC-005**: Extension initialization time increases by less than 200ms when AI ignore support is enabled
- **SC-006**: Users can distinguish between regular ignores and AI-specific ignores through UI indicators or tooltips

## Assumptions

- AI agents referenced in this feature include: GitHub Copilot, GitHub Codex, ChatGPT (via OpenAI API), Claude, Google Gemini, and similar AI coding assistants
- This feature extends and integrates with the ignore configuration system established in feature 001-ignore-visibility-config
- Primary configuration is stored in VS Code workspace settings (`.vscode/settings.json`), with additional patterns detected from agent-specific config files
- Agent-specific configuration files include: `.claude/settings.json`, `.geminiignore`, GitHub Copilot settings (`.copilotignore`), and other standard AI agent ignore formats (requires research to identify all formats)
- The initial implementation uses glob pattern matching compatible with gitignore syntax but maintains independent evaluation from gitignore
- The feature complements existing gitignore functionality rather than replacing it
- Performance targets assume modern hardware (2+ GHz processor) with typical project sizes (under 100k files)

## Clarifications

### Session 2026-01-02

- Q: Configuration storage format: Where should AI agent ignore patterns be primarily stored? → A: VS Code workspace settings (`.vscode/settings.json`) PLUS detect and respect other AI agent configuration files (`.claude/settings.json`, `.geminiignore`, Copilot settings, and similar)
- Q: Visual indicator type: How should files ignored for AI agents be visually distinguished in the file explorer? → A: Badge overlays on file icons, consistent with other VS Code tagging conventions
- Q: API exposure method: How should other extensions query the AI agent ignore status? → A: Custom VS Code commands (e.g., `confignore.isIgnoredForAI`)
- Q: Conflict resolution strategy: When AI ignore patterns conflict with gitignore rules, which takes precedence? → A: Independent evaluation - AI ignore rules are completely separate from gitignore with no precedence relationship
- Q: Scope of integration with existing ignore system: How should this feature relate to feature 001's ignore configuration system? → A: Extend existing system - integrate with feature 001's ignore framework and add AI type to the existing model

## Open Questions

[To be addressed during clarification phase]
