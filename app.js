(function () {
  'use strict';

  const CDN_BASE = 'https://cdn.projectgorgon.com/v457/data';
  const CDN_ICONS_BASE = 'https://cdn.projectgorgon.com/v457/icons';
  const DATA_BASE = './data';

  let npcs = {};
  let items = {};
  let storageVaults = {};
  let areas = {};
  let attributes = {};
  let tsysClientInfo = {};
  let tsysByInternalName = {};
  let skills = {};
  let abilities = {};
  let charactersItems = {};
  let charactersSheets = {};
  let giftableNpcs = [];
  let maps = [];

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
  const fullInventoryEmpty = $('fullInventoryEmpty');
  const fullInventoryResults = $('fullInventoryResults');
  const fullInventoryCategory = $('fullInventoryCategory');
  const fullInventorySearch = $('fullInventorySearch');
  const backToTopBtn = $('backToTop');
  const modFinderSkill1 = $('modFinderSkill1');
  const modFinderSkill2 = $('modFinderSkill2');
  const modFinderSlotCheckboxes = $('modFinderSlotCheckboxes');
  const modFinderEmpty = $('modFinderEmpty');
  const modFinderResults = $('modFinderResults');
  const MOD_SLOT_FILTER_OTHER = '__other__';
  const PANEL_ID = 'data-panel';

  const MOD_SLOT_ORDER = ['Head', 'Chest', 'Hands', 'MainHand', 'OffHand', 'Legs', 'Feet'];

  const FULL_INVENTORY_CATEGORY_ORDER = [
    'Equipment', 'Skill Book', 'Recipe', 'Work Order', 'Consumables', 'Potions', 'Gardening', 'Ingredients',
    'Cooking', 'Ability ingredients', 'Nature', 'Brewing', 'Other'
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
    BrewingRelated: 'Brewing', BottledItem: 'Brewing'
  };

  function setStatus(msg) {
    dataStatus.textContent = msg;
  }

  function normalizeItemKey(typeId) {
    return 'item_' + Number(typeId);
  }

  function itemKeywordBase(kw) {
    if (typeof kw !== 'string') return '';
    const eq = kw.indexOf('=');
    return eq >= 0 ? kw.slice(0, eq) : kw;
  }

  function hasKeywordMatch(itemKeywords, preferenceKeywords) {
    const bases = new Set((itemKeywords || []).map(itemKeywordBase));
    return (preferenceKeywords || []).some((pk) => bases.has(pk));
  }

  async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    return res.json();
  }

  async function loadCdn() {
    const tryUrl = (base, file) => base + '/' + file;
    try {
      npcs = await fetchJson(tryUrl(CDN_BASE, 'npcs.json'));
    } catch (e) {
      try {
        npcs = await fetchJson(tryUrl(DATA_BASE, 'npcs.json'));
      } catch (e2) {
        throw new Error('Could not load npcs.json');
      }
    }
    try {
      items = await fetchJson(tryUrl(CDN_BASE, 'items.json'));
    } catch (e) {
      try {
        items = await fetchJson(tryUrl(DATA_BASE, 'items.json'));
      } catch (e2) {
        throw new Error('Could not load items.json');
      }
    }
    try {
      storageVaults = await fetchJson(tryUrl(CDN_BASE, 'storagevaults.json'));
    } catch (e) {
      try {
        storageVaults = await fetchJson(tryUrl(DATA_BASE, 'storagevaults.json'));
      } catch (e2) {
        storageVaults = {};
      }
    }
    try {
      areas = await fetchJson(tryUrl(CDN_BASE, 'areas.json'));
    } catch (e) {
      try {
        areas = await fetchJson(tryUrl(DATA_BASE, 'areas.json'));
      } catch (e2) {
        areas = {};
      }
    }
    try {
      attributes = await fetchJson(tryUrl(CDN_BASE, 'attributes.json'));
    } catch (e2) {
      try {
        attributes = await fetchJson(tryUrl(DATA_BASE, 'attributes.json'));
      } catch (e2) {
        attributes = {};
      }
    }
    try {
      tsysClientInfo = await fetchJson(tryUrl(CDN_BASE, 'tsysclientinfo.json'));
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
      skills = await fetchJson(tryUrl(CDN_BASE, 'skills.json'));
    } catch (e) {
      try {
        skills = await fetchJson(tryUrl(DATA_BASE, 'skills.json'));
      } catch (e2) {
        skills = {};
      }
    }
    try {
      abilities = await fetchJson(tryUrl(CDN_BASE, 'abilities.json'));
    } catch (e) {
      try {
        abilities = await fetchJson(tryUrl(DATA_BASE, 'abilities.json'));
      } catch (e2) {
        abilities = {};
      }
    }
    buildGiftableNpcsAndMaps();
  }

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

  function onItemsFilesChange() {
    const file = itemsFiles.files && itemsFiles.files[0];
    charactersItems = {};
    if (!file) {
      setStatus('');
      return;
    }
    setStatus('Reading items file…');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const name = (data.Character || file.name || 'Unknown').trim() || file.name;
        if (!data.Items || !Array.isArray(data.Items)) {
          setStatus('File has no Items array.');
          return;
        }
        charactersItems[name] = data.Items;
        setStatus('Loaded items from ' + file.name + '.');
      } catch (e) {
        setStatus('Invalid JSON: ' + e.message);
      }
    };
    reader.readAsText(file);
  }

  function onCharacterFilesChange() {
    const file = characterFiles.files && characterFiles.files[0];
    charactersSheets = {};
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const name = (data.Character || file.name || 'Unknown').trim() || file.name;
        charactersSheets[name] = data;
        const prev = dataStatus.textContent || '';
        setStatus(prev ? prev + ' Character sheet loaded.' : 'Character sheet loaded.');
      } catch (_) {
        setStatus('Invalid character sheet JSON.');
      }
    };
    reader.readAsText(file);
  }

  function getCdnItem(typeId) {
    const key = normalizeItemKey(typeId);
    return items[key] || null;
  }

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

  function vaultFriendlyName(vaultId) {
    if (!vaultId) return vaultId;
    const v = storageVaults[vaultId];
    return (v && v.NpcFriendlyName) ? v.NpcFriendlyName : vaultId;
  }

  function vaultCityHeading(vaultId) {
    if (!vaultId) return null;
    const v = storageVaults[vaultId];
    if (!v) return null;
    const areaKey = v.Grouping || v.Area;
    if (!areaKey || areaKey === '*') return 'Any city';
    const a = areas[areaKey];
    return (a && a.FriendlyName) ? a.FriendlyName : areaKey;
  }

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
    text.textContent = m.name + ' × ' + m.stackSize + (m.value ? ' (value ' + m.value + ')' : '') + (m.preferenceName ? ' — ' + m.preferenceName : '');
    li.appendChild(text);
    return li;
  }

  function npcWikiUrl(displayName) {
    if (!displayName || typeof displayName !== 'string') return null;
    const slug = displayName.trim().replace(/\s+/g, '_');
    return 'https://wiki.projectgorgon.com/wiki/' + encodeURIComponent(slug);
  }

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

  function init() {
    document.getElementById('copyrightYear').textContent = new Date().getFullYear();
    mapSelect.innerHTML = '<option value="">— Loading CDN… —</option>';
    loadCdn()
      .then(() => {
        populateMapDropdown();
        npcSelect.innerHTML = '<option value="">— Choose a map first —</option>';
        npcSelect.disabled = true;
        cdnError.hidden = true;
        populateModFinderSkillDropdowns();
        buildModFinderSlotFilter();
      })
      .catch((err) => {
        mapSelect.innerHTML = '<option value="">— CDN failed —</option>';
        mapSelect.disabled = true;
        cdnError.hidden = false;
        console.error(err);
      });

    mapSelect.addEventListener('change', () => {
      populateNpcDropdown(mapSelect.value);
    });

    npcSelect.addEventListener('change', runMatch);
    itemsFiles.addEventListener('change', onItemsFilesChange);
    characterFiles.addEventListener('change', onCharacterFilesChange);
    initTabs();
  }

  function switchTab(panelId) {
    document.querySelectorAll('.feature-tabs .tab').forEach((t) => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.feature-panel').forEach((p) => {
      p.classList.add('hidden');
    });
    const tab = document.querySelector('.feature-tabs .tab[data-panel="' + panelId + '"]');
    const panel = $(panelId);
    if (tab) {
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
    }
    if (panel) {
      panel.classList.remove('hidden');
    }
    if (panelId === 'panelInventory') {
      renderFullInventory();
    }
    if (panelId === 'panelStorage') {
      runStorageSaver();
    }
  }

  function getFirstCharacterItems() {
    const names = Object.keys(charactersItems);
    return names.length ? charactersItems[names[0]] : null;
  }

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

  function getCategoryForItemWithIcon(displayName, iconId, keywords, description) {
    if (iconId === 5792) return 'Skill Book';
    if (iconId === 4003) {
      const name = (displayName || '').toLowerCase();
      const desc = (description || '').toLowerCase();
      const text = name + ' ' + desc;
      if (text.includes('work order')) return 'Work Order';
      if (text.includes('recipe')) return 'Recipe';
    }
    return getCategoryForItem(keywords);
  }

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

  function formatEffectDescsForDisplay(effectDescs, attrs) {
    if (!Array.isArray(effectDescs) || !effectDescs.length) return [];
    return effectDescs.map((d) => {
      if (typeof d !== 'string') return String(d);
      if (d.indexOf('{') === -1) return d.trim();
      return d.split(/\s*·\s*/).map((p) => formatEffectDesc(p.trim(), attrs)).join(' · ');
    });
  }

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

  function getCombatSkillsList() {
    return Object.entries(skills)
      .filter(([, s]) => s && s.Combat === true)
      .map(([key, s]) => ({ key, name: (s.Name || key).trim() || key }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

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

  function filterModsBySkills(skill1, skill2) {
    const skillSet = new Set([skill1, skill2].filter(Boolean));
    if (skillSet.size === 0) return [];
    return Object.values(tsysClientInfo).filter(
      (entry) => entry && entry.Skill && skillSet.has(entry.Skill)
    );
  }

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

  function getFirstTierKey(entry) {
    const tiers = entry.Tiers && typeof entry.Tiers === 'object' ? entry.Tiers : {};
    const keys = Object.keys(tiers);
    if (keys.length === 0) return null;
    const numeric = keys.map((k) => parseInt(k.replace('id_', ''), 10)).filter((n) => !Number.isNaN(n));
    if (numeric.length === 0) return keys[0];
    return 'id_' + Math.min(...numeric);
  }

  let abilityInternalNameToIconId = null;
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

  function getSelectedSlotFilter() {
    if (!modFinderSlotCheckboxes) return null;
    const checked = Array.from(modFinderSlotCheckboxes.querySelectorAll('input[type="checkbox"]:checked'))
      .map((el) => el.value);
    return checked.length === 0 ? null : checked;
  }

  function renderModFinderResults() {
    if (!modFinderResults || !modFinderEmpty) return;
    modFinderResults.innerHTML = '';
    modFinderResults.hidden = true;
    modFinderEmpty.hidden = true;
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
    const grid = document.createElement('div');
    grid.className = 'mod-finder-results-grid';
    for (const slot of slotOrder) {
      const section = document.createElement('section');
      section.className = 'mod-finder-slot-section';
      const h3 = document.createElement('h3');
      h3.textContent = slot;
      section.appendChild(h3);
      const list = document.createElement('ul');
      list.className = 'mod-finder-mod-list';
      for (const entry of bySlot[slot]) {
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
    modFinderResults.hidden = false;
  }

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
          vaults: []
        };
      }
      byKey[key].vaults.push({
        vault: row.StorageVault || 'Unknown',
        stack: row.StackSize ?? 1,
      });
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
      const rawEffectDescs = (cdnItem && cdnItem.EffectDescs && Array.isArray(cdnItem.EffectDescs))
        ? cdnItem.EffectDescs
        : [];
      const effectDescs = formatEffectDescsForDisplay(rawEffectDescs, attributes);
      const rawModDescs = getModEffectDescs(data.tsysPowers);
      const modDescs = formatEffectDescsForDisplay(rawModDescs, attributes);
      let total = 0;
      const locationParts = [];
      for (const v of data.vaults) {
        total += v.stack;
        const mapName = vaultCityHeading(v.vault) || 'Other';
        locationParts.push({ mapName, vaultId: v.vault, stack: v.stack });
      }
      if (!byCategory[category]) byCategory[category] = [];
      byCategory[category].push({
        displayName,
        iconId,
        total,
        locations: locationParts,
        effectDescs,
        modDescs,
        description,
      });
    }
    for (const cat of Object.keys(byCategory)) {
      byCategory[cat].sort((a, b) => a.displayName.localeCompare(b.displayName));
    }
    return byCategory;
  }

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
      if (fullInventorySearch) fullInventorySearch.disabled = true;
      return;
    }
    const selectedCategory = fullInventoryCategory ? fullInventoryCategory.value : '';
    if (fullInventoryCategory) fullInventoryCategory.disabled = false;
    if (fullInventorySearch) fullInventorySearch.disabled = false;
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
    const searchTerm = (fullInventorySearch && fullInventorySearch.value ? fullInventorySearch.value : '')
      .trim().toLowerCase();
    const matchesSearch = (row) => {
      if (!searchTerm) return true;
      const text = [
        row.displayName || '',
        row.description || '',
        (row.effectDescs || []).join(' '),
        (row.modDescs || []).join(' '),
      ].join(' ').toLowerCase();
      return text.includes(searchTerm);
    };
    const categoriesToShow = selectedCategory
      ? (byCategory[selectedCategory] ? [selectedCategory] : [])
      : FULL_INVENTORY_CATEGORY_ORDER;
    for (const cat of categoriesToShow) {
      let rows = byCategory[cat];
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
        if (row.iconId != null) {
          const img = document.createElement('img');
          img.src = CDN_ICONS_BASE + '/icon_' + row.iconId + '.png';
          img.alt = '';
          img.className = 'item-icon';
          tdIcon.appendChild(img);
        } else {
          tdIcon.textContent = '—';
        }
        tr.appendChild(tdIcon);
        const tdName = document.createElement('td');
        tdName.setAttribute('data-label', 'Name');
        const nameBlock = document.createElement('div');
        nameBlock.className = 'full-inventory-name-cell';
        const nameLine = document.createElement('div');
        nameLine.className = 'full-inventory-item-name';
        nameLine.textContent = row.displayName;
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
            row.modDescs.forEach((modText) => {
              const modLine = document.createElement('div');
              modLine.className = 'full-inventory-mod-descs';
              appendTextWithIcons(modLine, modText);
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

  function runStorageSaver() {
    const userItems = getFirstCharacterItems();
    storageSaverResults.hidden = true;
    storageSaverResults.innerHTML = '';
    if (!userItems || !userItems.length) {
      storageSaverStatus.textContent = 'Load an items export above first.';
      return;
    }
    storageSaverStatus.textContent = 'Finding duplicate stacks…';
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
    storageSaverStatus.textContent = '';
    if (duplicates.length === 0) {
      storageSaverResults.hidden = false;
      const p = document.createElement('p');
      p.className = 'no-duplicates';
      p.textContent = 'No consolidatable duplicate stacks found. Items that could save slots when merged are not split across multiple vaults.';
      storageSaverResults.appendChild(p);
      return;
    }
    storageSaverResults.hidden = false;
    const totalSlots = duplicates.reduce((sum, d) => sum + d.slotsSaveable, 0);
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
      h3.textContent = d.name;
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function initTabs() {
    document.querySelectorAll('.feature-tabs .tab').forEach((t) => {
      t.addEventListener('click', () => {
        const panelId = t.getAttribute(PANEL_ID);
        if (panelId) switchTab(panelId);
      });
    });
    if (fullInventoryCategory) {
      fullInventoryCategory.addEventListener('change', renderFullInventory);
    }
    if (fullInventorySearch) {
      fullInventorySearch.addEventListener('input', renderFullInventory);
    }
    if (modFinderSkill1) {
      modFinderSkill1.addEventListener('change', renderModFinderResults);
    }
    if (modFinderSkill2) {
      modFinderSkill2.addEventListener('change', renderModFinderResults);
    }
    if (modFinderSlotCheckboxes) {
      modFinderSlotCheckboxes.addEventListener('change', (e) => {
        if (e.target && e.target.matches('input[type="checkbox"]')) renderModFinderResults();
      });
    }
    if (backToTopBtn) {
      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      const scrollThreshold = 200;
      function toggleBackToTop() {
        backToTopBtn.hidden = window.scrollY < scrollThreshold;
      }
      window.addEventListener('scroll', toggleBackToTop, { passive: true });
      toggleBackToTop();
    }
  }
})();
