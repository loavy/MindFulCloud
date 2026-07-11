# MindFulCloud 🪴

> A calmer cloud for loud websites.

MindFulCloud is a lightweight, privacy-friendly browser extension that makes
YouTube, YouTube Music, Reddit, Twitter/X, and Pinterest feel quieter and easier
to use. It removes visual pressure without blocking the sites themselves.

<p>
  <img alt="Version 6.0.0" src="https://img.shields.io/badge/version-6.0.0-6C63FF?style=for-the-badge">
  <img alt="Chrome ready" src="https://img.shields.io/badge/Chrome-ready-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white">
  <img alt="Firefox ready" src="https://img.shields.io/badge/Firefox-ready-FF7139?style=for-the-badge&logo=firefoxbrowser&logoColor=white">
  <img alt="Manifest V3" src="https://img.shields.io/badge/Manifest-V3-34A853?style=for-the-badge">
  <img alt="Local-only privacy" src="https://img.shields.io/badge/Privacy-local_only-18A058?style=for-the-badge">
</p>

## Install

| Browser                                          | Store                                                                                                      |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Chrome, Brave, Edge, and other Chromium browsers | [Chrome Web Store](https://chromewebstore.google.com/detail/mindfulcloud/glcdileonafegdigonahhcffifkoggkp) |
| Firefox                                          | [Firefox Add-ons](https://addons.mozilla.org/en-GB/firefox/addon/mindfulcloud/)                            |

After installing, reload any supported tab that was already open. Click the
MindFulCloud icon, choose a preset, and fine-tune the current platform. Changes
are saved automatically.

## Why MindFulCloud?

- Calm distracting pages without replacing the sites you already use.
- Apply different YouTube rules to Home, Watch, Search, and Channel pages.
- Temporarily reveal hidden content without changing saved preferences.
- Recover from YouTube layout changes with Compatibility Mode.
- Pause the extension for one site or turn it off globally.
- Keep every setting in your browser—no account, analytics, or remote service.

## YouTube Controls

YouTube gets the most detailed controls. Rules are stored independently for
each page type, so hiding recommendations beside a video does not empty the
Home page or alter search results.

| Page     | Available rules                                       |
| -------- | ----------------------------------------------------- |
| Home     | Hide the home feed and Shorts                         |
| Watch    | Hide recommendations, playlists, comments, and Shorts |
| Search   | Hide Shorts from search results                       |
| Channels | Hide Shorts from channel pages                        |

Additional controls include:

- **Independent Watch controls** — hide suggested videos while keeping an active
  playlist queue directly beneath the player at any window width, or hide playlists
  separately when you do not need them.
- **Show once** — reveals a hidden feed, recommendation panel, playlist, comment
  section, or Shorts section in the current tab. The reveal ends when the tab
  navigates or reloads, and the saved rule stays unchanged.
- **Compatibility Mode** — keeps hiding rules active while restoring YouTube's
  native layout. Use it if a YouTube update causes blank space, clipped
  thumbnails, header overlap, or an unusual page arrangement.
- **Layout controls** — choose 2–8 videos per Home row, use a floating sidebar,
  and customize player progress and scrubber colors.
- **SPA-aware navigation** — page rules update as YouTube moves between Home,
  Watch, Search, and Channel views without a full reload.

## Supported Platforms

| Platform      | Modes and controls                                                                                                            |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| YouTube       | Calm, Focus, Deep Focus, independent recommendation/playlist rules, Show once, Compatibility Mode, layout and player controls |
| YouTube Music | Minimal, Focus, playlist-song visibility, floating sidebar, immersive player, and player colors                               |
| Reddit        | Minimal, Compact, and Focus                                                                                                   |
| Twitter/X     | Minimal, Focus, and Zen                                                                                                       |
| Pinterest     | Minimal and Dark                                                                                                              |

The popup keeps platform controls in collapsible cards and automatically opens
the card for the current site.

## Presets

Presets configure all supported platforms together. Changing an individual
setting switches the preset to **Custom**.

| Preset     | YouTube                                                                | YouTube Music                 | Reddit        | Twitter/X     | Pinterest     |
| ---------- | ---------------------------------------------------------------------- | ----------------------------- | ------------- | ------------- | ------------- |
| Calm       | Keep Home and playlists visible; hide Watch recommendations and Shorts | Minimal                       | Minimal       | Zen           | Minimal       |
| Focus      | Hide Home, Watch recommendations, comments, and Shorts; keep playlists | Focus                         | Compact       | Focus         | Dark          |
| Deep Focus | Focus rules plus a floating sidebar                                    | Focus plus a floating sidebar | Focus         | Zen           | Dark          |
| Custom     | Your settings                                                          | Your settings                 | Your settings | Your settings | Your settings |

The global **Hide promoted/ad content** option applies to supported site
themes where a stable promoted-content selector is available.

## Popup Guide

1. Use **Power** to enable or disable MindFulCloud everywhere.
2. Use **Pause** to stop it only on the current site.
3. Pick a global preset for a quick starting point.
4. Expand a platform card to adjust its individual controls.
5. On YouTube, choose a page under **Rules for** before changing its toggles.
6. Use **Reset** to restore every setting to its default.

## Privacy and Permissions

MindFulCloud is local-first:

- No analytics or tracking.
- No account or background data collection.
- No remote code or external API calls.
- Settings are stored locally in the browser.
- Host access is limited to supported sites.

| Permission         | Purpose                                                                      |
| ------------------ | ---------------------------------------------------------------------------- |
| `storage`          | Saves settings, presets, and pause state locally.                            |
| `activeTab`        | Detects and updates the current tab after the popup is opened.               |
| `host_permissions` | Runs MindFulCloud only on YouTube, Reddit, Twitter/X, and Pinterest domains. |

The extension does not request the broader `tabs` permission.

## Install a Local Build

First build the extension using the instructions in
[Build Release Packages](#build-release-packages).

### Chrome, Brave, or Edge

1. Open `chrome://extensions/` (or the browser's equivalent).
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose `dist/chrome`.

### Firefox

1. Open `about:debugging`.
2. Select **This Firefox**.
3. Select **Load Temporary Add-on**.
4. Choose `dist/firefox/manifest.json`.

Temporary Firefox add-ons are removed when Firefox closes.

## Development

### Requirements

- Node.js 18 or newer
- npm
- PowerShell 5.1 or newer

### Setup

```bash
git clone https://github.com/loavy/MindFulCloud.git
cd MindFulCloud
npm install
```

### Quality Checks

```bash
npm run check
npm test
```

Format changed files with:

```bash
npm run format
```

## Build Release Packages

Build Chrome and Firefox together:

```powershell
.\scripts\build-extension.ps1 all
```

If Windows blocks local PowerShell scripts, use:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\build-extension.ps1 all
```

Build only one browser with `chrome` or `firefox` in place of `all`.

The build creates clean unpacked folders and store-ready ZIP archives:

| Output                          | Purpose                            |
| ------------------------------- | ---------------------------------- |
| `dist/chrome/`                  | Load unpacked in Chromium browsers |
| `dist/firefox/`                 | Load temporarily in Firefox        |
| `dist/MindFulCloud-chrome.zip`  | Chrome Web Store release archive   |
| `dist/MindFulCloud-firefox.zip` | Firefox Add-ons release archive    |

Each ZIP contains its target manifest as `manifest.json` at the archive root.
Only extension runtime files are packaged.

## Project Structure

```text
MindFulCloud/
|-- icons/                  Extension icons
|-- popup/                  Popup markup, styles, and behavior
|-- scripts/
|   `-- build-extension.ps1 Release builder
|-- shared/
|   `-- settings.js         Defaults, validation, and migration
|-- styles/
|   |-- pinterest/
|   |-- reddit/
|   |-- twitter/
|   |-- youtube/
|   `-- youtube-music/
|-- test/                   Node test suite
|-- content.js              Site detection and class application
|-- manifest.json           Local default manifest
|-- manifest.chrome.json    Chromium release manifest
|-- manifest.firefox.json   Firefox release manifest
`-- package.json
```

## Manifest Strategy

- `manifest.chrome.json` is used for Chromium builds and the Chrome Web Store.
- `manifest.firefox.json` adds the Gecko extension ID required by Firefox.
- `manifest.json` is the local default manifest.
- The build script installs the selected manifest as
  `dist/<browser>/manifest.json`.

## Release Checklist

1. Run `npm run check` and `npm test`.
2. Build both packages.
3. Load and test both unpacked builds.
4. Confirm global power, site pause, presets, and reset.
5. Confirm all four YouTube page scopes remain independent, including the Watch
   recommendation/playlist combinations.
6. Test Compatibility Mode and Show once.
7. Upload the matching ZIP from `dist/` to each browser store.

## Troubleshooting

| Problem                                                   | Fix                                                                           |
| --------------------------------------------------------- | ----------------------------------------------------------------------------- |
| An already-open page does not change                      | Reload the tab once after installing or updating the extension.               |
| YouTube has blank space, clipped cards, or header overlap | Enable **YouTube → Compatibility Mode**.                                      |
| A Show once button is unavailable                         | Open a supported YouTube page and make sure that content is currently hidden. |
| You want revealed content to remain visible               | Turn off its rule for the relevant YouTube page instead of using Show once.   |
| A site redesign breaks a theme                            | Open an issue with the page URL, browser, and a screenshot.                   |

## Theme Maintenance

MindFulCloud works by applying scoped CSS classes to supported pages. Large
platforms change their markup regularly, so selectors occasionally need
maintenance. Keep fixes narrow, avoid hiding main content containers, rebuild
both packages, and retest every affected page type.

Pinterest dark mode is scoped to:

```css
html.mindful-pinterest.pt-dark
```

## License

No license file is currently included. Add one before reusing, redistributing,
or publishing derivative work outside the project owner's intended release
channels.
