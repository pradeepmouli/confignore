/**
 * Core types for ignore visibility and config updates feature
 */

import { Uri } from 'vscode';

/**
 * Source types that can exclude/include paths, ordered by precedence
 */
export enum Source {
  // Config-based (highest precedence)
  ConfigTsconfig = 'config:tsconfig',
  ConfigPrettier = 'config:prettier',
  ConfigEslint = 'config:eslint',

  // Ignore files (middle precedence)
  IgnoreFileGit = 'ignore:.gitignore',
  IgnoreFileDocker = 'ignore:.dockerignore',
  IgnoreFileEslint = 'ignore:.eslintignore',
  IgnoreFilePrettier = 'ignore:.prettierignore',
  IgnoreFileNpm = 'ignore:.npmignore',
  IgnoreFileStylelint = 'ignore:.stylelintignore',
  IgnoreFileVscode = 'ignore:.vscodeignore',

  // Workspace settings (lowest precedence)
  WorkspaceSettings = 'workspace:settings',

  // AI ignore sources
  WorkspaceSettingsAiIgnore = 'workspace:aiIgnore',
  AgentConfigClaude = 'agent:.claude/settings.json',
  AgentConfigGemini = 'agent:.aiexclude',
  AgentConfigCustom = 'agent:custom'
}

/**
 * Supported ignore types across features
 */
export enum IgnoreType {
  Git = 'git',
  Docker = 'docker',
  Eslint = 'eslint',
  Prettier = 'prettier',
  Npm = 'npm',
  Stylelint = 'stylelint',
  Vscode = 'vscode',
  Tsconfig = 'tsconfig',
  Ai = 'ai'
}

/**
 * AI ignore pattern alias
 */
export type AiIgnorePattern = string;

/**
 * AI ignore source provenance
 */
export interface AiIgnoreSource {
  source:
    | Source.WorkspaceSettingsAiIgnore
    | Source.AgentConfigClaude
    | Source.AgentConfigGemini
    | Source.AgentConfigCustom;
  patterns: AiIgnorePattern[];
  filePath?: string;
  errors?: string[];
}

/**
 * Validation result for a single AI ignore pattern
 */
export interface PatternValidation {
  valid: boolean;
  pattern: string;
  errors?: string[];
}

/**
 * Aggregated AI ignore configuration
 */
export interface AiIgnoreConfig {
  workspaceUri: Uri;
  patterns: AiIgnorePattern[];
  sources: AiIgnoreSource[];
  lastUpdated: Date;
  isValid: boolean;
  validationErrors?: string[];
}

/**
 * Evaluation result for a single file against AI ignore patterns
 */
export interface AiIgnoreStatus {
  uri: Uri;
  isIgnored: boolean;
  matchedPatterns?: AiIgnorePattern[];
  source?: AiIgnoreSource;
  evaluatedAt: Date;
  cacheKey?: string;
}

/**
 * Result of discovering and parsing agent config files
 */
export interface AgentConfigDetectionResult {
  workspaceUri: Uri;
  detectedConfigs: AgentConfigFile[];
  totalPatterns: number;
  parseErrors: AgentConfigError[];
}

export interface AgentConfigFile {
  agentName: 'claude' | 'gemini' | 'custom';
  configPath: string;
  patterns: AiIgnorePattern[];
  format: 'json' | 'gitignore-style';
  parseStatus: 'success' | 'partial' | 'failed';
  lastModified: Date;
}

export interface AgentConfigError {
  configPath: string;
  errorType: 'parse' | 'validation' | 'permission' | 'not_found';
  message: string;
  lineNumber?: number;
}

/**
 * Effective state of a selection (file/folder) across all sources
 */
export interface EffectiveState {
  /** Path or URI of the selection */
  path: Uri;

  /** True if selection is effectively excluded by any source */
  excluded: boolean;

  /** True for multi-selection with mixed states */
  mixed: boolean;

  /** Winning source that determined the state (null if not excluded) */
  source: Source | null;

  /** All sources that matched this selection (for diagnostics) */
  sourcesApplied: Source[];

  /** True if include-state was evaluated (feature flag enabled) */
  includeStateComputed?: boolean;

  /** True if selection is ignored for AI agents */
  aiIgnored?: boolean;

  /** AI source that matched the selection */
  aiIgnoreSource?: Source;

  /** Patterns that matched the selection for AI ignore */
  aiIgnoreReasons?: AiIgnorePattern[];
}

/**
 * Config target type
 */
export type ConfigTargetType = 'tsconfig' | 'prettier' | 'eslint';

/**
 * Config shape for tsconfig.json
 */
export interface TsconfigShape {
  include?: string[];
  exclude?: string[];
  [key: string]: unknown;
}

/**
 * Config shape for Prettier
 */
export interface PrettierShape {
  ignorePath?: string;
  [key: string]: unknown;
}

/**
 * Config shape for ESLint
 */
export interface EslintShape {
  ignorePatterns?: (string | object)[];
  [key: string]: unknown;
}

/**
 * Union of all config shapes
 */
export type ConfigShape = TsconfigShape | PrettierShape | EslintShape;

/**
 * Config target abstraction for reading/writing project configs
 */
export interface ConfigTarget {
  type: ConfigTargetType;
  filePath: string;
  exists: boolean;
  read(): Promise<ConfigShape>;
  write(update: (c: ConfigShape) => ConfigShape): Promise<void>;
}
