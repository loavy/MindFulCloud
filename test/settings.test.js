const assert = require("node:assert/strict");
const test = require("node:test");

require("../shared/settings.js");

const settings = globalThis.MindFulCloudSettings;

test("supported-site detection only accepts real domain boundaries", () => {
  assert.equal(settings.getCurrentSite("www.youtube.com"), "youtube");
  assert.equal(settings.getCurrentSite("music.youtube.com"), "youtubeMusic");
  assert.equal(settings.getCurrentSite("old.reddit.com"), "reddit");
  assert.equal(settings.getCurrentSite("x.com"), "twitter");
  assert.equal(settings.getCurrentSite("www.pinterest.com."), "pinterest");

  assert.equal(settings.getCurrentSite("notyoutube.com"), null);
  assert.equal(settings.getCurrentSite("youtube.com.example.org"), null);
  assert.equal(settings.getCurrentSite("fake-x.com"), null);
});

test("YouTube grid size is normalized to its supported range", () => {
  assert.equal(
    settings.normalizeSettings({ youtube: { videosPerRow: 1 } }).youtube.videosPerRow,
    2,
  );
  assert.equal(
    settings.normalizeSettings({ youtube: { videosPerRow: 20 } }).youtube.videosPerRow,
    8,
  );
  assert.equal(
    settings.normalizeSettings({ youtube: { videosPerRow: "invalid" } }).youtube
      .videosPerRow,
    4,
  );
});

test("YouTube URLs map to their page-specific rule groups", () => {
  assert.equal(settings.getYouTubePageType("https://youtube.com/"), "home");
  assert.equal(
    settings.getYouTubePageType("https://youtube.com/feed/subscriptions"),
    "home",
  );
  assert.equal(settings.getYouTubePageType("https://youtube.com/watch?v=abc"), "watch");
  assert.equal(settings.getYouTubePageType("https://youtube.com/shorts/abc"), "watch");
  assert.equal(
    settings.getYouTubePageType("https://youtube.com/results?search_query=test"),
    "search",
  );
  assert.equal(
    settings.getYouTubePageType("https://youtube.com/@GoogleDevelopers"),
    "channel",
  );
});

test("legacy YouTube toggles migrate into page-specific rules", () => {
  const migrated = settings.normalizeSettings({
    youtube: {
      hideRecommendations: false,
      hideComments: true,
      hideShorts: false,
    },
  });

  assert.equal(migrated.youtube.pages.watch.hideRecommendations, false);
  assert.equal(migrated.youtube.pages.watch.hidePlaylists, false);
  assert.equal(migrated.youtube.pages.watch.hideComments, true);
  for (const page of settings.YOUTUBE_PAGE_TYPES) {
    assert.equal(migrated.youtube.pages[page].hideShorts, false);
  }
  assert.equal(migrated.youtube.pages.home.hideRecommendations, false);
});

test("page-specific YouTube rules and compatibility mode are normalized", () => {
  const normalized = settings.normalizeSettings({
    youtube: {
      safeMode: true,
      pages: {
        home: {
          hideRecommendations: true,
          hideShorts: false,
        },
        watch: {
          hidePlaylists: true,
          hideComments: true,
        },
      },
    },
  });

  assert.equal(normalized.youtube.safeMode, true);
  assert.equal(normalized.youtube.pages.home.hideRecommendations, true);
  assert.equal(normalized.youtube.pages.home.hideShorts, false);
  assert.equal(normalized.youtube.pages.watch.hidePlaylists, true);
  assert.equal(normalized.youtube.pages.watch.hideComments, true);
  assert.equal(normalized.youtube.pages.channel.hideShorts, true);
});

test("YouTube playlist visibility stays independent from recommendations", () => {
  const defaults = settings.getDefaultSettings();
  assert.equal(defaults.youtube.pages.watch.hideRecommendations, true);
  assert.equal(defaults.youtube.pages.watch.hidePlaylists, false);

  const normalized = settings.normalizeSettings({
    youtube: {
      pages: {
        watch: {
          hideRecommendations: false,
          hidePlaylists: true,
        },
      },
    },
  });

  assert.equal(normalized.youtube.pages.watch.hideRecommendations, false);
  assert.equal(normalized.youtube.pages.watch.hidePlaylists, true);
  assert.equal(normalized.youtube.pages.home.hidePlaylists, false);
  assert.ok(settings.SITE_CLASSES.includes("yt-hide-playlists"));
});

test("invalid YouTube playlist values fall back to visible", () => {
  const normalized = settings.normalizeSettings({
    youtube: {
      pages: {
        watch: { hidePlaylists: "yes" },
      },
    },
  });

  assert.equal(normalized.youtube.pages.watch.hidePlaylists, false);
});
