export const CART_STORAGE_KEY = "ships-request-cart-v1";

function positiveQuantity(value) {
  const quantity = Number.parseInt(value, 10);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

export function canAddToCart(item = {}) {
  return ["available", "request-only"].includes(item.availability_status || "request-only");
}

export function normalizeCart(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry) => entry && (entry.id || entry.slug) && entry.title)
    .map((entry) => ({
      id: String(entry.id || entry.slug),
      slug: String(entry.slug || ""),
      title: String(entry.title),
      image: String(entry.image || entry.main_image_url || ""),
      quantity: positiveQuantity(entry.quantity),
      size: String(entry.size || ""),
      color: String(entry.color || ""),
      notes: String(entry.notes || ""),
    }));
}

export function addCartItem(cart, item) {
  const normalized = normalizeCart(cart);
  if (!canAddToCart(item)) return normalized;
  const id = String(item.id || item.slug);
  const existing = normalized.find((entry) => entry.id === id);
  if (existing) return normalized.map((entry) => entry.id === id ? { ...entry, quantity: entry.quantity + 1 } : entry);
  return [...normalized, {
    id,
    slug: String(item.slug || ""),
    title: String(item.title || "Untitled garment"),
    image: String(item.main_image_url || ""),
    quantity: 1,
    size: "",
    color: "",
    notes: "",
  }];
}

export function updateCartItem(cart, id, changes = {}) {
  return normalizeCart(cart).map((entry) => entry.id === String(id) ? {
    ...entry,
    quantity: positiveQuantity(changes.quantity ?? entry.quantity),
    size: String(changes.size ?? entry.size),
    color: String(changes.color ?? entry.color),
    notes: String(changes.notes ?? entry.notes),
  } : entry);
}

export function removeCartItem(cart, id) {
  return normalizeCart(cart).filter((entry) => entry.id !== String(id));
}

export function reconcileCart(cart, items = []) {
  const availableIds = new Set(items.filter(canAddToCart).map((item) => String(item.id || item.slug)));
  return normalizeCart(cart).filter((entry) => availableIds.has(entry.id));
}

export function cartQuantity(cart) {
  return normalizeCart(cart).reduce((total, entry) => total + entry.quantity, 0);
}

export function buildCartRequestEmail(cart, recipient) {
  const entries = normalizeCart(cart);
  const lines = [
    "Hi Simon,",
    "",
    "I'd like to request the following SHIPS garments:",
    "",
  ];
  entries.forEach((entry, index) => {
    lines.push(
      `${index + 1}. ${entry.title}`,
      `Quantity: ${entry.quantity}`,
      `Size: ${entry.size || "Please enter"}`,
      `Color: ${entry.color || "Please enter"}`,
      `Notes: ${entry.notes || "None"}`,
      "",
    );
  });
  lines.push("Shipping location:", "Questions or additional notes:", "", "Please let me know availability, final pricing, and ordering details.");
  const subject = `SHIPS cart request (${entries.length} garment${entries.length === 1 ? "" : "s"})`;
  const body = lines.join("\n");
  return { recipient, subject, body, href: `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` };
}
