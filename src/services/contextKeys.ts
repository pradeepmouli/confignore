/**
 * Service for managing VS Code context keys for menu visibility
 */

import { commands } from 'vscode';
import { EffectiveState } from '../models/types';

/**
 * Update VS Code context keys based on effective state
 * @param state The effective state to apply
 */
export async function updateContextKeys(state: EffectiveState): Promise<void> {
	// Set context keys that control menu visibility
	await commands.executeCommand('setContext', 'confignore.selectionExcluded', state.excluded);
	await commands.executeCommand('setContext', 'confignore.selectionMixed', state.mixed);
}

/**
 * Clear all context keys
 */
export async function clearContextKeys(): Promise<void> {
	await commands.executeCommand('setContext', 'confignore.selectionExcluded', false);
	await commands.executeCommand('setContext', 'confignore.selectionMixed', false);
}
