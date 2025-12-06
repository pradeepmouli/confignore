/**
 * Service for resolving effective exclusion state of paths
 */

import { Uri, workspace } from 'vscode';
import { EffectiveState } from '../models/types';

/**
 * Resolve the effective state for a single URI
 * @param uri The URI to check
 * @returns The effective state
 * 
 * NOTE: This is a minimal implementation. Full implementation needs to:
 * - Check all ignore files (.gitignore, .dockerignore, etc.)
 * - Check config-based exclusions (tsconfig.json, .eslintrc.json, etc.)
 * - Apply precedence rules (config > ignore files > workspace settings)
 * - Handle glob patterns and negation patterns
 */
export async function resolveState(uri: Uri): Promise<EffectiveState> {
	const workspaceFolder = workspace.getWorkspaceFolder(uri);
	
	// For non-workspace URIs, return not excluded
	if (!workspaceFolder) {
		return {
			path: uri,
			excluded: false,
			mixed: false,
			source: null,
			sourcesApplied: []
		};
	}
	
	// TODO: Implement actual state resolution by checking ignore files and configs
	// This is the core of the smart menu visibility feature that needs to be completed
	// For now, return a default state
	return {
		path: uri,
		excluded: false,
		mixed: false,
		source: null,
		sourcesApplied: []
	};
}

/**
 * Resolve the aggregate state for multiple URIs
 * @param uris Array of URIs to check
 * @returns The aggregate state
 */
export async function resolveStates(uris: Uri[]): Promise<EffectiveState> {
	if (uris.length === 0) {
		return {
			path: Uri.file(''),
			excluded: false,
			mixed: false,
			source: null,
			sourcesApplied: []
		};
	}
	
	if (uris.length === 1) {
		return resolveState(uris[0]);
	}
	
	// For multiple URIs, resolve each and check for mixed state
	const states = await Promise.all(uris.map(uri => resolveState(uri)));
	
	const allExcluded = states.every(s => s.excluded);
	const anyExcluded = states.some(s => s.excluded);
	const mixed = anyExcluded && !allExcluded;
	
	// Use the first URI as representative
	return {
		path: uris[0],
		excluded: allExcluded,
		mixed,
		source: states[0].source,
		sourcesApplied: states[0].sourcesApplied
	};
}
