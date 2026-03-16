/**
 * ============================================================
 * GREEN LIFE WHOLESALE — script.js
 * ============================================================
 *
 * HOW TO USE THIS FILE:
 * - Default products are in DEFAULT_PRODUCTS below.
 *   Edit names, descriptions, prices, icons, categories etc.
 * - Admin PIN is ADMIN_PIN below (default: 1234).
 * - Contact info is in index.html.
 * - To add a new category, just add products with that category name.
 *
 * DATA FLOW:
 *   localStorage → load on init → render → user action → save → re-render
 * ============================================================
 */

'use strict';

/* ════════════════════════════════════════════════
   CONFIGURATION — EDIT THESE
   ════════════════════════════════════════════════ */

/** Admin PIN to access the admin panel via #gl-admin */
const ADMIN_PIN = '1234'; // ← CHANGE THIS to your preferred PIN

/** localStorage keys — don't change these unless you want to reset data */
const KEYS = {
  products: 'greenlife_products',
  orders:   'greenlife_orders',
  cart:     'greenlife_cart',
};

/**
 * DEFAULT PRODUCTS — edit or expand this list.
 * These are loaded on first visit (if localStorage is empty).
 *
 * Fields:
 *   name       : display name
 *   description: short description shown on card
 *   category   : groups products together (add any category you want)
 *   unit       : how it's sold (bunch, box, each, lb, case, etc.)
 *   price      : price per unit (number)
 *   icon       : emoji OR a URL to an image file
 *   available  : true = orderable, false = shown but grayed out
 */
const DEFAULT_PRODUCTS = [

  // ── ROSES ─────────────────────────────────────────────────────
  {
    id: 'p1',
    name: 'Red Roses',
    description: 'Classic premium long-stem red roses, perfect for arrangements and retail.',
    category: 'Roses',
    unit: 'bunch (25 stems)',
    price: 18.50,
    icon: '🌹',
    available: true,
  },
  {
    id: 'p2',
    name: 'White Roses',
    description: 'Pure white garden roses with a soft fragrance — ideal for weddings.',
    category: 'Roses',
    unit: 'bunch (25 stems)',
    price: 20.00,
    icon: '🤍',
    available: true,
  },
  {
    id: 'p3',
    name: 'Pink Roses',
    description: 'Soft blush-to-hot-pink roses. Beautiful for romantic arrangements.',
    category: 'Roses',
    unit: 'bunch (25 stems)',
    price: 19.00,
    icon: '🌸',
    available: true,
  },
  {
    id: 'p4',
    name: 'Spray Roses',
    description: 'Multi-headed spray roses with a delicate, full look. Great filler or focal.',
    category: 'Roses',
    unit: 'bunch (20 stems)',
    price: 14.00,
    icon: '🌹',
    available: true,
  },
  {
    id: 'p5',
    name: 'Garden Roses',
    description: 'Full-bloom premium garden roses. Lush, layered petals for high-end design.',
    category: 'Roses',
    unit: 'bunch (10 stems)',
    price: 28.00,
    icon: '🌺',
    available: true,
  },

  // ── TULIPS ────────────────────────────────────────────────────
  {
    id: 'p6',
    name: 'Mixed Dutch Tulips',
    description: 'Fresh-cut Dutch tulips in a curated colour mix. Lively and versatile.',
    category: 'Tulips',
    unit: 'bunch (20 stems)',
    price: 16.00,
    icon: '🌷',
    available: true,
  },
  {
    id: 'p7',
    name: 'White Tulips',
    description: 'Crisp white tulips — elegant, clean, and classic.',
    category: 'Tulips',
    unit: 'bunch (20 stems)',
    price: 17.00,
    icon: '🌷',
    available: true,
  },
  {
    id: 'p8',
    name: 'Pink Parrot Tulips',
    description: 'Ruffled parrot tulips in soft pink tones. Dramatic and romantic.',
    category: 'Tulips',
    unit: 'bunch (20 stems)',
    price: 19.00,
    icon: '🌷',
    available: true,
  },

  // ── PEONIES ───────────────────────────────────────────────────
  {
    id: 'p9',
    name: 'Blush Peonies',
    description: 'Full, lush peonies in soft blush and pale pink tones. Season favourite.',
    category: 'Peonies',
    unit: 'bunch (10 stems)',
    price: 32.00,
    icon: '🌸',
    available: true,
  },
  {
    id: 'p10',
    name: 'White Peonies',
    description: 'Pure white peonies with silky, cloud-like petals. Stunning for events.',
    category: 'Peonies',
    unit: 'bunch (10 stems)',
    price: 34.00,
    icon: '🌸',
    available: true,
  },
  {
    id: 'p11',
    name: 'Ranunculus',
    description: 'Delicate multi-layered blooms in cream, blush, and coral. Rose-like beauty.',
    category: 'Peonies',
    unit: 'bunch (15 stems)',
    price: 24.00,
    icon: '💮',
    available: true,
  },

  // ── HYDRANGEAS ────────────────────────────────────────────────
  {
    id: 'p12',
    name: 'Blue Hydrangeas',
    description: 'Voluminous blue and lavender hydrangea heads. Bold statement flower.',
    category: 'Hydrangeas',
    unit: 'stem',
    price: 12.00,
    icon: '💐',
    available: true,
  },
  {
    id: 'p13',
    name: 'White Hydrangeas',
    description: 'Crisp, full white hydrangea heads. Timeless and elegant.',
    category: 'Hydrangeas',
    unit: 'stem',
    price: 12.00,
    icon: '💐',
    available: true,
  },
  {
    id: 'p14',
    name: 'Pink Hydrangeas',
    description: 'Blush-to-deep-pink hydrangeas with full, lush heads.',
    category: 'Hydrangeas',
    unit: 'stem',
    price: 12.50,
    icon: '💐',
    available: true,
  },

  // ── SEASONAL BLOOMS ───────────────────────────────────────────
  {
    id: 'p15',
    name: 'Sunflowers',
    description: 'Large-headed sunflowers — bright, bold, and cheerful year-round.',
    category: 'Seasonal Blooms',
    unit: 'bunch (10 stems)',
    price: 12.00,
    icon: '🌻',
    available: true,
  },
  {
    id: 'p16',
    name: 'Standard Carnations',
    description: 'Classic carnations with exceptional vase life. Available in all colours.',
    category: 'Seasonal Blooms',
    unit: 'bunch (25 stems)',
    price: 8.00,
    icon: '🌼',
    available: true,
  },
  {
    id: 'p17',
    name: 'Lisianthus',
    description: 'Ruffled, rose-like blooms in white, purple, and lavender. Elegant filler.',
    category: 'Seasonal Blooms',
    unit: 'bunch (10 stems)',
    price: 16.00,
    icon: '🌸',
    available: true,
  },
  {
    id: 'p18',
    name: 'Mixed Seasonal Blooms',
    description: 'Curated mix of the freshest seasonal flowers — variety changes weekly.',
    category: 'Seasonal Blooms',
    unit: 'bouquet',
    price: 22.00,
    icon: '💐',
    available: true,
  },

  // ── FILLER FLOWERS ────────────────────────────────────────────
  {
    id: 'p19',
    name: "Baby's Breath",
    description: 'Classic white gypsophila — the perfect airy filler for any arrangement.',
    category: 'Filler Flowers',
    unit: 'bunch (50 stems)',
    price: 9.00,
    icon: '🤍',
    available: true,
  },
  {
    id: 'p20',
    name: 'Eucalyptus',
    description: 'Silver dollar and seeded eucalyptus — essential greenery for floral design.',
    category: 'Filler Flowers',
    unit: 'bunch',
    price: 8.00,
    icon: '🌿',
    available: true,
  },
  {
    id: 'p21',
    name: 'Italian Ruscus',
    description: 'Glossy dark green ruscus — long-lasting filler and wreath greenery.',
    category: 'Filler Flowers',
    unit: 'bunch',
    price: 7.50,
    icon: '🌿',
    available: true,
  },
  {
    id: 'p22',
    name: 'Lavender Stems',
    description: 'Fragrant fresh or dried lavender — beautiful for bouquets and sachets.',
    category: 'Filler Flowers',
    unit: 'bunch (20 stems)',
    price: 9.50,
    icon: '🪻',
    available: true,
  },
];

/** Category icons — maps category name → emoji shown in category cards and group headers */
const CATEGORY_ICONS = {
  'Roses':           '🌹',
  'Tulips':          '🌷',
  'Peonies':         '🌸',
  'Hydrangeas':      '💐',
  'Seasonal Blooms': '🌻',
  'Filler Flowers':  '🌿',
};

/** Returns icon for a category; falls back to a generic icon */
function getCategoryIcon(cat) {
  return CATEGORY_ICONS[cat] || '🌸';
}


/* ════════════════════════════════════════════════
   DATA LAYER — localStorage helpers
   ════════════════════════════════════════════════ */

function loadProducts() {
  try {
    const raw = localStorage.getItem(KEYS.products);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveProducts(products) {
  localStorage.setItem(KEYS.products, JSON.stringify(products));
}

function loadOrders() {
  try {
    const raw = localStorage.getItem(KEYS.orders);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveOrders(orders) {
  localStorage.setItem(KEYS.orders, JSON.stringify(orders));
}

function loadCart() {
  try {
    const raw = localStorage.getItem(KEYS.cart);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(KEYS.cart, JSON.stringify(cart));
}

/** Data version — bump this string to force-reset products on next page load */
const DATA_VERSION = 'flowers-v2';

/** Seeds default products on first visit, or resets them if catalog version changed */
function initData() {
  const storedVersion = localStorage.getItem('greenlife_data_version');
  if (!loadProducts() || storedVersion !== DATA_VERSION) {
    saveProducts(DEFAULT_PRODUCTS);
    localStorage.setItem('greenlife_data_version', DATA_VERSION);
    // Clear any cart items tied to old non-flower products
    saveCart([]);
  }
}

/** Global in-memory state — always in sync with localStorage */
let state = {
  products: [],
  orders:   [],
  cart:     [],
};

function syncState() {
  state.products = loadProducts() || [];
  state.orders   = loadOrders();
  state.cart     = loadCart();
}


/* ════════════════════════════════════════════════
   ROUTING — section show/hide
   ════════════════════════════════════════════════ */

let currentSection = 'home';

/**
 * Navigate to a section by name.
 * Sections: 'home' | 'products' | 'checkout' | 'contact' | 'admin'
 */
function navigate(sectionName) {
  // Admin requires PIN
  if (sectionName === 'admin') {
    if (!sessionStorage.getItem('gl_admin_auth')) {
      pendingAdminNav = true;
      openPinModal();
      return;
    }
  }

  // Hide all sections
  document.querySelectorAll('section').forEach(s => s.classList.remove('active'));

  // Show target
  const target = document.getElementById(sectionName);
  if (target) {
    target.classList.add('active');
    currentSection = sectionName;
  }

  // Update nav active state
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.section === sectionName);
  });

  // Update URL hash (without triggering hashchange loop)
  const hash = sectionName === 'admin' ? '#gl-admin' : '#' + sectionName;
  if (window.location.hash !== hash) {
    history.pushState(null, '', hash);
  }

  // Render the section
  renderSection(sectionName);

  // Close mobile menu
  closeMobileMenu();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/** Render whichever section is now active */
function renderSection(name) {
  switch (name) {
    case 'home':     renderHome();     break;
    case 'products': renderProducts(); break;
    case 'checkout': renderCheckout(); break;
    case 'contact':  break; // static, no render needed
    case 'admin':    renderAdmin();    break;
  }
}

/** Handle URL hash on load/change */
function handleHashChange() {
  const hash = window.location.hash.replace('#', '');
  const sectionMap = {
    'home':     'home',
    'products': 'products',
    'checkout': 'checkout',
    'contact':  'contact',
    'gl-admin': 'admin',
  };
  const section = sectionMap[hash] || 'home';
  navigate(section);
}

window.addEventListener('hashchange', handleHashChange);


/* ════════════════════════════════════════════════
   MOBILE NAV
   ════════════════════════════════════════════════ */

function initMobileNav() {
  const burger = document.getElementById('navHamburger');
  const links  = document.getElementById('navLinks');
  if (!burger || !links) return;

  burger.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    burger.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
  });
}

function closeMobileMenu() {
  const links  = document.getElementById('navLinks');
  const burger = document.getElementById('navHamburger');
  links && links.classList.remove('open');
  burger && burger.classList.remove('open');
  burger && burger.setAttribute('aria-expanded', 'false');
}


/* ════════════════════════════════════════════════
   LOGO — secret 5-click admin trigger
   ════════════════════════════════════════════════ */

let logoClickCount = 0;
let logoClickTimer = null;

function initLogoAdminTrigger() {
  const logo = document.getElementById('navLogo');
  if (!logo) return;

  logo.addEventListener('click', () => {
    logoClickCount++;
    clearTimeout(logoClickTimer);
    logoClickTimer = setTimeout(() => { logoClickCount = 0; }, 2000);

    if (logoClickCount >= 5) {
      logoClickCount = 0;
      navigate('admin');
    }
  });
}

/** Show logo images; fall back to text if image errors */
function initLogos() {
  const logos = ['navLogoImg', 'heroLogoImg', 'footerLogoImg'];
  logos.forEach(id => {
    const img = document.getElementById(id);
    if (!img) return;
    img.addEventListener('error', () => {
      img.style.display = 'none';
      // Show fallback text elements
      const fallbackMap = {
        navLogoImg:    'navLogoText',
        footerLogoImg: 'footerLogoFallback',
      };
      const fallbackId = fallbackMap[id];
      if (fallbackId) {
        const el = document.getElementById(fallbackId);
        if (el) el.style.display = '';
      }
    });
  });
}


/* ════════════════════════════════════════════════
   CART
   ════════════════════════════════════════════════ */

/** Total number of units in cart */
function cartCount() {
  return state.cart.reduce((sum, item) => sum + item.quantity, 0);
}

/** Update the cart badge number in nav */
function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const count = cartCount();
  badge.textContent = count;
  badge.classList.add('bump');
  badge.addEventListener('animationend', () => badge.classList.remove('bump'), { once: true });
}

/**
 * Add a product to the cart or increase its quantity.
 * @param {string} productId
 * @param {number} qty - quantity to add
 */
function addToCart(productId, qty) {
  qty = parseInt(qty, 10);
  if (!qty || qty < 1) return;

  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  const existing = state.cart.find(c => c.productId === productId);
  if (existing) {
    existing.quantity += qty;
  } else {
    state.cart.push({
      productId: product.id,
      name:      product.name,
      icon:      product.icon,
      unit:      product.unit,
      price:     product.price,
      quantity:  qty,
    });
  }

  saveCart(state.cart);
  updateCartBadge();
}

/**
 * Set cart item quantity directly (from checkout page).
 */
function setCartQty(productId, qty) {
  qty = parseInt(qty, 10);
  if (qty < 1) {
    removeFromCart(productId);
    return;
  }
  const item = state.cart.find(c => c.productId === productId);
  if (item) {
    item.quantity = qty;
    saveCart(state.cart);
    updateCartBadge();
  }
}

/** Remove a product from the cart entirely. */
function removeFromCart(productId) {
  state.cart = state.cart.filter(c => c.productId !== productId);
  saveCart(state.cart);
  updateCartBadge();
  renderCheckout(); // re-render if on checkout
}

/** Clear all cart items. */
function clearCart() {
  state.cart = [];
  saveCart(state.cart);
  updateCartBadge();
}

/** Cart subtotal */
function cartSubtotal() {
  return state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}


/* ════════════════════════════════════════════════
   TOAST NOTIFICATIONS
   ════════════════════════════════════════════════ */

/**
 * Show a toast message.
 * @param {string} msg - text to display
 * @param {'success'|'error'|'info'} type
 */
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || '💬'}</span> <span>${msg}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, 3200);
}


/* ════════════════════════════════════════════════
   RENDER: HOME
   ════════════════════════════════════════════════ */

function renderHome() {
  renderHomeCategories();
}

/** Render category grid on home page — dynamic from product data */
function renderHomeCategories() {
  const grid = document.getElementById('homeCategoriesGrid');
  if (!grid) return;

  // Get unique categories and count products per category
  const categoryMap = {};
  state.products.forEach(p => {
    if (!categoryMap[p.category]) categoryMap[p.category] = 0;
    if (p.available) categoryMap[p.category]++;
  });

  if (Object.keys(categoryMap).length === 0) {
    grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;">No products available.</p>';
    return;
  }

  grid.innerHTML = Object.entries(categoryMap).map(([cat, count]) => `
    <div class="category-card" onclick="navigateToCategory('${escapeHtml(cat)}')" role="button" tabindex="0"
      onkeydown="if(event.key==='Enter')navigateToCategory('${escapeHtml(cat)}')">
      <span class="category-icon" aria-hidden="true">${getCategoryIcon(cat)}</span>
      <div class="category-name">${escapeHtml(cat)}</div>
      <div class="category-count">${count} item${count !== 1 ? 's' : ''}</div>
    </div>
  `).join('');
}

/** Navigate to products page and filter by a specific category */
function navigateToCategory(cat) {
  navigate('products');
  // Small delay so products renders first
  setTimeout(() => setProductFilter(cat), 50);
}


/* ════════════════════════════════════════════════
   RENDER: PRODUCTS
   ════════════════════════════════════════════════ */

let activeFilter = 'All';
let searchQuery  = '';

function renderProducts() {
  renderProductFilters();
  renderProductList();
}

/** Build category filter buttons above product grid */
function renderProductFilters() {
  const toolbar = document.getElementById('productsToolbar');
  if (!toolbar) return;

  const categories = ['All', ...new Set(state.products.map(p => p.category))];

  // Remove existing filter buttons (keep the search input wrapper)
  toolbar.querySelectorAll('.filter-btn').forEach(b => b.remove());

  // Insert filter buttons before the search input
  const searchEl = toolbar.querySelector('.products-search');
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (cat === activeFilter ? ' active' : '');
    btn.textContent = cat === 'All' ? '🌿 All' : `${getCategoryIcon(cat)} ${cat}`;
    btn.setAttribute('aria-pressed', cat === activeFilter);
    btn.addEventListener('click', () => setProductFilter(cat));
    toolbar.insertBefore(btn, searchEl);
  });
}

function setProductFilter(cat) {
  activeFilter = cat;
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', b.textContent.includes(cat) || (cat === 'All' && b.textContent.includes('All')));
    b.setAttribute('aria-pressed', b.classList.contains('active'));
  });
  renderProductList();
}

/** Render product cards, grouped by category */
function renderProductList() {
  const container = document.getElementById('productsContainer');
  if (!container) return;

  // Filter by category and search query
  let filtered = state.products.filter(p => {
    const matchCat  = activeFilter === 'All' || p.category === activeFilter;
    const matchText = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery) ||
      p.description.toLowerCase().includes(searchQuery) ||
      p.category.toLowerCase().includes(searchQuery);
    return matchCat && matchText;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3>No products found</h3>
        <p>Try a different filter or search term.</p>
      </div>`;
    return;
  }

  // Group by category
  const groups = {};
  filtered.forEach(p => {
    if (!groups[p.category]) groups[p.category] = [];
    groups[p.category].push(p);
  });

  container.innerHTML = Object.entries(groups).map(([cat, products]) => `
    <div class="category-group">
      <div class="category-group-header">
        <span class="category-group-icon" aria-hidden="true">${getCategoryIcon(cat)}</span>
        <h3 class="category-group-name">${escapeHtml(cat)}</h3>
        <div class="category-group-line"></div>
      </div>
      <div class="products-grid">
        ${products.map(renderProductCard).join('')}
      </div>
    </div>
  `).join('');
}

/** Build HTML for a single product card */
function renderProductCard(product) {
  const cartItem = state.cart.find(c => c.productId === product.id);
  const currentQty = cartItem ? cartItem.quantity : 1;
  const isImage = product.icon && product.icon.startsWith('http');

  const iconHtml = isImage
    ? `<img src="${escapeHtml(product.icon)}" alt="${escapeHtml(product.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" /><span style="display:none;font-size:3rem;">🌿</span>`
    : `<span style="font-size:3.5rem;" aria-hidden="true">${escapeHtml(product.icon || '🌱')}</span>`;

  const footerHtml = product.available
    ? `<div class="qty-control" aria-label="Quantity selector">
         <button class="qty-btn" onclick="changeQty('${product.id}', -1)" aria-label="Decrease quantity">−</button>
         <input class="qty-input" type="number" value="${currentQty}" min="1" max="999"
           id="qty-${product.id}"
           onchange="clampQty('${product.id}', this)"
           aria-label="Quantity" />
         <button class="qty-btn" onclick="changeQty('${product.id}', 1)" aria-label="Increase quantity">+</button>
       </div>
       <button class="add-to-cart-btn" id="addbtn-${product.id}"
         onclick="handleAddToCart('${product.id}')">
         + Add
       </button>`
    : `<div class="unavailable-badge">Currently Unavailable</div>`;

  return `
    <div class="product-card${!product.available ? ' unavailable-product-card' : ''}">
      <div class="product-card-img">
        <span class="product-category-tag">${escapeHtml(product.category)}</span>
        ${iconHtml}
      </div>
      <div class="product-card-body">
        <div class="product-name">${escapeHtml(product.name)}</div>
        <p class="product-desc">${escapeHtml(product.description)}</p>
        <div class="product-meta">
          <span class="product-price">$${Number(product.price).toFixed(2)}</span>
          <span class="product-unit">${escapeHtml(product.unit)}</span>
        </div>
      </div>
      <div class="product-card-footer">
        ${footerHtml}
      </div>
    </div>`;
}

/** +/- buttons on product cards change the qty input value */
function changeQty(productId, delta) {
  const input = document.getElementById('qty-' + productId);
  if (!input) return;
  let val = parseInt(input.value, 10) || 1;
  val = Math.max(1, val + delta);
  input.value = val;
}

/** Clamp manual input to min 1 */
function clampQty(productId, input) {
  let val = parseInt(input.value, 10);
  if (isNaN(val) || val < 1) val = 1;
  input.value = val;
}

/** Handle "Add to Order" button click on product card */
function handleAddToCart(productId) {
  const input = document.getElementById('qty-' + productId);
  const qty   = parseInt(input ? input.value : 1, 10) || 1;

  addToCart(productId, qty);

  // Animate the button
  const btn = document.getElementById('addbtn-' + productId);
  if (btn) {
    const original = btn.innerHTML;
    btn.classList.add('added');
    btn.innerHTML = '✓ Added!';
    setTimeout(() => {
      btn.classList.remove('added');
      btn.innerHTML = original;
    }, 1500);
  }

  showToast(`Added ${qty} × ${state.products.find(p => p.id === productId)?.name || ''} to your order.`);
}


/* ════════════════════════════════════════════════
   RENDER: CHECKOUT
   ════════════════════════════════════════════════ */

function renderCheckout() {
  const container = document.getElementById('checkoutContainer');
  if (!container) return;

  if (state.cart.length === 0) {
    container.innerHTML = `
      <div class="checkout-layout" style="grid-template-columns:1fr;">
        <div class="checkout-card">
          <div class="empty-cart">
            <div class="empty-cart-icon">🛒</div>
            <p style="font-size:1.05rem;font-weight:600;color:var(--brand-dark);margin-bottom:8px;">Your order is empty</p>
            <p>Browse our products and add items to get started.</p>
            <button class="btn btn-primary mt-3" style="margin-top:20px;" onclick="navigate('products')">
              Browse Products →
            </button>
          </div>
        </div>
      </div>`;
    return;
  }

  const subtotal = cartSubtotal();
  const tax      = 0; // Add tax calculation here if needed (e.g., subtotal * 0.08)
  const total    = subtotal + tax;

  container.innerHTML = `
    <div class="checkout-layout">
      <!-- Left: cart items -->
      <div>
        <div class="checkout-card" style="margin-bottom:24px;">
          <div class="checkout-card-header">🛒 Order Items</div>
          <div class="checkout-card-body" style="padding:0 28px;">
            <table class="cart-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${state.cart.map(item => renderCartRow(item)).join('')}
              </tbody>
            </table>
          </div>
          <div class="cart-totals">
            <div class="totals-row">
              <span>Subtotal</span>
              <span>$${subtotal.toFixed(2)}</span>
            </div>
            ${tax > 0 ? `<div class="totals-row"><span>Tax</span><span>$${tax.toFixed(2)}</span></div>` : ''}
            <div class="totals-row total">
              <span>Total</span>
              <span>$${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <!-- Continue shopping link -->
        <button class="btn btn-ghost btn-sm" onclick="navigate('products')" style="color:var(--brand);">
          ← Continue Shopping
        </button>
      </div>

      <!-- Right: customer info + submit -->
      <div>
        <div class="checkout-card">
          <div class="checkout-card-header">📋 Your Details</div>
          <div class="checkout-card-body">
            <form id="orderForm" onsubmit="handleOrderSubmit(event)" novalidate>

              <div class="form-group">
                <label class="form-label" for="cName">Your Name <span class="form-required">*</span></label>
                <input class="form-input" type="text" id="cName" required placeholder="Jane Smith" autocomplete="name" />
              </div>

              <div class="form-group">
                <label class="form-label" for="cBusiness">Business Name <span class="form-required">*</span></label>
                <input class="form-input" type="text" id="cBusiness" required placeholder="Acme Florist" autocomplete="organization" />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" for="cPhone">Phone <span class="form-required">*</span></label>
                  <input class="form-input" type="tel" id="cPhone" required placeholder="(555) 555-5555" autocomplete="tel" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="cEmail">Email <span class="form-required">*</span></label>
                  <input class="form-input" type="email" id="cEmail" required placeholder="you@example.com" autocomplete="email" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="cNotes">Notes / Special Requests</label>
                <textarea class="form-textarea" id="cNotes" placeholder="Delivery instructions, substitutions, etc." style="min-height:80px;"></textarea>
              </div>

              <button type="submit" class="btn btn-primary" style="width:100%;font-size:1rem;padding:14px;">
                ✅ Place Order — $${total.toFixed(2)}
              </button>

              <p style="font-size:0.78rem;color:var(--text-light);text-align:center;margin-top:12px;">
                We'll confirm your order by email or phone within 24 hours.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>`;
}

/** HTML for a single cart row in the checkout table */
function renderCartRow(item) {
  const subtotal = item.price * item.quantity;
  const isImage  = item.icon && item.icon.startsWith('http');
  const iconHtml = isImage
    ? `<img src="${escapeHtml(item.icon)}" alt="" style="width:28px;height:28px;object-fit:contain;" />`
    : `<span aria-hidden="true">${escapeHtml(item.icon || '🌱')}</span>`;

  return `
    <tr>
      <td>
        <div class="cart-item-info">
          <div class="cart-item-icon">${iconHtml}</div>
          <div>
            <div class="cart-item-name">${escapeHtml(item.name)}</div>
            <div class="cart-item-unit">${escapeHtml(item.unit)}</div>
          </div>
        </div>
      </td>
      <td>
        <div class="cart-qty-control">
          <button class="cart-qty-btn" onclick="adjustCheckoutQty('${item.productId}', -1)" aria-label="Decrease">−</button>
          <span class="cart-qty-num">${item.quantity}</span>
          <button class="cart-qty-btn" onclick="adjustCheckoutQty('${item.productId}', 1)" aria-label="Increase">+</button>
        </div>
      </td>
      <td>$${Number(item.price).toFixed(2)}</td>
      <td style="font-weight:600;">$${subtotal.toFixed(2)}</td>
      <td>
        <button class="cart-remove-btn" onclick="removeFromCart('${item.productId}')" aria-label="Remove ${escapeHtml(item.name)} from order">✕</button>
      </td>
    </tr>`;
}

/** Increase/decrease qty on checkout page */
function adjustCheckoutQty(productId, delta) {
  const item = state.cart.find(c => c.productId === productId);
  if (!item) return;
  const newQty = item.quantity + delta;
  if (newQty < 1) {
    if (confirm(`Remove ${item.name} from your order?`)) {
      removeFromCart(productId);
    }
    return;
  }
  setCartQty(productId, newQty);
  renderCheckout();
}


/* ════════════════════════════════════════════════
   ORDER SUBMISSION
   ════════════════════════════════════════════════ */

function handleOrderSubmit(e) {
  e.preventDefault();

  // Validate all required fields
  const form = document.getElementById('orderForm');
  if (!form) return;

  const name     = document.getElementById('cName').value.trim();
  const business = document.getElementById('cBusiness').value.trim();
  const phone    = document.getElementById('cPhone').value.trim();
  const email    = document.getElementById('cEmail').value.trim();
  const notes    = document.getElementById('cNotes').value.trim();

  if (!name || !business || !phone || !email) {
    showToast('Please fill in all required fields.', 'error');
    return;
  }

  if (!isValidEmail(email)) {
    showToast('Please enter a valid email address.', 'error');
    return;
  }

  // Build order object
  const order = {
    id:       'GL-' + Date.now(),
    date:     new Date().toISOString(),
    status:   'New',
    customer: { name, business, phone, email, notes },
    items:    state.cart.map(item => ({ ...item })),
    total:    cartSubtotal(),
  };

  // Save order
  state.orders = loadOrders();
  state.orders.unshift(order); // newest first
  saveOrders(state.orders);

  // Clear cart
  clearCart();

  // Show success screen
  const container = document.getElementById('checkoutContainer');
  container.innerHTML = `
    <div class="order-success">
      <div class="order-success-icon">🎉</div>
      <h2>Order Submitted!</h2>
      <p>
        Thank you, <strong>${escapeHtml(name)}</strong>!<br />
        Your order <strong>${order.id}</strong> has been received.<br />
        We'll reach out to <strong>${escapeHtml(email)}</strong> to confirm.
      </p>
      <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="navigate('products')">Place Another Order</button>
        <button class="btn btn-outline" onclick="navigate('home')">Back to Home</button>
      </div>
    </div>`;

  showToast(`Order ${order.id} submitted successfully!`, 'success');
}


/* ════════════════════════════════════════════════
   ADMIN — PIN GATE
   ════════════════════════════════════════════════ */

let pendingAdminNav = false;

function openPinModal() {
  const overlay = document.getElementById('pinModal');
  if (!overlay) return;
  overlay.classList.add('open');
  setTimeout(() => document.getElementById('pinInput')?.focus(), 100);
  // Clear previous input and error
  const pinInput = document.getElementById('pinInput');
  const pinError = document.getElementById('pinError');
  if (pinInput) pinInput.value = '';
  if (pinError) pinError.style.display = 'none';
}

function closePinModal() {
  const overlay = document.getElementById('pinModal');
  if (overlay) overlay.classList.remove('open');
  pendingAdminNav = false;
  // If we were going to admin but cancelled, stay on current page
  if (window.location.hash === '#gl-admin') history.back();
}

function submitPin() {
  const input = document.getElementById('pinInput');
  const error = document.getElementById('pinError');
  if (!input) return;

  if (input.value === ADMIN_PIN) {
    sessionStorage.setItem('gl_admin_auth', '1');
    const overlay = document.getElementById('pinModal');
    if (overlay) overlay.classList.remove('open');

    if (pendingAdminNav) {
      pendingAdminNav = false;
      navigate('admin');
    }
  } else {
    if (error) { error.style.display = 'block'; }
    input.value = '';
    input.focus();
    setTimeout(() => { if (error) error.style.display = 'none'; }, 2000);
  }
}

// Close PIN modal on overlay click
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('pinModal')?.addEventListener('click', function(e) {
    if (e.target === this) closePinModal();
  });
});


/* ════════════════════════════════════════════════
   ADMIN — RENDER
   ════════════════════════════════════════════════ */

let adminCurrentTab    = 'orders';
let adminProductFilter = 'All';
let adminProductSearch = '';

function renderAdmin() {
  syncState();
  renderAdminOrders();
  renderAdminProducts();
}

function switchAdminTab(tab) {
  adminCurrentTab = tab;

  document.querySelectorAll('.admin-tab').forEach(t => {
    t.classList.toggle('active', t.id === 'tab-' + tab);
    t.setAttribute('aria-selected', t.id === 'tab-' + tab);
  });

  document.querySelectorAll('.admin-tab-panel').forEach(p => {
    p.classList.toggle('active', p.id === 'panel-' + tab);
  });

  // Sync fresh data then re-render the active tab
  syncState();
  if (tab === 'products') renderAdminProducts();
  if (tab === 'orders')   renderAdminOrders();
}


/* ── Admin: Orders ──────────────────────────────────────── */

function renderAdminOrders() {
  const list = document.getElementById('adminOrdersList');
  const countEl = document.getElementById('ordersCount');
  if (!list) return;

  // Filter out any null/corrupted entries that could have been saved by older versions
  const orders = loadOrders().filter(o => o && typeof o === 'object');
  state.orders = orders;

  if (countEl) countEl.textContent = `${orders.length} order${orders.length !== 1 ? 's' : ''} total`;

  if (orders.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <h3>No Orders Yet</h3>
        <p>Submitted orders will appear here.</p>
      </div>`;
    return;
  }

  // Render each card individually so one malformed order never blocks the rest.
  // The newest order (index 0) is auto-expanded so it's immediately visible.
  const cards = orders.map((order, idx) => {
    try {
      return renderOrderCard(order, idx === 0);
    } catch (err) {
      const safeId = escapeHtml(String(order && order.id ? order.id : 'unknown'));
      return `
        <div class="order-card" style="border-color:#f87171;">
          <div class="order-card-header" style="color:#991b1b;">
            <span class="order-id">${safeId}</span>
            <span style="font-size:0.8rem;margin-left:8px;">Could not display — malformed order data.</span>
            <button class="btn btn-danger btn-sm" style="margin-left:auto;" onclick="deleteOrder('${safeId}')">🗑 Delete</button>
          </div>
        </div>`;
    }
  });

  list.innerHTML = `<div class="order-list">${cards.join('')}</div>`;
}

function renderOrderCard(order, autoExpand) {
  // Normalise all fields so missing data never throws
  const id       = order.id       || ('GL-' + Date.now());
  const dateStr  = order.date     || new Date().toISOString();
  const status   = order.status   || 'New';
  const customer = order.customer || {};
  const items    = Array.isArray(order.items) ? order.items : [];
  const total    = Number(order.total) || 0;

  const date = new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const statusSlug  = status.toLowerCase().replace(/\s+/g, '-');
  const statusClass = 'status-' + statusSlug;
  const statuses    = ['New', 'Processing', 'Ready', 'Completed', 'Cancelled'];

  const itemsHtml = items.length
    ? items.map(item => `
        <tr>
          <td>${escapeHtml(item.icon || '🌱')} ${escapeHtml(item.name || '')}</td>
          <td>${Number(item.quantity) || 0}</td>
          <td>${escapeHtml(item.unit || '')}</td>
          <td>$${Number(item.price || 0).toFixed(2)}</td>
          <td>$${(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</td>
        </tr>`).join('')
    : `<tr><td colspan="5" style="color:var(--text-muted);font-style:italic;padding:12px;">No items recorded.</td></tr>`;

  const expandedClass = autoExpand ? ' expanded' : '';

  return `
    <div class="order-card${expandedClass}" id="order-card-${id}">
      <div class="order-card-header" onclick="toggleOrderCard('${id}')" role="button" tabindex="0"
        onkeydown="if(event.key==='Enter')toggleOrderCard('${id}')">
        <span class="order-id">${escapeHtml(id)}</span>
        <span class="order-date">${date}</span>
        <span class="order-customer">👤 ${escapeHtml(customer.name || 'Unknown')} — ${escapeHtml(customer.business || '')}</span>
        <span class="order-status-badge ${statusClass}">${escapeHtml(status)}</span>
        <span class="order-total">$${total.toFixed(2)}</span>
        <span class="order-chevron">▶</span>
      </div>
      <div class="order-card-body">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:16px 0;padding:16px;background:var(--surface);border-radius:var(--radius-sm);">
          <div><strong style="font-size:0.75rem;text-transform:uppercase;color:var(--text-light);">Phone</strong><br />${escapeHtml(customer.phone || '—')}</div>
          <div><strong style="font-size:0.75rem;text-transform:uppercase;color:var(--text-light);">Email</strong><br />${escapeHtml(customer.email || '—')}</div>
          ${customer.notes ? `<div style="grid-column:1/-1;"><strong style="font-size:0.75rem;text-transform:uppercase;color:var(--text-light);">Notes</strong><br />${escapeHtml(customer.notes)}</div>` : ''}
        </div>
        <table class="order-items-table">
          <thead>
            <tr><th>Product</th><th>Qty</th><th>Unit</th><th>Price</th><th>Subtotal</th></tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="text-align:right;font-weight:700;font-size:1.05rem;color:var(--brand);padding-top:8px;border-top:1px solid var(--border);margin-top:8px;">
          Order Total: $${total.toFixed(2)}
        </div>
        <div class="order-actions">
          <label style="font-size:0.85rem;font-weight:500;color:var(--text-muted);">Status:</label>
          <select class="order-status-select" onchange="updateOrderStatus('${id}', this.value)">
            ${statuses.map(s => `<option value="${s}"${s === status ? ' selected' : ''}>${s}</option>`).join('')}
          </select>
          <button class="btn btn-danger btn-sm" onclick="deleteOrder('${id}')">🗑 Delete Order</button>
        </div>
      </div>
    </div>`;
}

function toggleOrderCard(orderId) {
  const card = document.getElementById('order-card-' + orderId);
  if (card) card.classList.toggle('expanded');
}

function updateOrderStatus(orderId, newStatus) {
  const orders = loadOrders();
  const order  = orders.find(o => o.id === orderId);
  if (order) {
    order.status = newStatus;
    saveOrders(orders);
    state.orders = orders;
    // Update badge without full re-render
    const card = document.getElementById('order-card-' + orderId);
    if (card) {
      const badge = card.querySelector('.order-status-badge');
      if (badge) {
        badge.className = `order-status-badge status-${newStatus.toLowerCase().replace(' ', '-')}`;
        badge.textContent = newStatus;
      }
    }
    showToast(`Order ${orderId} marked as ${newStatus}.`, 'info');
  }
}

function deleteOrder(orderId) {
  if (!confirm('Delete this order? This cannot be undone.')) return;
  state.orders = loadOrders().filter(o => o.id !== orderId);
  saveOrders(state.orders);
  renderAdminOrders();
  showToast('Order deleted.', 'info');
}


/* ── Admin: Products ─────────────────────────────────────── */

function renderAdminProducts() {
  const grid = document.getElementById('adminProductsGrid');
  if (!grid) return;

  const products = loadProducts() || [];
  state.products = products;

  // Update category datalist for the product modal
  updateCategoryDatalist(products);

  // Update product count badge
  const countEl = document.getElementById('adminProductCount');
  if (countEl) countEl.textContent = `${products.length} item${products.length !== 1 ? 's' : ''}`;

  // Render category filter pills
  renderAdminProductFilters(products);

  // Apply filter + search
  let filtered = products.filter(p => {
    const matchCat  = adminProductFilter === 'All' || p.category === adminProductFilter;
    const matchText = !adminProductSearch ||
      p.name.toLowerCase().includes(adminProductSearch) ||
      p.description.toLowerCase().includes(adminProductSearch) ||
      p.category.toLowerCase().includes(adminProductSearch);
    return matchCat && matchText;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="padding:52px 0;">
        <div class="empty-state-icon">🌿</div>
        <h3 style="font-family:'Cormorant Garamond',serif;">${products.length === 0 ? 'No Products Yet' : 'No Results'}</h3>
        <p>${products.length === 0 ? 'Click "+ Add Product" to add your first item.' : 'Try a different filter or search term.'}</p>
      </div>`;
    return;
  }

  grid.innerHTML = `
    <div class="admin-products-table-wrap">
      <table class="admin-products-table" role="table">
        <thead>
          <tr>
            <th class="apcol-icon"></th>
            <th class="apcol-product">Product</th>
            <th class="apcol-category">Category</th>
            <th class="apcol-price">Price</th>
            <th class="apcol-unit">Unit</th>
            <th class="apcol-status">Status</th>
            <th class="apcol-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(p => renderAdminProductRow(p)).join('')}
        </tbody>
      </table>
    </div>`;
}

/** Render category filter pills above the product table */
function renderAdminProductFilters(products) {
  const wrap = document.getElementById('adminProductFilters');
  if (!wrap) return;

  const categories = ['All', ...new Set(products.map(p => p.category))];
  wrap.innerHTML = categories.map(cat => `
    <button class="admin-filter-btn${cat === adminProductFilter ? ' active' : ''}"
      onclick="setAdminProductFilter('${escapeHtml(cat)}')">
      ${cat === 'All' ? '🌿 All' : `${getCategoryIcon(cat)} ${escapeHtml(cat)}`}
    </button>
  `).join('');
}

/** Set category filter in admin and re-render */
function setAdminProductFilter(cat) {
  adminProductFilter = cat;
  renderAdminProducts();
}

/** Handle search input in admin products */
function onAdminProductSearch(val) {
  adminProductSearch = val.trim().toLowerCase();
  renderAdminProducts();
}

/** Build HTML for a single product row in the admin table */
function renderAdminProductRow(product) {
  const isImage = product.icon && product.icon.startsWith('http');
  const iconHtml = isImage
    ? `<img src="${escapeHtml(product.icon)}" alt="" class="aprow-img" onerror="this.style.display='none'" />`
    : `<span class="aprow-emoji" aria-hidden="true">${escapeHtml(product.icon || '🌱')}</span>`;

  return `
    <tr class="admin-product-row${!product.available ? ' ap-unavailable' : ''}">
      <td class="apcol-icon">
        <div class="aprow-icon-wrap">${iconHtml}</div>
      </td>
      <td class="apcol-product">
        <div class="aprow-name">${escapeHtml(product.name)}</div>
        <div class="aprow-desc">${escapeHtml(product.description)}</div>
      </td>
      <td class="apcol-category">
        <span class="ap-cat-tag">${getCategoryIcon(product.category)} ${escapeHtml(product.category)}</span>
      </td>
      <td class="apcol-price">
        <span class="aprow-price">$${Number(product.price).toFixed(2)}</span>
      </td>
      <td class="apcol-unit">
        <span class="aprow-unit">${escapeHtml(product.unit)}</span>
      </td>
      <td class="apcol-status">
        <button class="ap-status-toggle${product.available ? ' is-available' : ''}"
          onclick="toggleProductAvailability('${product.id}')"
          title="${product.available ? 'Click to mark unavailable' : 'Click to mark available'}">
          <span class="ap-status-dot"></span>
          ${product.available ? 'Available' : 'Unavailable'}
        </button>
      </td>
      <td class="apcol-actions">
        <div class="aprow-actions">
          <button class="ap-edit-btn" onclick="openProductModal('${product.id}')" title="Edit product">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>
          <button class="ap-delete-btn" onclick="deleteProduct('${product.id}')" title="Delete product">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            Delete
          </button>
        </div>
      </td>
    </tr>`;
}

function toggleProductAvailability(productId) {
  const products = loadProducts() || [];
  const product  = products.find(p => p.id === productId);
  if (product) {
    product.available = !product.available;
    saveProducts(products);
    state.products = products;
    renderAdminProducts();
    showToast(`${product.name} marked as ${product.available ? 'Available' : 'Unavailable'}.`, 'info');
  }
}

function deleteProduct(productId) {
  const product = (loadProducts() || []).find(p => p.id === productId);
  if (!product) return;
  if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;

  state.products = (loadProducts() || []).filter(p => p.id !== productId);
  saveProducts(state.products);

  // Also remove from any existing carts (note: this only affects this browser's cart)
  state.cart = state.cart.filter(c => c.productId !== productId);
  saveCart(state.cart);
  updateCartBadge();

  renderAdminProducts();
  showToast(`"${product.name}" deleted.`, 'info');
}

/** Update the category autocomplete datalist */
function updateCategoryDatalist(products) {
  const dl = document.getElementById('categoryDatalist');
  if (!dl) return;
  const cats = [...new Set(products.map(p => p.category))];
  dl.innerHTML = cats.map(c => `<option value="${escapeHtml(c)}">`).join('');
}


/* ════════════════════════════════════════════════
   ADMIN — PRODUCT MODAL (Add / Edit)
   ════════════════════════════════════════════════ */

/**
 * Open the product add/edit modal.
 * @param {string|null} productId - omit to add new, pass id to edit
 */
function openProductModal(productId) {
  const overlay = document.getElementById('productModal');
  const title   = document.getElementById('productModalTitle');
  if (!overlay) return;

  // Reset form
  document.getElementById('editProductId').value = '';
  document.getElementById('pName').value      = '';
  document.getElementById('pDesc').value      = '';
  document.getElementById('pCategory').value  = '';
  document.getElementById('pUnit').value      = '';
  document.getElementById('pPrice').value     = '';
  document.getElementById('pIcon').value      = '';
  document.getElementById('pAvailable').checked = true;

  if (productId) {
    // Edit mode
    const product = (loadProducts() || []).find(p => p.id === productId);
    if (!product) return;

    title.textContent = 'Edit Product';
    document.getElementById('editProductId').value = product.id;
    document.getElementById('pName').value         = product.name;
    document.getElementById('pDesc').value         = product.description;
    document.getElementById('pCategory').value     = product.category;
    document.getElementById('pUnit').value         = product.unit;
    document.getElementById('pPrice').value        = product.price;
    document.getElementById('pIcon').value         = product.icon || '';
    document.getElementById('pAvailable').checked  = product.available;
  } else {
    title.textContent = 'Add New Product';
  }

  overlay.classList.add('open');
  setTimeout(() => document.getElementById('pName')?.focus(), 100);
}

function closeProductModal() {
  const overlay = document.getElementById('productModal');
  if (overlay) overlay.classList.remove('open');
}

// Close on overlay click
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('productModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeProductModal();
  });
});

/** Save new or edited product from modal form */
function saveProduct() {
  const id       = document.getElementById('editProductId').value;
  const name     = document.getElementById('pName').value.trim();
  const desc     = document.getElementById('pDesc').value.trim();
  const category = document.getElementById('pCategory').value.trim();
  const unit     = document.getElementById('pUnit').value.trim();
  const price    = parseFloat(document.getElementById('pPrice').value);
  const icon     = document.getElementById('pIcon').value.trim() || '🌱';
  const available= document.getElementById('pAvailable').checked;

  // Validation
  if (!name || !desc || !category || !unit || isNaN(price) || price < 0) {
    showToast('Please fill in all required fields correctly.', 'error');
    return;
  }

  const products = loadProducts() || [];

  if (id) {
    // Edit existing
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
      products[idx] = { ...products[idx], name, description: desc, category, unit, price, icon, available };
      showToast(`"${name}" updated.`, 'success');
    }
  } else {
    // Add new — generate a unique id
    const newProduct = {
      id:          'p' + Date.now(),
      name,
      description: desc,
      category,
      unit,
      price,
      icon,
      available,
    };
    products.push(newProduct);
    showToast(`"${name}" added to catalog.`, 'success');
  }

  saveProducts(products);
  state.products = products;

  closeProductModal();
  renderAdminProducts();
}


/* ════════════════════════════════════════════════
   CONTACT FORM
   ════════════════════════════════════════════════ */

function handleContactSubmit(e) {
  e.preventDefault();
  const name  = document.getElementById('contactName').value.trim();
  const email = document.getElementById('contactEmail').value.trim();

  if (!isValidEmail(email)) {
    showToast('Please enter a valid email.', 'error');
    return;
  }

  // In a real implementation, this would POST to a backend or send to an email API.
  // For now, just show a success message.
  const form = document.getElementById('contactForm');
  form.innerHTML = `
    <div style="text-align:center;padding:24px 0;">
      <div style="font-size:3rem;margin-bottom:16px;">✉️</div>
      <h3 style="font-size:1.3rem;color:var(--brand-dark);margin-bottom:8px;">Message Sent!</h3>
      <p style="color:var(--text-muted);">Thanks, ${escapeHtml(name)}! We'll be in touch soon.</p>
    </div>`;

  showToast('Message sent! We\'ll be in touch soon.', 'success');
}


/* ════════════════════════════════════════════════
   SEARCH
   ════════════════════════════════════════════════ */

function initSearch() {
  const input = document.getElementById('productSearch');
  if (!input) return;

  let searchTimer;
  input.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchQuery = input.value.trim().toLowerCase();
      renderProductList();
    }, 250);
  });
}


/* ════════════════════════════════════════════════
   UTILITIES
   ════════════════════════════════════════════════ */

/** Escape HTML to prevent XSS when inserting user/data strings into innerHTML */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Generate unique ID */
function uid() {
  return 'p' + Math.random().toString(36).slice(2, 9);
}


/* ════════════════════════════════════════════════
   INIT — runs on DOMContentLoaded
   ════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // Seed default data on first load
  initData();

  // Sync in-memory state from localStorage
  syncState();

  // Set footer year
  const yearEl = document.getElementById('footerYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Init mobile nav
  initMobileNav();

  // Init logo admin trigger (click 5× to open admin)
  initLogoAdminTrigger();

  // Init logo fallbacks
  initLogos();

  // Init product search
  initSearch();

  // Init cart badge
  updateCartBadge();

  // Wire nav links to routing
  document.querySelectorAll('.nav-link[data-section]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      navigate(link.dataset.section);
    });
  });

  // Route based on current URL hash
  handleHashChange();
});
