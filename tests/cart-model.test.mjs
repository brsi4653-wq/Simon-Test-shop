import test from "node:test";
import assert from "node:assert/strict";

import {
  addCartItem,
  buildCartRequestEmail,
  canAddToCart,
  normalizeCart,
  reconcileCart,
  updateCartItem,
} from "../docs/assets/cart-model.js";

test("only available and request-only garments can enter the request cart", () => {
  assert.equal(canAddToCart({ availability_status: "available" }), true);
  assert.equal(canAddToCart({ availability_status: "request-only" }), true);
  assert.equal(canAddToCart({ availability_status: "coming-soon" }), false);
  assert.equal(canAddToCart({ availability_status: "sold-out" }), false);
});

test("adding the same garment increases its quantity without duplicating it", () => {
  const item = { id: "one", slug: "studio-tee", title: "Studio Tee", availability_status: "available" };
  const cart = addCartItem(addCartItem([], item), item);
  assert.equal(cart.length, 1);
  assert.equal(cart[0].quantity, 2);
});

test("cart entries preserve request details and reject invalid quantities", () => {
  const cart = updateCartItem([{ id: "one", slug: "tee", title: "Tee", quantity: 1 }], "one", {
    quantity: 0,
    size: "L",
    color: "Black",
    notes: "Two if possible",
  });
  assert.equal(cart[0].quantity, 1);
  assert.equal(cart[0].size, "L");
  assert.equal(cart[0].color, "Black");
  assert.equal(cart[0].notes, "Two if possible");
});

test("combined request email includes every cart garment and entered detail", () => {
  const email = buildCartRequestEmail([
    { id: "one", title: "Studio Tee", quantity: 2, size: "L", color: "Black", notes: "Gift" },
    { id: "two", title: "Sunfade Hoodie", quantity: 1, size: "M", color: "Pink", notes: "" },
  ], "purchase@example.com");
  assert.match(email.href, /^mailto:purchase@example\.com\?/);
  assert.match(email.body, /Studio Tee/);
  assert.match(email.body, /Quantity: 2/);
  assert.match(email.body, /Size: L/);
  assert.match(email.body, /Sunfade Hoodie/);
  assert.match(email.body, /Shipping location:/);
});

test("normalizeCart safely accepts missing or invalid browser data", () => {
  assert.deepEqual(normalizeCart(null), []);
  assert.deepEqual(normalizeCart("bad"), []);
});

test("saved cart removes garments that later become unavailable or disappear", () => {
  const cart = [
    { id: "one", title: "Available Tee", quantity: 1 },
    { id: "two", title: "Sold Out Hoodie", quantity: 1 },
    { id: "missing", title: "Removed Piece", quantity: 1 },
  ];
  const items = [
    { id: "one", title: "Available Tee", availability_status: "available" },
    { id: "two", title: "Sold Out Hoodie", availability_status: "sold-out" },
  ];
  assert.deepEqual(reconcileCart(cart, items).map((entry) => entry.id), ["one"]);
});
