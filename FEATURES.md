# Project Gorgon Tools — Features

## Favor Item Finder

Load items export and optionally character sheet, pick map and NPC. Results update automatically when an NPC is selected. Shows current favor with the NPC (if character sheet loaded) and giftable items grouped by city and storage vault. NPC names and vault names link to the Project Gorgon Wiki. Already implemented.

---

## Storage Saver

Find duplicate item types across storage vaults so you can consolidate stacks in-game and free slots. Runs automatically when switching to the tab. Example: 5 mushrooms in Vault A and 6 in Vault B → combine into one stack to save a slot.

**Implementation:** Group user items by `TypeID`. For each TypeID that appears in more than one `StorageVault`, list vaults and stack sizes and show "slots you could save" (e.g. N stacks → 1 stack). Stack limits from CDN `MaxStackSize` when available; else a sensible default. Sort by slots saveable (desc) or item name. Total slots saveable is shown at the top. Vault names link to the wiki.

**Planned (for later):** A "plan" to help users maximize time when consolidating: e.g. items are listed by how many slots each consolidation saves (most first). Tip: consolidate by destination—when you're at a map, move all listed stacks for that item into one vault there so you only visit each map once. Could be surfaced in the UI as a short guidance block or kept as doc-only.

---

## Full Inventory

Break out everything the character has into categories (Equipment, Skill Book, Recipe, Work Order, Consumables, Potions, Gardening, Ingredients, Cooking, Ability ingredients, Nature, Brewing, Other). Categories are derived from CDN **Keywords** and icon (Skill Book / Recipe / Work Order). Category filter dropdown and search box (filters by name, description, effects, mods). Equipment has a dedicated Mods column with treasure mods from export + `tsysclientinfo.json`; other categories do not. Table layout with Icon, Name, Qty, Location(s) (and Mods for Equipment); responsive stacked layout on narrow viewports. Vault names in locations link to the wiki. Mod filtering (e.g. “show only items with mod X”) is **not** planned here—that belongs in **Mod Finder**.

---

## Mod Finder (by skill)

**Implemented:** Pick one or two combat skills via dropdowns. The list shows all mods for the chosen skill(s) from CDN tsysclientinfo.json, grouped by equipment slot in a three-column layout. Multiselect slot filter (Head, Chest, Hands, MainHand, OffHand, Legs, Feet, Other). Mods that reference a specific ability (via `MOD_ABILITY_*` in effect text) show that ability's icon from abilities.json.

**Planned (for later):** Filter mods by your inventory to complement Full Inventory.

---

## Item “used for” (non-equipment)

**Idea:** For non-equipment items (consumables, ingredients, etc.), show what they’re used for—e.g. which recipes use this item, or notes from CDN `itemuses.json` (when that file carries more than recipe overlap). Would help answer “why do I have this?” and “what can I make with it?” Implementation TBD (recipes.json, itemuses.json, or wiki links).

---

## Build in-app vs link to wiki

| In-app | Prefer wiki link |
|--------|-------------------|
| Your data (favor, storage, inventory, mods from your export) | Deep lore, full NPC bios, quest walkthroughs |
| Quick lookups from CDN (item names, effects, categories) | Long-form guides, community strategies |
| NPC names as links to wiki | Duplicating large wiki content |
| “Used in” / recipe hints (short list or “see wiki”) | Full recipe tables or step-by-step guides |

**Principle:** The app stays focused on *your* exports and CDN-backed lists/tables. When “more story, more context, or full guide” is needed, link to the wiki (e.g. NPC name → wiki page). New features (e.g. item “used for”) can show a short in-app summary and optionally “More on wiki” where the wiki has a dedicated item/recipe page.
