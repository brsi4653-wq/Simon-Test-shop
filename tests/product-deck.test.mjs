import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { deckPosition, stepDeckIndex } from "../docs/assets/deck-model.js";

test("deck movement advances exactly one product and wraps", () => {
  assert.equal(stepDeckIndex(0, 1, 4), 1);
  assert.equal(stepDeckIndex(1, -1, 4), 0);
  assert.equal(stepDeckIndex(3, 1, 4), 0);
  assert.equal(stepDeckIndex(0, -1, 4), 3);
});

test("deck positions identify the selected and neighboring layers", () => {
  assert.equal(deckPosition(2, 2, 5), "active");
  assert.equal(deckPosition(1, 2, 5), "previous");
  assert.equal(deckPosition(3, 2, 5), "next");
  assert.equal(deckPosition(0, 2, 5), "far-previous");
  assert.equal(deckPosition(4, 2, 5), "far-next");
});

test("neighboring products sit behind the active card without being sliced", async () => {
  const css = await readFile(new URL("../docs/assets/site.css", import.meta.url), "utf8");
  assert.match(css, /\.deck-card\.is-previous\s*\{[^}]*z-index:\s*[1-9][^}]*translate3d\(-2[0-9]%/s);
  assert.match(css, /\.deck-card\.is-next\s*\{[^}]*z-index:\s*[1-9][^}]*translate3d\(2[0-9]%/s);
  assert.doesNotMatch(css, /\.deck-card\.is-(?:previous|next)\s*\{[^}]*clip-path:/s);
});

test("fixed header protects the logo from scrolling page sections", async () => {
  const css = await readFile(new URL("../docs/assets/site.css", import.meta.url), "utf8");
  assert.match(css, /\.site-header\s*\{[^}]*background:\s*var\(--baby-blue\)/s);
});

test("added cart state stays inside the icon button", async () => {
  const siteJs = await readFile(new URL("../docs/assets/site.js", import.meta.url), "utf8");
  assert.match(siteJs, /button\.textContent\s*=\s*"✓"/);
  assert.doesNotMatch(siteJs, /button\.textContent\s*=\s*"Added"/);
});

test("long product titles cannot widen the product page", async () => {
  const css = await readFile(new URL("../docs/assets/site.css", import.meta.url), "utf8");
  assert.match(css, /\.detail-copy\s*\{[^}]*min-width:\s*0/s);
  assert.match(css, /\.detail-copy h1[^}]*\{[^}]*overflow-wrap:\s*anywhere/s);
});
