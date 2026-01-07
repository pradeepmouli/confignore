/**
 * FileSystemWatcher integration for AI ignore configs with cache invalidation.
 */

import * as vscode from 'vscode';
import { EventEmitter, Uri } from 'vscode';
import { AiIgnoreCache } from './aiIgnoreCache';

export type WatcherFactory = (globPattern: vscode.GlobPattern) => vscode.FileSystemWatcher;

const DEFAULT_FACTORY: WatcherFactory = (glob) => vscode.workspace.createFileSystemWatcher(glob);

interface ConfigWatcherOptions {
  workspaceUri: Uri;
  cache?: AiIgnoreCache<unknown, unknown>;
  onConfigChanged?: (uri: Uri) => void | Promise<void>;
  factory?: WatcherFactory;
}

export class ConfigWatcher implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[] = [];
  private readonly emitter = new EventEmitter<Uri>();
  private readonly cache?: AiIgnoreCache<unknown, unknown>;
  private readonly onConfigChanged?: (uri: Uri) => void | Promise<void>;

  public constructor(options: ConfigWatcherOptions) {
    this.cache = options.cache;
    this.onConfigChanged = options.onConfigChanged;
    const factory = options.factory ?? DEFAULT_FACTORY;
    const patterns: vscode.GlobPattern[] = [
      new vscode.RelativePattern(options.workspaceUri.fsPath, '.vscode/settings.json'),
      new vscode.RelativePattern(options.workspaceUri.fsPath, '.claude/settings.json'),
      new vscode.RelativePattern(options.workspaceUri.fsPath, '.aiexclude')
    ];

    for (const pattern of patterns) {
      this.registerWatcher(factory(pattern));
    }
  }

  public get onDidChange(): vscode.Event<Uri> {
    return this.emitter.event;
  }

  public dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.emitter.dispose();
  }

  private registerWatcher(watcher: vscode.FileSystemWatcher): void {
    const handler = (uri: Uri) => this.handleChange(uri);
    this.disposables.push(
      watcher,
      watcher.onDidChange(handler),
      watcher.onDidCreate(handler),
      watcher.onDidDelete(handler)
    );
  }

  private handleChange(uri: Uri): void {
    if (this.cache) {
      this.cache.invalidate('workspace');
    }
    if (this.onConfigChanged) {
      void this.onConfigChanged(uri);
    }
    this.emitter.fire(uri);
  }
}
