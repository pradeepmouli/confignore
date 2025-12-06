/**
 * Core types for confignore extension
 */

import { Uri } from 'vscode';

/**
 * Enumeration of possible sources that can exclude/include files
 */
export enum Source {
	IgnoreFileGit = 'ignore-file-git',
	IgnoreFileDocker = 'ignore-file-docker',
	IgnoreFileEslint = 'ignore-file-eslint',
	IgnoreFilePrettier = 'ignore-file-prettier',
	IgnoreFileNpm = 'ignore-file-npm',
	IgnoreFileStylelint = 'ignore-file-stylelint',
	IgnoreFileVscode = 'ignore-file-vscode',
	ConfigTsconfig = 'config-tsconfig',
	ConfigEslint = 'config-eslint',
	ConfigPrettier = 'config-prettier'
}

/**
 * Represents the effective exclusion state of a selection
 */
export interface EffectiveState {
	/** The path being evaluated */
	path: Uri;
	/** Whether the path is excluded */
	excluded: boolean;
	/** Whether multi-selection has mixed states */
	mixed: boolean;
	/** Primary source determining the state, if any */
	source: Source | null;
	/** All sources that were checked */
	sourcesApplied: Source[];
}

/**
 * Configuration target for include/exclude operations
 */
export interface ConfigTarget {
	/** Type of config */
	type: Source;
	/** Path to config file */
	path: string;
	/** Whether this config supports include/exclude operations */
	supportsModification: boolean;
}
