import test from "node:test";
import assert from "node:assert/strict";

import {
  MAX_COLLECTIONS,
  filterItemsByCollection,
  normalizeCollection,
  normalizeCollections,
  normalizeItem,
} from "../docs/assets/item-model.js";

test("normalizeCollection supplies a stable slug and visibility defaults", () => {
  assert.deepEqual(normalizeCollection({ name: "Nova Scotia" }), {
    id: "",
    name: "Nova Scotia",
    slug: "nova-scotia",
    sort_order: 0,
    is_visible: true,
  });
});

test("normalizeCollections orders collections and limits public controls to six", () => {
  const collections = Array.from({ length: 8 }, (_, index) => ({
    name: `Collection ${index + 1}`,
    sort_order: 8 - index,
  }));
  const normalized = normalizeCollections(collections);
  assert.equal(normalized.length, MAX_COLLECTIONS);
  assert.equal(normalized[0].name, "Collection 8");
});

test("normalizeItem preserves collection slugs and ids", () => {
  const item = normalizeItem({
    title: "Blank Tee",
    collection_slugs: ["blanks", "nova-scotia"],
    collection_ids: ["one", "two"],
  });
  assert.deepEqual(item.collection_slugs, ["blanks", "nova-scotia"]);
  assert.deepEqual(item.collection_ids, ["one", "two"]);
});

test("Featured includes selected items, All includes every item, and custom collections include assigned items only", () => {
  const items = [
    normalizeItem({ title: "Blank", is_featured: true, collection_slugs: ["blanks"] }),
    normalizeItem({ title: "Hybrid", collection_slugs: ["semi-customizable"] }),
    normalizeItem({ title: "Unassigned", is_featured: true }),
  ];
  assert.deepEqual(filterItemsByCollection(items, "featured").map((item) => item.title), ["Blank", "Unassigned"]);
  assert.equal(filterItemsByCollection(items, "all").length, 3);
  assert.deepEqual(filterItemsByCollection(items, "blanks").map((item) => item.title), ["Blank"]);
});
