# Project Gorgon Tools — Features

**1.0 scope:** Favor Finder, Storage Saver, Trip plan, Full Inventory (with map/vault filters), Mod Finder, What's this for? (recipe lookup). Accessibility pass and clear-filters UI included. GA4 deferred to follow-up.

---

## Favor Item Finder

Load items export and optionally character sheet, pick map and NPC. Results update automatically when an NPC is selected. Shows current favor with the NPC (if character sheet loaded) and giftable items grouped by city and storage vault. NPC names and vault names link to the Project Gorgon Wiki. Already implemented.

---

## Storage Saver

Find duplicate item types across storage vaults so you can consolidate stacks in-game and free slots. Runs automatically when switching to the tab. Example: 5 mushrooms in Vault A and 6 in Vault B → combine into one stack to save a slot.

**Implementation:** Group user items by `TypeID`. For each TypeID that appears in more than one `StorageVault`, list vaults and stack sizes and show "slots you could save" (e.g. N stacks → 1 stack). Stack limits from CDN `MaxStackSize` when available; else a sensible default. Sort by slots saveable (desc) or item name. Total slots saveable is shown at the top. Vault names link to the wiki.

**Trip plan (implemented):** Separate tab. Pick Map A, then Map B (or "add map" for 3, 4, … stops). Per stop: what to pick up (to drop at later stops) and what to drop here to consolidate. Clear route and equal-height card layout. General tip in UI: consolidate by destination—when you're at a map, move all listed stacks for that item into one vault there so you only visit each map once.

---

## Full Inventory

Break out everything the character has into categories (Equipment, Skill Book, Recipe, Work Order, Consumables, Potions, Gardening, Ingredients, Cooking, Ability ingredients, Nature, Brewing, Leather, Metal, Dyes, Cloth, Phlogiston, Augments, Other). Categories are derived from CDN **Keywords** and icon (Skill Book / Recipe / Work Order / Phlogiston by name). Category, **map**, and **storage vault** filter dropdowns and search box (filters by name, description, effects, mods). Equipment has a dedicated Mods column with treasure mods from export + `tsysclientinfo.json`; other categories do not. Table layout with Icon, Name, Qty, Location(s) (and Mods for Equipment); responsive stacked layout on narrow viewports. Vault names in locations link to the wiki. Clear filters button. Mod filtering (e.g. "show only items with mod X") is **not** planned here—that belongs in **Mod Finder**.

---

## Mod Finder (by skill)

**Implemented:** Pick one or two combat skills via dropdowns. The list shows all mods for the chosen skill(s) from CDN tsysclientinfo.json, grouped by equipment slot in a three-column layout. Multiselect slot filter (Head, Chest, Hands, MainHand, OffHand, Legs, Feet, Other). Mods that reference a specific ability (via `MOD_ABILITY_*` in effect text) show that ability's icon from abilities.json.

**Planned (for later):**

- **Mod rarity indicator:** Label mods as uncommon, epic, etc. so users know what's "rare"; valuable for endgame.
- Filter mods by your inventory to complement Full Inventory.

---

## What's this for? (item recipe lookup)

**Implemented:** Tab and modal. Search by item name; see which recipes use it (from CDN `recipes.json`). Click item names in Favor Finder, Storage Saver, Full Inventory, or Trip plan to open the modal. "Open in What's this for? tab" to continue in that tab. Clear filters button.

---

## Build in-app vs link to wiki

| In-app | Prefer wiki link |
|--------|------------------|
| Your data (favor, storage, inventory, mods from your export) | Deep lore, full NPC bios, quest walkthroughs |
| Quick lookups from CDN (item names, effects, categories) | Long-form guides, community strategies |
| NPC names as links to wiki | Duplicating large wiki content |
| "Used in" / recipe hints (short list or "see wiki") | Full recipe tables or step-by-step guides |

**Principle:** The app stays focused on *your* exports and CDN-backed lists/tables. When "more story, more context, or full guide" is needed, link to the wiki (e.g. NPC name → wiki page). New features (e.g. item "used for") can show a short in-app summary and optionally "More on wiki" where the wiki has a dedicated item/recipe page.

---

## Open questions / ideas

- **Character selection with multiple files:** If we allow multiple JSON files to be uploaded at once, does it make sense to bring back a character selector so users can "look at all of them at once" (e.g. 5+ characters)? Unclear if the added complexity is worth it. Defer past initial release.

---

## Pre-launch / post-1.0

- **GitHub Pages:** Review and verify the app works when deployed (paths, CORS, CDN, file loading). See README for deployment notes.
- **GA4 tracking:** Add Google Analytics 4 tracking (follow-up after 1.0; specifics TBD).

---

## Process (done for 1.0)

- **Accessibility review:** Skip link, aria-hidden on panels, modal focus restore and trap, tab arrow-key navigation, focus-visible styles, external link labels. Completed.
- **AI feature pass / Optimization pass:** Optional follow-ups.
