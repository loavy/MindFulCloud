const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const expectedVersion = "6.0.0";

function readJson(file) {
  return JSON.parse(readFileSync(path.join(root, file), "utf8"));
}

test("release metadata consistently reports version 6.0.0", () => {
  assert.equal(readJson("package.json").version, expectedVersion);
  assert.equal(readJson("package-lock.json").version, expectedVersion);
  assert.equal(readJson("package-lock.json").packages[""].version, expectedVersion);

  for (const manifest of [
    "manifest.json",
    "manifest.chrome.json",
    "manifest.firefox.json",
  ]) {
    assert.equal(readJson(manifest).version, expectedVersion, manifest);
  }

  const readme = readFileSync(path.join(root, "README.md"), "utf8");
  assert.match(readme, /alt="Version 6\.0\.0"/u);
  assert.match(readme, /badge\/version-6\.0\.0-/u);
});
