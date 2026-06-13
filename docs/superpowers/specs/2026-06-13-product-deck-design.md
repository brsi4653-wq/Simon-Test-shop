# SHIPS Product Deck Design

The future storefront opens directly into a product deck rather than a traditional shop page.

## Visual Direction

- Use one flat baby-blue background with dark navy text.
- Remove gradients, ambient blobs, glass panels, and conventional storefront cards.
- Keep one selected garment fully visible in the center.
- Show nearby garments as clipped, offset layers behind the selected garment.
- Float product information and controls around the deck instead of placing them inside cards.

## Interaction

- Store the selected garment as one explicit index.
- Mouse wheel, trackpad, arrow controls, keyboard arrows, and horizontal swipe each move exactly one garment.
- Ignore repeated wheel input briefly while a transition is running.
- Changing collection resets the selected garment to the first item.
- Selecting a neighboring layer makes it the active garment.

## Preserved Features

The prototype continues sharing products, collections, images, availability, Shopify links, cart data, and editor access with the live SHIPS backend. Prototype appearance settings remain isolated from the live site.
