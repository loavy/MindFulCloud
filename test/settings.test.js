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
