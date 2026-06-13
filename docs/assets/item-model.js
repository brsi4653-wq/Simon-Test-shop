export const ORDER_EMAIL = "purchase@theshipsshop.com";
export const MAX_COLLECTIONS = 6;
export const DEFAULT_GLOBAL_THEME = "core";

export const THEMES = {
  core: {
    name: "Core / Monochrome",
    logo: "images/logos/ships-main-white-display.png",
    background: "#101010",
    surface: "#181818",
    soft: "#282621",
    ink: "#f7f3e9",
    muted: "#bbb4a8",
    accent: "#f3e5ce",
  },
  sunfade: {
    name: "Sunfade / Pink White",
    logo: "images/logos/ships-main-black-display.png",
    background: "#fff7f8",
    surface: "#ffffff",
    soft: "#f7dfe5",
    ink: "#321e25",
    muted: "#765b65",
    accent: "#ee9caf",
  },
  green: {
    name: "Fresh Green",
    logo: "images/logos/ships-main-black-display.png",
    background: "#f3f8ef",
    surface: "#ffffff",
    soft: "#e2f2dc",
    ink: "#173a24",
    muted: "#506757",
    accent: "#72ce54",
  },
  orange: {
    name: "Soft Orange",
    logo: "images/logos/ships-main-black-display.png",
    background: "#fff5e8",
    surface: "#fffdf8",
    soft: "#ffe4ca",
    ink: "#4a2818",
    muted: "#85614d",
    accent: "#ff8d47",
  },
  blue: {
    name: "Clear Blue",
    logo: "images/logos/ships-main-black-display.png",
    background: "#f1f9fc",
    surface: "#ffffff",
    soft: "#dceff7",
    ink: "#143644",
    muted: "#4d6974",
    accent: "#38b6ff",
  },
  red: {
    name: "Studio Red",
    logo: "images/logos/ships-main-black-display.png",
    background: "#fff4f2",
    surface: "#ffffff",
    soft: "#ffe0dc",
    ink: "#491b18",
    muted: "#855b57",
    accent: "#ff3131",
  },
  yellow: {
    name: "Warm Yellow",
    logo: "images/logos/ships-main-black-display.png",
    background: "#fff9eb",
    surface: "#fffefa",
    soft: "#ffedbd",
    ink: "#49351c",
    muted: "#745f43",
    accent: "#ffae4b",
  },
  mono: {
    name: "Monochrome",
    logo: "images/logos/ships-main-white-display.png",
    background: "#101010",
    surface: "#181818",
    soft: "#282621",
    ink: "#f7f3e9",
    muted: "#bbb4a8",
    accent: "#f3e5ce",
  },
};

export const ITEM_MODES = {
  regular: {
    name: "Collection garment",
    label: "Request garment",
  },
  custom: {
    name: "Selected garment",
    label: "Request garment",
  },
  hybrid: {
    name: "Selected garment",
    label: "Request garment",
  },
};

export const AVAILABILITY_STATUSES = {
  available: "Available",
  "coming-soon": "Coming Soon",
  "sold-out": "Sold Out",
  "request-only": "Request Only",
};

export function createSlug(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseLines(value = "") {
  if (Array.isArray(value)) return value.map(String).map((line) => line.trim()).filter(Boolean);
  return String(value).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

export function parseGallery(value = "") {
  return [...new Set(parseLines(value))];
}

export function normalizeCollection(collection = {}) {
  return {
    id: collection.id || "",
    name: collection.name || "Untitled Collection",
    slug: collection.slug || createSlug(collection.name || "untitled-collection"),
    sort_order: Number.isFinite(Number(collection.sort_order)) ? Number(collection.sort_order) : 0,
    is_visible: collection.is_visible !== false,
  };
}

export function normalizeCollections(collections = []) {
  if (!Array.isArray(collections)) return [];
  return collections
    .map(normalizeCollection)
    .sort((first, second) => first.sort_order - second.sort_order || first.name.localeCompare(second.name))
    .slice(0, MAX_COLLECTIONS);
}

export function normalizeItem(item = {}) {
  const itemMode = ITEM_MODES[item.item_mode] ? item.item_mode : "regular";
  const theme = item.theme === "global" || THEMES[item.theme] ? item.theme : "global";
  const availabilityStatus = AVAILABILITY_STATUSES[item.availability_status] ? item.availability_status : "request-only";
  return {
    id: item.id || "",
    slug: item.slug || createSlug(item.title || "untitled-item"),
    title: item.title || "Untitled Item",
    eyebrow: item.eyebrow || "Selected garment",
    summary: item.summary || "",
    description: item.description || "",
    main_image_url: item.main_image_url || "",
    gallery_urls: parseGallery(item.gallery_urls),
    sizes: parseLines(item.sizes),
    colors: parseLines(item.colors),
    customization_options: parseLines(item.customization_options),
    production_note: item.production_note || "Produced individually based on garment availability. Final availability, pricing, and delivery are confirmed before payment.",
    price_note: item.price_note || "Final price confirmed by email",
    item_mode: itemMode,
    request_subject: item.request_subject || "",
    request_intro: item.request_intro || "",
    shopify_product_url: String(item.shopify_product_url || "").trim(),
    availability_status: availabilityStatus,
    theme,
    is_featured: Boolean(item.is_featured),
    is_published: Boolean(item.is_published),
    collection_slugs: parseLines(item.collection_slugs),
    collection_ids: parseLines(item.collection_ids),
  };
}

export function normalizeItems(items = []) {
  return Array.isArray(items) ? items.map(normalizeItem) : [];
}

const SERVICE_COPY_PATTERN = /custom|artwork|design request|send ships|rough idea|print placement|prepare(?:s|d)? the design|personal design|ready to become/i;

export function toPublicGarmentCopy(rawItem = {}) {
  const item = normalizeItem(rawItem);
  const eyebrow = item.eyebrow
    .replace(/^(?:full custom|limited placement|regular(?: with optional customization)?|made to request)\s*\/\s*/i, "")
    .trim() || "Selected garment";
  const summary = SERVICE_COPY_PATTERN.test(item.summary)
    ? `A selected ${eyebrow.toLowerCase()} from the current SHIPS collection.`
    : item.summary;
  const description = SERVICE_COPY_PATTERN.test(item.description)
    ? "This garment is part of the current SHIPS collection and is produced individually based on garment availability."
    : item.description;
  return { ...item, eyebrow, summary, description };
}

export function getTheme(themeName) {
  return THEMES[themeName] || THEMES[DEFAULT_GLOBAL_THEME];
}

export function resolveProductTheme(productTheme, globalTheme = DEFAULT_GLOBAL_THEME) {
  return productTheme && productTheme !== "global" && THEMES[productTheme]
    ? productTheme
    : (THEMES[globalTheme] ? globalTheme : DEFAULT_GLOBAL_THEME);
}

export function filterItemsByCollection(items = [], collectionSlug = "all") {
  if (collectionSlug === "featured") return items.filter((item) => normalizeItem(item).is_featured);
  if (collectionSlug === "all") return items;
  return items.filter((item) => normalizeItem(item).collection_slugs.includes(collectionSlug));
}

export function buildRequestEmail(rawItem, recipient = ORDER_EMAIL) {
  const item = normalizeItem(rawItem);
  const subject = item.request_subject || `Garment request: ${item.title}`;
  const intro = item.request_intro || `Hi Simon,\n\nI'd like to inquire about the ${item.title}.`;
  const common = [
    intro,
    "",
    `Garment: ${item.title}`,
    "Preferred size:",
    "Preferred color:",
  ];

  common.push("Shipping location:", "Optional custom print request (if available):", "Questions or notes:");
  common.push("", "Please let me know the current availability, final price, and ordering details.");
  const body = common.join("\n");
  return {
    recipient,
    subject,
    body,
    href: `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
  };
}

function isSafeWebUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function getProductAction(rawItem, recipient = ORDER_EMAIL) {
  const item = normalizeItem(rawItem);
  if (item.availability_status === "coming-soon") {
    return { type: "disabled", label: "COMING SOON", href: "", disabled: true };
  }
  if (item.availability_status === "sold-out") {
    return { type: "disabled", label: "SOLD OUT", href: "", disabled: true };
  }
  if (item.availability_status === "available" && isSafeWebUrl(item.shopify_product_url)) {
    return { type: "shopify", label: "BUY NOW", href: item.shopify_product_url, disabled: false };
  }
  const email = buildRequestEmail(item, recipient);
  return { type: "email", label: "REQUEST GARMENT", href: email.href, disabled: false };
}
