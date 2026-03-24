/* ============================================================
   GREEN LIFE FLOWERS — CART
   Handles: cart state, drawer UI, add/remove/update, persistence
   ============================================================ */

const Cart = (() => {
  const STORAGE_KEY = 'greenlife_cart';

  /* ── State ── */
  let items = [];
  let drawerOpen = false;

  /* ── Init ── */
  function init() {
    load();
    bindUI();
    render();
  }

  /* ── Persist / load ── */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      items = raw ? JSON.parse(raw) : [];
    } catch {
      items = [];
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  /* ── Public: add item ── */
  function add(product, qty = 1) {
    qty = Math.max(1, Math.min(qty, 999));
    const existing = items.find(i => i.id === product.id);
    if (existing) {
      existing.qty = Math.min(existing.qty + qty, 999);
    } else {
      items.push({
        id:       product.id,
        name:     product.name,
        category: product.category,
        price:    product.price,
        unit:     product.unit,
        image:    product.image,
        tiers:    product.tiers || null,
        qty,
      });
    }
    save();
    render();
    animateCartCount();
    showToast(`${product.name} added to cart`, 'success');
  }

  /* ── Public: update quantity ── */
  function updateQty(id, delta) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    item.qty = Math.max(1, Math.min(item.qty + delta, 999));
    save();
    render();
  }

  function setQty(id, qty) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const parsed = parseInt(qty, 10);
    if (isNaN(parsed) || parsed < 1) return;
    item.qty = Math.min(parsed, 999);
    save();
    render();
  }

  /* ── Public: remove item ── */
  function remove(id) {
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return;
    const name = items[idx].name;
    items.splice(idx, 1);
    save();
    render();
    showToast(`${name} removed`, '');
  }

  /* ── Public: clear cart ── */
  function clear() {
    items = [];
    save();
    render();
  }

  /* ── Public: getters ── */
  function getItems() { return [...items]; }
  function getCount() { return items.reduce((sum, i) => sum + i.qty, 0); }
  function getItemPrice(item) {
    if (!item.tiers || item.tiers.length === 0) return item.price;
    let best = item.tiers[0].price;
    for (const tier of item.tiers) {
      if (item.qty >= tier.min) best = tier.price;
    }
    return best;
  }
  function getSubtotal() { return items.reduce((sum, i) => sum + getItemPrice(i) * i.qty, 0); }
  function isEmpty() { return items.length === 0; }

  /* ── Drawer ── */
  function openDrawer() {
    drawerOpen = true;
    const drawer   = document.getElementById('cartDrawer');
    const backdrop = document.getElementById('cartBackdrop');
    if (!drawer || !backdrop) return;
    drawer.classList.add('open');
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawerOpen = false;
    const drawer   = document.getElementById('cartDrawer');
    const backdrop = document.getElementById('cartBackdrop');
    if (!drawer || !backdrop) return;
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ── Bind UI events ── */
  function bindUI() {
    // Cart button in nav
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-open-cart]');
      if (btn) openDrawer();
    });

    // Close button
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-close-cart]');
      if (btn) closeDrawer();
    });

    // Backdrop click
    const backdrop = document.getElementById('cartBackdrop');
    if (backdrop) backdrop.addEventListener('click', closeDrawer);

    // ESC key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && drawerOpen) closeDrawer();
    });

    // Continue shopping
    document.addEventListener('click', e => {
      if (e.target.closest('[data-continue-shopping]')) closeDrawer();
    });

    // Go to checkout
    document.addEventListener('click', e => {
      if (e.target.closest('[data-go-checkout]')) {
        if (isEmpty()) {
          showToast('Your cart is empty', '');
          return;
        }
        window.location.href = 'checkout.html';
      }
    });

    // Cart item qty controls (delegated)
    document.addEventListener('click', e => {
      const incBtn = e.target.closest('[data-cart-inc]');
      const decBtn = e.target.closest('[data-cart-dec]');
      const remBtn = e.target.closest('[data-cart-remove]');

      if (incBtn) updateQty(incBtn.dataset.cartInc,  +1);
      if (decBtn) {
        const id = decBtn.dataset.cartDec;
        const item = items.find(i => i.id === id);
        if (item && item.qty <= 1) remove(id);
        else updateQty(id, -1);
      }
      if (remBtn) remove(remBtn.dataset.cartRemove);
    });
  }

  /* ── Render full cart UI ── */
  function render() {
    renderCount();
    renderItems();
    renderTotals();
  }

  function renderCount() {
    const count = getCount();
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      el.textContent = count;
      el.style.display = count === 0 ? 'none' : '';
    });
  }

  function renderItems() {
    const list  = document.getElementById('cartItemsList');
    const empty = document.getElementById('cartEmpty');
    if (!list) return;

    if (items.length === 0) {
      list.innerHTML = '';
      if (empty) empty.style.display = '';
      return;
    }

    if (empty) empty.style.display = 'none';

    list.innerHTML = items.map(item => {
      const currentPrice = getItemPrice(item);
      const isDiscounted = currentPrice < item.price;
      const priceDisplay = isDiscounted
        ? `<span class="cart-item-price-was">$${item.price.toFixed(2)}</span> <span class="cart-item-price-now">$${currentPrice.toFixed(2)}</span> ${item.unit}`
        : `$${item.price.toFixed(2)} ${item.unit}`;
      const lineTotal = (currentPrice * item.qty).toFixed(2);
      const savingsLine = isDiscounted
        ? `<div class="cart-item-savings">Volume price — you save $${((item.price - currentPrice) * item.qty).toFixed(2)}</div>`
        : '';
      return `
      <div class="cart-item" data-item-id="${item.id}">
        <img class="cart-item-img" src="${item.image}?w=144&q=75" alt="${item.name}" loading="lazy">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${priceDisplay}</div>
          ${savingsLine}
          <div class="cart-item-line-total">Line total: $${lineTotal}</div>
        </div>
        <div class="cart-item-controls">
          <div class="cart-item-qty">
            <button class="cart-qty-btn" data-cart-dec="${item.id}" aria-label="Decrease quantity">−</button>
            <span class="cart-qty-num">${item.qty}</span>
            <button class="cart-qty-btn" data-cart-inc="${item.id}" aria-label="Increase quantity">+</button>
          </div>
          <button class="cart-item-remove" data-cart-remove="${item.id}" aria-label="Remove item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>`;
    }).join('');
  }

  function renderTotals() {
    const subtotal = getSubtotal();
    const count    = getCount();

    document.querySelectorAll('[data-cart-subtotal]').forEach(el => {
      el.textContent = `$${subtotal.toFixed(2)}`;
    });
    document.querySelectorAll('[data-cart-total]').forEach(el => {
      el.textContent = `$${subtotal.toFixed(2)}`;
    });
    document.querySelectorAll('[data-cart-item-count-label]').forEach(el => {
      el.textContent = `${count} item${count !== 1 ? 's' : ''}`;
    });
  }

  /* ── Cart count bounce ── */
  function animateCartCount() {
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      el.classList.remove('animate');
      void el.offsetWidth;
      el.classList.add('animate');
      el.addEventListener('animationend', () => el.classList.remove('animate'), { once: true });
    });
  }

  /* ── Toast notifications ── */
  function showToast(message, type) {
    const container = document.getElementById('toastContainer') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : ''}`;

    const icon = type === 'success' ? '🌸' : type === 'error' ? '✕' : 'ℹ';
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;

    container.appendChild(toast);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('show'));
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 2800);
  }

  function createToastContainer() {
    const el = document.createElement('div');
    el.id = 'toastContainer';
    el.className = 'toast-container';
    document.body.appendChild(el);
    return el;
  }

  /* ── Public API ── */
  return {
    init,
    add,
    remove,
    clear,
    updateQty,
    setQty,
    getItems,
    getCount,
    getSubtotal,
    isEmpty,
    openDrawer,
    closeDrawer,
    showToast,
  };
})();
