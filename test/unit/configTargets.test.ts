/**
 * Unit tests for configTargets
 */

import * as assert from 'assert';
import * as path from 'path';
import { Uri, workspace } from 'vscode';
import { eslintExcludes, prettierExcludes, tsconfigExcludes } from '../../src/services/configTargets';

suite('ConfigTargets Unit Tests', () => {
	test('tsconfigExcludes returns false for nonexistent file', async () => {
		const result = await tsconfigExcludes('/nonexistent/tsconfig.json', 'src/test.ts');
		assert.strictEqual(result, false);
	});

	test('eslintExcludes returns false for nonexistent file', async () => {
		const result = await eslintExcludes('/nonexistent/.eslintrc.json', 'src/test.ts');
		assert.strictEqual(result, false);
	});

	test('prettierExcludes returns false for nonexistent file', async () => {
		const result = await prettierExcludes('/nonexistent/.prettierrc', 'src/test.ts');
		assert.strictEqual(result, false);
	});

	// Integration tests with actual workspace config files would go in test/integration
});
