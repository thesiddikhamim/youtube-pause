# YouTube Mindful Pause

A Chrome extension (Manifest V3) that intercepts video playback on YouTube with a mandatory pause — a breathing countdown or a journaling gate — before you can watch. Think before you binge.

## Features

- **Breathing pause (Timer mode)** — a 10-second countdown with an animated breathing orb. Continue stays disabled until a tag is selected.
- **Journal gate (Journal mode)** — write at least 15 words about why you're watching before Continue unlocks.
- **Tag system** — every saved pause is tagged **Waste** (rose) or **Study** (cyan), so you can see what your watch time was actually for.
- **History** — every completed (or escaped) gate is saved locally with video title, channel, thumbnail, mode, reason, and tag.
- **Distraction hiding** — optionally hide recommendations on the watch page, Shorts, and the home feed from the options page.
- **Customizable** — your own reminder message and delay length, toggleable at any time.
- **Fully offline** — bundled variable fonts (Fraunces, Instrument Sans, IBM Plex Mono), no CDN, no network calls.

## Installation (unpacked)

1. Clone or download this repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the project folder.
5. The extension is active by default — open a YouTube video and try to watch it.

After editing any file, reload the extension at `chrome://extensions` (Ctrl/Cmd+R). Changes to `manifest.json` (e.g. `web_accessible_resources`) require a full reload too.

## Usage

- **Popup** — toggle the gate on/off and switch between Timer and Journal mode on the fly.
- **Options** — set your reminder message, pause length, and distraction-hiding toggles.
- **History** — browse past pauses, filter by tag, delete individual entries.

During the gate:

- **Esc / ✕** skips the timer countdown only — the tag (and journal) gate always stays.
- **J** — same as clicking "Actually, I don't need to watch...": dismisses the gate without saving and redirects to `youtube.com`.
- **"Actually, I don't need to watch..."** is the only way out without saving; it dismisses the overlay and redirects to `youtube.com`.

## How it works

| File | Role |
|---|---|
| `content.js` / `content.css` | Injected into `https://www.youtube.com/*` at `document_start`; builds the overlay, intercepts playback, hides distractions |
| `popup.html/js` | Quick toggle + mode switch |
| `options.html/js` | Message, delay, distraction settings |
| `history.html/js` | Local pause history viewer |
| `ui.css` | Shared design system for the extension pages |
| `manifest.json` | MV3 manifest; also serves `fonts/*.woff2` to the content script |

### Storage

- `chrome.storage.sync` — `enabled`, `mode` (`"timer"` \| `"journal"`), `message`, `delaySeconds`, `hideRecommendations`, `hideShorts`, `hideHome`.
- `chrome.storage.local` — `history`, an array of `{id, videoId, title, channel, thumbnail, timestamp, mode, reason, tag}` entries. `tag` is `"waste"` or `"study"`.

## Design

Pure black backgrounds, hairline `rgba(255,255,255,.07)` borders, cyan accent (`#7cc5ff`/`#1e8cff`), glow reserved for the breathing orb. Respects `prefers-reduced-motion`.

## License

Private project — no license specified.