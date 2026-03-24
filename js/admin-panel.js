/* ============================================================
   GREEN LIFE FLOWERS — EMBEDDED ADMIN PANEL
   Triggered: logo clicked 5 times within 2 seconds
   Features: view/delete orders · add/edit/remove products
   ============================================================ */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════
     1.  LOGO 5-CLICK TRIGGER + PASSWORD PROMPT
     ══════════════════════════════════════════════ */
  const ADMIN_ACCESS_CODE = '3456';

  (function initLogoTrigger() {
    const logo = document.getElementById('navLogo');
    if (!logo) return;

    let clicks = 0;
    let timer  = null;

    logo.addEventListener('click', e => {
      e.preventDefault();
      clicks++;

      if (timer) clearTimeout(timer);

      if (clicks >= 5) {
        clicks = 0;
        promptAdminPassword();
        return;
      }

      // Reset counter after 1.5 seconds of inactivity and navigate normally
      timer = setTimeout(() => {
        clicks = 0;
        // Single click — do normal logo navigation
        window.location.href = logo.href;
      }, 1500);
    });
  })();

  function promptAdminPassword() {
    const entered = prompt('Enter admin password:');
    if (entered === null) return; // cancelled
    if (entered === ADMIN_ACCESS_CODE) {
      openAdmin();
    } else {
      alert('Incorrect password.');
    }
  }

  /* ══════════════════════════════════════════════
     2.  PANEL OPEN / CLOSE
     ══════════════════════════════════════════════ */
  const overlay = document.getElementById('adminOverlay');
  const closeBtn = document.getElementById('adminCloseBtn');

  function openAdmin() {
    if (!overlay) return;
    // Seed demo orders if empty
    if (typeof Orders !== 'undefined') Orders.seedDemoIfEmpty();
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    renderOrdersTab();
    renderProductsTab();
    renderFlowerListTab();
    renderAboutTab();
  }

  function closeAdmin() {
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeAdmin);

  // Close on overlay backdrop click
  if (overlay) {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeAdmin();
    });
  }

  // ESC key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) {
      // If modal is open, close modal first
      const modal = document.getElementById('adminProductModal');
      if (modal && modal.classList.contains('open')) {
        closeProductModal();
      } else {
        closeAdmin();
      }
    }
  });

  /* ══════════════════════════════════════════════
     3.  TABS
     ══════════════════════════════════════════════ */
  document.querySelectorAll('[data-admin-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      // Deactivate all
      document.querySelectorAll('[data-admin-tab]').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));

      // Activate clicked
      btn.classList.add('active');
      const tab = btn.dataset.adminTab;
      const tabId = 'adminTab' + tab.charAt(0).toUpperCase() + tab.slice(1);
      const content = document.getElementById(tabId);
      if (content) content.classList.add('active');

      // Re-render the active tab's content
      if (tab === 'products') renderProductsTab();
      if (tab === 'orders') renderOrdersTab();
      if (tab === 'flowerList') renderFlowerListTab();
      if (tab === 'about') renderAboutTab();
    });
  });

  /* ══════════════════════════════════════════════
     4.  ORDERS TAB
     ══════════════════════════════════════════════ */
  function renderOrdersTab() {
    const tbody = document.getElementById('adminOrdersBody');
    const countEl = document.getElementById('adminOrderCount');
    if (!tbody || typeof Orders === 'undefined') return;

    const orders = Orders.getAll();
    if (countEl) countEl.textContent = `${orders.length} order${orders.length !== 1 ? 's' : ''}`;

    if (orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:32px 16px">No orders yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = orders.map(order => {
      const itemCount = order.items.reduce((s, i) => s + i.qty, 0);
      const statusClass = order.status === 'completed' ? 'completed' : 'pending';
      const statusLabel = order.status === 'completed' ? '✓ Completed' : '⏳ Pending';
      const dateStr = Orders.formatDate(order.createdAt);
      const custName = `${order.customer.firstName} ${order.customer.lastName}`;

      return `
        <tr>
          <td style="font-family:var(--font-display);font-size:0.8rem;font-weight:500;color:var(--dark)">${order.id}</td>
          <td>
            <div style="font-weight:500;color:var(--dark)">${escapeHtml(custName)}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">${escapeHtml(order.customer.email)}</div>
          </td>
          <td style="color:var(--text-light)">${itemCount} item${itemCount !== 1 ? 's' : ''}</td>
          <td style="font-family:var(--font-display);font-weight:500;color:var(--leaf)">$${(order.total || 0).toFixed(2)}</td>
          <td style="font-size:0.8rem;color:var(--text-muted)">${dateStr}</td>
          <td><span class="admin-status-badge ${statusClass}">${statusLabel}</span></td>
          <td>
            <div style="display:flex;gap:6px;align-items:center">
              <button class="admin-view-btn" data-view-order="${order.id}">View</button>
              <button class="admin-delete-btn" data-delete-order="${order.id}">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Bind view buttons
    tbody.querySelectorAll('[data-view-order]').forEach(btn => {
      btn.addEventListener('click', () => {
        openOrderDetail(btn.dataset.viewOrder);
      });
    });

    // Bind delete buttons
    tbody.querySelectorAll('[data-delete-order]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.deleteOrder;
        if (confirm(`Delete order ${id}? This cannot be undone.`)) {
          Orders.deleteOrder(id);
          renderOrdersTab();
          showAdminToast('Order deleted.', 'info');
        }
      });
    });
  }

  /* ══════════════════════════════════════════════
     4b.  ORDER DETAIL + STORE CREDIT
     ══════════════════════════════════════════════ */
  function openOrderDetail(orderId) {
    if (typeof Orders === 'undefined') return;
    const order = Orders.getById(orderId);
    if (!order) return;

    const c = order.customer;
    const isPending = order.status === 'pending';

    // Build order items HTML
    const itemsHTML = order.items.map(item =>
      `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:0.82rem;border-bottom:1px solid rgba(42,40,37,0.05)">
        <span style="color:var(--text-light)">${escapeHtml(item.name)} (${escapeHtml(item.unit)}) × ${item.qty}</span>
        <span style="color:var(--dark);font-weight:500">$${item.subtotal.toFixed(2)}</span>
      </div>`
    ).join('');

    // Build store credit section
    const creditHTML = buildCreditSection(order);

    // Get or create the modal
    let modal = document.getElementById('embeddedOrderModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'embeddedOrderModal';
      modal.className = 'embedded-order-modal';
      document.querySelector('.admin-panel').appendChild(modal);
    }

    modal.innerHTML = `
      <div class="embedded-order-modal-card">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px">
          <h3 style="font-family:var(--font-display);font-size:1.2rem;font-weight:500;color:var(--dark)">Order Details</h3>
          <button class="embedded-modal-close" id="embeddedModalClose" aria-label="Close">✕</button>
        </div>

        <div class="eom-section">
          <div class="eom-section-title">Order Info</div>
          <div class="eom-row"><span>Order ID</span><span style="font-family:var(--font-display);font-weight:500">${order.id}</span></div>
          <div class="eom-row"><span>Status</span><span><span class="admin-status-badge ${isPending ? 'pending' : 'completed'}">${isPending ? '⏳ Pending' : '✓ Completed'}</span></span></div>
          <div class="eom-row"><span>Date</span><span>${Orders.formatDate(order.createdAt)}</span></div>
        </div>

        <div class="eom-section">
          <div class="eom-section-title">Customer</div>
          <div class="eom-row"><span>Name</span><span>${escapeHtml(c.firstName)} ${escapeHtml(c.lastName)}</span></div>
          <div class="eom-row"><span>Email</span><span>${escapeHtml(c.email || '—')}</span></div>
          <div class="eom-row"><span>Phone</span><span>${escapeHtml(c.phone || '—')}</span></div>
          ${c.company ? `<div class="eom-row"><span>Company</span><span>${escapeHtml(c.company)}</span></div>` : ''}
          ${c.address ? `<div class="eom-row"><span>Address</span><span>${escapeHtml(c.address)}${c.city ? ', ' + escapeHtml(c.city) : ''}</span></div>` : ''}
          ${c.notes ? `<div class="eom-row"><span>Notes</span><span style="max-width:220px;text-align:right">${escapeHtml(c.notes)}</span></div>` : ''}
        </div>

        <div class="eom-section">
          <div class="eom-section-title">Order Items</div>
          ${itemsHTML}
          <div style="display:flex;justify-content:space-between;padding:10px 0 0;margin-top:6px;border-top:1px solid rgba(42,40,37,0.1);font-family:var(--font-display)">
            <span style="font-size:1rem;color:var(--dark)">Total</span>
            <span style="font-size:1.15rem;color:var(--leaf);font-weight:600">$${order.total.toFixed(2)}</span>
          </div>
        </div>

        ${isPending ? `
        <div style="margin-bottom:16px">
          <button class="admin-add-btn" style="width:100%;justify-content:center" id="embeddedCompleteBtn" data-complete-order="${order.id}">
            Mark as Completed
          </button>
        </div>` : ''}

        ${creditHTML}
      </div>
    `;

    modal.classList.add('open');

    // Auto-scroll modal card to bottom so store credit section is visible
    setTimeout(() => {
      const card = modal.querySelector('.embedded-order-modal-card');
      if (card) card.scrollTop = card.scrollHeight;
    }, 150);

    // Bind close
    document.getElementById('embeddedModalClose').addEventListener('click', () => {
      modal.classList.remove('open');
    });
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.classList.remove('open');
    });

    // Bind complete button
    const completeBtn = document.getElementById('embeddedCompleteBtn');
    if (completeBtn) {
      completeBtn.addEventListener('click', () => {
        Orders.updateStatus(orderId, 'completed');
        renderOrdersTab();
        openOrderDetail(orderId);
        showAdminToast('Order marked as completed!', 'success');
      });
    }

    // Bind add credit button
    const creditBtn = document.getElementById('embeddedCreditBtn');
    if (creditBtn) {
      creditBtn.addEventListener('click', () => {
        handleEmbeddedAddCredit(orderId, c.email);
      });
    }

    // Bind edit credit buttons
    modal.querySelectorAll('[data-edit-credit]').forEach(btn => {
      btn.addEventListener('click', () => {
        handleEmbeddedEditCredit(btn.dataset.editCredit, btn.dataset.orderId);
      });
    });

    // Bind delete credit buttons
    modal.querySelectorAll('[data-del-credit]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Remove this store credit? This cannot be undone.')) return;
        StoreCredit.deleteCredit(btn.dataset.delCredit);
        openOrderDetail(btn.dataset.orderId);
        showAdminToast('Credit removed.', 'info');
      });
    });
  }

  function handleEmbeddedEditCredit(creditId, orderId) {
    const credit = StoreCredit.getAll().find(c => c.id === creditId);
    if (!credit) return;

    const row = document.getElementById('emb-credit-' + creditId);
    if (!row) return;

    row.innerHTML = `
      <div style="width:100%;padding:4px 0">
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <div style="min-width:80px">
            <label style="display:block;font-size:0.65rem;font-weight:500;color:var(--text-light);margin-bottom:2px">Amount ($)</label>
            <input type="number" id="embEditAmt-${creditId}" value="${credit.amount}" min="0.01" step="0.01"
              style="width:100%;padding:7px 9px;border:1.5px solid rgba(42,40,37,0.12);border-radius:6px;background:#fff;font-family:var(--font-body);font-size:0.8rem;color:var(--dark);outline:none" />
          </div>
          <div style="flex:1">
            <label style="display:block;font-size:0.65rem;font-weight:500;color:var(--text-light);margin-bottom:2px">Reason</label>
            <input type="text" id="embEditNote-${creditId}" value="${escapeHtml(credit.note || '')}" maxlength="200"
              style="width:100%;padding:7px 9px;border:1.5px solid rgba(42,40,37,0.12);border-radius:6px;background:#fff;font-family:var(--font-body);font-size:0.8rem;color:var(--dark);outline:none" />
          </div>
        </div>
        <div style="display:flex;gap:6px">
          <button id="embSaveCredit-${creditId}" style="padding:5px 14px;border-radius:999px;font-size:0.72rem;font-weight:500;cursor:pointer;border:none;background:var(--sage);color:#fff;font-family:var(--font-body)">Save</button>
          <button id="embCancelCredit-${creditId}" style="padding:5px 14px;border-radius:999px;font-size:0.72rem;font-weight:500;cursor:pointer;border:none;background:var(--cream-deep);color:var(--text-light);font-family:var(--font-body)">Cancel</button>
        </div>
      </div>
    `;

    document.getElementById('embEditAmt-' + creditId).focus();

    document.getElementById('embSaveCredit-' + creditId).addEventListener('click', () => {
      const amt = parseFloat(document.getElementById('embEditAmt-' + creditId).value);
      if (!amt || amt <= 0) return;
      const note = document.getElementById('embEditNote-' + creditId).value.trim();
      StoreCredit.updateCredit(creditId, amt, note);
      openOrderDetail(orderId);
      showAdminToast('Credit updated!', 'success');
    });

    document.getElementById('embCancelCredit-' + creditId).addEventListener('click', () => {
      openOrderDetail(orderId);
    });
  }

  function buildCreditSection(order) {
    if (typeof StoreCredit === 'undefined') return '';

    const email = order.customer.email;
    const balance = StoreCredit.getBalance(email);
    const allCredits = StoreCredit.getByCustomer(email);

    const historyHTML = allCredits.length > 0
      ? allCredits.map(c => `
          <div class="eom-credit-item ${c.orderId === order.id ? 'eom-credit-this' : ''}" id="emb-credit-${c.id}">
            <div>
              <span style="font-family:var(--font-display);font-weight:600;color:#2F9E44;font-size:0.88rem">+$${c.amount.toFixed(2)}</span>
              <span style="font-size:0.75rem;color:var(--text-light);margin-left:8px">${escapeHtml(c.note) || 'No note'}</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <span style="font-size:0.7rem;color:var(--text-muted)">${StoreCredit.formatDate(c.createdAt)}</span>
              ${c.orderId === order.id
                ? '<span style="font-size:0.62rem;padding:2px 7px;background:rgba(74,124,89,0.1);color:var(--sage-dark);border-radius:999px;font-weight:500">This order</span>'
                : `<span style="font-size:0.62rem;color:var(--text-muted);font-family:monospace">${c.orderId}</span>`}
              <button class="emb-credit-edit" data-edit-credit="${c.id}" data-order-id="${order.id}" title="Edit" style="width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;border:none;cursor:pointer;font-size:0.65rem;background:rgba(74,124,89,0.1);color:var(--sage-dark);opacity:0.5;transition:opacity 0.15s"
                onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.5'">✎</button>
              <button class="emb-credit-del" data-del-credit="${c.id}" data-order-id="${order.id}" title="Remove" style="width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;border:none;cursor:pointer;font-size:0.65rem;background:rgba(192,57,43,0.08);color:#C0392B;opacity:0.5;transition:opacity 0.15s"
                onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.5'">✕</button>
            </div>
          </div>
        `).join('')
      : '<div style="font-size:0.78rem;color:var(--text-muted);padding:10px 0;text-align:center">No credits issued yet for this customer.</div>';

    return `
      <div class="eom-section" style="border-top:2px solid rgba(74,124,89,0.12);padding-top:16px;margin-top:8px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div class="eom-section-title" style="margin:0">Store Credit</div>
          <div style="display:flex;align-items:center;gap:8px;padding:4px 12px;background:#EBFBEE;border-radius:999px;border:1px solid rgba(47,158,68,0.15)">
            <span style="font-size:0.65rem;letter-spacing:0.06em;text-transform:uppercase;color:#2F9E44;font-weight:500">Balance</span>
            <span style="font-family:var(--font-display);font-size:0.95rem;font-weight:600;color:#2F9E44">$${balance.toFixed(2)}</span>
          </div>
        </div>

        <div style="background:var(--cream-deep);border-radius:8px;padding:14px;border:1px solid rgba(42,40,37,0.06);margin-bottom:12px">
          <div style="display:grid;grid-template-columns:100px 1fr;gap:8px;margin-bottom:10px">
            <div>
              <label style="display:block;font-size:0.7rem;font-weight:500;color:var(--text-light);margin-bottom:3px">Amount ($)</label>
              <input type="number" id="embeddedCreditAmount" min="0.01" step="0.01" placeholder="0.00"
                style="width:100%;padding:8px 10px;border:1.5px solid rgba(42,40,37,0.12);border-radius:6px;background:#fff;font-family:var(--font-body);font-size:0.82rem;color:var(--dark);outline:none" />
            </div>
            <div>
              <label style="display:block;font-size:0.7rem;font-weight:500;color:var(--text-light);margin-bottom:3px">Reason</label>
              <input type="text" id="embeddedCreditNote" placeholder="e.g. Damaged flowers" maxlength="200"
                style="width:100%;padding:8px 10px;border:1.5px solid rgba(42,40,37,0.12);border-radius:6px;background:#fff;font-family:var(--font-body);font-size:0.82rem;color:var(--dark);outline:none" />
            </div>
          </div>
          <button id="embeddedCreditBtn" type="button"
            style="display:inline-flex;align-items:center;gap:5px;padding:7px 16px;background:var(--sage);color:#fff;border:none;border-radius:999px;font-family:var(--font-body);font-size:0.75rem;font-weight:500;cursor:pointer;transition:background 0.2s,transform 0.15s"
            onmouseover="this.style.background='var(--sage-dark)'"
            onmouseout="this.style.background='var(--sage)'">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Store Credit
          </button>
        </div>

        <div>
          <div style="font-size:0.68rem;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px">Credit History</div>
          ${historyHTML}
        </div>
      </div>
    `;
  }

  function handleEmbeddedAddCredit(orderId, email) {
    if (typeof StoreCredit === 'undefined') return;
    const amountInput = document.getElementById('embeddedCreditAmount');
    const noteInput = document.getElementById('embeddedCreditNote');
    const amount = parseFloat(amountInput.value);
    const note = (noteInput.value || '').trim();

    if (!amount || amount <= 0) {
      amountInput.style.borderColor = '#C0392B';
      amountInput.focus();
      setTimeout(() => { amountInput.style.borderColor = ''; }, 2000);
      return;
    }

    StoreCredit.addCredit(email, orderId, amount, note);
    openOrderDetail(orderId);
    showAdminToast('Store credit added!', 'success');
  }

  /* ══════════════════════════════════════════════
     5.  PRODUCTS TAB
     ══════════════════════════════════════════════ */
  /* Category labels are derived from FlowerList (single source of truth).
     Products store category as the lowercased name (e.g. 'roses', 'pom pom'). */
  function getCategoryLabel(catKey) {
    return (catKey || '')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  /* Build an image src URL without doubling query params */
  function buildImgSrc(url) {
    if (!url) return 'https://placehold.co/400x240/E8F3E5/5A9460?text=Flower';
    return url.includes('?') ? url : url + '?w=400&q=70&fit=crop&auto=format';
  }

  function renderProductsTab() {
    const grid = document.getElementById('adminProductGrid');
    if (!grid) return;

    const products = (typeof getAllProducts !== 'undefined') ? getAllProducts() : [];

    if (products.length === 0) {
      grid.innerHTML = `<div style="color:var(--text-muted);font-size:0.85rem;grid-column:1/-1;padding:20px 0">No products yet. Click "Add New Product" to get started.</div>`;
      return;
    }

    grid.innerHTML = products.map(p => {
      const catLabel = getCategoryLabel(p.category) || '—';
      const desc = p.description ? escapeHtml(p.description).substring(0, 80) + (p.description.length > 80 ? '…' : '') : '';
      return `
        <div class="admin-product-card">
          <div class="admin-product-img-wrap">
            <img src="${buildImgSrc(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.src='https://placehold.co/400x240/E8F3E5/5A9460?text=Flower'">
            ${p.badge ? `<span class="admin-product-badge">${escapeHtml(p.badge)}</span>` : ''}
          </div>
          <div class="admin-product-info">
            <div class="admin-product-category">${catLabel}</div>
            <div class="admin-product-name">${escapeHtml(p.name)}</div>
            <div class="admin-product-price">$${p.price} <span class="admin-product-unit">${escapeHtml(p.unit)}</span></div>
            ${desc ? `<div class="admin-product-desc">${desc}</div>` : ''}
            <div class="admin-product-actions">
              <button class="admin-edit-btn" data-edit-product="${escapeHtml(p.id)}">✏ Edit</button>
              <button class="admin-delete-btn" data-remove-product="${escapeHtml(p.id)}">🗑 Delete</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Bind edit buttons
    grid.querySelectorAll('[data-edit-product]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.editProduct;
        const product = getAllProducts().find(p => p.id === id);
        if (product) openProductModal(product);
      });
    });

    // Bind delete buttons (all products)
    grid.querySelectorAll('[data-remove-product]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.removeProduct;
        const product = getAllProducts().find(p => p.id === id);
        const name = product ? product.name : 'this product';
        if (confirm(`Delete "${name}" from the shop? This cannot be undone.`)) {
          saveAllProducts(getAllProducts().filter(p => p.id !== id));
          renderProductsTab();
          showAdminToast('Product deleted.', 'info');
        }
      });
    });
  }

  /* ── Add product button ── */
  const addProductBtn = document.getElementById('adminAddProductBtn');
  if (addProductBtn) {
    addProductBtn.addEventListener('click', () => openProductModal(null));
  }

  /* ══════════════════════════════════════════════
     6.  PRODUCT MODAL (add / edit)
     ══════════════════════════════════════════════ */
  const productModal = document.getElementById('adminProductModal');
  const cancelProductBtn = document.getElementById('adminCancelProductBtn');
  const saveProductBtn   = document.getElementById('adminSaveProductBtn');

  /* ── Tier editor helpers ── */
  function renderTierEditor(tiers) {
    const editor = document.getElementById('adminTierEditor');
    if (!editor) return;

    const rows = (tiers && tiers.length > 0)
      ? tiers
      : [{min: 1, price: ''}];

    editor.innerHTML = rows.map((tier, i) => {
      const isBase = i === 0;
      return `
        <div class="admin-tier-row ${isBase ? 'admin-tier-row-base' : ''}" data-tier-index="${i}">
          <div class="admin-tier-field">
            <label>Min Qty</label>
            <input type="number" class="admin-tier-min" value="${tier.min}" min="1" ${isBase ? 'readonly' : ''} />
          </div>
          <div class="admin-tier-field">
            <label>Price ($)</label>
            <input type="number" class="admin-tier-price" value="${tier.price}" min="0" step="0.01" />
          </div>
          ${isBase ? '<span class="admin-tier-base-label">Base price</span>' : `<button type="button" class="admin-tier-remove-btn" data-remove-tier="${i}" title="Remove tier">✕</button>`}
        </div>`;
    }).join('');

    // Bind remove buttons
    editor.querySelectorAll('[data-remove-tier]').forEach(btn => {
      btn.addEventListener('click', () => {
        const currentTiers = readTiersFromEditor();
        const idx = parseInt(btn.dataset.removeTier);
        currentTiers.splice(idx, 1);
        renderTierEditor(currentTiers);
      });
    });
  }

  function readTiersFromEditor() {
    const editor = document.getElementById('adminTierEditor');
    if (!editor) return [];
    const rows = editor.querySelectorAll('.admin-tier-row');
    const tiers = [];
    rows.forEach(row => {
      const min = parseInt(row.querySelector('.admin-tier-min').value) || 1;
      const price = parseFloat(row.querySelector('.admin-tier-price').value);
      if (!isNaN(price) && price >= 0) {
        tiers.push({min, price});
      }
    });
    // Sort by min ascending
    tiers.sort((a, b) => a.min - b.min);
    return tiers;
  }

  // Add tier button
  const tierAddBtn = document.getElementById('adminTierAddBtn');
  if (tierAddBtn) {
    tierAddBtn.addEventListener('click', () => {
      const currentTiers = readTiersFromEditor();
      // Suggest a reasonable next min qty
      const lastMin = currentTiers.length > 0 ? currentTiers[currentTiers.length - 1].min : 1;
      const nextMin = lastMin < 10 ? 10 : lastMin < 25 ? 25 : lastMin + 10;
      currentTiers.push({min: nextMin, price: ''});
      renderTierEditor(currentTiers);
    });
  }

  function openProductModal(product) {
    if (!productModal) return;
    const title      = document.getElementById('adminModalTitle');
    const idInput    = document.getElementById('adminProductId');
    const nameInput  = document.getElementById('adminProdName');
    const catInput   = document.getElementById('adminProdCategory');
    const priceInput = document.getElementById('adminProdPrice');
    const unitInput  = document.getElementById('adminProdUnit');
    const descInput  = document.getElementById('adminProdDesc');
    const imgInput   = document.getElementById('adminProdImage');
    const imgPreview = document.getElementById('adminImgPreview');
    const imgPreviewWrap = document.getElementById('adminImgPreviewWrap');
    const deleteWrap = document.getElementById('adminDeleteProductWrap');

    // Dynamically populate category dropdown from FlowerList (single source of truth)
    if (catInput && typeof FlowerList !== 'undefined') {
      const items = FlowerList.getAll();
      catInput.innerHTML = items.map(item => {
        const val = item.name.toLowerCase();
        return `<option value="${val}">${escapeHtml(item.name)}</option>`;
      }).join('');
    }

    if (product) {
      title.textContent = 'Edit Product';
      idInput.value    = product.id;
      nameInput.value  = product.name;
      catInput.value   = product.category;
      priceInput.value = product.price;
      unitInput.value  = product.unit;
      descInput.value  = product.description || '';
      imgInput.value   = product.image || '';
      if (imgPreview && imgPreviewWrap && product.image) {
        imgPreview.src = product.image + '?w=600&q=70&fit=crop&auto=format';
        imgPreviewWrap.style.display = 'block';
      }
      if (deleteWrap) deleteWrap.style.display = 'block';
      // Populate tier editor
      renderTierEditor(product.tiers || [{min: 1, price: product.price}]);
    } else {
      title.textContent = 'Add New Product';
      idInput.value = '';
      nameInput.value = '';
      catInput.value = 'roses';
      priceInput.value = '';
      unitInput.value = '';
      descInput.value = '';
      imgInput.value = '';
      if (imgPreviewWrap) imgPreviewWrap.style.display = 'none';
      if (deleteWrap) deleteWrap.style.display = 'none';
      // Empty tier editor with base row
      renderTierEditor([{min: 1, price: ''}]);
    }

    // Sync base price field ↔ tier base price
    const basePriceSync = () => {
      const editor = document.getElementById('adminTierEditor');
      if (!editor) return;
      const firstRow = editor.querySelector('.admin-tier-row');
      if (firstRow) {
        const tierPriceInput = firstRow.querySelector('.admin-tier-price');
        if (tierPriceInput) tierPriceInput.value = priceInput.value;
      }
    };
    priceInput.removeEventListener('input', basePriceSync);
    priceInput.addEventListener('input', basePriceSync);

    // Also sync tier base → price field
    const editor = document.getElementById('adminTierEditor');
    if (editor) {
      const firstRow = editor.querySelector('.admin-tier-row');
      if (firstRow) {
        const tierPriceInput = firstRow.querySelector('.admin-tier-price');
        if (tierPriceInput) {
          tierPriceInput.addEventListener('input', () => {
            priceInput.value = tierPriceInput.value;
          });
        }
      }
    }

    productModal.classList.add('open');
  }

  /* ── Image preview on URL input ── */
  (function initImgPreview() {
    const imgInput = document.getElementById('adminProdImage');
    const imgPreview = document.getElementById('adminImgPreview');
    const imgPreviewWrap = document.getElementById('adminImgPreviewWrap');
    if (!imgInput || !imgPreview || !imgPreviewWrap) return;
    imgInput.addEventListener('input', () => {
      const url = imgInput.value.trim();
      if (url) {
        imgPreview.src = url + '?w=600&q=70&fit=crop&auto=format';
        imgPreviewWrap.style.display = 'block';
      } else {
        imgPreviewWrap.style.display = 'none';
      }
    });
  })();

  function closeProductModal() {
    if (productModal) productModal.classList.remove('open');
  }

  if (cancelProductBtn) cancelProductBtn.addEventListener('click', closeProductModal);
  if (productModal) {
    productModal.addEventListener('click', e => {
      if (e.target === productModal) closeProductModal();
    });
  }

  if (saveProductBtn) {
    saveProductBtn.addEventListener('click', () => {
      const id      = document.getElementById('adminProductId').value.trim();
      const name    = document.getElementById('adminProdName').value.trim();
      const cat     = document.getElementById('adminProdCategory').value;
      const price   = parseFloat(document.getElementById('adminProdPrice').value);
      const unit    = document.getElementById('adminProdUnit').value.trim();
      const desc    = document.getElementById('adminProdDesc').value.trim();
      const image   = document.getElementById('adminProdImage').value.trim();

      // Read tiers from editor
      const tiers   = readTiersFromEditor();

      if (!name || !price || !unit) {
        showAdminToast('Please fill in Name, Price, and Unit.', 'error');
        return;
      }

      // Ensure base tier price matches the main price
      if (tiers.length > 0) {
        tiers[0].min = 1;
        tiers[0].price = price;
      }

      // Validate tier prices descend as qty increases
      for (let i = 1; i < tiers.length; i++) {
        if (tiers[i].price >= tiers[i - 1].price) {
          showAdminToast(`Tier ${i + 1} price should be lower than tier ${i} price.`, 'error');
          return;
        }
        if (tiers[i].min <= tiers[i - 1].min) {
          showAdminToast(`Tier ${i + 1} min qty must be higher than tier ${i}.`, 'error');
          return;
        }
      }

      const products = getAllProducts();
      // Only include tiers if there's more than just the base
      const tiersToSave = tiers.length > 1 ? tiers : (tiers.length === 1 ? [{min: 1, price}] : null);

      if (id) {
        // Edit existing product
        const idx = products.findIndex(p => p.id === id);
        if (idx !== -1) {
          products[idx] = { ...products[idx], name, category: cat, price, unit, description: desc, image, tiers: tiersToSave };
          saveAllProducts(products);
          showAdminToast('Product updated!', 'success');
        }
      } else {
        // Add new product
        const newProduct = {
          id: 'custom-' + Date.now(),
          name, category: cat, price, unit,
          description: desc || `Beautiful ${name} for your floral arrangements.`,
          image: image || 'flowers/Screenshot 2026-03-12 000052.png',
          badge: null,
          tiers: tiersToSave,
        };
        products.push(newProduct);
        saveAllProducts(products);
        showAdminToast('Product added to shop!', 'success');
      }

      closeProductModal();
      renderProductsTab();
    });
  }

  /* ── Delete product from modal ── */
  const deleteProductBtn = document.getElementById('adminDeleteProductBtn');
  if (deleteProductBtn) {
    deleteProductBtn.addEventListener('click', () => {
      const id = document.getElementById('adminProductId').value.trim();
      if (!id) return;
      const product = getAllProducts().find(p => p.id === id);
      const name = product ? product.name : 'this product';
      if (confirm(`Permanently delete "${name}"? This cannot be undone.`)) {
        saveAllProducts(getAllProducts().filter(p => p.id !== id));
        closeProductModal();
        renderProductsTab();
        showAdminToast('Product deleted.', 'info');
      }
    });
  }

  /* ══════════════════════════════════════════════
     7.  ADMIN TOAST
     ══════════════════════════════════════════════ */
  function showAdminToast(message, type) {
    if (typeof Cart !== 'undefined' && Cart.showToast) {
      Cart.showToast(message, type);
    }
  }

  /* ══════════════════════════════════════════════
     8.  FLOWER LIST TAB (CRUD + reorder)
     ══════════════════════════════════════════════ */
  function renderFlowerListTab() {
    if (typeof FlowerList === 'undefined') return;
    const container = document.getElementById('adminFlowerListContainer');
    if (!container) return;

    const items = FlowerList.getAll();

    if (items.length === 0) {
      container.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem;padding:20px 0">No flowers in the list. Add one below.</div>';
      return;
    }

    container.innerHTML = items.map((item, i) => {
      const name = typeof item === 'string' ? item : item.name;
      const visible = typeof item === 'string' ? true : item.visible !== false;
      return `
      <div class="admin-flower-list-row${visible ? '' : ' admin-flower-hidden'}" data-flower-index="${i}" draggable="true">
        <span class="admin-flower-drag-handle" title="Drag to reorder">⠿</span>
        <span class="admin-flower-name">${escapeHtml(name)}</span>
        <div class="admin-flower-actions">
          <button class="admin-flower-action-btn admin-flower-btn-visible" data-flower-visible="${i}" title="${visible ? 'Hide from website' : 'Show on website'}" style="font-size:0.85rem">${visible ? '👁' : '👁‍🗨'}</button>
          <button class="admin-flower-action-btn admin-flower-btn-up" data-flower-up="${i}" title="Move up" ${i === 0 ? 'disabled style="opacity:0.3;cursor:default"' : ''}>▲</button>
          <button class="admin-flower-action-btn admin-flower-btn-down" data-flower-down="${i}" title="Move down" ${i === items.length - 1 ? 'disabled style="opacity:0.3;cursor:default"' : ''}>▼</button>
          <button class="admin-flower-action-btn admin-flower-btn-rename" data-flower-rename="${i}">Rename</button>
          <button class="admin-flower-action-btn admin-flower-btn-delete" data-flower-delete="${i}">Delete</button>
        </div>
      </div>
    `;}).join('');

    // Bind visibility toggle
    container.querySelectorAll('[data-flower-visible]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.flowerVisible);
        FlowerList.toggleVisible(idx);
        renderFlowerListTab();
        syncFrontendPanel();
        showAdminToast('Visibility updated.', 'success');
      });
    });

    // Bind move up
    container.querySelectorAll('[data-flower-up]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.flowerUp);
        if (idx > 0) {
          FlowerList.reorder(idx, idx - 1);
          renderFlowerListTab();
          syncFrontendPanel();
          showAdminToast('Moved up.', 'success');
        }
      });
    });

    // Bind move down
    container.querySelectorAll('[data-flower-down]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.flowerDown);
        const list = FlowerList.getAll();
        if (idx < list.length - 1) {
          FlowerList.reorder(idx, idx + 1);
          renderFlowerListTab();
          syncFrontendPanel();
          showAdminToast('Moved down.', 'success');
        }
      });
    });

    // Bind rename
    container.querySelectorAll('[data-flower-rename]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.flowerRename);
        const row = container.querySelector(`[data-flower-index="${idx}"]`);
        if (!row) return;
        const nameEl = row.querySelector('.admin-flower-name');
        const actionsEl = row.querySelector('.admin-flower-actions');
        const item = FlowerList.getAll()[idx];
        const currentName = typeof item === 'string' ? item : item.name;

        // Replace name with input
        nameEl.outerHTML = `<input class="admin-flower-name-input" type="text" value="${escapeHtml(currentName)}" data-rename-input="${idx}" />`;

        // Replace actions with save/cancel
        actionsEl.innerHTML = `
          <button class="admin-flower-action-btn admin-flower-btn-save" data-rename-save="${idx}">Save</button>
          <button class="admin-flower-action-btn admin-flower-btn-cancel" data-rename-cancel="${idx}">Cancel</button>
        `;

        const input = row.querySelector(`[data-rename-input="${idx}"]`);
        input.focus();
        input.select();

        // Save
        const doSave = () => {
          const newName = input.value.trim();
          if (newName && newName !== currentName) {
            FlowerList.rename(idx, newName);
            syncFrontendPanel();
            showAdminToast('Renamed!', 'success');
          }
          renderFlowerListTab();
        };

        row.querySelector(`[data-rename-save="${idx}"]`).addEventListener('click', doSave);
        input.addEventListener('keydown', e => {
          if (e.key === 'Enter') doSave();
          if (e.key === 'Escape') renderFlowerListTab();
        });
        row.querySelector(`[data-rename-cancel="${idx}"]`).addEventListener('click', () => renderFlowerListTab());
      });
    });

    // Bind delete
    container.querySelectorAll('[data-flower-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.flowerDelete);
        const item = FlowerList.getAll()[idx];
        const name = typeof item === 'string' ? item : item.name;
        if (confirm(`Remove "${name}" from the list?`)) {
          FlowerList.remove(idx);
          renderFlowerListTab();
          syncFrontendPanel();
          showAdminToast('Removed.', 'info');
        }
      });
    });

    // Drag and drop reorder
    let dragIdx = null;
    container.querySelectorAll('.admin-flower-list-row').forEach(row => {
      row.addEventListener('dragstart', e => {
        dragIdx = parseInt(row.dataset.flowerIndex);
        row.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      row.addEventListener('dragend', () => {
        row.classList.remove('dragging');
        dragIdx = null;
      });

      row.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });

      row.addEventListener('drop', e => {
        e.preventDefault();
        const dropIdx = parseInt(row.dataset.flowerIndex);
        if (dragIdx !== null && dragIdx !== dropIdx) {
          FlowerList.reorder(dragIdx, dropIdx);
          renderFlowerListTab();
          syncFrontendPanel();
          showAdminToast('Reordered.', 'success');
        }
      });
    });
  }

  /* ── Add flower button ── */
  const flowerAddBtn = document.getElementById('adminFlowerListAddBtn');
  const flowerInput  = document.getElementById('adminFlowerListInput');

  if (flowerAddBtn && flowerInput) {
    const doAdd = () => {
      const name = flowerInput.value.trim();
      if (!name) {
        showAdminToast('Please enter a flower name.', 'error');
        return;
      }
      FlowerList.add(name);
      flowerInput.value = '';
      renderFlowerListTab();
      syncFrontendPanel();
      showAdminToast('Added!', 'success');
    };
    flowerAddBtn.addEventListener('click', doAdd);
    flowerInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') doAdd();
    });
  }

  /* ── Sync the frontend right-side panel after admin changes ── */
  function syncFrontendPanel() {
    if (typeof FlowerList !== 'undefined') FlowerList.renderPanel();
  }

  /* ══════════════════════════════════════════════
     9.  ABOUT PAGE TAB
     ══════════════════════════════════════════════ */
  function renderAboutTab() {
    if (typeof AboutContent === 'undefined') return;
    const data = AboutContent.getAll();

    const fields = {
      adminAboutLabel: data.sectionLabel,
      adminAboutHeading: data.heading,
      adminAboutP1: data.paragraph1,
      adminAboutP2: data.paragraph2,
      adminAboutP3: data.paragraph3,
      adminAboutP4: data.paragraph4,
      adminAboutImg1: data.image1,
      adminAboutImg2: data.image2,
    };

    for (const [id, value] of Object.entries(fields)) {
      const el = document.getElementById(id);
      if (el) el.value = value || '';
    }

    // Show image previews
    updateAboutImgPreview('adminAboutImg1', 'adminAboutImg1Preview', 'adminAboutImg1PreviewWrap');
    updateAboutImgPreview('adminAboutImg2', 'adminAboutImg2Preview', 'adminAboutImg2PreviewWrap');
  }

  function updateAboutImgPreview(inputId, previewId, wrapId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const wrap = document.getElementById(wrapId);
    if (!input || !preview || !wrap) return;
    const url = input.value.trim();
    if (url) {
      preview.src = url.includes('?') ? url : url + '?w=600&q=70&fit=crop&auto=format';
      wrap.style.display = 'block';
    } else {
      wrap.style.display = 'none';
    }
  }

  // Live image previews for About fields
  ['adminAboutImg1', 'adminAboutImg2'].forEach(inputId => {
    const el = document.getElementById(inputId);
    if (el) {
      el.addEventListener('input', () => {
        const previewId = inputId + 'Preview';
        const wrapId = inputId + 'PreviewWrap';
        updateAboutImgPreview(inputId, previewId, wrapId);
      });
    }
  });

  // Save button
  const aboutSaveBtn = document.getElementById('adminAboutSaveBtn');
  if (aboutSaveBtn) {
    aboutSaveBtn.addEventListener('click', () => {
      if (typeof AboutContent === 'undefined') return;
      const data = AboutContent.getAll();

      data.sectionLabel = (document.getElementById('adminAboutLabel').value || '').trim();
      data.heading      = (document.getElementById('adminAboutHeading').value || '').trim();
      data.paragraph1   = (document.getElementById('adminAboutP1').value || '').trim();
      data.paragraph2   = (document.getElementById('adminAboutP2').value || '').trim();
      data.paragraph3   = (document.getElementById('adminAboutP3').value || '').trim();
      data.paragraph4   = (document.getElementById('adminAboutP4').value || '').trim();
      data.image1       = (document.getElementById('adminAboutImg1').value || '').trim();
      data.image2       = (document.getElementById('adminAboutImg2').value || '').trim();

      if (!data.heading) {
        showAdminToast('Heading is required.', 'error');
        return;
      }

      AboutContent.save(data);
      showAdminToast('About page content saved!', 'success');
    });
  }

  // Reset button
  const aboutResetBtn = document.getElementById('adminAboutResetBtn');
  if (aboutResetBtn) {
    aboutResetBtn.addEventListener('click', () => {
      if (typeof AboutContent === 'undefined') return;
      if (confirm('Reset About page to default content? This cannot be undone.')) {
        AboutContent.reset();
        renderAboutTab();
        showAdminToast('About page reset to defaults.', 'info');
      }
    });
  }

  /* ══════════════════════════════════════════════
     10.  UTILITY
     ══════════════════════════════════════════════ */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

})();
