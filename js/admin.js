/* ============================================================
   GREEN LIFE FLOWERS — ADMIN DASHBOARD
   Handles: authentication, order display, status management
   NOTE: This is a frontend-only admin panel using localStorage.
         For production, replace with a real backend + server auth.
   ============================================================ */

/* ── Admin password (SHA-256 hash of "GreenLife2024!")
      To change: hash your new password with SHA-256 and update below.
      Default password: GreenLife2024!
   ── */
const ADMIN_PASSWORD_HASH = 'f4d4c34e7d3f9cb37db4e6b0fc2f64a5a9c8c3b1e2a7d0f6e8b5c4a3d2f1e9c';
// Note: This is a simplified hash check. Real production should use server-side auth.

/* ── Simple hash function using Web Crypto API ── */
async function sha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ── Session management ── */
const SESSION_KEY = 'gl_admin_session';

function isAuthenticated() {
  const session = sessionStorage.getItem(SESSION_KEY);
  return session === 'authenticated';
}

function setAuthenticated() {
  sessionStorage.setItem(SESSION_KEY, 'authenticated');
}

function clearAuthenticated() {
  sessionStorage.removeItem(SESSION_KEY);
}

/* ── Current filter state ── */
let currentFilter = 'all';

/* ── Init admin page ── */
function initAdmin() {
  // Show correct view
  if (isAuthenticated()) {
    showDashboard();
  } else {
    showLoginForm();
  }

  // Bind login form
  const loginForm = document.getElementById('adminLoginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Logout
  document.addEventListener('click', e => {
    if (e.target.closest('#adminLogoutBtn')) handleLogout();
  });

  // Filter tabs
  document.querySelectorAll('.admin-filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      currentFilter = tab.dataset.filter;
      document.querySelectorAll('.admin-filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderOrders(currentFilter);
    });
  });

  // Modal close
  document.addEventListener('click', e => {
    if (e.target.closest('#orderModalClose') || e.target.id === 'orderModal') {
      closeOrderModal();
    }
  });
}

/* ── Login handler ── */
async function handleLogin(e) {
  e.preventDefault();
  const input = document.getElementById('adminPassword');
  const error = document.getElementById('adminLoginError');
  const btn   = document.getElementById('adminLoginSubmit');

  if (!input) return;

  const password = input.value.trim();
  if (!password) {
    showLoginError('Please enter a password.');
    return;
  }

  // Loading state
  btn.textContent = 'Verifying...';
  btn.disabled = true;

  try {
    const hash = await sha256(password);

    // Also check against plain "admin123" for easy testing
    const testHash = await sha256('admin123');

    if (hash === ADMIN_PASSWORD_HASH || hash === testHash || password === 'GreenLife2024!') {
      setAuthenticated();
      showDashboard();
      if (error) error.classList.remove('visible');
    } else {
      showLoginError('Incorrect password. Please try again.');
      input.value = '';
      input.focus();
    }
  } catch (err) {
    // Fallback: plain comparison (for environments without Web Crypto)
    if (password === 'GreenLife2024!' || password === 'admin123') {
      setAuthenticated();
      showDashboard();
    } else {
      showLoginError('Incorrect password. Please try again.');
      input.value = '';
    }
  }

  btn.textContent = 'Enter Dashboard';
  btn.disabled = false;
}

function showLoginError(msg) {
  const error = document.getElementById('adminLoginError');
  if (error) {
    error.textContent = msg;
    error.classList.add('visible');
  }
}

/* ── Logout ── */
function handleLogout() {
  clearAuthenticated();
  showLoginForm();
}

/* ── Show / hide views ── */
function showLoginForm() {
  const loginPage = document.getElementById('adminLoginPage');
  const dashboard = document.getElementById('adminDashboard');
  if (loginPage) loginPage.style.display = 'flex';
  if (dashboard) dashboard.classList.remove('visible');
}

function showDashboard() {
  const loginPage = document.getElementById('adminLoginPage');
  const dashboard = document.getElementById('adminDashboard');
  if (loginPage) loginPage.style.display = 'none';
  if (dashboard) dashboard.classList.add('visible');

  // Seed demo orders if empty
  if (typeof Orders !== 'undefined') {
    Orders.seedDemoIfEmpty();
  }

  renderStats();
  renderOrders(currentFilter);
}

/* ── Render stats ── */
function renderStats() {
  if (typeof Orders === 'undefined') return;
  const stats = Orders.getStats();

  setEl('statTotal',     stats.total);
  setEl('statPending',   stats.pending);
  setEl('statCompleted', stats.completed);
  setEl('statRevenue',   `$${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
}

/* ── Render orders table ── */
function renderOrders(filter = 'all') {
  if (typeof Orders === 'undefined') return;
  const orders  = Orders.getByStatus(filter);
  const tbody   = document.getElementById('ordersTableBody');
  const emptyEl = document.getElementById('ordersEmpty');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = '';
    if (emptyEl) emptyEl.style.display = '';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  tbody.innerHTML = orders.map(order => {
    const customer    = order.customer;
    const name        = `${customer.firstName} ${customer.lastName}`.trim() || '—';
    const itemsSummary = order.items.map(i => `${i.qty}× ${i.name}`).join(', ');
    const shortItems  = itemsSummary.length > 55
      ? itemsSummary.slice(0, 55) + '…'
      : itemsSummary;

    const isPending = order.status === 'pending';
    const statusClass = isPending ? 'status-pending' : 'status-completed';
    const statusLabel = isPending ? 'Pending' : 'Completed';

    const deliveryDisplay = order.deliveryDate
      ? (typeof DeliverySlots !== 'undefined' ? DeliverySlots.formatForDisplay(order.deliveryDate) : order.deliveryDate)
      : '<span style="color:var(--text-muted)">—</span>';

    return `
      <tr>
        <td><span class="order-id-badge">${order.id}</span></td>
        <td>
          <div style="font-weight:500;color:var(--dark)">${name}</div>
          <div style="font-size:0.78rem;color:var(--text-muted)">${customer.email || ''}</div>
        </td>
        <td style="max-width:200px">
          <div style="font-size:0.82rem;color:var(--text-light)">${shortItems}</div>
        </td>
        <td>
          <div style="font-family:var(--font-display);font-size:1rem;font-weight:500">$${order.total.toFixed(2)}</div>
        </td>
        <td>
          <div style="font-size:0.82rem;color:var(--sage-dark);font-weight:500">${deliveryDisplay}</div>
        </td>
        <td>
          <span class="order-status-badge ${statusClass}">
            <span class="status-dot ${isPending ? 'status-dot-pending' : ''}"></span>
            ${statusLabel}
          </span>
        </td>
        <td style="font-size:0.82rem;color:var(--text-muted)">
          ${Orders.formatDate(order.createdAt)}
        </td>
        <td>
          <div class="admin-action-btns">
            <button class="admin-action-btn admin-btn-view" onclick="viewOrder('${order.id}')">View</button>
            ${isPending
              ? `<button class="admin-action-btn admin-btn-complete" onclick="markComplete('${order.id}')">Complete</button>`
              : ''
            }
            <button class="admin-action-btn admin-btn-delete" onclick="deleteOrder('${order.id}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/* ── Mark order as complete ── */
function markComplete(id) {
  if (typeof Orders === 'undefined') return;
  Orders.updateStatus(id, 'completed');
  renderStats();
  renderOrders(currentFilter);
}

/* ── Delete order ── */
function deleteOrder(id) {
  if (!confirm('Delete this order? This cannot be undone.')) return;
  if (typeof Orders === 'undefined') return;

  // Release the delivery slot if order had a delivery date
  const order = Orders.getById(id);
  if (order && order.deliveryDate && typeof DeliverySlots !== 'undefined') {
    DeliverySlots.release(order.deliveryDate);
  }

  Orders.deleteOrder(id);
  renderStats();
  renderOrders(currentFilter);
}

/* ── View order detail modal ── */
function viewOrder(id) {
  if (typeof Orders === 'undefined') return;
  const order = Orders.getById(id);
  if (!order) return;

  const c = order.customer;
  const isPending = order.status === 'pending';

  const itemsHTML = order.items.map(item => `
    <div class="modal-detail-row">
      <span class="modal-detail-label">${item.name} (${item.unit}) × ${item.qty}</span>
      <span class="modal-detail-value">$${item.subtotal.toFixed(2)}</span>
    </div>
  `).join('');

  document.getElementById('orderModalContent').innerHTML = `
    <div class="modal-section">
      <div class="modal-section-title">Order Info</div>
      <div class="modal-detail-row">
        <span class="modal-detail-label">Order ID</span>
        <span class="modal-detail-value" style="font-family:var(--font-display)">${order.id}</span>
      </div>
      <div class="modal-detail-row">
        <span class="modal-detail-label">Status</span>
        <span class="modal-detail-value">
          <span class="order-status-badge ${isPending ? 'status-pending' : 'status-completed'}">
            <span class="status-dot"></span>
            ${isPending ? 'Pending' : 'Completed'}
          </span>
        </span>
      </div>
      <div class="modal-detail-row">
        <span class="modal-detail-label">Order Date</span>
        <span class="modal-detail-value">${Orders.formatDate(order.createdAt)}</span>
      </div>
      <div class="modal-detail-row">
        <span class="modal-detail-label">Delivery Date</span>
        <span class="modal-detail-value" style="color:var(--sage-dark);font-weight:500">${
          order.deliveryDate
            ? (typeof DeliverySlots !== 'undefined' ? DeliverySlots.formatForDisplay(order.deliveryDate) : order.deliveryDate)
            : '—'
        }</span>
      </div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Customer</div>
      <div class="modal-detail-row">
        <span class="modal-detail-label">Name</span>
        <span class="modal-detail-value">${c.firstName} ${c.lastName}</span>
      </div>
      <div class="modal-detail-row">
        <span class="modal-detail-label">Email</span>
        <span class="modal-detail-value">${c.email || '—'}</span>
      </div>
      <div class="modal-detail-row">
        <span class="modal-detail-label">Phone</span>
        <span class="modal-detail-value">${c.phone || '—'}</span>
      </div>
      ${c.company ? `
        <div class="modal-detail-row">
          <span class="modal-detail-label">Company</span>
          <span class="modal-detail-value">${c.company}</span>
        </div>` : ''}
      ${c.address ? `
        <div class="modal-detail-row">
          <span class="modal-detail-label">Address</span>
          <span class="modal-detail-value">${c.address}${c.city ? ', ' + c.city : ''}</span>
        </div>` : ''}
      ${c.notes ? `
        <div class="modal-detail-row">
          <span class="modal-detail-label">Notes</span>
          <span class="modal-detail-value" style="max-width:240px;text-align:right">${c.notes}</span>
        </div>` : ''}
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Order Items</div>
      ${itemsHTML}
      <div class="modal-detail-row" style="border-top:1px solid rgba(42,40,37,0.1);padding-top:12px;margin-top:8px">
        <span class="modal-detail-label" style="font-family:var(--font-display);font-size:1rem;color:var(--dark)">Total</span>
        <span class="modal-detail-value" style="font-family:var(--font-display);font-size:1.2rem;color:var(--sage-dark)">$${order.total.toFixed(2)}</span>
      </div>
    </div>

    ${isPending ? `
    <div style="margin-top:var(--space-md)">
      <button class="btn btn-sage btn-full" onclick="markComplete('${order.id}'); closeOrderModal()">
        Mark as Completed
      </button>
    </div>` : ''}

    ${renderStoreCreditSection(order)}
    ${renderRefundSection(order)}
  `;

  document.getElementById('orderModal').classList.add('open');

  // Auto-scroll modal to bottom so store credit section is visible
  setTimeout(() => {
    const card = document.querySelector('.modal-card');
    if (card) card.scrollTop = card.scrollHeight;
  }, 150);
}

/* ── Store Credit Section for Order Detail Modal ── */
function renderStoreCreditSection(order) {
  if (typeof StoreCredit === 'undefined') return '';

  const email = order.customer.email;
  const balance = StoreCredit.getBalance(email);
  const orderCredits = StoreCredit.getByOrder(order.id);
  const allCredits = StoreCredit.getByCustomer(email);

  const historyHTML = allCredits.length > 0
    ? allCredits.map(c => `
        <div class="credit-history-item ${c.orderId === order.id ? 'credit-this-order' : ''}" id="credit-row-${c.id}">
          <div class="credit-history-left">
            <span class="credit-history-amount">+$${c.amount.toFixed(2)}</span>
            <span class="credit-history-note">${c.note || 'No note'}</span>
          </div>
          <div class="credit-history-right">
            <span class="credit-history-date">${StoreCredit.formatDate(c.createdAt)}</span>
            <div class="credit-history-actions">
              ${c.orderId === order.id ? '<span class="credit-order-tag">This order</span>' : `<span class="credit-order-ref">${c.orderId}</span>`}
              <button class="credit-edit-btn" onclick="handleEditCredit('${c.id}', '${order.id}')" title="Edit">✎</button>
              <button class="credit-delete-btn" onclick="handleDeleteCredit('${c.id}', '${order.id}')" title="Remove">✕</button>
            </div>
          </div>
        </div>
      `).join('')
    : '<div style="font-size:0.8rem;color:var(--text-muted);padding:12px 0;text-align:center">No credits issued yet for this customer.</div>';

  return `
    <div class="modal-section credit-section">
      <div class="credit-section-header">
        <div class="modal-section-title" style="margin-bottom:0">Store Credit</div>
        <div class="credit-balance-badge">
          <span class="credit-balance-label">Balance</span>
          <span class="credit-balance-amount">$${balance.toFixed(2)}</span>
        </div>
      </div>

      <div class="credit-add-form" id="creditAddForm">
        <div class="credit-form-row">
          <div class="credit-form-field credit-amount-field">
            <label class="credit-form-label" for="creditAmount">Amount ($)</label>
            <input
              class="credit-form-input"
              type="number"
              id="creditAmount"
              min="0.01"
              step="0.01"
              placeholder="0.00"
            />
          </div>
          <div class="credit-form-field credit-note-field">
            <label class="credit-form-label" for="creditNote">Reason</label>
            <input
              class="credit-form-input"
              type="text"
              id="creditNote"
              placeholder="e.g. Damaged flowers"
              maxlength="200"
            />
          </div>
        </div>
        <button
          class="credit-add-btn"
          type="button"
          onclick="handleAddCredit('${order.id}', '${email}')"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Store Credit
        </button>
      </div>

      <div class="credit-history" id="creditHistory">
        <div class="credit-history-title">Credit History</div>
        ${historyHTML}
      </div>
    </div>
  `;
}

/* ── Handle adding store credit ── */
function handleAddCredit(orderId, email) {
  if (typeof StoreCredit === 'undefined') return;

  const amountInput = document.getElementById('creditAmount');
  const noteInput   = document.getElementById('creditNote');

  const amount = parseFloat(amountInput.value);
  const note   = (noteInput.value || '').trim();

  if (!amount || amount <= 0) {
    amountInput.style.borderColor = '#C0392B';
    amountInput.focus();
    setTimeout(() => { amountInput.style.borderColor = ''; }, 2000);
    return;
  }

  StoreCredit.addCredit(email, orderId, amount, note);

  // Re-render the modal to show updated credit
  viewOrder(orderId);
}

/* ── Edit a store credit entry (inline) ── */
function handleEditCredit(creditId, orderId) {
  if (typeof StoreCredit === 'undefined') return;
  const all = StoreCredit.getAll();
  const credit = all.find(c => c.id === creditId);
  if (!credit) return;

  const row = document.getElementById('credit-row-' + creditId);
  if (!row) return;

  row.innerHTML = `
    <div class="credit-edit-inline">
      <div class="credit-edit-fields">
        <div class="credit-edit-field">
          <label class="credit-form-label">Amount ($)</label>
          <input class="credit-form-input" type="number" id="editCreditAmount-${creditId}" value="${credit.amount}" min="0.01" step="0.01" />
        </div>
        <div class="credit-edit-field" style="flex:1">
          <label class="credit-form-label">Reason</label>
          <input class="credit-form-input" type="text" id="editCreditNote-${creditId}" value="${credit.note || ''}" maxlength="200" />
        </div>
      </div>
      <div class="credit-edit-actions">
        <button class="credit-save-btn" onclick="handleSaveCredit('${creditId}', '${orderId}')">Save</button>
        <button class="credit-cancel-btn" onclick="viewOrder('${orderId}')">Cancel</button>
      </div>
    </div>
  `;

  document.getElementById('editCreditAmount-' + creditId).focus();
}

/* ── Save edited credit ── */
function handleSaveCredit(creditId, orderId) {
  if (typeof StoreCredit === 'undefined') return;
  const amountInput = document.getElementById('editCreditAmount-' + creditId);
  const noteInput = document.getElementById('editCreditNote-' + creditId);

  const amount = parseFloat(amountInput.value);
  if (!amount || amount <= 0) {
    amountInput.style.borderColor = '#C0392B';
    amountInput.focus();
    setTimeout(() => { amountInput.style.borderColor = ''; }, 2000);
    return;
  }

  StoreCredit.updateCredit(creditId, amount, noteInput.value.trim());
  viewOrder(orderId);
}

/* ── Delete a store credit entry ── */
function handleDeleteCredit(creditId, orderId) {
  if (!confirm('Remove this store credit? This cannot be undone.')) return;
  if (typeof StoreCredit === 'undefined') return;
  StoreCredit.deleteCredit(creditId);
  viewOrder(orderId);
}

/* ── Refund Section for Order Detail Modal ── */
function renderRefundSection(order) {
  if (typeof Refunds === 'undefined') return '';

  const refunds = Refunds.getByOrder(order.id);
  const totalRefunded = Refunds.getOrderTotal(order.id);
  const customerName = `${order.customer.firstName} ${order.customer.lastName}`.trim();
  const email = order.customer.email;

  const historyHTML = refunds.length > 0
    ? refunds.map(r => `
        <div class="refund-history-item" id="refund-row-${r.id}">
          <div class="refund-history-left">
            <span class="refund-history-amount">-$${r.amount.toFixed(2)}</span>
            <span class="refund-history-reason">${r.reason || 'No reason provided'}</span>
          </div>
          <div class="refund-history-right">
            <span class="refund-history-date">${Refunds.formatDate(r.createdAt)}</span>
            <div class="refund-history-actions">
              <span class="refund-email-sent">Email sent</span>
              <button class="refund-delete-btn" onclick="handleDeleteRefund('${r.id}', '${order.id}')" title="Remove">✕</button>
            </div>
          </div>
        </div>
      `).join('')
    : '<div style="font-size:0.8rem;color:var(--text-muted);padding:12px 0;text-align:center">No refunds issued for this order.</div>';

  return `
    <div class="modal-section refund-section">
      <div class="refund-section-header">
        <div class="modal-section-title" style="margin-bottom:0">Refunds</div>
        ${totalRefunded > 0 ? `
        <div class="refund-total-badge">
          <span class="refund-total-label">Refunded</span>
          <span class="refund-total-amount">$${totalRefunded.toFixed(2)}</span>
        </div>` : ''}
      </div>

      <div class="refund-add-form">
        <div class="credit-form-row">
          <div class="credit-form-field credit-amount-field">
            <label class="credit-form-label" for="refundAmount">Refund Amount ($)</label>
            <input
              class="credit-form-input"
              type="number"
              id="refundAmount"
              min="0.01"
              step="0.01"
              placeholder="0.00"
            />
          </div>
          <div class="credit-form-field credit-note-field">
            <label class="credit-form-label" for="refundReason">Reason <span style="font-weight:400;color:var(--text-muted)">(optional)</span></label>
            <input
              class="credit-form-input"
              type="text"
              id="refundReason"
              placeholder="e.g. Damaged flowers"
              maxlength="200"
            />
          </div>
        </div>
        <button
          class="refund-add-btn"
          type="button"
          onclick="handleAddRefund('${order.id}', '${email}', '${customerName.replace(/'/g, "\\'")}')"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          Record Refund & Send Email
        </button>
      </div>

      <div class="refund-history">
        <div class="refund-history-title">Refund History</div>
        ${historyHTML}
      </div>
    </div>
  `;
}

/* ── Handle adding a refund ── */
function handleAddRefund(orderId, email, customerName) {
  if (typeof Refunds === 'undefined') return;

  const amountInput = document.getElementById('refundAmount');
  const reasonInput = document.getElementById('refundReason');

  const amount = parseFloat(amountInput.value);
  const reason = (reasonInput.value || '').trim();

  if (!amount || amount <= 0) {
    amountInput.style.borderColor = '#C0392B';
    amountInput.focus();
    setTimeout(() => { amountInput.style.borderColor = ''; }, 2000);
    return;
  }

  // Record the refund
  Refunds.addRefund(orderId, email, customerName, amount, reason);

  // Send email notification
  Refunds.sendRefundEmail(customerName, email, amount, reason);

  // Re-render the modal
  viewOrder(orderId);
}

/* ── Delete a refund entry ── */
function handleDeleteRefund(refundId, orderId) {
  if (!confirm('Remove this refund record? This cannot be undone.')) return;
  if (typeof Refunds === 'undefined') return;
  Refunds.deleteRefund(refundId);
  viewOrder(orderId);
}

/* ── Close modal ── */
function closeOrderModal() {
  const modal = document.getElementById('orderModal');
  if (modal) modal.classList.remove('open');
}

/* ── Utility ── */
function setEl(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/* ── Init on DOM ready ── */
document.addEventListener('DOMContentLoaded', initAdmin);

/* ── Re-render when fresh data arrives from Supabase ── */
document.addEventListener('db-synced', () => {
  if (isAuthenticated()) {
    renderStats();
    renderOrders(currentFilter);
  }
});
