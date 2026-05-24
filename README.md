# MindFulCloud

MindFulCloud is a lightweight browser extension that makes noisy feeds feel easier to use. It applies calmer layouts and distraction-reducing styles to YouTube, Reddit, Twitter/X, and Pinterest while keeping you in control of every site.

It is not a hard blocker. It is a set of gentle defaults, quick toggles, and per-site modes for people who still want to use the web, just with less visual clutter.

## Install

| Browser | Link |
| --- | --- |
| Chrome, Brave, Edge, and other Chromium browsers | [Install from the Chrome Web Store](https://chromewebstore.google.com/detail/glcdileonafegdigonahhcffifkoggkp/preview?hl=pt-BR&authuser=0) |
| Firefox | [Install from Firefox Add-ons](https://addons.mozilla.org/en-GB/firefox/addon/mindfulcloud/) |

## What It Does

- Adds a global on/off switch for the whole extension.
- Lets you pause MindFulCloud for the current supported site.
- Includes ready-made presets: Calm, Focus, and Deep Focus.
- Keeps detailed per-site controls for YouTube, Reddit, Twitter/X, and Pinterest.
- Supports import, export, and reset for settings.
- Stores settings locally in your browser.
- Ships browser-specific manifests for clean Chrome Web Store and Firefox Add-ons packages.
- Uses plain JavaScript and CSS, with no build framework required for day-to-day development.

## Supported Sites

### YouTube

MindFulCloud can make YouTube less recommendation-heavy and easier to watch intentionally.

- Hide recommendations.
- Hide comments.
- Hide Shorts.
- Use a floating sidebar.
- Customize the video progress bar color.
- Customize the scrubber color.
- Apply YouTube-specific Calm, Focus, and Deep Focus modes.

### Reddit

Reddit modes focus on calmer reading and faster scanning.

- Minimal mode reduces surrounding page noise.
- Compact mode tightens post spacing.
- Focus mode centers the main feed and hides common distractions.

### Twitter / X

Twitter/X modes are designed around keeping the timeline readable without surrounding attention traps.

- Focus mode cleans up the main experience.
- Minimal mode hides common side content.
- Zen mode narrows the timeline and removes more navigation clutter.

### Pinterest

Pinterest modes help reduce visual intensity while preserving browsing.

- Minimal mode hides selected promotional and suggestion surfaces.
- Dark mode gives Pinterest a darker, quieter interface.
- Glass mode layers additional translucent styling on top of dark mode.

## Presets

| Preset | YouTube | Reddit | Twitter / X | Pinterest |
| --- | --- | --- | --- | --- |
| Calm | Hide recommendations and Shorts | Minimal | Zen | Minimal |
| Focus | Hide recommendations, comments, and Shorts | Compact | Focus | Dark |
| Deep Focus | Focus mode plus floating sidebar | Focus | Zen | Glass |
| Custom | Your own settings | Your own settings | Your own settings | Your own settings |

Changing an individual site option automatically moves the extension back to Custom, so presets never trap you in a configuration.

## Privacy

MindFulCloud is intentionally small and local-first.

- No analytics.
- No remote tracking.
- No external service calls.
- No account required.
- Settings are saved with `storage.local` in your browser.
- The `tabs` permission is used so the popup can detect the active tab and offer the pause-this-site toggle.
- Host permissions are limited to supported sites: YouTube, Reddit, Twitter/X, and Pinterest.

## Project Structure

```text
MindFulCloud/
|-- icons/
|-- popup/
|   |-- popup.html
|   |-- popup.js
|   `-- popup.css
|-- scripts/
|   `-- build-extension.ps1
|-- styles/
|   |-- pinterest-clean.css
|   |-- reddit-clean.css
|   |-- twitter-clean.css
|   `-- youtube-clean.css
|-- content.js
|-- manifest.json
|-- manifest.chrome.json
|-- manifest.firefox.json
|-- preload.js
`-- README.md
```

## Develop Locally

Clone the repository:

```bash
git clone https://github.com/PinkMath/MindFulCloud.git
cd MindFulCloud
```

There are no npm dependencies to install. The extension is built from static browser-extension files.

### Load in Chrome, Brave, or Edge

Build the Chromium package:

```powershell
.\scripts\build-extension.ps1 chrome
```

Then:

1. Open `chrome://extensions/`.
2. Enable Developer Mode.
3. Click **Load unpacked**.
4. Select `dist/chrome`.

### Load in Firefox

Build the Firefox package:

```powershell
.\scripts\build-extension.ps1 firefox
```

Then:

1. Open `about:debugging`.
2. Click **This Firefox**.
3. Click **Load Temporary Add-on**.
4. Select `dist/firefox/manifest.json`.

## Build Release Packages

Build both browser packages from PowerShell:

```powershell
.\scripts\build-extension.ps1 all
```

The build script creates:

```text
dist/chrome/
dist/firefox/
dist/MindFulCloud-chrome.zip
dist/MindFulCloud-firefox.zip
```

The `dist/` directory is generated output and should be rebuilt locally when testing or preparing a store upload.

## Manifest Strategy

MindFulCloud keeps separate manifests so each browser gets the metadata it expects.

- `manifest.json` is the default local development manifest.
- `manifest.chrome.json` is copied into `dist/chrome/manifest.json`.
- `manifest.firefox.json` is copied into `dist/firefox/manifest.json` and includes Firefox-specific Gecko metadata.

Current extension version: `4.7.0`.

## Settings Model

The popup and content script share a normalized settings object. Defaults are applied when a setting is missing, and legacy setting keys are still read so older installs can migrate cleanly.

Main setting groups:

- `enabled`: global extension state.
- `preset`: `custom`, `calm`, `focus`, or `deep-focus`.
- `youtube`: YouTube mode, visibility toggles, and player colors.
- `reddit`: Reddit mode.
- `twitter`: Twitter/X mode.
- `pinterest`: Pinterest mode.
- `pausedSites`: host-specific pause map.

## Maintenance Notes

MindFulCloud works by applying CSS classes to supported pages and letting site-specific styles do the cleanup. Large platforms change their markup often, so selectors may need maintenance over time.

When updating a site:

1. Reproduce the issue on the live site.
2. Update only the relevant file in `styles/`.
3. Keep selectors as narrow as practical.
4. Rebuild the affected browser package.
5. Test with the popup toggles and presets before publishing.

## Contributing

Small, focused changes are easiest to review. Good contributions include:

- Fixing broken selectors after supported sites change.
- Improving popup accessibility or keyboard behavior.
- Adding tests or manual QA notes for browser-specific behavior.
- Tightening documentation when behavior changes.

Please avoid broad rewrites unless they solve a specific maintenance problem.

## License

No license file is currently included in this repository. Add one before reusing, redistributing, or publishing derivative work outside the project owner's intended release channels.
