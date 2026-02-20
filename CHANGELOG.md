# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses semantic versioning from 1.0.0 onward.

---

## [Unreleased]

- (Reserved for post-1.0 changes; GA4 tracking planned as follow-up.)

---

## [1.0.0] — 2025-02-18

### Added

- **Multi-feature UI** — Tabs for Favor Finder, Storage Saver, Trip plan, Full Inventory, Mod Finder, and What's this for? Load items and character sheet once; data is shared across all features (no re-upload when switching).
- **Storage Saver** — Find duplicate item types across storage vaults. Shows only items where consolidating stacks would actually save slots. For each item: icon, name, "You could save N slot(s) by consolidating," and a list of locations as *Map: Vault — count* (e.g. *Serbule: Council Vault — 5*). Uses CDN `MaxStackSize` when available for slot math.
- **Trip plan** — Multi-stop route planner: pick maps in order, see what to pick up and drop at each stop to consolidate stacks. Add/remove stops; clear route; equal-height card layout. Uses same slot-saving logic as Storage Saver.
- **Full Inventory** — Browse all items by category (Equipment, Skill Book, Recipe, Work Order, Consumables, Potions, Gardening, Ingredients, Cooking, etc.). **Map and storage vault** filter dropdowns in addition to category and search. Clear filters button. Each item shows icon, name, description (when present), base effects (human-readable via `attributes.json`), quantity, and locations. **Equipment** only: dedicated Mods column with treasure mods from export and CDN `tsysclientinfo.json`. Inline icons for `<icon=NNN>`; Skill Book / Recipe / Work Order / Phlogiston handling; extra categories (Leather, Metal, Dyes, Cloth, Phlogiston, Augments).
- **Mod Finder** — Pick one or two combat skills; see all mods for those skills grouped by equipment slot. Multiselect slot filter. Mods that reference a specific ability show that ability's icon.
- **What's this for?** — Tab and modal: search by item name to see which recipes use it (CDN `recipes.json`). Click item names in Favor Finder, Storage Saver, Full Inventory, or Trip plan to open the modal; "Open in What's this for? tab" to continue in that tab. Clear filters button.
- **FEATURES.md** and **README** — Updated for 1.0 scope; deployment notes (e.g. GitHub Pages).
- **.gitignore** — Game export patterns and plan artifacts.
- Mobile-friendly touch targets (44px+ height) on tabs and primary buttons.
- CDN load of `tsysclientinfo.json`, `attributes.json`, and `recipes.json`.

### Changed

- App title and scope: "Favor Item Finder" → "Project Gorgon Tools" with shared data and six feature tabs.
- **Favor Finder** — Results update automatically when an NPC is selected; NPC and vault names link to the wiki.
- **Storage Saver** — Runs automatically when switching to the tab; vault names link to the wiki.
- **Accessibility** — Skip link to main content; `aria-hidden` on inactive panels; modal focus restore and focus trap; tab list arrow-key navigation; focus-visible styles; external link labels ("opens in new tab"); brighter muted text for contrast. **Reduced motion:** Skip link transition respects `prefers-reduced-motion`.
- **UI** — Secondary button styling; clear filters buttons where applicable.

---

## Initial release (Favor Item Finder)

- Favor Item Finder: load items export and optional character sheet, pick map/NPC, see giftable items (Love/Like) and current favor, grouped by city and vault with item icons.
- Plain HTML, CSS, and JavaScript; no build step; CDN fallback to local `data/` folder.
