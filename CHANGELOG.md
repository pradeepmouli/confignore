# Change Log

All notable changes to the "confignore" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

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