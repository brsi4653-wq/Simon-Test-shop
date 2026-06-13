# SHIPS Cart And Customization Design

## Goal

Add a combined-request cart and substantially expand the private editor's control over public-site content and presentation without deleting garments, collecting customer data, or changing the custom domain.

## Combined-Request Cart

- `Request Now` opens the existing single-garment email request.
- `Add to Cart` stores a garment in the visitor's browser.
- Available and request-only garments can be added. Coming-soon and sold-out garments cannot.
- Shopify-linked garments retain `Buy Now` and may also be added to the request cart.
- Visitors can enter quantity, preferred size, preferred color, and notes for each cart entry.
- `Request Entire Cart` opens one email addressed to `purchase@theshipsshop.com` containing every cart entry.
- Cart data is stored only in browser local storage and is never written to Supabase.

## Website Customization

The `shop_settings.appearance_config` JSON object stores extensible public-site settings:

- Homepage kicker, headline, introduction, and main button label
- Homepage process-section visibility
- Hero layout, height, image fit, and existing cover selection
- Header logo selection and size
- Collection kicker, title, and introduction
- Product-grid columns and image fit
- Typography, corner style, spacing, and motion
- Footer text
- Cart and request button labels

Defaults preserve the current public site. Invalid or missing values fall back safely.

## Safety

- Existing garments, images, collections, themes, Shopify links, and availability settings remain intact.
- The migration is additive and does not delete or update `shop_items`.
- `docs/CNAME` remains unchanged.
- Customer details and cart contents are never stored by the website.

