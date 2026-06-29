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
  assert.match(css, /ytd-rich-section-renderer:has\(grid-shelf-view-model\)/u);
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
    assert.match(
      block,
      /html:is\(\.mindful-youtube,\s*\.mindful-youtube-safe\)\.hide-promoted-content/u,
    );
  }
});

test("compatibility mode keeps hiding rules without layout overrides", () => {
  assert.match(css, /\.mindful-youtube-safe\)\.hide-promoted-content/u);
  assert.match(css, /html\.yt-hide-shorts\s/u);
  assert.doesNotMatch(css, /html\.mindful-youtube-safe\s+#masthead-container/u);
});

test("video columns use YouTube's native feed layout", () => {
  assert.match(css, /--ytd-rich-grid-items-per-row:\s*var\(--yt-videos-per-row,\s*4\)/u);
  assert.doesNotMatch(
    css,
    /#contents\.ytd-rich-grid-renderer\s*\{[^}]*display:\s*grid/iu,
  );
});

test("the hidden home-feed chip bar cannot reserve header space", () => {
  assert.match(css, /#header\.ytd-rich-grid-renderer,/u);
  assert.match(css, /ytd-feed-filter-chip-bar-renderer\s*\{[^}]*display:\s*none/iu);
});

test("hidden navigation does not reserve page space", () => {
  assert.match(css, /html\.mindful-youtube\s+#page-manager\s*\{[^}]*margin-left:\s*0/iu);
  assert.doesNotMatch(css, /ytd-watch-flexy\s*\{[^}]*margin-top:\s*70px/iu);
});

test("the masthead blur cannot bleed over the first video row", () => {
  assert.match(
    css,
    /#masthead-container\s+#background\s*\{[^}]*backdrop-filter:\s*none/iu,
  );
  assert.match(css, /#frosted-glass\s*\{[^}]*display:\s*none/iu);
});

test("theme colors follow YouTube's active light or dark palette", () => {
  assert.match(css, /--mf-text:\s*var\(--yt-spec-text-primary/u);
  assert.match(css, /--mf-surface-strong:\s*var\(--yt-spec-base-background/u);
  assert.doesNotMatch(css, /color-scheme:\s*light dark/u);
});
