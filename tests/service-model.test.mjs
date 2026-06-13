import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const indexHtml = await readFile(new URL("../docs/index.html", import.meta.url), "utf8");
const adminHtml = await readFile(new URL("../docs/admin.html", import.meta.url), "utf8");
const itemModel = await readFile(new URL("../docs/assets/item-model.js", import.meta.url), "utf8");
const siteJs = await readFile(new URL("../docs/assets/site.js", import.meta.url), "utf8");
const resetSql = await readFile(new URL("../supabase-shop-business-reset.sql", import.meta.url), "utf8");
const renewSql = await readFile(new URL("../supabase-shop-full-renew.sql", import.meta.url), "utf8");
const oneLineRenewSql = await readFile(new URL("../RUN-THIS-SHIPS-RENEWAL.sql", import.meta.url), "utf8");
const shopifyMigrationSql = await readFile(new URL("../supabase-shop-shopify-links.sql", import.meta.url), "utf8").catch(() => "");
const appearanceMigrationSql = await readFile(new URL("../supabase-shop-appearance-settings.sql", import.meta.url), "utf8").catch(() => "");

test("prototype opens directly into the Nova Scotia collection", () => {
  assert.match(indexHtml, /Designed in Nova Scotia/i);
  assert.match(indexHtml, /id="collection" class="view active"/);
  assert.match(indexHtml, /class="product-wheel"/);
  assert.doesNotMatch(indexHtml, /id="home"|data-view="home"/);
  assert.doesNotMatch(indexHtml, /Your idea|Send us your artwork|Send your idea|We design and ship it|Choose a garment/i);
});

test("customer requests use the SHIPS purchase email without changing private admin authorization", async () => {
  const config = await readFile(new URL("../docs/assets/config.js", import.meta.url), "utf8");
  const adminJs = await readFile(new URL("../docs/assets/admin.js", import.meta.url), "utf8");
  assert.match(config, /ORDER_EMAIL\s*=\s*"purchase@theshipsshop\.com"/);
  assert.match(config, /ADMIN_EMAIL\s*=\s*"simon_j_brookes@icloud\.com"/);
  assert.match(itemModel, /ORDER_EMAIL\s*=\s*"purchase@theshipsshop\.com"/);
  assert.match(siteJs, /from "\.\/config\.js\?v=20260612-purchase-email"/);
  assert.match(adminJs, /from "\.\/config\.js\?v=20260612-purchase-email"/);
});

test("purchase email cleanup updates saved garment copy without changing admin authorization", async () => {
  const migration = await readFile(new URL("../supabase-shop-purchase-email.sql", import.meta.url), "utf8");
  assert.match(migration, /purchase@theshipsshop\.com/);
  assert.match(migration, /update public\.shop_items/);
  assert.doesNotMatch(migration, /is_portfolio_admin/);
  assert.doesNotMatch(migration, /delete from public\.shop_items/);
});

test("admin retains optional future cover controls without adding a public homepage", async () => {
  const adminJs = await readFile(new URL("../docs/assets/admin.js", import.meta.url), "utf8");
  assert.match(adminHtml, /Future Cover Options/);
  assert.match(adminHtml, /name="hero_media_type"/);
  assert.match(adminHtml, /id="hero-image-file"/);
  assert.match(adminHtml, /id="hero-product-select"/);
  assert.match(adminJs, /HERO_ART_STYLES/);
  assert.match(adminJs, /saveHomepageSettings/);
  assert.doesNotMatch(indexHtml, /id="home"|data-view="home"/);
});

test("image-free listings use a deliberate placeholder instead of the demo product image", () => {
  assert.match(siteJs, /Image coming soon/);
  assert.doesNotMatch(siteJs, /main_image_url \|\| "images\/items\/demo-item\.png"/);
});

test("admin wording describes garments, releases, and garment details", () => {
  assert.match(adminHtml, /manage garments, collections, and releases/i);
  assert.match(adminHtml, />Garment name</);
  assert.match(adminHtml, />Garment type</);
  assert.match(adminHtml, />Garment details/);
  assert.match(adminHtml, />Fulfillment notes/);
  assert.match(adminHtml, /Garment Request Preview/);
  assert.doesNotMatch(adminHtml, /Full custom design|Limited placement customization|Design Request Preview/);
});

test("item modes use brand-first labels while preserving database values", () => {
  assert.match(itemModel, /Collection garment/);
  assert.match(itemModel, /Selected garment/);
  assert.match(itemModel, /Request garment/);
  assert.doesNotMatch(itemModel, /Full custom design|Limited placement customization|Start a custom design/);
});

test("product pages keep custom printing secondary", () => {
  assert.doesNotMatch(siteJs, /Start with an idea|Send artwork|prepares the design|Start your design request/i);
  assert.match(siteJs, /Garment details/);
});

test("catalogue reset deletes old items, excludes McLaren, clears images, and creates the requested collections", () => {
  assert.match(resetSql, /delete from public\.shop_items/i);
  assert.doesNotMatch(resetSql, /McLaren Past v Future/i);
  assert.match(resetSql, /'Pants', 'pants'/);
  assert.match(resetSql, /'T-Shirts', 't-shirts'/);
  assert.match(resetSql, /'Hoodies', 'hoodies'/);
  assert.match(resetSql, /main_image_url[\s\S]*''/i);
  assert.match(resetSql, /gallery_urls[\s\S]*'\[\]'/i);
});

test("full renewal script rebuilds the complete shop and uses standalone garment inserts", () => {
  assert.match(renewSql, /drop table if exists public\.shop_items/i);
  assert.match(renewSql, /create table public\.shop_items/i);
  assert.match(renewSql, /create table public\.shop_collections/i);
  assert.match(renewSql, /create table public\.shop_item_collections/i);
  assert.match(renewSql, /create or replace view public\.public_shop_items/i);
  assert.match(renewSql, /insert into public\.shop_items[\s\S]*'paint-detailed-heavyweight-tee'/i);
  assert.doesNotMatch(renewSql, /\),\s*\(\s*'paint-detailed-heavyweight-tee'/i);
  assert.match(renewSql, /commit;/i);
  assert.match(renewSql, /'Hoodie'/);
  assert.match(renewSql, /'T-Shirt'/);
  assert.match(renewSql, /'Pants'/);
  assert.doesNotMatch(renewSql, /Send SHIPS|Full custom|Limited placement|custom concept/i);
});

test("run-this renewal cannot be accidentally executed as a selected middle line", () => {
  assert.equal(oneLineRenewSql.trim().split(/\r?\n/).length, 1);
  assert.match(oneLineRenewSql, /^begin;/i);
  assert.match(oneLineRenewSql, /'paint-detailed-heavyweight-tee'/i);
  assert.match(oneLineRenewSql, /Sky Fade/i);
  assert.match(oneLineRenewSql, /commit;/i);
});

test("custom domain and GitHub Pages paths remain safe", async () => {
  await assert.rejects(readFile(new URL("../docs/CNAME", import.meta.url), "utf8"));

  const publicFiles = [indexHtml, adminHtml, itemModel, siteJs].join("\n");
  assert.doesNotMatch(publicFiles, /github\.io|\/simon-request-shop\//i);
});

test("admin editor exposes plain Shopify URL and availability controls", () => {
  assert.match(adminHtml, /Shopify Product URL/);
  assert.match(adminHtml, /name="shopify_product_url"/);
  assert.match(adminHtml, /name="availability_status"/);
  for (const status of ["available", "coming-soon", "sold-out", "request-only"]) {
    assert.match(adminHtml, new RegExp(`value="${status}"`));
  }
});

test("admin editor clearly warns when Available will fall back to email", async () => {
  const adminJs = await readFile(new URL("../docs/assets/admin.js", import.meta.url), "utf8");
  assert.match(adminJs, /Shopify URL is empty/);
  assert.match(adminJs, /REQUEST GARMENT/);
});

test("shop uses plain Shopify links without Shopify APIs or credentials", () => {
  const publicFiles = [indexHtml, adminHtml, itemModel, siteJs].join("\n");
  assert.match(siteJs, /getProductAction/);
  assert.doesNotMatch(publicFiles, /Storefront API|Shopify API|shopify[_-]token|access[_-]token/i);
});

test("Shopify availability migration preserves existing garments and exposes public fields", () => {
  assert.match(shopifyMigrationSql, /alter table public\.shop_items[\s\S]*shopify_product_url/i);
  assert.match(shopifyMigrationSql, /alter table public\.shop_items[\s\S]*availability_status/i);
  assert.match(shopifyMigrationSql, /request-only/i);
  assert.match(shopifyMigrationSql, /create or replace view public\.public_shop_items/i);
  assert.doesNotMatch(shopifyMigrationSql, /delete from public\.shop_items|drop table public\.shop_items/i);
});

test("public site exposes a combined-request cart without bypassing availability", () => {
  assert.match(indexHtml, /data-view="cart"/);
  assert.match(indexHtml, /id="cart-count"/);
  assert.match(indexHtml, /id="cart-items"/);
  assert.match(siteJs, /canAddToCart/);
  assert.match(siteJs, /buildCartRequestEmail/);
  assert.match(siteJs, /localStorage/);
});

test("admin exposes extensive appearance controls", () => {
  for (const control of [
    "home_headline",
    "home_intro",
    "hero_layout",
    "header_logo",
    "card_columns",
    "card_image_fit",
    "corner_style",
    "typography",
    "motion",
    "add_to_cart_label",
  ]) assert.match(adminHtml, new RegExp(`name="${control}"`));
});

test("appearance migration is additive and never changes garments", () => {
  assert.match(appearanceMigrationSql, /appearance_config/i);
  assert.match(appearanceMigrationSql, /public_shop_settings/i);
  assert.doesNotMatch(appearanceMigrationSql, /delete from public\.shop_items|update public\.shop_items|drop table.*shop_items/i);
});
