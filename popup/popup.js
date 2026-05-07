document.addEventListener("DOMContentLoaded", async () => {

  const api =
    typeof browser !== "undefined" ? browser :
    typeof chrome !== "undefined" ? chrome :
    null;

  if (!api) return;

  console.log("POPUP READY");

  const elements = {
    masterEnabled: document.getElementById("masterEnabled"),
    globalPreset: document.getElementById("globalPreset"),
    sitePaused: document.getElementById("sitePaused"),
    ytMode: document.getElementById("ytMode"),
    ytHideRec: document.getElementById("ytHideRec"),
    ytHideComments: document.getElementById("ytHideComments"),
    ytHideShorts: document.getElementById("ytHideShorts"),
    ytHamburger: document.getElementById("ytHamburger"),
    rdMode: document.getElementById("rdMode"),
    rdMinimal: document.getElementById("rdMinimal"),
    twMode: document.getElementById("twMode"),
    twFocus: document.getElementById("twFocus"),
    ptMode: document.getElementById("ptMode"),
    ptDark: document.getElementById("ptDark"),
    exportSettings: document.getElementById("exportSettings"),
    importSettings: document.getElementById("importSettings"),
    resetSettings: document.getElementById("resetSettings")
  };

  const ytProgressHex = document.getElementById("ytProgressHex");
  const ytProgressPreview = document.getElementById("ytProgressPreview");
  const progressPalette = document.getElementById("progressPalette");
  const ytScrubberHex = document.getElementById("ytScrubberHex");
  const ytScrubberPreview = document.getElementById("ytScrubberPreview");
  const scrubberPalette = document.getElementById("scrubberPalette");
  const statusMessage = document.getElementById("statusMessage");
  const pauseTitle = document.getElementById("pauseTitle");

  let ytProgressColor = "#4cafef";
  let ytScrubberColor = "#ffffff";
  let currentSettings = {};
  let currentHost = null;

  const storage = {
    get: () =>
      new Promise(resolve => {
        api.storage.local.get(null, data => resolve(data || {}));
      }),
    set: (data) =>
      new Promise(resolve => {
        api.storage.local.set(data, resolve);
      }),
    remove: (keys) =>
      new Promise(resolve => {
        api.storage.local.remove(keys, resolve);
      })
  };

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

  const LEGACY_KEYS = [
    "ytHideRec",
    "ytHideComments",
    "ytHideShorts",
    "ytHamburger",
    "ytProgressColor",
    "ytScrubberColor",
    "rdMinimal",
    "twFocus",
    "ptDark"
  ];

  const COLOR_PRESETS = [
    "#ff0000", // red
    "#ef4444", // soft red
    "#f97316", // orange
    "#f59e0b", // amber
    "#eab308", // yellow
    "#84cc16", // lime
    "#22c55e", // green
    "#10b981", // emerald
    "#14b8a6", // teal
    "#06b6d4", // cyan
    "#4cafef", // blue
    "#3b82f6", // strong blue
    "#6366f1", // indigo
    "#8b5cf6", // purple
    "#a855f7", // violet
    "#d946ef", // fuchsia
    "#ec4899", // pink
    "#f43f5e", // rose
    "#ffffff", // white
    "#d1d5db", // gray
    "#6b7280", // dark gray
    "#111111"  // black
  ];

  function isSupportedHost(host) {
    return (
      host?.includes("youtube.com") ||
      host?.includes("reddit.com") ||
      host?.includes("twitter.com") ||
      host?.includes("x.com") ||
      host?.includes("pinterest.com")
    );
  }

  function normalizeSettings(data) {
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

  function showStatus(text) {
    if (!statusMessage) return;
    statusMessage.textContent = text;
    clearTimeout(showStatus.timeout);
    showStatus.timeout = setTimeout(() => {
      statusMessage.textContent = "";
    }, 2500);
  }

  function getCurrentHost() {
    return new Promise(resolve => {
      api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = tabs?.[0]?.url;
        if (!url) return resolve(null);
        try {
          resolve(new URL(url).hostname);
        } catch {
          resolve(null);
        }
      });
    });
  }

  function applyYouTubeMode(mode) {
    if (!elements.ytMode) return;
    elements.ytMode.value = mode;

    if (mode === "calm") {
      elements.ytHideRec.checked = true;
      elements.ytHideComments.checked = false;
      elements.ytHideShorts.checked = true;
      elements.ytHamburger.checked = false;
      return;
    }

    if (mode === "focus") {
      elements.ytHideRec.checked = true;
      elements.ytHideComments.checked = true;
      elements.ytHideShorts.checked = true;
      elements.ytHamburger.checked = false;
      return;
    }

    if (mode === "deep-focus") {
      elements.ytHideRec.checked = true;
      elements.ytHideComments.checked = true;
      elements.ytHideShorts.checked = true;
      elements.ytHamburger.checked = true;
      return;
    }
  }

  function applyRedditMode(mode) {
    if (!elements.rdMode) return;
    elements.rdMode.value = mode;
    elements.rdMinimal.checked = mode === "minimal";
  }

  function applyTwitterMode(mode) {
    if (!elements.twMode) return;
    elements.twMode.value = mode;
    elements.twFocus.checked = mode === "focus";
  }

  function applyPinterestMode(mode) {
    if (!elements.ptMode) return;
    elements.ptMode.value = mode;
    elements.ptDark.checked = mode === "dark";
  }

  async function cleanLegacyKeys() {
    await storage.remove(LEGACY_KEYS);
  }

  function buildSettings() {
    return {
      enabled: elements.masterEnabled?.checked ?? true,
      preset: elements.globalPreset?.value || "custom",
      youtube: {
        enabled: true,
        mode: elements.ytMode?.value || "custom",
        hideRecommendations: elements.ytHideRec?.checked ?? false,
        hideComments: elements.ytHideComments?.checked ?? false,
        hideShorts: elements.ytHideShorts?.checked ?? false,
        floatingSidebar: elements.ytHamburger?.checked ?? false,
        progressColor: ytProgressColor,
        scrubberColor: ytScrubberColor
      },
      reddit: {
        enabled: true,
        mode: elements.rdMode?.value || "minimal"
      },
      twitter: {
        enabled: true,
        mode: elements.twMode?.value || "focus"
      },
      pinterest: {
        enabled: true,
        mode: elements.ptMode?.value || "dark"
      },
      pausedSites: { ...(currentSettings.pausedSites || {}) }
    };
  }

  async function saveSettings() {
    const settings = buildSettings();
    currentSettings = normalizeSettings(settings);

    await storage.set(currentSettings);
    await cleanLegacyKeys();
    showStatus("Settings saved");

    api.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]?.id) return;
      api.tabs.sendMessage(tabs[0].id, {
        type: "UPDATE_SETTINGS",
        settings: currentSettings
      }, () => {});
    });
  }

  function refreshPresetState() {
    if (!elements.globalPreset) return;
    if (elements.globalPreset.value !== "custom") {
      elements.globalPreset.value = "custom";
    }
  }

  function wireModeChange(select, handler) {
    select?.addEventListener("change", () => {
      if (!select.value) return;
      handler(select.value);
      if (elements.globalPreset) {
        elements.globalPreset.value = "custom";
      }
      saveSettings();
    });
  }

  function wireToggleToCustom(toggle, modeElement) {
    toggle?.addEventListener("change", () => {
      if (!modeElement) return;
      modeElement.value = "custom";
      if (elements.globalPreset) {
        elements.globalPreset.value = "custom";
      }
      saveSettings();
    });
  }

  function applyPreset(name) {
    if (!elements.globalPreset) return;
    elements.globalPreset.value = name;

    if (name === "calm") {
      applyYouTubeMode("calm");
      applyRedditMode("minimal");
      applyTwitterMode("focus");
      applyPinterestMode("dark");
    }

    if (name === "focus") {
      applyYouTubeMode("focus");
      applyRedditMode("minimal");
      applyTwitterMode("focus");
      applyPinterestMode("dark");
    }

    if (name === "deep-focus") {
      applyYouTubeMode("deep-focus");
      applyRedditMode("minimal");
      applyTwitterMode("focus");
      applyPinterestMode("dark");
    }

    if (name === "custom") {
      // Keep the current custom configuration.
    }

    saveSettings();
  }

  function updatePauseControl(host) {
    if (!elements.sitePaused || !pauseTitle) return;
    if (!host || !isSupportedHost(host)) {
      elements.sitePaused.disabled = true;
      elements.sitePaused.checked = false;
      pauseTitle.textContent = "Pause this site";
      return;
    }

    elements.sitePaused.disabled = false;
    elements.sitePaused.checked = !!currentSettings.pausedSites[host];
    pauseTitle.textContent = `Pause ${host}`;
  }

  function updateUI(settings) {
    currentSettings = normalizeSettings(settings);
    const host = currentHost;

    if (elements.masterEnabled) elements.masterEnabled.checked = currentSettings.enabled;
    if (elements.globalPreset) elements.globalPreset.value = currentSettings.preset;

    if (elements.ytMode) elements.ytMode.value = currentSettings.youtube.mode;
    if (elements.ytHideRec) elements.ytHideRec.checked = currentSettings.youtube.hideRecommendations;
    if (elements.ytHideComments) elements.ytHideComments.checked = currentSettings.youtube.hideComments;
    if (elements.ytHideShorts) elements.ytHideShorts.checked = currentSettings.youtube.hideShorts;
    if (elements.ytHamburger) elements.ytHamburger.checked = currentSettings.youtube.floatingSidebar;

    if (elements.rdMode) elements.rdMode.value = currentSettings.reddit.mode;
    if (elements.rdMinimal) elements.rdMinimal.checked = currentSettings.reddit.mode === "minimal";

    if (elements.twMode) elements.twMode.value = currentSettings.twitter.mode;
    if (elements.twFocus) elements.twFocus.checked = currentSettings.twitter.mode === "focus";

    if (elements.ptMode) elements.ptMode.value = currentSettings.pinterest.mode;
    if (elements.ptDark) elements.ptDark.checked = currentSettings.pinterest.mode === "dark";

    ytProgressColor = currentSettings.youtube.progressColor || ytProgressColor;
    ytScrubberColor = currentSettings.youtube.scrubberColor || ytScrubberColor;

    if (ytProgressPreview) ytProgressPreview.style.background = ytProgressColor;
    if (ytProgressHex) ytProgressHex.value = ytProgressColor;
    if (ytScrubberPreview) ytScrubberPreview.style.background = ytScrubberColor;
    if (ytScrubberHex) ytScrubberHex.value = ytScrubberColor;

    updatePauseControl(host);
  }

  async function loadSettings() {
    const data = await storage.get();
    const settings = normalizeSettings(data);
    currentSettings = settings;
    updateUI(settings);
    showStatus("Loaded settings");
  }

  function wireToggle(toggle, modeSelect) {
    if (!toggle) return;
    toggle.addEventListener("change", () => {
      if (modeSelect) {
        modeSelect.value = "custom";
      }
      if (elements.globalPreset) {
        elements.globalPreset.value = "custom";
      }
      saveSettings();
    });
  }

  const toggles = [
    elements.ytHideRec,
    elements.ytHideComments,
    elements.ytHideShorts,
    elements.ytHamburger,
    elements.rdMinimal,
    elements.twFocus,
    elements.ptDark
  ];

  toggles.forEach((toggle, index) => {
    const selectMap = [
      elements.ytMode,
      elements.ytMode,
      elements.ytMode,
      elements.ytMode,
      elements.rdMode,
      elements.twMode,
      elements.ptMode
    ];
    wireToggle(toggle, selectMap[index]);
  });

  [
    [elements.ytMode, applyYouTubeMode],
    [elements.rdMode, applyRedditMode],
    [elements.twMode, applyTwitterMode],
    [elements.ptMode, applyPinterestMode]
  ].forEach(([select, handler]) => {
    wireModeChange(select, handler);
  });

  if (elements.globalPreset) {
    elements.globalPreset.addEventListener("change", () => applyPreset(elements.globalPreset.value));
  }

  if (elements.masterEnabled) {
    elements.masterEnabled.addEventListener("change", () => saveSettings());
  }

  if (elements.sitePaused) {
    elements.sitePaused.addEventListener("change", () => {
      if (!currentHost) return;
      currentSettings.pausedSites = currentSettings.pausedSites || {};
      if (elements.sitePaused.checked) {
        currentSettings.pausedSites[currentHost] = true;
      } else {
        delete currentSettings.pausedSites[currentHost];
      }
      saveSettings();
    });
  }

  if (elements.exportSettings) {
    elements.exportSettings.addEventListener("click", async () => {
      const text = JSON.stringify(currentSettings, null, 2);
      try {
        await navigator.clipboard.writeText(text);
        showStatus("Settings copied to clipboard");
      } catch {
        window.prompt("Copy your settings JSON:", text);
      }
    });
  }

  if (elements.importSettings) {
    elements.importSettings.addEventListener("click", async () => {
      const json = window.prompt("Paste settings JSON:");
      if (!json) return;
      try {
        const data = JSON.parse(json);
        const settings = normalizeSettings(data);
        currentSettings = settings;
        await storage.set(settings);
        await cleanLegacyKeys();
        updateUI(settings);
        saveSettings();
        showStatus("Settings imported");
      } catch (err) {
        showStatus("Invalid JSON import");
      }
    });
  }

  if (elements.resetSettings) {
    elements.resetSettings.addEventListener("click", async () => {
      if (!confirm("Reset all settings to defaults?")) return;
      currentSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
      await storage.set(currentSettings);
      await cleanLegacyKeys();
      updateUI(currentSettings);
      saveSettings();
      showStatus("Settings reset");
    });
  }

  function closeAllPalettes() {
    document.querySelectorAll(".color-palette.open").forEach(p => p.classList.remove("open"));
  }

  function togglePalette(paletteId) {
    const palette = document.getElementById(paletteId);
    if (!palette) return;
    const isOpen = palette.classList.contains("open");
    closeAllPalettes();
    if (!isOpen) palette.classList.add("open");
  }

  function applyProgressColor(color) {
    ytProgressColor = color;
    if (ytProgressPreview) ytProgressPreview.style.background = color;
    if (ytProgressHex) ytProgressHex.value = color;
    saveSettings();
  }

  function applyScrubberColor(color) {
    ytScrubberColor = color;
    if (ytScrubberPreview) ytScrubberPreview.style.background = color;
    if (ytScrubberHex) ytScrubberHex.value = color;
    saveSettings();
  }

  document.querySelectorAll(".color-row.color-toggle").forEach(row => {
    row.addEventListener("click", (e) => {
      if (e.target.closest("input")) return;
      const paletteId = row.dataset.palette;
      if (!paletteId) return;
      togglePalette(paletteId);
    });
  });

  document.querySelectorAll(".palette-swatch[data-color]").forEach(button => {
    const color = button.dataset.color;
    if (color) button.style.background = color;

    button.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!color) return;
      if (button.closest("#progressPalette")) {
        applyProgressColor(color);
      } else if (button.closest("#scrubberPalette")) {
        applyScrubberColor(color);
      }
    });
  });

  if (ytProgressHex) {
    ytProgressHex.addEventListener("click", (e) => e.stopPropagation());
    ytProgressHex.addEventListener("input", (e) => {
      const color = e.target.value;
      if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
        applyProgressColor(color);
      }
    });
  }

  if (ytScrubberHex) {
    ytScrubberHex.addEventListener("click", (e) => e.stopPropagation());
    ytScrubberHex.addEventListener("input", (e) => {
      const color = e.target.value;
      if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
        applyScrubberColor(color);
      }
    });
  }

  function setupAccordions() {
    const sections = document.querySelectorAll(".section, .site-card, [data-section]");

    sections.forEach((section) => {
      const header =
        section.querySelector(".section-header") ||
        section.querySelector(".card-header") ||
        section.querySelector("[data-section-toggle]");

      const content =
        section.querySelector(".section-content") ||
        section.querySelector(".card-content") ||
        section.querySelector("[data-section-content]");

      if (!header || !content) return;

      header.addEventListener("click", (event) => {
        if (
          event.target.closest("input") ||
          event.target.closest("select") ||
          event.target.closest("button:not(.section-header):not(.card-header):not([data-section-toggle])") ||
          event.target.closest("label")
        ) {
          return;
        }

        section.classList.toggle("open");
        content.hidden = !section.classList.contains("open");
      });

      content.hidden = !section.classList.contains("open");
    });
  }

  setupAccordions();

  currentHost = await getCurrentHost();
  await loadSettings();
});
