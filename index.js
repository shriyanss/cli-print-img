#!/usr/bin/env node
import { Jimp, intToRGBA } from 'jimp';

function rgbToAnsiFg(r, g, b) {
  return `\x1b[38;2;${r};${g};${b}m`;
}

function rgbToAnsiBg(r, g, b) {
  return `\x1b[48;2;${r};${g};${b}m`;
}

// Render image using half-block characters (▀).
// Each terminal row displays 2 image rows: top pixel = fg, bottom pixel = bg.
// This doubles effective vertical resolution, making logos recognizable at small sizes.
async function printImage(imagePath, vertical_percent = 20, maintain_aspect_ratio = true) {
  const image = await Jimp.read(imagePath);

  const termWidth = process.stdout.columns || 120;
  const termHeight = process.stdout.rows || 50;

  // Each terminal row covers 2 pixel rows (half-block technique),
  // so effective pixel rows = char_rows * 2.
  // Terminal chars are ~2x taller than wide (CHAR_ASPECT = 2.0),
  // but with half-blocks we use 2 pixels per row, so the effective ratio is 1:1.
  const CHAR_ASPECT = 1.0;

  const imgAspectRatio = image.bitmap.width / image.bitmap.height;

  let targetCols, targetPixelRows;

  if (maintain_aspect_ratio) {
    // maxCharRows = 20% of terminal height
    const maxCharRows = Math.max(1, Math.floor(termHeight * (vertical_percent / 100)));
    // Each char row = 2 pixel rows
    const maxPixelRows = maxCharRows * 2;
    // Given maxPixelRows, how many cols to preserve aspect ratio?
    const colsForMax = Math.round(maxPixelRows * imgAspectRatio * CHAR_ASPECT);

    if (colsForMax <= termWidth - 2) {
      targetCols = colsForMax;
      targetPixelRows = maxPixelRows;
    } else {
      // Too wide — constrain by terminal width
      targetCols = termWidth - 2;
      const pixelRowsForWidth = Math.round(targetCols / (imgAspectRatio * CHAR_ASPECT));
      const cappedPixelRows = Math.min(pixelRowsForWidth, maxPixelRows);
      // Recompute cols to match capped rows
      targetCols = Math.round(cappedPixelRows * imgAspectRatio * CHAR_ASPECT);
      targetPixelRows = cappedPixelRows;
    }
  } else {
    targetCols = termWidth - 2;
    targetPixelRows = (termHeight - 5) * 2;
  }

  // Ensure even number of pixel rows (pairs for half-block)
  if (targetPixelRows % 2 !== 0) targetPixelRows++;

  image.resize({ w: targetCols, h: targetPixelRows });

  const charRows = targetPixelRows / 2;

  for (let row = 0; row < charRows; row++) {
    const topY = row * 2;
    const botY = row * 2 + 1;
    let line = '';

    for (let x = 0; x < image.bitmap.width; x++) {
      const top = intToRGBA(image.getPixelColor(x, topY));
      const bot = intToRGBA(image.getPixelColor(x, botY));

      const topTransparent = top.a < 128;
      const botTransparent = bot.a < 128;

      if (topTransparent && botTransparent) {
        line += ' ';
        continue;
      }

      if (topTransparent) {
        line += `${rgbToAnsiBg(bot.r, bot.g, bot.b)} \x1b[0m`;
      } else if (botTransparent) {
        line += `${rgbToAnsiFg(top.r, top.g, top.b)}▀\x1b[0m`;
      } else {
        line += `${rgbToAnsiFg(top.r, top.g, top.b)}${rgbToAnsiBg(bot.r, bot.g, bot.b)}▀\x1b[0m`;
      }
    }

    console.log(line);
  }
}

await printImage('https://js-recon.io/img/js-recon-logo.png', 50);
