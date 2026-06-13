# Global And Product Themes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin-controlled global SHIPS theme while allowing each product detail page to use either that global theme or a selected product theme.

**Architecture:** Keep all theme presets in `item-model.js`. Store the active global theme in a single-row Supabase settings table exposed through a read-only public view. The public site applies the global theme to home, collection, navigation, cards, and footer; product detail pages resolve either the product theme or the global fallback.

**Tech Stack:** Plain HTML, CSS, JavaScript modules, Supabase, GitHub Pages.

---

### Task 1: Define Theme Resolution
- [ ] Add failing tests for the preset catalogue, global fallback, and product override.
- [ ] Add Core and Sunfade presets plus reusable theme-resolution helpers.
- [ ] Run model tests.

### Task 2: Add Public And Admin Theme Behavior
- [ ] Add failing tests for global settings loading, global card styling, and admin controls.
- [ ] Add global theme control to the editor.
- [ ] Load the active global theme publicly and use product themes only on detail pages.
- [ ] Run UI tests.

### Task 3: Add Supabase Settings Storage
- [ ] Add failing SQL assertions for settings table, public view, and policies.
- [ ] Create an additive theme setup script and update the full renewal script.
- [ ] Regenerate the one-line renewal script.
- [ ] Run all tests and verify the local site.
