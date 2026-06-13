# Product Deck Implementation Plan

**Goal:** Replace the broken horizontal storefront carousel with a flat baby-blue stacked product deck.

**Architecture:** A small pure deck model controls selection and relative card positions. The public site renders all visible garments into one positioned deck and advances the selected index through explicit wheel, keyboard, button, and swipe events.

**Tech Stack:** Plain HTML, CSS, JavaScript, Node test runner.

---

### Task 1: Lock deck behavior into tests

- Add tests for bounded one-step index movement.
- Add tests requiring flat baby blue, stacked layers, and no gradients or native scroll snapping.
- Run tests and confirm the new expectations fail.

### Task 2: Build controlled product deck

- Add the pure deck index model.
- Replace intersection-observer selection with an explicit selected index.
- Add previous/next controls, wheel locking, keyboard navigation, and swipe navigation.
- Preserve item opening and add-to-cart actions.

### Task 3: Replace storefront visual language

- Remove ambient gradients and traditional page heading composition.
- Position the selected garment fully in the center.
- Position neighboring garments as clipped stacked layers.
- Restyle details and cart using the same flat baby-blue visual system.

### Task 4: Verify

- Run all automated tests.
- Verify desktop and mobile interaction in the browser.
- Confirm live project and CNAME remain untouched.
