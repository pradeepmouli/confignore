/**
 * Placeholder integration tests for AiIgnoreResolver
 */

import * as assert from 'assert';
import { Uri } from 'vscode';
import { AiIgnoreResolver } from '../../src/services/aiIgnoreResolver';

describe('AiIgnoreResolver (integration)', () => {
  it('resolves configuration in placeholder implementation', async () => {
    const resolver = new AiIgnoreResolver();
    const config = await resolver.parseAiIgnoreConfig(Uri.file('/tmp'));
    assert.ok(config);
    assert.strictEqual(config.patterns.length, 0);
  });
});
