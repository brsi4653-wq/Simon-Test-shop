import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { ADMIN_EMAIL, ORDER_EMAIL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config.js?v=20260612-purchase-email";
import { buildRequestEmail, createSlug, DEFAULT_GLOBAL_THEME, getProductAction, getTheme, ITEM_MODES, MAX_COLLECTIONS, normalizeCollections, normalizeItem, parseGallery, parseLines, resolveProductTheme, THEMES } from "./item-model.js?v=20260612-featured-catalogue";
import { normalizeAppearance } from "./settings-model.js?v=20260612-readable-logo";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const form = document.getElementById("item-form");
const message = document.getElementById("editor-message");
const itemList = document.getElementById("item-list");
let items = [];
let collections = [];
let savedAdminUser = null;
let globalTheme = DEFAULT_GLOBAL_THEME;
let homepageSettings = { hero_media_type: "icon", hero_icon_style: "orbit-shop", hero_image_url: "", hero_product_id: "" };
let appearance = normalizeAppearance();
const appearanceForm = document.getElementById("appearance-form");

const HERO_ART_STYLES = {
  "orbit-shop": "Orbit / Shop Mark",
  "orbit-ships": "Orbit / SHIPS",
  "orbit-tag": "Orbit / Tag",
  "plain-shop": "Shop Mark",
  "plain-ships": "SHIPS Mark",
  "rings-only": "Rings Only",
};

function isAdmin(user) {
  return user?.email?.toLowerCase() === ADMIN_EMAIL;
}

function setMessage(text = "", isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}

function formValue(name) {
  return form.elements[name]?.value?.trim() || "";
}

function linesToText(value) {
  return parseLines(value).join("\n");
}

function escapeHtml(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function renderControls() {
  document.getElementById("theme-options").innerHTML = [
    `<label class="theme-choice"><input type="radio" name="theme" value="global" checked /><span class="theme-swatch" style="background:linear-gradient(135deg,#101010 50%,#f7f3e9 50%)"></span>Use Global Theme</label>`,
    ...Object.entries(THEMES).map(([key, theme]) => `<label class="theme-choice"><input type="radio" name="theme" value="${key}" /><span class="theme-swatch" style="background:${theme.accent}"></span>${theme.name}</label>`),
  ].join("");
  document.getElementById("global-theme-options").innerHTML = Object.entries(THEMES)
    .map(([key, theme]) => `<label class="theme-choice"><input type="radio" name="global_theme" value="${key}" ${key === globalTheme ? "checked" : ""} /><span class="theme-swatch" style="background:${theme.accent}"></span>${theme.name}</label>`)
    .join("");
  document.getElementById("hero-art-options").innerHTML = Object.entries(HERO_ART_STYLES)
    .map(([key, label]) => `<label class="theme-choice"><input type="radio" name="hero_icon_style" value="${key}" ${key === homepageSettings.hero_icon_style ? "checked" : ""} />${label}</label>`)
    .join("");
  document.getElementById("hero-media-type").value = homepageSettings.hero_media_type;
  document.getElementById("hero-image-url").value = homepageSettings.hero_image_url || "";
  document.getElementById("hero-product-select").innerHTML = [
    '<option value="">Choose a product</option>',
    ...items.filter((item) => item.is_published).map((item) => `<option value="${item.id}" ${item.id === homepageSettings.hero_product_id ? "selected" : ""}>${escapeHtml(item.title)}</option>`),
  ].join("");
  Object.entries(appearance).forEach(([key, value]) => {
    const control = appearanceForm.elements[key];
    if (!control) return;
    if (control.type === "checkbox") control.checked = Boolean(value);
    else control.value = value;
  });
}

function selectedCollectionIds() {
  return [...document.querySelectorAll('input[name="item_collections"]:checked')].map((input) => input.value);
}

function renderItemCollectionOptions(selectedIds = []) {
  const selected = new Set(selectedIds);
  document.getElementById("item-collection-options").innerHTML = collections.length
    ? collections.map((collection) => `<label class="theme-choice"><input type="checkbox" name="item_collections" value="${collection.id}" ${selected.has(collection.id) ? "checked" : ""} />${escapeHtml(collection.name)}</label>`).join("")
    : '<p class="collection-empty">Create a collection in the sidebar to assign this item.</p>';
}

function renderCollectionManager() {
  const manager = document.getElementById("collection-manager");
  manager.innerHTML = collections.length
    ? collections.map((collection, index) => `<div class="collection-entry" data-collection="${collection.id}">
        <input type="text" value="${escapeHtml(collection.name)}" aria-label="Collection name" />
        <div class="collection-entry-actions">
          <label class="check-control"><input type="checkbox" data-action="visibility" ${collection.is_visible ? "checked" : ""} /> Public</label>
          <button type="button" data-action="up" ${index === 0 ? "disabled" : ""} title="Move up">↑</button>
          <button type="button" data-action="down" ${index === collections.length - 1 ? "disabled" : ""} title="Move down">↓</button>
          <button type="button" data-action="save">Save</button>
          <button type="button" data-action="delete" class="danger-button">Delete</button>
        </div>
      </div>`).join("")
    : '<p class="collection-empty">No custom collections yet. All is always available automatically.</p>';

  manager.querySelectorAll(".collection-entry").forEach((entry) => {
    const id = entry.dataset.collection;
    entry.querySelector('[data-action="save"]').addEventListener("click", () => renameCollection(id, entry.querySelector('input[type="text"]').value));
    entry.querySelector('[data-action="visibility"]').addEventListener("change", (event) => updateCollection(id, { is_visible: event.target.checked }));
    entry.querySelector('[data-action="up"]').addEventListener("click", () => moveCollection(id, -1));
    entry.querySelector('[data-action="down"]').addEventListener("click", () => moveCollection(id, 1));
    entry.querySelector('[data-action="delete"]').addEventListener("click", () => deleteCollection(id));
  });
}

function collectItem() {
  return {
    slug: createSlug(formValue("slug") || formValue("title")),
    title: formValue("title") || "Untitled Item",
    eyebrow: formValue("eyebrow") || "Selected garment",
    summary: formValue("summary"),
    description: formValue("description"),
    main_image_url: formValue("main_image_url"),
    gallery_urls: parseGallery(formValue("gallery_urls")),
    sizes: parseLines(formValue("sizes")),
    colors: parseLines(formValue("colors")),
    customization_options: parseLines(formValue("customization_options")),
    production_note: formValue("production_note"),
    price_note: formValue("price_note"),
    item_mode: form.elements.item_mode.value,
    request_subject: formValue("request_subject"),
    request_intro: formValue("request_intro"),
    shopify_product_url: formValue("shopify_product_url"),
    availability_status: form.elements.availability_status.value,
    theme: form.elements.theme.value,
    is_published: form.elements.is_published.checked,
    is_featured: form.elements.is_featured.checked,
  };
}

function resetForm() {
  form.reset();
  document.getElementById("item-id").value = "";
  document.getElementById("editor-title").textContent = "New Garment";
  document.getElementById("main-preview").hidden = true;
  form.elements.theme.value = "global";
  form.elements.item_mode.value = "regular";
  form.elements.availability_status.value = "request-only";
  renderItemCollectionOptions();
  setMessage();
  renderPreview();
}

function fillForm(rawItem) {
  const item = normalizeItem(rawItem);
  resetForm();
  document.getElementById("item-id").value = item.id;
  document.getElementById("editor-title").textContent = item.title;
  Object.entries(item).forEach(([key, value]) => {
    if (!form.elements[key] || ["gallery_urls", "sizes", "colors", "customization_options"].includes(key)) return;
    if (form.elements[key].type === "checkbox") form.elements[key].checked = Boolean(value);
    else form.elements[key].value = value ?? "";
  });
  form.elements.gallery_urls.value = linesToText(item.gallery_urls);
  form.elements.sizes.value = linesToText(item.sizes);
  form.elements.colors.value = linesToText(item.colors);
  form.elements.customization_options.value = linesToText(item.customization_options);
  renderItemCollectionOptions(item.collection_ids);
  const preview = document.getElementById("main-preview");
  preview.hidden = !item.main_image_url;
  preview.src = item.main_image_url || "";
  document.querySelectorAll(".item-entry").forEach((entry) => entry.classList.toggle("active", entry.dataset.id === item.id));
  renderPreview();
}

function renderList() {
  itemList.innerHTML = items.length
    ? items.map((item) => `<button class="item-entry" data-id="${item.id}"><strong>${item.title}</strong><small>${item.is_published ? "Published" : "Draft"}${item.is_featured ? " / Featured" : ""} / ${ITEM_MODES[item.item_mode]?.name || "Regular item"}</small></button>`).join("")
    : "<p>No garments yet.</p>";
  document.querySelectorAll(".item-entry").forEach((button) => button.addEventListener("click", () => fillForm(items.find((item) => item.id === button.dataset.id))));
}

function renderPreview() {
  const item = normalizeItem(collectItem());
  const theme = getTheme(resolveProductTheme(item.theme, globalTheme));
  const email = buildRequestEmail(item, ORDER_EMAIL);
  const action = getProductAction(item, ORDER_EMAIL);
  const missingShopifyUrl = item.availability_status === "available" && !item.shopify_product_url;
  const actionDetails = action.type === "email"
    ? `<pre>${email.body}</pre>`
    : `<p>${action.type === "shopify" ? escapeHtml(action.href) : "The public action button is disabled."}</p>`;
  document.getElementById("editor-preview").innerHTML = `${item.main_image_url ? `<img src="${item.main_image_url}" alt="" />` : "<p>No image yet.</p>"}
    <h3>${item.title}</h3>
    <p>${ITEM_MODES[item.item_mode].name} / Theme: ${theme.name}</p>
    <p>${item.summary || "No summary yet."}</p>
    <p><strong>Public button: ${action.label}</strong></p>
    ${missingShopifyUrl ? '<p class="editor-warning"><strong>Shopify URL is empty.</strong> Available will use REQUEST GARMENT until a Shopify URL is saved.</p>' : ""}
    ${actionDetails}`;
}

async function loadAdminData(preferredItemId = "") {
  const [collectionResult, itemResult, membershipResult, settingResult] = await Promise.all([
    supabase.from("shop_collections").select("*").order("sort_order").order("name"),
    supabase.from("shop_items").select("*").order("updated_at", { ascending: false }),
    supabase.from("shop_item_collections").select("item_id, collection_id"),
    supabase.from("shop_settings").select("*").eq("id", "prototype").maybeSingle(),
  ]);
  if (collectionResult.error || membershipResult.error) {
    return setMessage("Collections are not ready yet. Run supabase-shop-collections-step-1.sql, then supabase-shop-collections-step-2.sql in Supabase.", true);
  }
  if (itemResult.error) return setMessage("The shop database is not ready yet. Run supabase-shop-setup.sql in Supabase.", true);
  collections = normalizeCollections(collectionResult.data || []);
  if (!settingResult.error && THEMES[settingResult.data?.global_theme]) globalTheme = settingResult.data.global_theme;
  if (!settingResult.error && settingResult.data) homepageSettings = {
    hero_media_type: settingResult.data.hero_media_type || "icon",
    hero_icon_style: settingResult.data.hero_icon_style || "orbit-shop",
    hero_image_url: settingResult.data.hero_image_url || "",
    hero_product_id: settingResult.data.hero_product_id || "",
  };
  if (!settingResult.error && settingResult.data) appearance = normalizeAppearance(settingResult.data.appearance_config);
  const memberships = membershipResult.data || [];
  items = (itemResult.data || []).map((item) => normalizeItem({
    ...item,
    collection_ids: memberships.filter((membership) => membership.item_id === item.id).map((membership) => membership.collection_id),
  }));
  renderControls();
  renderCollectionManager();
  renderList();
  if (items.length) fillForm(items.find((item) => item.id === preferredItemId) || items[0]);
  else resetForm();
}

async function saveGlobalTheme() {
  const selected = document.querySelector('input[name="global_theme"]:checked')?.value || DEFAULT_GLOBAL_THEME;
  const { error } = await supabase.from("shop_settings").upsert({ id: "prototype", global_theme: selected });
  if (error) return setMessage(error.message, true);
  globalTheme = selected;
  setMessage(`Prototype theme changed to ${THEMES[selected].name}.`);
}

async function saveHomepageSettings() {
  try {
    let heroImageUrl = document.getElementById("hero-image-url").value.trim();
    const file = document.getElementById("hero-image-file").files[0];
    if (file) heroImageUrl = await uploadFile(file, "prototype-cover");
    const settings = {
      id: "prototype",
      hero_media_type: document.getElementById("hero-media-type").value,
      hero_icon_style: document.querySelector('input[name="hero_icon_style"]:checked')?.value || "orbit-shop",
      hero_image_url: heroImageUrl,
      hero_product_id: document.getElementById("hero-product-select").value || null,
    };
    const { error } = await supabase.from("shop_settings").upsert(settings);
    if (error) throw error;
    homepageSettings = { ...settings, hero_product_id: settings.hero_product_id || "" };
    document.getElementById("hero-image-url").value = heroImageUrl;
    setMessage("Prototype cover saved.");
  } catch (error) {
    setMessage(error.message || "Prototype cover could not be saved.", true);
  }
}

async function saveAppearanceSettings() {
  const values = {};
  Object.keys(appearance).forEach((key) => {
    const control = appearanceForm.elements[key];
    values[key] = control?.type === "checkbox" ? control.checked : control?.value;
  });
  const nextAppearance = normalizeAppearance(values);
  const { error } = await supabase.from("shop_settings").upsert({ id: "prototype", appearance_config: nextAppearance });
  if (error) return setMessage(error.message || "Website customization could not be saved.", true);
  appearance = nextAppearance;
  setMessage("Website customization saved.");
}

async function createCollection() {
  if (collections.length >= MAX_COLLECTIONS) return setMessage("You already have the maximum of six custom collections.", true);
  const name = prompt("Collection name:");
  if (!name?.trim()) return;
  const slug = createSlug(name);
  const { error } = await supabase.from("shop_collections").insert({
    name: name.trim(),
    slug,
    sort_order: collections.length ? Math.max(...collections.map((collection) => collection.sort_order)) + 10 : 10,
  });
  if (error) return setMessage(error.message, true);
  setMessage(`Collection "${name.trim()}" created.`);
  await loadAdminData(document.getElementById("item-id").value);
}

async function updateCollection(id, changes) {
  const { error } = await supabase.from("shop_collections").update(changes).eq("id", id);
  if (error) return setMessage(error.message, true);
  await loadAdminData(document.getElementById("item-id").value);
}

async function renameCollection(id, rawName) {
  const name = rawName.trim();
  if (!name) return setMessage("A collection needs a name.", true);
  await updateCollection(id, { name, slug: createSlug(name) });
}

async function moveCollection(id, direction) {
  const index = collections.findIndex((collection) => collection.id === id);
  const swapIndex = index + direction;
  if (index < 0 || swapIndex < 0 || swapIndex >= collections.length) return;
  const first = collections[index];
  const second = collections[swapIndex];
  const [firstResult, secondResult] = await Promise.all([
    supabase.from("shop_collections").update({ sort_order: second.sort_order }).eq("id", first.id),
    supabase.from("shop_collections").update({ sort_order: first.sort_order }).eq("id", second.id),
  ]);
  if (firstResult.error || secondResult.error) return setMessage(firstResult.error?.message || secondResult.error?.message, true);
  await loadAdminData(document.getElementById("item-id").value);
}

async function deleteCollection(id) {
  const collection = collections.find((entry) => entry.id === id);
  if (!collection || !confirm(`Delete the "${collection.name}" collection? Items will not be deleted.`)) return;
  const { error } = await supabase.from("shop_collections").delete().eq("id", id);
  if (error) return setMessage(error.message, true);
  setMessage(`Collection "${collection.name}" deleted. Its items were not deleted.`);
  await loadAdminData(document.getElementById("item-id").value);
}

async function saveItemCollections(itemId, collectionIds) {
  const { error: deleteError } = await supabase.from("shop_item_collections").delete().eq("item_id", itemId);
  if (deleteError) throw deleteError;
  if (!collectionIds.length) return;
  const { error: insertError } = await supabase.from("shop_item_collections").insert(
    collectionIds.map((collectionId) => ({ item_id: itemId, collection_id: collectionId })),
  );
  if (insertError) throw insertError;
}

async function uploadFile(file, folder) {
  const extension = file.name.split(".").pop().toLowerCase();
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("shop-media").upload(path, file, { contentType: file.type });
  if (error) throw error;
  return supabase.storage.from("shop-media").getPublicUrl(path).data.publicUrl;
}

async function attachUploads(item) {
  const mainFile = document.getElementById("main-file").files[0];
  if (mainFile) item.main_image_url = await uploadFile(mainFile, item.slug);
  const galleryFiles = [...document.getElementById("gallery-files").files];
  if (galleryFiles.length) {
    const uploaded = [];
    for (const file of galleryFiles) uploaded.push(await uploadFile(file, item.slug));
    item.gallery_urls = [...item.gallery_urls, ...uploaded];
  }
  return item;
}

async function saveItem(event) {
  event.preventDefault();
  setMessage("Saving...");
  try {
    const id = document.getElementById("item-id").value;
    const collectionIds = selectedCollectionIds();
    const item = await attachUploads(collectItem());
    if (item.is_featured && !item.is_published) throw new Error("Publish the item before making it featured.");
    const result = id
      ? await supabase.from("shop_items").update(item).eq("id", id).select().single()
      : await supabase.from("shop_items").insert(item).select().single();
    if (result.error) throw result.error;
    await saveItemCollections(result.data.id, collectionIds);
    const missingShopifyUrl = item.availability_status === "available" && !item.shopify_product_url;
    setMessage(
      missingShopifyUrl
        ? "Garment saved, but Shopify URL is empty. The public button will remain REQUEST GARMENT."
        : (item.is_published ? "Garment saved and published." : "Garment draft saved privately."),
      missingShopifyUrl,
    );
    await loadAdminData(result.data.id);
  } catch (error) {
    setMessage(error.message || "The garment could not be saved.", true);
  }
}

async function deleteItem() {
  const id = document.getElementById("item-id").value;
  if (!id || !confirm("Delete this item permanently?")) return;
  const { error } = await supabase.from("shop_items").delete().eq("id", id);
  if (error) return setMessage(error.message, true);
  await loadAdminData();
}

function duplicateItem() {
  const item = collectItem();
  const collectionIds = selectedCollectionIds();
  resetForm();
  Object.entries(item).forEach(([key, value]) => {
    if (!form.elements[key] || ["is_featured", "gallery_urls", "sizes", "colors", "customization_options"].includes(key)) return;
    if (form.elements[key].type === "checkbox") form.elements[key].checked = Boolean(value);
    else form.elements[key].value = value ?? "";
  });
  form.elements.title.value = `${item.title} Copy`;
  form.elements.slug.value = `${item.slug}-copy`;
  form.elements.gallery_urls.value = linesToText(item.gallery_urls);
  form.elements.sizes.value = linesToText(item.sizes);
  form.elements.colors.value = linesToText(item.colors);
  form.elements.customization_options.value = linesToText(item.customization_options);
  form.elements.is_featured.checked = false;
  renderItemCollectionOptions(collectionIds);
  renderPreview();
}

async function enterAdmin(user) {
  if (!isAdmin(user)) {
    await supabase.auth.signOut();
    document.getElementById("login-message").textContent = "This Google account is not authorized.";
    return;
  }
  document.getElementById("login-panel").hidden = true;
  document.getElementById("admin-app").hidden = false;
  document.getElementById("sign-out").hidden = false;
  document.getElementById("account-label").textContent = user.email;
  await loadAdminData();
}

function offerSavedSession(user) {
  if (!isAdmin(user)) return;
  savedAdminUser = user;
  document.getElementById("login-message").textContent = `A saved session exists for ${user.email}. Click Enter Editor to continue, or sign out to test another account.`;
  document.getElementById("google-login").textContent = "Enter Editor";
  document.getElementById("sign-out").hidden = false;
  document.getElementById("account-label").textContent = user.email;
}

renderControls();
resetForm();
form.addEventListener("submit", saveItem);
form.addEventListener("input", () => {
  if (!formValue("slug") && formValue("title")) form.elements.slug.value = createSlug(formValue("title"));
  renderPreview();
});
document.getElementById("new-item").addEventListener("click", resetForm);
document.getElementById("new-collection").addEventListener("click", createCollection);
document.getElementById("save-global-theme").addEventListener("click", saveGlobalTheme);
document.getElementById("save-homepage-settings").addEventListener("click", saveHomepageSettings);
document.getElementById("save-appearance-settings").addEventListener("click", saveAppearanceSettings);
document.getElementById("delete-item").addEventListener("click", deleteItem);
document.getElementById("duplicate-item").addEventListener("click", duplicateItem);
document.getElementById("publish-item").addEventListener("click", () => {
  form.elements.is_published.checked = true;
  form.requestSubmit();
});
document.getElementById("google-login").addEventListener("click", () => {
  if (savedAdminUser) return enterAdmin(savedAdminUser);
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: location.href, queryParams: { prompt: "select_account" } },
  });
});
document.getElementById("sign-out").addEventListener("click", async () => { await supabase.auth.signOut(); location.reload(); });

const { data: { session } } = await supabase.auth.getSession();
if (session?.user) offerSavedSession(session.user);
supabase.auth.onAuthStateChange((_event, nextSession) => {
  if (nextSession?.user && document.getElementById("admin-app").hidden) offerSavedSession(nextSession.user);
});
