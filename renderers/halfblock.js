import { intToRGBA, ResizeStrategy } from "jimp";

function rgb_to_ansi_fg(r, g, b) {
    return `\x1b[38;2;${r};${g};${b}m`;
}

function rgb_to_ansi_bg(r, g, b) {
    return `\x1b[48;2;${r};${g};${b}m`;
}

// Accepts a pre-read Jimp image object to avoid re-reading from disk.
// Each terminal row covers two pixel rows: top pixel = fg of ▀, bottom pixel = bg of ▀.
export function renderHalfblock(image, target_cols, target_pixel_rows) {
    if (target_pixel_rows % 2 !== 0) target_pixel_rows++;
    image.resize({ w: target_cols, h: target_pixel_rows, mode: ResizeStrategy.NEAREST_NEIGHBOR });

    const char_rows = target_pixel_rows / 2;

    for (let row = 0; row < char_rows; row++) {
        const top_y = row * 2;
        const bot_y = row * 2 + 1;
        let line = "";

        for (let x = 0; x < image.bitmap.width; x++) {
            const top = intToRGBA(image.getPixelColor(x, top_y));
            const bot = intToRGBA(image.getPixelColor(x, bot_y));

            const top_transparent = top.a < 128;
            const bot_transparent = bot.a < 128;

            if (top_transparent && bot_transparent) {
                line += " ";
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
