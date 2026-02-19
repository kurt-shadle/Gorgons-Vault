# Project Gorgon Tools

A small browser toolkit for **Project Gorgon**. Load your items export and character sheet once, then use multiple features without re-uploading. All processing runs in your browser; your files never leave your machine.

## Features

- **Favor Finder** — Pick a map and NPC; see which stored items you can give for favor (Love vs Like), grouped by city and vault. Current favor shown if you load a character sheet. NPC and vault names link to the wiki.
- **Storage Saver** — Find items split across multiple vaults so you can consolidate stacks in-game and free slots. Runs when you open the tab. Shows only items where you can actually save slots; each line shows map and vault (e.g. *Serbule: Council Vault — 5*).
- **Full Inventory** — Browse all items by category (equipment, Skill Book, Recipe, Work Order, consumables, potions, gardening, etc.). Filter by category; search by name, description, effects, or mods. Equipment shows treasure mods in a separate Mods column, with human-readable effects and inline icons where the game data uses `<icon=NNN>`.
- **Mod Finder** — Pick one or two combat skills; see all mods for those skills, grouped by equipment slot. Multiselect slot filter. Mods that reference a specific ability show that ability's icon.

See [FEATURES.md](FEATURES.md) for more detail on each feature and future plans.

## How to run it

1. **Serve the folder over HTTP** (required so the app can load CDN data).
   - From this folder, run for example:
     - `npx serve`
     - or `python -m http.server 8000`
   - Open the URL in your browser (e.g. `http://localhost:3000` or `http://localhost:8000`).

2. **Your data** (load once; shared across all features)
   - **Items export** (required for Favor Finder and Storage Saver): JSON from the game’s storage/items export. Must include an `Items` array and can include a `Character` name.
   - **Character sheet** (optional): Character sheet JSON for “Current favor with &lt;NPC&gt;” in Favor Finder. The sheet’s `Character` value should match the character from your items export.

3. **Use the tabs** to switch between Favor Finder, Storage Saver, Full Inventory, and Mod Finder. No need to re-upload when changing features.

## Where the game data comes from

The app loads NPCs, items, storage vaults, areas, attributes, and treasure-system data (e.g. for equipment mod text) from the Project Gorgon CDN:

- `https://cdn.projectgorgon.com/v457/data/`

If the CDN is unreachable (e.g. offline or blocked), use local copies:

1. Download `npcs.json`, `items.json`, `storagevaults.json`, `areas.json`, `attributes.json`, `skills.json`, `abilities.json`, and `tsysclientinfo.json` from the [CDN data](https://cdn.projectgorgon.com/v457/data/).
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

---

Some portions of the game data are copyright Elder Game, LLC.
