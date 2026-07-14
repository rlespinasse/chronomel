# Contributing to ChronoMEL

Thank you for helping improve ChronoMEL!

## How to Contribute

### Report a Bug

Open an [issue](https://github.com/rlespinasse/chronomel/issues) with:
- What you were doing
- What you expected to happen
- What actually happened
- Browser and OS version

### Suggest a Feature

Open a [discussion](https://github.com/rlespinasse/chronomel/discussions) or issue describing:
- The use case
- Why it would be valuable
- How you envision it working

### Submit a Fix or Feature

1. **Fork and branch:**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Set up locally:**
   ```bash
   npm install
   npm run dev  # Start dev server
   ```

3. **Make changes** following the code style (see below)

4. **Test locally:**
   ```bash
   npm run dev       # Verify in browser
   npm run build     # Test production build
   npm run lint      # Check code style
   npm run validate-config  # Check config validity
   ```

5. **Commit with clear messages:**
   ```bash
   git commit -m "feat: add new temporal layer"
   ```

6. **Push and open PR:**
   ```bash
   git push origin feature/my-feature
   ```

## Code Style

### TypeScript/JavaScript

- Use TypeScript for new source files (`src/`)
- JavaScript is OK for scripts (`scripts/`)
- Keep files focused and <300 lines
- Use functional style where possible
- Comment only non-obvious code

### Naming

- `myVariable` — camelCase for variables, functions
- `MyClass` — PascalCase for classes
- `MY_CONSTANT` — UPPER_SNAKE_CASE for constants
- File names: `kebab-case.js` or `kebab-case.ts`

### Comments

Only add comments for:
- **Why**, not what (code should be readable)
- Non-obvious algorithms or workarounds
- Important invariants

Bad:
```javascript
// Increment the counter
count++;
```

Good:
```javascript
// Temporal projection: skip buildings not yet built in this year
if (year < building.annee) continue;
```

## Documentation Style

Docs follow [Diataxis](https://diataxis.fr/) framework:

- **Tutorials** (`docs/tutorials/`) — Learn by doing, step-by-step
- **How-to** (`docs/how-to/`) — Task-focused, assume basic knowledge
- **Explanation** (`docs/explanation/`) — Conceptual, discuss trade-offs
- **Reference** (`docs/reference/`) — API lookups, schemas, precise info

When adding docs, choose the right category. Update the table of contents in `docs/README.md`.

## Configuration Changes

When modifying `src/config.ts`:

1. **Type it properly** — Use TypeScript types
2. **Document properties** — Add JSDoc comments
3. **Test it:**
   ```bash
   npm run validate-config  # Validate config syntax
   npm run dev              # Test in browser
   ```

## Testing

### Manual Testing

For UI changes:
1. `npm run dev`
2. Open http://localhost:5173
3. Test:
   - Layers toggle on/off
   - Tooltips appear on hover
   - Detail panels show on click
   - Timeline scrubbing works
   - Comparison mode switches

### Data Validation

For data/config changes:
```bash
npm run validate-config  # Check GeoJSON validity
npm run build           # Test production build
```

## Development Phases

ChronoMEL develops in phases:

- **Phase 1** (Complete): Core map + temporal framework
- **Phase 2** (Current): Refactoring for template compatibility
- **Phase 3** (Planned): Advanced temporal projections
- **Phase 4** (Planned): Performance optimization

If working on Phase 3+, coordinate first to avoid duplication.

## Pull Request Checklist

Before submitting:

- [ ] Code passes `npm run lint`
- [ ] Code passes `npm run build`
- [ ] `npm run validate-config` passes (if config changed)
- [ ] Tested in browser (if UI change)
- [ ] Commit messages are clear
- [ ] Documentation updated (if relevant)
- [ ] No breaking changes (explain if needed)

## Release Process

Maintainers only. Steps:

1. Create release branch: `release/v0.x.0`
2. Update version in `package.json`
3. Update `CHANGELOG.md` (if one exists)
4. Create PR with release notes
5. Merge to `main`
6. Create GitHub release tag
7. Deploy to GitHub Pages (automatic via Actions)

## License

All contributions licensed under MIT. By contributing, you agree that your work may be used under this license.

---

**Questions?** Open an issue or discussion.

**Thanks for contributing!** ✨
