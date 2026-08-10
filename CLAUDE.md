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

- `renderKitty(image_path, target_cols)` — sync; only `c` (columns) is sent to Kitty, letting the terminal auto-compute rows from the image's real aspect ratio (specifying both `c` and `r` stretches/distorts the image) and use default cursor movement (`C=0`) so it advances past the actual rendered height
- `renderIterm2(image_path, target_cols, target_char_rows)` — sync
- `renderHalfblock(jimp_image, target_cols, target_pixel_rows)` — sync; takes pre-read Jimp object to avoid a second disk read

Sizing (`target_cols`, `target_char_rows`) is computed in `index.js` using `CHAR_ASPECT=1.0` (2 pixel rows per char row makes half-block cells effectively square). Kitty receives only `target_cols`; iTerm2 receives both `target_cols` and `target_char_rows`; halfblock receives `target_cols` and `target_pixel_rows`.

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

Same three-phase structure as `js-recon`: automated (Claude can do this end-to-end) → human-only npm 2FA approval → done. CI pipeline (`publish.yml`) triggers on GitHub release creation, checks that `package.json` version == top `CHANGELOG.md` version == release tag (after stripping `v`), runs audit + test, then **stages** the release to npm via OIDC trusted publishing (`npm stage publish` — no token). The `merge_main_and_dev` job merges main back into dev after the stage step completes.

npm's OIDC trusted publishing requires the package's Trusted Publisher to be configured on npmjs.com once, linking `@shriyanss/cli-print-img` to the `shriyanss/cli-print-img` repo + `publish.yml` workflow, with the "npm stage publish" allowed action enabled (not "npm publish" — this workflow only ever stages). Without it, `npm stage publish` fails with an authorization error. `package.json`'s `repository.url` must also match the GitHub repo exactly — trusted publishing verifies the two against each other.

### Automated steps (Claude does this end-to-end)

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

7. **Wait for npm stage publish** — `gh run list --repo shriyanss/cli-print-img`. This stages the release; it is not yet live.

### Human-only (cannot be scripted or delegated)

8. **Approve the staged release** — npm's staged-publish approval always requires interactive 2FA:
    - Find the stage id: `npm stage list @shriyanss/cli-print-img` (or the "Staged Packages" tab on npmjs.com)
    - Approve it: `npm stage approve <stage-id>` (prompts for 2FA), or click "Approve" on npmjs.com
    - Confirm it's live: `npm view @shriyanss/cli-print-img@<version>`

### Automated (after the user confirms the package is live)

9. **Update consumers** — e.g. in `js-recon`: `npm install @shriyanss/cli-print-img@<version>`, rebuild, and commit.
