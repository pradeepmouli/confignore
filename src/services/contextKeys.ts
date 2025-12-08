/**
 * Context key management for menu visibility
 */

import { commands } from 'vscode';
import { EffectiveState } from '../models/types';

/**
 * Set context keys based on effective state
 */
export async function updateContextKeys(state: EffectiveState): Promise<void> {
	await commands.executeCommand('setContext', 'confignore.selectionExcluded', state.excluded);
	await commands.executeCommand('setContext', 'confignore.selectionMixed', state.mixed);
}

/**
 * Clear context keys (reset to defaults)
 */
export async function clearContextKeys(): Promise<void> {
	await commands.executeCommand('setContext', 'confignore.selectionExcluded', false);
	await commands.executeCommand('setContext', 'confignore.selectionMixed', false);
}
