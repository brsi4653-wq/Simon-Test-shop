import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { ORDER_EMAIL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config.js?v=20260612-purchase-email";
import { filterItemsByCollection, getProductAction, normalizeCollections, normalizeItems, toPublicGarmentCopy } from "./item-model.js?v=20260612-featured-catalogue";
import { addCartItem, buildCartRequestEmail, canAddToCart, cartQuantity, CART_STORAGE_KEY, normalizeCart, reconcileCart, removeCartItem, updateCartItem } from "./cart-model.js?v=20260611";
import { deckPosition, stepDeckIndex } from "./deck-model.js?v=20260613";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
let items = [];
let collections = [];
let activeCollection = "featured";
let activeDeckIndex = 0;
let deckLocked = false;
let touchStartX = 0;
let cart = loadCart();
const views = [...document.querySelectorAll(".view")];
const navButtons = [...document.querySelectorAll("[data-view]")];

function escapeHtml(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function loadCart() {
  try { return normalizeCart(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]")); }
  catch { return []; }
}

function saveCart() {
  try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart)); } catch {}
  renderCart();
}

function imagePlaceholder(title) {
  return `<div class="image-placeholder"><span class="kicker">Garment preview</span><strong>${escapeHtml(title)}</strong><span>Image coming soon</span></div>`;
}

function listBlock(title, values) {
  if (!values?.length) return "";
  return `<section class="option-block"><span class="kicker">${escapeHtml(title)}</span><ul>${values.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul></section>`;
}

function filteredItems() {
  return filterItemsByCollection(items, activeCollection);
}

function renderFilters() {
  const filters = [{ name: "Featured", slug: "featured" }, { name: "All", slug: "all" }, ...collections];
  const container = document.getElementById("collection-filters");
  container.innerHTML = filters.map((entry) => `<button type="button" data-filter="${escapeHtml(entry.slug)}" class="${entry.slug === activeCollection ? "active" : ""}">${escapeHtml(entry.name)}</button>`).join("");
  container.querySelectorAll("[data-filter]").forEach((button) => button.addEventListener("click", () => {
    activeCollection = button.dataset.filter;
    activeDeckIndex = 0;
    renderFilters();
    renderWheel();
  }));
}

function deckCard(rawItem, index, itemCount) {
  const item = toPublicGarmentCopy(rawItem);
  const position = deckPosition(index, activeDeckIndex, itemCount);
  return `<article class="deck-card is-${position}" data-deck-card data-index="${index}">
    <button class="deck-image" data-deck-select="${index}" aria-label="Select ${escapeHtml(item.title)}">
      ${item.main_image_url ? `<img src="${escapeHtml(item.main_image_url)}" alt="${escapeHtml(item.title)}" />` : imagePlaceholder(item.title)}
    </button>
    <span class="deck-number">${String(index + 1).padStart(2, "0")}</span>
    ${position === "active" ? `<div class="deck-actions">
      <button class="icon-action" data-item="${escapeHtml(item.slug)}" title="View garment" aria-label="View garment">&nearr;</button>
      ${canAddToCart(item) ? `<button class="icon-action" data-add-cart="${escapeHtml(item.id || item.slug)}" title="Add to cart" aria-label="Add to cart">+</button>` : ""}
    </div>` : ""}
  </article>`;
}

function renderWheel() {
  const wheel = document.getElementById("product-wheel");
  const filtered = filteredItems();
  if (activeDeckIndex >= filtered.length) activeDeckIndex = 0;
  wheel.innerHTML = filtered.length
    ? filtered.map((item, index) => deckCard(item, index, filtered.length)).join("")
    : `<div class="empty-state"><span class="kicker">${activeCollection === "featured" ? "Featured rotation" : "Current collection"}</span><h2>${activeCollection === "featured" ? "No featured garments yet." : "Nothing is currently available."}</h2><p>Check back for the next SHIPS release.</p></div>`;
  const active = filtered[activeDeckIndex] ? toPublicGarmentCopy(filtered[activeDeckIndex]) : null;
  document.getElementById("wheel-position").textContent = active ? `${String(activeDeckIndex + 1).padStart(2, "0")} / ${String(filtered.length).padStart(2, "0")}` : "00 / 00";
  document.getElementById("active-product-copy").innerHTML = active
    ? `<span class="kicker">${escapeHtml(active.eyebrow)}</span><h1>${escapeHtml(active.title)}</h1><p>${escapeHtml(active.summary)}</p>`
    : `<span class="kicker">Current collection</span><h1>No garments yet.</h1><p>Check back for the next SHIPS release.</p>`;
  bindDeckButtons();
  bindItemButtons();
  bindCartButtons();
}

function moveDeck(direction) {
  const filtered = filteredItems();
  if (filtered.length < 2 || deckLocked) return;
  activeDeckIndex = stepDeckIndex(activeDeckIndex, direction, filtered.length);
  deckLocked = true;
  renderWheel();
  setTimeout(() => { deckLocked = false; }, 430);
}

function bindDeckButtons() {
  document.querySelectorAll("[data-deck-select]").forEach((button) => button.addEventListener("click", () => {
    const nextIndex = Number(button.dataset.deckSelect);
    if (nextIndex === activeDeckIndex) {
      const item = filteredItems()[activeDeckIndex];
      if (item) showItem(item.slug);
      return;
    }
    activeDeckIndex = nextIndex;
    renderWheel();
  }));
}

function renderDetail(rawItem) {
  const item = toPublicGarmentCopy(rawItem);
  const action = getProductAction(item, ORDER_EMAIL);
  const images = [item.main_image_url, ...item.gallery_urls].filter(Boolean);
  const primary = action.disabled
    ? `<button class="primary-action" disabled>${escapeHtml(action.label)}</button>`
    : `<a class="primary-action" href="${escapeHtml(action.href)}">${escapeHtml(action.label)}</a>`;
  document.getElementById("item-detail").innerHTML = `<section class="detail-page">
    <button class="text-action detail-back" data-view="collection">&larr; Back to collection</button>
    <div class="detail-hero">
      <div>
        <div class="gallery-main">${images.length ? `<img id="gallery-main-image" src="${escapeHtml(images[0])}" alt="${escapeHtml(item.title)}" />` : imagePlaceholder(item.title)}</div>
        ${images.length > 1 ? `<div class="gallery-strip">${images.map((url, index) => `<button class="${index === 0 ? "active" : ""}" data-gallery-image="${escapeHtml(url)}"><img src="${escapeHtml(url)}" alt="" /></button>`).join("")}</div>` : ""}
      </div>
      <div class="detail-copy">
        <span class="kicker">${escapeHtml(item.eyebrow)}</span>
        <h1>${escapeHtml(item.title)}</h1>
        <p class="summary">${escapeHtml(item.summary)}</p>
        <p>${escapeHtml(item.description)}</p>
        <span class="price-note">${escapeHtml(item.price_note)}</span>
        <div class="detail-actions">${primary}${canAddToCart(item) ? `<button class="secondary-action" data-add-cart="${escapeHtml(item.id || item.slug)}">Add to cart</button>` : ""}</div>
        <p>${escapeHtml(item.production_note)}</p>
      </div>
    </div>
    <div class="options-layout">${listBlock("Available sizes", item.sizes)}${listBlock("Available colors", item.colors)}${listBlock("Garment details", item.customization_options)}</div>
  </section>`;
  document.querySelectorAll("[data-gallery-image]").forEach((button) => button.addEventListener("click", () => {
    document.getElementById("gallery-main-image").src = button.dataset.galleryImage;
    document.querySelectorAll("[data-gallery-image]").forEach((entry) => entry.classList.toggle("active", entry === button));
  }));
  bindViewButtons();
  bindCartButtons();
}

function renderCart() {
  const count = cartQuantity(cart);
  document.getElementById("cart-count").textContent = count;
  document.getElementById("cart-summary-title").textContent = count ? `${count} garment${count === 1 ? "" : "s"} selected.` : "No garments yet.";
  const requestLink = document.getElementById("request-cart");
  requestLink.href = count ? buildCartRequestEmail(cart, ORDER_EMAIL).href : "#";
  requestLink.setAttribute("aria-disabled", count ? "false" : "true");
  document.getElementById("cart-items").innerHTML = cart.length ? cart.map((entry) => {
    const item = items.find((candidate) => String(candidate.id || candidate.slug) === entry.id);
    return `<article class="cart-entry" data-cart-id="${escapeHtml(entry.id)}">
      <div class="cart-entry-image">${entry.image ? `<img src="${escapeHtml(entry.image)}" alt="${escapeHtml(entry.title)}" />` : imagePlaceholder(entry.title)}</div>
      <div class="cart-entry-copy"><span class="kicker">Selected garment</span><h2>${escapeHtml(entry.title)}</h2>
        <div class="cart-fields">
          <label>Quantity<input data-cart-field="quantity" type="number" min="1" value="${entry.quantity}" /></label>
          <label>Size${item?.sizes?.length ? `<select data-cart-field="size"><option value="">Choose</option>${item.sizes.map((size) => `<option ${size === entry.size ? "selected" : ""}>${escapeHtml(size)}</option>`).join("")}</select>` : `<input data-cart-field="size" value="${escapeHtml(entry.size)}" />`}</label>
          <label>Color${item?.colors?.length ? `<select data-cart-field="color"><option value="">Choose</option>${item.colors.map((color) => `<option ${color === entry.color ? "selected" : ""}>${escapeHtml(color)}</option>`).join("")}</select>` : `<input data-cart-field="color" value="${escapeHtml(entry.color)}" />`}</label>
          <label class="cart-notes">Notes<textarea data-cart-field="notes">${escapeHtml(entry.notes)}</textarea></label>
        </div><button class="text-action" data-remove-cart="${escapeHtml(entry.id)}">Remove</button>
      </div>
    </article>`;
  }).join("") : `<div class="empty-state"><span class="kicker">Cart</span><h2>No garments selected.</h2><p>Add pieces from the collection deck.</p></div>`;
  document.querySelectorAll("[data-cart-id]").forEach((entry) => entry.querySelectorAll("[data-cart-field]").forEach((field) => field.addEventListener("change", () => {
    const changes = {};
    entry.querySelectorAll("[data-cart-field]").forEach((input) => changes[input.dataset.cartField] = input.value);
    cart = updateCartItem(cart, entry.dataset.cartId, changes);
    saveCart();
  })));
  document.querySelectorAll("[data-remove-cart]").forEach((button) => button.addEventListener("click", () => {
    cart = removeCartItem(cart, button.dataset.removeCart);
    saveCart();
  }));
}

function bindCartButtons() {
  document.querySelectorAll("[data-add-cart]").forEach((button) => button.addEventListener("click", () => {
    const item = items.find((entry) => String(entry.id || entry.slug) === button.dataset.addCart);
    if (!item || !canAddToCart(item)) return;
    cart = addCartItem(cart, item);
    saveCart();
    button.textContent = "✓";
    button.title = "Added to cart";
    button.setAttribute("aria-label", "Added to cart");
  }));
}

function bindItemButtons() {
  document.querySelectorAll("[data-item]").forEach((button) => button.addEventListener("click", () => showItem(button.dataset.item)));
}

function bindViewButtons() {
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => showView(button.dataset.view)));
}

function showView(id) {
  const next = ["collection", "cart"].includes(id) ? id : "collection";
  if (next === "collection") { renderFilters(); renderWheel(); }
  if (next === "cart") renderCart();
  views.forEach((view) => view.classList.toggle("active", view.id === next));
  navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === next));
  history.replaceState(null, "", `#${next}`);
  scrollTo({ top: 0, behavior: "smooth" });
}

function showItem(slug) {
  const item = items.find((entry) => entry.slug === slug);
  if (!item) return showView("collection");
  renderDetail(item);
  views.forEach((view) => view.classList.toggle("active", view.id === "item-detail"));
  navButtons.forEach((button) => button.classList.remove("active"));
  history.replaceState(null, "", `#item/${slug}`);
  scrollTo({ top: 0, behavior: "smooth" });
}

async function loadData() {
  const [itemResult, collectionResult, settingResult] = await Promise.all([
    supabase.from("public_shop_items").select("*").order("created_at", { ascending: false }),
    supabase.from("public_shop_collections").select("*").order("sort_order").order("name"),
    supabase.from("public_shop_settings").select("*").eq("id", "prototype").maybeSingle(),
  ]);
  if (!itemResult.error) items = normalizeItems(itemResult.data);
  if (!collectionResult.error) collections = normalizeCollections(collectionResult.data);
  void settingResult;
  cart = reconcileCart(cart, items);
  saveCart();
  renderFilters();
  renderWheel();
  const hash = location.hash.slice(1);
  if (hash.startsWith("item/")) showItem(hash.slice(5));
  else showView(hash || "collection");
}

document.querySelectorAll("[data-deck-step]").forEach((button) => button.addEventListener("click", () => moveDeck(Number(button.dataset.deckStep))));
document.getElementById("product-wheel").addEventListener("wheel", (event) => {
  event.preventDefault();
  moveDeck(Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX);
}, { passive: false });
document.getElementById("product-wheel").addEventListener("touchstart", (event) => { touchStartX = event.touches[0]?.clientX || 0; }, { passive: true });
document.getElementById("product-wheel").addEventListener("touchend", (event) => {
  const distance = touchStartX - (event.changedTouches[0]?.clientX || touchStartX);
  if (Math.abs(distance) > 35) moveDeck(distance);
}, { passive: true });
document.addEventListener("keydown", (event) => {
  if (!document.getElementById("collection").classList.contains("active")) return;
  if (event.key === "ArrowLeft") moveDeck(-1);
  if (event.key === "ArrowRight" || event.key === "ArrowDown") moveDeck(1);
});
document.getElementById("year").textContent = new Date().getFullYear();
document.getElementById("clear-cart").addEventListener("click", () => { cart = []; saveCart(); });
bindViewButtons();
renderCart();
loadData();
