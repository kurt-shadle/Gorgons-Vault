# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project does not use semantic versioning (no version numbers yet).

---

## [Unreleased]

### Added

- **Multi-feature UI** — Tabs for Favor Finder, Storage Saver, Full Inventory, and Mod Finder. Load items and character sheet once; data is shared across all features (no re-upload when switching).
- **Storage Saver** — Find duplicate item types across storage vaults. Shows only items where consolidating stacks would actually save slots. For each item: icon, name, "You could save N slot(s) by consolidating," and a list of locations as *Map: Vault — count* (e.g. *Serbule: Council Vault — 5*). Uses CDN `MaxStackSize` when available for slot math.
- **Full Inventory** — Browse all items by category (Equipment, Skill Book, Recipe, Work Order, Consumables, Potions, Gardening, Ingredients, Cooking, etc.). Category filter dropdown. Search box to filter items by name, description, effects, or mods. Each item shows icon, name, description (when present), base effects (human-readable via `attributes.json`), quantity, and locations (one per line). **Equipment** only: dedicated Mods column with treasure mods resolved from export `TSysPowers` and CDN `tsysclientinfo.json` (each mod on its own line). Inline icons: `<icon=NNN>` in effect/mod text is rendered as the CDN icon image, with a space after each icon. Effect and description text use new lines instead of bullets. Skill Book = icon 5792; Recipe / Work Order = icon 4003 with "recipe" or "work order" in name or description.
- **Mod Finder** — Pick one or two combat skills; see all mods for those skills grouped by equipment slot. Multiselect slot filter (Head, Chest, Hands, MainHand, OffHand, Legs, Feet, Other). Mods that reference a specific ability (via `MOD_ABILITY_*` in effect text) show that ability's icon.
- **FEATURES.md** — Documented all four features and implementation notes for later.
- **CHANGELOG.md** — This file.
- **.gitignore** — Game export patterns (`Character_*.json`, `*_items_*.json`) and plan artifacts (`.cursor/`, `*.plan.md`).
- Mobile-friendly touch targets (44px+ height) on tabs and primary buttons.
- CDN load of `tsysclientinfo.json` and `attributes.json` for equipment mod text and human-readable effect descriptions.

### Changed

- App title and scope: "Favor Item Finder" → "Project Gorgon Tools" with a shared data section and feature tabs.
- README updated to describe the multi-feature app, shared data, and file list including FEATURES.md and CHANGELOG.md.
- Full Inventory: removed Equipped category (export does not distinguish equipped vs in-inventory; documented as limitation).
- **Favor Finder** — Removed submit button; results update automatically when an NPC is selected.
- **Storage Saver** — Removed "Find duplicate stacks" button; runs automatically when switching to that tab.
- **NPC/wiki links** — Vault names now link to the Project Gorgon Wiki in Favor Finder results, Full Inventory locations, and Storage Saver.
- **Accessibility** — Brightened muted text color for 3.5:1+ contrast ratio (WCAG) on status messages and secondary text.

---

## Initial release (Favor Item Finder)

- Favor Item Finder: load items export and optional character sheet, pick map/NPC, see giftable items (Love/Like) and current favor, grouped by city and vault with item icons.
- Plain HTML, CSS, and JavaScript; no build step; CDN fallback to local `data/` folder.
