/**
 * Service for reading/writing config-based exclusions
 */

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Check if a path is excluded by tsconfig.json
 * @param tsconfigPath Path to tsconfig.json
 * @param targetPath Path to check for exclusion
 * @returns true if excluded, false otherwise
 * 
 * NOTE: This is a simplified implementation that needs enhancement:
 * - Proper glob pattern matching (e.g., "**\/*.test.ts")
 * - Support for negation patterns (!)
 * - Handle tsconfig extends and references
 */
export async function tsconfigExcludes(tsconfigPath: string, targetPath: string): Promise<boolean> {
	try {
		const content = await fs.readFile(tsconfigPath, 'utf-8');
		const config = JSON.parse(content);
		
		if (!config.exclude || !Array.isArray(config.exclude)) {
			return false;
		}
		
		// Simple path matching - just check if targetPath starts with pattern
		// TODO: Implement proper glob matching for patterns like "**\/*.test.ts"
		const relativePath = path.relative(path.dirname(tsconfigPath), targetPath);
		return config.exclude.some((pattern: string) => relativePath.startsWith(pattern));
	} catch {
		return false;
	}
}

/**
 * Check if a path is excluded by ESLint config
 * @param eslintConfigPath Path to ESLint config
 * @param targetPath Path to check for exclusion
 * @returns true if excluded, false otherwise
 */
export async function eslintExcludes(eslintConfigPath: string, targetPath: string): Promise<boolean> {
	try {
		const content = await fs.readFile(eslintConfigPath, 'utf-8');
		const config = JSON.parse(content);
		
		if (!config.ignorePatterns || !Array.isArray(config.ignorePatterns)) {
			return false;
		}
		
		const relativePath = path.relative(path.dirname(eslintConfigPath), targetPath);
		return config.ignorePatterns.some((pattern: string) => relativePath.startsWith(pattern));
	} catch {
		return false;
	}
}

/**
 * Check if a path is excluded by Prettier config
 * @param prettierConfigPath Path to Prettier config
 * @param targetPath Path to check for exclusion
 * @returns true if excluded, false otherwise
 */
export async function prettierExcludes(prettierConfigPath: string, targetPath: string): Promise<boolean> {
	try {
		const content = await fs.readFile(prettierConfigPath, 'utf-8');
		const config = JSON.parse(content);
		
		// Prettier uses ignorePath or overrides with excluded files
		if (config.overrides && Array.isArray(config.overrides)) {
			const relativePath = path.relative(path.dirname(prettierConfigPath), targetPath);
			for (const override of config.overrides) {
				if (override.excludeFiles && Array.isArray(override.excludeFiles)) {
					if (override.excludeFiles.some((pattern: string) => relativePath.startsWith(pattern))) {
						return true;
					}
				}
			}
		}
		
		return false;
	} catch {
		return false;
	}
}
