# Agent Instructions

This document provides guidelines and instructions for AI coding agents working with this TypeScript project. These instructions are designed to work with multiple agents including GitHub Copilot, Claude Code, Gemini Code Assist, and Codex.

## Project Overview

This is a **VS Code extension** (TypeScript) that extends the Ignore Visibility Config (feature 001) to support ignoring files specifically for AI agents (Claude, GitHub Copilot, OpenAI Codex, Google Gemini). The extension provides pattern configuration, visual indicators (badges), and a public command API for other extensions to query AI ignore status.

**Key Dependencies**: Feature 001 (pattern matching infrastructure, context keys, UI framework) | VS Code API 1.105.0+ | minimatch

**Workflows**: Uses SpecKit discipline for all feature work (spec → clarify → plan → tasks → implement)

## Workflow & Tooling Preferences

### Version Control

- Use git for version control
- Follow gitflow branching strategy
- Use semantic versioning for version management
- Use conventional commits for commit messages (format: `type(scope): description`)
- Add a pre-commit hook for running formatters

### Project Management

- Use GitHub Issues for tracking bugs and features
- Use Pull Request templates for consistent PR descriptions
- Set up GitHub Actions for CI/CD pipelines

### CI/CD Guidelines

- Include formatting, linting, testing and build steps in the CI pipeline
- Automate deployment to npm registry on release tags
- Tag releases automatically based on package.json versions
- For multi-package repos, use format `<package-name>-v<version>` for tags
- Mark releases with pre-release identifiers as pre-releases in GitHub

## Coding Style Guidelines

### Naming Conventions

- Use **camelCase** for JavaScript/TypeScript variable and function names
- Use **PascalCase** for:
  - React component names
  - Classes, types, enums, and interfaces
  - File and folder names (except scripts)
- Use **kebab-case** for script files that are not modules (e.g., build scripts, code generation scripts)
- Use **#** syntax (ES2022) for private class fields and methods

### Code Formatting

- Use 2 tab spaces for indentation
- Use semicolons at the end of statements
- Use single quotes for strings
- Do not use trailing commas in object and array literals

### Configuration Files

Ensure configuration files (oxfmt, oxlint) align with these style guidelines. Oxlint is the **exclusive linter** for this project (no ESLint). If conflicts arise between oxlint rules and style preferences, ask for confirmation before updating.

## Coding Standards

### TypeScript Best Practices

- Use decorators for logging, caching, validation (wire to preferred utilities: pino, zod)
- Use mixins where appropriate to share functionality between classes
- Use generics liberally for reusable components and functions
- Use type aliases for union and intersection types
- Use explicit return types for functions
- Avoid using `any` type
- Use enums for defining a set of named constants
- Use interfaces for defining object shapes

### VS Code Extension Specifics

- Use VS Code API (vscode module) for all editor interactions
- Register commands with unique prefixes (e.g., `confignore.isIgnoredForAI`)
- Use FileSystemWatcher for config file changes (with proper cleanup)
- Implement FileDecorationProvider for badge/icon overlays
- Use context keys for conditional UI visibility (@vscode.view.item.context values)
- Provide clear error messages via window.showErrorMessage or OutputChannel
- Support multi-root workspaces (workspace.workspaceFolders API)
- Follow VS Code decoration composition rules (avoid conflicts with SCM/linter decorations)
- Use @vscode/test-electron for integration tests; mocha 10+ as test framework
- Validate glob patterns with strict error feedback (input validation gate)

### Modern JavaScript/TypeScript Patterns

- Use async/await syntax for asynchronous operations (prefer over Promises)
- Promisify all functions that perform asynchronous operations where possible
- Use strict equality (`===` and `!==`) instead of loose equality
- Use arrow functions for callbacks and functional components
- Use template literals for string concatenation
- Use try/catch blocks for error handling in async functions
- Use destructuring assignment for objects and arrays
- Use spread/rest operators for copying and merging objects/arrays

### Documentation

- Use JSDoc comments for documenting functions and classes public APIs
- **Only document public APIs** - do not document private methods/internal implementation
- If unclear whether something is public API, ask the user

### Testing

- Write unit tests for all public APIs using vitest
- Aim for high code coverage
- Write integration tests for critical workflows and components
- Only write unit tests for public APIs

### Architecture

- Use dependency injection for managing dependencies
- Use decorators to define injectable classes and services
- Extend feature 001 infrastructure (reuse pattern matching, context keys, file I/O utilities)
- Implement two-tier caching for pattern evaluation (file-level + workspace-level) to meet <50ms performance targets
- Use graceful degradation for malformed configs (log warnings, skip invalid sources, continue with others)
- Follow oxlint rules for code quality (exclusive linter)

## Preferred Technologies

**Always use the latest stable versions** of all libraries and frameworks unless otherwise specified. Prefer versions tagged as "latest" in the npm registry.

### Technology Stack

| Use Case                           | Technology                               | Notes                                       |
| ---------------------------------- | ---------------------------------------- | ------------------------------------------- |
| Language                           | TypeScript 5.9+                          | strict mode, ES2022 target                  |
| Runtime                            | VS Code 1.105.0+                         | Extension API (extension host)              |
| Package Management                 | pnpm                                     | semantic versioning, lock file              |
| Web Development                    | N/A                                      | This is a VS Code extension, not web        |
| HTTP/REST APIs                     | Axios                                    | for external API calls if needed            |
| Backend Development                | N/A                                      | Not applicable to this extension            |
| Testing (JavaScript/TypeScript)    | vitest                                   |                                             |
| Linting (JavaScript/TypeScript)    | oxlint 1.36+ (exclusive)                 | no ESLint; all code quality via oxlint      |
| Formatting (JavaScript/TypeScript) | oxfmt 0.21+                              | multi-language (TS, JSON, TOML)             |
| String Manipulation                | Native methods or sindresorhus utilities |                                             |
| Environment Variables              | dotenvx and dotenvx/expand               | for local dev config                        |
| Schema/Runtime Type Validation     | Zod                                      | for config validation                       |
| Script Automation & Task Running   | tsx                                      | for build/dev scripts                       |
| Logging                            | pino                                     | structured logging to OutputChannel         |
| Advanced Type Manipulation         | type-fest                                | complex type utilities                      |
| Utility Functions                  | sindresorhus collection                  | reusable utilities                          |
| Documentation Generation           | TypeDoc                                  | API documentation                           |
| API Documentation                  | OpenAPI/Swagger                          | if exposing HTTP APIs (not applicable here) |
| Error Handling                     | Custom error classes with pino logging   | structured error context                    |

## Configuration Preferences

- Prefer environment variables for sensitive configuration data
- Use `.env` files for local development (with dotenvx)
- Never commit sensitive data to version control

## Output Guidelines

### Code Generation

- Include comments explaining complex logic
- Follow the coding style guidelines above
- Ensure type safety with TypeScript

### Commit Messages

- Follow Conventional Commits specification
- Format: `type(scope): description`
- Types: feat, fix, docs, style, refactor, test, chore
- Example: `feat(auth): add JWT authentication`

## Knowledge Base & Context

### Up-to-Date Information

- Use Context7 via the MCP server to get up-to-date information on libraries and frameworks
- Refer to official documentation for best practices and advanced usage
- Use GitHub repos and websites to find additional context when prompted

### MCP Configuration

This project is configured with Model Context Protocol (MCP) servers for enhanced agent capabilities:

- **Context7**: Provides up-to-date library documentation and examples
- **MarkItDown**: Converts documents to Markdown for easy ingestion
- **Codemod**: Supports AST-driven refactors via codemod@latest mcp adapter

### Codemod Usage Guidelines

- Use codemod for repetitive, mechanical refactors (API renames, import moves, prop renames, consistent options).
- Prefer reading definitions/usages first; avoid codemod on ambiguous or dynamically typed areas.
- Start with a narrow scope pattern; run on smallest affected path first, review diff, then widen.
- Keep changes incremental: one behavioral change per codemod; add or update tests alongside.
- If codemod output is uncertain, fall back to manual edits or tighten the pattern.

## Agent-Specific Notes

### For All Agents

- Ask for clarification when requirements are ambiguous
- Propose solutions that align with the preferred technologies above
- Consider maintainability and scalability in all suggestions
- Follow the principle of least surprise in API design

### When Generating New Code

1. Check existing code patterns in the project first
2. Follow the naming conventions and style guidelines
3. Add appropriate type annotations
4. Include JSDoc comments for public APIs
5. Consider writing tests alongside the implementation

### When Modifying Existing Code

1. Understand the context and purpose of existing code
2. Maintain consistency with existing patterns
3. Update tests if behavior changes
4. Update documentation if public APIs change
5. Consider backward compatibility

## SpecKit Workflows

All feature work follows SpecKit discipline (see constitution.md):

1. **Feature Development** (`/specify`): New features require spec → clarify → plan → tasks → implement
2. **Bugfix** (`/speckit.bugfix`): Regression test BEFORE fix
3. **Enhancement** (`/speckit.enhance`): For simple single-phase improvements
4. **Modification** (`/speckit.modify`): For changes to existing features (like extending feature 001)
5. **Refactoring** (`/speckit.refactor`): With baseline metrics and incremental validation
6. **Hotfix** (`/speckit.hotfix`): For P0/P1 issues; tests deferred but required within 48h

**Current Feature**: 002-ai-agent-ignore (use feature development workflow)

- Spec: specs/002-ai-agent-ignore/spec.md
- Plan: specs/002-ai-agent-ignore/plan.md
- Tasks: specs/002-ai-agent-ignore/tasks.md (generated)
- Research: specs/002-ai-agent-ignore/research.md
- Data Model: specs/002-ai-agent-ignore/data-model.md
- Contracts: specs/002-ai-agent-ignore/contracts/extension-commands.md

## Constitution Alignment

This repository is governed by [`.specify/memory/constitution.md`](.specify/memory/constitution.md) (v1.3.0). Key constraints:

- **Exclusive Linter**: oxlint 1.36+ (no ESLint)
- **Exclusive Formatter**: oxfmt 0.21+ (no prettier)
- **Testing Framework**: vitest
- **Type Checker**: TypeScript 5.9+ strict mode (tsc --noEmit for CI)
- **CI/CD**: GitHub Actions (formatting, linting, typecheck, test, build gates)
- **Package Manager**: pnpm with semantic versioning
- **Branching**: gitflow (feature/_, bugfix/_)
- **Commits**: Conventional Commits (type(scope): description)
- **Release**: Auto-tagged based on package.json version; pre-releases marked in GitHub

---

## Development Pattern Reference

## SpecKit Workflows

### File Naming

- Services: `PascalCase.ts` (e.g., `AiIgnoreResolver.ts`, `AgentConfigDetector.ts`)
- Utilities/Libraries: `PascalCase.ts` (e.g., `PatternValidator.ts`)
- Tests: `*.test.ts` (e.g., `aiIgnoreResolver.test.ts`)
- Scripts: `kebab-case.ts` (e.g., `generate-config.ts`)
- No React components (VS Code extension, not web app)

### Import Organization

1. External dependencies (from node_modules)
2. Internal modules (absolute imports)
3. Relative imports
4. Type imports (if not inline)

### Error Handling Pattern

```typescript
import * as vscode from 'vscode';
import { logger } from './logger'; // pino logger instance

try {
  // Operation
} catch (error) {
  // Log error with context
  logger.error('Operation failed', { error, context });
  // Display to user
  vscode.window.showErrorMessage('Operation failed');
  // Re-throw for caller to handle
  throw new CustomError('Friendly message', { cause: error });
}
```

### VS Code Command Handler Pattern

```typescript
import * as vscode from 'vscode';
import { AiIgnoreResolver } from './services/aiIgnoreResolver';

// Register in extension.ts activation
export function activate(context: vscode.ExtensionContext) {
  const resolver = new AiIgnoreResolver();

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'confignore.isIgnoredForAI',
      async (fileUri: vscode.Uri): Promise<boolean> => {
        try {
          return await resolver.isIgnoredForAI(fileUri);
        } catch (error) {
          logger.error('isIgnoredForAI failed', { fileUri, error });
          throw new Error('Failed to check AI ignore status');
        }
      }
    )
  );
}
```

---

_Last Updated: December 21, 2025_
