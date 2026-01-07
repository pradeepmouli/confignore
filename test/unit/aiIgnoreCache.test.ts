/**
 * Unit tests for AiIgnoreCache
 */

import * as assert from 'assert';
import { AiIgnoreCache } from '../../src/services/aiIgnoreCache';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('AiIgnoreCache', () => {
  it('returns undefined on cache miss', () => {
    const cache = new AiIgnoreCache<string, string>();
    assert.strictEqual(cache.getFile('missing'), undefined);
  });

  it('stores and retrieves file-level entries', () => {
    const cache = new AiIgnoreCache<string, string>();
    cache.setFile('file:/a', 'hit');
    assert.strictEqual(cache.getFile('file:/a'), 'hit');
  });

  it('expires entries based on TTL', async () => {
    const cache = new AiIgnoreCache<string, string>({ fileTtlMs: 10 });
    cache.setFile('file:/a', 'temp');
    await delay(20);
    assert.strictEqual(cache.getFile('file:/a'), undefined);
  });

  it('cascades invalidation from workspace to file cache', () => {
    const cache = new AiIgnoreCache<string, string>();
    cache.setWorkspace('ws:/root', 'config');
    cache.setFile('ws:/root:file:/a', 'hit');
    cache.invalidate('workspace', 'ws:/root');
    assert.strictEqual(cache.getWorkspace('ws:/root'), undefined);
    assert.strictEqual(cache.getFile('ws:/root:file:/a'), undefined);
  });

  it('selectively invalidates entries by prefix', () => {
    const cache = new AiIgnoreCache<string, string>();
    cache.setFile('ws:/one:file:/a', 'one');
    cache.setFile('ws:/two:file:/a', 'two');
    cache.invalidate('file', 'ws:/one');
    assert.strictEqual(cache.getFile('ws:/one:file:/a'), undefined);
    assert.strictEqual(cache.getFile('ws:/two:file:/a'), 'two');
  });
});
