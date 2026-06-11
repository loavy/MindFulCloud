const html = document.documentElement;
const settingsHelper = globalThis.MindFulCloudSettings;

const extensionApi =
  typeof browser !== "undefined"
    ? browser
    : typeof chrome !== "undefined"
      ? chrome
      : null;

const storage = extensionApi?.storage?.local;
const runtime = extensionApi?.runtime;

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

function applySettings(settings = {}) {
  const normalized = settingsHelper.normalizeSettings(settings);
  const site = settingsHelper.getCurrentSite(location.hostname);
  const paused = normalized.pausedSites?.[location.hostname];

  clearSiteClasses();

  if (!normalized.enabled || !site || paused) {
    html.classList.remove("ytm-menu-open");
    return;
  }

  if (normalized.hidePromotedContent) {
    html.classList.add("hide-promoted-content");
  }

  if (site === "youtube" && normalized.youtube.enabled) {
    html.classList.add("mindful-youtube");
    addClassWhen(normalized.youtube.hideRecommendations, "yt-hide-rec");
    addClassWhen(normalized.youtube.hideComments, "yt-hide-comments");
    addClassWhen(normalized.youtube.hideShorts, "yt-hide-shorts");
    addClassWhen(normalized.youtube.floatingSidebar, "yt-float-menu");
    applyYouTubeColors(normalized.youtube);
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

runtime?.onMessage?.addListener((msg) => {
  if (msg?.type === "UPDATE_SETTINGS") {
    applySettings(msg.settings || {});
  }
});

function watchUrl() {
  let last = location.href;

  const observer = new MutationObserver(() => {
    if (location.href === last) return;
    last = location.href;
    init();
  });

  observer.observe(document, {
    childList: true,
    subtree: true,
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

window.addEventListener("load", init);
watchUrl();
watchYouTubeMusicMenu();
