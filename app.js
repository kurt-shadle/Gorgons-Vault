/**
 * Gorgon's Vault — main app logic.
 * Loads CDN/local game data. Features: Favor Finder, Storage Saver, Trip plan,
 * Full Inventory, Mod Finder, What's this for? (item crafting lookup).
 */
(function () {
  'use strict';

  // ——— CDN and local data paths (version set at load from fileversion.txt) ———
  const FILEVERSION_URL = 'https://client.projectgorgon.com/fileversion.txt';
  const CDN_VERSION_DEFAULT = '458';
  let cdnVersion = '';
  let CDN_BASE = '';
  let CDN_ICONS_BASE = '';
  const DATA_BASE = './data';
  const CACHE_PREFIX = 'gorgon_cdn_';

  // ——— Embedded example data (no fetch needed; works with file:// and any server) ———
  const EXAMPLE_ITEMS = {
    Character: 'Example Character',
    Items: [
      { TypeID: 1, Name: 'Example herb', StorageVault: 'Serbule Council Vault', StackSize: 5 },
      { TypeID: 1, Name: 'Example herb', StorageVault: 'Serbule Bank', StackSize: 3 },
      { TypeID: 2, Name: 'Example ore', StorageVault: 'Serbule Council Vault', StackSize: 1 },
      { TypeID: 2, Name: 'Example ore', StorageVault: 'Serbule Bank', StackSize: 2 },
      { TypeID: 3, Name: 'Example ingredient', StorageVault: 'Serbule Council Vault', StackSize: 10 }
    ]
  };
  const EXAMPLE_CHARACTER = { Character: 'Example Character', NPCs: {} };

  // ——— In-memory data (CDN + user uploads) ———
  let npcs = {};
  let items = {};
  let storageVaults = {};
  let areas = {};
  let attributes = {};
  let tsysClientInfo = {};
  let tsysByInternalName = {};
  let skills = {};
  let abilities = {};
  let recipes = {};
  let itemTypeIdToRecipes = {};
  let charactersItems = {};
  let charactersSheets = {};
  let giftableNpcs = [];
  let maps = [];

  // ——— DOM refs and constants ———
  const $ = (id) => document.getElementById(id);
  const itemsFiles = $('itemsFiles');
  const characterFiles = $('characterFiles');
  const mapSelect = $('mapSelect');
  const npcSelect = $('npcSelect');
  const dataStatus = $('dataStatus');
  const resultsSection = $('resultsSection');
  const npcFavorEl = $('npcFavor');
  const resultsList = $('resultsList');
  const noMatches = $('noMatches');
  const cdnError = $('cdnError');
  const storageSaverStatus = $('storageSaverStatus');
  const storageSaverResults = $('storageSaverResults');
  const tripPlannerStops = $('tripPlannerStops');
  const tripPlannerAddStop = $('tripPlannerAddStop');
  const tripPlannerClear = $('tripPlannerClear');
  const tripPlannerOutput = $('tripPlannerOutput');
  const fullInventoryEmpty = $('fullInventoryEmpty');
  const fullInventoryResults = $('fullInventoryResults');
  const fullInventoryCategory = $('fullInventoryCategory');
  const fullInventoryMap = $('fullInventoryMap');
  const fullInventoryVault = $('fullInventoryVault');
  const fullInventorySkillReq1 = $('fullInventorySkillReq1');
  const fullInventorySkillReq2 = $('fullInventorySkillReq2');
  const fullInventorySlotCheckboxes = $('fullInventorySlotCheckboxes');
  const fullInventorySearch = $('fullInventorySearch');
  const fullInventoryClearFilters = $('fullInventoryClearFilters');
  const backToTopBtn = $('backToTop');
  const modFinderSkill1 = $('modFinderSkill1');
  const modFinderSkill2 = $('modFinderSkill2');
  const modFinderRarity = $('modFinderRarity');
  const modFinderSlotCheckboxes = $('modFinderSlotCheckboxes');
  const modFinderClearFilters = $('modFinderClearFilters');
  const modFinderEmpty = $('modFinderEmpty');
  const modFinderResults = $('modFinderResults');
  const whatsThisForSearch = $('whatsThisForSearch');
  const whatsThisForClearFilters = $('whatsThisForClearFilters');
  const whatsThisForResults = $('whatsThisForResults');
  const itemUsedForModal = $('itemUsedForModal');
  const itemUsedForModalBody = $('itemUsedForModalBody');
  const itemUsedForModalClose = $('itemUsedForModalClose');
  const itemUsedForModalOpenTab = $('itemUsedForModalOpenTab');
  const MOD_SLOT_FILTER_OTHER = '__other__';
  const PANEL_ID = 'data-panel';
  let whatsThisForDebounceTimer = null;
  let itemUsedForModalLastItem = null;
  let modalFocusRestore = null;

  const MOD_SLOT_ORDER = ['Head', 'Chest', 'Hands', 'MainHand', 'OffHand', 'Legs', 'Feet'];

  /** Full Inventory: category order; icon 5792 = Skill Book, 4003 + name/desc = Recipe or Work Order. */
  const FULL_INVENTORY_CATEGORY_ORDER = [
    'Equipment', 'Skill Book', 'Recipe', 'Work Order', 'Consumables', 'Potions', 'Gardening', 'Ingredients',
    'Cooking', 'Ability ingredients', 'Nature', 'Brewing', 'Gems', 'Trophies', 'Artwork', 'Valuables', 'Vendor trash',
    'Leather', 'Metal', 'Dyes', 'Cloth', 'Phlogiston', 'Augments', 'Other'
  ];
  const KEYWORD_TO_CATEGORY = {
    Equipment: 'Equipment', Weapon: 'Equipment', Armor: 'Equipment', Shield: 'Equipment',
    OffHand: 'Equipment', Sword: 'Equipment', Staff: 'Equipment', Bow: 'Equipment',
    Crossbow: 'Equipment', Unarmed: 'Equipment', Dagger: 'Equipment',
    Consumable: 'Consumables',
    Potion: 'Potions',
    GardeningRelated: 'Gardening', Plant: 'Gardening', Seed: 'Gardening', Seedling: 'Gardening',
    FlowerSeed: 'Gardening', Flower: 'Gardening',
    AlchemyIngredient: 'Ingredients', BrewingIngredient: 'Ingredients', BrewingGarnishA2: 'Ingredients',
    BrewingGarnishA3: 'Ingredients', BrewingGarnishA4: 'Ingredients', BrewingAnimalPartA5: 'Ingredients',
    BrewingFlowersW3: 'Ingredients', BrewingFlowersW4: 'Ingredients', BrewingFlowersW5: 'Ingredients', BrewingFlowersW6: 'Ingredients',
    CookingIngredient: 'Cooking',
    AbilityIngredient: 'Ability ingredients',
    Nature: 'Nature',
    BrewingRelated: 'Brewing', BottledItem: 'Brewing',
    Gem: 'Gems', Crystal: 'Gems',
    CorpseTrophy: 'Trophies',
    Artwork: 'Artwork', Painting: 'Artwork',
    Coin: 'Valuables', Antique: 'Valuables',
    VendorTrash: 'Vendor trash',
    Skinning: 'Leather', LeatherRoll: 'Leather', Skin: 'Leather',
    LeatherRoll1: 'Leather', LeatherRoll2: 'Leather', LeatherRoll3: 'Leather', LeatherRoll4: 'Leather',
    LeatherRoll5: 'Leather', LeatherRoll6: 'Leather', LeatherRoll7: 'Leather', LeatherRoll8: 'Leather',
    LeatherRoll9: 'Leather', LeatherRoll10: 'Leather', LeatherRoll11: 'Leather',
    Ore: 'Metal',
    Dye: 'Dyes',
    Cloth: 'Cloth', Textiles: 'Cloth', FaeFelt: 'Cloth', RawCotton: 'Cloth', CardedCotton: 'Cloth',
    Yarn: 'Cloth', CottonPlant: 'Cloth',
    Contraption: 'Augments'
  };

  function setStatus(msg) {
    dataStatus.textContent = msg;
  }

  /** Item key for CDN items lookup: typeId → "item_123" */
  function normalizeItemKey(typeId) {
    return 'item_' + Number(typeId);
  }

  /** Strip "Key=Value" to "Key" for keyword matching. */
  function itemKeywordBase(kw) {
    if (typeof kw !== 'string') return '';
    const eq = kw.indexOf('=');
    return eq >= 0 ? kw.slice(0, eq) : kw;
  }

  /** True if any NPC preference keyword base matches an item keyword base. */
  function hasKeywordMatch(itemKeywords, preferenceKeywords) {
    const bases = new Set((itemKeywords || []).map(itemKeywordBase));
    return (preferenceKeywords || []).some((pk) => bases.has(pk));
  }

  async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    return res.json();
  }

  /** Resolve current game data version from client.projectgorgon.com (trimmed). Falls back to CDN_VERSION_DEFAULT on failure. */
  async function getCdnVersion() {
    try {
      const r = await fetch(FILEVERSION_URL);
      if (!r.ok) return CDN_VERSION_DEFAULT;
      const t = await r.text();
      const v = (t && t.trim()) ? t.trim() : CDN_VERSION_DEFAULT;
      return v || CDN_VERSION_DEFAULT;
    } catch (e) {
      return CDN_VERSION_DEFAULT;
    }
  }

  /** Load one CDN file: try localStorage cache (keyed by version), then fetch and cache. */
  async function fetchCdnCached(version, file) {
    const key = CACHE_PREFIX + version + '_' + file;
    try {
      const cached = localStorage.getItem(key);
      if (cached) return JSON.parse(cached);
    } catch (e) { /* ignore */ }
    const url = CDN_BASE + '/' + file;
    const data = await fetchJson(url);
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) { /* quota or disabled */ }
    return data;
  }

  /** Load all CDN JSON (version from fileversion.txt, then npcs, items, etc. with caching); build indexes. */
  async function loadCdn() {
    cdnVersion = await getCdnVersion();
    CDN_BASE = 'https://cdn.projectgorgon.com/v' + cdnVersion + '/data';
    CDN_ICONS_BASE = 'https://cdn.projectgorgon.com/v' + cdnVersion + '/icons';

    const tryUrl = (base, file) => base + '/' + file;
    const tryCdnThenLocal = async (file) => {
      try {
        return await fetchCdnCached(cdnVersion, file);
      } catch (e) {
        return await fetchJson(tryUrl(DATA_BASE, file));
      }
    };

    try {
      npcs = await fetchCdnCached(cdnVersion, 'npcs.json');
    } catch (e) {
      try {
        npcs = await fetchJson(tryUrl(DATA_BASE, 'npcs.json'));
      } catch (e2) {
        throw new Error('Could not load npcs.json');
      }
    }
    try {
      items = await fetchCdnCached(cdnVersion, 'items.json');
    } catch (e) {
      try {
        items = await fetchJson(tryUrl(DATA_BASE, 'items.json'));
      } catch (e2) {
        throw new Error('Could not load items.json');
      }
    }
    try {
      storageVaults = await fetchCdnCached(cdnVersion, 'storagevaults.json');
    } catch (e) {
      try {
        storageVaults = await fetchJson(tryUrl(DATA_BASE, 'storagevaults.json'));
      } catch (e2) {
        storageVaults = {};
      }
    }
    try {
      areas = await fetchCdnCached(cdnVersion, 'areas.json');
    } catch (e) {
      try {
        areas = await fetchJson(tryUrl(DATA_BASE, 'areas.json'));
      } catch (e2) {
        areas = {};
      }
    }
    try {
      attributes = await fetchCdnCached(cdnVersion, 'attributes.json');
    } catch (e) {
      try {
        attributes = await fetchJson(tryUrl(DATA_BASE, 'attributes.json'));
      } catch (e2) {
        attributes = {};
      }
    }
    try {
      tsysClientInfo = await fetchCdnCached(cdnVersion, 'tsysclientinfo.json');
    } catch (e) {
      try {
        tsysClientInfo = await fetchJson(tryUrl(DATA_BASE, 'tsysclientinfo.json'));
      } catch (e2) {
        tsysClientInfo = {};
      }
    }
    tsysByInternalName = {};
    for (const entry of Object.values(tsysClientInfo)) {
      if (entry && entry.InternalName) {
        tsysByInternalName[entry.InternalName] = entry;
      }
    }
    try {
      skills = await fetchCdnCached(cdnVersion, 'skills.json');
    } catch (e) {
      try {
        skills = await fetchJson(tryUrl(DATA_BASE, 'skills.json'));
      } catch (e2) {
        skills = {};
      }
    }
    try {
      abilities = await fetchCdnCached(cdnVersion, 'abilities.json');
    } catch (e) {
      try {
        abilities = await fetchJson(tryUrl(DATA_BASE, 'abilities.json'));
      } catch (e2) {
        abilities = {};
      }
    }
    try {
      recipes = await fetchCdnCached(cdnVersion, 'recipes.json');
    } catch (e) {
      try {
        recipes = await fetchJson(tryUrl(DATA_BASE, 'recipes.json'));
      } catch (e2) {
        recipes = {};
      }
    }
    buildItemTypeIdToRecipesIndex();
    buildGiftableNpcsAndMaps();
  }

  /** Index: item typeId → list of recipes that use it (for "What's this for?"). */
  function buildItemTypeIdToRecipesIndex() {
    itemTypeIdToRecipes = {};
    for (const [key, recipe] of Object.entries(recipes)) {
      if (!recipe || !Array.isArray(recipe.Ingredients)) continue;
      for (const ing of recipe.Ingredients) {
        const code = ing.ItemCode ?? ing.ItemTypeID;
        if (code == null) continue;
        const tid = Number(code);
        if (!itemTypeIdToRecipes[tid]) itemTypeIdToRecipes[tid] = [];
        if (!itemTypeIdToRecipes[tid].includes(recipe)) {
          itemTypeIdToRecipes[tid].push(recipe);
        }
      }
    }
  }

  /** Recipes that list this item as an ingredient (by typeId). */
  function getRecipesForItem(typeId) {
    if (typeId == null) return [];
    const list = itemTypeIdToRecipes[Number(typeId)];
    return list ? [...list] : [];
  }

  /** Search items by name (substring, case-insensitive); returns up to 50 { typeId, name }. */
  function findItemsByName(query) {
    if (!query || typeof query !== 'string') return [];
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out = [];
    for (const [key, item] of Object.entries(items)) {
      if (!item) continue;
      const name = (item.Name || '').trim();
      if (!name || !name.toLowerCase().includes(q)) continue;
      const m = key.match(/item_(\d+)/);
      const typeId = m ? parseInt(m[1], 10) : null;
      if (typeId != null) out.push({ typeId, name });
    }
    out.sort((a, b) => a.name.localeCompare(b.name));
    return out.slice(0, 50);
  }

  /** Human-readable names for a recipe's ResultItems (for "What's this for?" display). */
  function getResultItemNames(recipe) {
    if (!recipe || !Array.isArray(recipe.ResultItems)) return [];
    return recipe.ResultItems.map((r) => {
      const cdn = getCdnItem(r.ItemCode ?? r.ItemTypeID);
      return (cdn && cdn.Name) ? cdn.Name : ('Item ' + (r.ItemCode ?? r.ItemTypeID));
    }).filter(Boolean);
  }

  /** Append a small item icon + optional label to parent; returns the wrapper span. */
  function appendItemIconAndName(parent, typeId, label, stackSize) {
    const cdn = getCdnItem(typeId);
    const name = (cdn && cdn.Name) ? cdn.Name : ('Item ' + typeId);
    const iconId = (cdn && cdn.IconId != null) ? cdn.IconId : null;
    const span = document.createElement('span');
    span.className = 'item-used-for-icon-name';
    if (iconId != null) {
      const img = document.createElement('img');
      img.src = CDN_ICONS_BASE + '/icon_' + iconId + '.png';
      img.alt = '';
      img.className = 'item-used-for-icon';
      span.appendChild(img);
    }
    const text = document.createTextNode((label != null ? label : name) + (stackSize != null && stackSize > 1 ? ' × ' + stackSize : ''));
    span.appendChild(text);
    parent.appendChild(span);
    return span;
  }

  /** Build DOM for one recipe: icon, name, skill/lvl, ingredients list (with icons), "→", results (with icons). */
  function renderRecipeBlock(recipe) {
    const block = document.createElement('div');
    block.className = 'item-used-for-recipe-block';
    const nameRow = document.createElement('div');
    nameRow.className = 'item-used-for-recipe-name-row';
    const recipeIconId = (recipe && recipe.IconId != null) ? recipe.IconId : null;
    if (recipeIconId != null) {
      const img = document.createElement('img');
      img.src = CDN_ICONS_BASE + '/icon_' + recipeIconId + '.png';
      img.alt = '';
      img.className = 'item-used-for-recipe-icon';
      nameRow.appendChild(img);
    }
    const nameText = (recipe.Name || recipe.InternalName || 'Unknown').trim();
    const skill = (recipe.Skill || '').trim() || '—';
    const lvl = recipe.SkillLevelReq != null ? ' Lv ' + recipe.SkillLevelReq : '';
    const nameSpan = document.createElement('span');
    nameSpan.className = 'item-used-for-recipe-title';
    nameSpan.textContent = nameText + ' (' + skill + lvl + ')';
    nameRow.appendChild(nameSpan);
    block.appendChild(nameRow);
    const ingredientsRow = document.createElement('div');
    ingredientsRow.className = 'item-used-for-recipe-ingredients';
    if (recipe.Ingredients && recipe.Ingredients.length) {
      const ingLabel = document.createElement('span');
      ingLabel.className = 'item-used-for-recipe-label';
      ingLabel.textContent = 'Ingredients: ';
      ingredientsRow.appendChild(ingLabel);
      recipe.Ingredients.forEach((ing, i) => {
        const code = ing.ItemCode ?? ing.ItemTypeID;
        if (code == null) return;
        if (i > 0) ingredientsRow.appendChild(document.createTextNode(' '));
        appendItemIconAndName(ingredientsRow, code, null, ing.StackSize);
      });
    } else {
      ingredientsRow.appendChild(document.createTextNode('Ingredients: —'));
    }
    block.appendChild(ingredientsRow);
    const resultsRow = document.createElement('div');
    resultsRow.className = 'item-used-for-recipe-results';
    if (recipe.ResultItems && recipe.ResultItems.length) {
      const resLabel = document.createElement('span');
      resLabel.className = 'item-used-for-recipe-label';
      resLabel.textContent = '→ Makes: ';
      resultsRow.appendChild(resLabel);
      recipe.ResultItems.forEach((r, i) => {
        const code = r.ItemCode ?? r.ItemTypeID;
        if (code == null) return;
        if (i > 0) resultsRow.appendChild(document.createTextNode(' '));
        appendItemIconAndName(resultsRow, code, null, r.StackSize);
      });
    } else {
      resultsRow.appendChild(document.createTextNode('→ Makes: —'));
    }
    block.appendChild(resultsRow);
    return block;
  }

  /** Build DOM fragment: item name + "Used in N recipe(s):" blocks (with icons and full recipe info) or "Not used in any known recipes." */
  function renderItemUsedForHTML(itemName, typeId) {
    const recipeList = typeId != null ? getRecipesForItem(typeId) : [];
    const frag = document.createDocumentFragment();
    const heading = document.createElement('p');
    heading.className = 'item-used-for-item-name';
    heading.textContent = itemName;
    frag.appendChild(heading);
    if (recipeList.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'item-used-for-empty';
      empty.textContent = 'Not used in any known recipes.';
      frag.appendChild(empty);
    } else {
      const usedIn = document.createElement('p');
      usedIn.className = 'item-used-for-used-in';
      usedIn.textContent = 'Used in ' + recipeList.length + ' recipe(s):';
      frag.appendChild(usedIn);
      const container = document.createElement('div');
      container.className = 'item-used-for-recipe-list';
      for (const r of recipeList) {
        container.appendChild(renderRecipeBlock(r));
      }
      frag.appendChild(container);
    }
    return frag;
  }

  /** Show modal with "What's this used for?" for the given item (name + optional typeId). */
  function openItemUsedForModal(itemName, typeId) {
    itemUsedForModalLastItem = { itemName, typeId };
    modalFocusRestore = document.activeElement;
    if (itemUsedForModalBody) {
      itemUsedForModalBody.innerHTML = '';
      itemUsedForModalBody.appendChild(renderItemUsedForHTML(itemName, typeId));
    }
    if (itemUsedForModalOpenTab) {
      itemUsedForModalOpenTab.hidden = false;
      itemUsedForModalOpenTab.onclick = (e) => {
        e.preventDefault();
        closeItemUsedForModal();
        switchTab('panelWhatsThisFor');
        if (whatsThisForSearch && itemName) {
          whatsThisForSearch.value = itemName;
          renderWhatsThisForResults(itemName, typeId);
        }
      };
    }
    if (itemUsedForModal) {
      itemUsedForModal.hidden = false;
      itemUsedForModal.setAttribute('aria-hidden', 'false');
      if (itemUsedForModalClose) itemUsedForModalClose.focus();
    }
    document.body.classList.add('modal-open');
  }

  /** Hide the item-used-for modal, re-enable body scroll, and restore focus to trigger. */
  function closeItemUsedForModal() {
    if (itemUsedForModal) {
      itemUsedForModal.hidden = true;
      itemUsedForModal.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('modal-open');
    if (modalFocusRestore && typeof modalFocusRestore.focus === 'function') {
      modalFocusRestore.focus();
      modalFocusRestore = null;
    }
  }

  /** Render "What's this for?" tab: hint, no matches, multiple-match picker, or recipe list. */
  function renderWhatsThisForResults(query, selectedTypeId) {
    if (!whatsThisForResults) return;
    whatsThisForResults.innerHTML = '';
    const q = (query || '').trim();
    if (!q) {
      const hint = document.createElement('p');
      hint.className = 'whats-this-for-hint';
      hint.textContent = 'Type an item name to search.';
      whatsThisForResults.appendChild(hint);
      return;
    }
    const matches = findItemsByName(q);
    if (matches.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'whats-this-for-empty';
      empty.textContent = 'No items found.';
      whatsThisForResults.appendChild(empty);
      return;
    }
    if (matches.length > 1 && !selectedTypeId) {
      const picker = document.createElement('div');
      picker.className = 'whats-this-for-picker';
      const label = document.createElement('p');
      label.textContent = 'Multiple matches. Select one:';
      picker.appendChild(label);
      const list = document.createElement('ul');
      list.className = 'whats-this-for-match-list';
      for (const m of matches) {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'item-lookup-link';
        btn.textContent = m.name;
        btn.addEventListener('click', () => renderWhatsThisForResults(q, m.typeId));
        li.appendChild(btn);
        list.appendChild(li);
      }
      picker.appendChild(list);
      whatsThisForResults.appendChild(picker);
      return;
    }
    const typeId = selectedTypeId != null ? selectedTypeId : (matches[0] && matches[0].typeId);
    const itemName = matches.find((x) => x.typeId === typeId)?.name || matches[0]?.name || q;
    whatsThisForResults.appendChild(renderItemUsedForHTML(itemName, typeId));
  }

  /** Build list of giftable NPCs and sorted map names from npcs.json. */
  function buildGiftableNpcsAndMaps() {
    const areaNames = new Set();
    giftableNpcs = [];
    for (const [key, data] of Object.entries(npcs)) {
      if (!key.startsWith('NPC_') || !Array.isArray(data.Preferences) || data.Preferences.length === 0) continue;
      if (data.AreaFriendlyName) areaNames.add(data.AreaFriendlyName);
      giftableNpcs.push({ key, ...data });
    }
    maps = Array.from(areaNames).sort((a, b) => a.localeCompare(b));
  }

  /** Fill map dropdown with area names (from giftable NPCs). */
  function populateMapDropdown() {
    mapSelect.innerHTML = '';
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = '— Select map —';
    mapSelect.appendChild(opt);
    maps.forEach((m) => {
      const o = document.createElement('option');
      o.value = m;
      o.textContent = m;
      mapSelect.appendChild(o);
    });
    mapSelect.disabled = false;
  }

  /** Fill NPC dropdown with NPCs in the selected map (area). */
  function populateNpcDropdown(areaFriendlyName) {
    npcSelect.innerHTML = '';
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = areaFriendlyName ? '— Select NPC —' : '— Choose a map first —';
    npcSelect.appendChild(opt);
    if (!areaFriendlyName) {
      npcSelect.disabled = true;
      return;
    }
    const filtered = giftableNpcs.filter((n) => n.AreaFriendlyName === areaFriendlyName);
    filtered.sort((a, b) => (a.Name || '').localeCompare(b.Name || ''));
    filtered.forEach((n) => {
      const o = document.createElement('option');
      o.value = n.key;
      o.textContent = n.Name || n.key;
      npcSelect.appendChild(o);
    });
    npcSelect.disabled = false;
  }

  /** Apply parsed items data (from file or example fetch); update status and run current tab. */
  function applyItemsData(data, sourceLabel) {
    const name = (data.Character || sourceLabel || 'Unknown').trim() || sourceLabel;
    if (!data.Items || !Array.isArray(data.Items)) {
      setStatus('Data has no Items array.');
      runCurrentTab();
      return;
    }
    charactersItems[name] = data.Items;
    setStatus('Loaded items from ' + sourceLabel + '.');
    runCurrentTab();
  }

  /** Apply parsed character sheet data (from file or example fetch); update status and run current tab. */
  function applyCharacterSheetData(data, sourceLabel) {
    const name = (data.Character || sourceLabel || 'Unknown').trim() || sourceLabel;
    charactersSheets[name] = data;
    const prev = dataStatus.textContent || '';
    setStatus(prev ? prev + ' Character sheet loaded.' : 'Character sheet loaded.');
    runCurrentTab();
  }

  /** Parse items JSON and store in charactersItems keyed by character name. */
  function onItemsFilesChange() {
    const file = itemsFiles.files && itemsFiles.files[0];
    charactersItems = {};
    if (!file) {
      setStatus('');
      runCurrentTab();
      return;
    }
    setStatus('Reading items file…');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        applyItemsData(data, file.name);
      } catch (e) {
        setStatus('Invalid JSON: ' + e.message);
      }
    };
    reader.readAsText(file);
  }

  /** Parse character sheet JSON and store in charactersSheets for favor display. */
  function onCharacterFilesChange() {
    const file = characterFiles.files && characterFiles.files[0];
    charactersSheets = {};
    if (!file) {
      runCurrentTab();
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        applyCharacterSheetData(data, file.name);
      } catch (_) {
        setStatus('Invalid character sheet JSON.');
      }
    };
    reader.readAsText(file);
  }

  /** Run the logic for whichever feature panel is currently visible (e.g. after file upload). */
  function runCurrentTab() {
    const panel = document.querySelector('.feature-panel:not(.hidden)');
    const id = panel ? panel.id : null;
    if (id === 'panelIntro') return;
    if (id === 'panelFavor') runMatch();
    else if (id === 'panelStorage') runStorageSaver();
    else if (id === 'panelTripPlan') { populateTripStopOptions(); renderTripPlan(); }
    else if (id === 'panelInventory') renderFullInventory();
    else if (id === 'panelMods') renderModFinderResults();
    else if (id === 'panelWhatsThisFor') renderWhatsThisForResults(whatsThisForSearch ? whatsThisForSearch.value : '', null);
  }

  /** Look up item by typeId from CDN items. */
  function getCdnItem(typeId) {
    const key = normalizeItemKey(typeId);
    return items[key] || null;
  }

  /** Favor Finder: match loaded items to selected NPC's Love/Like preferences and render results. */
  function runMatch() {
    const npcKey = npcSelect.value;
    if (!npcKey) {
      resultsSection.hidden = false;
      npcFavorEl.innerHTML = '';
      resultsList.innerHTML = '';
      noMatches.hidden = false;
      noMatches.textContent = 'Please select a map and an NPC.';
      return;
    }
    const characterNames = Object.keys(charactersItems);
    const userItems = characterNames.length ? charactersItems[characterNames[0]] : null;
    if (!userItems || !userItems.length) {
      resultsSection.hidden = false;
      npcFavorEl.innerHTML = '';
      resultsList.innerHTML = '';
      noMatches.hidden = false;
      noMatches.textContent = 'No items loaded.';
      return;
    }
    const npc = npcs[npcKey];
    if (!npc || !npc.Preferences) {
      resultsSection.hidden = false;
      npcFavorEl.innerHTML = '';
      resultsList.innerHTML = '';
      noMatches.hidden = false;
      noMatches.textContent = 'No preferences for this NPC.';
      return;
    }
    const loveLike = npc.Preferences.filter((p) => p.Desire === 'Love' || p.Desire === 'Like');
    const matches = [];
    for (const row of userItems) {
      const typeId = row.TypeID;
      const cdnItem = getCdnItem(typeId);
      if (!cdnItem || !Array.isArray(cdnItem.Keywords)) continue;
      const itemKeywordBases = (cdnItem.Keywords || []).map(itemKeywordBase);
      let bestDesire = null;
      let bestPrefName = null;
      for (const pref of loveLike) {
        if (!hasKeywordMatch(cdnItem.Keywords, pref.Keywords)) continue;
        if (pref.Desire === 'Love') {
          bestDesire = 'Love';
          bestPrefName = pref.Name;
          break;
        }
        if (pref.Desire === 'Like' && bestDesire !== 'Love') {
          bestDesire = 'Like';
          bestPrefName = pref.Name;
        }
      }
      if (bestDesire) {
        matches.push({
          name: row.Name || cdnItem.Name || 'Unknown',
          typeId: typeId,
          stackSize: row.StackSize ?? 1,
          value: row.Value ?? cdnItem.Value ?? 0,
          storageVault: row.StorageVault || 'Unknown',
          desire: bestDesire,
          preferenceName: bestPrefName,
          iconId: cdnItem.IconId != null ? cdnItem.IconId : null,
        });
      }
    }
    const characterName = characterNames[0];
    const sheet = charactersSheets[characterName];
    const npcFavorLevel = sheet && sheet.NPCs && sheet.NPCs[npcKey] ? (sheet.NPCs[npcKey].FavorLevel || null) : null;
    renderResults(npc.Name || npcKey, npcFavorLevel, matches);
  }

  /** Display name for a storage vault (from storagevaults.json). */
  function vaultFriendlyName(vaultId) {
    if (!vaultId) return vaultId;
    const v = storageVaults[vaultId];
    return (v && v.NpcFriendlyName) ? v.NpcFriendlyName : vaultId;
  }

  /** City/area label for a vault (e.g. "Serbule") for grouping. */
  function vaultCityHeading(vaultId) {
    if (!vaultId) return null;
    const v = storageVaults[vaultId];
    if (!v) return null;
    const areaKey = v.Grouping || v.Area;
    if (!areaKey || areaKey === '*') return 'Any city';
    const a = areas[areaKey];
    return (a && a.FriendlyName) ? a.FriendlyName : areaKey;
  }

  /** One list item for Favor Finder: icon + clickable name (opens What's this for?) + stack info. */
  function renderItemLi(m) {
    const li = document.createElement('li');
    li.className = 'item-row';
    if (m.iconId != null) {
      const img = document.createElement('img');
      img.src = CDN_ICONS_BASE + '/icon_' + m.iconId + '.png';
      img.alt = '';
      img.className = 'item-icon';
      li.appendChild(img);
    }
    const text = document.createElement('span');
    text.className = 'item-text';
    const nameBtn = document.createElement('button');
    nameBtn.type = 'button';
    nameBtn.className = 'item-lookup-link';
    nameBtn.textContent = m.name;
    nameBtn.addEventListener('click', () => openItemUsedForModal(m.name, m.typeId));
    text.appendChild(nameBtn);
    text.appendChild(document.createTextNode(' × ' + m.stackSize + (m.value ? ' (value ' + m.value + ')' : '') + (m.preferenceName ? ' — ' + m.preferenceName : '')));
    li.appendChild(text);
    return li;
  }

  /** Project Gorgon wiki URL for a display name (spaces → underscores). */
  function npcWikiUrl(displayName) {
    if (!displayName || typeof displayName !== 'string') return null;
    const slug = displayName.trim().replace(/\s+/g, '_');
    return 'https://wiki.projectgorgon.com/wiki/' + encodeURIComponent(slug);
  }

  /** Append "Map: [vault link] — stack" to parent; vault name links to wiki. */
  function appendLocationWithWikiLink(parent, mapName, vaultId, stack) {
    const vaultName = vaultFriendlyName(vaultId);
    parent.appendChild(document.createTextNode(mapName + ': '));
    const url = npcWikiUrl(vaultName);
    if (url && vaultName) {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'npc-wiki-link';
      a.textContent = vaultName;
      parent.appendChild(a);
    } else {
      parent.appendChild(document.createTextNode(vaultName));
    }
    parent.appendChild(document.createTextNode(' — ' + stack));
  }

  /** Append "Current favor with [NPC link]suffix" (NPC links to wiki). */
  function appendFavorLine(parent, npcDisplayName, suffix) {
    parent.appendChild(document.createTextNode('Current favor with '));
    const url = npcWikiUrl(npcDisplayName);
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'npc-wiki-link';
      a.textContent = npcDisplayName;
      parent.appendChild(a);
    } else {
      parent.appendChild(document.createTextNode(npcDisplayName));
    }
    parent.appendChild(document.createTextNode(suffix));
  }

  /** Favor Finder: render favor line and match list grouped by city then vault (Love/Like). */
  function renderResults(npcDisplayName, favorLevel, matches) {
    resultsSection.hidden = false;
    noMatches.hidden = matches.length > 0;
    if (matches.length === 0) {
      noMatches.textContent = 'No items in your inventory match this NPC\'s likes or loves.';
    }
    npcFavorEl.innerHTML = '';
    if (favorLevel) {
      const favorP = document.createElement('p');
      favorP.className = 'favor-level';
      appendFavorLine(favorP, npcDisplayName, ': ' + favorLevel);
      npcFavorEl.appendChild(favorP);
    } else {
      const favorP = document.createElement('p');
      favorP.className = 'favor-level favor-unknown';
      appendFavorLine(favorP, npcDisplayName, ': load character sheet to see');
      npcFavorEl.appendChild(favorP);
    }
    resultsList.innerHTML = '';
    const byVault = {};
    for (const m of matches) {
      const v = m.storageVault;
      if (!byVault[v]) byVault[v] = { Love: [], Like: [] };
      byVault[v][m.desire].push(m);
    }
    const vaultIds = Object.keys(byVault);
    const byCity = {};
    for (const vaultId of vaultIds) {
      const city = vaultCityHeading(vaultId) || 'Other';
      if (!byCity[city]) byCity[city] = [];
      byCity[city].push(vaultId);
    }
    const cityOrder = Object.keys(byCity).sort((a, b) => {
      if (a === 'Any city') return 1;
      if (b === 'Any city') return -1;
      return a.localeCompare(b);
    });
    resultsList.innerHTML = '';
    cityOrder.forEach((cityLabel) => {
      const citySection = document.createElement('div');
      citySection.className = 'city-group';
      const cityHeading = document.createElement('h2');
      cityHeading.className = 'city-heading';
      cityHeading.textContent = cityLabel;
      citySection.appendChild(cityHeading);
      const vaultsInCity = byCity[cityLabel].sort((a, b) => vaultFriendlyName(a).localeCompare(vaultFriendlyName(b)));
      vaultsInCity.forEach((vaultId) => {
        const block = document.createElement('div');
        block.className = 'vault-block';
        const title = document.createElement('h3');
        title.className = 'vault-name';
        const url = npcWikiUrl(vaultFriendlyName(vaultId));
        if (url) {
          const a = document.createElement('a');
          a.href = url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.className = 'npc-wiki-link';
          a.textContent = vaultFriendlyName(vaultId);
          title.appendChild(a);
        } else {
          title.textContent = vaultFriendlyName(vaultId);
        }
        block.appendChild(title);
        const loveList = byVault[vaultId].Love;
        const likeList = byVault[vaultId].Like;
        if (loveList.length) {
          const loveSection = document.createElement('div');
          loveSection.className = 'desire-section love';
          const loveTitle = document.createElement('h4');
          loveTitle.textContent = 'Love';
          loveSection.appendChild(loveTitle);
          const ul = document.createElement('ul');
          loveList.forEach((m) => ul.appendChild(renderItemLi(m)));
          loveSection.appendChild(ul);
          block.appendChild(loveSection);
        }
        if (likeList.length) {
          const likeSection = document.createElement('div');
          likeSection.className = 'desire-section like';
          const likeTitle = document.createElement('h4');
          likeTitle.textContent = 'Like';
          likeSection.appendChild(likeTitle);
          const ul = document.createElement('ul');
          likeList.forEach((m) => ul.appendChild(renderItemLi(m)));
          likeSection.appendChild(ul);
          block.appendChild(likeSection);
        }
        citySection.appendChild(block);
      });
      resultsList.appendChild(citySection);
    });
  }

  /** Bootstrap: load CDN, wire file inputs and tab/panel switching, populate dropdowns. */
  function init() {
    document.getElementById('copyrightYear').textContent = new Date().getFullYear();
    mapSelect.innerHTML = '<option value="">— Loading CDN… —</option>';
    loadCdn()
      .then(() => {
        const versionEl = document.getElementById('cdnVersion');
        if (versionEl) versionEl.textContent = 'Data: v' + cdnVersion;
        populateMapDropdown();
        npcSelect.innerHTML = '<option value="">— Choose a map first —</option>';
        npcSelect.disabled = true;
        cdnError.hidden = true;
        populateModFinderSkillDropdowns();
        buildModFinderSlotFilter();
      })
      .catch((err) => {
        const versionEl = document.getElementById('cdnVersion');
        if (versionEl) versionEl.textContent = 'Data: —';
        mapSelect.innerHTML = '<option value="">— CDN failed —</option>';
        mapSelect.disabled = true;
        cdnError.hidden = false;
        console.error(err);
      });

    mapSelect.addEventListener('change', () => {
      populateNpcDropdown(mapSelect.value);
      runMatch();
    });

    npcSelect.addEventListener('change', runMatch);
    itemsFiles.addEventListener('change', onItemsFilesChange);
    characterFiles.addEventListener('change', onCharacterFilesChange);

    const loadExampleItemsBtn = $('loadExampleItems');
    const loadExampleCharacterBtn = $('loadExampleCharacter');
    function fetchFirstJson(urls) {
      let i = 0;
      function tryNext() {
        if (i >= urls.length) return Promise.reject(new Error('All failed'));
        const url = urls[i++];
        return fetch(url).then((r) => {
          if (!r.ok) throw new Error(r.statusText);
          return r.json();
        }).catch(tryNext);
      }
      return tryNext();
    }
    if (loadExampleItemsBtn) {
      loadExampleItemsBtn.addEventListener('click', () => {
        setStatus('Loading example items…');
        fetchFirstJson(['Kanbe_items_2026-02-17-16-53-40Z.json', 'examples/example-items.json'])
          .then((data) => { applyItemsData(data, 'Kanbe items'); switchTab('panelStorage'); })
          .catch(() => {
            applyItemsData(EXAMPLE_ITEMS, 'example items');
            setStatus('Using built-in sample. Serve the app (e.g. npx serve) so the JSON files in this folder can load.');
            switchTab('panelStorage');
          });
      });
    }
    if (loadExampleCharacterBtn) {
      loadExampleCharacterBtn.addEventListener('click', () => {
        fetchFirstJson(['Character_Kanbe.json', 'examples/example-character.json'])
          .then((data) => { applyCharacterSheetData(data, 'Character_Kanbe'); switchTab('panelFavor'); })
          .catch(() => {
            applyCharacterSheetData(EXAMPLE_CHARACTER, 'example character sheet');
            setStatus('Using built-in sample. Serve the app (e.g. npx serve) so the JSON files can load.');
            switchTab('panelFavor');
          });
      });
    }

    initTabs();
  }

  /** Show one feature panel; run panel-specific logic (e.g. render Full Inventory, run Storage Saver). */
  function switchTab(panelId) {
    document.querySelectorAll('.feature-tabs .tab').forEach((t) => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.feature-panel').forEach((p) => {
      p.classList.add('hidden');
      p.setAttribute('aria-hidden', 'true');
    });
    const tab = document.querySelector('.feature-tabs .tab[data-panel="' + panelId + '"]');
    const panel = $(panelId);
    if (tab) {
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
    }
    if (panel) {
      panel.classList.remove('hidden');
      panel.setAttribute('aria-hidden', 'false');
    }
    if (panelId === 'panelFavor') {
      runMatch();
    }
    /* panelIntro has no panel-specific logic */
    if (panelId === 'panelInventory') {
      renderFullInventory();
    }
    if (panelId === 'panelStorage') {
      runStorageSaver();
    }
    if (panelId === 'panelTripPlan') {
      populateTripStopOptions();
      renderTripPlan();
    }
    if (panelId === 'panelMods') {
      renderModFinderResults();
    }
    if (panelId === 'panelWhatsThisFor') {
      if (whatsThisForResults) renderWhatsThisForResults(whatsThisForSearch ? whatsThisForSearch.value : '', null);
    }
  }

  /** Items array for the first character in charactersItems (shared by Favor, Storage, Full Inventory). */
  function getFirstCharacterItems() {
    const names = Object.keys(charactersItems);
    return names.length ? charactersItems[names[0]] : null;
  }

  /** Equipment slot from item keywords (Head, Chest, … OffHand, etc.); first match in MOD_SLOT_ORDER, else Other. */
  function getEquipmentSlotFromKeywords(keywords) {
    if (!Array.isArray(keywords)) return MOD_SLOT_FILTER_OTHER;
    const bases = keywords.map(itemKeywordBase);
    for (const slot of MOD_SLOT_ORDER) {
      if (bases.includes(slot)) return slot;
    }
    return MOD_SLOT_FILTER_OTHER;
  }

  /** Map item keywords to a single category (priority order). */
  function getCategoryForItem(keywords) {
    if (!Array.isArray(keywords)) return 'Other';
    const bases = (keywords || []).map(itemKeywordBase);
    for (const cat of FULL_INVENTORY_CATEGORY_ORDER) {
      if (cat === 'Skill Book' || cat === 'Recipe' || cat === 'Work Order') continue;
      for (const kw of bases) {
        if (KEYWORD_TO_CATEGORY[kw] === cat) return cat;
      }
    }
    return 'Other';
  }

  /** Category including icon rules: 5792 = Skill Book; 4003 + recipe/work order in name/desc = Recipe or Work Order; name/desc Phlogiston. */
  function getCategoryForItemWithIcon(displayName, iconId, keywords, description) {
    if (iconId === 5792) return 'Skill Book';
    if (iconId === 4003) {
      const name = (displayName || '').toLowerCase();
      const desc = (description || '').toLowerCase();
      const text = name + ' ' + desc;
      if (text.includes('work order')) return 'Work Order';
      if (text.includes('recipe')) return 'Recipe';
    }
    const nameDesc = ((displayName || '') + ' ' + (description || '')).toLowerCase();
    if (nameDesc.includes('phlogiston')) return 'Phlogiston';
    return getCategoryForItem(keywords);
  }

  /** Turn one effect string like "{ATTR_NAME}{0.5}" into "Attribute Label +0.5" using attributes.json. */
  function formatEffectDesc(desc, attrs) {
    if (typeof desc !== 'string' || !desc) return desc;
    const braceGroups = desc.match(/\{[^}]+\}/g);
    if (!braceGroups || braceGroups.length < 2) return desc;
    const attrKey = braceGroups[0].slice(1, -1);
    const valueStr = braceGroups[1].slice(1, -1);
    const attr = attrs && attrs[attrKey];
    const label = (attr && attr.Label) ? attr.Label : attrKey;
    let result;
    const num = parseFloat(valueStr);
    if (!Number.isNaN(num)) {
      const sign = num > 0 ? '+' : '';
      const displayVal = num % 1 === 0 ? String(Math.round(num)) : String(num);
      result = label + ' ' + sign + displayVal;
    } else {
      result = label + ' ' + valueStr;
    }
    if (braceGroups.length >= 3) {
      result += ' (' + braceGroups[2].slice(1, -1) + ')';
    }
    return result;
  }

  /** Format effect array; bullet-separated parts get attribute substitution. */
  function formatEffectDescsForDisplay(effectDescs, attrs) {
    if (!Array.isArray(effectDescs) || !effectDescs.length) return [];
    return effectDescs.map((d) => {
      if (typeof d !== 'string') return String(d);
      if (d.indexOf('{') === -1) return d.trim();
      return d.split(/\s*·\s*/).map((p) => formatEffectDesc(p.trim(), attrs)).join(' · ');
    });
  }

  /** Append text to parent, replacing <icon=123> with img pointing at CDN icon. */
  function appendTextWithIcons(parent, str) {
    if (typeof str !== 'string' || !str) return;
    const re = /<icon=(\d+)>/gi;
    let lastIndex = 0;
    let m;
    while ((m = re.exec(str)) !== null) {
      if (m.index > lastIndex) {
        parent.appendChild(document.createTextNode(str.slice(lastIndex, m.index)));
      }
      const img = document.createElement('img');
      img.src = CDN_ICONS_BASE + '/icon_' + m[1] + '.png';
      img.alt = '';
      img.className = 'effect-inline-icon';
      parent.appendChild(img);
      parent.appendChild(document.createTextNode('\u00A0'));
      lastIndex = re.lastIndex;
    }
    if (lastIndex < str.length) {
      parent.appendChild(document.createTextNode(str.slice(lastIndex)));
    }
  }

  /** Resolve export TSysPowers (Power+Tier) to raw effect strings from tsysclientinfo. */
  function getModEffectDescs(tsysPowers) {
    if (!Array.isArray(tsysPowers) || !tsysPowers.length) return [];
    const out = [];
    for (const { Power, Tier } of tsysPowers) {
      const entry = tsysByInternalName[Power];
      if (!entry || !entry.Tiers) continue;
      const tierKey = 'id_' + Tier;
      const tierData = entry.Tiers[tierKey];
      if (!tierData || !Array.isArray(tierData.EffectDescs)) {
        out.push((Power || 'Unknown') + ' (Tier ' + Tier + ')');
        continue;
      }
      for (const desc of tierData.EffectDescs) {
        if (typeof desc === 'string' && desc.trim()) out.push(desc.trim());
      }
    }
    return out;
  }

  /** Like getModEffectDescs but also returns a parallel array of rarity (one per effect line) for Full Inventory mod column. */
  function getModEffectDescsWithRarities(tsysPowers) {
    if (!Array.isArray(tsysPowers) || !tsysPowers.length) return { descs: [], rarities: [] };
    const descs = [];
    const rarities = [];
    for (const { Power, Tier } of tsysPowers) {
      const entry = tsysByInternalName[Power];
      const rarity = entry ? getModRarity(entry) : null;
      if (!entry || !entry.Tiers) {
        descs.push((Power || 'Unknown') + ' (Tier ' + Tier + ')');
        rarities.push(rarity);
        continue;
      }
      const tierKey = 'id_' + Tier;
      const tierData = entry.Tiers[tierKey];
      if (!tierData || !Array.isArray(tierData.EffectDescs)) {
        descs.push((Power || 'Unknown') + ' (Tier ' + Tier + ')');
        rarities.push(rarity);
        continue;
      }
      for (const desc of tierData.EffectDescs) {
        if (typeof desc === 'string' && desc.trim()) {
          descs.push(desc.trim());
          rarities.push(rarity);
        }
      }
    }
    return { descs, rarities };
  }

  /** Sorted list of combat skills for Mod Finder dropdowns. */
  function getCombatSkillsList() {
    return Object.entries(skills)
      .filter(([, s]) => s && s.Combat === true)
      .map(([key, s]) => ({ key, name: (s.Name || key).trim() || key }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /** Abilities for a skill (deduped by name), for ability dropdowns; excludes Lint_MonsterAbility. */
  function getAbilitiesForSkill(skillKey) {
    if (!skillKey) return [];
    const list = Object.entries(abilities)
      .filter(([, a]) => a && a.Skill === skillKey && !(a.Keywords || []).includes('Lint_MonsterAbility'))
      .map(([key, a]) => ({ key, name: (a.Name || '').trim() || key, iconId: a.IconID }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const byName = new Map();
    for (const item of list) {
      if (!byName.has(item.name)) byName.set(item.name, item);
    }
    return Array.from(byName.values());
  }

  /** Mod entries from tsysclientinfo whose Skill is one of the two selected combat skills. */
  function filterModsBySkills(skill1, skill2) {
    const skillSet = new Set([skill1, skill2].filter(Boolean));
    if (skillSet.size === 0) return [];
    return Object.values(tsysClientInfo).filter(
      (entry) => entry && entry.Skill && skillSet.has(entry.Skill)
    );
  }

  /** Group mod entries by equipment slot (Head, Chest, …); a mod can appear in multiple slots. */
  function groupModsBySlot(modEntries) {
    const bySlot = {};
    for (const entry of modEntries) {
      const slots = entry.Slots || [];
      for (const slot of slots) {
        if (!bySlot[slot]) bySlot[slot] = [];
        bySlot[slot].push(entry);
      }
    }
    return bySlot;
  }

  /** First tier key (e.g. id_1) for a tsys entry for display. */
  function getFirstTierKey(entry) {
    const tiers = entry.Tiers && typeof entry.Tiers === 'object' ? entry.Tiers : {};
    const keys = Object.keys(tiers);
    if (keys.length === 0) return null;
    const numeric = keys.map((k) => parseInt(k.replace('id_', ''), 10)).filter((n) => !Number.isNaN(n));
    if (numeric.length === 0) return keys[0];
    return 'id_' + Math.min(...numeric);
  }

  /** Best MinRarity across all tiers of a tsys entry (for display). Order: Uncommon < Rare < Exceptional < Epic < Legendary. */
  function getModRarity(entry) {
    if (!entry || !entry.Tiers || typeof entry.Tiers !== 'object') return null;
    const order = { Uncommon: 1, Rare: 2, Exceptional: 3, Epic: 4, Legendary: 5 };
    let best = null;
    let bestRank = 0;
    for (const tier of Object.values(entry.Tiers)) {
      const r = tier && tier.MinRarity && typeof tier.MinRarity === 'string' ? tier.MinRarity.trim() : null;
      if (!r) continue;
      const rank = order[r] || 0;
      if (rank > bestRank) {
        bestRank = rank;
        best = r;
      }
    }
    return best;
  }

  let abilityInternalNameToIconId = null;
  /** Map ability InternalName (uppercase) → IconID for mod icons (MOD_ABILITY_* in effect text). */
  function getAbilityInternalNameToIconIdMap() {
    if (abilityInternalNameToIconId) return abilityInternalNameToIconId;
    abilityInternalNameToIconId = {};
    for (const [key, a] of Object.entries(abilities)) {
      if (!a || a.IconID == null) continue;
      const name = (a.InternalName != null ? a.InternalName : key);
      if (typeof name === 'string' && name) {
        abilityInternalNameToIconId[name.toUpperCase()] = a.IconID;
      }
    }
    return abilityInternalNameToIconId;
  }

  /** If mod effect references one ability (MOD_ABILITY_*), return that ability's IconID; else null. */
  function getModAbilityIconId(entry) {
    const tierKey = getFirstTierKey(entry);
    if (!tierKey || !entry.Tiers || !entry.Tiers[tierKey] || !Array.isArray(entry.Tiers[tierKey].EffectDescs)) return null;
    const map = getAbilityInternalNameToIconIdMap();
    for (const s of entry.Tiers[tierKey].EffectDescs) {
      if (typeof s !== 'string') continue;
      const m = s.match(/\{MOD_ABILITY_([^}]+)\}/);
      if (m) {
        const iconId = map[m[1].toUpperCase()];
        return iconId != null ? iconId : null;
      }
    }
    return null;
  }

  /** Selected slot filter checkboxes; null = no filter (show all slots). */
  function getSelectedSlotFilter() {
    if (!modFinderSlotCheckboxes) return null;
    const checked = Array.from(modFinderSlotCheckboxes.querySelectorAll('input[type="checkbox"]:checked'))
      .map((el) => el.value);
    return checked.length === 0 ? null : checked;
  }

  /** Selected rarity filter; empty string = show all rarities. */
  function getSelectedRarityFilter() {
    return (modFinderRarity && modFinderRarity.value) ? modFinderRarity.value.trim() : '';
  }

  /** Build Mod Finder results: sections by slot, each with mod name + effect text; apply slot filter. */
  function renderModFinderResults() {
    if (!modFinderResults || !modFinderEmpty) return;
    modFinderResults.innerHTML = '';
    modFinderResults.hidden = true;
    modFinderEmpty.hidden = true;
    if (modFinderSkill1 && modFinderSkill1.disabled) {
      modFinderEmpty.textContent = 'Loading game data…';
      modFinderEmpty.hidden = false;
      return;
    }
    const skill1 = modFinderSkill1 && modFinderSkill1.value ? modFinderSkill1.value : '';
    const skill2 = modFinderSkill2 && modFinderSkill2.value ? modFinderSkill2.value : '';
    const mods = filterModsBySkills(skill1, skill2);
    if (mods.length === 0) {
      modFinderEmpty.textContent = skill1 || skill2 ? 'No mods found for the selected skill(s).' : 'Select one or two combat skills to see mods.';
      modFinderEmpty.hidden = false;
      return;
    }
    const bySlot = groupModsBySlot(mods);
    const orderedSlots = [...MOD_SLOT_ORDER];
    const otherSlots = Object.keys(bySlot).filter((s) => !orderedSlots.includes(s));
    let slotOrder = [...orderedSlots.filter((s) => bySlot[s]), ...otherSlots];
    const selectedSlots = getSelectedSlotFilter();
    if (selectedSlots) {
      const wantOther = selectedSlots.includes(MOD_SLOT_FILTER_OTHER);
      const wantNamed = new Set(selectedSlots.filter((s) => s !== MOD_SLOT_FILTER_OTHER));
      slotOrder = slotOrder.filter((slot) => {
        if (wantNamed.has(slot)) return true;
        if (wantOther && !MOD_SLOT_ORDER.includes(slot)) return true;
        return false;
      });
    }
    const selectedRarity = getSelectedRarityFilter();
    const grid = document.createElement('div');
    grid.className = 'mod-finder-results-grid';
    for (const slot of slotOrder) {
      let slotEntries = bySlot[slot];
      if (selectedRarity) {
        slotEntries = slotEntries.filter((entry) => getModRarity(entry) === selectedRarity);
      }
      if (slotEntries.length === 0) continue;
      const section = document.createElement('section');
      section.className = 'mod-finder-slot-section';
      const h3 = document.createElement('h3');
      h3.textContent = slot;
      section.appendChild(h3);
      const list = document.createElement('ul');
      list.className = 'mod-finder-mod-list';
      for (const entry of slotEntries) {
        const li = document.createElement('li');
        li.className = 'mod-finder-mod-item';
        const modIconId = getModAbilityIconId(entry);
        if (modIconId != null) {
          const iconImg = document.createElement('img');
          iconImg.src = CDN_ICONS_BASE + '/icon_' + modIconId + '.png';
          iconImg.alt = '';
          iconImg.className = 'mod-finder-mod-icon';
          li.appendChild(iconImg);
        }
        const content = document.createElement('div');
        content.className = 'mod-finder-mod-content';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'mod-finder-mod-name';
        nameSpan.textContent = entry.Suffix || entry.InternalName || 'Unknown';
        content.appendChild(nameSpan);
        const modRarity = getModRarity(entry);
        if (modRarity) {
          const raritySpan = document.createElement('span');
          raritySpan.className = 'mod-finder-rarity-badge rarity-' + modRarity.toLowerCase().replace(/\s+/g, '-');
          raritySpan.textContent = modRarity;
          content.appendChild(raritySpan);
        }
        const tierKey = getFirstTierKey(entry);
        if (tierKey && entry.Tiers[tierKey] && Array.isArray(entry.Tiers[tierKey].EffectDescs)) {
          const rawDescs = formatEffectDescsForDisplay(entry.Tiers[tierKey].EffectDescs, attributes);
          for (const line of rawDescs) {
            const effectLine = document.createElement('div');
            effectLine.className = 'mod-finder-mod-effect';
            appendTextWithIcons(effectLine, line);
            content.appendChild(effectLine);
          }
        }
        li.appendChild(content);
        list.appendChild(li);
      }
      section.appendChild(list);
      grid.appendChild(section);
    }
    modFinderResults.appendChild(grid);
    if (grid.children.length === 0) {
      modFinderEmpty.textContent = selectedRarity ? 'No mods of that rarity for the selected skill(s).' : 'No mods found for the selected skill(s).';
      modFinderEmpty.hidden = false;
      modFinderResults.hidden = true;
    } else {
      modFinderResults.hidden = false;
    }
  }

  /** Fill the two combat-skill dropdowns in Mod Finder. */
  function populateModFinderSkillDropdowns() {
    const list = getCombatSkillsList();
    const opts = (sel) => {
      sel.innerHTML = '';
      const empty = document.createElement('option');
      empty.value = '';
      empty.textContent = '— Select skill —';
      sel.appendChild(empty);
      list.forEach(({ key, name }) => {
        const o = document.createElement('option');
        o.value = key;
        o.textContent = name;
        sel.appendChild(o);
      });
      sel.disabled = false;
    };
    if (modFinderSkill1) opts(modFinderSkill1);
    if (modFinderSkill2) opts(modFinderSkill2);
  }

  /** Build slot filter checkboxes (Head, Chest, … + Other) in Mod Finder. */
  function buildModFinderSlotFilter() {
    if (!modFinderSlotCheckboxes) return;
    modFinderSlotCheckboxes.innerHTML = '';
    for (const slot of MOD_SLOT_ORDER) {
      const label = document.createElement('label');
      label.className = 'mod-finder-slot-checkbox-label';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = slot;
      cb.name = 'modFinderSlot';
      cb.setAttribute('aria-label', 'Slot: ' + slot);
      label.appendChild(cb);
      label.appendChild(document.createTextNode(' ' + slot));
      modFinderSlotCheckboxes.appendChild(label);
    }
    const otherLabel = document.createElement('label');
    otherLabel.className = 'mod-finder-slot-checkbox-label';
    const otherCb = document.createElement('input');
    otherCb.type = 'checkbox';
    otherCb.value = MOD_SLOT_FILTER_OTHER;
    otherCb.name = 'modFinderSlot';
    otherCb.setAttribute('aria-label', 'Other slots');
    otherLabel.appendChild(otherCb);
    otherLabel.appendChild(document.createTextNode(' Other'));
    modFinderSlotCheckboxes.appendChild(otherLabel);
  }

  /** Build equipment slot filter checkboxes (Head, Chest, … + Other) in Full Inventory. */
  function buildFullInventorySlotFilter() {
    if (!fullInventorySlotCheckboxes) return;
    fullInventorySlotCheckboxes.innerHTML = '';
    for (const slot of MOD_SLOT_ORDER) {
      const label = document.createElement('label');
      label.className = 'full-inventory-slot-checkbox-label';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = slot;
      cb.name = 'fullInventorySlot';
      cb.setAttribute('aria-label', 'Slot: ' + slot);
      label.appendChild(cb);
      label.appendChild(document.createTextNode(' ' + slot));
      fullInventorySlotCheckboxes.appendChild(label);
    }
    const otherLabel = document.createElement('label');
    otherLabel.className = 'full-inventory-slot-checkbox-label';
    const otherCb = document.createElement('input');
    otherCb.type = 'checkbox';
    otherCb.value = MOD_SLOT_FILTER_OTHER;
    otherCb.name = 'fullInventorySlot';
    otherCb.setAttribute('aria-label', 'Other slots');
    otherLabel.appendChild(otherCb);
    otherLabel.appendChild(document.createTextNode(' Other'));
    fullInventorySlotCheckboxes.appendChild(otherLabel);
  }

  /** Selected equipment slot checkboxes in Full Inventory; null = show all slots. */
  function getSelectedFullInventorySlotFilter() {
    if (!fullInventorySlotCheckboxes) return null;
    const checked = Array.from(fullInventorySlotCheckboxes.querySelectorAll('input[type="checkbox"]:checked'))
      .map((cb) => cb.value);
    return checked.length > 0 ? checked : null;
  }

  /** Build { skillKey: maxLevel } from item's TSysPowers (mods). Equipment equip requirements come from mod tiers' Skill + SkillLevelPrereq. */
  function getSkillReqsFromTsysPowers(tsysPowers) {
    if (!Array.isArray(tsysPowers) || !tsysPowers.length) return {};
    const bySkill = {};
    for (const { Power, Tier } of tsysPowers) {
      const entry = tsysByInternalName[Power];
      if (!entry || !entry.Skill || !entry.Tiers) continue;
      const tierKey = 'id_' + Tier;
      const tierData = entry.Tiers[tierKey];
      const level = tierData && tierData.SkillLevelPrereq != null ? Number(tierData.SkillLevelPrereq) : null;
      if (level == null || level < 0) continue;
      const skillKey = entry.Skill;
      if (bySkill[skillKey] == null || level > bySkill[skillKey]) bySkill[skillKey] = level;
    }
    return bySkill;
  }

  /** Format skill map (e.g. { Rabbit: 80, IceMagic: 80 }) as "Requires Rabbit 80 & Ice Magic 80". */
  function formatSkillReqs(skillReqs) {
    if (!skillReqs || typeof skillReqs !== 'object') return null;
    const parts = Object.entries(skillReqs)
      .filter(([, level]) => level != null && Number(level) >= 0)
      .map(([skillKey, level]) => {
        const name = (skills[skillKey] && skills[skillKey].Name) ? skills[skillKey].Name.trim() : skillKey;
        return name + ' ' + Number(level);
      });
    if (parts.length === 0) return null;
    return 'Requires ' + parts.join(' & ');
  }

  /** Merge two skill-req maps (take max level per skill). */
  function mergeSkillReqs(a, b) {
    const out = {};
    for (const [k, v] of Object.entries(a || {})) {
      if (v != null && Number(v) >= 0) out[k] = Number(v);
    }
    for (const [k, v] of Object.entries(b || {})) {
      if (v == null || Number(v) < 0) continue;
      const num = Number(v);
      if (out[k] == null || num > out[k]) out[k] = num;
    }
    return out;
  }

  /** Sorted list of map names (from storage vaults' city headings) for Full Inventory filter. */
  function getFullInventoryMapOptions() {
    const set = new Set();
    for (const vaultId of Object.keys(storageVaults || {})) {
      const name = vaultCityHeading(vaultId);
      if (name && name !== 'Any city') set.add(name);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  /** Sorted list of { id, name } for storage vaults (Full Inventory filter). If mapFilter is set, only vaults in that map. */
  function getFullInventoryVaultOptions(mapFilter) {
    let entries = Object.entries(storageVaults || {});
    if (mapFilter && mapFilter.trim()) {
      entries = entries.filter(([id]) => vaultCityHeading(id) === mapFilter);
    }
    return entries
      .map(([id, v]) => ({ id, name: (v && v.NpcFriendlyName) ? v.NpcFriendlyName : id }))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  /** Aggregate items by typeId+name (keep mod variance); assign category; return { category: [rows] }. */
  function buildFullInventory() {
    const userItems = getFirstCharacterItems();
    if (!userItems || !userItems.length) return null;
    const byKey = {};
    for (const row of userItems) {
      const typeId = row.TypeID;
      const name = (row.Name && row.Name.trim()) ? row.Name.trim() : null;
      const key = typeId + '\n' + (name || '');
      if (!byKey[key]) {
        byKey[key] = {
          typeId,
          name,
          vaults: [],
          rarity: null
        };
      }
      byKey[key].vaults.push({
        vault: row.StorageVault || 'Unknown',
        stack: row.StackSize ?? 1,
      });
      if (row.Rarity && typeof row.Rarity === 'string' && byKey[key].rarity == null) {
        byKey[key].rarity = row.Rarity.trim();
      }
      if (row.TSysPowers && Array.isArray(row.TSysPowers) && row.TSysPowers.length > 0 && !byKey[key].tsysPowers) {
        byKey[key].tsysPowers = row.TSysPowers;
      }
    }
    const cdnItems = {};
    const byCategory = {};
    for (const key of Object.keys(byKey)) {
      const data = byKey[key];
      const cdnItem = getCdnItem(data.typeId);
      if (!cdnItems[key]) cdnItems[key] = cdnItem;
      const displayName = data.name || (cdnItem && cdnItem.Name) || 'Unknown';
      const keywords = (cdnItem && cdnItem.Keywords) || [];
      const iconId = (cdnItem && cdnItem.IconId != null) ? cdnItem.IconId : null;
      const description = (cdnItem && cdnItem.Description && typeof cdnItem.Description === 'string' && cdnItem.Description.trim())
        ? cdnItem.Description.trim()
        : null;
      const category = getCategoryForItemWithIcon(displayName, iconId, keywords, description);
      const cdnReqs = (cdnItem && cdnItem.SkillReqs) || {};
      const tsysReqs = getSkillReqsFromTsysPowers(data.tsysPowers);
      const mergedReqs = mergeSkillReqs(cdnReqs, tsysReqs);
      const skillReqsText = formatSkillReqs(mergedReqs);
      const rawEffectDescs = (cdnItem && cdnItem.EffectDescs && Array.isArray(cdnItem.EffectDescs))
        ? cdnItem.EffectDescs
        : [];
      const effectDescs = formatEffectDescsForDisplay(rawEffectDescs, attributes);
      const { descs: rawModDescs, rarities: modRarities } = getModEffectDescsWithRarities(data.tsysPowers);
      const modDescs = formatEffectDescsForDisplay(rawModDescs, attributes);
      let total = 0;
      const locationParts = [];
      for (const v of data.vaults) {
        total += v.stack;
        const mapName = vaultCityHeading(v.vault) || 'Other';
        locationParts.push({ mapName, vaultId: v.vault, stack: v.stack });
      }
      const skillReqKeys = mergedReqs && typeof mergedReqs === 'object' ? Object.keys(mergedReqs) : [];
      const equipmentSlot = category === 'Equipment' ? getEquipmentSlotFromKeywords(keywords) : null;
      if (!byCategory[category]) byCategory[category] = [];
      byCategory[category].push({
        displayName,
        typeId: data.typeId,
        iconId,
        total,
        locations: locationParts,
        effectDescs,
        modDescs,
        modRarities: modRarities || [],
        description,
        rarity: data.rarity || null,
        skillReqsText: skillReqsText || null,
        skillReqKeys,
        equipmentSlot,
      });
    }
    for (const cat of Object.keys(byCategory)) {
      byCategory[cat].sort((a, b) => a.displayName.localeCompare(b.displayName));
    }
    return byCategory;
  }

  /** Render Full Inventory: category sections, tables (Equipment gets Mods column), search + category filter. */
  function renderFullInventory() {
    if (!fullInventoryResults) return;
    fullInventoryResults.innerHTML = '';
    if (fullInventoryEmpty) fullInventoryEmpty.hidden = true;
    const byCategory = buildFullInventory();
    if (!byCategory) {
      if (fullInventoryEmpty) {
        fullInventoryEmpty.hidden = false;
        fullInventoryEmpty.textContent = 'Load an items export above first.';
      }
      if (fullInventoryCategory) {
        fullInventoryCategory.innerHTML = '<option value="">All categories</option>';
        fullInventoryCategory.disabled = true;
      }
      if (fullInventoryMap) { fullInventoryMap.innerHTML = '<option value="">All maps</option>'; fullInventoryMap.disabled = true; }
      if (fullInventoryVault) { fullInventoryVault.innerHTML = '<option value="">All vaults</option>'; fullInventoryVault.disabled = true; }
      if (fullInventorySkillReq1) { fullInventorySkillReq1.innerHTML = '<option value="">Any</option>'; fullInventorySkillReq1.disabled = true; }
      if (fullInventorySkillReq2) { fullInventorySkillReq2.innerHTML = '<option value="">Any</option>'; fullInventorySkillReq2.disabled = true; }
      if (fullInventorySlotCheckboxes) { fullInventorySlotCheckboxes.innerHTML = ''; }
      if (fullInventorySearch) fullInventorySearch.disabled = true;
      return;
    }
    if (fullInventorySlotCheckboxes && fullInventorySlotCheckboxes.children.length === 0) {
      buildFullInventorySlotFilter();
    }
    const selectedSlotFilter = getSelectedFullInventorySlotFilter();
    const selectedCategory = fullInventoryCategory ? fullInventoryCategory.value : '';
    const selectedMap = fullInventoryMap && fullInventoryMap.value ? fullInventoryMap.value.trim() : '';
    const selectedVault = fullInventoryVault && fullInventoryVault.value ? fullInventoryVault.value.trim() : '';
    const selectedSkillReq1 = fullInventorySkillReq1 && fullInventorySkillReq1.value ? fullInventorySkillReq1.value.trim() : '';
    const selectedSkillReq2 = fullInventorySkillReq2 && fullInventorySkillReq2.value ? fullInventorySkillReq2.value.trim() : '';
    if (fullInventoryCategory) fullInventoryCategory.disabled = false;
    if (fullInventorySearch) fullInventorySearch.disabled = false;
    if (fullInventoryMap) {
      fullInventoryMap.disabled = false;
      const mapOpts = getFullInventoryMapOptions();
      if (fullInventoryMap.options.length !== mapOpts.length + 1) {
        fullInventoryMap.innerHTML = '<option value="">All maps</option>';
        mapOpts.forEach((m) => {
          const o = document.createElement('option');
          o.value = m;
          o.textContent = m;
          fullInventoryMap.appendChild(o);
        });
      }
    }
    if (fullInventoryVault) {
      fullInventoryVault.disabled = false;
      const vaultOpts = getFullInventoryVaultOptions(selectedMap);
      const currentVaultValue = fullInventoryVault.value;
      fullInventoryVault.innerHTML = '<option value="">All vaults</option>';
      vaultOpts.forEach(({ id, name }) => {
        const o = document.createElement('option');
        o.value = id;
        o.textContent = name;
        fullInventoryVault.appendChild(o);
      });
      if (currentVaultValue && vaultOpts.some((v) => v.id === currentVaultValue)) {
        fullInventoryVault.value = currentVaultValue;
      } else if (currentVaultValue && !vaultOpts.some((v) => v.id === currentVaultValue)) {
        fullInventoryVault.value = '';
      }
    }
    if (fullInventoryCategory) {
      const opts = fullInventoryCategory.querySelectorAll('option');
      const hasOptions = opts.length > 1;
      const categoriesWithItems = FULL_INVENTORY_CATEGORY_ORDER.filter((c) => byCategory[c] && byCategory[c].length > 0);
      const categoriesForDropdown = FULL_INVENTORY_CATEGORY_ORDER.filter((c) =>
        byCategory[c] && byCategory[c].length > 0
      );
      if (!hasOptions || fullInventoryCategory.options.length !== categoriesForDropdown.length + 1) {
        fullInventoryCategory.innerHTML = '<option value="">All categories</option>';
        categoriesForDropdown.forEach((c) => {
          const opt = document.createElement('option');
          opt.value = c;
          opt.textContent = c;
          fullInventoryCategory.appendChild(opt);
        });
      }
    }
    let skillReqOptions = Object.entries(skills || {})
      .filter(([, s]) => s && s.Combat === true)
      .map(([key]) => key);
    if (skillReqOptions.length === 0) {
      const fromInventory = new Set();
      for (const cat of Object.keys(byCategory)) {
        const rows = byCategory[cat];
        if (rows) rows.forEach((row) => (row.skillReqKeys || []).forEach((k) => fromInventory.add(k)));
      }
      skillReqOptions = Array.from(fromInventory);
    }
    skillReqOptions.sort((a, b) => {
      const nameA = (skills[a] && skills[a].Name) ? skills[a].Name.trim() : a;
      const nameB = (skills[b] && skills[b].Name) ? skills[b].Name.trim() : b;
      return (nameA || '').localeCompare(nameB || '');
    });
    const populateSkillReqDropdown = (sel, currentVal) => {
      if (!sel) return;
      sel.disabled = false;
      sel.innerHTML = '<option value="">Any</option>';
      skillReqOptions.forEach((key) => {
        const o = document.createElement('option');
        o.value = key;
        o.textContent = (skills[key] && skills[key].Name) ? skills[key].Name.trim() : key;
        sel.appendChild(o);
      });
      if (currentVal && Object.prototype.hasOwnProperty.call(skills || {}, currentVal)) sel.value = currentVal;
    };
    populateSkillReqDropdown(fullInventorySkillReq1, selectedSkillReq1);
    populateSkillReqDropdown(fullInventorySkillReq2, selectedSkillReq2);
    const searchTerm = (fullInventorySearch && fullInventorySearch.value ? fullInventorySearch.value : '')
      .trim().toLowerCase();
    const matchesSearch = (row) => {
      if (!searchTerm) return true;
      const text = [
        row.displayName || '',
        row.description || '',
        row.skillReqsText || '',
        (row.effectDescs || []).join(' '),
        (row.modDescs || []).join(' '),
        (row.modRarities || []).join(' '),
      ].join(' ').toLowerCase();
      return text.includes(searchTerm);
    };
    const categoriesToShow = selectedSlotFilter
      ? (byCategory['Equipment'] ? ['Equipment'] : [])
      : selectedCategory
        ? (byCategory[selectedCategory] ? [selectedCategory] : [])
        : FULL_INVENTORY_CATEGORY_ORDER;
    const matchesLocation = (row) => {
      if (selectedMap && !row.locations.some((l) => l.mapName === selectedMap)) return false;
      if (selectedVault && !row.locations.some((l) => l.vaultId === selectedVault)) return false;
      return true;
    };
    const matchesSkillReqs = (row) => {
      const keys = row.skillReqKeys || [];
      if (selectedSkillReq1 && !keys.includes(selectedSkillReq1)) return false;
      if (selectedSkillReq2 && !keys.includes(selectedSkillReq2)) return false;
      return true;
    };
    const matchesEquipmentSlot = (row, category) => {
      if (category !== 'Equipment' || !selectedSlotFilter) return true;
      const slot = row.equipmentSlot != null ? row.equipmentSlot : MOD_SLOT_FILTER_OTHER;
      return selectedSlotFilter.includes(slot);
    };
    for (const cat of categoriesToShow) {
      let rows = byCategory[cat];
      if (rows) rows = rows.filter(matchesLocation);
      if (rows) rows = rows.filter(matchesSkillReqs);
      if (rows) rows = rows.filter((row) => matchesEquipmentSlot(row, cat));
      if (searchTerm && rows) rows = rows.filter(matchesSearch);
      const section = document.createElement('div');
      section.className = 'full-inventory-section';
      const heading = document.createElement('h3');
      heading.className = 'full-inventory-category-heading';
      heading.textContent = cat;
      section.appendChild(heading);
      if (!rows || !rows.length) {
        continue;
      } else {
      const isEquipment = cat === 'Equipment';
      const tableWrap = document.createElement('div');
      tableWrap.className = 'full-inventory-table-wrap';
      const table = document.createElement('table');
      table.className = 'full-inventory-table';
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      const headers = isEquipment ? ['Icon', 'Name', 'Mods', 'Qty', 'Location(s)'] : ['Icon', 'Name', 'Qty', 'Location(s)'];
      headers.forEach((label) => {
        const th = document.createElement('th');
        th.textContent = label;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);
      const tbody = document.createElement('tbody');
      for (const row of rows) {
        const tr = document.createElement('tr');
        const tdIcon = document.createElement('td');
        tdIcon.setAttribute('data-label', 'Icon');
        const iconCellWrap = document.createElement('div');
        iconCellWrap.className = 'full-inventory-icon-cell';
        if (row.rarity) {
          const raritySpan = document.createElement('span');
          raritySpan.className = 'full-inventory-rarity-badge rarity-' + row.rarity.toLowerCase().replace(/\s+/g, '-');
          raritySpan.textContent = row.rarity;
          iconCellWrap.appendChild(raritySpan);
        }
        if (row.iconId != null) {
          const img = document.createElement('img');
          img.src = CDN_ICONS_BASE + '/icon_' + row.iconId + '.png';
          img.alt = '';
          img.className = 'item-icon';
          iconCellWrap.appendChild(img);
        } else {
          iconCellWrap.appendChild(document.createTextNode('—'));
        }
        if (isEquipment && row.skillReqsText) {
          const reqEl = document.createElement('div');
          reqEl.className = 'full-inventory-skill-reqs';
          reqEl.textContent = row.skillReqsText;
          iconCellWrap.appendChild(reqEl);
        }
        tdIcon.appendChild(iconCellWrap);
        tr.appendChild(tdIcon);
        const tdName = document.createElement('td');
        tdName.setAttribute('data-label', 'Name');
        const nameBlock = document.createElement('div');
        nameBlock.className = 'full-inventory-name-cell';
        const nameLine = document.createElement('div');
        nameLine.className = 'full-inventory-item-name';
        const nameBtn = document.createElement('button');
        nameBtn.type = 'button';
        nameBtn.className = 'item-lookup-link';
        nameBtn.textContent = row.displayName;
        nameBtn.addEventListener('click', () => openItemUsedForModal(row.displayName, row.typeId));
        nameLine.appendChild(nameBtn);
        nameBlock.appendChild(nameLine);
        if (row.description) {
          const descEl = document.createElement('div');
          descEl.className = 'full-inventory-description';
          descEl.textContent = row.description;
          nameBlock.appendChild(descEl);
        }
        if (row.effectDescs && row.effectDescs.length > 0) {
          const effectWrap = document.createElement('div');
          effectWrap.className = 'full-inventory-effect-list';
          row.effectDescs.forEach((effectText) => {
            const effectLine = document.createElement('div');
            effectLine.className = 'full-inventory-effect-descs';
            appendTextWithIcons(effectLine, effectText);
            effectWrap.appendChild(effectLine);
          });
          nameBlock.appendChild(effectWrap);
        }
        tdName.appendChild(nameBlock);
        tr.appendChild(tdName);
        if (isEquipment) {
          const tdMods = document.createElement('td');
          tdMods.setAttribute('data-label', 'Mods');
          if (row.modDescs && row.modDescs.length > 0) {
            const modWrap = document.createElement('div');
            modWrap.className = 'full-inventory-mod-list';
            const rarities = row.modRarities || [];
            row.modDescs.forEach((modText, i) => {
              const modLine = document.createElement('div');
              modLine.className = 'full-inventory-mod-descs';
              const modLineContent = document.createElement('span');
              modLineContent.className = 'full-inventory-mod-line-content';
              if (rarities[i]) {
                const raritySpan = document.createElement('span');
                raritySpan.className = 'full-inventory-mod-rarity-badge rarity-' + rarities[i].toLowerCase().replace(/\s+/g, '-');
                raritySpan.textContent = rarities[i];
                modLine.appendChild(raritySpan);
                modLine.appendChild(document.createTextNode(' '));
              }
              appendTextWithIcons(modLineContent, modText);
              modLine.appendChild(modLineContent);
              modWrap.appendChild(modLine);
            });
            tdMods.appendChild(modWrap);
          } else {
            tdMods.textContent = '—';
          }
          tr.appendChild(tdMods);
        }
        const tdQty = document.createElement('td');
        tdQty.setAttribute('data-label', 'Qty');
        tdQty.textContent = String(row.total);
        tr.appendChild(tdQty);
        const tdLoc = document.createElement('td');
        tdLoc.setAttribute('data-label', 'Location(s)');
        const locWrap = document.createElement('div');
        locWrap.className = 'full-inventory-locations';
        row.locations.forEach((loc) => {
          const locLine = document.createElement('div');
          locLine.className = 'full-inventory-location-line';
          appendLocationWithWikiLink(locLine, loc.mapName, loc.vaultId, loc.stack);
          locWrap.appendChild(locLine);
        });
        tdLoc.appendChild(locWrap);
        tr.appendChild(tdLoc);
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
      tableWrap.appendChild(table);
      section.appendChild(tableWrap);
      }
      fullInventoryResults.appendChild(section);
    }
  }

  /** Storage Saver: compute duplicate item types across vaults (slots saveable). Returns null if no items; else { duplicates, totalSlots }. */
  function getStorageSaverDuplicates() {
    const userItems = getFirstCharacterItems();
    if (!userItems || !userItems.length) return null;
    const byTypeId = {};
    for (const row of userItems) {
      const id = row.TypeID;
      if (!byTypeId[id]) byTypeId[id] = { name: row.Name || 'Unknown', vaults: [] };
      byTypeId[id].vaults.push({
        vault: row.StorageVault || 'Unknown',
        stack: row.StackSize ?? 1,
      });
    }
    const duplicates = [];
    for (const [typeId, data] of Object.entries(byTypeId)) {
      if (data.vaults.length < 2) continue;
      const cdnItem = getCdnItem(Number(typeId));
      const name = (cdnItem && cdnItem.Name) ? cdnItem.Name : data.name;
      const maxStack = (cdnItem && cdnItem.MaxStackSize != null) ? cdnItem.MaxStackSize : 100;
      let total = 0;
      const slotsUsed = data.vaults.length;
      for (const v of data.vaults) total += v.stack;
      const slotsNeeded = Math.ceil(total / maxStack);
      const slotsSaveable = Math.max(0, slotsUsed - slotsNeeded);
      if (slotsSaveable === 0) continue;
      const iconId = (cdnItem && cdnItem.IconId != null) ? cdnItem.IconId : null;
      duplicates.push({
        typeId,
        name,
        iconId,
        vaults: data.vaults,
        total,
        maxStack,
        slotsSaveable,
      });
    }
    duplicates.sort((a, b) => b.slotsSaveable - a.slotsSaveable || a.name.localeCompare(b.name));
    const totalSlots = duplicates.reduce((sum, d) => sum + d.slotsSaveable, 0);
    return { duplicates, totalSlots };
  }

  /** Storage Saver: find items in 2+ vaults, compute slots saveable, render list with icons and Map: Vault — n. */
  function runStorageSaver() {
    storageSaverResults.hidden = true;
    storageSaverResults.innerHTML = '';
    const userItems = getFirstCharacterItems();
    if (!userItems || !userItems.length) {
      storageSaverStatus.textContent = 'Load an items export above first.';
      renderTripPlan();
      return;
    }
    storageSaverStatus.textContent = 'Finding duplicate stacks…';
    const result = getStorageSaverDuplicates();
    storageSaverStatus.textContent = '';
    if (!result || result.duplicates.length === 0) {
      storageSaverResults.hidden = false;
      const p = document.createElement('p');
      p.className = 'no-duplicates';
      p.textContent = 'No consolidatable duplicate stacks found. Items that could save slots when merged are not split across multiple vaults.';
      storageSaverResults.appendChild(p);
      return;
    }
    const { duplicates, totalSlots } = result;
    storageSaverResults.hidden = false;
    const totalDiv = document.createElement('div');
    totalDiv.className = 'storage-saver-total';
    totalDiv.textContent = 'You could save ' + totalSlots + ' slot(s) total by consolidating the items below.';
    storageSaverResults.appendChild(totalDiv);
    for (const d of duplicates) {
      const block = document.createElement('div');
      block.className = 'storage-saver-item';
      const header = document.createElement('div');
      header.className = 'storage-saver-item-header';
      if (d.iconId != null) {
        const img = document.createElement('img');
        img.src = CDN_ICONS_BASE + '/icon_' + d.iconId + '.png';
        img.alt = '';
        img.className = 'item-icon';
        header.appendChild(img);
      }
      const h3 = document.createElement('h3');
      const nameBtn = document.createElement('button');
      nameBtn.type = 'button';
      nameBtn.className = 'item-lookup-link storage-saver-item-name';
      nameBtn.textContent = d.name;
      nameBtn.addEventListener('click', () => openItemUsedForModal(d.name, d.typeId));
      h3.appendChild(nameBtn);
      header.appendChild(h3);
      block.appendChild(header);
      const saveP = document.createElement('p');
      saveP.className = 'save-count';
      saveP.textContent = 'You could save ' + d.slotsSaveable + ' slot(s) by consolidating.';
      block.appendChild(saveP);
      const ul = document.createElement('ul');
      for (const v of d.vaults) {
        const li = document.createElement('li');
        const mapName = vaultCityHeading(v.vault) || 'Other';
        appendLocationWithWikiLink(li, mapName, v.vault, v.stack);
        ul.appendChild(li);
      }
      block.appendChild(ul);
      storageSaverResults.appendChild(block);
    }
  }

  /** Fill all trip stop dropdowns with map options (only if not yet populated). */
  function populateTripStopOptions() {
    const mapOpts = getFullInventoryMapOptions();
    if (!mapOpts.length || !tripPlannerStops) return;
    const selects = tripPlannerStops.querySelectorAll('select');
    for (const sel of selects) {
      if (sel.options.length > 1) continue;
      sel.innerHTML = '<option value="">— Select map —</option>';
      for (const mapName of mapOpts) {
        const o = document.createElement('option');
        o.value = mapName;
        o.textContent = mapName;
        sel.appendChild(o);
      }
    }
  }

  /** Build and render the trip plan: per stop, what to pick up (for later drops) and what to drop here (requires at least 2 stops). */
  function renderTripPlan() {
    if (!tripPlannerOutput) return;
    const result = getStorageSaverDuplicates();
    const stops = [];
    if (tripPlannerStops) {
      tripPlannerStops.querySelectorAll('select').forEach((sel) => {
        const v = (sel.value || '').trim();
        if (v) stops.push(v);
      });
    }
    tripPlannerOutput.innerHTML = '';
    tripPlannerOutput.hidden = true;
    if (!result || result.duplicates.length === 0) {
      tripPlannerOutput.hidden = false;
      const p = document.createElement('p');
      p.className = 'trip-planner-empty';
      p.textContent = 'Load an items export in Your data, then use Storage Saver to see duplicates. Come back here to plan your route.';
      tripPlannerOutput.appendChild(p);
      return;
    }
    if (stops.length < 2) {
      tripPlannerOutput.hidden = false;
      const p = document.createElement('p');
      p.className = 'trip-planner-empty';
      p.textContent = 'Pick at least two stops to see what to take from one place and put in another.';
      tripPlannerOutput.appendChild(p);
      return;
    }
    const duplicates = result.duplicates;
    const itemMaps = (d) => {
      const set = new Set();
      for (const v of d.vaults) set.add(vaultCityHeading(v.vault) || 'Other');
      return set;
    };
    const relevantItems = duplicates.filter((d) => {
      const maps = itemMaps(d);
      let count = 0;
      for (const mapName of stops) {
        if (maps.has(mapName)) count++;
        if (count >= 2) return true;
      }
      return false;
    });
    if (relevantItems.length === 0) {
      tripPlannerOutput.hidden = false;
      const p = document.createElement('p');
      p.className = 'trip-planner-empty';
      p.textContent = 'None of your duplicate items are split across the selected stops. Try a different route.';
      tripPlannerOutput.appendChild(p);
      return;
    }
    tripPlannerOutput.hidden = false;
    const laterStopsForItem = (d, fromIndex) => {
      const maps = itemMaps(d);
      const list = [];
      for (let j = fromIndex + 1; j < stops.length; j++) {
        if (maps.has(stops[j])) list.push(stops[j]);
      }
      return list;
    };
    for (let i = 0; i < stops.length; i++) {
      const mapName = stops[i];
      const isFirst = i === 0;
      const isLast = i === stops.length - 1;
      const pickUpItems = relevantItems.filter((d) => {
        const maps = itemMaps(d);
        if (!maps.has(mapName)) return false;
        for (let j = i + 1; j < stops.length; j++) {
          if (maps.has(stops[j])) return true;
        }
        return false;
      });
      const dropItems = relevantItems.filter((d) => itemMaps(d).has(mapName));
      const hasPickUp = !isLast && pickUpItems.length > 0;
      const hasDrop = !isFirst && dropItems.length > 0;
      if (!hasPickUp && !hasDrop) continue;
      const legDiv = document.createElement('div');
      legDiv.className = 'trip-planner-leg';
      const h4 = document.createElement('h4');
      h4.textContent = 'At ' + mapName + ':';
      legDiv.appendChild(h4);
      if (hasPickUp) {
        const pickP = document.createElement('p');
        pickP.className = 'trip-planner-subhead';
        pickP.textContent = 'Pick up (to drop at later stops):';
        legDiv.appendChild(pickP);
        const ul = document.createElement('ul');
        ul.className = 'trip-planner-list';
        for (const d of pickUpItems) {
          const vaultsHere = d.vaults.filter((v) => (vaultCityHeading(v.vault) || 'Other') === mapName);
          const parts = vaultsHere.map((v) => vaultFriendlyName(v.vault) + ' — ' + v.stack);
          const later = laterStopsForItem(d, i);
          const li = document.createElement('li');
          li.className = 'trip-planner-item';
          if (d.iconId != null) {
            const img = document.createElement('img');
            img.src = CDN_ICONS_BASE + '/icon_' + d.iconId + '.png';
            img.alt = '';
            img.className = 'item-icon';
            li.appendChild(img);
          }
          const span = document.createElement('span');
          const nameBtn = document.createElement('button');
          nameBtn.type = 'button';
          nameBtn.className = 'item-lookup-link';
          nameBtn.textContent = d.name;
          nameBtn.addEventListener('click', () => openItemUsedForModal(d.name, d.typeId));
          span.appendChild(nameBtn);
          span.appendChild(document.createTextNode(' from ' + parts.join(', ') + ' → drop at ' + later.join(', ') + '.'));
          li.appendChild(span);
          ul.appendChild(li);
        }
        legDiv.appendChild(ul);
      }
      if (hasDrop) {
        const dropP = document.createElement('p');
        dropP.className = 'trip-planner-subhead';
        dropP.textContent = isLast ? 'Drop here (final stop—consolidate):' : 'Drop here (consolidate):';
        legDiv.appendChild(dropP);
        const ul = document.createElement('ul');
        ul.className = 'trip-planner-list';
        for (const d of dropItems) {
          const vaultsHere = d.vaults.filter((v) => (vaultCityHeading(v.vault) || 'Other') === mapName);
          const slotsAtStop = Math.max(0, vaultsHere.length - 1);
          const li = document.createElement('li');
          li.className = 'trip-planner-item';
          if (d.iconId != null) {
            const img = document.createElement('img');
            img.src = CDN_ICONS_BASE + '/icon_' + d.iconId + '.png';
            img.alt = '';
            img.className = 'item-icon';
            li.appendChild(img);
          }
          const span = document.createElement('span');
          const nameBtn = document.createElement('button');
          nameBtn.type = 'button';
          nameBtn.className = 'item-lookup-link';
          nameBtn.textContent = d.name;
          nameBtn.addEventListener('click', () => openItemUsedForModal(d.name, d.typeId));
          span.appendChild(nameBtn);
          span.appendChild(document.createTextNode(' — put in one vault here' + (slotsAtStop > 0 ? ' to save ' + slotsAtStop + ' slot(s).' : '.')));
          li.appendChild(span);
          ul.appendChild(li);
        }
        legDiv.appendChild(ul);
      }
      tripPlannerOutput.appendChild(legDiv);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /** Wire tab clicks to switchTab; wire arrow-key navigation and dropdowns/search/modal/back-to-top. */
  function initTabs() {
    const tabList = document.querySelector('.feature-tabs');
    if (tabList) {
      tabList.addEventListener('keydown', (e) => {
        const tab = e.target.closest('.tab');
        if (!tab || e.ctrlKey || e.altKey || e.metaKey) return;
        const tabs = Array.from(tabList.querySelectorAll('.tab'));
        const idx = tabs.indexOf(tab);
        if (idx === -1) return;
        let next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          next = tabs[idx + 1] || tabs[0];
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          next = tabs[idx - 1] || tabs[tabs.length - 1];
        } else if (e.key === 'Home') {
          e.preventDefault();
          next = tabs[0];
        } else if (e.key === 'End') {
          e.preventDefault();
          next = tabs[tabs.length - 1];
        }
        if (next) {
          const panelId = next.getAttribute(PANEL_ID);
          if (panelId) {
            switchTab(panelId);
            next.focus();
          }
        }
      });
    }
    document.querySelectorAll('.feature-tabs .tab').forEach((t) => {
      t.addEventListener('click', () => {
        const panelId = t.getAttribute(PANEL_ID);
        if (panelId) switchTab(panelId);
      });
    });
    if (fullInventoryCategory) {
      fullInventoryCategory.addEventListener('change', renderFullInventory);
    }
    if (fullInventoryMap) {
      fullInventoryMap.addEventListener('change', renderFullInventory);
    }
    if (fullInventoryVault) {
      fullInventoryVault.addEventListener('change', renderFullInventory);
    }
    if (fullInventorySearch) {
      fullInventorySearch.addEventListener('input', renderFullInventory);
    }
    if (fullInventoryClearFilters) {
      fullInventoryClearFilters.addEventListener('click', () => {
        if (fullInventoryCategory) fullInventoryCategory.value = '';
        if (fullInventoryMap) fullInventoryMap.value = '';
        if (fullInventoryVault) fullInventoryVault.value = '';
        if (fullInventorySkillReq1) fullInventorySkillReq1.value = '';
        if (fullInventorySkillReq2) fullInventorySkillReq2.value = '';
        if (fullInventorySlotCheckboxes) {
          fullInventorySlotCheckboxes.querySelectorAll('input[type="checkbox"]').forEach((cb) => { cb.checked = false; });
        }
        if (fullInventorySearch) fullInventorySearch.value = '';
        renderFullInventory();
      });
    }
    if (fullInventorySlotCheckboxes) {
      fullInventorySlotCheckboxes.addEventListener('change', (e) => {
        if (e.target && e.target.matches('input[type="checkbox"]')) renderFullInventory();
      });
    }
    if (fullInventorySkillReq1) {
      fullInventorySkillReq1.addEventListener('change', renderFullInventory);
    }
    if (fullInventorySkillReq2) {
      fullInventorySkillReq2.addEventListener('change', renderFullInventory);
    }
    if (modFinderSkill1) {
      modFinderSkill1.addEventListener('change', renderModFinderResults);
    }
    if (modFinderSkill2) {
      modFinderSkill2.addEventListener('change', renderModFinderResults);
    }
    if (modFinderRarity) {
      modFinderRarity.addEventListener('change', renderModFinderResults);
    }
    if (modFinderSlotCheckboxes) {
      modFinderSlotCheckboxes.addEventListener('change', (e) => {
        if (e.target && e.target.matches('input[type="checkbox"]')) renderModFinderResults();
      });
    }
    if (modFinderClearFilters) {
      modFinderClearFilters.addEventListener('click', () => {
        if (modFinderSkill1) modFinderSkill1.value = '';
        if (modFinderSkill2) modFinderSkill2.value = '';
        if (modFinderRarity) modFinderRarity.value = '';
        if (modFinderSlotCheckboxes) {
          modFinderSlotCheckboxes.querySelectorAll('input[type="checkbox"]').forEach((cb) => { cb.checked = false; });
        }
        renderModFinderResults();
      });
    }
    if (whatsThisForSearch) {
      whatsThisForSearch.addEventListener('input', () => {
        clearTimeout(whatsThisForDebounceTimer);
        whatsThisForDebounceTimer = setTimeout(() => {
          renderWhatsThisForResults(whatsThisForSearch.value, null);
        }, 200);
      });
    }
    if (whatsThisForClearFilters) {
      whatsThisForClearFilters.addEventListener('click', () => {
        if (whatsThisForSearch) whatsThisForSearch.value = '';
        renderWhatsThisForResults('', null);
      });
    }
    if (itemUsedForModalClose) {
      itemUsedForModalClose.addEventListener('click', closeItemUsedForModal);
    }
    if (itemUsedForModal) {
      const backdrop = itemUsedForModal.querySelector('.item-used-for-modal-backdrop');
      if (backdrop) backdrop.addEventListener('click', closeItemUsedForModal);
      document.addEventListener('keydown', (e) => {
        if (!itemUsedForModal || itemUsedForModal.hidden) return;
        if (e.key === 'Escape') {
          closeItemUsedForModal();
          return;
        }
        if (e.key === 'Tab') {
          const focusable = itemUsedForModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            if (last) last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            if (first) first.focus();
          }
        }
      });
    }
    if (tripPlannerStops) {
      tripPlannerStops.querySelectorAll('select').forEach((sel) => {
        sel.addEventListener('change', renderTripPlan);
      });
    }
    if (tripPlannerAddStop) {
      tripPlannerAddStop.addEventListener('click', () => {
        if (!tripPlannerStops) return;
        const selects = tripPlannerStops.querySelectorAll('select');
        const n = selects.length + 1;
        const label = document.createElement('label');
        const span = document.createElement('span');
        span.textContent = 'Stop ' + n;
        label.appendChild(span);
        const sel = document.createElement('select');
        sel.setAttribute('aria-label', 'Stop ' + n + ' map');
        sel.innerHTML = '<option value="">— Select map —</option>';
        label.appendChild(sel);
        tripPlannerStops.appendChild(label);
        populateTripStopOptions();
        sel.addEventListener('change', renderTripPlan);
      });
    }
    if (tripPlannerClear && tripPlannerStops) {
      tripPlannerClear.addEventListener('click', () => {
        const labels = tripPlannerStops.querySelectorAll('label');
        for (let i = 2; i < labels.length; i++) labels[i].remove();
        const selects = tripPlannerStops.querySelectorAll('select');
        selects.forEach((sel) => { sel.value = ''; });
        renderTripPlan();
      });
    }
    const goToTripPlanTab = $('goToTripPlanTab');
    if (goToTripPlanTab) {
      goToTripPlanTab.addEventListener('click', () => switchTab('panelTripPlan'));
    }
    if (backToTopBtn) {
      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      const SCROLL_THRESHOLD_PX = 200;
      function toggleBackToTop() {
        backToTopBtn.hidden = window.scrollY < SCROLL_THRESHOLD_PX;
      }
      window.addEventListener('scroll', toggleBackToTop, { passive: true });
      toggleBackToTop();
    }
  }
})();
