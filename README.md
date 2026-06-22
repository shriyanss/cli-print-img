# @shriyanss/cli-print-img

![cli-print-img logo](https://raw.githubusercontent.com/shriyanss/cli-print-img/main/assets/cli-print-img-logo.png)

A Node.js library that renders images directly in the terminal using ANSI true-color and Unicode half-block characters (`▀`). Each terminal row displays two image rows (top pixel as foreground, bottom pixel as background), doubling effective vertical resolution.

## Installation

```bash
npm install @shriyanss/cli-print-img
```

## Usage

```js
import { printImage } from "@shriyanss/cli-print-img";

// Print an image at 20% of terminal height (default)
await printImage("/path/to/image.png");

// Print at 50% of terminal height
await printImage("/path/to/image.png", 50);

// Print without maintaining aspect ratio
await printImage("/path/to/image.png", 50, false);

// Also works with URLs
await printImage("https://example.com/image.png");
```

## API

### `printImage(image_path, vertical_percent?, maintain_aspect_ratio?)`

Renders an image to stdout.

| Parameter               | Type      | Default | Description                                      |
| ----------------------- | --------- | ------- | ------------------------------------------------ |
| `image_path`            | `string`  | —       | Local file path or URL of the image              |
| `vertical_percent`      | `number`  | `20`    | Target height as a percentage of terminal height |
| `maintain_aspect_ratio` | `boolean` | `true`  | Whether to preserve the image's aspect ratio     |

## License

MIT
