/**
 * State resolver: compute EffectiveState for selections
 */

import * as path from 'path';
import { Uri, workspace } from 'vscode';
import { fileExists, readFile } from '../lib/fs';
import { getWorkspaceFolder, getWorkspaceRelativePath, matchPattern } from '../lib/patterns';
import { EffectiveState, Source } from '../models/types';
import { detectConfigTargetsFor, eslintExcludes, prettierExcludes, tsconfigExcludes } from './configTargets';

/**
 * Resolve effective state for a single URI
 */
export async function resolveState(uri: Uri): Promise<EffectiveState> {
	const workspaceFolder = getWorkspaceFolder(uri);
	if (!workspaceFolder) {
		// Not in workspace, not excluded
		return {
			path: uri,
			excluded: false,
			mixed: false,
			source: null,
			sourcesApplied: []
		};
	}

	const relativePath = getWorkspaceRelativePath(uri, workspaceFolder);
	if (!relativePath) {
		return {
			path: uri,
			excluded: false,
			mixed: false,
			source: null,
			sourcesApplied: []
		};
	}

	const sourcesApplied: Source[] = [];
	let excluded = false;
	let winningSource: Source | null = null;

	// Check sources in precedence order: config > ignore files > workspace settings
	const sources: Array<{ source: Source; check: () => Promise<boolean> }> = [
		// Config-based (highest precedence)
		{ source: Source.ConfigTsconfig, check: () => checkTsconfigExclusion(workspaceFolder.uri.fsPath, relativePath, uri) },
		{ source: Source.ConfigPrettier, check: () => checkPrettierExclusion(workspaceFolder.uri.fsPath, relativePath, uri) },
		{ source: Source.ConfigEslint, check: () => checkEslintExclusion(workspaceFolder.uri.fsPath, relativePath, uri) },

		// Ignore files (middle precedence)
		{ source: Source.IgnoreFileGit, check: () => checkIgnoreFile(workspaceFolder.uri.fsPath, '.gitignore', relativePath) },
		{ source: Source.IgnoreFileDocker, check: () => checkIgnoreFile(workspaceFolder.uri.fsPath, '.dockerignore', relativePath) },
		{ source: Source.IgnoreFileEslint, check: () => checkIgnoreFile(workspaceFolder.uri.fsPath, '.eslintignore', relativePath) },
		{ source: Source.IgnoreFilePrettier, check: () => checkIgnoreFile(workspaceFolder.uri.fsPath, '.prettierignore', relativePath) },
		{ source: Source.IgnoreFileNpm, check: () => checkIgnoreFile(workspaceFolder.uri.fsPath, '.npmignore', relativePath) },
		{ source: Source.IgnoreFileStylelint, check: () => checkIgnoreFile(workspaceFolder.uri.fsPath, '.stylelintignore', relativePath) },
		{ source: Source.IgnoreFileVscode, check: () => checkIgnoreFile(workspaceFolder.uri.fsPath, '.vscodeignore', relativePath) },

		// Workspace settings (lowest precedence) - stub for now
		{ source: Source.WorkspaceSettings, check: async () => false }
	];

	// Evaluate sources in order; first match wins
	for (const { source, check } of sources) {
		const matches = await check();
		if (matches) {
			sourcesApplied.push(source);
			if (!excluded) {
				excluded = true;
				winningSource = source;
			}
		}
	}

	return {
		path: uri,
		excluded,
		mixed: false,
		source: winningSource,
		sourcesApplied
	};
}

/**
 * Resolve states for multiple URIs and aggregate
 */
export async function resolveStates(uris: Uri[]): Promise<EffectiveState> {
	if (uris.length === 0) {
		return {
			path: Uri.file('/'),
			excluded: false,
			mixed: false,
			source: null,
			sourcesApplied: []
		};
	}

	if (uris.length === 1) {
		return resolveState(uris[0]);
	}

	// Multi-selection: resolve all and check for mixed state
	const states = await Promise.all(uris.map(resolveState));
	const excludedStates = states.filter(s => s.excluded);
	const notExcludedStates = states.filter(s => !s.excluded);

	const mixed = excludedStates.length > 0 && notExcludedStates.length > 0;

	// If all same state, use first state's source; if mixed, report as mixed
	if (mixed) {
		return {
			path: uris[0],
			excluded: excludedStates.length > notExcludedStates.length,
			mixed: true,
			source: null,
			sourcesApplied: []
		};
	}

	// All same state: return first but preserve aggregated info
	const first = states[0];
	const allSources = new Set<Source>();
	states.forEach(s => s.sourcesApplied.forEach(src => allSources.add(src)));

	return {
		...first,
		sourcesApplied: Array.from(allSources)
	};
}

/**
 * Check if path is excluded by an ignore file
 */
async function checkIgnoreFile(workspacePath: string, ignoreFileName: string, relativePath: string): Promise<boolean> {
	const ignoreFilePath = path.join(workspacePath, ignoreFileName);
	if (!await fileExists(ignoreFilePath)) {
		return false;
	}

	const content = await readFile(ignoreFilePath);
	const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

	for (const pattern of lines) {
		if (matchPattern(relativePath, pattern)) {
			return true;
		}
	}

	return false;
}

/**
 * Check if path is excluded by tsconfig.json
 */
async function checkTsconfigExclusion(workspacePath: string, relativePath: string, uri: Uri): Promise<boolean> {
	const targets = await detectConfigTargetsFor(uri);
	if (!targets?.tsconfig) return false;
	return tsconfigExcludes(targets.tsconfig, relativePath);
}

/**
 * Check if path is excluded by Prettier config
 * Stub for now; would check .prettierignore or config ignorePath
 */
async function checkPrettierExclusion(workspacePath: string, relativePath: string, uri: Uri): Promise<boolean> {
	const targets = await detectConfigTargetsFor(uri);
	if (!targets?.prettierConfig) return false;
	return prettierExcludes(targets.prettierConfig, relativePath);
}

/**
 * Check if path is excluded by ESLint config
 * Stub for now; would parse eslint config for ignorePatterns
 */
async function checkEslintExclusion(workspacePath: string, relativePath: string, uri: Uri): Promise<boolean> {
	const targets = await detectConfigTargetsFor(uri);
	if (!targets?.eslintConfig) return false;
	return eslintExcludes(targets.eslintConfig, relativePath);
}
