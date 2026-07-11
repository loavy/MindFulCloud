const html = document.documentElement;
const settingsHelper = globalThis.MindFulCloudSettings;

const extensionApi =
  typeof browser !== "undefined"
    ? browser
    : typeof chrome !== "undefined"
      ? chrome
      : null;

const storage = extensionApi?.storage?.local;
const storageChanges = extensionApi?.storage?.onChanged;
const runtime = extensionApi?.runtime;
const temporaryReveals = new Set();

let activeSettings = settingsHelper.getDefaultSettings();
let activeUrl = location.href;
let observedWatchFlexy = null;
let playlistLayoutObserver = null;
let playlistLayoutTimer = null;

function storageGet(keys = null) {
  if (!storage) return Promise.resolve({});

  try {
    const result = storage.get(keys);
    if (result && typeof result.then === "function") return result;
  } catch {
    // Chrome uses the callback form.
  }

  return new Promise((resolve) => {
    storage.get(keys, (data) => resolve(data || {}));
  });
}

function clearSiteClasses() {
  html.classList.remove(...settingsHelper.SITE_CLASSES);
}

function applyYouTubeColors(settings = {}) {
  html.style.setProperty("--yt-progress-color", settings.progressColor || "#4cafef");
  html.style.setProperty("--yt-scrubber-color", settings.scrubberColor || "#4cafef");
  html.style.setProperty("--yt-videos-per-row", settings.videosPerRow || 4);
}

function applyYouTubeMusicColors(settings = {}) {
  html.style.setProperty("--ytm-progress-color", settings.progressColor || "#4cafef");
  html.style.setProperty("--ytm-scrubber-color", settings.scrubberColor || "#4cafef");
}

function addClassWhen(condition, className) {
  if (condition) html.classList.add(className);
}

function containsYouTubePlaylistPanel(node) {
  if (!(node instanceof Element)) return false;

  return (
    node.matches("ytd-playlist-panel-renderer, yt-playlist-panel-renderer, #playlist") ||
    !!node.querySelector(
      "ytd-playlist-panel-renderer, yt-playlist-panel-renderer, #playlist",
    )
  );
}

function observeYouTubePlaylistLayout(watchFlexy) {
  if (observedWatchFlexy === watchFlexy) return;

  playlistLayoutObserver?.disconnect();
  playlistLayoutObserver = null;
  observedWatchFlexy = watchFlexy;

  if (!watchFlexy || typeof MutationObserver === "undefined") return;

  playlistLayoutObserver = new MutationObserver((mutations) => {
    const playlistChanged = mutations.some((mutation) =>
      [...mutation.addedNodes, ...mutation.removedNodes].some(
        containsYouTubePlaylistPanel,
      ),
    );

    if (playlistChanged) scheduleYouTubePlaylistPlacement(3);
  });
  playlistLayoutObserver.observe(watchFlexy, {
    childList: true,
    subtree: true,
  });
}

function syncYouTubePlaylistPlacement() {
  if (settingsHelper.getCurrentSite(location.hostname) !== "youtube") return true;

  const shouldStackPlaylist =
    html.classList.contains("mindful-youtube") &&
    html.classList.contains("yt-page-watch") &&
    html.classList.contains("yt-hide-rec") &&
    !html.classList.contains("yt-hide-playlists");
  const watchFlexy =
    document.querySelector("ytd-watch-flexy[video-id]") ||
    document.querySelector("ytd-watch-flexy");
  observeYouTubePlaylistLayout(shouldStackPlaylist ? watchFlexy : null);
  if (!watchFlexy) return false;

  const playlistRenderer = watchFlexy.querySelector(
    "ytd-playlist-panel-renderer, yt-playlist-panel-renderer",
  );
  const playlistPanel = playlistRenderer?.closest("#playlist") || playlistRenderer;
  if (!playlistPanel) return false;

  const below = watchFlexy.querySelector("#below");
  const secondaryInner = watchFlexy.querySelector("#secondary-inner");

  if (shouldStackPlaylist) {
    if (!below) return false;

    playlistPanel.setAttribute("data-mindful-playlist-stacked", "");
    if (playlistPanel.parentElement !== below) below.prepend(playlistPanel);
    return true;
  }

  if (!playlistPanel.hasAttribute("data-mindful-playlist-stacked")) return true;

  if (watchFlexy.hasAttribute("is-two-columns_")) {
    if (!secondaryInner) return false;
    if (playlistPanel.parentElement !== secondaryInner) {
      secondaryInner.prepend(playlistPanel);
    }
    playlistPanel.removeAttribute("data-mindful-playlist-stacked");
    return true;
  }

  if (watchFlexy.hasAttribute("is-single-column")) {
    playlistPanel.removeAttribute("data-mindful-playlist-stacked");
    return true;
  }

  return false;
}

function scheduleYouTubePlaylistPlacement(attempts = 20) {
  if (settingsHelper.getCurrentSite(location.hostname) !== "youtube") return;

  clearTimeout(playlistLayoutTimer);
  let remaining = Math.max(1, attempts);

  const run = () => {
    const settled = syncYouTubePlaylistPlacement();
    remaining -= 1;
    playlistLayoutTimer = !settled && remaining > 0 ? setTimeout(run, 100) : null;
  };

  playlistLayoutTimer = setTimeout(run, 0);
}

function applySettings(settings = {}) {
  const normalized = settingsHelper.normalizeSettings(settings);
  const site = settingsHelper.getCurrentSite(location.hostname);
  const paused = normalized.pausedSites?.[location.hostname];

  activeSettings = normalized;
  clearSiteClasses();

  if (!normalized.enabled || !site || paused) {
    html.classList.remove("ytm-menu-open");
    scheduleYouTubePlaylistPlacement();
    return;
  }

  if (normalized.hidePromotedContent) {
    html.classList.add("hide-promoted-content");
  }

  if (site === "youtube" && normalized.youtube.enabled) {
    const page = settingsHelper.getYouTubePageType(location.href);
    const pageSettings = normalized.youtube.pages[page];
    const safeMode = normalized.youtube.safeMode;

    html.classList.add(
      safeMode ? "mindful-youtube-safe" : "mindful-youtube",
      `yt-page-${page}`,
    );
    addClassWhen(
      pageSettings.hideRecommendations && !temporaryReveals.has("recommendations"),
      "yt-hide-rec",
    );
    addClassWhen(
      pageSettings.hidePlaylists && !temporaryReveals.has("playlists"),
      "yt-hide-playlists",
    );
    addClassWhen(
      pageSettings.hideComments && !temporaryReveals.has("comments"),
      "yt-hide-comments",
    );
    addClassWhen(
      pageSettings.hideShorts && !temporaryReveals.has("shorts"),
      "yt-hide-shorts",
    );

    if (!safeMode) {
      addClassWhen(normalized.youtube.floatingSidebar, "yt-float-menu");
      applyYouTubeColors(normalized.youtube);
    }
  }

  if (site === "youtubeMusic" && normalized.youtubeMusic.enabled) {
    html.classList.add("mindful-youtube-music");
    addClassWhen(
      ["minimal", "focus"].includes(normalized.youtubeMusic.mode),
      "ytm-minimal",
    );
    addClassWhen(normalized.youtubeMusic.mode === "focus", "ytm-focus");
    addClassWhen(normalized.youtubeMusic.floatingSidebar, "ytm-float-menu");
    addClassWhen(!normalized.youtubeMusic.showPlaylistSongs, "ytm-hide-playlist-songs");
    html.classList.add("ytm-immersive-player");
    addClassWhen(normalized.youtubeMusic.mode === "focus", "ytm-compact-queue");
    if (!normalized.youtubeMusic.floatingSidebar) {
      html.classList.remove("ytm-menu-open");
    }
    applyYouTubeMusicColors(normalized.youtubeMusic);
  }

  if (site === "reddit" && normalized.reddit.enabled) {
    html.classList.add("mindful-reddit");
    addClassWhen(normalized.reddit.mode === "minimal", "rd-minimal");
    addClassWhen(normalized.reddit.mode === "compact", "rd-compact");
    addClassWhen(normalized.reddit.mode === "focus", "rd-focus");
  }

  if (site === "twitter" && normalized.twitter.enabled) {
    html.classList.add("mindful-twitter");
    addClassWhen(normalized.twitter.mode === "focus", "tw-focus");
    addClassWhen(normalized.twitter.mode === "minimal", "tw-minimal");
    addClassWhen(normalized.twitter.mode === "zen", "tw-zen");
  }

  if (site === "pinterest" && normalized.pinterest.enabled) {
    html.classList.add("mindful-pinterest");
    addClassWhen(normalized.pinterest.mode === "minimal", "pt-minimal");
    addClassWhen(normalized.pinterest.mode === "dark", "pt-dark");
  }

  scheduleYouTubePlaylistPlacement();
}

function watchYouTubeMusicMenu() {
  document.addEventListener("click", (event) => {
    if (
      location.hostname !== "music.youtube.com" ||
      !html.classList.contains("ytm-float-menu")
    ) {
      return;
    }

    const guideButton = event
      .composedPath()
      .find((node) => node instanceof Element && node.id === "guide-button");

    if (guideButton) {
      html.classList.toggle("ytm-menu-open");
    }
  });
}

async function loadSettings() {
  try {
    const data = await storageGet(null);
    return settingsHelper.normalizeSettings(data);
  } catch (error) {
    console.error("MindFulCloud storage error:", error);
    return settingsHelper.getDefaultSettings();
  }
}

async function init() {
  const settings = await loadSettings();
  requestAnimationFrame(() => applySettings(settings));
}

runtime?.onMessage?.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "UPDATE_SETTINGS") {
    applySettings(msg.settings || {});
  }

  if (
    msg?.type === "TEMPORARY_REVEAL" &&
    ["recommendations", "playlists", "comments", "shorts"].includes(msg.feature) &&
    settingsHelper.getCurrentSite(location.hostname) === "youtube"
  ) {
    temporaryReveals.add(msg.feature);
    applySettings(activeSettings);
    sendResponse?.({ ok: true });
  }

  if (
    msg?.type === "GET_TEMPORARY_REVEALS" &&
    settingsHelper.getCurrentSite(location.hostname) === "youtube"
  ) {
    sendResponse?.({ features: [...temporaryReveals] });
  }
});

storageChanges?.addListener((_changes, areaName) => {
  if (areaName === "local") init();
});

function watchYouTubeNavigation() {
  const handleNavigation = () => {
    if (location.href === activeUrl) return;
    activeUrl = location.href;
    temporaryReveals.clear();
    applySettings(activeSettings);
  };

  document.addEventListener("yt-navigate-finish", handleNavigation);
  document.addEventListener("yt-page-data-updated", () =>
    scheduleYouTubePlaylistPlacement(),
  );
  window.addEventListener("popstate", handleNavigation);
  window.addEventListener("hashchange", handleNavigation);
  window.addEventListener("resize", () => scheduleYouTubePlaylistPlacement(10));
}

init();
watchYouTubeMusicMenu();
watchYouTubeNavigation();
