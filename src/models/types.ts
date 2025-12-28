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
	WorkspaceSettings = 'workspace:settings'
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
