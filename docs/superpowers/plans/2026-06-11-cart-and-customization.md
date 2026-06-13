# SHIPS Cart And Customization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a combined-request cart and extensible admin-controlled public-site appearance system.

**Architecture:** Add pure cart and settings helpers, render the cart and appearance settings through the existing static JavaScript application, and store only appearance configuration in Supabase. Cart contents remain local to each visitor's browser.

**Tech Stack:** Plain HTML, CSS, JavaScript modules, localStorage, Supabase, Node test runner.

---

### Task 1: Pure Models

**Files:** Create `docs/assets/cart-model.js`, `docs/assets/settings-model.js`; modify model tests.

- [ ] Add failing tests for cart eligibility, combined email generation, and safe settings defaults.
- [ ] Implement pure helpers.
- [ ] Run model tests.

### Task 2: Public Cart

**Files:** Modify `docs/index.html`, `docs/assets/site.js`, `docs/assets/site.css`.

- [ ] Add failing interface tests.
- [ ] Add header cart count, cart view, product actions, and cart editing.
- [ ] Verify sold-out and coming-soon garments cannot be added.

### Task 3: Appearance Editor

**Files:** Modify `docs/admin.html`, `docs/assets/admin.js`, `docs/assets/admin.css`.

- [ ] Add failing admin-interface tests.
- [ ] Add grouped content, layout, branding, and wording controls.
- [ ] Save and preview settings using `appearance_config`.

### Task 4: Additive Database Migration

**Files:** Create `supabase-shop-appearance-settings.sql`; modify setup and renewal SQL.

- [ ] Add failing migration safety tests.
- [ ] Add `appearance_config jsonb` and expose it through the public settings view.
- [ ] Confirm no garment deletion or modification occurs.

### Task 5: Verification

- [ ] Run the full automated test suite.
- [ ] Verify homepage, product actions, cart, and editor in the browser.
- [ ] Confirm `docs/CNAME` remains `theshipsshop.com`.

