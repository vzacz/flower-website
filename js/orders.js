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

  /* ── Seed demo orders for first-time admin view ── */
  function seedDemoIfEmpty() {
    if (getAll().length > 0) return;
    const demoOrders = [
      {
        id: 'GLF-260301-4821',
        status: 'completed',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        customer: {
          firstName: 'Sarah',
          lastName:  'Mitchell',
          email:     'sarah.mitchell@bloom.co',
          phone:     '(555) 201-4839',
          company:   'Bloom & Co. Events',
          address:   '142 Rosewood Lane',
          city:      'Portland, OR',
          notes:     'Please deliver before 10am for the morning ceremony.',
        },
        items: [
          { id: 'rose-001', name: 'Classic Red Roses',    category: 'roses',   price: 45, unit: 'per dozen', qty: 6,  image: 'flowers/Screenshot 2026-03-12 000052.png', subtotal: 270 },
          { id: 'peony-001', name: 'Blush Peonies',       category: 'peonies', price: 65, unit: 'per bunch',  qty: 4,  image: 'flowers/Screenshot 2026-03-12 000228.png',  subtotal: 260 },
        ],
        subtotal: 530, total: 530,
      },
      {
        id: 'GLF-260305-7732',
        status: 'pending',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        customer: {
          firstName: 'James',
          lastName:  'Torres',
          email:     'james@petal.studio',
          phone:     '(555) 388-2904',
          company:   'Petal Studio',
          address:   '88 Garden Street',
          city:      'Seattle, WA',
          notes:     'Wholesale order — need all stems trimmed to 50cm.',
        },
        items: [
          { id: 'hydrangea-001', name: 'Powder Blue Hydrangeas', category: 'hydrangeas', price: 35, unit: 'per bunch', qty: 10, image: 'flowers/Screenshot 2026-03-12 004202.png', subtotal: 350 },
          { id: 'tulip-002',     name: 'French Parrot Tulips',   category: 'tulips',     price: 32, unit: 'per bunch', qty: 8,  image: 'flowers/Screenshot 2026-03-12 001317.png', subtotal: 256 },
        ],
        subtotal: 606, total: 606,
      },
    ];
    saveAll(demoOrders);
  }

  return { getAll, create, getById, updateStatus, deleteOrder, getByStatus, getStats, formatDate, seedDemoIfEmpty, sanitize };
})();
