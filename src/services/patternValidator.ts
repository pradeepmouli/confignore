/**
 * AI ignore pattern validation utilities.
 */

import { Minimatch } from 'minimatch';
import { PatternValidation } from '../models/types';

const MINIMATCH_OPTIONS = { dot: true } as const;

export function validateAiIgnorePattern(pattern: string): PatternValidation {
  const trimmed = pattern.trim();
  const errors: string[] = [];

  if (!trimmed) {
    errors.push('Pattern is empty');
    return { valid: false, pattern: '', errors };
  }

  if (trimmed === '!') {
    errors.push('Negation pattern must include a rule');
    return { valid: false, pattern: trimmed, errors };
  }

  try {
    const mm = new Minimatch(
      trimmed.startsWith('!') ? trimmed.slice(1) : trimmed,
      MINIMATCH_OPTIONS
    );
    mm.makeRe();
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Invalid glob pattern');
  }

  return {
    valid: errors.length === 0,
    pattern: trimmed,
    errors: errors.length ? errors : undefined
  };
}
