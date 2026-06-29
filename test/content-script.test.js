const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const contentScript = readFileSync(path.join(__dirname, "..", "content.js"), "utf8");

test("YouTube page rules follow SPA navigation without a DOM observer", () => {
  assert.match(contentScript, /getYouTubePageType\(location\.href\)/u);
  assert.match(contentScript, /yt-navigate-finish/u);
  assert.doesNotMatch(contentScript, /new MutationObserver/u);
});

test("temporary reveals remain in memory and clear on navigation", () => {
  assert.match(contentScript, /const temporaryReveals = new Set\(\)/u);
  assert.match(contentScript, /TEMPORARY_REVEAL/u);
  assert.match(contentScript, /GET_TEMPORARY_REVEALS/u);
  assert.match(contentScript, /temporaryReveals\.clear\(\)/u);
});

test("compatibility mode selects the hiding-only root class", () => {
  assert.match(contentScript, /safeMode \? "mindful-youtube-safe" : "mindful-youtube"/u);
});
