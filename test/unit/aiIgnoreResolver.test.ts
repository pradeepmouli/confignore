/**
 * Unit tests for AiIgnoreResolver
 */

import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import { AiIgnoreResolver } from '../../src/services/aiIgnoreResolver';
import { AiIgnoreCache } from '../../src/services/aiIgnoreCache';
import { AiIgnoreConfig, Source } from '../../src/models/types';

describe('AiIgnoreResolver (unit)', () => {
  let workspaceFolder: vscode.WorkspaceFolder;
  let cache: AiIgnoreCache<any, any>;
  let resolver: AiIgnoreResolver;

  beforeEach(() => {
    const workspaceUri = vscode.Uri.file(path.join('/tmp', 'ai-ignore-resolver'));
    workspaceFolder = { uri: workspaceUri, name: 'workspace', index: 0 };
    (vscode.workspace as any).getWorkspaceFolder = (uri: vscode.Uri) => {
      return uri.fsPath.startsWith(workspaceFolder.uri.fsPath) ? workspaceFolder : undefined;
    };
    (vscode.window as any).showErrorMessage = () => Promise.resolve(undefined);
    cache = new AiIgnoreCache();
    resolver = new AiIgnoreResolver(cache);
  });

  it('returns cached workspace config when available', async () => {
    const config: AiIgnoreConfig = {
      workspaceUri: workspaceFolder.uri,
      patterns: ['src/**'],
      sources: [],
      lastUpdated: new Date(),
      isValid: true
    };
    cache.setWorkspace(workspaceFolder.uri.toString(), config);

    const parsed = await resolver.parseAiIgnoreConfig(workspaceFolder.uri);
    assert.deepStrictEqual(parsed.patterns, ['src/**']);
  });

  it('evaluates ignore patterns with negation and caches file result', async () => {
    const config: AiIgnoreConfig = {
      workspaceUri: workspaceFolder.uri,
      patterns: ['src/**/*.ts', '!src/allowed.ts'],
      sources: [],
      lastUpdated: new Date(),
      isValid: true
    };
    cache.setWorkspace(workspaceFolder.uri.toString(), config);

    const ignoredFile = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, 'src', 'index.ts'));
    const allowedFile = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, 'src', 'allowed.ts'));

    const ignoredStatus = await resolver.getStatus(ignoredFile);
    const allowedStatus = await resolver.getStatus(allowedFile);

    assert.strictEqual(ignoredStatus.isIgnored, true);
    assert.strictEqual(allowedStatus.isIgnored, false);
    assert.deepStrictEqual(
      cache.getFile(`${workspaceFolder.uri.toString()}:src/index.ts`)?.isIgnored,
      true
    );
  });

  it('returns false when file is outside any workspace', async () => {
    (vscode.workspace as any).getWorkspaceFolder = () => undefined;
    const status = await resolver.getStatus(vscode.Uri.file('/other/file.ts'));
    assert.strictEqual(status.isIgnored, false);
  });

  it('records matched patterns and source', async () => {
    const config: AiIgnoreConfig = {
      workspaceUri: workspaceFolder.uri,
      patterns: ['src/**'],
      sources: [
        {
          source: Source.WorkspaceSettingsAiIgnore,
          patterns: ['src/**'],
          filePath: '.vscode/settings.json'
        }
      ],
      lastUpdated: new Date(),
      isValid: true
    };
    cache.setWorkspace(workspaceFolder.uri.toString(), config);

    const file = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, 'src', 'file.ts'));
    const status = await resolver.getStatus(file);
    assert.strictEqual(status.isIgnored, true);
    assert.deepStrictEqual(status.matchedPatterns, ['src/**']);
    assert.strictEqual(status.source?.source, Source.WorkspaceSettingsAiIgnore);
  });
});
