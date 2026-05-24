document.addEventListener("DOMContentLoaded", async () => {
  const api =
    typeof browser !== "undefined"
      ? browser
      : typeof chrome !== "undefined"
        ? chrome
        : null;

  const settingsHelper = globalThis.MindFulCloudSettings;
  if (!api || !settingsHelper) return;

  const usingPromiseApi = typeof browser !== "undefined" && api === browser;
  const elements = {
    cancelTimer: document.getElementById("cancelTimer"),
    currentSiteHint: document.getElementById("currentSiteHint"),
    currentSiteName: document.getElementById("currentSiteName"),
    currentSitePanel: document.getElementById("currentSitePanel"),
    exportSettings: document.getElementById("exportSettings"),
    globalPreset: document.getElementById("globalPreset"),
    hidePromotedContent: document.getElementById("hidePromotedContent"),
    importFile: document.getElementById("importFile"),
    importSettings: document.getElementById("importSettings"),
    masterEnabled: document.getElementById("masterEnabled"),
    ptMode: document.getElementById("ptMode"),
    rdMode: document.getElementById("rdMode"),
    resetSettings: document.getElementById("resetSettings"),
    siteLabel: document.getElementById("siteLabel"),
    sitePaused: document.getElementById("sitePaused"),
    statusMessage: document.getElementById("statusMessage"),
    timerRemaining: document.getElementById("timerRemaining"),
    twMode: document.getElementById("twMode"),
    ytHideComments: document.getElementById("ytHideComments"),
    ytHideRec: document.getElementById("ytHideRec"),
    ytHideShorts: document.getElementById("ytHideShorts"),
    ytHamburger: document.getElementById("ytHamburger"),
    ytMode: document.getElementById("ytMode"),
    ytProgressColor: document.getElementById("ytProgressColor"),
    ytProgressHex: document.getElementById("ytProgressHex"),
    ytScrubberColor: document.getElementById("ytScrubberColor"),
    ytScrubberHex: document.getElementById("ytScrubberHex"),
  };

  const settingControls = [
    elements.globalPreset,
    elements.hidePromotedContent,
    elements.masterEnabled,
    elements.ptMode,
    elements.rdMode,
    elements.sitePaused,
    elements.twMode,
    elements.ytHideComments,
    elements.ytHideRec,
    elements.ytHideShorts,
    elements.ytHamburger,
    elements.ytMode,
    elements.ytProgressColor,
    elements.ytProgressHex,
    elements.ytScrubberColor,
    elements.ytScrubberHex,
  ];

  let currentHost = null;
  let currentSite = null;
  let currentSettings = settingsHelper.getDefaultSettings();
  let timerTick = null;

  function callApi(method, args = []) {
    if (usingPromiseApi) {
      return Promise.resolve(method(...args));
    }

    return new Promise((resolve, reject) => {
      method(...args, (result) => {
        const error = api.runtime?.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }
        resolve(result);
      });
    });
  }

  const storage = {
    get: () =>
      callApi(api.storage.local.get.bind(api.storage.local), [null]).then(
        (data) => data || {},
      ),
    remove: (keys) => callApi(api.storage.local.remove.bind(api.storage.local), [keys]),
    set: (data) => callApi(api.storage.local.set.bind(api.storage.local), [data]),
  };

  function showStatus(text) {
    elements.statusMessage.textContent = text;
    clearTimeout(showStatus.timeout);
    showStatus.timeout = setTimeout(() => {
      elements.statusMessage.textContent = "";
    }, 2600);
  }

  async function getCurrentHost() {
    try {
      const tabs = await callApi(api.tabs.query.bind(api.tabs), [
        { active: true, currentWindow: true },
      ]);
      const url = tabs?.[0]?.url;
      return url ? new URL(url).hostname : null;
    } catch {
      return null;
    }
  }

  async function sendSettingsToActiveTab(settings) {
    try {
      const tabs = await callApi(api.tabs.query.bind(api.tabs), [
        { active: true, currentWindow: true },
      ]);
      if (!tabs?.[0]?.id) return;
      await callApi(api.tabs.sendMessage.bind(api.tabs), [
        tabs[0].id,
        { type: "UPDATE_SETTINGS", settings },
      ]);
    } catch {
      // Browser pages and unsupported sites may not have a content script.
    }
  }

  async function persistSettings(settings, message = "Settings saved") {
    currentSettings = settingsHelper.normalizeSettings(settings);
    await storage.set(currentSettings);
    await storage.remove(settingsHelper.LEGACY_KEYS);
    updateUI(currentSettings);
    await sendSettingsToActiveTab(currentSettings);
    showStatus(message);
  }

  function updateCurrentSiteUi() {
    document
      .querySelectorAll(".site-card")
      .forEach((card) =>
        card.classList.toggle("active", card.dataset.site === currentSite),
      );

    if (!currentSite) {
      elements.currentSitePanel.classList.add("unsupported");
      elements.currentSiteName.textContent = "Unsupported page";
      elements.currentSiteHint.textContent =
        "Open YouTube, Reddit, Twitter/X, or Pinterest to use site controls.";
      elements.siteLabel.textContent = "No supported site";
      elements.sitePaused.checked = false;
      elements.sitePaused.disabled = true;
      return;
    }

    elements.currentSitePanel.classList.remove("unsupported");
    elements.currentSiteName.textContent = currentHost;
    elements.currentSiteHint.textContent =
      "Pause only this site without changing defaults.";
    elements.siteLabel.textContent = `${currentSite} active`;
    elements.sitePaused.disabled = false;
    elements.sitePaused.checked = !!currentSettings.pausedSites?.[currentHost];
  }

  function applyYouTubeMode(mode) {
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
    }
  }

  function applyPreset(name) {
    elements.globalPreset.value = name;

    if (name === "calm") {
      applyYouTubeMode("calm");
      elements.rdMode.value = "minimal";
      elements.twMode.value = "zen";
      elements.ptMode.value = "minimal";
    }

    if (name === "focus") {
      applyYouTubeMode("focus");
      elements.rdMode.value = "compact";
      elements.twMode.value = "focus";
      elements.ptMode.value = "dark";
    }

    if (name === "deep-focus") {
      applyYouTubeMode("deep-focus");
      elements.rdMode.value = "focus";
      elements.twMode.value = "zen";
      elements.ptMode.value = "dark";
    }
  }

  function setCustomPreset() {
    elements.globalPreset.value = "custom";
  }

  function buildSettings() {
    return settingsHelper.normalizeSettings({
      enabled: elements.masterEnabled.checked,
      preset: elements.globalPreset.value,
      hidePromotedContent: elements.hidePromotedContent.checked,
      youtube: {
        enabled: true,
        mode: elements.ytMode.value,
        hideRecommendations: elements.ytHideRec.checked,
        hideComments: elements.ytHideComments.checked,
        hideShorts: elements.ytHideShorts.checked,
        floatingSidebar: elements.ytHamburger.checked,
        progressColor: elements.ytProgressHex.value,
        scrubberColor: elements.ytScrubberHex.value,
      },
      reddit: {
        enabled: true,
        mode: elements.rdMode.value,
      },
      twitter: {
        enabled: true,
        mode: elements.twMode.value,
      },
      pinterest: {
        enabled: true,
        mode: elements.ptMode.value,
      },
      pausedSites: { ...(currentSettings.pausedSites || {}) },
      focusTimer: currentSettings.focusTimer,
    });
  }

  function syncColorPair(colorInput, hexInput, value) {
    const color = /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : "#4cafef";
    colorInput.value = color;
    hexInput.value = color;
  }

  function updateTimerUi(settings) {
    const timer = settings.focusTimer;
    const active = !!timer?.active && Date.now() < timer.endsAt;

    settingControls.forEach((control) => {
      if (control) control.disabled = active;
    });

    elements.cancelTimer.disabled = !active;

    if (!active) {
      elements.timerRemaining.textContent = "Inactive";
      return;
    }

    const remainingMs = Math.max(0, timer.endsAt - Date.now());
    const minutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);
    elements.timerRemaining.textContent = `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  function updateUI(settings) {
    currentSettings = settingsHelper.normalizeSettings(settings);
    const visibleSettings = currentSettings.focusTimer?.active
      ? settingsHelper.getFocusSettings(currentSettings)
      : currentSettings;

    elements.masterEnabled.checked = visibleSettings.enabled;
    elements.globalPreset.value = visibleSettings.preset;
    elements.hidePromotedContent.checked = visibleSettings.hidePromotedContent;
    elements.ytMode.value = visibleSettings.youtube.mode;
    elements.ytHideRec.checked = visibleSettings.youtube.hideRecommendations;
    elements.ytHideComments.checked = visibleSettings.youtube.hideComments;
    elements.ytHideShorts.checked = visibleSettings.youtube.hideShorts;
    elements.ytHamburger.checked = visibleSettings.youtube.floatingSidebar;
    elements.rdMode.value = visibleSettings.reddit.mode;
    elements.twMode.value = visibleSettings.twitter.mode;
    elements.ptMode.value = visibleSettings.pinterest.mode;
    syncColorPair(
      elements.ytProgressColor,
      elements.ytProgressHex,
      visibleSettings.youtube.progressColor,
    );
    syncColorPair(
      elements.ytScrubberColor,
      elements.ytScrubberHex,
      visibleSettings.youtube.scrubberColor,
    );

    updateCurrentSiteUi();
    updateTimerUi(currentSettings);
  }

  async function restoreExpiredTimer(settings) {
    const normalized = settingsHelper.normalizeSettings(settings);
    const timer = normalized.focusTimer;

    if (!timer?.active || Date.now() < timer.endsAt) {
      return normalized;
    }

    const restored = timer.previousSettings || settingsHelper.getDefaultSettings();
    restored.focusTimer = null;
    await storage.set(restored);
    await sendSettingsToActiveTab(restored);
    showStatus("Focus timer ended");
    return restored;
  }

  async function loadSettings() {
    const raw = await storage.get();
    currentSettings = await restoreExpiredTimer(raw);
    updateUI(currentSettings);
  }

  async function saveFromUi(message) {
    if (
      currentSettings.focusTimer?.active &&
      Date.now() < currentSettings.focusTimer.endsAt
    ) {
      showStatus("Cancel the focus timer before editing settings");
      return;
    }

    await persistSettings(buildSettings(), message);
  }

  async function startFocusTimer(minutes) {
    const base = settingsHelper.normalizeSettings(buildSettings(), {
      includeTimer: false,
    });
    const timer = {
      active: true,
      startedAt: Date.now(),
      endsAt: Date.now() + minutes * 60000,
      previousSettings: base,
    };
    const focused = settingsHelper.getFocusSettings({ ...base, focusTimer: timer });
    await persistSettings(focused, `Focus timer started for ${minutes} minutes`);
    startTimerLoop();
  }

  async function cancelFocusTimer(message = "Focus timer canceled") {
    const timer = currentSettings.focusTimer;
    const restored = timer?.previousSettings || settingsHelper.getDefaultSettings();
    restored.focusTimer = null;
    await persistSettings(restored, message);
    startTimerLoop();
  }

  function startTimerLoop() {
    clearInterval(timerTick);
    timerTick = setInterval(async () => {
      if (!currentSettings.focusTimer?.active) {
        updateTimerUi(currentSettings);
        return;
      }

      if (Date.now() >= currentSettings.focusTimer.endsAt) {
        await cancelFocusTimer("Focus timer ended");
        return;
      }

      updateTimerUi(currentSettings);
    }, 1000);
    updateTimerUi(currentSettings);
  }

  function downloadSettings() {
    const source =
      currentSettings.focusTimer?.active && currentSettings.focusTimer.previousSettings
        ? currentSettings.focusTimer.previousSettings
        : currentSettings;
    const exportData = settingsHelper.normalizeSettings(source);
    exportData.focusTimer = null;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mindfulcloud-settings.json";
    link.click();
    URL.revokeObjectURL(url);
    showStatus("Settings exported");
  }

  async function importSettings(file) {
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const imported = settingsHelper.normalizeSettings(data);
      imported.focusTimer = null;
      await persistSettings(imported, "Imported successfully");
    } catch {
      showStatus("Import failed: choose a valid JSON settings file");
    } finally {
      elements.importFile.value = "";
    }
  }

  function wireEvents() {
    elements.globalPreset.addEventListener("change", async () => {
      applyPreset(elements.globalPreset.value);
      await saveFromUi("Preset applied");
    });

    [elements.rdMode, elements.twMode, elements.ptMode].forEach((select) => {
      select.addEventListener("change", async () => {
        setCustomPreset();
        await saveFromUi();
      });
    });

    elements.ytMode.addEventListener("change", async () => {
      applyYouTubeMode(elements.ytMode.value);
      setCustomPreset();
      await saveFromUi();
    });

    [
      elements.hidePromotedContent,
      elements.masterEnabled,
      elements.ytHideComments,
      elements.ytHideRec,
      elements.ytHideShorts,
      elements.ytHamburger,
    ].forEach((input) => {
      input.addEventListener("change", async () => {
        if (input !== elements.masterEnabled && input !== elements.hidePromotedContent) {
          elements.ytMode.value = "custom";
        }
        setCustomPreset();
        await saveFromUi();
      });
    });

    elements.sitePaused.addEventListener("change", async () => {
      if (!currentHost) return;
      currentSettings.pausedSites = { ...(currentSettings.pausedSites || {}) };
      if (elements.sitePaused.checked) {
        currentSettings.pausedSites[currentHost] = true;
      } else {
        delete currentSettings.pausedSites[currentHost];
      }
      await persistSettings(buildSettings(), "Site pause updated");
    });

    [
      [elements.ytProgressColor, elements.ytProgressHex],
      [elements.ytScrubberColor, elements.ytScrubberHex],
    ].forEach(([colorInput, hexInput]) => {
      colorInput.addEventListener("input", async () => {
        hexInput.value = colorInput.value;
        setCustomPreset();
        await saveFromUi();
      });

      hexInput.addEventListener("change", async () => {
        if (!/^#[0-9a-f]{6}$/i.test(hexInput.value)) {
          syncColorPair(colorInput, hexInput, colorInput.value);
          showStatus("Use a color like #4cafef");
          return;
        }
        colorInput.value = hexInput.value.toLowerCase();
        hexInput.value = hexInput.value.toLowerCase();
        setCustomPreset();
        await saveFromUi();
      });
    });

    document.querySelectorAll("[data-timer-minutes]").forEach((button) => {
      button.addEventListener("click", () => {
        startFocusTimer(Number(button.dataset.timerMinutes));
      });
    });

    elements.cancelTimer.addEventListener("click", () => cancelFocusTimer());
    elements.exportSettings.addEventListener("click", downloadSettings);
    elements.importSettings.addEventListener("click", () => elements.importFile.click());
    elements.importFile.addEventListener("change", () =>
      importSettings(elements.importFile.files?.[0]),
    );

    elements.resetSettings.addEventListener("click", async () => {
      if (!confirm("Reset MindFulCloud settings to defaults?")) return;
      await persistSettings(settingsHelper.getDefaultSettings(), "Settings reset");
    });
  }

  currentHost = await getCurrentHost();
  currentSite = settingsHelper.getCurrentSite(currentHost || "");
  wireEvents();
  await loadSettings();
  startTimerLoop();
});
