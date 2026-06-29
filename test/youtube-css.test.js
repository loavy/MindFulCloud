const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const css = readFileSync(
  path.join(__dirname, "..", "styles", "youtube", "youtube-clean.css"),
  "utf8",
);

test("Shorts filtering cannot hide a complete YouTube grid", () => {
  assert.doesNotMatch(css, /ytd-rich-grid-renderer:has\([^)]*\/shorts/iu);
  assert.doesNotMatch(css, /ytd-item-section-renderer:has\([^)]*\/shorts/iu);
});

test("normal rich sections are not treated as ads", () => {
  assert.doesNotMatch(css, /html\.mindful-youtube\s+ytd-rich-section-renderer\s*,/u);
  assert.doesNotMatch(css, /html\.mindful-youtube\s+#panels\.ytd-watch-flexy/u);
});

test("promoted-content rules follow the user setting", () => {
  const promotedBlocks = css.match(
    /[^{}]*(?:ytd-ad-slot-renderer|ytp-ad-module)[^{}]*\{[^{}]*display:\s*none/giu,
  );

  assert.ok(promotedBlocks?.length);
  for (const block of promotedBlocks) {
    assert.match(block, /html\.mindful-youtube\.hide-promoted-content/u);
  }
});

test("custom grid layout is limited to the YouTube home feed", () => {
  assert.match(
    css,
    /ytd-browse\[page-subtype="home"\]\s+#contents\.ytd-rich-grid-renderer/u,
  );
  assert.doesNotMatch(
    css,
    /html\.mindful-youtube\s+#contents\.ytd-rich-grid-renderer\s*\{/u,
  );
});

test("theme colors follow YouTube's active light or dark palette", () => {
  assert.match(css, /--mf-text:\s*var\(--yt-spec-text-primary/u);
  assert.match(css, /--mf-surface-strong:\s*var\(--yt-spec-base-background/u);
  assert.doesNotMatch(css, /color-scheme:\s*light dark/u);
});
