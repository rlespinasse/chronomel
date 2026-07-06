# How to Deploy to GitHub Pages

ChronoMEL is designed for GitHub Pages deployment with automatic builds.

## Prerequisites

- Repository forked to your GitHub account
- GitHub Actions enabled (default)
- Custom domain (optional)

## Deployment Steps

### 1. Configure Base URL

The app is served under `/chronomel/` on GitHub Pages.

This is already configured in `vite.config.js`:

```javascript
base: mode === 'production' ? '/chronomel/' : '/',
```

If you fork with a different repo name, update it:

```javascript
base: mode === 'production' ? '/your-repo-name/' : '/',
```

### 2. Enable GitHub Pages

1. Go to repository **Settings** → **Pages**
2. Under "Build and deployment", select:
   - Source: **GitHub Actions**
3. Save

### 3. Automated Deployment

The CI/CD pipeline (`.github/workflows/deploy.yml`) automatically:

1. **Builds on every push** to `main` branch
2. **Runs linting** (`npm run lint`)
3. **Builds production** (`npm run build`)
4. **Deploys to GitHub Pages**

**Status:** Check the "Actions" tab in your repository to monitor builds.

### 4. View Your Site

After the first build completes (2-3 minutes):

- Default: `https://yourusername.github.io/chronomel/`
- Custom domain: Configure in Settings → Pages

## Custom Domain

To use your own domain:

1. **Settings** → **Pages** → "Custom domain"
2. Enter your domain (e.g., `maps.example.com`)
3. Create a **CNAME** file in DNS pointing to `yourusername.github.io`
4. GitHub will verify and enable HTTPS

Then update `vite.config.js`:

```javascript
base: '/chronomel/',  // Same path structure, but https://your-domain.com/chronomel/
```

## Manual Deployment (if CI/CD fails)

```bash
npm run build
gh pages deploy dist --source-dir dist
```

Requires `gh` CLI installed.

## Data Refresh

Monthly data refresh is automated via `.github/workflows/refresh-data.yml`:

- Runs first day of month at 2 AM UTC
- Updates orthophoto layers
- Commits changes and triggers deploy

To run manually:

```bash
npm run refresh-data  # If you have local setup
```

## Troubleshooting

**Build fails?**

Check the Actions log:
1. Go to **Actions** tab
2. Find the failed workflow run
3. Click to see error output
4. Usually missing dependencies or syntax errors

**Pages not updating after push?**

- Wait 2-3 minutes for action to complete
- Force refresh browser (Ctrl+F5)
- Check Actions tab for status

**Base URL causing 404s?**

All asset paths should be relative. If you see 404s for CSS/JS:

```javascript
vite.config.js:
base: '/your-actual-repo-name/',
```

Must match your repository name exactly.

---

See also:
- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [CI/CD Configuration](.github/workflows/deploy.yml)
