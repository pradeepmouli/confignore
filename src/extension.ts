// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as path from 'path';
import * as vscode from 'vscode';
import { addToTsconfigExclude, detectConfigTargetsFor, guardMissingConfig, removeFromEslintIgnore, removeFromPrettierExcluded, removeFromTsconfigExclude } from './services/configTargets';
import { clearContextKeys, setFeatureFlagContext, updateContextKeys } from './services/contextKeys';
import { resolveStates } from './services/stateResolver';

// Utility: debounce function calls
function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout | undefined;
	return (...args: Parameters<T>) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), delay);
	};
}

// Utility: User-friendly error messages
function getFriendlyErrorMessage(error: unknown, context: string): string {
	if (error instanceof vscode.FileSystemError) {
		if (error.code === 'FileNotFound') {
			return `File not found. It may have been moved or deleted.`;
		}
		if (error.code === 'NoPermissions') {
			return `Permission denied. Please check file permissions.`;
		}
	}
	if (error instanceof Error) {
		return `${context}: ${error.message}`;
	}
	return `${context}. Please try again.`;
}

// Utility: Structured logging
enum LogLevel {
	INFO = 'INFO',
	SUCCESS = 'SUCCESS',
	WARNING = 'WARNING',
	ERROR = 'ERROR'
}

function log(level: LogLevel, message: string, channel: vscode.OutputChannel) {
	const timestamp = new Date().toLocaleTimeString();
	const icons = {
		[LogLevel.INFO]: 'ℹ️',
		[LogLevel.SUCCESS]: '✅',
		[LogLevel.WARNING]: '⚠️',
		[LogLevel.ERROR]: '❌'
	};
	channel.appendLine(`[${timestamp}] ${icons[level]} ${level}: ${message}`);
}

type IgnoreKey = 'git' | 'docker' | 'eslint' | 'prettier' | 'npm' | 'stylelint' | 'vscode';

const FEATURE_FLAG_SETTING = 'ignorer.features.includeSupport';

const IGNORE_MAP: Record<IgnoreKey, { file: string; label: string; contextKey: string; }> = {
	git: { file: '.gitignore', label: 'Git', contextKey: 'confignore.hasGit' },
	docker: { file: '.dockerignore', label: 'Docker', contextKey: 'confignore.hasDocker' },
	eslint: { file: '.eslintignore', label: 'ESLint', contextKey: 'confignore.hasEslint' },
	prettier: { file: '.prettierignore', label: 'Prettier', contextKey: 'confignore.hasPrettier' },
	npm: { file: '.npmignore', label: 'npm', contextKey: 'confignore.hasNpm' },
	stylelint: { file: '.stylelintignore', label: 'Stylelint', contextKey: 'confignore.hasStylelint' },
	vscode: { file: '.vscodeignore', label: 'VS Code', contextKey: 'confignore.hasVscode' },
};

async function setContext(key: string, value: boolean) {
	await vscode.commands.executeCommand('setContext', key, value);
}

async function fileExists(uri: vscode.Uri): Promise<boolean> {
	try {
		await vscode.workspace.fs.stat(uri);
		return true;
	} catch {
		return false;
	}
}

async function dirExists(uri: vscode.Uri): Promise<boolean> {
	try {
		const s = await vscode.workspace.fs.stat(uri);
		return (s.type & vscode.FileType.Directory) === vscode.FileType.Directory;
	} catch {
		return false;
	}
}

async function detectCapabilities() {
	const folders = vscode.workspace.workspaceFolders ?? [];
	const states: Record<IgnoreKey, boolean> = {
		git: false,
		docker: false,
		eslint: false,
		prettier: false,
		npm: false,
		stylelint: false,
		vscode: false,
	};

	if (folders.length === 0) {
		// no workspace -> set all false
		await Promise.all(Object.values(IGNORE_MAP).map(m => setContext(m.contextKey, false)));
		return states;
	}

	// Search across all folders; enable if any folder suggests relevance
	const patterns = {
		docker: ['**/.dockerignore', '**/Dockerfile*', '**/docker-compose*.y?(a)ml'],
		eslint: ['**/.eslintignore', '**/.eslintrc*', '**/eslint.config.*','**/oxlint**'],
		prettier: ['**/.prettierignore', '**/.prettierrc*', '**/prettier.config.*', '**/*oxfmt**'],
		stylelint: ['**/.stylelintignore', '**/.stylelintrc*', '**/stylelint.config.*'],
	} as const;

	// git
	for (const f of folders) {
		const hasGitIgnore = await fileExists(vscode.Uri.joinPath(f.uri, '.gitignore'));
		const hasGitDir = await dirExists(vscode.Uri.joinPath(f.uri, '.git'));
		if (hasGitIgnore || hasGitDir) { states.git = true; break; }
	}

	// docker
	if ((await vscode.workspace.findFiles(`{${patterns.docker.join(',')}}`, '**/node_modules/**', 1)).length > 0) {
		states.docker = true;
	}

	// eslint
	if ((await vscode.workspace.findFiles(`{${patterns.eslint.join(',')}}`, '**/node_modules/**', 1)).length > 0) {
		states.eslint = true;
	}

	// prettier
	if ((await vscode.workspace.findFiles(`{${patterns.prettier.join(',')}}`, '**/node_modules/**', 1)).length > 0) {
		states.prettier = true;
	}

	// stylelint
	if ((await vscode.workspace.findFiles(`{${patterns.stylelint.join(',')}}`, '**/node_modules/**', 1)).length > 0) {
		states.stylelint = true;
	}

	// npm (any package.json)
	if ((await vscode.workspace.findFiles('**/package.json', '**/node_modules/**', 1)).length > 0) {
		states.npm = true;
	}

	// vscode extension packaging
	if ((await vscode.workspace.findFiles('**/.vscodeignore', '**/node_modules/**', 1)).length > 0) {
		states.vscode = true;
	} else {
		// heuristics: VS Code extension has vsc-extension-quickstart.md or engines.vscode in package.json at root
		try {
			const root = folders[0];
			const pkgUri = vscode.Uri.joinPath(root.uri, 'package.json');
			if (await fileExists(pkgUri)) {
				const buf = await vscode.workspace.fs.readFile(pkgUri);
				const pkg = JSON.parse(Buffer.from(buf).toString('utf8')) as any;
				if (pkg?.engines?.vscode) {states.vscode = true;}
			}
		} catch {
			// ignore
		}
	}

	await Promise.all((Object.keys(IGNORE_MAP) as IgnoreKey[]).map(key => setContext(IGNORE_MAP[key].contextKey, !!states[key])));

	// Also set tsconfig context
	const hasTsconfig = (await vscode.workspace.findFiles('**/tsconfig.json', '**/node_modules/**', 1)).length > 0;
	await setContext('confignore.hasTsconfig', hasTsconfig);

	return states;
}

function getIncludeSupportFlag(): boolean {
	return vscode.workspace.getConfiguration('ignorer.features').get<boolean>('includeSupport', false) ?? false;
}

function getWorkspaceFolder(uri: vscode.Uri): vscode.WorkspaceFolder | undefined {
	return vscode.workspace.getWorkspaceFolder(uri);
}

async function isDirectory(uri: vscode.Uri): Promise<boolean> {
	const stat = await vscode.workspace.fs.stat(uri);
	return (stat.type & vscode.FileType.Directory) === vscode.FileType.Directory;
}

function toRelativePattern(folder: vscode.WorkspaceFolder, target: vscode.Uri, isDir: boolean): string {
	const rel = path.relative(folder.uri.fsPath, target.fsPath).replace(/\\/g, '/');
	if (isDir) {
		return rel.endsWith('/') ? rel : rel + '/';
	}
	return rel || '/';
}

async function ensureFile(uri: vscode.Uri) {
	if (!(await fileExists(uri))) {
		await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(''));
	}
}

async function appendUniqueLines(file: vscode.Uri, newLines: string[]) {
	const buf = await vscode.workspace.fs.readFile(file);
	let content = Buffer.from(buf).toString('utf8');
	const existing = new Set(content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0));
	const toAdd = newLines.map(l => l.trim()).filter(l => l.length > 0 && !existing.has(l));
	if (toAdd.length === 0) {return false;}
	if (content.length > 0 && !content.endsWith('\n')) {content += '\n';}
	content += toAdd.join('\n') + '\n';
	await vscode.workspace.fs.writeFile(file, new TextEncoder().encode(content));
	return true;
}

function collectTargetUris(arg0?: unknown, arg1?: unknown): vscode.Uri[] {
	// Explorer passes: (resource: Uri, all?: Uri[])
	const list: vscode.Uri[] = [];
	if (arg1 && Array.isArray(arg1) && arg1.every(u => u instanceof vscode.Uri)) {
		return arg1 as vscode.Uri[];
	}
	if (arg0 instanceof vscode.Uri) {list.push(arg0);}
	return list;
}

async function addToIgnore(type: IgnoreKey, arg0?: unknown, arg1?: unknown) {
	const targets = collectTargetUris(arg0, arg1);
	if (targets.length === 0) {
		vscode.window.showWarningMessage('No target selected. Please right-click a file or folder in the Explorer.');
		return;
	}

	// Check for mixed-state selections
	const states = await Promise.all(targets.map(async (uri) => {
		const result = await resolveStates([uri], { includeSupportEnabled: getIncludeSupportFlag() });
		return result.excluded;
	}));
	const excludedCount = states.filter(Boolean).length;
	const totalCount = targets.length;

	// Confirm if mixed state (some already excluded)
	if (excludedCount > 0 && excludedCount < totalCount) {
		const notExcluded = totalCount - excludedCount;
		const result = await vscode.window.showWarningMessage(
			`${notExcluded} of ${totalCount} selected files will be added to ignore. ${excludedCount} are already ignored.`,
			{ modal: true },
			'Continue',
			'Cancel'
		);
		if (result !== 'Continue') {return;}
	}

	const byFolder = new Map<vscode.WorkspaceFolder, vscode.Uri[]>();
	for (const t of targets) {
		const folder = getWorkspaceFolder(t);
		if (!folder) {continue;}
		if (!byFolder.has(folder)) {byFolder.set(folder, []);}
		byFolder.get(folder)!.push(t);
	}

	const failures: string[] = [];

	for (const [folder, uris] of byFolder) {
		const ignoreFile = vscode.Uri.joinPath(folder.uri, IGNORE_MAP[type].file);
		await ensureFile(ignoreFile);

		const entries: string[] = [];
		for (const u of uris) {
			try {
				const dir = await isDirectory(u);
				const rel = toRelativePattern(folder, u, dir);
				entries.push(rel);
			} catch (error) {
				const friendlyMsg = getFriendlyErrorMessage(error, 'Unable to process file');
				failures.push(`${path.basename(u.fsPath)}: ${friendlyMsg}`);
			}
		}

		const changed = await appendUniqueLines(ignoreFile, entries);
		if (changed) {
			// Enhanced status message with actions
			vscode.window.showInformationMessage(
				`Added ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} to ${IGNORE_MAP[type].file}`,
				'View File'
			).then(action => {
				if (action === 'View File') {
					vscode.workspace.openTextDocument(ignoreFile).then(doc =>
						vscode.window.showTextDocument(doc)
					);
				}
			});
		} else {
			vscode.window.setStatusBarMessage(`confignore: Nothing to add to ${IGNORE_MAP[type].file}`, 3000);
		}
	}

	if (failures.length) {
		vscode.window.showErrorMessage(`Confignore: ${failures.join('; ')}`);
	}
}

async function quickPickAdd(arg0?: unknown, arg1?: unknown) {
	const states = await detectCapabilities();
	const descriptions: Record<IgnoreKey, string> = {
		git: 'Exclude from version control',
		docker: 'Exclude from Docker image',
		eslint: 'Exclude from linting',
		prettier: 'Exclude from formatting',
		npm: 'Exclude from npm package',
		stylelint: 'Exclude from style linting',
		vscode: 'Exclude from VS Code extension package'
	};
	const items = (Object.keys(IGNORE_MAP) as IgnoreKey[])
		.filter(k => states[k])
		.map(k => ({
			label: `$(file-code) ${IGNORE_MAP[k].label}`,
			description: IGNORE_MAP[k].file,
			detail: descriptions[k],
			key: k
		}));
	if (items.length === 0) {
		vscode.window.showInformationMessage('No relevant ignore files detected in this workspace.');
		return;
	}
	const pick = await vscode.window.showQuickPick(items, {
		title: 'Add to Ignore',
		placeHolder: 'Select an ignore file',
		matchOnDescription: true,
		matchOnDetail: true
	});
	if (!pick) {return;}
	await addToIgnore(pick.key as IgnoreKey, arg0, arg1);
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const channel = vscode.window.createOutputChannel('confignore');
	context.subscriptions.push(channel);
	log(LogLevel.INFO, 'Extension activated', channel);

	let includeSupportEnabled = getIncludeSupportFlag();
	setFeatureFlagContext(includeSupportEnabled).catch(err => {
		log(LogLevel.ERROR, `setFeatureFlagContext error: ${String(err)}`, channel);
	});

	// Initialize detection on activation
	detectCapabilities().then(states => {
		log(LogLevel.INFO, `Detected targets: ${JSON.stringify(states)}`, channel);
	}).catch(err => {
		log(LogLevel.ERROR, `detectCapabilities error: ${String(err)}`, channel);
	});

	// Initialize context keys
	clearContextKeys().catch(err => {
		log(LogLevel.ERROR, `clearContextKeys error: ${String(err)}`, channel);
	});

	// First-run welcome message
	const hasSeenWelcome = context.globalState.get<boolean>('confignore.hasSeenWelcome', false);
	if (!hasSeenWelcome) {
		vscode.window.showInformationMessage(
			'Welcome to Confignore! Right-click any file in Explorer and choose "Add to Ignore" to get started.',
			'Got it',
			'Learn More'
		).then(action => {
			if (action === 'Learn More') {
				vscode.env.openExternal(vscode.Uri.parse('https://github.com/pradeepmouli/confignore#readme'));
			}
		});
		context.globalState.update('confignore.hasSeenWelcome', true);
	}

	// Subscribe to selection changes to update context keys
	let lastSelection: vscode.Uri[] = [];
	const updateSelection = async () => {
		try {
			const editor = vscode.window.activeTextEditor;
			if (editor) {
				const uris = [editor.document.uri];
				if (JSON.stringify(uris) !== JSON.stringify(lastSelection)) {
					lastSelection = uris;
					const state = await resolveStates(uris, { includeSupportEnabled });
					await updateContextKeys(state);
					channel.appendLine(`[confignore] Selection state: excluded=${state.excluded}, mixed=${state.mixed}, source=${state.source}`);
				}
			}
		} catch (err) {
			channel.appendLine('[confignore] updateSelection error: ' + String(err));
		}
	};

	// Debounced version for document changes
	const debouncedUpdateSelection = debounce(updateSelection, 500);

	// Only trigger debounced updates for relevant file changes
	const relevantFiles = ['.gitignore', '.dockerignore', '.eslintignore', '.prettierignore', '.npmignore', '.stylelintignore', '.vscodeignore', 'tsconfig.json', '.eslintrc', '.prettierrc'];
	const onDocumentChange = (e: vscode.TextDocumentChangeEvent) => {
		const filename = path.basename(e.document.uri.fsPath);
		const isRelevant = relevantFiles.some(f => filename.includes(f.replace(/\./g, '')));
		if (isRelevant) {
			debouncedUpdateSelection();
		}
	};

	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(() => updateSelection()),
		vscode.workspace.onDidChangeTextDocument(onDocumentChange)
	);

	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(async (event) => {
			if (event.affectsConfiguration(FEATURE_FLAG_SETTING)) {
				const nextFlag = getIncludeSupportFlag();
				includeSupportEnabled = nextFlag;
				await setFeatureFlagContext(nextFlag);
				channel.appendLine(`[confignore] Feature flag includeSupport changed: ${nextFlag}`);
				const action = 'Reload Window';
				const msg = `confignore include support ${nextFlag ? 'enabled' : 'disabled'}. Reload the window to update available commands.`;
				const picked = await vscode.window.showInformationMessage(msg, action);
				if (picked === action) {
					await vscode.commands.executeCommand('workbench.action.reloadWindow');
				}
				await updateSelection();
			}
		})
	);

	// Initial selection update
	updateSelection();

	// Register commands
	context.subscriptions.push(
		vscode.commands.registerCommand('confignore.addToIgnore.quickPick', async (arg0, arg1) => {
			channel.appendLine('[confignore] Command: quickPick');
			await quickPickAdd(arg0, arg1);
		}),
		vscode.commands.registerCommand('confignore.addToIgnore.git', async (arg0, arg1) => {
			channel.appendLine('[confignore] Command: addToIgnore.git');
			await addToIgnore('git', arg0, arg1);
		}),
		vscode.commands.registerCommand('confignore.addToIgnore.docker', async (arg0, arg1) => {
			channel.appendLine('[confignore] Command: addToIgnore.docker');
			await addToIgnore('docker', arg0, arg1);
		}),
		vscode.commands.registerCommand('confignore.addToIgnore.eslint', async (arg0, arg1) => {
			channel.appendLine('[confignore] Command: addToIgnore.eslint');
			await addToIgnore('eslint', arg0, arg1);
		}),
		vscode.commands.registerCommand('confignore.addToIgnore.prettier', async (arg0, arg1) => {
			channel.appendLine('[confignore] Command: addToIgnore.prettier');
			await addToIgnore('prettier', arg0, arg1);
		}),
		vscode.commands.registerCommand('confignore.addToIgnore.npm', async (arg0, arg1) => {
			channel.appendLine('[confignore] Command: addToIgnore.npm');
			await addToIgnore('npm', arg0, arg1);
		}),
		vscode.commands.registerCommand('confignore.addToIgnore.stylelint', async (arg0, arg1) => {
			channel.appendLine('[confignore] Command: addToIgnore.stylelint');
			await addToIgnore('stylelint', arg0, arg1);
		}),
		vscode.commands.registerCommand('confignore.addToIgnore.vscode', async (arg0, arg1) => {
			channel.appendLine('[confignore] Command: addToIgnore.vscode');
			await addToIgnore('vscode', arg0, arg1);
		}),
		vscode.commands.registerCommand('confignore.addToIgnore.tsconfig', async (arg0, arg1) => {
			channel.appendLine('[confignore] Command: addToIgnore.tsconfig');
			const items = collectTargetUris(arg0, arg1);
			if (items.length === 0) { vscode.window.showWarningMessage('No selection to exclude.'); return; }
			const targets = await detectConfigTargetsFor(items[0]);
			if (!(await guardMissingConfig(targets?.tsconfig, 'tsconfig'))) {return;}
			await addToTsconfigExclude(targets!.tsconfig!, items);
			vscode.window.setStatusBarMessage('confignore: Updated tsconfig exclude', 3000);
		}),
		...(includeSupportEnabled ? [
			vscode.commands.registerCommand('confignore.include', async (arg0, arg1) => {
				channel.appendLine('[confignore] Command: include');
				const items = collectTargetUris(arg0, arg1);
				if (items.length === 0) { vscode.window.showWarningMessage('No selection to include.'); return; }
				// For v1: attempt removal from config-based sources in precedence order
				const targets = await detectConfigTargetsFor(items[0]);
				let changed = false;
				if (!changed && targets?.tsconfig) {changed = await removeFromTsconfigExclude(targets.tsconfig, items);}
				if (!changed && targets?.eslintConfig) {changed = await removeFromEslintIgnore(targets.eslintConfig, items);}
				if (!changed && targets?.prettierConfig) {changed = await removeFromPrettierExcluded(targets.prettierConfig, items);}
				vscode.window.setStatusBarMessage(changed ? 'confignore: Inclusion updated' : 'confignore: Nothing to include in configs', 3000);
			})
		] : [])
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
