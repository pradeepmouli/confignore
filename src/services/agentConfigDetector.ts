/**
 * Agent configuration detection for AI ignore sources.
 */

import * as path from 'path';
import { Uri } from 'vscode';
import { fileExists, readFile } from '../lib/fs';
import {
  AgentConfigDetectionResult,
  AgentConfigError,
  AgentConfigFile,
  AiIgnoreSource,
  Source
} from '../models/types';

export class AgentConfigDetector {
  public async detectClaude(workspaceUri: Uri): Promise<AiIgnoreSource | null> {
    const configPath = path.join(workspaceUri.fsPath, '.claude', 'settings.json');
    if (!(await fileExists(configPath))) {
      return null;
    }

    const patterns: string[] = [];
    const errors: string[] = [];
    try {
      const content = await readFile(configPath);
      const parsed = JSON.parse(content) as any;
      const deny = parsed?.permissions?.deny;
      if (Array.isArray(deny)) {
        for (const entry of deny) {
          if (typeof entry !== 'string') {
            continue;
          }
          const match = entry.match(/^Read\((.*)\)$/);
          if (!match) {
            continue;
          }
          const raw = match[1];
          const normalized = raw.replace(/^\.\//, '');
          patterns.push(normalized);
        }
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Failed to parse Claude settings');
    }

    return {
      source: Source.AgentConfigClaude,
      patterns,
      filePath: configPath,
      errors: errors.length ? errors : undefined
    };
  }

  public async detectGemini(workspaceUri: Uri): Promise<AiIgnoreSource | null> {
    const configPath = path.join(workspaceUri.fsPath, '.aiexclude');
    if (!(await fileExists(configPath))) {
      return null;
    }

    const patterns: string[] = [];
    const errors: string[] = [];
    try {
      const content = await readFile(configPath);
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
          continue;
        }
        patterns.push(trimmed);
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Failed to read .aiexclude');
    }

    return {
      source: Source.AgentConfigGemini,
      patterns,
      filePath: configPath,
      errors: errors.length ? errors : undefined
    };
  }

  public async detectAll(workspaceUri: Uri): Promise<AiIgnoreSource[]> {
    const results = await Promise.all([
      this.detectClaude(workspaceUri),
      this.detectGemini(workspaceUri)
    ]);
    return results.filter((s): s is AiIgnoreSource => !!s);
  }

  public async detectWithSummary(workspaceUri: Uri): Promise<AgentConfigDetectionResult> {
    const detectedSources = await this.detectAll(workspaceUri);
    const detectedConfigs: AgentConfigFile[] = [];
    const parseErrors: AgentConfigError[] = [];

    for (const source of detectedSources) {
      const fileStats = await this.safeStat(source.filePath);
      detectedConfigs.push({
        agentName: this.toAgentName(source.source),
        configPath: source.filePath ?? '',
        patterns: source.patterns,
        format: source.source === Source.AgentConfigGemini ? 'gitignore-style' : 'json',
        parseStatus: source.errors && source.errors.length > 0 ? 'partial' : 'success',
        lastModified: fileStats?.mtime ?? new Date()
      });

      if (source.errors) {
        for (const message of source.errors) {
          parseErrors.push({
            configPath: source.filePath ?? '',
            errorType: 'parse',
            message
          });
        }
      }
    }

    return {
      workspaceUri,
      detectedConfigs,
      totalPatterns: detectedSources.reduce((sum, src) => sum + src.patterns.length, 0),
      parseErrors
    };
  }

  private async safeStat(filePath?: string) {
    if (!filePath) {
      return undefined;
    }
    try {
      const { stat } = await import('fs/promises');
      return await stat(filePath);
    } catch {
      return undefined;
    }
  }

  private toAgentName(source: Source): 'claude' | 'gemini' | 'custom' {
    if (source === Source.AgentConfigClaude) {
      return 'claude';
    }
    if (source === Source.AgentConfigGemini) {
      return 'gemini';
    }
    return 'custom';
  }
}
