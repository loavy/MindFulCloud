(function () {
  const DEFAULT_SETTINGS = {
    enabled: true,
    preset: "custom",
    hidePromotedContent: false,
    youtube: {
      enabled: true,
      mode: "custom",
      hideRecommendations: true,
      hideComments: false,
      hideShorts: true,
      floatingSidebar: false,
      progressColor: "#4cafef",
      scrubberColor: "#4cafef",
    },
    reddit: {
      enabled: true,
      mode: "minimal",
    },
    twitter: {
      enabled: true,
      mode: "zen",
    },
    pinterest: {
      enabled: true,
      mode: "dark",
    },
    pausedSites: {},
    focusTimer: null,
  };

  const LEGACY_KEYS = [
    "ytHideRec",
    "ytHideComments",
    "ytHideShorts",
    "ytHamburger",
    "ytProgressColor",
    "ytScrubberColor",
    "rdMinimal",
    "twFocus",
    "ptDark",
  ];

  const SITE_CLASSES = [
    "mindful-youtube",
    "yt-hide-rec",
    "yt-hide-comments",
    "yt-hide-shorts",
    "yt-float-menu",
    "mindful-reddit",
    "rd-minimal",
    "rd-compact",
    "rd-focus",
    "mindful-twitter",
    "tw-focus",
    "tw-minimal",
    "tw-zen",
    "mindful-pinterest",
    "pt-minimal",
    "pt-dark",
    "hide-promoted-content",
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getDefaultSettings() {
    return clone(DEFAULT_SETTINGS);
  }

  function mergeObject(base, value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return base;
    }

    return { ...base, ...value };
  }

  function normalizeFocusTimer(value) {
    if (!value || typeof value !== "object") {
      return null;
    }

    const endsAt = Number(value.endsAt);
    if (!Number.isFinite(endsAt)) {
      return null;
    }

    return {
      active: value.active !== false,
      startedAt: Number(value.startedAt) || Date.now(),
      endsAt,
      previousSettings: value.previousSettings
        ? normalizeSettings(value.previousSettings, { includeTimer: false })
        : null,
    };
  }

  function normalizeSettings(data = {}, options = {}) {
    const settings = getDefaultSettings();

    if (typeof data.enabled === "boolean") settings.enabled = data.enabled;
    if (typeof data.preset === "string") settings.preset = data.preset;
    if (typeof data.hidePromotedContent === "boolean") {
      settings.hidePromotedContent = data.hidePromotedContent;
    }

    settings.pausedSites = mergeObject(settings.pausedSites, data.pausedSites);
    settings.youtube = mergeObject(settings.youtube, data.youtube);
    settings.reddit = mergeObject(settings.reddit, data.reddit);
    settings.twitter = mergeObject(settings.twitter, data.twitter);
    settings.pinterest = mergeObject(settings.pinterest, data.pinterest);

    if (!["minimal", "dark"].includes(settings.pinterest.mode)) {
      settings.pinterest.mode = "dark";
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
      settings.pinterest.mode = data.ptDark ? "dark" : "minimal";
    }

    settings.focusTimer =
      options.includeTimer === false ? null : normalizeFocusTimer(data.focusTimer);

    return settings;
  }

  function getFocusSettings(settings = {}) {
    const focused = normalizeSettings(settings, { includeTimer: false });

    focused.enabled = true;
    focused.preset = "custom";
    focused.youtube.enabled = true;
    focused.youtube.mode = "deep-focus";
    focused.youtube.hideRecommendations = true;
    focused.youtube.hideComments = true;
    focused.youtube.hideShorts = true;
    focused.youtube.floatingSidebar = true;
    focused.reddit.enabled = true;
    focused.reddit.mode = "focus";
    focused.twitter.enabled = true;
    focused.twitter.mode = "zen";
    focused.pinterest.enabled = true;
    focused.pinterest.mode = "dark";
    focused.focusTimer = settings.focusTimer || null;

    return focused;
  }

  function getCurrentSite(hostname = "") {
    if (hostname.includes("youtube.com")) return "youtube";
    if (hostname.includes("reddit.com")) return "reddit";
    if (hostname.includes("twitter.com") || hostname.includes("x.com")) return "twitter";
    if (hostname.includes("pinterest.com")) return "pinterest";
    return null;
  }

  globalThis.MindFulCloudSettings = {
    LEGACY_KEYS,
    SITE_CLASSES,
    clone,
    getCurrentSite,
    getDefaultSettings,
    getFocusSettings,
    normalizeSettings,
  };
})();
