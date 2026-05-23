const html = document.documentElement;

const storage =
  typeof browser !== "undefined"
    ? browser.storage.local
    : chrome.storage.local;

const runtime =
  typeof browser !== "undefined"
    ? browser.runtime
    : chrome.runtime;

function getStoredSettings() {
  try {
    const result = storage.get(null);
    if (result && typeof result.then === "function") {
      return result;
    }
  } catch (error) {
    // Fall back to the callback form below.
  }

  return new Promise((resolve) => {
    storage.get(null, (data) => resolve(data || {}));
  });
}

const DEFAULT_SETTINGS = {
  enabled: true,
  preset: "custom",
  youtube: {
    enabled: true,
    mode: "custom",
    hideRecommendations: false,
    hideComments: false,
    hideShorts: false,
    floatingSidebar: false,
    progressColor: "#4cafef",
    scrubberColor: "#4cafef"
  },
  reddit: {
    enabled: true,
    mode: "minimal"
  },
  twitter: {
    enabled: true,
    mode: "focus"
  },
  pinterest: {
    enabled: true,
    mode: "dark"
  },
  pausedSites: {}
};

function normalizeSettings(data = {}) {
  const settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

  if (typeof data.enabled === "boolean") {
    settings.enabled = data.enabled;
  }

  if (typeof data.preset === "string") {
    settings.preset = data.preset;
  }

  if (data.pausedSites && typeof data.pausedSites === "object") {
    settings.pausedSites = { ...settings.pausedSites, ...data.pausedSites };
  }

  if (data.youtube && typeof data.youtube === "object") {
    settings.youtube = { ...settings.youtube, ...data.youtube };
  }

  if (data.reddit && typeof data.reddit === "object") {
    settings.reddit = { ...settings.reddit, ...data.reddit };
  }

  if (data.twitter && typeof data.twitter === "object") {
    settings.twitter = { ...settings.twitter, ...data.twitter };
  }

  if (data.pinterest && typeof data.pinterest === "object") {
    settings.pinterest = { ...settings.pinterest, ...data.pinterest };
  }

  if (typeof data.ytHideRec === "boolean") {
    settings.youtube.hideRecommendations = data.ytHideRec;
  }

  if (typeof data.ytHideComments === "boolean") {
    settings.youtube.hideComments = data.ytHideComments;
  }

  if (typeof data.ytHideShorts === "boolean") {
    settings.youtube.hideShorts = data.ytHideShorts;
  }

  if (typeof data.ytHamburger === "boolean") {
    settings.youtube.floatingSidebar = data.ytHamburger;
  }

  if (typeof data.ytProgressColor === "string") {
    settings.youtube.progressColor = data.ytProgressColor;
  }

  if (typeof data.ytScrubberColor === "string") {
    settings.youtube.scrubberColor = data.ytScrubberColor;
  }

  if (typeof data.rdMinimal === "boolean") {
    settings.reddit.mode = data.rdMinimal ? "minimal" : "custom";
  }

  if (typeof data.twFocus === "boolean") {
    settings.twitter.mode = data.twFocus ? "focus" : "custom";
  }

  if (typeof data.ptDark === "boolean") {
    settings.pinterest.mode = data.ptDark ? "dark" : "custom";
  }

  return settings;
}

function applyYouTubeColors(settings = {}) {
  const progress = settings.progressColor || "#4cafef";
  const scrubber = settings.scrubberColor || "#ffffff";
  const root = document.documentElement;

  root.style.setProperty("--yt-progress-color", progress);
  root.style.setProperty("--yt-scrubber-color", scrubber);
}

function apply(settings = {}) {
  const normalized = normalizeSettings(settings);

  html.classList.remove(
    "mindful-youtube",
    "yt-hide-rec",
    "yt-hide-comments",
    "yt-hide-shorts",
    "yt-float-menu",
    "mindful-reddit",
    "rd-minimal",
    "mindful-twitter",
    "tw-focus",
    "mindful-pinterest",
    "pt-dark"
  );

  const host = location.hostname;
  const paused = normalized.pausedSites?.[host];

  if (!normalized.enabled || paused) {
    return;
  }

  if (host.includes("youtube.com") && normalized.youtube.enabled) {
    html.classList.add("mindful-youtube");

    if (normalized.youtube.hideRecommendations) html.classList.add("yt-hide-rec");
    if (normalized.youtube.hideComments) html.classList.add("yt-hide-comments");
    if (normalized.youtube.hideShorts) html.classList.add("yt-hide-shorts");
    if (normalized.youtube.floatingSidebar) html.classList.add("yt-float-menu");

    applyYouTubeColors(normalized.youtube);
  }

  if (host.includes("reddit.com") && normalized.reddit.enabled) {
    html.classList.add("mindful-reddit");
    if (normalized.reddit.mode === "minimal") html.classList.add("rd-minimal");
  }

  if ((host.includes("x.com") || host.includes("twitter.com")) && normalized.twitter.enabled) {
    html.classList.add("mindful-twitter");
    if (normalized.twitter.mode === "focus") html.classList.add("tw-focus");
  }

  if (host.includes("pinterest.com") && normalized.pinterest.enabled) {
    html.classList.add("mindful-pinterest");
    if (normalized.pinterest.mode === "dark") html.classList.add("pt-dark");
  }
}

async function loadSettings() {
  try {
    const data = await getStoredSettings();
    return normalizeSettings(data);
  } catch (e) {
    console.error("Storage error:", e);
    return normalizeSettings({});
  }
}

async function init() {
  const settings = await loadSettings();
  requestAnimationFrame(() => {
    apply(settings);
  });
}

runtime.onMessage.addListener((msg) => {
  if (msg?.type === "UPDATE_SETTINGS") {
    apply(msg.settings || {});
  }
});

function watchUrl() {
  let last = location.href;

  const obs = new MutationObserver(() => {
    if (location.href !== last) {
      last = location.href;
      init();
    }
  });

  obs.observe(document, {
    subtree: true,
    childList: true
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

window.addEventListener("load", init);

watchUrl();
