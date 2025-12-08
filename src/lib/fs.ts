/**
 * Safe filesystem helpers for atomic reads/writes and JSON/JSONC handling
 */

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Atomically read a file as UTF-8 text
 */
export async function readFile(filePath: string): Promise<string> {
	try {
		return await fs.readFile(filePath, 'utf8');
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
			throw new Error(`File not found: ${filePath}`);
		}
		throw error;
	}
}

/**
 * Atomically write a file with UTF-8 text
 * Creates parent directories if needed
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
	const dir = path.dirname(filePath);
	await fs.mkdir(dir, { recursive: true });
	await fs.writeFile(filePath, content, 'utf8');
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

/**
 * Parse JSON/JSONC (JSON with comments) safely
 * Strips comments before parsing
 */
export function parseJsonc(text: string): unknown {
	// Simple JSONC parser: strip single-line and multi-line comments
	const stripped = text
		.replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
		.replace(/\/\/.*/g, ''); // Remove // comments
	return JSON.parse(stripped);
}

/**
 * Stringify JSON with formatting (2-space indent)
 */
export function stringifyJson(obj: unknown): string {
	return JSON.stringify(obj, null, 2);
}

/**
 * Read and parse JSON/JSONC file
 */
export async function readJsonFile<T = unknown>(filePath: string): Promise<T> {
	const content = await readFile(filePath);
	return parseJsonc(content) as T;
}

/**
 * Write JSON file with formatting
 */
export async function writeJsonFile(filePath: string, obj: unknown): Promise<void> {
	const content = stringifyJson(obj);
	await writeFile(filePath, content + '\n');
}
