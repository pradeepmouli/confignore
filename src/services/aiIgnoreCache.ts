/**
 * Two-tier cache for AI ignore evaluation results.
 */

export type CacheLevel = 'file' | 'workspace';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface CacheOptions {
  fileTtlMs?: number;
  workspaceTtlMs?: number;
}

export class AiIgnoreCache<TFile = unknown, TWorkspace = unknown> {
  private readonly fileTtl: number;
  private readonly workspaceTtl: number;
  private readonly fileCache = new Map<string, CacheEntry<TFile>>();
  private readonly workspaceCache = new Map<string, CacheEntry<TWorkspace>>();

  constructor(options?: CacheOptions) {
    this.fileTtl = options?.fileTtlMs ?? 30_000;
    this.workspaceTtl = options?.workspaceTtlMs ?? 60_000;
  }

  public getFile(key: string): TFile | undefined {
    return this.read(this.fileCache, key);
  }

  public setFile(key: string, value: TFile, ttlMs?: number): void {
    this.write(this.fileCache, key, value, ttlMs ?? this.fileTtl);
  }

  public getWorkspace(key: string): TWorkspace | undefined {
    return this.read(this.workspaceCache, key);
  }

  public setWorkspace(key: string, value: TWorkspace, ttlMs?: number): void {
    this.write(this.workspaceCache, key, value, ttlMs ?? this.workspaceTtl);
  }

  public invalidate(level: CacheLevel, keyPrefix?: string): void {
    if (level === 'file') {
      this.clearMap(this.fileCache, keyPrefix);
      return;
    }

    this.clearMap(this.workspaceCache, keyPrefix);
    // Cascade: workspace changes invalidate file-level cache
    this.clearMap(this.fileCache, keyPrefix);
  }

  public clear(): void {
    this.fileCache.clear();
    this.workspaceCache.clear();
  }

  private read<TValue>(map: Map<string, CacheEntry<TValue>>, key: string): TValue | undefined {
    const entry = map.get(key);
    if (!entry) {
      return undefined;
    }
    if (Date.now() > entry.expiresAt) {
      map.delete(key);
      return undefined;
    }
    return entry.value;
  }

  private write<TValue>(
    map: Map<string, CacheEntry<TValue>>,
    key: string,
    value: TValue,
    ttlMs: number
  ): void {
    const expiresAt = Date.now() + ttlMs;
    map.set(key, { value, expiresAt });
  }

  private clearMap<TValue>(map: Map<string, CacheEntry<TValue>>, keyPrefix?: string): void {
    if (!keyPrefix) {
      map.clear();
      return;
    }
    for (const key of map.keys()) {
      if (key.startsWith(keyPrefix)) {
        map.delete(key);
      }
    }
  }
}
