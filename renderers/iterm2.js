import fs from "fs";

// iTerm2 Inline Images Protocol.
// Spec: https://iterm2.com/documentation-images.html
// Supported by: iTerm2, WezTerm.

export function renderIterm2(image_path, target_cols, target_char_rows) {
    const data = fs.readFileSync(image_path);
    const b64 = data.toString("base64");

    // width/height in character cells; preserveAspectRatio letterboxes within those bounds.
    process.stdout.write(
        `\x1b]1337;File=inline=1;width=${target_cols};height=${target_char_rows};preserveAspectRatio=1:${b64}\x07`
    );
    process.stdout.write("\n");
}
