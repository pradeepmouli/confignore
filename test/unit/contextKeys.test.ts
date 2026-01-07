/**
 * Unit tests for contextKeys
 */

import * as assert from 'assert';
import { Uri } from 'vscode';
import { EffectiveState, Source } from '../../src/models/types';
import { clearContextKeys, updateContextKeys } from '../../src/services/contextKeys';

suite('ContextKeys Unit Tests', () => {
  test('updateContextKeys accepts valid EffectiveState', async () => {
    const state: EffectiveState = {
      path: Uri.file('/test/file.txt'),
      excluded: true,
      mixed: false,
      source: Source.IgnoreFileGit,
      sourcesApplied: [Source.IgnoreFileGit]
    };

    // Should not throw
    await updateContextKeys(state);
    assert.ok(true);
  });

  test('clearContextKeys runs without error', async () => {
    // Should not throw
    await clearContextKeys();
    assert.ok(true);
  });

  // Context key values are set via VS Code commands; testing actual values
  // would require integration tests with the VS Code API
});
