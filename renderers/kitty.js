import fs from "fs";

// Kitty Graphics Protocol: transmit PNG and specify character-cell dimensions.
// Kitty handles all scaling internally at full quality.
// Spec: https://sw.kovidgoyal.net/kitty/graphics-protocol/

const CHUNK_SIZE = 4096;

export function renderKitty(image_path, target_cols, target_char_rows) {
    const data = fs.readFileSync(image_path);
    const b64 = data.toString("base64");

    let offset = 0;
    let is_first = true;

    while (offset < b64.length) {
        const chunk = b64.slice(offset, offset + CHUNK_SIZE);
        offset += CHUNK_SIZE;
        const more = offset < b64.length ? 1 : 0;

        let keys;
        if (is_first) {
            // a=T: transmit+display  f=100: PNG  c/r: char-cell dims
            // C=1: advance cursor past image  q=2: suppress response  m: chunking
            keys = `a=T,f=100,c=${target_cols},r=${target_char_rows},C=1,q=2,m=${more}`;
            is_first = false;
        } else {
            keys = `m=${more}`;
        }

        process.stdout.write(`\x1b_G${keys};${chunk}\x1b\\`);
    }

    process.stdout.write("\n");
}
