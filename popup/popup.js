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
    currentSiteHint: document.getElementById("currentSiteHint"),
    currentSiteName: document.getElementById("currentSiteName"),
    currentSitePanel: document.getElementById("currentSitePanel"),
    globalPreset: document.getElementById("globalPreset"),
    hidePromotedContent: document.getElementById("hidePromotedContent"),
    masterEnabled: document.getElementById("masterEnabled"),
    ptMode: document.getElementById("ptMode"),
    rdMode: document.getElementById("rdMode"),
    resetSettings: document.getElementById("resetSettings"),
    siteLabel: document.getElementById("siteLabel"),
    sitePaused: document.getElementById("sitePaused"),
    statusMessage: document.getElementById("statusMessage"),
    twMode: document.getElementById("twMode"),
    ytHideComments: document.getElementById("ytHideComments"),
    ytHidePlaylists: document.getElementById("ytHidePlaylists"),
    ytHideRec: document.getElementById("ytHideRec"),
    ytHideRecHint: document.getElementById("ytHideRecHint"),
    ytHideRecLabel: document.getElementById("ytHideRecLabel"),
    ytHideShorts: document.getElementById("ytHideShorts"),
    ytHamburger: document.getElementById("ytHamburger"),
    ytMode: document.getElementById("ytMode"),
    ytPageHint: document.getElementById("ytPageHint"),
    ytPageScope: document.getElementById("ytPageScope"),
    ytProgressColor: document.getElementById("ytProgressColor"),
    ytProgressHex: document.getElementById("ytProgressHex"),
    ytSafeMode: document.getElementById("ytSafeMode"),
    ytScrubberColor: document.getElementById("ytScrubberColor"),
    ytScrubberHex: document.getElementById("ytScrubberHex"),
    ytShowCommentsOnce: document.getElementById("ytShowCommentsOnce"),
    ytShowPlaylistsOnce: document.getElementById("ytShowPlaylistsOnce"),
    ytShowRecommendationsOnce: document.getElementById("ytShowRecommendationsOnce"),
    ytShowShortsOnce: document.getElementById("ytShowShortsOnce"),
    ytVideosPerRow: document.getElementById("ytVideosPerRow"),
    ytmFloatingSidebar: document.getElementById("ytmFloatingSidebar"),
    ytmMode: document.getElementById("ytmMode"),
    ytmProgressColor: document.getElementById("ytmProgressColor"),
    ytmProgressHex: document.getElementById("ytmProgressHex"),
    ytmScrubberColor: document.getElementById("ytmScrubberColor"),
    ytmScrubberHex: document.getElementById("ytmScrubberHex"),
    ytmShowPlaylistSongs: document.getElementById("ytmShowPlaylistSongs"),
  };

  let currentHost = null;
  let currentTabId = null;
  let currentUrl = null;
  let currentSite = null;
  let currentYouTubePage = null;
  let currentSettings = settingsHelper.getDefaultSettings();
  let selectedYouTubePage = null;
  let siteCardsInitialized = false;
  let youtubePageDraft = settingsHelper.clone(currentSettings.youtube.pages);
  const temporaryReveals = new Set();

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

  async function getCurrentTabContext() {
    try {
      const tabs = await callApi(api.tabs.query.bind(api.tabs), [
        { active: true, currentWindow: true },
      ]);
      const tab = tabs?.[0];
      if (!tab?.url) return { host: null, id: null, url: null };

      return {
        host: new URL(tab.url).hostname,
        id: tab.id || null,
        url: tab.url,
      };
    } catch {
      return { host: null, id: null, url: null };
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

  function setSiteCardExpanded(card, expanded) {
    const toggle = card.querySelector(".site-card-toggle");
    card.classList.toggle("collapsed", !expanded);
    toggle?.setAttribute("aria-expanded", String(expanded));
  }

  function initializeSiteCards() {
    if (siteCardsInitialized) return;

    const initiallyExpanded = currentSite || "youtube";
    document.querySelectorAll(".site-card").forEach((card) => {
      setSiteCardExpanded(card, card.dataset.site === initiallyExpanded);
    });
    siteCardsInitialized = true;
  }

  const youtubePageUi = {
    home: {
      hint: "Control recommendations and Shorts on the Home feed.",
      recommendationLabel: "Hide home feed",
      recommendationHint: "Remove recommended videos from Home",
      visibleRules: ["recommendations", "shorts"],
    },
    watch: {
      hint: "Tune suggestions and playlists independently on the watch page.",
      recommendationLabel: "Hide recommendations",
      recommendationHint: "Suggested videos only — playlists stay available",
      visibleRules: ["recommendations", "playlists", "comments", "shorts"],
    },
    search: {
      hint: "Keep Shorts out of YouTube search results.",
      recommendationLabel: "Hide recommendations",
      recommendationHint: "Suggested videos in search",
      visibleRules: ["shorts"],
    },
    channel: {
      hint: "Choose whether Shorts appear on channel pages.",
      recommendationLabel: "Hide recommendations",
      recommendationHint: "Suggested videos on channels",
      visibleRules: ["shorts"],
    },
  };

  function saveSelectedYouTubePage() {
    if (!selectedYouTubePage) return;

    youtubePageDraft[selectedYouTubePage] = {
      ...youtubePageDraft[selectedYouTubePage],
      hideRecommendations: elements.ytHideRec.checked,
      hidePlaylists: elements.ytHidePlaylists.checked,
      hideComments: elements.ytHideComments.checked,
      hideShorts: elements.ytHideShorts.checked,
    };
  }

  function loadYouTubePage(page) {
    const normalizedPage = settingsHelper.YOUTUBE_PAGE_TYPES.includes(page)
      ? page
      : "home";
    const pageSettings = youtubePageDraft[normalizedPage];
    const ui = youtubePageUi[normalizedPage];

    selectedYouTubePage = normalizedPage;
    elements.ytPageScope.value = normalizedPage;
    elements.ytPageHint.textContent = ui.hint;
    elements.ytHideRecLabel.textContent = ui.recommendationLabel;
    elements.ytHideRecHint.textContent = ui.recommendationHint;
    elements.ytHideRec.checked = pageSettings.hideRecommendations;
    elements.ytHidePlaylists.checked = pageSettings.hidePlaylists;
    elements.ytHideComments.checked = pageSettings.hideComments;
    elements.ytHideShorts.checked = pageSettings.hideShorts;

    document.querySelectorAll(".youtube-rule").forEach((row) => {
      row.hidden = !ui.visibleRules.includes(row.dataset.youtubeRule);
    });
  }

  function updateYouTubeLayoutControls() {
    const safeMode = elements.ytSafeMode.checked;
    const youtubeCard = document.querySelector('[data-site="youtube"]');
    const layoutInputs = [
      elements.ytHamburger,
      elements.ytVideosPerRow,
      elements.ytProgressColor,
      elements.ytProgressHex,
      elements.ytScrubberColor,
      elements.ytScrubberHex,
    ];

    youtubeCard.classList.toggle("safe-mode", safeMode);
    layoutInputs.forEach((input) => {
      input.disabled = safeMode;
    });
  }

  function updateShowOnceControls() {
    const buttons = {
      comments: elements.ytShowCommentsOnce,
      playlists: elements.ytShowPlaylistsOnce,
      recommendations: elements.ytShowRecommendationsOnce,
      shorts: elements.ytShowShortsOnce,
    };
    const propertyNames = {
      comments: "hideComments",
      playlists: "hidePlaylists",
      recommendations: "hideRecommendations",
      shorts: "hideShorts",
    };
    const relevantFeatures = {
      home: ["recommendations", "shorts"],
      watch: ["recommendations", "playlists", "comments", "shorts"],
      search: ["shorts"],
      channel: ["shorts"],
    };
    const pageSettings = currentYouTubePage
      ? currentSettings.youtube.pages[currentYouTubePage]
      : null;
    const extensionActive =
      currentSite === "youtube" &&
      currentSettings.enabled &&
      currentSettings.youtube.enabled &&
      !currentSettings.pausedSites?.[currentHost];

    for (const [feature, button] of Object.entries(buttons)) {
      const relevant = relevantFeatures[currentYouTubePage]?.includes(feature);
      const hidden = pageSettings?.[propertyNames[feature]];
      const revealed = temporaryReveals.has(feature);

      button.disabled = !extensionActive || !relevant || !hidden || revealed;
      button.classList.toggle("revealed", revealed);
      button.title = revealed
        ? "Already revealed for this page"
        : hidden && relevant
          ? `Show ${feature} until this tab navigates or reloads`
          : `${feature[0].toUpperCase()}${feature.slice(1)} are not hidden here`;
    }

    elements.ytShowRecommendationsOnce.textContent =
      currentYouTubePage === "home" ? "Home feed" : "Recommendations";
  }

  async function showYouTubeFeatureOnce(feature) {
    if (!currentTabId) return;

    try {
      await callApi(api.tabs.sendMessage.bind(api.tabs), [
        currentTabId,
        { type: "TEMPORARY_REVEAL", feature },
      ]);
      temporaryReveals.add(feature);
      updateShowOnceControls();
      showStatus(`${feature[0].toUpperCase()}${feature.slice(1)} shown once`);
    } catch {
      showStatus("Reload the YouTube tab and try again");
    }
  }

  async function loadTemporaryRevealState() {
    if (currentSite !== "youtube" || !currentTabId) return;

    try {
      const response = await callApi(api.tabs.sendMessage.bind(api.tabs), [
        currentTabId,
        { type: "GET_TEMPORARY_REVEALS" },
      ]);
      for (const feature of response?.features || []) {
        temporaryReveals.add(feature);
      }
      updateShowOnceControls();
    } catch {
      // A newly installed or reloaded extension may need the YouTube tab refreshed.
    }
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
        "Open YouTube, YouTube Music, Reddit, Twitter/X, or Pinterest to use site controls.";
      elements.siteLabel.textContent = "No supported site";
      elements.sitePaused.checked = false;
      elements.sitePaused.disabled = true;
      initializeSiteCards();
      updateShowOnceControls();
      return;
    }

    elements.currentSitePanel.classList.remove("unsupported");
    elements.currentSiteName.textContent = currentHost;
    elements.currentSiteHint.textContent =
      "Pause only this site without changing defaults.";
    const siteNames = {
      pinterest: "Pinterest",
      reddit: "Reddit",
      twitter: "Twitter / X",
      youtube: "YouTube",
      youtubeMusic: "YouTube Music",
    };
    elements.siteLabel.textContent = `${siteNames[currentSite]} active`;
    elements.sitePaused.disabled = false;
    elements.sitePaused.checked = !!currentSettings.pausedSites?.[currentHost];
    initializeSiteCards();
    updateShowOnceControls();
  }

  function applyYouTubeMode(mode) {
    elements.ytMode.value = mode;

    if (!["calm", "focus", "deep-focus"].includes(mode)) return;

    const focused = mode !== "calm";
    for (const page of settingsHelper.YOUTUBE_PAGE_TYPES) {
      youtubePageDraft[page] = {
        ...youtubePageDraft[page],
        hideRecommendations: page === "watch" || (page === "home" && focused),
        hidePlaylists: false,
        hideComments: page === "watch" && focused,
        hideShorts: true,
      };
    }

    elements.ytHamburger.checked = mode === "deep-focus";
    loadYouTubePage(selectedYouTubePage || currentYouTubePage || "home");
  }

  function applyYouTubeMusicMode(mode) {
    elements.ytmMode.value = mode;
    elements.ytmShowPlaylistSongs.checked = mode !== "focus";
  }

  function applyPreset(name) {
    elements.globalPreset.value = name;

    if (name === "calm") {
      applyYouTubeMode("calm");
      elements.rdMode.value = "minimal";
      elements.twMode.value = "zen";
      elements.ptMode.value = "minimal";
      applyYouTubeMusicMode("minimal");
      elements.ytmFloatingSidebar.checked = false;
    }

    if (name === "focus") {
      applyYouTubeMode("focus");
      elements.rdMode.value = "compact";
      elements.twMode.value = "focus";
      elements.ptMode.value = "dark";
      applyYouTubeMusicMode("focus");
      elements.ytmFloatingSidebar.checked = false;
    }

    if (name === "deep-focus") {
      applyYouTubeMode("deep-focus");
      elements.rdMode.value = "focus";
      elements.twMode.value = "zen";
      elements.ptMode.value = "dark";
      applyYouTubeMusicMode("focus");
      elements.ytmFloatingSidebar.checked = true;
    }
  }

  function setCustomPreset() {
    elements.globalPreset.value = "custom";
  }

  function buildSettings() {
    saveSelectedYouTubePage();
    const watchPage = youtubePageDraft.watch;

    return settingsHelper.normalizeSettings({
      enabled: elements.masterEnabled.checked,
      preset: elements.globalPreset.value,
      hidePromotedContent: elements.hidePromotedContent.checked,
      youtube: {
        enabled: true,
        mode: elements.ytMode.value,
        hideRecommendations: watchPage.hideRecommendations,
        hidePlaylists: watchPage.hidePlaylists,
        hideComments: watchPage.hideComments,
        hideShorts: watchPage.hideShorts,
        safeMode: elements.ytSafeMode.checked,
        pages: settingsHelper.clone(youtubePageDraft),
        floatingSidebar: elements.ytHamburger.checked,
        videosPerRow: Number(elements.ytVideosPerRow.value),
        progressColor: elements.ytProgressHex.value,
        scrubberColor: elements.ytScrubberHex.value,
      },
      youtubeMusic: {
        enabled: true,
        mode: elements.ytmMode.value,
        floatingSidebar: elements.ytmFloatingSidebar.checked,
        showPlaylistSongs: elements.ytmShowPlaylistSongs.checked,
        progressColor: elements.ytmProgressHex.value,
        scrubberColor: elements.ytmScrubberHex.value,
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
    });
  }

  function syncColorPair(colorInput, hexInput, value) {
    const color = /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : "#4cafef";
    colorInput.value = color;
    hexInput.value = color;
  }

  function updateUI(settings) {
    currentSettings = settingsHelper.normalizeSettings(settings);
    const visibleSettings = currentSettings;

    elements.masterEnabled.checked = visibleSettings.enabled;
    elements.globalPreset.value = visibleSettings.preset;
    elements.hidePromotedContent.checked = visibleSettings.hidePromotedContent;
    elements.ytMode.value = visibleSettings.youtube.mode;
    elements.ytSafeMode.checked = visibleSettings.youtube.safeMode;
    youtubePageDraft = settingsHelper.clone(visibleSettings.youtube.pages);
    loadYouTubePage(
      selectedYouTubePage || currentYouTubePage || elements.ytPageScope.value,
    );
    elements.ytHamburger.checked = visibleSettings.youtube.floatingSidebar;
    elements.ytVideosPerRow.value = visibleSettings.youtube.videosPerRow;
    elements.ytmMode.value = visibleSettings.youtubeMusic.mode;
    elements.ytmFloatingSidebar.checked = visibleSettings.youtubeMusic.floatingSidebar;
    elements.ytmShowPlaylistSongs.checked =
      visibleSettings.youtubeMusic.showPlaylistSongs;
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
    syncColorPair(
      elements.ytmProgressColor,
      elements.ytmProgressHex,
      visibleSettings.youtubeMusic.progressColor,
    );
    syncColorPair(
      elements.ytmScrubberColor,
      elements.ytmScrubberHex,
      visibleSettings.youtubeMusic.scrubberColor,
    );

    updateYouTubeLayoutControls();
    updateCurrentSiteUi();
  }

  async function loadSettings() {
    const raw = await storage.get();
    currentSettings = settingsHelper.normalizeSettings(raw);
    updateUI(currentSettings);
  }

  async function saveFromUi(message) {
    await persistSettings(buildSettings(), message);
  }

  function wireEvents() {
    document.querySelectorAll(".site-card-toggle").forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const card = toggle.closest(".site-card");
        setSiteCardExpanded(card, card.classList.contains("collapsed"));
      });
    });

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

    elements.ytmMode.addEventListener("change", async () => {
      applyYouTubeMusicMode(elements.ytmMode.value);
      setCustomPreset();
      await saveFromUi();
    });

    elements.ytMode.addEventListener("change", async () => {
      applyYouTubeMode(elements.ytMode.value);
      setCustomPreset();
      await saveFromUi();
    });

    elements.ytPageScope.addEventListener("change", () => {
      saveSelectedYouTubePage();
      loadYouTubePage(elements.ytPageScope.value);
    });

    [
      elements.hidePromotedContent,
      elements.masterEnabled,
      elements.ytHideComments,
      elements.ytHidePlaylists,
      elements.ytHideRec,
      elements.ytHideShorts,
      elements.ytHamburger,
      elements.ytSafeMode,
      elements.ytVideosPerRow,
    ].forEach((input) => {
      input.addEventListener("change", async () => {
        if (input === elements.ytSafeMode) updateYouTubeLayoutControls();
        if (input !== elements.masterEnabled && input !== elements.hidePromotedContent) {
          elements.ytMode.value = "custom";
        }
        setCustomPreset();
        await saveFromUi();
      });
    });

    elements.ytShowRecommendationsOnce.addEventListener("click", () =>
      showYouTubeFeatureOnce("recommendations"),
    );
    elements.ytShowPlaylistsOnce.addEventListener("click", () =>
      showYouTubeFeatureOnce("playlists"),
    );
    elements.ytShowCommentsOnce.addEventListener("click", () =>
      showYouTubeFeatureOnce("comments"),
    );
    elements.ytShowShortsOnce.addEventListener("click", () =>
      showYouTubeFeatureOnce("shorts"),
    );

    [elements.ytmFloatingSidebar, elements.ytmShowPlaylistSongs].forEach((input) => {
      input.addEventListener("change", async () => {
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
      [elements.ytmProgressColor, elements.ytmProgressHex],
      [elements.ytmScrubberColor, elements.ytmScrubberHex],
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

    elements.resetSettings.addEventListener("click", async () => {
      if (!confirm("Reset MindFulCloud settings to defaults?")) return;
      await persistSettings(settingsHelper.getDefaultSettings(), "Settings reset");
    });
  }

  const tabContext = await getCurrentTabContext();
  currentHost = tabContext.host;
  currentTabId = tabContext.id;
  currentUrl = tabContext.url;
  currentSite = settingsHelper.getCurrentSite(currentHost || "");
  currentYouTubePage =
    currentSite === "youtube"
      ? settingsHelper.getYouTubePageType(currentUrl || "/")
      : null;
  wireEvents();
  await loadSettings();
  await loadTemporaryRevealState();
});
