/* ============================================================
   GREEN LIFE FLOWERS — DELIVERY SLOT MANAGEMENT
   Tracks how many orders are booked per delivery date.
   Enforces: Mon-Thu delivery only, orders accepted any day. Max orders per day (configurable).
   Storage: localStorage (mirrors order data for fast lookups)
   ============================================================ */

const DeliverySlots = (() => {
  const STORAGE_KEY = 'greenlife_delivery_slots';

  /* ── CONFIG: Change this to adjust the max deliveries per day ── */
  const MAX_ORDERS_PER_DAY = 3;

  /* ── How many months ahead customers can book (12 = full year) ── */
  const MONTHS_AHEAD = 12;

  /* ── Allowed delivery days (0=Sun, 1=Mon, ..., 6=Sat) ── */
  const ALLOWED_DAYS = [1, 2, 3, 4]; // Mon, Tue, Wed, Thu

  /* ── Load slot counts from localStorage ── */
  function getSlots() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  /* ── Save slot counts ── */
  function saveSlots(slots) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
  }

  /* ── Rebuild slot counts from actual orders (source of truth) ── */
  function rebuildFromOrders() {
    if (typeof Orders === 'undefined') return;
    const orders = Orders.getAll();
    const slots = {};
    orders.forEach(order => {
      if (order.deliveryDate) {
        const key = order.deliveryDate; // "YYYY-MM-DD"
        slots[key] = (slots[key] || 0) + 1;
      }
    });
    saveSlots(slots);
    return slots;
  }

  /* ── Get the count of orders for a specific date ── */
  function getCount(dateStr) {
    const slots = getSlots();
    return slots[dateStr] || 0;
  }

  /* ── Check if a date is a valid delivery day (Mon-Thu) ── */
  function isDeliveryDay(date) {
    return ALLOWED_DAYS.includes(date.getDay());
  }

  /* ── Check if a date is available (valid day + not full) ── */
  function isAvailable(dateStr) {
    const date = new Date(dateStr + 'T12:00:00'); // noon to avoid TZ issues
    if (!isDeliveryDay(date)) return false;

    // Must be in the future (not today or past)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    if (checkDate <= today) return false;

    return getCount(dateStr) < MAX_ORDERS_PER_DAY;
  }

  /* ── Reserve a slot (increment count) ── */
  function reserve(dateStr) {
    const slots = getSlots();
    slots[dateStr] = (slots[dateStr] || 0) + 1;
    saveSlots(slots);
  }

  /* ── Release a slot (decrement count) — used if order is deleted ── */
  function release(dateStr) {
    const slots = getSlots();
    if (slots[dateStr] && slots[dateStr] > 0) {
      slots[dateStr] -= 1;
      if (slots[dateStr] === 0) delete slots[dateStr];
      saveSlots(slots);
    }
  }

  /* ── Format a date string for display ── */
  function formatForDisplay(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  /* ── Get the furthest date customers can book ── */
  function getMaxDate() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + MONTHS_AHEAD, now.getDate());
  }

  /* ── Get the earliest available delivery date ── */
  function getEarliestAvailable() {
    const limit = getMaxDate();
    const check = new Date();
    check.setDate(check.getDate() + 1); // start from tomorrow

    while (check <= limit) {
      const dateStr = toDateStr(check);
      if (isAvailable(dateStr)) return dateStr;
      check.setDate(check.getDate() + 1);
    }
    return null;
  }

  /* ── Convert Date to "YYYY-MM-DD" string ── */
  function toDateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /* ── Get all dates for a calendar month with availability info ── */
  function getMonthData(year, month) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxBookingDate = getMaxDate();

    const slots = getSlots();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = toDateStr(date);
      const count = slots[dateStr] || 0;
      const isAllowed = ALLOWED_DAYS.includes(date.getDay());
      const isPast = date <= today;
      const isBeyondMax = date > maxBookingDate;
      const isFull = count >= MAX_ORDERS_PER_DAY;

      days.push({
        date: d,
        dateStr,
        dayOfWeek: date.getDay(),
        isAllowed,
        isPast: isPast || isBeyondMax,
        isFull,
        isAvailable: isAllowed && !isPast && !isBeyondMax && !isFull,
        count,
        spotsLeft: Math.max(0, MAX_ORDERS_PER_DAY - count),
      });
    }

    return {
      year,
      month,
      firstDayOfWeek: firstDay.getDay(),
      days,
    };
  }

  return {
    MAX_ORDERS_PER_DAY,
    MONTHS_AHEAD,
    ALLOWED_DAYS,
    getSlots,
    rebuildFromOrders,
    getCount,
    isDeliveryDay,
    isAvailable,
    reserve,
    release,
    formatForDisplay,
    getEarliestAvailable,
    getMaxDate,
    toDateStr,
    getMonthData,
  };
})();
