/**
 * Readers/Writers for config-based inclusion/exclusion
 */

import * as path from 'path';
import { Uri, window, workspace, WorkspaceFolder } from 'vscode';
import { fileExists, readJsonFile, writeJsonFile } from '../lib/fs';
import { getWorkspaceFolder, getWorkspaceRelativePath, normalizePath } from '../lib/patterns';
import { ConfigShape, EslintShape, PrettierShape, TsconfigShape } from '../models/types';

export interface TargetPaths {
  workspaceFolder: WorkspaceFolder;
  tsconfig?: string;
  eslintConfig?: string;
  prettierConfig?: string;
}

export async function detectConfigTargetsFor(uri: Uri): Promise<TargetPaths | undefined> {
  const wf = getWorkspaceFolder(uri);
  if (!wf) return undefined;
  const root = wf.uri.fsPath;

  const tsconfig = path.join(root, 'tsconfig.json');
  const eslintFiles = [
    path.join(root, '.eslintrc.json'),
  ];
  const prettierFiles = [
    path.join(root, '.prettierrc'),
    path.join(root, '.prettierrc.json'),
  ];

  const found: TargetPaths = { workspaceFolder: wf };
  if (await fileExists(tsconfig)) found.tsconfig = tsconfig;
  for (const f of eslintFiles) { if (!found.eslintConfig && await fileExists(f)) found.eslintConfig = f; }
  for (const f of prettierFiles) { if (!found.prettierConfig && await fileExists(f)) found.prettierConfig = f; }

  return found;
}

// -----------------------------
// TSCONFIG
// -----------------------------

export async function addToTsconfigExclude(filePath: string, items: Uri[]): Promise<boolean> {
  const config = await readJsonFile<TsconfigShape>(filePath);
  const wf = workspace.getWorkspaceFolder(Uri.file(filePath));
  if (!wf) return false;
  const exclude = new Set<string>(Array.isArray(config.exclude) ? config.exclude : []);

  for (const u of items) {
    const rel = getWorkspaceRelativePath(u, wf);
    if (!rel) continue;
    const isDir = (await workspace.fs.stat(u)).type & 2 /* Directory */;
    const pattern = isDir ? normalizePath(rel + '/**/*') : normalizePath(rel);
    exclude.add(pattern);
  }

  config.exclude = Array.from(exclude);
  await writeJsonFile(filePath, config);
  return true;
}

export async function removeFromTsconfigExclude(filePath: string, items: Uri[]): Promise<boolean> {
  const config = await readJsonFile<TsconfigShape>(filePath);
  if (!Array.isArray(config.exclude)) return false;
  const wf = workspace.getWorkspaceFolder(Uri.file(filePath));
  if (!wf) return false;
  const wanted = new Set<string>();
  for (const u of items) {
    const rel = getWorkspaceRelativePath(u, wf);
    if (!rel) continue;
    const isDir = (await workspace.fs.stat(u)).type & 2 /* Directory */;
    const pattern = isDir ? normalizePath(rel + '/**/*') : normalizePath(rel);
    wanted.add(pattern);
  }
  config.exclude = config.exclude.filter(p => !wanted.has(normalizePath(p)));
  await writeJsonFile(filePath, config);
  return true;
}

export async function tsconfigExcludes(filePath: string, relPath: string): Promise<boolean> {
  if (!await fileExists(filePath)) return false;
  try {
    const cfg = await readJsonFile<TsconfigShape>(filePath);
    const list = Array.isArray(cfg.exclude) ? cfg.exclude : [];
    const normalized = normalizePath(relPath);
    return list.some(p => normalizePath(p) === normalized);
  } catch {
    return false;
  }
}

// -----------------------------
// ESLINT (.eslintrc.json)
// -----------------------------

export async function addToEslintIgnore(filePath: string, items: Uri[]): Promise<boolean> {
  const cfg = await readJsonFile<EslintShape>(filePath);
  const wf = workspace.getWorkspaceFolder(Uri.file(filePath));
  if (!wf) return false;
  const arr = Array.isArray(cfg.ignorePatterns) ? cfg.ignorePatterns.slice() as (string|object)[] : [];
  const set = new Set<string>(arr.filter(x => typeof x === 'string') as string[]);
  for (const u of items) {
    const rel = getWorkspaceRelativePath(u, wf);
    if (!rel) continue;
    set.add(normalizePath(rel));
  }
  cfg.ignorePatterns = Array.from(set);
  await writeJsonFile(filePath, cfg);
  return true;
}

export async function removeFromEslintIgnore(filePath: string, items: Uri[]): Promise<boolean> {
  const cfg = await readJsonFile<EslintShape>(filePath);
  if (!Array.isArray(cfg.ignorePatterns)) return false;
  const wf = workspace.getWorkspaceFolder(Uri.file(filePath));
  if (!wf) return false;
  const remove = new Set<string>();
  for (const u of items) {
    const rel = getWorkspaceRelativePath(u, wf);
    if (!rel) continue;
    remove.add(normalizePath(rel));
  }
  cfg.ignorePatterns = (cfg.ignorePatterns as (string|object)[]).filter(x => typeof x !== 'string' || !remove.has(normalizePath(x)));
  await writeJsonFile(filePath, cfg);
  return true;
}

export async function eslintExcludes(filePath: string, relPath: string): Promise<boolean> {
  if (!await fileExists(filePath)) return false;
  try {
    const cfg = await readJsonFile<EslintShape>(filePath);
    const list = Array.isArray(cfg.ignorePatterns) ? (cfg.ignorePatterns as (string|object)[]).filter(x => typeof x === 'string') as string[] : [];
    return list.map(normalizePath).includes(normalizePath(relPath));
  } catch {
    return false;
  }
}

// -----------------------------
// PRETTIER (.prettierrc[.json])
// -----------------------------

export async function addToPrettierExcluded(filePath: string, items: Uri[]): Promise<boolean> {
  const cfg = await readJsonFile<PrettierShape>(filePath);
  const wf = workspace.getWorkspaceFolder(Uri.file(filePath));
  if (!wf) return false;
  const rels: string[] = [];
  for (const u of items) {
    const rel = getWorkspaceRelativePath(u, wf);
    if (!rel) continue;
    rels.push(normalizePath(rel));
  }
  const overrides = Array.isArray(cfg.overrides) ? cfg.overrides.slice() : [];
  // Find or create a catch-all override
  let any = overrides.find(o => !o.files);
  if (!any) { any = {}; overrides.push(any as any); }
  const excluded = new Set<string>(Array.isArray((any as any).excludedFiles) ? (any as any).excludedFiles as string[] : []);
  for (const r of rels) excluded.add(r);
  (any as any).excludedFiles = Array.from(excluded);
  cfg.overrides = overrides as any[];
  await writeJsonFile(filePath, cfg);
  return true;
}

export async function removeFromPrettierExcluded(filePath: string, items: Uri[]): Promise<boolean> {
  const cfg = await readJsonFile<PrettierShape>(filePath);
  const wf = workspace.getWorkspaceFolder(Uri.file(filePath));
  if (!wf) return false;
  if (!Array.isArray(cfg.overrides)) return false;
  const remove = new Set<string>();
  for (const u of items) {
    const rel = getWorkspaceRelativePath(u, wf);
    if (!rel) continue;
    remove.add(normalizePath(rel));
  }
  for (const ov of cfg.overrides) {
    const ex = (ov as any).excludedFiles as string[] | undefined;
    if (!Array.isArray(ex)) continue;
    (ov as any).excludedFiles = ex.filter(p => !remove.has(normalizePath(p)));
  }
  await writeJsonFile(filePath, cfg);
  return true;
}

export async function prettierExcludes(filePath: string, relPath: string): Promise<boolean> {
  if (!await fileExists(filePath)) return false;
  try {
    const cfg = await readJsonFile<PrettierShape>(filePath);
    const ex: string[] = [];
    if (Array.isArray(cfg.overrides)) {
      for (const ov of cfg.overrides) {
        const arr = (ov as any).excludedFiles as string[] | undefined;
        if (Array.isArray(arr)) ex.push(...arr);
      }
    }
    return ex.map(normalizePath).includes(normalizePath(relPath));
  } catch {
    return false;
  }
}

// -----------------------------
// Command helpers
// -----------------------------

export async function guardMissingConfig(filePath: string | undefined, name: string): Promise<boolean> {
  if (!filePath) {
    await window.showInformationMessage(`${name} config not found in this workspace.`);
    return false;
  }
  return true;
}
