import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRequestEmail,
  getProductAction,
  normalizeItem,
  normalizeItems,
  parseLines,
  parseGallery,
  toPublicGarmentCopy,
} from "../docs/assets/item-model.js";

test("normalizeItem supplies safe defaults and preserves the supported item mode", () => {
  const item = normalizeItem({ title: "Studio Shirt", item_mode: "hybrid" });
  assert.equal(item.title, "Studio Shirt");
  assert.equal(item.item_mode, "hybrid");
  assert.equal(item.theme, "global");
  assert.deepEqual(item.gallery_urls, []);
});

test("normalizeItem rejects unsupported item modes and themes", () => {
  const item = normalizeItem({ item_mode: "instant-checkout", theme: "unknown", availability_status: "unknown" });
  assert.equal(item.item_mode, "regular");
  assert.equal(item.theme, "global");
  assert.equal(item.availability_status, "request-only");
});

test("existing garments default to request-only with no Shopify URL", () => {
  const item = normalizeItem({ title: "Archive Tee" });
  assert.equal(item.availability_status, "request-only");
  assert.equal(item.shopify_product_url, "");
});

test("available garments with a Shopify URL use a same-tab buy action", () => {
  const url = "https://m2fqhe-2r.myshopify.com/products/past-v-future-essential-cotton-t-shirt";
  const action = getProductAction({ title: "Shop Tee", availability_status: "available", shopify_product_url: ` ${url} ` });
  assert.deepEqual(action, { type: "shopify", label: "BUY NOW", href: url, disabled: false });
});

test("available garments without a Shopify URL retain the email request flow", () => {
  const action = getProductAction({ title: "Request Tee", availability_status: "available" }, "orders@example.com");
  assert.equal(action.type, "email");
  assert.equal(action.label, "REQUEST GARMENT");
  assert.equal(action.disabled, false);
  assert.match(action.href, /^mailto:orders@example\.com\?/);
});

test("available garments with unsafe non-web URLs retain the email request flow", () => {
  const action = getProductAction({
    title: "Unsafe Link Tee",
    availability_status: "available",
    shopify_product_url: "javascript:alert('nope')",
  });
  assert.equal(action.type, "email");
  assert.equal(action.label, "REQUEST GARMENT");
  assert.match(action.href, /^mailto:/);
});

test("request-only ignores Shopify URLs and retains the email request flow", () => {
  const action = getProductAction({
    title: "Private Release",
    availability_status: "request-only",
    shopify_product_url: "https://example.myshopify.com/products/private-release",
  });
  assert.equal(action.type, "email");
  assert.equal(action.label, "REQUEST GARMENT");
  assert.match(action.href, /^mailto:/);
});

test("coming-soon and sold-out garments use disabled actions", () => {
  assert.deepEqual(getProductAction({ availability_status: "coming-soon" }), {
    type: "disabled", label: "COMING SOON", href: "", disabled: true,
  });
  assert.deepEqual(getProductAction({ availability_status: "sold-out" }), {
    type: "disabled", label: "SOLD OUT", href: "", disabled: true,
  });
});

test("normalizeItems preserves an intentionally empty collection", () => {
  assert.deepEqual(normalizeItems([]), []);
});

test("normalizeItems normalizes every supplied item", () => {
  const items = normalizeItems([{ title: "One" }, { title: "Two", item_mode: "custom" }]);
  assert.equal(items.length, 2);
  assert.equal(items[0].title, "One");
  assert.equal(items[1].item_mode, "custom");
});

test("parseLines removes blank entries and surrounding whitespace", () => {
  assert.deepEqual(parseLines(" Small \n\nMedium\n Large "), ["Small", "Medium", "Large"]);
});

test("parseGallery accepts newline-separated image URLs and removes duplicates", () => {
  assert.deepEqual(parseGallery("one.jpg\ntwo.jpg\none.jpg"), ["one.jpg", "two.jpg"]);
});

test("every garment request asks for ordinary ordering details", () => {
  const email = buildRequestEmail(normalizeItem({
    title: "Green Studio Shirt",
    item_mode: "regular",
    sizes: ["Small", "Medium"],
    colors: ["Green", "Cream"],
  }), "orders@example.com");

  assert.match(email.href, /^mailto:orders@example\.com\?/);
  assert.match(email.body, /Preferred size:/);
  assert.match(email.body, /Preferred color:/);
  assert.match(email.body, /Shipping location:/);
  assert.match(email.body, /Questions or notes:/);
  assert.doesNotMatch(email.body, /My design idea or artwork|Preferred print placement|Preferred style or references/);
});

test("all modes use the same garment-first request language", () => {
  const email = buildRequestEmail(normalizeItem({
    title: "Named Print",
    item_mode: "custom",
    customization_options: ["Name on front", "Font choice"],
  }), "orders@example.com");

  assert.match(email.subject, /Garment request/);
  assert.match(email.body, /Optional custom print request \(if available\):/);
  assert.match(email.body, /current availability, final price, and ordering details/);
});

test("selected garments keep custom requests optional and secondary", () => {
  const email = buildRequestEmail(normalizeItem({
    title: "Studio Shirt",
    item_mode: "hybrid",
  }), "orders@example.com");

  assert.match(email.body, /Optional custom print request \(if available\):/);
  assert.doesNotMatch(email.body, /My design idea or artwork|Preferred print placement/);
  assert.match(email.body, /current availability, final price, and ordering details/);
});

test("older service-style database copy is presented as brand catalogue copy", () => {
  const publicCopy = toPublicGarmentCopy(normalizeItem({
    title: "Sunfade Hoodie",
    eyebrow: "Full custom / Hoodie",
    summary: "A hoodie available for custom SHIPS design requests.",
    description: "Send SHIPS your artwork and we will prepare the design.",
  }));

  assert.equal(publicCopy.eyebrow, "Hoodie");
  assert.doesNotMatch(publicCopy.summary, /custom|design request/i);
  assert.doesNotMatch(publicCopy.description, /send SHIPS|artwork|prepare the design/i);
  assert.match(publicCopy.description, /current SHIPS collection/i);
});
