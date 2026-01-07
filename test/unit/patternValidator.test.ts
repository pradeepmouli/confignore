/**
 * Unit tests for patternValidator
 */

import * as assert from 'assert';
import { validateAiIgnorePattern } from '../../src/services/patternValidator';

describe('patternValidator', () => {
  it('accepts basic glob patterns', () => {
    const result = validateAiIgnorePattern('src/**/*.ts');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.pattern, 'src/**/*.ts');
  });

  it('accepts negation patterns', () => {
    const result = validateAiIgnorePattern('!src/index.ts');
    assert.strictEqual(result.valid, true);
  });

  it('rejects empty patterns', () => {
    const result = validateAiIgnorePattern('   ');
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors && result.errors.length > 0);
  });

  it('rejects lone negation marker', () => {
    const result = validateAiIgnorePattern('!');
    assert.strictEqual(result.valid, false);
  });
});
