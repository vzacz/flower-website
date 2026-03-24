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
    renderFaqTab();
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
      const productModalEl = document.getElementById('adminProductModal');
      const msgModalEl = document.getElementById('adminMsgModal');
      if (productModalEl && productModalEl.classList.contains('open')) {
        closeProductModal();
      } else if (msgModalEl && msgModalEl.classList.contains('open')) {
        msgModalEl.classList.remove('open');
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
      if (tab === 'messages') renderMessagesTab();
      if (tab === 'faq') renderFaqTab();
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
            <button class="admin-delete-btn" data-delete-order="${order.id}">Delete</button>
          </td>
        </tr>
      `;
    }).join('');

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

      if (!name || !price || !unit) {
        showAdminToast('Please fill in Name, Price, and Unit.', 'error');
        return;
      }

      const products = getAllProducts();

      if (id) {
        // Edit existing product (works for all products)
        const idx = products.findIndex(p => p.id === id);
        if (idx !== -1) {
          products[idx] = { ...products[idx], name, category: cat, price, unit, description: desc, image };
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
     10.  MESSAGES TAB (Contact Submissions from Supabase)
     ══════════════════════════════════════════════ */
  let cachedSubmissions = [];
  let msgFilter = 'all';

  // Filter dropdown
  const msgFilterEl = document.getElementById('adminMsgFilter');
  if (msgFilterEl) {
    msgFilterEl.addEventListener('change', () => {
      msgFilter = msgFilterEl.value;
      renderMsgTable();
    });
  }

  async function renderMessagesTab() {
    const loading = document.getElementById('adminMsgLoading');
    const table   = document.getElementById('adminMsgTable');
    if (loading) loading.style.display = 'block';
    if (table)   table.style.display   = 'none';

    try {
      const resp = await fetch('/api/get-submissions');
      const data = await resp.json();
      if (data.success && Array.isArray(data.submissions)) {
        cachedSubmissions = data.submissions;
      } else {
        cachedSubmissions = [];
      }
    } catch {
      cachedSubmissions = [];
      showAdminToast('Failed to load messages.', 'error');
    }

    if (loading) loading.style.display = 'none';
    if (table)   table.style.display   = '';
    renderMsgTable();
  }

  function renderMsgTable() {
    const tbody   = document.getElementById('adminMsgBody');
    const statsEl = document.getElementById('adminMsgStats');
    if (!tbody) return;

    // Stats
    const total     = cachedSubmissions.length;
    const newCount  = cachedSubmissions.filter(s => s.status === 'new').length;
    const contCount = cachedSubmissions.filter(s => s.status === 'contacted').length;
    const compCount = cachedSubmissions.filter(s => s.status === 'completed').length;
    if (statsEl) {
      statsEl.innerHTML =
        `<span>${total} total</span>` +
        `<span style="color:#3b82f6">${newCount} new</span>` +
        `<span style="color:#d97706">${contCount} contacted</span>` +
        `<span style="color:#16a34a">${compCount} completed</span>`;
    }

    // Filter
    const filtered = msgFilter === 'all'
      ? cachedSubmissions
      : cachedSubmissions.filter(s => s.status === msgFilter);

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:32px 16px">${msgFilter === 'all' ? 'No messages yet.' : 'No ' + msgFilter + ' messages.'}</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(sub => {
      const date = sub.created_at ? new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';
      const msgPreview = (sub.message || '').length > 60 ? escapeHtml(sub.message.substring(0, 60)) + '…' : escapeHtml(sub.message);
      const statusColors = { new: '#3b82f6', contacted: '#d97706', completed: '#16a34a' };
      const statusColor = statusColors[sub.status] || '#6b7280';

      return `
        <tr>
          <td style="font-weight:500;color:var(--dark);white-space:nowrap">${escapeHtml(sub.name)}</td>
          <td style="font-size:0.8rem;color:var(--text-muted)"><a href="mailto:${escapeHtml(sub.email)}" style="color:var(--leaf);text-decoration:none">${escapeHtml(sub.email)}</a></td>
          <td style="font-size:0.82rem;color:var(--text-light);max-width:220px">${msgPreview}</td>
          <td style="font-size:0.78rem;color:var(--text-muted);white-space:nowrap">${date}</td>
          <td>
            <select class="admin-msg-status-select" data-msg-status-id="${sub.id}" style="font-size:0.75rem;padding:4px 8px;border-radius:6px;border:1px solid rgba(90,148,96,0.25);background:${statusColor}15;color:${statusColor};font-weight:600;cursor:pointer">
              <option value="new" ${sub.status === 'new' ? 'selected' : ''}>New</option>
              <option value="contacted" ${sub.status === 'contacted' ? 'selected' : ''}>Contacted</option>
              <option value="completed" ${sub.status === 'completed' ? 'selected' : ''}>Completed</option>
            </select>
          </td>
          <td style="white-space:nowrap">
            <button class="admin-edit-btn" data-msg-view="${sub.id}" style="font-size:0.75rem;padding:4px 10px">View</button>
            <button class="admin-delete-btn" data-msg-delete="${sub.id}" style="font-size:0.75rem;padding:4px 10px">Delete</button>
          </td>
        </tr>
      `;
    }).join('');

    // Bind status change
    tbody.querySelectorAll('[data-msg-status-id]').forEach(sel => {
      sel.addEventListener('change', async () => {
        const id = sel.dataset.msgStatusId;
        const newStatus = sel.value;
        try {
          const resp = await fetch('/api/update-submission', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: newStatus }),
          });
          const data = await resp.json();
          if (data.success) {
            const sub = cachedSubmissions.find(s => s.id === id);
            if (sub) sub.status = newStatus;
            renderMsgTable();
            showAdminToast('Status updated.', 'success');
          } else {
            showAdminToast(data.error || 'Failed to update status.', 'error');
          }
        } catch {
          showAdminToast('Network error updating status.', 'error');
        }
      });
    });

    // Bind view buttons
    tbody.querySelectorAll('[data-msg-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.msgView;
        const sub = cachedSubmissions.find(s => s.id === id);
        if (sub) openMsgModal(sub);
      });
    });

    // Bind delete buttons
    tbody.querySelectorAll('[data-msg-delete]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.msgDelete;
        const sub = cachedSubmissions.find(s => s.id === id);
        const name = sub ? sub.name : 'this message';
        if (!confirm(`Delete message from "${name}"? This cannot be undone.`)) return;
        try {
          const resp = await fetch('/api/delete-submission', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          });
          const data = await resp.json();
          if (data.success) {
            cachedSubmissions = cachedSubmissions.filter(s => s.id !== id);
            renderMsgTable();
            showAdminToast('Message deleted.', 'info');
          } else {
            showAdminToast(data.error || 'Failed to delete.', 'error');
          }
        } catch {
          showAdminToast('Network error deleting message.', 'error');
        }
      });
    });
  }

  // Message detail modal
  function openMsgModal(sub) {
    const modal = document.getElementById('adminMsgModal');
    const body  = document.getElementById('adminMsgModalBody');
    if (!modal || !body) return;

    const date = sub.created_at ? new Date(sub.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';
    const statusColors = { new: '#3b82f6', contacted: '#d97706', completed: '#16a34a' };
    const statusColor = statusColors[sub.status] || '#6b7280';
    const statusLabel = (sub.status || 'new').charAt(0).toUpperCase() + (sub.status || 'new').slice(1);

    body.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px">
        <div><span style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:2px">From</span><span style="font-weight:500;color:var(--dark)">${escapeHtml(sub.name)}</span></div>
        <div><span style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:2px">Email</span><a href="mailto:${escapeHtml(sub.email)}" style="color:var(--leaf);text-decoration:none;font-weight:500">${escapeHtml(sub.email)}</a></div>
        <div><span style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:2px">Submitted</span><span style="font-size:0.85rem;color:var(--text-light)">${date}</span></div>
        <div><span style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:2px">Status</span><span style="font-size:0.78rem;font-weight:600;color:${statusColor};background:${statusColor}15;padding:3px 10px;border-radius:12px;display:inline-block">${statusLabel}</span></div>
        <div><span style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:6px">Message</span><div style="background:var(--card-bg);border:1px solid rgba(90,148,96,0.15);border-radius:8px;padding:14px;font-size:0.88rem;line-height:1.6;color:var(--text-light);white-space:pre-wrap">${escapeHtml(sub.message)}</div></div>
      </div>
    `;

    modal.classList.add('open');
  }

  // Close message modal
  const msgModalCloseBtn = document.getElementById('adminMsgModalClose');
  if (msgModalCloseBtn) {
    msgModalCloseBtn.addEventListener('click', () => {
      const modal = document.getElementById('adminMsgModal');
      if (modal) modal.classList.remove('open');
    });
  }
  const msgModal = document.getElementById('adminMsgModal');
  if (msgModal) {
    msgModal.addEventListener('click', e => {
      if (e.target === msgModal) msgModal.classList.remove('open');
    });
  }

  /* ══════════════════════════════════════════════
     11.  FAQ TAB
     ══════════════════════════════════════════════ */
  const FAQ_STORAGE_KEY = 'gl_faq_data';

  const DEFAULT_FAQ_DATA = [
    {
      id: 'cat-ordering', name: 'Ordering & Delivery', icon: 'calendar',
      items: [
        { id: 'faq-1', question: 'When are orders placed?', answer: 'Wholesale flower orders are typically scheduled weekly on Thursdays.' },
        { id: 'faq-2', question: 'What days do you deliver?', answer: 'We deliver Monday through Thursday, depending on availability.' },
        { id: 'faq-3', question: 'Can my delivery date become unavailable?', answer: 'Yes. Each delivery date has limited availability. Once a date is fully booked, it can no longer be selected at checkout.' },
        { id: 'faq-4', question: 'How do I choose my delivery date?', answer: 'You can select an available delivery date during checkout using the delivery calendar.' }
      ]
    },
    {
      id: 'cat-payment', name: 'Orders & Payment', icon: 'shield',
      items: [
        { id: 'faq-5', question: 'Do I need to pay online?', answer: 'No. This is a wholesale order request. Payment is handled separately by our team upon order confirmation. No credit card is required at checkout.' },
        { id: 'faq-6', question: 'Is there a minimum order?', answer: 'We offer wholesale pricing with tiered volume discounts. Browse our collection to see per-unit pricing, and feel free to contact us for bulk order inquiries.' },
        { id: 'faq-7', question: 'How will I know my order was received?', answer: 'After placing your order, you will see a confirmation page with your order details. Our team will also reach out via email or phone to confirm your order and arrange delivery.' }
      ]
    }
  ];

  function getFaqData() {
    try {
      const raw = localStorage.getItem(FAQ_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    const data = JSON.parse(JSON.stringify(DEFAULT_FAQ_DATA));
    localStorage.setItem(FAQ_STORAGE_KEY, JSON.stringify(data));
    return data;
  }

  function saveFaqData(data) {
    localStorage.setItem(FAQ_STORAGE_KEY, JSON.stringify(data));
  }

  function faqGenId() {
    return 'faq-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function renderFaqTab() {
    const container = document.getElementById('adminFaqContainer');
    if (!container) return;

    const data = getFaqData();

    if (data.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text-muted);font-size:0.85rem">No FAQ categories yet. Click "Add Category" to get started.</div>';
      return;
    }

    container.innerHTML = data.map(cat => `
      <div class="admin-faq-category" data-faq-cat="${cat.id}" style="margin-bottom:20px;border:1px solid rgba(90,148,96,0.12);border-radius:10px;overflow:hidden;background:#fff">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(90,148,96,0.06);border-bottom:1px solid rgba(90,148,96,0.1)">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:0.75rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--leaf)">${escapeHtml(cat.name)}</span>
            <span style="font-size:0.7rem;color:var(--text-muted)">${cat.items.length} item${cat.items.length !== 1 ? 's' : ''}</span>
          </div>
          <div style="display:flex;gap:6px">
            <button class="admin-edit-btn" data-faq-rename-cat="${cat.id}" style="font-size:0.72rem;padding:4px 10px">Rename</button>
            <button class="admin-delete-btn" data-faq-delete-cat="${cat.id}" style="font-size:0.72rem;padding:4px 10px">Delete</button>
          </div>
        </div>
        <div class="admin-faq-items" data-faq-items="${cat.id}">
          ${cat.items.length === 0
            ? '<div style="padding:18px;text-align:center;font-size:0.82rem;color:var(--text-muted)">No questions yet.</div>'
            : cat.items.map((item, idx) => `
              <div style="display:flex;align-items:flex-start;gap:10px;padding:12px 16px;border-bottom:1px solid rgba(90,148,96,0.06)" data-faq-item="${item.id}">
                <div style="color:var(--text-muted);font-size:0.75rem;padding-top:2px;cursor:grab" title="Drag to reorder"
                     draggable="true"
                     ondragstart="event.dataTransfer.setData('text/plain','${cat.id}:${idx}');event.dataTransfer.effectAllowed='move'"
                     ondragover="event.preventDefault()"
                     ondrop="window._faqDrop(event,'${cat.id}',${idx})">⋮⋮</div>
                <div style="flex:1;min-width:0">
                  <div style="font-family:var(--font-display);font-size:0.9rem;font-weight:500;color:var(--dark);margin-bottom:3px">${escapeHtml(item.question)}</div>
                  <div style="font-size:0.8rem;color:var(--text-light);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${escapeHtml(item.answer)}</div>
                </div>
                <div style="display:flex;gap:4px;flex-shrink:0">
                  <button class="admin-edit-btn" data-faq-edit="${cat.id}:${item.id}" style="font-size:0.72rem;padding:4px 10px">Edit</button>
                  <button class="admin-delete-btn" data-faq-delete="${cat.id}:${item.id}" style="font-size:0.72rem;padding:4px 10px">Delete</button>
                </div>
              </div>
            `).join('')
          }
        </div>
        <div style="padding:10px 16px;border-top:1px dashed rgba(90,148,96,0.12)">
          <button class="admin-edit-btn" data-faq-add-item="${cat.id}" style="font-size:0.75rem;padding:5px 14px;border-style:dashed">+ Add Question</button>
        </div>
      </div>
    `).join('');

    // Bind events
    container.querySelectorAll('[data-faq-rename-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        const catId = btn.dataset.faqRenameCat;
        const data = getFaqData();
        const cat = data.find(c => c.id === catId);
        if (!cat) return;
        const name = prompt('Category name:', cat.name);
        if (name && name.trim()) {
          cat.name = name.trim();
          saveFaqData(data);
          renderFaqTab();
          showAdminToast('Category renamed.', 'success');
        }
      });
    });

    container.querySelectorAll('[data-faq-delete-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Delete this entire category and all its questions?')) return;
        const catId = btn.dataset.faqDeleteCat;
        let data = getFaqData();
        data = data.filter(c => c.id !== catId);
        saveFaqData(data);
        renderFaqTab();
        showAdminToast('Category deleted.', 'info');
      });
    });

    container.querySelectorAll('[data-faq-edit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [catId, itemId] = btn.dataset.faqEdit.split(':');
        faqEditItem(catId, itemId);
      });
    });

    container.querySelectorAll('[data-faq-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Delete this question?')) return;
        const [catId, itemId] = btn.dataset.faqDelete.split(':');
        const data = getFaqData();
        const cat = data.find(c => c.id === catId);
        if (cat) {
          cat.items = cat.items.filter(i => i.id !== itemId);
          saveFaqData(data);
          renderFaqTab();
          showAdminToast('Question deleted.', 'info');
        }
      });
    });

    container.querySelectorAll('[data-faq-add-item]').forEach(btn => {
      btn.addEventListener('click', () => {
        faqAddItemForm(btn.dataset.faqAddItem);
      });
    });
  }

  function faqEditItem(catId, itemId) {
    const data = getFaqData();
    const cat = data.find(c => c.id === catId);
    if (!cat) return;
    const item = cat.items.find(i => i.id === itemId);
    if (!item) return;

    const row = document.querySelector(`[data-faq-item="${itemId}"]`);
    if (!row) return;

    row.innerHTML = `
      <div style="width:100%">
        <div style="margin-bottom:8px">
          <label class="form-label" style="font-size:0.72rem">Question</label>
          <input class="form-input" type="text" id="faqEditQ-${itemId}" value="${escapeHtml(item.question)}" style="font-size:0.85rem" />
        </div>
        <div style="margin-bottom:8px">
          <label class="form-label" style="font-size:0.72rem">Answer</label>
          <textarea class="form-input form-textarea" id="faqEditA-${itemId}" rows="3" style="font-size:0.85rem">${escapeHtml(item.answer)}</textarea>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary" id="faqSaveEdit-${itemId}" style="font-size:0.78rem;padding:6px 16px">Save</button>
          <button class="btn btn-ghost" id="faqCancelEdit-${itemId}" style="font-size:0.78rem;padding:6px 16px">Cancel</button>
        </div>
      </div>
    `;
    row.style.padding = '14px 16px';

    document.getElementById('faqEditQ-' + itemId).focus();

    document.getElementById('faqSaveEdit-' + itemId).addEventListener('click', () => {
      const q = document.getElementById('faqEditQ-' + itemId).value.trim();
      const a = document.getElementById('faqEditA-' + itemId).value.trim();
      if (!q || !a) return;
      item.question = q;
      item.answer = a;
      saveFaqData(data);
      renderFaqTab();
      showAdminToast('Question updated.', 'success');
    });

    document.getElementById('faqCancelEdit-' + itemId).addEventListener('click', () => {
      renderFaqTab();
    });
  }

  function faqAddItemForm(catId) {
    const itemsContainer = document.querySelector(`[data-faq-items="${catId}"]`);
    if (!itemsContainer) return;

    // Remove any existing add form
    const existing = itemsContainer.querySelector('.faq-add-form');
    if (existing) { existing.remove(); return; }

    const form = document.createElement('div');
    form.className = 'faq-add-form';
    form.style.cssText = 'padding:14px 16px;background:rgba(90,148,96,0.04);border-bottom:1px solid rgba(90,148,96,0.1)';
    form.innerHTML = `
      <div style="margin-bottom:8px">
        <label class="form-label" style="font-size:0.72rem">Question</label>
        <input class="form-input" type="text" id="faqNewQ-${catId}" placeholder="Enter the question..." style="font-size:0.85rem" />
      </div>
      <div style="margin-bottom:8px">
        <label class="form-label" style="font-size:0.72rem">Answer</label>
        <textarea class="form-input form-textarea" id="faqNewA-${catId}" rows="3" placeholder="Enter the answer..." style="font-size:0.85rem"></textarea>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary" id="faqSaveNew-${catId}" style="font-size:0.78rem;padding:6px 16px">Add Question</button>
        <button class="btn btn-ghost" id="faqCancelNew-${catId}" style="font-size:0.78rem;padding:6px 16px">Cancel</button>
      </div>
    `;
    itemsContainer.appendChild(form);
    document.getElementById('faqNewQ-' + catId).focus();

    document.getElementById('faqSaveNew-' + catId).addEventListener('click', () => {
      const q = document.getElementById('faqNewQ-' + catId).value.trim();
      const a = document.getElementById('faqNewA-' + catId).value.trim();
      if (!q || !a) return;
      const data = getFaqData();
      const cat = data.find(c => c.id === catId);
      if (cat) {
        cat.items.push({ id: faqGenId(), question: q, answer: a });
        saveFaqData(data);
        renderFaqTab();
        showAdminToast('Question added.', 'success');
      }
    });

    document.getElementById('faqCancelNew-' + catId).addEventListener('click', () => {
      form.remove();
    });
  }

  // Drag and drop reorder
  window._faqDrop = function(e, targetCatId, targetIdx) {
    e.preventDefault();
    const raw = e.dataTransfer.getData('text/plain');
    const [sourceCatId, sourceIdxStr] = raw.split(':');
    const sourceIdx = parseInt(sourceIdxStr, 10);

    if (sourceCatId !== targetCatId || sourceIdx === targetIdx) return;

    const data = getFaqData();
    const cat = data.find(c => c.id === targetCatId);
    if (!cat) return;

    const [moved] = cat.items.splice(sourceIdx, 1);
    cat.items.splice(targetIdx, 0, moved);
    saveFaqData(data);
    renderFaqTab();
  };

  // Add Category button
  const addCatBtn = document.getElementById('adminFaqAddCatBtn');
  if (addCatBtn) {
    addCatBtn.addEventListener('click', () => {
      const name = prompt('New category name:');
      if (!name || !name.trim()) return;
      const data = getFaqData();
      data.push({ id: 'cat-' + Date.now().toString(36), name: name.trim(), icon: 'folder', items: [] });
      saveFaqData(data);
      renderFaqTab();
      showAdminToast('Category added.', 'success');
    });
  }

  /* ══════════════════════════════════════════════
     12.  UTILITY
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
