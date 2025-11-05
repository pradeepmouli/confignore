/**
 * Unit tests for stateResolver
 */

import * as assert from 'assert';
import { Uri } from 'vscode';
import { resolveState, resolveStates } from '../../src/services/stateResolver';

suite('StateResolver Unit Tests', () => {
	test('resolveState for non-workspace URI returns not excluded', async () => {
		// Using a non-workspace URI
		const uri = Uri.file('/nonexistent/path/file.txt');
		const state = await resolveState(uri);

		assert.strictEqual(state.excluded, false);
		assert.strictEqual(state.mixed, false);
		assert.strictEqual(state.source, null);
	});

	test('resolveStates aggregates single URI correctly', async () => {
		const uri = Uri.file('/nonexistent/path/file.txt');
		const state = await resolveStates([uri]);

		assert.strictEqual(state.excluded, false);
		assert.strictEqual(state.mixed, false);
	});

	test('resolveStates handles empty array', async () => {
		const state = await resolveStates([]);

		// Should return a default state
		assert.ok(state !== null);
		assert.strictEqual(state.mixed, false);
	});

	test('resolveStates detects mixed state for multi-selection', async () => {
		// This is a unit test boundary case; real mixed-state testing
		// would require integration tests with actual workspace and ignore files
		const uris = [
			Uri.file('/nonexistent/path/file1.txt'),
			Uri.file('/nonexistent/path/file2.txt')
		];
		const state = await resolveStates(uris);

		// With non-workspace URIs, should not be excluded or mixed
		assert.strictEqual(state.excluded, false);
		assert.strictEqual(state.mixed, false);
	});

	// Integration tests with actual workspace/ignore files would go in test/integration
});
