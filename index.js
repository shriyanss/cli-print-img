import { Jimp } from "jimp";
import { detectRenderer } from "./detect.js";
import { renderHalfblock } from "./renderers/halfblock.js";
import { renderKitty } from "./renderers/kitty.js";
import { renderIterm2 } from "./renderers/iterm2.js";

export { detectRenderer };

// Sizing uses CHAR_ASPECT=1 because half-block pairs 2 pixel rows per char row,
// making the effective cell aspect ratio 1:1 for layout purposes.
// Native protocols (Kitty/iTerm2) receive char-cell dimensions and handle
// their own scaling, so the same CHAR_ASPECT=1 layout formula works for all methods.
export async function printImage(
    image_path,
    vertical_percent = 20,
    maintain_aspect_ratio = true,
    min_char_rows = 20,
    renderer = null
) {
    const image = await Jimp.read(image_path);

    const term_width = process.stdout.columns || 120;
    const term_height = process.stdout.rows || 50;
    const CHAR_ASPECT = 1.0;
    const img_aspect_ratio = image.bitmap.width / image.bitmap.height;

    let target_cols, target_pixel_rows;

    if (maintain_aspect_ratio) {
        const max_char_rows = Math.max(min_char_rows, Math.floor(term_height * (vertical_percent / 100)));
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

    if (target_pixel_rows % 2 !== 0) target_pixel_rows++;
    const target_char_rows = target_pixel_rows / 2;

    const method = renderer ?? detectRenderer();

    if (method === "kitty") {
        renderKitty(image_path, target_cols);
    } else if (method === "iterm2") {
        renderIterm2(image_path, target_cols, target_char_rows);
    } else {
        renderHalfblock(image, target_cols, target_pixel_rows);
    }
}
