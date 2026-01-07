/**
 * AI ignore resolver: loads configuration, caches results, and evaluates files against patterns.
 */

import * as vscode from 'vscode';
import { AiIgnoreConfig, AiIgnoreStatus, AiIgnoreSource } from '../models/types';
import { getWorkspaceFolder, getWorkspaceRelativePath } from '../lib/patterns';
import { configAggregator } from './aiIgnoreConfig';
import { AiIgnoreCache } from './aiIgnoreCache';
import { evaluatePatterns } from './patternMatcher';
import { getLogger } from '../logger';
import { validateSettingsSchema, SchemaValidationResult } from '../lib/schemaValidator';
import { Errors } from '../strings/errors';

export class AiIgnoreResolver {
  private readonly cache: AiIgnoreCache<AiIgnoreStatus, AiIgnoreConfig>;

  public constructor(cache?: AiIgnoreCache<AiIgnoreStatus, AiIgnoreConfig>) {
    this.cache = cache ?? new AiIgnoreCache<AiIgnoreStatus, AiIgnoreConfig>();
  }

  public async parseAiIgnoreConfig(workspaceUri: vscode.Uri): Promise<AiIgnoreConfig> {
    const cacheKey = this.workspaceKey(workspaceUri);
    const cached = this.cache.getWorkspace(cacheKey);
    if (cached) {
      return cached;
    }

    let schemaResult: SchemaValidationResult | undefined;
    try {
      schemaResult = await validateSettingsSchema(workspaceUri);
    } catch (error) {
      getLogger().warn({ error }, 'Failed to validate AI ignore settings schema');
    }

    try {
      const aggregated = await configAggregator(workspaceUri);
      const errors = this.collectErrors(aggregated, schemaResult);
      if (errors.length > 0) {
        aggregated.isValid = false;
        aggregated.validationErrors = aggregated.validationErrors
          ? [...aggregated.validationErrors, ...errors]
          : errors;
        aggregated.lastUpdated = new Date();
        this.notifyErrors(errors);
      }
      this.cache.setWorkspace(cacheKey, aggregated);
      return aggregated;
    } catch (error) {
      getLogger().warn({ error }, 'Failed to parse AI ignore config');
      return {
        workspaceUri,
        patterns: [],
        sources: [],
        lastUpdated: new Date(),
        isValid: false,
        validationErrors: [
          error instanceof Error ? error.message : 'Unknown error parsing AI ignore config'
        ]
      };
    }
  }

  public async isIgnoredForAI(fileUri: vscode.Uri): Promise<boolean> {
    const status = await this.getStatus(fileUri);
    return status.isIgnored;
  }

  public async getStatus(fileUri: vscode.Uri): Promise<AiIgnoreStatus> {
    const workspaceFolder = getWorkspaceFolder(fileUri);
    if (!workspaceFolder) {
      return {
        uri: fileUri,
        isIgnored: false,
        evaluatedAt: new Date()
      };
    }

    const relativePath = getWorkspaceRelativePath(fileUri, workspaceFolder);
    if (!relativePath) {
      return {
        uri: fileUri,
        isIgnored: false,
        evaluatedAt: new Date()
      };
    }

    const workspaceKey = this.workspaceKey(workspaceFolder.uri);
    const fileKey = `${workspaceKey}:${relativePath}`;
    const cached = this.cache.getFile(fileKey);
    if (cached) {
      return cached;
    }

    const config = await this.parseAiIgnoreConfig(workspaceFolder.uri);
    const evaluation = evaluatePatterns(relativePath, config.patterns);
    const matchedSource = this.findSourceForMatch(config.sources, evaluation.matchedPatterns);
    const status: AiIgnoreStatus = {
      uri: fileUri,
      isIgnored: evaluation.ignored,
      matchedPatterns: evaluation.matchedPatterns.length ? evaluation.matchedPatterns : undefined,
      source: matchedSource,
      evaluatedAt: new Date(),
      cacheKey: fileKey
    };

    this.cache.setFile(fileKey, status);
    return status;
  }

  private workspaceKey(workspaceUri: vscode.Uri): string {
    return workspaceUri.toString();
  }

  private findSourceForMatch(
    sources: AiIgnoreSource[],
    matchedPatterns: string[]
  ): AiIgnoreSource | undefined {
    if (matchedPatterns.length === 0) {
      return undefined;
    }
    for (const pattern of matchedPatterns) {
      const source = sources.find((src) => src.patterns.some((p) => p === pattern));
      if (source) {
        return source;
      }
    }
    return undefined;
  }

  private collectErrors(config: AiIgnoreConfig, schemaResult?: SchemaValidationResult): string[] {
    const merged = new Set<string>();
    if (schemaResult && !schemaResult.valid) {
      schemaResult.errors.forEach((e) => merged.add(e));
    }
    if (config.validationErrors) {
      config.validationErrors.forEach((e) => merged.add(e));
    }
    for (const source of config.sources) {
      if (!source.errors || source.errors.length === 0) {
        continue;
      }
      const file = source.filePath ?? source.source;
      for (const err of source.errors) {
        merged.add(Errors.agentConfigRead(file, err));
      }
    }
    return Array.from(merged);
  }

  private notifyErrors(errors: string[]): void {
    if (errors.length === 0) {
      return;
    }
    const message =
      errors.length === 1 ? errors[0] : `${Errors.partialLoad(errors.length)}. First: ${errors[0]}`;
    getLogger().warn({ errors }, 'AI ignore configuration errors');
    void vscode.window.showErrorMessage(message);
  }
}

export async function parseAiIgnoreConfig(workspaceUri: vscode.Uri): Promise<AiIgnoreConfig> {
  const resolver = new AiIgnoreResolver();
  return resolver.parseAiIgnoreConfig(workspaceUri);
}

export async function isIgnoredForAI(fileUri: vscode.Uri): Promise<boolean> {
  const resolver = new AiIgnoreResolver();
  return resolver.isIgnoredForAI(fileUri);
}
