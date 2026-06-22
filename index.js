import { Jimp, intToRGBA } from 'jimp';

function rgb_to_ansi_fg(r, g, b) {
  return `\x1b[38;2;${r};${g};${b}m`;
}

function rgb_to_ansi_bg(r, g, b) {
  return `\x1b[48;2;${r};${g};${b}m`;
}

// Render image using half-block characters (▀).
// Each terminal row displays 2 image rows: top pixel = fg, bottom pixel = bg.
// This doubles effective vertical resolution, making logos recognizable at small sizes.
export async function printImage(image_path, vertical_percent = 20, maintain_aspect_ratio = true) {
  const image = await Jimp.read(image_path);

  const term_width = process.stdout.columns || 120;
  const term_height = process.stdout.rows || 50;

  // Terminal chars are ~2x taller than wide, but with half-blocks we use
  // 2 pixels per row, so the effective ratio is 1:1.
  const CHAR_ASPECT = 1.0;

  const img_aspect_ratio = image.bitmap.width / image.bitmap.height;

  let target_cols, target_pixel_rows;

  if (maintain_aspect_ratio) {
    const max_char_rows = Math.max(1, Math.floor(term_height * (vertical_percent / 100)));
    const max_pixel_rows = max_char_rows * 2;
    const cols_for_max = Math.round(max_pixel_rows * img_aspect_ratio * CHAR_ASPECT);

    if (cols_for_max <= term_width - 2) {
      target_cols = cols_for_max;
      target_pixel_rows = max_pixel_rows;
    } else {
      target_cols = term_width - 2;
      const pixel_rows_for_width = Math.round(target_cols / (img_aspect_ratio * CHAR_ASPECT));
      const capped_pixel_rows = Math.min(pixel_rows_for_width, max_pixel_rows);
      target_cols = Math.round(capped_pixel_rows * img_aspect_ratio * CHAR_ASPECT);
      target_pixel_rows = capped_pixel_rows;
    }
  } else {
    target_cols = term_width - 2;
    target_pixel_rows = (term_height - 5) * 2;
  }

  // Ensure even number of pixel rows (pairs for half-block)
  if (target_pixel_rows % 2 !== 0) target_pixel_rows++;

  image.resize({ w: target_cols, h: target_pixel_rows });

  const char_rows = target_pixel_rows / 2;

  for (let row = 0; row < char_rows; row++) {
    const top_y = row * 2;
    const bot_y = row * 2 + 1;
    let line = '';

    for (let x = 0; x < image.bitmap.width; x++) {
      const top = intToRGBA(image.getPixelColor(x, top_y));
      const bot = intToRGBA(image.getPixelColor(x, bot_y));

      const top_transparent = top.a < 128;
      const bot_transparent = bot.a < 128;

      if (top_transparent && bot_transparent) {
        line += ' ';
        continue;
      }

      if (top_transparent) {
        line += `${rgb_to_ansi_bg(bot.r, bot.g, bot.b)} \x1b[0m`;
      } else if (bot_transparent) {
        line += `${rgb_to_ansi_fg(top.r, top.g, top.b)}▀\x1b[0m`;
      } else {
        line += `${rgb_to_ansi_fg(top.r, top.g, top.b)}${rgb_to_ansi_bg(bot.r, bot.g, bot.b)}▀\x1b[0m`;
      }
    }

    console.log(line);
  }
}
