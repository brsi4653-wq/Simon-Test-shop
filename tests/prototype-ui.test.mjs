import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const indexHtml = await readFile(new URL("../docs/index.html", import.meta.url), "utf8");
const siteJs = await readFile(new URL("../docs/assets/site.js", import.meta.url), "utf8");
const siteCss = await readFile(new URL("../docs/assets/site.css", import.meta.url), "utf8");
const adminJs = await readFile(new URL("../docs/assets/admin.js", import.meta.url), "utf8");
const settingsSql = await readFile(new URL("../supabase-shop-prototype-settings.sql", import.meta.url), "utf8").catch(() => "");

test("prototype opens directly into the collection wheel with only collection and cart navigation", () => {
  assert.doesNotMatch(indexHtml, /id="home"|data-view="home"/);
  assert.match(indexHtml, /id="collection" class="view active"/);
  assert.match(indexHtml, /class="product-wheel"/);
  assert.match(indexHtml, /data-view="collection"/);
  assert.match(indexHtml, /data-view="cart"/);
});

test("prototype keeps shared catalogue data but isolates visual settings", () => {
  assert.match(siteJs, /from\("public_shop_items"\)/);
  assert.match(siteJs, /from\("public_shop_collections"\)/);
  assert.match(siteJs, /from\("public_shop_settings"\)[\s\S]*eq\("id", "prototype"\)/);
  assert.match(adminJs, /from\("shop_items"\)/);
  assert.match(adminJs, /from\("shop_settings"\)[\s\S]*eq\("id", "prototype"\)/);
  assert.match(adminJs, /upsert\(\{ id: "prototype"/);
});

test("prototype uses a technical blue scroll-driven visual system", () => {
  assert.match(siteCss, /--prototype-blue:/);
  assert.match(siteCss, /scroll-snap-type:\s*x mandatory/);
  assert.match(siteCss, /\.wheel-card\.is-active/);
  assert.match(siteJs, /IntersectionObserver/);
});

test("prototype settings patch exposes the isolated public settings row without changing garments", () => {
  assert.match(settingsSql, /values \('prototype', 'blue',/i);
  assert.match(settingsSql, /where id in \('global', 'prototype'\)/i);
  assert.doesNotMatch(settingsSql, /delete from public\.shop_items|update public\.shop_items/i);
});

test("prototype does not contain the live custom-domain CNAME", async () => {
  await assert.rejects(access(new URL("../docs/CNAME", import.meta.url)));
});
