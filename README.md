# MindFulCloud

> A calmer cloud for loud websites.

[MindFulCloud](https://github.com/loavy/MindFulCloud) is a lightweight browser extension that makes YouTube, Reddit, Twitter/X, and Pinterest feel quieter, cleaner, and easier to use.

It does not block the web. It softens it: fewer distractions, calmer layouts, local settings, and simple controls that stay out of your way.

<p>
  <img alt="Chrome" src="https://img.shields.io/badge/Chrome-ready-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white">
  <img alt="Firefox" src="https://img.shields.io/badge/Firefox-ready-FF7139?style=for-the-badge&logo=firefoxbrowser&logoColor=white">
  <img alt="Vanilla JS" src="https://img.shields.io/badge/Vanilla_JS-lightweight-F7DF1E?style=for-the-badge&logo=javascript&logoColor=111">
  <img alt="Privacy" src="https://img.shields.io/badge/Privacy-local_only-18A058?style=for-the-badge">
</p>

## Install

| Browser                                          | Link                                                                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Chrome, Brave, Edge, and other Chromium browsers | [Install from the Chrome Web Store](https://chromewebstore.google.com/detail/glcdileonafegdigonahhcffifkoggkp/preview?hl=pt-BR&authuser=0) |
| Firefox                                          | [Install from Firefox Add-ons](https://addons.mozilla.org/en-GB/firefox/addon/mindfulcloud/)                                               |

## What It Does

MindFulCloud adds site-specific calm modes to websites that are usually built to keep pulling your attention around.

- YouTube gets cleaner watching controls, less recommendation pressure, optional comment hiding, Shorts hiding, and focus mode.
- Reddit gets Minimal, Compact, and Focus modes.
- Twitter/X gets Minimal, Focus, and Zen modes.
- Pinterest gets Minimal and Dark modes with separated theme CSS.
- A Focus Timer can temporarily apply stronger calm settings for 15, 30, or 60 minutes.
- Settings are saved locally in your browser.

## Supported Sites

| Site      | Modes / Controls                                                                                         |
| --------- | -------------------------------------------------------------------------------------------------------- |
| YouTube   | Hide recommendations, hide comments, hide Shorts, focus mode, floating sidebar, progress/scrubber colors |
| Reddit    | Minimal, Compact, Focus                                                                                  |
| Twitter/X | Minimal, Focus, Zen                                                                                      |
| Pinterest | Minimal, Dark                                                                                            |

Host permissions are limited to these supported sites only.

## Highlights

- Global on/off switch.
- Pause control for the current site.
- Current-site highlighting in the popup.
- Calm, Focus, and Deep Focus presets.
- Optional Hide promoted/ad content toggle.
- Focus Timer with automatic restore.
- Import, export, and reset settings.
- Separate Chrome and Firefox manifests.
- Clean release folders in `dist/chrome/` and `dist/firefox/`.
- No React, no Vite, no analytics, no remote code.

## Presets

| Preset     | YouTube                                                            | Reddit            | Twitter/X         | Pinterest         |
| ---------- | ------------------------------------------------------------------ | ----------------- | ----------------- | ----------------- |
| Calm       | Hide recommendations and Shorts, keep comments visible             | Minimal           | Zen               | Minimal           |
| Focus      | Hide recommendations, comments, and Shorts                         | Compact           | Focus             | Dark              |
| Deep Focus | Focus mode, floating sidebar, hide recommendations/comments/Shorts | Focus             | Zen               | Dark              |
| Custom     | Your own settings                                                  | Your own settings | Your own settings | Your own settings |

Changing any individual setting automatically returns the preset to `custom`.

## Focus Timer

The popup includes a small focus session tool:

- Start a 15, 30, or 60 minute session.
- MindFulCloud temporarily applies stronger calm settings.
- The popup shows the remaining time.
- You can cancel the session anytime.
- When the timer ends, your previous settings are restored.
- Timer state is stored in `chrome.storage.local` / `browser.storage.local`, so it survives closing the popup.

During a focus session:

| Site      | Temporary Focus Behavior                                                           |
| --------- | ---------------------------------------------------------------------------------- |
| YouTube   | Hide recommendations, comments, Shorts, enable focus mode, enable floating sidebar |
| Reddit    | Focus mode                                                                         |
| Twitter/X | Zen mode                                                                           |
| Pinterest | Dark mode                                                                          |

## Privacy

MindFulCloud is intentionally local-first.

- No analytics.
- No tracking.
- No remote code.
- No external APIs.
- No account.
- No background data collection.
- Settings are stored locally in your browser.
- Host permissions are limited to YouTube, Reddit, Twitter/X, and Pinterest.

## Permissions

| Permission         | Why It Is Used                                                                  |
| ------------------ | ------------------------------------------------------------------------------- |
| `storage`          | Saves settings, pause state, import/export data, and Focus Timer state locally. |
| `activeTab`        | Lets the popup detect and message the current tab after you open the extension. |
| `host_permissions` | Allows content scripts and CSS to run only on the supported sites.              |

MindFulCloud does not use the broader `tabs` permission.

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
|-- shared/
|   `-- settings.js
|-- styles/
|   |-- pinterest/
|   |   |-- base.css
|   |   |-- minimal.css
|   |   |-- dark.css
|   |   `-- promoted-content.css
|   |-- reddit/
|   |   |-- base.css
|   |   |-- minimal.css
|   |   |-- compact.css
|   |   |-- focus.css
|   |   `-- promoted-content.css
|   |-- twitter/
|   |   |-- base.css
|   |   |-- minimal.css
|   |   |-- focus.css
|   |   |-- zen.css
|   |   `-- promoted-content.css
|   `-- youtube/
|       `-- youtube-clean.css
|-- content.js
|-- manifest.json
|-- manifest.chrome.json
|-- manifest.firefox.json
`-- README.md
```

## Local Development

Clone the repository:

```bash
git clone https://github.com/loavy/MindFulCloud.git
cd MindFulCloud
```

Install dependencies:

```bash
npm install
```

Format and check the project:

```bash
npm run format
npm run check
```

## Build Release Packages

Build both browser packages:

```powershell
.\scripts\build-extension.ps1 all
```

Build one target:

```powershell
.\scripts\build-extension.ps1 chrome
.\scripts\build-extension.ps1 firefox
```

The build creates:

```text
dist/chrome/
dist/firefox/
dist/MindFulCloud-chrome.zip
dist/MindFulCloud-firefox.zip
```

Only extension files are copied into release folders: icons, popup files, shared settings, content scripts, site styles, and the target manifest.

## Install From Source

Chrome / Chromium:

1. Run `.\scripts\build-extension.ps1 chrome`.
2. Open `chrome://extensions/`.
3. Enable Developer Mode.
4. Click **Load unpacked**.
5. Select `dist/chrome`.

Firefox:

1. Run `.\scripts\build-extension.ps1 firefox`.
2. Open `about:debugging`.
3. Click **This Firefox**.
4. Click **Load Temporary Add-on**.
5. Select `dist/firefox/manifest.json`.

## Manifest Strategy

- `manifest.chrome.json` is used for Chrome Web Store and Chromium builds.
- `manifest.firefox.json` includes `browser_specific_settings.gecko.id` for Firefox Add-ons.
- `manifest.json` is the local default manifest.
- The build script copies the target manifest to `dist/<target>/manifest.json`.

## Store Publishing Checklist

- Run `npm run check`.
- Run `.\scripts\build-extension.ps1 all`.
- Load `dist/chrome` as an unpacked extension in Chrome/Chromium.
- Load `dist/firefox/manifest.json` as a temporary add-on in Firefox.
- Confirm the popup opens and detects supported sites.
- Test global enable/disable.
- Test pause for the current site.
- Test every site mode.
- Test Calm, Focus, and Deep Focus presets.
- Test the Focus Timer.
- Test import/export/reset.
- Upload `dist/MindFulCloud-chrome.zip` to the Chrome Web Store.
- Upload `dist/MindFulCloud-firefox.zip` to Firefox Add-ons.

## Manual Test Checklist

Chrome:

- Load `dist/chrome` in `chrome://extensions`.
- Open YouTube, Reddit, X/Twitter, and Pinterest.
- Toggle global on/off.
- Toggle pause for the current site.
- Change every site mode.
- Test presets.
- Test Hide promoted/ad content.
- Start and cancel the Focus Timer.
- Let a short Focus Timer expire and confirm settings restore.
- Export settings, reset settings, then import the exported JSON.

Firefox:

- Load `dist/firefox/manifest.json` from `about:debugging`.
- Repeat the Chrome checklist.

## Theme Maintenance

MindFulCloud works by applying CSS classes to supported pages. Large platforms change their markup often, so selectors may need maintenance.

When updating a site theme:

1. Reproduce the issue on the live site.
2. Edit only the relevant file in `styles/<site>/`.
3. Keep selectors narrow.
4. Avoid hiding main content containers.
5. Rebuild the target package.
6. Retest the popup toggles and presets.

Pinterest dark mode lives in `styles/pinterest/dark.css` and is scoped to:

```css
html.mindful-pinterest.pt-dark
```

## License

No license file is currently included in this repository. Add one before reusing, redistributing, or publishing derivative work outside the project owner's intended release channels.
