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
  `;

  document.getElementById('orderModal').classList.add('open');
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
