/**
 * Integration tests for AgentConfigDetector
 */

import * as assert from 'assert';
import * as os from 'os';
import * as path from 'path';
import { promises as fs } from 'fs';
import { Uri } from 'vscode';
import { AgentConfigDetector } from '../../src/services/agentConfigDetector';

describe('AgentConfigDetector', () => {
  let workspacePath: string;
  let workspaceUri: Uri;

  beforeEach(async () => {
    workspacePath = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-config-'));
    workspaceUri = Uri.file(workspacePath);
  });

  afterEach(async () => {
    await fs.rm(workspacePath, { recursive: true, force: true });
  });

  it('detects Claude permission deny patterns', async () => {
    const claudeDir = path.join(workspacePath, '.claude');
    await fs.mkdir(claudeDir, { recursive: true });
    const settingsPath = path.join(claudeDir, 'settings.json');
    await fs.writeFile(
      settingsPath,
      JSON.stringify({ permissions: { deny: ['Read(./secrets/**)', 'Read(./config.json)'] } })
    );

    const detector = new AgentConfigDetector();
    const source = await detector.detectClaude(workspaceUri);

    assert.ok(source);
    assert.strictEqual(source?.patterns.length, 2);
    assert.deepStrictEqual(source?.patterns, ['secrets/**', 'config.json']);
  });

  it('detects Gemini .aiexclude patterns', async () => {
    const aiexclude = path.join(workspacePath, '.aiexclude');
    await fs.writeFile(aiexclude, '# comment\nsecrets/**\n!secrets/keep.txt');

    const detector = new AgentConfigDetector();
    const source = await detector.detectGemini(workspaceUri);

    assert.ok(source);
    assert.deepStrictEqual(source?.patterns, ['secrets/**', '!secrets/keep.txt']);
  });
});
