# Quickstart: Ignore visibility and config updates

## Try it locally

1. Enable the experimental feature: Set `ignorer.features.includeSupport` to `true` in VS Code settings (or JSON)
2. Reload the VS Code window (Ctrl+R or Cmd+R)
3. Run the watch tasks (already configured):
   - Build: Tasks → watch (tsc + esbuild watchers)
   - Optional: tests watcher
4. Open a workspace with a `tsconfig.json`, `.prettierrc` or `.eslintrc.*` and relevant ignore files.
5. Select a file/folder and open the context menu in Explorer.
6. Observe menu visibility:
   - If excluded by a supported source → "Include" visible, "Ignore" hidden.
   - If not excluded → "Ignore" visible, "Include" hidden.
7. Use "tsconfig ..." exclude to update `tsconfig.json` (only if present). Use "Include" to remove exclusions.

## Notes
- Precedence: config-based excludes > project ignore files > workspace settings.
- Missing config files: actions are hidden/not offered (no auto-create).
- Multi-root: behavior scoped to the selection’s workspace folder.
