/**
 * Integration tests for ConfigWatcher
 */

import * as assert from 'assert';
import { EventEmitter, RelativePattern, Uri } from 'vscode';
import type { FileSystemWatcher } from 'vscode';
import { AiIgnoreCache } from '../../src/services/aiIgnoreCache';
import { ConfigWatcher, WatcherFactory } from '../../src/services/configWatcher';

class TestWatcher implements FileSystemWatcher {
  public readonly ignoreCreateEvents = false;
  public readonly ignoreChangeEvents = false;
  public readonly ignoreDeleteEvents = false;
  public readonly pattern: RelativePattern;
  private readonly changeEmitter = new EventEmitter<Uri>();
  private readonly createEmitter = new EventEmitter<Uri>();
  private readonly deleteEmitter = new EventEmitter<Uri>();

  public constructor(pattern: RelativePattern) {
    this.pattern = pattern;
  }

  public get onDidChange() {
    return this.changeEmitter.event;
  }

  public get onDidCreate() {
    return this.createEmitter.event;
  }

  public get onDidDelete() {
    return this.deleteEmitter.event;
  }

  public emitChange(uri: Uri): void {
    this.changeEmitter.fire(uri);
  }

  public emitCreate(uri: Uri): void {
    this.createEmitter.fire(uri);
  }

  public emitDelete(uri: Uri): void {
    this.deleteEmitter.fire(uri);
  }

  public dispose(): void {
    this.changeEmitter.dispose();
    this.createEmitter.dispose();
    this.deleteEmitter.dispose();
  }
}

describe('ConfigWatcher', () => {
  it('invalidates caches and forwards change callbacks', () => {
    const workspaceUri = Uri.file('/workspace');
    const cache = new AiIgnoreCache<string, string>();
    cache.setWorkspace('ws:/workspace', 'config');
    const triggered: Uri[] = [];
    const watchers: TestWatcher[] = [];
    const factory: WatcherFactory = (pattern) => {
      const watcher = new TestWatcher(pattern as RelativePattern);
      watchers.push(watcher);
      return watcher;
    };

    const watcher = new ConfigWatcher({
      workspaceUri,
      cache,
      onConfigChanged: (uri) => {
        triggered.push(uri);
      },
      factory
    });

    const settingsUri = Uri.joinPath(workspaceUri, '.vscode', 'settings.json');
    watchers[0].emitChange(settingsUri);

    assert.strictEqual(cache.getWorkspace('ws:/workspace'), undefined);
    assert.deepStrictEqual(triggered, [settingsUri]);
    watcher.dispose();
  });

  it('emits change events to listeners and isolates workspaces', () => {
    const workspaceOne = Uri.file('/workspace-one');
    const workspaceTwo = Uri.file('/workspace-two');
    const cacheOne = new AiIgnoreCache<string, string>();
    const cacheTwo = new AiIgnoreCache<string, string>();
    cacheOne.setWorkspace('ws:/one', 'config');
    cacheTwo.setWorkspace('ws:/two', 'config');

    const watchersOne: TestWatcher[] = [];
    const watcherOne = new ConfigWatcher({
      workspaceUri: workspaceOne,
      cache: cacheOne,
      factory: (pattern) => {
        const watcher = new TestWatcher(pattern as RelativePattern);
        watchersOne.push(watcher);
        return watcher;
      }
    });

    const watchersTwo: TestWatcher[] = [];
    const watcherTwo = new ConfigWatcher({
      workspaceUri: workspaceTwo,
      cache: cacheTwo,
      factory: (pattern) => {
        const watcher = new TestWatcher(pattern as RelativePattern);
        watchersTwo.push(watcher);
        return watcher;
      }
    });

    const eventsOne: Uri[] = [];
    const subscription = watcherOne.onDidChange((uri) => eventsOne.push(uri));

    const claudeUri = Uri.joinPath(workspaceOne, '.claude', 'settings.json');
    watchersOne[1].emitCreate(claudeUri);

    assert.strictEqual(cacheOne.getWorkspace('ws:/one'), undefined);
    assert.strictEqual(cacheTwo.getWorkspace('ws:/two'), 'config');
    assert.deepStrictEqual(eventsOne, [claudeUri]);

    subscription.dispose();
    watcherOne.dispose();
    watcherTwo.dispose();
  });
});
