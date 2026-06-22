# cli-print-img

## Overview

ESM library (`@shriyanss/cli-print-img`) that renders images in the terminal using the best available protocol for the current terminal. Exports `printImage()` and `detectRenderer()`.

## Entry point

`index.js` — exports `printImage(image_path, vertical_percent, maintain_aspect_ratio, min_char_rows, renderer)` and re-exports `detectRenderer()`.

## File structure

```
index.js          — sizing logic, renderer dispatch, public API
detect.js         — terminal auto-detection (env vars → renderer name)
renderers/
  kitty.js        — Kitty Graphics Protocol (PNG, char-cell dims)
  iterm2.js       — iTerm2 Inline Images Protocol (PNG, char-cell dims)
  halfblock.js    — ANSI half-block fallback (Jimp resize + ▀ chars)
```

## Renderer priority

1. **kitty** — Kitty (`KITTY_WINDOW_ID`), Ghostty (`TERM_PROGRAM=ghostty`). Full-resolution PNG via APC sequences. Highest quality.
2. **iterm2** — iTerm2 (`TERM_PROGRAM=iTerm.app`), WezTerm (`TERM_PROGRAM=WezTerm`). PNG via OSC 1337. High quality.
3. **halfblock** — All other terminals (tmux forces this regardless of outer terminal). Unicode `▀` half-blocks with 24-bit ANSI color. Universal.

## Renderer API

All renderers take `(source, target_cols, ...)`:
- `renderKitty(image_path, target_cols, target_char_rows)` — sync
- `renderIterm2(image_path, target_cols, target_char_rows)` — sync
- `renderHalfblock(jimp_image, target_cols, target_pixel_rows)` — sync; takes pre-read Jimp object to avoid a second disk read

Sizing (`target_cols`, `target_char_rows`) is computed in `index.js` using `CHAR_ASPECT=1.0` (2 pixel rows per char row makes half-block cells effectively square). The same dimensions are passed to native protocols, which handle their own high-quality scaling.

## Adding a renderer

1. Create `renderers/<name>.js` with `export function render<Name>(image_path, target_cols, target_char_rows)`.
2. Add detection to `detect.js`.
3. Add dispatch branch in `index.js`.

## Naming conventions

- kebab-case filenames; snake_case identifiers.
- Public export `printImage` and `detectRenderer` keep camelCase as the user-facing API.

## Dependencies

- [`jimp`](https://github.com/jimp-dev/jimp) — image reading, resizing, pixel access (halfblock renderer + sizing).

## Release process

Same structure as `js-recon`. CI pipeline (`publish.yml`) triggers on GitHub release creation, checks that `package.json` version == top `CHANGELOG.md` version == release tag (after stripping `v`), runs audit + test, then publishes to npm. The `merge_main_and_dev` job merges main back into dev after publish.

### Steps

1. **Bump version** — update `version` in `package.json`. Pick `major.minor.patch` (semver): new features → minor, fixes → patch.

2. **Update CHANGELOG** — prepend a new `## <version> - <YYYY-MM-DD>` section with `### Added`, `### Changed`, `### Fixed` sub-sections as needed.

3. **Commit and push** to `dev`:
   ```bash
   git add package.json CHANGELOG.md <other changed files>
   git commit -m "feat: <summary>"
   git push origin dev
   ```

4. **Open PR** `dev → main`:
   ```bash
   gh pr create --repo shriyanss/cli-print-img \
     --head dev --base main \
     --title "v<version>" \
     --body "<CHANGELOG section for this version>"
   ```

5. **Monitor CI** — `gh pr checks <pr-number> --repo shriyanss/cli-print-img`. Do NOT merge without user approval.

6. **Create GitHub release** — after PR is merged:
   ```bash
   gh release create v<version> \
     --repo shriyanss/cli-print-img \
     --title "v<version>" \
     --notes "<CHANGELOG section>" \
     --latest   # omit for alpha/beta; add only for stable releases
   ```

7. **Wait for npm publish** — `gh run list --repo shriyanss/cli-print-img`. Confirm package is live before updating consumers.

8. **Update consumers** — e.g. in `js-recon`: `npm install @shriyanss/cli-print-img@<version>`, rebuild, and commit.
