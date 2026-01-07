# Change Log

All notable changes to the "confignore" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

### Added

- Visual icon ($(exclude)) to "Add to Ignore" submenu for better discoverability
- Quick pick enhancements: icons, detailed descriptions for each ignore file type
- Enhanced status messages with "View File" action button to immediately view changes
- First-run welcome message with "Learn More" link for new users
- Duplicate pattern detection with intelligent normalization (treats `./temp/`, `temp`, `temp/` as duplicates)
- User-friendly error messages with actionable information
- Confirmation dialog for mixed-state selections (when some files are already ignored)
- Structured logging with severity levels (INFO, SUCCESS, WARNING, ERROR) in output channel
- Configuration settings:
  - `confignore.defaultIgnoreFile`: Set preferred default ignore file
  - `confignore.confirmMixedState`: Control confirmation dialogs (default: true)
  - `confignore.checkDuplicates`: Enable duplicate detection (default: true)

### Changed

- Debounced state updates (500ms) for relevant file changes only, improving performance
- Status messages now show duplicate skip count when patterns already exist
- Error handling now provides context-specific, user-friendly messages

### Fixed

- Performance optimization: state updates now only trigger for relevant configuration file changes
- Duplicate patterns are now properly detected across different formats

## [0.0.3] - 2025-11-04

### Added

- Smart menu visibility based on effective exclusion state
  - Hides "Ignore" actions when selection is already excluded
  - Shows "Include" action when selection is excluded
- Config-based exclusion support:
  - tsconfig.json (exclude array)
  - .eslintrc.json (ignorePatterns)
  - .prettierrc / .prettierrc.json (overrides excludedFiles)
- New "Include" command to remove selections from config-based exclusions
- Context keys for menu visibility (`confignore.selectionExcluded`, `confignore.selectionMixed`)
- State resolver service to evaluate effective exclusion across sources
- Precedence system: config-based excludes > project ignore files > workspace settings
- Output channel logging for debugging state changes
- Enhanced pattern matching for nested paths and glob patterns with `**`

### Changed

- Menu structure updated to conditionally show actions based on selection state
- Multi-selection handling improved to detect mixed states

### Fixed

- Pattern matching now properly handles `**` glob patterns for nested directories
- Multi-selection aggregates sources correctly across all selected items

## [0.0.2]

### Added

- Explorer submenu for ignore targets
- Quick Pick command for selecting ignore files
- Multi-root workspace support

## [0.0.1]

### Added

- Initial release with basic ignore file support
