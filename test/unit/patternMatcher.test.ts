/**
 * Unit tests for patternMatcher
 */

import * as assert from 'assert';
import { matchFileAgainstPatterns } from '../../src/services/patternMatcher';

describe('patternMatcher', () => {
  it('matches simple glob', () => {
    const ignored = matchFileAgainstPatterns('src/file.ts', ['src/**/*.ts']);
    assert.strictEqual(ignored, true);
  });

  it('respects negation to unignore', () => {
    const patterns = ['src/**', '!src/include.ts'];
    assert.strictEqual(matchFileAgainstPatterns('src/include.ts', patterns), false);
    assert.strictEqual(matchFileAgainstPatterns('src/other.ts', patterns), true);
  });

  it('returns false when no patterns match', () => {
    const ignored = matchFileAgainstPatterns('readme.md', ['src/**']);
    assert.strictEqual(ignored, false);
  });
});
