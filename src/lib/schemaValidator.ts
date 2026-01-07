/**
 * Schema validation for Confignore workspace settings.
 */

import * as vscode from 'vscode';
import { getLogger } from '../logger';
import { Errors } from '../strings/errors';

export interface SchemaValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

const allowedConfignoreKeys = new Set([
  'confignore.aiIgnore',
  'confignore.defaultIgnoreFile',
  'confignore.confirmMixedState',
  'confignore.checkDuplicates'
]);

export async function validateSettingsSchema(
  workspaceUri: vscode.Uri
): Promise<SchemaValidationResult> {
  const settingsUri = vscode.Uri.joinPath(workspaceUri, '.vscode', 'settings.json');
  try {
    await vscode.workspace.fs.stat(settingsUri);
  } catch {
    return { valid: true, errors: [] };
  }

  try {
    const buf = await vscode.workspace.fs.readFile(settingsUri);
    const parsed = JSON.parse(Buffer.from(buf).toString('utf8')) as unknown;
    return validateSettingsObject(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown parse error';
    getLogger().warn({ error }, 'Failed to validate settings schema');
    return { valid: false, errors: [Errors.parseSettings(settingsUri.fsPath, message)] };
  }
}

export function validateSettingsObject(parsed: unknown): SchemaValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, errors: [Errors.parseSettings('settings.json', 'Expected an object')] };
  }

  const data = parsed as Record<string, unknown>;
  for (const key of Object.keys(data)) {
    if (key.startsWith('confignore.') && !allowedConfignoreKeys.has(key)) {
      errors.push(Errors.unknownSetting(key));
    }
  }

  if ('confignore.aiIgnore' in data) {
    const value = data['confignore.aiIgnore'];
    if (!Array.isArray(value)) {
      errors.push(Errors.missingArray);
    } else {
      for (const entry of value) {
        if (typeof entry !== 'string') {
          errors.push(Errors.invalidPattern(String(entry), 'Pattern must be a string'));
          continue;
        }
        if (entry.trim().length === 0) {
          errors.push(Errors.invalidPattern('<empty>', 'Pattern must not be empty'));
        }
      }
    }
  } else {
    warnings.push(Errors.noConfig);
  }

  return { valid: errors.length === 0, errors, warnings: warnings.length ? warnings : undefined };
}
