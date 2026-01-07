# GitHub Actions Setup

This repository uses GitHub Actions for CI/CD automation.

## Workflows

### 1. CI (`.github/workflows/ci.yml`)

**Trigger:** Push to any branch or pull request
**Purpose:** Runs build, type-check, lint, and tests

**Matrix:** Node.js 20.x and 22.x

**Steps:**

- Checkout code
- Install dependencies
- Run type checking (`npm run check-types`)
- Run linting (`npm run lint`)
- Build extension (`npm run compile`)
- Run tests (`npm test`)

### 2. Release (`.github/workflows/release.yml`)

**Trigger:** Pushed version tags (`v*.*.*`)
**Purpose:** Creates GitHub releases with packaged extension

**Steps:**

- Checkout code
- Build extension
- Package as `.vsix` using `@vscode/vsce`
- Extract changelog notes for the version
- Create GitHub release with `.vsix` artifact

### 3. Publish (`.github/workflows/publish.yml`)

**Trigger:** GitHub release published
**Purpose:** Publishes extension to VS Code Marketplace and Open VSX Registry

**Steps:**

- Checkout code
- Build extension
- Publish to VS Code Marketplace using `VSCE_PAT`
- Publish to Open VSX Registry using `OVSX_PAT` (optional)

## Required GitHub Secrets

Configure these secrets in your repository settings (Settings → Secrets and variables → Actions):

### `VSCE_PAT` (Required)

**Purpose:** Publish to VS Code Marketplace

**Setup:**

1. Go to https://dev.azure.com/[your-org]/_usersSettings/tokens
2. Create a new Personal Access Token with:
   - **Organization:** All accessible organizations
   - **Scopes:** Marketplace → Manage
3. Copy the token
4. Add to GitHub repo: Settings → Secrets → New repository secret
   - Name: `VSCE_PAT`
   - Value: [your token]

**Reference:** https://code.visualstudio.com/api/working-with-extensions/publishing-extension#get-a-personal-access-token

### `OVSX_PAT` (Optional)

**Purpose:** Publish to Open VSX Registry (for VS Codium, Eclipse Che, etc.)

**Setup:**

1. Create account at https://open-vsx.org/
2. Generate access token at https://open-vsx.org/user-settings/tokens
3. Add to GitHub repo: Settings → Secrets → New repository secret
   - Name: `OVSX_PAT`
   - Value: [your token]

**Reference:** https://github.com/eclipse/openvsx/wiki/Publishing-Extensions

## Release Process

### Creating a Release

1. **Update version** in `package.json`:

   ```bash
   npm version patch  # or minor, major
   ```

2. **Update CHANGELOG.md** with release notes

3. **Commit changes**:

   ```bash
   git add package.json CHANGELOG.md
   git commit -m "chore: bump version to X.Y.Z"
   ```

4. **Push with tags**:

   ```bash
   git push origin main --follow-tags
   ```

5. **GitHub Actions will automatically**:
   - Create GitHub release with `.vsix` file
   - Publish to VS Code Marketplace (when release is published)
   - Publish to Open VSX Registry (if `OVSX_PAT` is configured)

### Manual Publishing

If needed, you can publish manually:

```bash
# Package extension
npm run vsce:package

# Publish to marketplace
npm run vsce:publish
```

**Note:** Manual publishing requires `VSCE_PAT` environment variable:

```bash
export VSCE_PAT=your-token-here
npm run vsce:publish
```

## Troubleshooting

### Publishing fails with "Authentication failed"

- Verify `VSCE_PAT` secret is correctly set in GitHub repo settings
- Check token hasn't expired (Azure DevOps tokens expire after 1 year by default)
- Ensure token has "Marketplace (Manage)" scope

### Release workflow doesn't trigger

- Ensure tag follows `v*.*.*` format (e.g., `v0.0.3`)
- Push tags with `git push --follow-tags` or `git push origin v0.0.3`

### VSIX file missing from release

- Check release workflow logs in Actions tab
- Ensure build completes successfully before packaging

## Testing Workflows Locally

You can test workflows locally using [act](https://github.com/nektos/act):

```bash
# Install act
brew install act

# Test CI workflow
act push

# Test release workflow (requires tag)
act -j create-release --secret GITHUB_TOKEN=your-token
```
