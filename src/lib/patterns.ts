/**
 * Path and pattern matching utilities
 */

import * as path from 'path';
import { Uri, workspace, WorkspaceFolder } from 'vscode';

/**
 * Get workspace folder for a given URI
 */
export function getWorkspaceFolder(uri: Uri): WorkspaceFolder | undefined {
	return workspace.getWorkspaceFolder(uri);
}

/**
 * Get workspace-relative path for a URI
 * Returns undefined if URI is not within any workspace folder
 */
export function getWorkspaceRelativePath(uri: Uri, workspaceFolder?: WorkspaceFolder): string | undefined {
	const folder = workspaceFolder ?? getWorkspaceFolder(uri);
	if (!folder) {
		return undefined;
	}
	return path.relative(folder.uri.fsPath, uri.fsPath);
}

/**
 * Normalize a path for use in ignore patterns
 * Converts backslashes to forward slashes, removes leading ./
 */
export function normalizePath(p: string): string {
	return p.replace(/\\/g, '/').replace(/^\.\//, '');
}

/**
 * Convert URI to normalized workspace-relative path suitable for ignore patterns
 */
export function uriToIgnorePattern(uri: Uri, workspaceFolder?: WorkspaceFolder): string | undefined {
	const relativePath = getWorkspaceRelativePath(uri, workspaceFolder);
	if (!relativePath) {
		return undefined;
	}
	return normalizePath(relativePath);
}

/**
 * Simple glob-like pattern matching (basic * and ** support)
 * Returns true if path matches pattern
 * Handles negation patterns (starting with !)
 */
export function matchPattern(filePath: string, pattern: string): boolean {
	const normalizedPath = normalizePath(filePath);
	const normalizedPattern = normalizePath(pattern);

	// Handle negation patterns
	if (normalizedPattern.startsWith('!')) {
		return !matchPattern(normalizedPath, normalizedPattern.slice(1));
	}

	// Convert glob pattern to regex
	const regexPattern = normalizedPattern
		.replace(/\./g, '\\.') // Escape dots
		.replace(/\*\*/g, '___DOUBLESTAR___') // Placeholder for **
		.replace(/\*/g, '[^/]*') // * matches within a segment
		.replace(/___DOUBLESTAR___/g, '.*') // ** matches any path segment
		.replace(/\?/g, '.'); // ? matches single char

	const regex = new RegExp(`^${regexPattern}$`);
	const exactMatch = regex.test(normalizedPath);

	// Also check if pattern matches parent directory (for nested exclusions)
	// e.g., "dist/**" should match "dist/foo/bar.js"
	if (!exactMatch && normalizedPattern.includes('**')) {
		const parentPattern = normalizedPattern.replace(/\/?\*\*\/?\*?$/, '');
		if (parentPattern && normalizedPath.startsWith(parentPattern + '/')) {
			return true;
		}
	}

	return exactMatch;
}
