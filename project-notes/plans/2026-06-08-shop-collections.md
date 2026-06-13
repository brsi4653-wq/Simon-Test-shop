# SHIPS Collections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add editable collections, item assignments, public filtering, and Nova Scotia brand language without changing existing items.

**Architecture:** Collections live in a dedicated Supabase table and connect to items through a junction table. The public site reads visible collections and published item memberships; the private editor manages collections and assignments.

**Tech Stack:** Plain HTML, CSS, JavaScript modules, Supabase Postgres/Auth/RLS, Node test runner.

---

### Task 1: Collection Model

**Files:**
- Modify: `docs/assets/item-model.js`
- Test: `tests/collection-model.test.mjs`

- [ ] Write failing tests for collection normalization, filtering, ordering, and six-collection limit.
- [ ] Run the collection tests and verify they fail because collection helpers do not exist.
- [ ] Add minimal collection helpers and item collection normalization.
- [ ] Run all tests and verify they pass.

### Task 2: Safe Supabase Migration

**Files:**
- Create: `supabase-shop-collections-step-1.sql`
- Create: `supabase-shop-collections-step-2.sql`
- Modify: `supabase-shop-setup.sql`

- [ ] Add collection and membership tables with admin-only RLS.
- [ ] Add public views exposing visible collections and published memberships.
- [ ] Seed the three initial collections without assigning or modifying items.
- [ ] Verify SQL is additive and contains no shop item update or delete statement.

### Task 3: Admin Collection Management

**Files:**
- Modify: `docs/admin.html`
- Modify: `docs/assets/admin.css`
- Modify: `docs/assets/admin.js`

- [ ] Add the collection manager and item assignment fieldset.
- [ ] Load, create, rename, reorder, hide, and delete collections.
- [ ] Save item memberships after item saves.
- [ ] Preserve assignments when editing or duplicating an item.

### Task 4: Public Collection Filters and Nova Scotia Language

**Files:**
- Modify: `docs/index.html`
- Modify: `docs/assets/site.css`
- Modify: `docs/assets/site.js`

- [ ] Add public collection filter controls.
- [ ] Load visible collections and filter cards while preserving All.
- [ ] Add empty states for the full shop and selected collections.
- [ ] Add "Designed in Nova Scotia" language in approved locations.
- [ ] Version-pin updated public assets.

### Task 5: Verification

**Files:**
- Test: `tests/collection-model.test.mjs`
- Test: `tests/theme-card.test.mjs`

- [ ] Run all automated tests.
- [ ] Verify JavaScript syntax.
- [ ] Open the local shop and visually verify collection filters and admin controls on desktop and mobile.
- [ ] Confirm no existing item data was modified.
