/* ============================================================
   GREEN LIFE FLOWERS — REFUND SYSTEM
   Handles: recording manual refunds, tracking per-order,
            sending customer email notifications
   Storage: localStorage (no backend required)
   NOTE: This is separate from Store Credit. Refunds do NOT
         affect the customer's store credit balance.
   ============================================================ */

const Refunds = (() => {
  const STORAGE_KEY = 'greenlife_refunds';

  function getAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveAll(refunds) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(refunds));
  }

  /* ── Record a new refund ── */
  function addRefund(orderId, customerEmail, customerName, amount, reason) {
    const refunds = getAll();

    const entry = {
      id: 'RF-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      orderId: orderId,
      customerEmail: (customerEmail || '').toLowerCase().trim(),
      customerName: customerName || '',
      amount: parseFloat(amount),
      reason: reason || '',
      createdAt: new Date().toISOString(),
    };

    refunds.unshift(entry);
    saveAll(refunds);
    return entry;
  }

  /* ── Get all refunds for a specific order ── */
  function getByOrder(orderId) {
    if (!orderId) return [];
    return getAll().filter(r => r.orderId === orderId);
  }

  /* ── Get total refunded for an order ── */
  function getOrderTotal(orderId) {
    return getByOrder(orderId).reduce((sum, r) => sum + r.amount, 0);
  }

  /* ── Delete a refund entry ── */
  function deleteRefund(id) {
    const refunds = getAll().filter(r => r.id !== id);
    saveAll(refunds);
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

  /* ── Send refund notification email via mailto ── */
  function sendRefundEmail(customerName, customerEmail, amount, reason) {
    if (!customerEmail) return;

    const firstName = (customerName || '').split(' ')[0] || 'Customer';
    const amountStr = '$' + parseFloat(amount).toFixed(2);
    const reasonLine = reason ? `\nReason: ${reason}\n` : '';

    const subject = encodeURIComponent('Refund Processed for Your Order');
    const body = encodeURIComponent(
      `Hi ${firstName},\n\n` +
      `We have issued a refund of ${amountStr} for your order.\n` +
      reasonLine +
      `\nThank you,\nGreen Life Flowers`
    );

    window.open(`mailto:${customerEmail}?subject=${subject}&body=${body}`, '_blank');
  }

  return {
    getAll,
    addRefund,
    getByOrder,
    getOrderTotal,
    deleteRefund,
    formatDate,
    sendRefundEmail,
  };
})();
