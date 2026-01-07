/**
 * Workspace settings reader for AI ignore patterns.
 */

import * as vscode from 'vscode';
import { getLogger } from '../logger';
import { AiIgnorePattern } from '../models/types';
import { validateAiIgnorePattern } from '../services/patternValidator';

export async function getAiIgnorePatternsFromSettings(
  workspaceUri: vscode.Uri
): Promise<AiIgnorePattern[]> {
  const settingsUri = vscode.Uri.joinPath(workspaceUri, '.vscode', 'settings.json');
  try {
    await vscode.workspace.fs.stat(settingsUri);
  } catch {
    return [];
  }

  let content: string;
  try {
    const buf = await vscode.workspace.fs.readFile(settingsUri);
    content = Buffer.from(buf).toString('utf8');
  } catch (error) {
    getLogger().warn({ error }, 'Failed to read workspace settings');
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    getLogger().warn({ error }, 'Failed to parse workspace settings JSON');
    return [];
  }

  const config = parsed as Record<string, unknown>;
  const raw = config['confignore.aiIgnore'];
  if (!Array.isArray(raw)) {
    return [];
  }

  const patterns: AiIgnorePattern[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'string') {
      getLogger().warn({ entry }, 'AI ignore pattern is not a string');
      continue;
    }
    const validation = validateAiIgnorePattern(entry);
    if (validation.valid) {
      patterns.push(validation.pattern);
    } else {
      getLogger().warn(
        { errors: validation.errors, pattern: validation.pattern },
        'Invalid AI ignore pattern'
      );
    }
  }

  return patterns;
}
