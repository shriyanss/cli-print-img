// Auto-detect the best terminal image rendering method.
// Priority: Kitty > iTerm2 > halfblock (universal fallback).
// Inside tmux, passthrough is non-default so skip graphics protocols.

export function detectRenderer() {
    const { env } = process;

    if (env.TMUX) return "halfblock";

    // Kitty Graphics Protocol
    if (env.KITTY_WINDOW_ID || env.TERM === "xterm-kitty" || env.TERM_PROGRAM === "kitty") return "kitty";
    // Ghostty has strong Kitty support
    if (env.TERM_PROGRAM === "ghostty") return "kitty";

    // iTerm2 Inline Images Protocol
    if (env.TERM_PROGRAM === "iTerm.app" || env.LC_TERMINAL === "iTerm2" || env.ITERM_SESSION_ID) return "iterm2";
    // WezTerm supports both; iTerm2 protocol is more stable there
    if (env.TERM_PROGRAM === "WezTerm") return "iterm2";

    return "halfblock";
}
