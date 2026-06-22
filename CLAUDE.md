# cli-print-img

## Overview

ESM library (`@shriyanss/cli-print-img`) that renders images in the terminal using ANSI true-color and Unicode half-block characters. The single exported function is `printImage()`.

## Entry point

`index.js` — exports `printImage(image_path, vertical_percent, maintain_aspect_ratio)`.

## Naming conventions

- Prefer kebab-case; fall back to snake_case where kebab is not valid (JS identifiers).
- All internal variable and function names use snake_case.
- The public export `printImage` keeps camelCase as the user-facing API name.

## Half-block rendering technique

Each terminal character row covers two pixel rows:

- Top pixel → foreground color of `▀`
- Bottom pixel → background color of `▀`

This doubles effective vertical resolution. Transparent pixels (`alpha < 128`) are handled as spaces or single-color half-blocks.

## Dependencies

- [`jimp`](https://github.com/jimp-dev/jimp) — image reading, resizing, and pixel access.

## Publishing

Scoped package under `@shriyanss`. Publish with `npm publish --access public`.
