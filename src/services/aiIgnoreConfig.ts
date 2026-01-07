/**
 * Aggregates AI ignore patterns from workspace settings and agent configs.
 */

import * as path from 'path';
import { Uri } from 'vscode';
import { AiIgnoreConfig, AiIgnorePattern, AiIgnoreSource, Source } from '../models/types';
import { normalizePath } from '../lib/patterns';
import { getAiIgnorePatternsFromSettings } from '../lib/workspaceSettings';
import { AgentConfigDetector } from './agentConfigDetector';
import { validateAiIgnorePattern } from './patternValidator';

export async function configAggregator(workspaceUri: Uri): Promise<AiIgnoreConfig> {
  const detector = new AgentConfigDetector();
  const [settingsPatterns, agentSources] = await Promise.all([
    getAiIgnorePatternsFromSettings(workspaceUri),
    detector.detectAll(workspaceUri)
  ]);

  const validationErrors: string[] = [];
  const sources: AiIgnoreSource[] = [];

  const workspaceSource: AiIgnoreSource = {
    source: Source.WorkspaceSettingsAiIgnore,
    patterns: [],
    filePath: path.join(workspaceUri.fsPath, '.vscode', 'settings.json')
  };

  for (const pattern of settingsPatterns) {
    const validation = validateAiIgnorePattern(pattern);
    if (validation.valid) {
      workspaceSource.patterns.push(validation.pattern);
    } else if (validation.errors) {
      validationErrors.push(...validation.errors.map((e) => `${validation.pattern}: ${e}`));
    }
  }

  if (workspaceSource.patterns.length > 0) {
    sources.push(workspaceSource);
  }

  for (const agentSource of agentSources) {
    const validPatterns: AiIgnorePattern[] = [];
    for (const pattern of agentSource.patterns) {
      const validation = validateAiIgnorePattern(pattern);
      if (validation.valid) {
        validPatterns.push(validation.pattern);
      } else if (validation.errors) {
        validationErrors.push(...validation.errors.map((e) => `${validation.pattern}: ${e}`));
      }
    }
    if (validPatterns.length > 0 || (agentSource.errors && agentSource.errors.length > 0)) {
      sources.push({ ...agentSource, patterns: validPatterns });
    }
  }

  const deduped: AiIgnorePattern[] = [];
  const seen = new Set<string>();
  for (const src of sources) {
    for (const pattern of src.patterns) {
      const key = normalizePath(pattern);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      deduped.push(pattern);
    }
  }

  return {
    workspaceUri,
    patterns: deduped,
    sources,
    lastUpdated: new Date(),
    isValid: validationErrors.length === 0,
    validationErrors: validationErrors.length ? validationErrors : undefined
  };
}
