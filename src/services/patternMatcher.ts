/**
 * Pattern matcher for AI ignore rules.
 */

import { Minimatch } from 'minimatch';
import { AiIgnorePattern } from '../models/types';
import { normalizePath } from '../lib/patterns';

const MINIMATCH_OPTIONS = { dot: true } as const;

export function evaluatePatterns(
  filePath: string,
  patterns: AiIgnorePattern[]
): { ignored: boolean; matchedPatterns: AiIgnorePattern[] } {
  const normalizedPath = normalizePath(filePath);
  let ignored = false;
  const matched: AiIgnorePattern[] = [];

  for (const rawPattern of patterns) {
    const trimmed = rawPattern.trim();
    if (!trimmed) {
      continue;
    }

    const isNegated = trimmed.startsWith('!');
    const pattern = isNegated ? trimmed.slice(1) : trimmed;
    const mm = new Minimatch(pattern, MINIMATCH_OPTIONS);
    if (mm.match(normalizedPath)) {
      ignored = !isNegated;
      matched.push(trimmed);
    }
  }

  return { ignored, matchedPatterns: matched };
}

export function matchFileAgainstPatterns(filePath: string, patterns: AiIgnorePattern[]): boolean {
  return evaluatePatterns(filePath, patterns).ignored;
}
