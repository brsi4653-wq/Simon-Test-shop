# Request Shop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a separate modern green storefront for regular, custom, and hybrid made-to-order items using email requests instead of online payments.

**Architecture:** The public GitHub Pages site reads published items from a dedicated `public_shop_items` Supabase view. The private editor uses the existing Google login and administrator allowlist, while Supabase row-level security prevents public writes. Customer request details are composed locally into a `mailto:` link and are never stored in the database.

**Tech Stack:** Plain HTML, CSS, browser JavaScript modules, Supabase JS CDN, Supabase Postgres/RLS/Storage, Node built-in test runner.

---

### Task 1: Item model and request-email behavior

**Files:**
- Create: `docs/assets/item-model.js`
- Create: `tests/item-model.test.mjs`

- [ ] Write failing tests for item normalization, theme selection, gallery parsing, and regular/custom/hybrid email bodies.
- [ ] Run the Node test runner and verify failures occur because the model does not exist.
- [ ] Implement the minimal item model and email composer.
- [ ] Run tests and confirm all model tests pass.

### Task 2: Public storefront

**Files:**
- Create: `docs/index.html`
- Create: `docs/assets/site.css`
- Create: `docs/assets/site.js`
- Create: `docs/images/logos/*`
- Copy: `docs/images/demo-item.png`

- [ ] Build a green editorial homepage with featured item and collection.
- [ ] Build individually themed item-detail pages with multi-image galleries.
- [ ] Show sizes, colors, and customization information without checkout controls.
- [ ] Add request buttons that open mode-specific prefilled emails.
- [ ] Verify responsive layouts and keyboard-accessible navigation.

### Task 3: Private item editor

**Files:**
- Create: `docs/admin.html`
- Create: `docs/assets/admin.css`
- Create: `docs/assets/admin.js`

- [ ] Reuse the existing Google login flow and administrator email check.
- [ ] Add fields for item mode, multiple images, themes, sizes, colors, customization notes, and request-email templates.
- [ ] Add upload, draft, publish, feature, duplicate, delete, logout, and preview behavior.
- [ ] Verify unauthorized accounts are signed out and public visitors cannot access item editing.

### Task 4: Supabase isolation and setup

**Files:**
- Create: `supabase-shop-setup.sql`
- Create: `README.md`

- [ ] Create a separate `shop_items` table and `public_shop_items` view.
- [ ] Enable row-level security and allow writes only through `is_portfolio_admin()`.
- [ ] Create a separate public-read/admin-write `shop-media` bucket.
- [ ] Seed one unpublished demo item without modifying portfolio projects.
- [ ] Document the one-time setup and explain that only the publishable browser key is present.

### Task 5: Verification

- [ ] Run all automated behavior tests.
- [ ] Scan the shop for passwords, service-role keys, OAuth secrets, and unrelated personal data.
- [ ] Serve the site locally and inspect desktop and mobile layouts.
- [ ] Confirm the existing portfolio files were not modified.
