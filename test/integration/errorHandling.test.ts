/**
 * Integration-style tests for AI ignore error handling.
 */

import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import { AiIgnoreResolver } from '../../src/services/aiIgnoreResolver';
import { AiIgnoreCache } from '../../src/services/aiIgnoreCache';

describe('AI ignore error handling (integration)', () => {
	const originalFs = { ...vscode.workspace.fs } as vscode.FileSystem;
	const originalGetWorkspaceFolder = vscode.workspace.getWorkspaceFolder;
	const originalShowErrorMessage = vscode.window.showErrorMessage;

	afterEach(() => {
		(vscode.workspace as any).fs = originalFs;
		(vscode.workspace as any).getWorkspaceFolder = originalGetWorkspaceFolder;
		(vscode.window as any).showErrorMessage = originalShowErrorMessage;
	});

	it('notifies when settings schema cannot be parsed', async () => {
		const workspaceUri = vscode.Uri.file(path.join('/tmp', 'ai-ignore-error-ws'));
		const workspaceFolder: vscode.WorkspaceFolder = { uri: workspaceUri, name: 'ws', index: 0 };
		(vscode.workspace as any).getWorkspaceFolder = (uri: vscode.Uri) => {
			return uri.fsPath.startsWith(workspaceFolder.uri.fsPath) ? workspaceFolder : undefined;
		};

		// Stub workspace.fs to surface invalid JSON
		(vscode.workspace as any).fs = {
			...originalFs,
			stat: async () => ({}) as any,
			readFile: async () => Buffer.from('{ invalid json')
		};

		const notifications: string[] = [];
		(vscode.window as any).showErrorMessage = (message: string) => {
			notifications.push(message);
			return Promise.resolve(undefined);
		};

		const resolver = new AiIgnoreResolver(new AiIgnoreCache());
		const config = await resolver.parseAiIgnoreConfig(workspaceUri);

		assert.strictEqual(config.isValid, false);
		assert.ok(notifications.length > 0);
		assert.ok(notifications[0].includes('Failed to parse settings'));
	});
});
