/* ============================================================
   GREEN LIFE FLOWERS — STORE CREDIT SYSTEM
   Handles: adding manual store credit, tracking per-customer,
            linking credits to orders, credit history
   Storage: localStorage (no backend required)
   ============================================================ */

const StoreCredit = (() => {
  const STORAGE_KEY = 'greenlife_store_credits';

  /* ── Load all credits from localStorage ── */
  function getAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /* ── Save credits array back to localStorage ── */
  function saveAll(credits) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(credits));
  }

  /* ── Add store credit for a customer ── */
  function addCredit(customerEmail, orderId, amount, note) {
    const credits = getAll();

    const entry = {
      id: 'SC-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      customerEmail: customerEmail.toLowerCase().trim(),
      orderId: orderId,
      amount: parseFloat(amount),
      note: note || '',
      createdAt: new Date().toISOString(),
    };

    credits.unshift(entry);
    saveAll(credits);
    return entry;
  }

  /* ── Get all credits for a customer (by email) ── */
  function getByCustomer(email) {
    if (!email) return [];
    return getAll().filter(c => c.customerEmail === email.toLowerCase().trim());
  }

  /* ── Get all credits linked to a specific order ── */
  function getByOrder(orderId) {
    if (!orderId) return [];
    return getAll().filter(c => c.orderId === orderId);
  }

  /* ── Get total balance for a customer ── */
  function getBalance(email) {
    const credits = getByCustomer(email);
    return credits.reduce((sum, c) => sum + c.amount, 0);
  }

  /* ── Format date for display ── */
  function formatDate(isoString) {
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  }

  /* ── Update a credit entry (amount and/or note) ── */
  function updateCredit(id, newAmount, newNote) {
    const credits = getAll();
    const idx = credits.findIndex(c => c.id === id);
    if (idx === -1) return false;
    if (newAmount !== undefined) credits[idx].amount = parseFloat(newAmount);
    if (newNote !== undefined) credits[idx].note = newNote;
    credits[idx].updatedAt = new Date().toISOString();
    saveAll(credits);
    return true;
  }

  /* ── Delete a single credit entry ── */
  function deleteCredit(id) {
    const credits = getAll().filter(c => c.id !== id);
    saveAll(credits);
  }

  return {
    getAll,
    addCredit,
    getByCustomer,
    getByOrder,
    getBalance,
    formatDate,
    updateCredit,
    deleteCredit,
  };
})();
