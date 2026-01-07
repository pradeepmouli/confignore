/**
 * Error message templates for AI ignore flows.
 */

export const Errors = {
  invalidPattern: (pattern: string, reason: string): string =>
    `Invalid AI ignore pattern: ${pattern} - ${reason}`,
  agentConfigRead: (file: string, error: string): string =>
    `Failed to read agent config: ${file} - ${error}`,
  partialLoad: (count: number): string =>
    `AI ignore config partially loaded: ${count} patterns invalid`,
  noConfig: 'No AI ignore configuration detected',
  parseSettings: (file: string, error: string): string =>
    `Failed to parse settings: ${file} - ${error}`,
  unknownSetting: (key: string): string => `Unknown Confignore setting: ${key}`,
  missingArray: 'confignore.aiIgnore must be an array of strings'
};
