# SHIPS Future Storefront Prototype

This is a separate, plain-static prototype for a possible future SHIPS rebrand.

It opens directly into a centered, horizontal collection wheel and keeps the public navigation intentionally limited to **Collection** and **Cart**. It is not the live SHIPS website and does not contain a `CNAME` file.

## What Is Shared

This prototype uses the same Supabase project and the same browser-safe publishable configuration as the live shop.

- Garments
- Product images
- Published and draft status
- Featured garments
- Collections and collection membership
- Shopify product links and availability
- Authorized private editor account

Changes to those records from either editor appear on both storefronts.

## What Is Separate

The prototype reads and saves the `prototype` row in `shop_settings`. This prevents its appearance controls from overwriting the live shop's `global` appearance row.

Run `supabase-shop-prototype-settings.sql` once in the existing Supabase SQL Editor before deploying the prototype. The script:

- Adds the isolated `prototype` settings row.
- Allows the existing public settings view to expose both `global` and `prototype`.
- Does not update or delete garments, images, collections, or live settings.

## Local Preview

Publish or serve the contents of `docs`. The public entry is `index.html`; the shared private editor is `admin.html`.

## Deploying A Test Copy

1. Create a separate GitHub repository for the prototype.
2. Run `supabase-shop-prototype-settings.sql` once in the existing Supabase project.
3. Upload the contents of `docs` and configure GitHub Pages.
4. Add the prototype's final `admin.html` address to Supabase Authentication redirect URLs.
5. Do not add the live `theshipsshop.com` CNAME to this prototype repository.

## Security

The static files contain only the existing Supabase publishable browser key. They do not contain the database password, service-role key, Google client secret, or payment credentials. Supabase row-level security remains responsible for restricting editor access.
