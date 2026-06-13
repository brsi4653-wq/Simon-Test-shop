import test from "node:test";
import assert from "node:assert/strict";
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
