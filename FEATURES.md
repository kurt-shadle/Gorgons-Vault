# Project Gorgon Tools — Features

**1.0 scope:** Favor Finder, Storage Saver, Trip plan, Full Inventory (with map/vault filters, Gear Skill 1/2), Mod Finder, What's this for? (recipe lookup). Live CDN version pull, caching, and data version in footer. GA4 deferred to follow-up.

**CDN:** Version is read from `client.projectgorgon.com/fileversion.txt`; data and icons load from `cdn.projectgorgon.com/v{version}/data` and `.../icons`. Responses are cached in `localStorage` (keyed by version). Footer shows "Data: v{version}".

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
- **sources_abilities.json / sources_recipes.json:** Show "where to get this" for abilities (Mod Finder) and recipes (What's this for?).

---

## What's this for? (item recipe lookup)

**Implemented:** Tab and modal. Search by item name; see which recipes use it (from CDN `recipes.json`). Click item names in Favor Finder, Storage Saver, Full Inventory, or Trip plan to open the modal. "Open in What's this for? tab" to continue in that tab. Clear filters button.

**Planned (for later):** Use CDN `itemuses.json` for extra "More Info" / used-for content when that file carries more than recipe overlap.

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

## Future feature ideas (fleshed out)

These are candidate features to explore when prioritising post-1.0 work. Data availability (CDN, exports) and prior exploration notes are called out where relevant.

### What skills am I missing?

A way to search or list **skill lines the user hasn't unlocked yet**, with a split between:

- **Meets requirements** — e.g. level/race/other skill prereqs are satisfied; user could go unlock it.
- **Does not meet requirements** — blocked by other skill levels, favor, or other gates so they know what to work on.

Would use character sheet (and possibly items export) for "what you have" and CDN `skills.json` (and any prereq data) for the full skill list and requirements. Scope and exact UI (search vs filterable list) TBD.

### Recipe finder — where to get recipes

Problem: users (e.g. cooking) often don't know **where or how** to get a given recipe (which NPC, training, drop, etc.). Desired: look up a recipe and see where it can be obtained.

**Data:** CDN has `sources_recipes.json` (and possibly related sources) that describe how recipes can be obtained. Earlier exploration hit limits (e.g. whether "training offerings per NPC" is fully exposed or structured enough). Revisit CDN schema and `sources_recipes.json` / NPC–recipe links to see what's feasible without scraping the wiki.

### Mod Finder → "Do I have gear I can extract this from?"

Let the user **pick one or more mods** (e.g. from Mod Finder), then **search their gear** (items export) to see if they have any equipment with that mod that they could extract.

Extends the current Mod Finder + Full Inventory direction: same CDN mod data and export gear, plus a flow "I want mod X → show my items that have X (and maybe extraction hints if CDN supports it)."

### What can I craft to make favor with an NPC?

Use **current skills and recipes unlocked** (from character sheet / items export) to list **what the user can craft** that would give favor with a chosen NPC (e.g. Favor Finder selection).

Use case: e.g. an NPC in Rahu (e.g. Kohan) likes carpentry items; user has no carpentry in inventory but can craft some — show "you can make X, Y, Z (carpentry) for this NPC" so they can go craft and gift. Would combine Favor Finder NPC likes with CDN recipes + user's known recipes and skill levels.

### What do NPCs buy? (iffy)

A way to see **which NPCs buy what** (and possibly "buy used" behavior):

- **Sell gear:** "Who can I sell this to?" to work around main merchant buy caps.
- **Buy used:** e.g. who has "buy used" for wood, food, etc., often cheaper than player market; currently hit-or-miss in-game.

Unclear if the CDN models vendor buy lists or "buy used" at all. Needs a CDN/data pass; if not available, this may stay wiki/community only. Marked iffy until we confirm data.

### Item drop rates / where to farm (e.g. Pixie Sugar)

"I need [item] — where do I farm it?" Ideally by **map** (and, if data exists, a more specific spot). Example: "I need Pixie Sugar → go to map X (and maybe area Y)."

**Data:** Unknown whether **drop rates or drop/loot tables** exist in any CDN file. Assume not until we check. If not, we could still do "item → maps/areas it's associated with" from existing CDN (e.g. gathering nodes, vendor, recipe sources) and call out "exact drop rates / spots not in CDN."

### What can I gather on map X? (and do I have the skill?)

Per **map** (and optionally area): list **what can be gathered there** and the **skill(s) and levels** required. Optionally indicate **whether the user meets** those levels (from character sheet).

Use case: "I need bananas → show map X has them, need Gardening 20; I have Gardening 25 ✓." Would need CDN (or wiki) data for "gathering node / resource by map and required skill/level." If CDN has it, this is a natural "map + your skills" view.

### What skills are capped?

Show **which skills the user can no longer get XP in** (at cap), so they can focus on skills that still have room to grow.

**Data:** Earlier exploration had trouble finding where **skill cap** or "can't gain XP" is represented in the character sheet or CDN. May not be possible without that data. Revisit character sheet schema and CDN (e.g. `skills.json`, `xptables.json`, or advancement tables) to see if max level per skill is exposed and whether the export indicates "at cap" per skill.

### Teleportation circles — which have I NOT used?

List **teleportation circles (and mushroom circles) the user has not used yet**, so they can go get discovery XP.

Use case: "Which TP circles have I not stepped in? (Including mushroom circles.)" Would need: (1) a full list of TP/mushroom circles from CDN (e.g. `landmarks.json` or similar) and (2) from the character sheet or another export, which of those the user has already "used" or discovered. If the export doesn't include discovery state per circle, this may not be feasible.

### Quest log + what in storage can finish them

Show the **character's quest log** (active quests) and, for each quest, **what they have in storage** that would let them finish it (e.g. turn-in items, objective items).

Use case: "Here are my quests; here's what I already have in my vaults that satisfies each one" so they can grab the right items and turn in. Would need: (1) character sheet or export to include **active quests** (quest IDs or names); (2) CDN `quests.json` (or similar) to define what each quest requires (items, quantities); (3) items export for storage. Match required items to user's inventory across vaults and show "you have X of Y needed for quest Z" (and where it's stored). Depends on quest requirements being exposed in CDN and active-quest list in the export.

---

## Pre-launch / post-1.0

- **GitHub Pages:** Review and verify the app works when deployed (paths, CORS, CDN, file loading). See README for deployment notes.
- **GA4 tracking:** Add Google Analytics 4 tracking (follow-up after 1.0; specifics TBD).

---

## Process (done for 1.0)

- **Accessibility review:** Skip link, aria-hidden on panels, modal focus restore and trap, tab arrow-key navigation, focus-visible styles, external link labels. Completed.
- **AI feature pass / Optimization pass:** Optional follow-ups.

---

## Planned / backlog

- **itemuses.json** in What's this for? (see above).
- **sources_abilities.json / sources_recipes.json** for "where to get" in Mod Finder and What's this for? (see Mod Finder planned).
- **Mod rarity indicator** in Mod Finder (see above).
- **Large-inventory performance:** If Full Inventory is slow with very large exports (e.g. 16k+ items), consider virtual scrolling or pagination for the table.
- **What skills am I missing?** — List skill lines not unlocked; split "meets requirements" vs "does not" (other skills / favor). See Future feature ideas.
- **Recipe finder** — Where to get recipes (e.g. cooking); `sources_recipes.json` / NPC training; revisit CDN.
- **Mod Finder: pick mods → search my gear** — Show which of user's items have selected mod(s) for extraction.
- **Craft-for-favor** — What user can craft for selected NPC (skills + recipes + NPC likes); e.g. Kohan + carpentry.
- **What NPCs buy** (iffy) — Who buys what / "buy used"; depends on CDN vendor data.
- **Where to farm item X** — Map (and area if in CDN); drop rates only if present in CDN.
- **What can I gather on map X** — Resources per map + required skill levels; indicate if user has levels.
- **What skills are capped?** — Which skills can no longer gain XP; data (cap / at-cap) may be missing (see Future feature ideas).
- **Teleportation circles — which have I NOT used?** — TP and mushroom circles not yet used, for discovery XP; depends on CDN circle list + export discovery state.
- **Quest log + storage match** — Show active quests and what the user has in storage that would let them finish each (turn-in items, etc.); character sheet quest list + CDN quest requirements + items export.
