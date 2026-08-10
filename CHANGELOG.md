# Change Log

## 1.1.1 - 2026-08-10

### Fixed

- Kitty Graphics Protocol renderer sent both `c` (columns) and `r` (rows) in the same escape sequence, which stretches the image to exactly fill that cell box instead of preserving its aspect ratio — producing a visibly distorted logo in Kitty/Ghostty. Only `c` is now sent, letting the terminal auto-compute rows from the image's real aspect ratio (matching how the iTerm2 renderer already uses `preserveAspectRatio=1`).
- The Kitty renderer also suppressed cursor movement (`C=1`) and unconditionally advanced a single line afterward, which assumed a fixed, known row count. Now uses the protocol default (`C=0`) so the terminal itself advances the cursor by however many rows the image actually rendered, fixing overlap with subsequent output.

## 1.1.0 - 2026-06-22

### Added

- Multi-protocol terminal image rendering: auto-detects the best available method and uses it — Kitty Graphics Protocol, iTerm2 Inline Images, or ANSI half-block fallback
- `detectRenderer()` export: returns the renderer name that will be used (`'kitty'`, `'iterm2'`, or `'halfblock'`)
- `renderer` parameter on `printImage()` to override auto-detection (`printImage(path, 45, true, 20, 'kitty')`)
- `min_char_rows` parameter on `printImage()` (default 20): enforces a minimum image height in character rows so nearest-neighbor rendering stays sharp on short terminals

### Changed

- `printImage()` now dispatches to a Kitty or iTerm2 renderer when the terminal supports it, giving pixel-perfect full-resolution output in those terminals; falls back to ANSI half-block otherwise
- Kitty and iTerm2 renderers send the original PNG file and delegate scaling to the terminal, avoiding quality loss from pre-resizing
- Refactored into `detect.js` + `renderers/halfblock.js`, `renderers/kitty.js`, `renderers/iterm2.js` for maintainability

## 1.0.1 - 2026-06-22

### Fixed

- README: logo image now uses an absolute GitHub raw URL so it renders correctly on the npm registry page

## 1.0.0 - 2026-06-22

### Added

- Initial release: `printImage(image_path, vertical_percent, maintain_aspect_ratio)` renders images in the terminal using ANSI true-color and Unicode half-block characters (`▀`)
- Supports local file paths and URLs via `jimp`
- Doubles effective vertical resolution by mapping two pixel rows per terminal character row (top pixel → foreground, bottom pixel → background)
- Transparent pixel handling (alpha < 128) as spaces or single-color half-blocks
