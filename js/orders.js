/* ============================================================
   GREEN LIFE FLOWERS — ORDER STORAGE
   Handles: saving orders, retrieving, updating, deleting
   Storage: localStorage (no backend required)
   ============================================================ */

const Orders = (() => {
  const STORAGE_KEY = 'greenlife_orders';

  /* ── Generate a readable order ID ── */
  function generateOrderId() {
    const prefix = 'GLF';
    const date = new Date();
    const datePart = [
      String(date.getFullYear()).slice(2),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('');
    const random = Math.floor(Math.random() * 9000 + 1000);
    return `${prefix}-${datePart}-${random}`;
  }

  /* ── Load all orders from localStorage ── */
  function getAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /* ── Save orders array back to localStorage ── */
  function saveAll(orders) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }

  /* ── Create a new order ── */
  function create(customerData, cartItems, deliveryDate) {
    const orders = getAll();

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const order = {
      id: generateOrderId(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      deliveryDate: deliveryDate || null,
      customer: {
        firstName:   sanitize(customerData.firstName),
        lastName:    sanitize(customerData.lastName),
        email:       sanitize(customerData.email),
        phone:       sanitize(customerData.phone || ''),
        company:     sanitize(customerData.company || ''),
        address:     sanitize(customerData.address || ''),
        city:        sanitize(customerData.city || ''),
        notes:       sanitize(customerData.notes || ''),
      },
      items: cartItems.map(item => ({
        id:       item.id,
        name:     item.name,
        category: item.category,
        price:    item.price,
        unit:     item.unit,
        qty:      item.qty,
        image:    item.image,
        subtotal: item.price * item.qty,
      })),
      subtotal: subtotal,
      total:    subtotal,
    };

    orders.unshift(order); // newest first
    saveAll(orders);
    return order;
  }

  /* ── Get a single order by ID ── */
  function getById(id) {
    return getAll().find(o => o.id === id) || null;
  }

  /* ── Update order status ── */
  function updateStatus(id, status) {
    const orders = getAll();
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) return false;
    orders[idx].status = status;
    orders[idx].updatedAt = new Date().toISOString();
    saveAll(orders);
    return true;
  }

  /* ── Delete an order ── */
  function deleteOrder(id) {
    const orders = getAll().filter(o => o.id !== id);
    saveAll(orders);
  }

  /* ── Get orders by status ── */
  function getByStatus(status) {
    if (status === 'all') return getAll();
    return getAll().filter(o => o.status === status);
  }

  /* ── Stats for admin dashboard ── */
  function getStats() {
    const orders = getAll();
    const pending   = orders.filter(o => o.status === 'pending').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const revenue   = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    return {
      total: orders.length,
      pending,
      completed,
      revenue,
    };
  }

  /* ── Simple input sanitizer (strip HTML tags) ── */
  function sanitize(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .trim()
      .slice(0, 500); // max length
  }

  /* ── Format date for display ── */
  function formatDate(isoString) {
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        year:  'numeric',
        month: 'short',
        day:   'numeric',
        hour:  '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  }

  /* ── Update an entire order object ── */
  function updateOrder(id, updates) {
    const orders = getAll();
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) return false;
    // Merge customer fields
    if (updates.customer) {
      orders[idx].customer = { ...orders[idx].customer };
      Object.keys(updates.customer).forEach(k => {
        orders[idx].customer[k] = sanitize(updates.customer[k]);
      });
    }
    // Merge top-level fields
    if (updates.status !== undefined) orders[idx].status = updates.status;
    if (updates.deliveryDate !== undefined) orders[idx].deliveryDate = updates.deliveryDate;
    if (updates.items !== undefined) {
      orders[idx].items = updates.items;
      orders[idx].subtotal = updates.items.reduce((s, i) => s + (i.subtotal || i.price * i.qty), 0);
      orders[idx].total = orders[idx].subtotal;
    }
    orders[idx].updatedAt = new Date().toISOString();
    saveAll(orders);
    return orders[idx];
  }

  return { getAll, create, getById, updateStatus, updateOrder, deleteOrder, getByStatus, getStats, formatDate, sanitize };
})();
