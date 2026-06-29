const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const popupHtml = readFileSync(path.join(__dirname, "..", "popup", "popup.html"), "utf8");
const popupScript = readFileSync(path.join(__dirname, "..", "popup", "popup.js"), "utf8");

test("popup markup retains every control used by its script", () => {
  const referencedIds = [...popupScript.matchAll(/getElementById\("([^"]+)"\)/gu)].map(
    (match) => match[1],
  );
  const markupIds = [...popupHtml.matchAll(/\sid="([^"]+)"/gu)].map((match) => match[1]);

  assert.ok(referencedIds.length > 0);
  assert.equal(new Set(markupIds).size, markupIds.length, "popup IDs must be unique");

  for (const id of referencedIds) {
    assert.ok(markupIds.includes(id), `popup is missing #${id}`);
  }
});

test("popup starts in a visually accurate unsupported-site state", () => {
  assert.match(
    popupHtml,
    /class="panel current-site unsupported"\s+id="currentSitePanel"/u,
  );
});

test("every platform card has an accessible collapse control", () => {
  const cards = [...popupHtml.matchAll(/<article class="site-card"/gu)];
  const toggles = [
    ...popupHtml.matchAll(/class="site-card-toggle"[\s\S]*?aria-expanded="true"/gu),
  ];

  assert.equal(cards.length, 5);
  assert.equal(toggles.length, cards.length);
});

test("YouTube exposes page rules, compatibility mode, and temporary reveals", () => {
  for (const id of [
    "ytPageScope",
    "ytSafeMode",
    "ytShowRecommendationsOnce",
    "ytShowCommentsOnce",
    "ytShowShortsOnce",
  ]) {
    assert.match(popupHtml, new RegExp(`id="${id}"`, "u"));
  }
});
