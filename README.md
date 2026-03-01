# Project Gorgon Tools

A small browser toolkit for **Project Gorgon** (v1.2). Load your items export and character sheet once, then use multiple features without re-uploading. All processing runs in your browser; your files never leave your machine.

## Features

- **Favor Finder** — Pick a map and NPC; see which stored items you can give for favor (Love vs Like), grouped by city and vault. Current favor shown if you load a character sheet. NPC and vault names link to the wiki.
- **Storage Saver** — Find items split across multiple vaults so you can consolidate stacks in-game and free slots. Runs when you open the tab. Shows only items where you can actually save slots; each line shows map and vault (e.g. *Serbule: Council Vault — 5*).
- **Trip plan** — Plan a multi-stop route: pick maps in order and see what to pick up and drop at each stop to consolidate stacks. Add as many stops as you like; clear route and card layout.
- **Quest Turn-ins** — See your active quests and which items in storage you can turn in. Requires both items export and character sheet. Default view shows only quests you’re ready to turn in; optional filters for “all quests” and by map. Each quest shows turn-in NPC (with wiki link), current favor with that NPC, required items (with icons and “What’s this for?” links), and rewards (favor, skill XP, items).
- **Full Inventory** — Browse all items by category (equipment, Skill Book, Recipe, Work Order, consumables, potions, gardening, etc.). Filter by category, map, and storage vault; search by name, description, effects, or mods. Equipment shows treasure mods in a separate Mods column, with human-readable effects and inline icons where the game data uses `<icon=NNN>`.
- **Mod Finder** — Pick one or two combat skills; see all mods for those skills, grouped by equipment slot. Multiselect slot filter. Mods that reference a specific ability show that ability's icon.
- **What's this for?** — Search by item name to see which recipes use it (from CDN). Click item names in other tabs to open the recipe lookup modal; optional "Open in What's this for? tab" to continue there.

See [FEATURES.md](FEATURES.md) for more detail on each feature and future plans.

## How to run it

1. **Serve the folder over HTTP** (required so the app can load CDN data).
   - From this folder, run for example:
     - `npx serve`
     - or `python -m http.server 8000`
   - Open the URL in your browser (e.g. `http://localhost:3000` or `http://localhost:8000`).

2. **Your data** (load once; shared across all features)
   - **Items export** (required for Favor Finder, Storage Saver, and Quest Turn-ins): JSON from the game’s storage/items export. Must include an `Items` array and can include a `Character` name.
   - **Character sheet** (optional for Favor Finder; required for Quest Turn-ins): Character sheet JSON for “Current favor with &lt;NPC&gt;” in Favor Finder and for active quests + favor in Quest Turn-ins. The sheet’s `Character` value should match the character from your items export.

3. **Use the tabs** — The first tab ("How to use") is a short in-app guide. Then: Favor Finder, Storage Saver, Trip plan, Quest Turn-ins, Full Inventory, Mod Finder, and What's this for? No need to re-upload when changing features.

## Where the game data comes from

The app loads NPCs, items, storage vaults, areas, attributes, and treasure-system data (e.g. for equipment mod text) from the Project Gorgon CDN:

- `https://cdn.projectgorgon.com/v457/data/`

If the CDN is unreachable (e.g. offline or blocked), use local copies:

1. Download `npcs.json`, `items.json`, `storagevaults.json`, `areas.json`, `attributes.json`, `skills.json`, `abilities.json`, `tsysclientinfo.json`, `recipes.json`, and `quests.json` from the [CDN data](https://cdn.projectgorgon.com/v457/data/). (Quest Turn-ins loads `quests.json` when you first open that tab.)
2. Put them in a `data/` folder next to `index.html`.
3. Serve the project with a local server as above.

Icons are loaded from `https://cdn.projectgorgon.com/v457/icons/`.

## Files in this project

| File            | Purpose                                  |
|-----------------|------------------------------------------|
| `index.html`    | Main page, tabs, and feature panels      |
| `app.js`        | Logic, CDN load, all features, UI       |
| `style.css`     | Layout and styling (mobile-friendly)    |
| `FEATURES.md`   | Feature descriptions and roadmap        |
| `CHANGELOG.md`  | Version history and changes              |
| `README.md`     | This file                               |

Game export files (`Character_*.json`, `*_items_*.json`) are for your use via the file pickers; they are gitignored so they don’t get committed.

## Tech notes

- No build step; plain HTML, CSS, and JavaScript.
- Uses the browser `FileReader` API for your JSON; no upload to any server.
- Requires a local HTTP server to avoid CORS/file-access issues with the CDN and `fetch`.
- Tabs and buttons use 44px+ touch targets for mobile.

### Deploying (e.g. GitHub Pages)

To publish on GitHub Pages: enable Pages for the repo (e.g. "Deploy from a branch", main, `/ (root)`). The app uses relative paths and fetches CDN data from the Project Gorgon CDN; no base path change is needed. If you use a local `data/` fallback, ensure those files are in the repo or served from the same origin. GA4 (if added later) is a follow-up.

---

Some portions of the game data are copyright Elder Game, LLC.
