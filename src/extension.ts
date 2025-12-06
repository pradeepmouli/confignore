/**
 * Confignore VS Code Extension
 * Add files and folders to ignore files via context menu
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { resolveState, resolveStates } from './services/stateResolver';
import { updateContextKeys, clearContextKeys } from './services/contextKeys';

let outputChannel: vscode.OutputChannel;

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext) {
	outputChannel = vscode.window.createOutputChannel('confignore');
	outputChannel.appendLine('Confignore extension activated');

	// Register configuration change listener for feature flag
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('confignore.enableSmartMenuVisibility')) {
				const enabled = getSmartMenuVisibilityEnabled();
				outputChannel.appendLine(`Smart menu visibility feature flag changed: ${enabled}`);
				if (!enabled) {
					// Clear context keys when feature is disabled
					clearContextKeys().catch(err => {
						outputChannel.appendLine(`Error clearing context keys: ${err}`);
					});
				}
			}
		})
	);

	// Listen for selection changes to update context keys (if feature enabled)
	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(async () => {
			await updateContextKeysIfEnabled();
		})
	);

	// Register commands
	context.subscriptions.push(
		vscode.commands.registerCommand('confignore.addToIgnore.quickPick', addToIgnoreQuickPick),
		vscode.commands.registerCommand('confignore.addToIgnore.git', () => addToIgnoreFile('.gitignore')),
		vscode.commands.registerCommand('confignore.addToIgnore.docker', () => addToIgnoreFile('.dockerignore')),
		vscode.commands.registerCommand('confignore.addToIgnore.eslint', () => addToIgnoreFile('.eslintignore')),
		vscode.commands.registerCommand('confignore.addToIgnore.prettier', () => addToIgnoreFile('.prettierignore')),
		vscode.commands.registerCommand('confignore.addToIgnore.npm', () => addToIgnoreFile('.npmignore')),
		vscode.commands.registerCommand('confignore.addToIgnore.stylelint', () => addToIgnoreFile('.stylelintignore')),
		vscode.commands.registerCommand('confignore.addToIgnore.vscode', () => addToIgnoreFile('.vscodeignore')),
		vscode.commands.registerCommand('confignore.addToIgnore.tsconfig', addToTsconfigExclude),
		vscode.commands.registerCommand('confignore.include', includeCommand)
	);

	// Detect available targets and set context keys
	updateAvailableTargets();
	
	// Watch for workspace changes
	const watcher = vscode.workspace.createFileSystemWatcher('**/{.gitignore,.dockerignore,.eslintignore,.prettierignore,.npmignore,.stylelintignore,.vscodeignore,tsconfig.json}');
	watcher.onDidCreate(() => updateAvailableTargets());
	watcher.onDidDelete(() => updateAvailableTargets());
	context.subscriptions.push(watcher);
}

/**
 * Check if smart menu visibility feature is enabled
 */
function getSmartMenuVisibilityEnabled(): boolean {
	const config = vscode.workspace.getConfiguration('confignore');
	// Default to false since it's currently buggy
	return config.get<boolean>('enableSmartMenuVisibility', false);
}

/**
 * Update context keys if smart menu visibility is enabled
 */
async function updateContextKeysIfEnabled(): Promise<void> {
	if (!getSmartMenuVisibilityEnabled()) {
		return;
	}

	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		await clearContextKeys();
		return;
	}

	try {
		const state = await resolveState(editor.document.uri);
		await updateContextKeys(state);
		outputChannel.appendLine(`Updated context keys for ${editor.document.uri.fsPath}: excluded=${state.excluded}`);
	} catch (err) {
		outputChannel.appendLine(`Error updating context keys: ${err}`);
	}
}

/**
 * Update context keys for available targets
 */
async function updateAvailableTargets(): Promise<void> {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders) {
		return;
	}

	for (const folder of workspaceFolders) {
		const targets = [
			{ name: 'Git', file: '.gitignore', key: 'confignore.hasGit' },
			{ name: 'Docker', file: '.dockerignore', key: 'confignore.hasDocker' },
			{ name: 'ESLint', file: '.eslintignore', key: 'confignore.hasEslint' },
			{ name: 'Prettier', file: '.prettierignore', key: 'confignore.hasPrettier' },
			{ name: 'NPM', file: '.npmignore', key: 'confignore.hasNpm' },
			{ name: 'Stylelint', file: '.stylelintignore', key: 'confignore.hasStylelint' },
			{ name: 'VSCode', file: '.vscodeignore', key: 'confignore.hasVscode' },
			{ name: 'TSConfig', file: 'tsconfig.json', key: 'confignore.hasTsconfig' }
		];

		for (const target of targets) {
			const filePath = path.join(folder.uri.fsPath, target.file);
			try {
				await fs.access(filePath);
				await vscode.commands.executeCommand('setContext', target.key, true);
			} catch {
				await vscode.commands.executeCommand('setContext', target.key, false);
			}
		}
	}
}

/**
 * Quick pick to select which ignore file to add to
 */
async function addToIgnoreQuickPick(uri?: vscode.Uri): Promise<void> {
	const items = [
		{ label: 'git (.gitignore)', file: '.gitignore' },
		{ label: 'docker (.dockerignore)', file: '.dockerignore' },
		{ label: 'eslint (.eslintignore)', file: '.eslintignore' },
		{ label: 'prettier (.prettierignore)', file: '.prettierignore' },
		{ label: 'npm (.npmignore)', file: '.npmignore' },
		{ label: 'stylelint (.stylelintignore)', file: '.stylelintignore' },
		{ label: 'vscode (.vscodeignore)', file: '.vscodeignore' }
	];

	const selected = await vscode.window.showQuickPick(items, {
		placeHolder: 'Select ignore file'
	});

	if (selected) {
		await addToIgnoreFile(selected.file, uri);
	}
}

/**
 * Add path to an ignore file
 */
async function addToIgnoreFile(ignoreFileName: string, uri?: vscode.Uri): Promise<void> {
	const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
	if (!targetUri) {
		vscode.window.showErrorMessage('No file or folder selected');
		return;
	}

	const workspaceFolder = vscode.workspace.getWorkspaceFolder(targetUri);
	if (!workspaceFolder) {
		vscode.window.showErrorMessage('File is not in a workspace');
		return;
	}

	const ignoreFilePath = path.join(workspaceFolder.uri.fsPath, ignoreFileName);
	const relativePath = path.relative(workspaceFolder.uri.fsPath, targetUri.fsPath);

	try {
		// Read existing content or create new file
		let content = '';
		try {
			content = await fs.readFile(ignoreFilePath, 'utf-8');
		} catch {
			// File doesn't exist, will be created
		}

		// Check if entry already exists
		const lines = content.split('\n');
		if (lines.some(line => line.trim() === relativePath)) {
			vscode.window.showInformationMessage(`${relativePath} already in ${ignoreFileName}`);
			return;
		}

		// Append new entry
		const newContent = content + (content && !content.endsWith('\n') ? '\n' : '') + relativePath + '\n';
		await fs.writeFile(ignoreFilePath, newContent, 'utf-8');

		vscode.window.showInformationMessage(`Added ${relativePath} to ${ignoreFileName}`);
		outputChannel.appendLine(`Added ${relativePath} to ${ignoreFileName}`);
	} catch (err) {
		vscode.window.showErrorMessage(`Failed to add to ${ignoreFileName}: ${err}`);
		outputChannel.appendLine(`Error: ${err}`);
	}
}

/**
 * Add path to tsconfig.json exclude array
 */
async function addToTsconfigExclude(uri?: vscode.Uri): Promise<void> {
	const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
	if (!targetUri) {
		vscode.window.showErrorMessage('No file or folder selected');
		return;
	}

	const workspaceFolder = vscode.workspace.getWorkspaceFolder(targetUri);
	if (!workspaceFolder) {
		vscode.window.showErrorMessage('File is not in a workspace');
		return;
	}

	const tsconfigPath = path.join(workspaceFolder.uri.fsPath, 'tsconfig.json');

	try {
		const content = await fs.readFile(tsconfigPath, 'utf-8');
		const config = JSON.parse(content);

		if (!config.exclude) {
			config.exclude = [];
		}

		const relativePath = path.relative(workspaceFolder.uri.fsPath, targetUri.fsPath);
		if (config.exclude.includes(relativePath)) {
			vscode.window.showInformationMessage(`${relativePath} already in tsconfig.json exclude`);
			return;
		}

		config.exclude.push(relativePath);

		// Write back with formatting
		await fs.writeFile(tsconfigPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');

		vscode.window.showInformationMessage(`Added ${relativePath} to tsconfig.json exclude`);
		outputChannel.appendLine(`Added ${relativePath} to tsconfig.json exclude`);
	} catch (err) {
		vscode.window.showErrorMessage(`Failed to update tsconfig.json: ${err}`);
		outputChannel.appendLine(`Error: ${err}`);
	}
}

/**
 * Include command - remove from exclusions
 * NOTE: This command is a placeholder and not yet implemented.
 * It requires:
 * - Detection of which source(s) are excluding the selection
 * - Logic to remove entries from ignore files
 * - Logic to remove from config-based exclusions (tsconfig, eslint, prettier)
 * - Proper handling of glob patterns and negation patterns
 */
async function includeCommand(uri?: vscode.Uri): Promise<void> {
	vscode.window.showInformationMessage('Include functionality not yet implemented');
	outputChannel.appendLine('Include command called (not yet implemented)');
}

/**
 * Extension deactivation
 */
export function deactivate() {
	if (outputChannel) {
		outputChannel.dispose();
	}
}
