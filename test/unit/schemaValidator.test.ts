/**
 * Unit tests for schemaValidator
 */

import * as assert from 'assert';
import { validateSettingsObject } from '../../src/lib/schemaValidator';
import { Errors } from '../../src/strings/errors';

describe('schemaValidator', () => {
  it('passes valid aiIgnore array', () => {
    const result = validateSettingsObject({
      'confignore.aiIgnore': ['*.env', 'secrets/**'],
      'confignore.checkDuplicates': true
    });
    assert.strictEqual(result.valid, true);
    assert.deepStrictEqual(result.errors, []);
  });

  it('fails non-array aiIgnore', () => {
    const result = validateSettingsObject({ 'confignore.aiIgnore': 'not-an-array' });
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.includes(Errors.missingArray));
  });

  it('fails empty and non-string patterns with unknown keys flagged', () => {
    const result = validateSettingsObject({
      'confignore.aiIgnore': ['', 123],
      'confignore.custom': true
    });
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('<empty>')));
    assert.ok(result.errors.some((e) => e.includes('Pattern must be a string')));
    assert.ok(result.errors.some((e) => e.includes('confignore.custom')));
  });
});
