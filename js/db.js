/* ============================================================
   GREEN LIFE FLOWERS — DATABASE SYNC ENGINE
   ============================================================
   This module connects your website to Supabase so that:
   - Admin panel edits are saved to the cloud (visible to everyone)
   - The website loads fresh data from the cloud on every visit
   - localStorage acts as a fast local cache

   HOW IT WORKS:
   1. On page load → fetch latest data from Supabase → update localStorage
   2. When admin saves anything → automatically push to Supabase
   3. Existing code keeps reading from localStorage (no changes needed)
   ============================================================ */

const DB = (() => {
  'use strict';

  let client = null;
  let syncing = false; // prevents push-back during initial sync

  /* ── localStorage keys → Supabase row keys ── */
  const TRACKED_KEYS = {
    'greenlife_products':       'products',
    'greenlife_flower_list':    'categories',
    'greenlife_orders':         'orders',
    'gl_faq_data':              'faq_data',
    'greenlife_about':          'about_content',
    'greenlife_store_credits':  'store_credits',
    'greenlife_refunds':        'refunds',
    'greenlife_delivery_slots': 'delivery_slots',
    'glf_email_signups':        'email_signups',
    'glf_discount_codes':       'discount_codes',
  };

  /* ── Intercept localStorage.setItem to auto-push tracked keys ── */
  const _originalSetItem = localStorage.setItem.bind(localStorage);

  localStorage.setItem = function (key, value) {
    // Always write to localStorage first (keeps existing behavior)
    _originalSetItem(key, value);

    // If we're syncing from cloud or Supabase isn't configured, skip push
    if (syncing || !client) return;

    // If this key is tracked, push to Supabase in the background
    if (TRACKED_KEYS[key]) {
      pushToCloud(key, value);
    }
  };

  /* ── Push a single key to Supabase ── */
  async function pushToCloud(localStorageKey, rawValue) {
    const supaKey = TRACKED_KEYS[localStorageKey];
    if (!supaKey) return;

    try {
      const value = JSON.parse(rawValue);
      const { error } = await client.from('site_data').upsert(
        { key: supaKey, value: value, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
      if (error) throw error;
    } catch (err) {
      console.warn('[DB] Push failed for', supaKey, ':', err.message);
    }
  }

  /* ── Initialize: connect to Supabase and sync data ── */
  async function init() {
    // Skip if not configured
    if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) return;
    if (window.SUPABASE_URL === 'YOUR_SUPABASE_URL') return;

    // Check that supabase-js CDN loaded
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      console.warn('[DB] Supabase JS not loaded');
      return;
    }

    client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

    try {
      syncing = true;

      // Fetch all data from the cloud
      const { data, error } = await client.from('site_data').select('*');
      if (error) throw error;

      if (data && data.length > 0) {
        // Cloud has data — write it to localStorage (as cache)
        const cloudKeys = new Set();

        for (const row of data) {
          // Find which localStorage key maps to this Supabase key
          const lsKey = Object.entries(TRACKED_KEYS).find(([, v]) => v === row.key)?.[0];
          if (lsKey && row.value != null) {
            _originalSetItem(lsKey, JSON.stringify(row.value));
            cloudKeys.add(row.key);
          }
        }

        syncing = false;

        // Seed any keys that exist locally but not yet in cloud
        for (const [lsKey, supaKey] of Object.entries(TRACKED_KEYS)) {
          if (!cloudKeys.has(supaKey)) {
            const existing = localStorage.getItem(lsKey);
            if (existing) pushToCloud(lsKey, existing);
          }
        }
      } else {
        // Cloud is empty (first time setup) — seed from current localStorage
        syncing = false;

        for (const lsKey of Object.keys(TRACKED_KEYS)) {
          const existing = localStorage.getItem(lsKey);
          if (existing) pushToCloud(lsKey, existing);
        }
      }

      // Tell pages that fresh data is ready so they can re-render
      document.dispatchEvent(new Event('db-synced'));

    } catch (err) {
      console.warn('[DB] Cloud sync failed, using localStorage only:', err.message);
      syncing = false;
    }
  }

  return { init };
})();

/* ── Auto-init when DOM is ready ── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => DB.init());
} else {
  DB.init();
}
