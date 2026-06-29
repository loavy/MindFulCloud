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
      videosPerRow: 4,
      progressColor: "#4cafef",
      scrubberColor: "#4cafef",
    },
    youtubeMusic: {
      enabled: true,
      mode: "minimal",
      floatingSidebar: false,
      showPlaylistSongs: true,
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
  };

  const LEGACY_KEYS = [
    "ytHideRec",
    "ytHideComments",
    "ytHideShorts",
    "ytHamburger",
    "ytProgressColor",
    "ytScrubberColor",
    "focusTimer",
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
    "mindful-youtube-music",
    "ytm-minimal",
    "ytm-focus",
    "ytm-float-menu",
    "ytm-hide-playlist-songs",
    "ytm-immersive-player",
    "ytm-compact-queue",
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

  function normalizeSettings(data = {}) {
    const settings = getDefaultSettings();

    if (typeof data.enabled === "boolean") settings.enabled = data.enabled;
    if (typeof data.preset === "string") settings.preset = data.preset;
    if (typeof data.hidePromotedContent === "boolean") {
      settings.hidePromotedContent = data.hidePromotedContent;
    }

    settings.pausedSites = mergeObject(settings.pausedSites, data.pausedSites);
    settings.youtube = mergeObject(settings.youtube, data.youtube);
    settings.youtubeMusic = mergeObject(settings.youtubeMusic, data.youtubeMusic);
    settings.reddit = mergeObject(settings.reddit, data.reddit);
    settings.twitter = mergeObject(settings.twitter, data.twitter);
    settings.pinterest = mergeObject(settings.pinterest, data.pinterest);

    if (!["minimal", "dark"].includes(settings.pinterest.mode)) {
      settings.pinterest.mode = "dark";
    }
    if (!["minimal", "focus"].includes(settings.youtubeMusic.mode)) {
      settings.youtubeMusic.mode = "minimal";
    }
    settings.youtube.videosPerRow = Math.min(
      8,
      Math.max(2, Number.parseInt(settings.youtube.videosPerRow, 10) || 4),
    );

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

    return settings;
  }

  function isDomain(hostname, domain) {
    const normalized = String(hostname).toLowerCase().replace(/\.$/, "");
    return normalized === domain || normalized.endsWith(`.${domain}`);
  }

  function getCurrentSite(hostname = "") {
    if (String(hostname).toLowerCase() === "music.youtube.com") {
      return "youtubeMusic";
    }
    if (isDomain(hostname, "youtube.com")) return "youtube";
    if (isDomain(hostname, "reddit.com")) return "reddit";
    if (isDomain(hostname, "twitter.com") || isDomain(hostname, "x.com")) {
      return "twitter";
    }
    if (isDomain(hostname, "pinterest.com")) return "pinterest";
    return null;
  }

  globalThis.MindFulCloudSettings = {
    LEGACY_KEYS,
    SITE_CLASSES,
    clone,
    getCurrentSite,
    getDefaultSettings,
    normalizeSettings,
  };
})();
