import test from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_APPEARANCE, normalizeAppearance, resolveHeaderLogo } from "../docs/assets/settings-model.js";

test("appearance settings provide complete safe defaults", () => {
  const settings = normalizeAppearance();
  assert.equal(settings.home_headline, DEFAULT_APPEARANCE.home_headline);
  assert.equal(settings.card_columns, "4");
  assert.equal(settings.header_logo, "ships-white");
  assert.equal(settings.add_to_cart_label, "Add to cart");
});

test("appearance settings preserve valid choices and reject unsupported choices", () => {
  const settings = normalizeAppearance({
    hero_layout: "centered",
    card_columns: "3",
    corner_style: "rounded",
    motion: "wild",
  });
  assert.equal(settings.hero_layout, "centered");
  assert.equal(settings.card_columns, "3");
  assert.equal(settings.corner_style, "rounded");
  assert.equal(settings.motion, DEFAULT_APPEARANCE.motion);
});

test("main SHIPS header logo follows theme contrast while alternate marks remain selectable", () => {
  const darkLogo = "images/logos/ships-main-black-display.png";
  const lightLogo = "images/logos/ships-main-white-display.png";
  assert.equal(resolveHeaderLogo(darkLogo, "ships-white"), darkLogo);
  assert.equal(resolveHeaderLogo(lightLogo, "ships-black"), lightLogo);
  assert.equal(resolveHeaderLogo(darkLogo, "ships-tag"), "images/logos/ships-tag-display.png");
});
