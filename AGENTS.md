# AGENTS.md

Chrome extension (Manifest V3) "YouTube Mindful Pause" — intercepts video play on YouTube with a mandatory tag/word gate. No build system, no package.json, no tests, no lint.

## Architecture

- `content.js` + `content.css` — injected into `https://www.youtube.com/*` at `document_start`. `content.js` builds the overlay via HTML template strings and queries elements by class (`.ytmp-tag`, `.ytmp-continue`, `.ytmp-words`...). **Renaming any `ytmp-*` class requires editing BOTH files** (template in content.js, styles in content.css).
- Distraction hiding (shorts/home/recommendations) is **CSS-only, no flash**: `content.css` contains rules gated on `<html>` classes (`ytmp-hide-shorts`, `ytmp-hide-home`, `ytmp-hide-recs`). `content.js` adds all three classes to `<html>` at document_start (hide-first), then `applyDistractionClasses()` removes classes for disabled features once `chrome.storage` loads — before YouTube's first paint, so nothing ever flashes. Settings changes go through `chrome.storage.onChanged` → `applyDistractionClasses()`. Do NOT reintroduce JS class/attribute hiding with MutationObservers — that's what caused the refresh flash.
- `popup.html/js`, `options.html/js`, `history.html/js` — extension pages. Element IDs in HTML are coupled to the JS; keep them when restyling.
- `ui.css` — shared design system for extension pages only (relative font URLs work there). `content.css` is standalone: fonts are injected from `content.js` via `chrome.runtime.getURL("fonts/...")`, so bundled fonts must stay in `manifest.json` `web_accessible_resources` or the overlay loses its typefaces.
- Fonts: bundled `fonts/*.woff2` (Fraunces, Instrument Sans, IBM Plex Mono). No CDN.

## Behavior rules (don't break these)

- Mandatory gate: in both modes Continue stays disabled until a tag is selected (`selectedTag`); Journal also requires ≥15 words (`MIN_WORDS`). Esc/✕ only skip the timer countdown, never the tag gate. Cancel ("Actually, I don't need to watch...") is the only path that dismisses without saving and redirects to youtube.com.
- Storage: `chrome.storage.sync` keys `enabled`, `mode` (`"timer"|"journal"`), `message`, `delaySeconds`. `chrome.storage.local` key `history` — entries `{id, videoId, title, channel, thumbnail, timestamp, mode, reason, tag}` with `tag` ∈ `{"waste","study"}`. Legacy entries use `flagged: true`; `history.js` `tagOf()` migrates them to `"waste"` at render time — keep that fallback.
- Manifest version and `VERSION` const in content.js are bumped by hand, in sync.

## Design system

Pure black (`#000`) backgrounds, hairline borders (`rgba(255,255,255,.07)`), cyan accent (`#7cc5ff`/`#1e8cff`), glow reserved for the breathing orb. Tag colors: Waste = rose `#ff7d9c`, Study = cyan. Respect `prefers-reduced-motion` (already handled in both CSS files).

## Verification (no test runner)

`chrome.*` APIs do not exist on `file://` pages — to render/screenshot pages headlessly, stub `window.chrome` (storage/onChanged/runtime/tabs) before loading the page JS, and inline sample history data to test rendering. Existing headless-Chrome harness examples live in `/var/folders/.../T/opencode/ytmp-shots` (temp). After editing, reload the extension at `chrome://extensions`; manifest changes (e.g. web_accessible_resources) require full reload too.