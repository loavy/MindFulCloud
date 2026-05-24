# MindFulCloud

MindFulCloud is a lightweight browser extension for reducing visual noise on YouTube, Reddit, Twitter/X, and Pinterest.

It does not try to block the web. It gives busy pages calmer defaults, fewer distractions, and a popup where you can tune each site.

## Features

- Global enable/disable toggle
- Per-site pause toggle for the active tab
- Presets: Calm, Focus, and Deep Focus
- Import, export, and reset settings
- Chrome, Brave, Edge, and Firefox support
- Browser-specific release manifests for clean store packages

## Site Modes

### YouTube

- Hide recommendations
- Hide comments
- Hide Shorts
- Optional floating sidebar
- Custom progress bar and scrubber colors

### Reddit

- Minimal mode for calmer reading
- Compact mode for faster scanning
- Focus mode for a centered, low-distraction feed

### Twitter / X

- Focus mode
- Minimal mode
- Zen mode for a narrow, distraction-light timeline

### Pinterest

- Minimal mode
- Dark mode
- Glass mode

## Project Structure

```text
MindFulCloud/
├── icons/
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── scripts/
│   └── build-extension.ps1
├── styles/
│   ├── pinterest-clean.css
│   ├── reddit-clean.css
│   ├── twitter-clean.css
│   └── youtube-clean.css
├── content.js
├── manifest.json
├── manifest.chrome.json
├── manifest.firefox.json
└── preload.js
```

## Install From Source

Clone the repo:

```bash
git clone https://github.com/PinkMath/MindFulCloud.git
```

### Chrome / Brave / Edge

1. Run the Chrome build:

   ```powershell
   .\scripts\build-extension.ps1 chrome
   ```

2. Open `chrome://extensions/`.
3. Enable Developer Mode.
4. Click **Load unpacked**.
5. Select `dist/chrome`.

### Firefox

1. Run the Firefox build:

   ```powershell
   .\scripts\build-extension.ps1 firefox
   ```

2. Open `about:debugging`.
3. Click **This Firefox**.
4. Click **Load Temporary Add-on**.
5. Select `dist/firefox/manifest.json`.

## Build Release Packages

Build both browser packages from PowerShell:

```powershell
.\scripts\build-extension.ps1 all
```

The build script creates:

- `dist/chrome`
- `dist/firefox`
- `dist/MindFulCloud-chrome.zip`
- `dist/MindFulCloud-firefox.zip`

`dist/` is ignored by git because it is generated output. Rebuild it locally whenever you need to test or upload a package.

## Manifest Files

- `manifest.chrome.json` removes Firefox-only metadata for Chrome Web Store packages.
- `manifest.firefox.json` keeps the Gecko extension id for Firefox/AMO packages.
- `manifest.json` is the default local development manifest.

## Notes

These sites change often, so selectors may need maintenance over time. The extension is intentionally small and uses plain JavaScript plus site-specific CSS overrides so fixes stay easy to review.
