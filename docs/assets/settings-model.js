export const DEFAULT_APPEARANCE = {
  home_kicker: "Independent clothing / Designed in Nova Scotia",
  home_headline: "Designed, made, and shipped.",
  home_intro: "SHIPS is an independent clothing project based in Nova Scotia, focused on seasonal collections, selected garments, and small-batch releases.",
  home_button_label: "View collection",
  show_process: true,
  hero_layout: "split",
  hero_height: "standard",
  hero_image_fit: "cover",
  header_logo: "ships-white",
  header_logo_size: "medium",
  collection_kicker: "Designed in Nova Scotia / Garment catalogue",
  collection_title: "Browse the collection.",
  collection_intro: "Explore current garments, seasonal releases, and selected pieces from SHIPS.",
  card_columns: "4",
  card_image_fit: "cover",
  corner_style: "square",
  typography: "editorial",
  spacing: "standard",
  motion: "subtle",
  footer_middle: "Designed in Nova Scotia",
  footer_right: "Independent garments and seasonal releases",
  add_to_cart_label: "Add to cart",
  request_now_label: "Request now",
  cart_request_label: "Request entire cart",
};

const CHOICES = {
  hero_layout: ["split", "centered"],
  hero_height: ["compact", "standard", "tall"],
  hero_image_fit: ["cover", "contain"],
  header_logo: ["ships-white", "ships-black", "ships-tag", "ships-shop"],
  header_logo_size: ["small", "medium", "large"],
  card_columns: ["2", "3", "4"],
  card_image_fit: ["cover", "contain"],
  corner_style: ["square", "soft", "rounded"],
  typography: ["editorial", "modern"],
  spacing: ["compact", "standard", "airy"],
  motion: ["none", "subtle"],
};

export function normalizeAppearance(value = {}) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const result = { ...DEFAULT_APPEARANCE };
  Object.keys(DEFAULT_APPEARANCE).forEach((key) => {
    if (typeof DEFAULT_APPEARANCE[key] === "boolean") result[key] = source[key] !== undefined ? Boolean(source[key]) : DEFAULT_APPEARANCE[key];
    else if (CHOICES[key]) result[key] = CHOICES[key].includes(String(source[key])) ? String(source[key]) : DEFAULT_APPEARANCE[key];
    else if (typeof source[key] === "string" && source[key].trim()) result[key] = source[key].trim();
  });
  return result;
}

export const HEADER_LOGOS = {
  "ships-white": "images/logos/ships-main-white-display.png",
  "ships-black": "images/logos/ships-main-black-display.png",
  "ships-tag": "images/logos/ships-tag-display.png",
  "ships-shop": "images/logos/the-ships-shop-display.png",
};

export function resolveHeaderLogo(themeLogo, preferredLogo = "ships-white") {
  if (preferredLogo === "ships-white" || preferredLogo === "ships-black") return themeLogo;
  return HEADER_LOGOS[preferredLogo] || themeLogo;
}
