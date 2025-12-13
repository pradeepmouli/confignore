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
 * Set feature flag context key for include support
 */
export async function setFeatureFlagContext(enabled: boolean): Promise<void> {
	await commands.executeCommand('setContext', 'ignorer.features.includeSupport', enabled);
}

/**
 * Clear context keys (reset to defaults)
 */
export async function clearContextKeys(): Promise<void> {
	await commands.executeCommand('setContext', 'confignore.selectionExcluded', false);
	await commands.executeCommand('setContext', 'confignore.selectionMixed', false);
}
