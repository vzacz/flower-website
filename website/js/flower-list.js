/* ============================================================
   GREEN LIFE FLOWERS — FLOWER CATEGORIES (Shared Data Source)
   Used by: index.html (category pills) + admin panel (CRUD)
   Storage: localStorage key 'greenlife_flower_list'
   Data model: array of { name: string, visible: boolean }
   ============================================================ */

const FlowerList = (function () {
  'use strict';

  const STORE_KEY = 'greenlife_flower_list';
  const STORE_VERSION_KEY = 'greenlife_flower_list_version';
  const STORE_VERSION = '2'; // bump to force re-seed when defaults change

  const DEFAULTS = [
    { name: 'Roses',          visible: true },
    { name: 'Lilies',         visible: true },
    { name: 'Sunflowers',     visible: true },
    { name: 'Chrysanthemums', visible: true },
    { name: 'Pom Pom',        visible: true },
    { name: 'Carnation',      visible: true },
    { name: 'Mini Carnation', visible: true },
    { name: 'Solidago',       visible: true },
    { name: "Baby's Breath",  visible: true },
  ];

  /* ── Migrate old string[] format to object[] ── */
  function migrate(raw) {
    if (!Array.isArray(raw)) return null;
    if (raw.length === 0) return raw;
    // If first item is a string, migrate all to objects
    if (typeof raw[0] === 'string') {
      // Prepend Roses if not already present
      const names = raw.map(s => s.toLowerCase());
      const items = [];
      if (!names.includes('roses')) {
        items.push({ name: 'Roses', visible: true });
      }
      raw.forEach(name => {
        items.push({ name, visible: true });
      });
      return items;
    }
    return raw;
  }

  /* ── Read ── */
  function getAll() {
    const storedVersion = localStorage.getItem(STORE_VERSION_KEY);

    // Force re-seed if version changed (ensures old stale categories are replaced)
    if (storedVersion !== STORE_VERSION) {
      save(DEFAULTS);
      localStorage.setItem(STORE_VERSION_KEY, STORE_VERSION);
      return [...DEFAULTS];
    }

    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = migrate(JSON.parse(raw));
        if (parsed) {
          save(parsed);
          return parsed;
        }
      }
    } catch {}
    // First load — seed defaults
    save(DEFAULTS);
    localStorage.setItem(STORE_VERSION_KEY, STORE_VERSION);
    return [...DEFAULTS];
  }

  /* ── Get only visible items ── */
  function getVisible() {
    return getAll().filter(item => item.visible);
  }

  /* ── Write ── */
  function save(list) {
    localStorage.setItem(STORE_KEY, JSON.stringify(list));
  }

  /* ── Add ── */
  function add(name) {
    const list = getAll();
    list.push({ name, visible: true });
    save(list);
    return list;
  }

  /* ── Rename ── */
  function rename(index, newName) {
    const list = getAll();
    if (index >= 0 && index < list.length) {
      list[index].name = newName;
      save(list);
    }
    return list;
  }

  /* ── Delete ── */
  function remove(index) {
    const list = getAll();
    if (index >= 0 && index < list.length) {
      list.splice(index, 1);
      save(list);
    }
    return list;
  }

  /* ── Toggle visibility ── */
  function toggleVisible(index) {
    const list = getAll();
    if (index >= 0 && index < list.length) {
      list[index].visible = !list[index].visible;
      save(list);
    }
    return list;
  }

  /* ── Reorder (move item from oldIndex to newIndex) ── */
  function reorder(oldIndex, newIndex) {
    const list = getAll();
    if (oldIndex < 0 || oldIndex >= list.length) return list;
    if (newIndex < 0 || newIndex >= list.length) return list;
    const [item] = list.splice(oldIndex, 1);
    list.splice(newIndex, 0, item);
    save(list);
    return list;
  }

  /* ── Render the unified category pills on the frontend ── */
  function renderPanel() {
    const container = document.getElementById('flowerCategoryPills');
    if (!container) return;
    const items = getVisible();
    const activeCategory = container.dataset.activeCategory || '';

    container.innerHTML = items.map((item, i) => {
      const isActive = item.name.toLowerCase() === activeCategory.toLowerCase();
      return `<button class="category-pill${isActive ? ' active' : ''}" data-flower-category="${item.name}" role="tab" aria-selected="${isActive}">${item.name}</button>`;
    }).join('');

    // Bind click handlers
    container.querySelectorAll('.category-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        // Deactivate all pills
        container.querySelectorAll('.category-pill').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        // Activate clicked
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        container.dataset.activeCategory = btn.dataset.flowerCategory;

        // Dispatch custom event for product filtering
        const event = new CustomEvent('flower-category-change', {
          detail: { category: btn.dataset.flowerCategory }
        });
        document.dispatchEvent(event);
      });
    });
  }

  return { getAll, getVisible, save, add, rename, remove, toggleVisible, reorder, renderPanel };
})();
