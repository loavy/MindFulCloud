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

function storageSet(data) {
  if (!storage) return Promise.resolve();

  try {
    const result = storage.set(data);
    if (result && typeof result.then === "function") return result;
  } catch {
    // Chrome uses the callback form.
  }

  return new Promise((resolve) => {
    storage.set(data, resolve);
  });
}

function clearSiteClasses() {
  html.classList.remove(...settingsHelper.SITE_CLASSES);
}

function applyYouTubeColors(settings = {}) {
  html.style.setProperty("--yt-progress-color", settings.progressColor || "#4cafef");
  html.style.setProperty("--yt-scrubber-color", settings.scrubberColor || "#4cafef");
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

async function resolveTimerSettings(settings) {
  const normalized = settingsHelper.normalizeSettings(settings);
  const timer = normalized.focusTimer;

  if (!timer?.active) {
    return normalized;
  }

  if (Date.now() < timer.endsAt) {
    return settingsHelper.getFocusSettings(normalized);
  }

  const restored =
    timer.previousSettings ||
    settingsHelper.normalizeSettings({ ...normalized, focusTimer: null });

  restored.focusTimer = null;
  await storageSet(restored);
  return restored;
}

async function loadSettings() {
  try {
    const data = await storageGet(null);
    return resolveTimerSettings(data);
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
    resolveTimerSettings(msg.settings || {}).then(applySettings);
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
