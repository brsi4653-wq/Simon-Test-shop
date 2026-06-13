# SHIPS Collections Design

## Goal

Add editable public collection filters to the SHIPS shop while preserving every existing item and adding restrained "Designed in Nova Scotia" brand language.

## Public Shop

- The Collection page always opens on an automatic **All** filter.
- All shows every published item, including items that are not assigned to a custom collection.
- Up to six visible custom collection buttons appear beside All.
- Selecting a custom collection shows published items assigned to it.
- Items may belong to multiple collections.
- The empty state explains when the selected collection has no items.

## Admin Editor

- A collection manager appears in the admin sidebar.
- The manager can create, rename, reorder, hide, and delete collections.
- The manager prevents creating more than six collections.
- Deleting a collection deletes only its assignments, never an item.
- Every item editor includes collection checkboxes.
- Saving an item also saves its selected collection assignments.
- Existing items begin with no assignments and remain visible under All.

## Initial Collections

- Semi-Customizable
- Blanks
- Full Custom

"Blanks" means full-custom garments that begin without a design. A future non-customizable collection is not created now.

## Nova Scotia Language

"Designed in Nova Scotia" appears in the homepage hero, collection introduction, item-detail request section, and footer. It describes the SHIPS brand and does not automatically assign items to a Nova Scotia collection.

## Data Safety

- Add `shop_collections` and `shop_item_collections` tables.
- Additive migration only; no existing `shop_items` rows are updated or deleted.
- Public views expose only visible collections and memberships for published items.
- Admin-only row-level security controls collection and assignment changes.
