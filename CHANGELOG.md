# Change Log

## 1.0.1 - 2026-06-22

### Fixed

- README: logo image now uses an absolute GitHub raw URL so it renders correctly on the npm registry page

## 1.0.0 - 2026-06-22

### Added

- Initial release: `printImage(image_path, vertical_percent, maintain_aspect_ratio)` renders images in the terminal using ANSI true-color and Unicode half-block characters (`▀`)
- Supports local file paths and URLs via `jimp`
- Doubles effective vertical resolution by mapping two pixel rows per terminal character row (top pixel → foreground, bottom pixel → background)
- Transparent pixel handling (alpha < 128) as spaces or single-color half-blocks
