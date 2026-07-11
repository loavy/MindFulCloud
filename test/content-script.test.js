const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const contentScript = readFileSync(path.join(__dirname, "..", "content.js"), "utf8");

test("YouTube page rules follow SPA navigation events", () => {
  assert.match(contentScript, /getYouTubePageType\(location\.href\)/u);
  assert.match(contentScript, /yt-navigate-finish/u);
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

test("YouTube playlists use an independent page rule and temporary reveal", () => {
  assert.match(
    contentScript,
    /pageSettings\.hidePlaylists && !temporaryReveals\.has\("playlists"\)/u,
  );
  assert.match(contentScript, /"yt-hide-playlists"/u);
});

test("recommendation-free watch pages move playlists below the player", () => {
  assert.match(contentScript, /classList\.contains\("mindful-youtube"\)/u);
  assert.match(contentScript, /below\.prepend\(playlistPanel\)/u);
  assert.match(contentScript, /secondaryInner\.prepend\(playlistPanel\)/u);
  assert.match(contentScript, /data-mindful-playlist-stacked/u);
  assert.match(contentScript, /hasAttribute\("is-two-columns_"\)/u);
});

test("the playlist observer is scoped to YouTube's watch renderer", () => {
  assert.match(contentScript, /playlistLayoutObserver\.observe\(watchFlexy,/u);
  assert.doesNotMatch(
    contentScript,
    /playlistLayoutObserver\.observe\((?:document|document\.body|html),/u,
  );
});
