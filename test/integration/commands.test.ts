/**
 * Integration tests for commands
 */

import * as assert from 'assert';
import { commands } from 'vscode';

suite('Commands Integration Tests', () => {
	test('confignore.include command is registered', async () => {
		const allCommands = await commands.getCommands();
		assert.ok(allCommands.includes('confignore.include'), 'include command should be registered');
	});

	test('confignore.addToIgnore.tsconfig command is registered', async () => {
		const allCommands = await commands.getCommands();
		assert.ok(allCommands.includes('confignore.addToIgnore.tsconfig'), 'tsconfig command should be registered');
	});

	// Functional command tests with workspace fixtures would go here
	// For example: create temp workspace, add tsconfig, invoke command, verify exclusion
});
