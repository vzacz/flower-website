/* ============================================================
   GREEN LIFE FLOWERS — EMAIL SIGNUP POPUP + DISCOUNT SYSTEM
   ============================================================
   Handles:
   - Popup display with delay / exit-intent
   - Email validation & submission (API + localStorage fallback)
   - Discount code generation & storage
   - Admin panel: email signups table + CSV export
   - Discount code validation for checkout
   ============================================================ */

const EmailPopup = (() => {
  'use strict';

  /* ── Config ── */
  const STORAGE_KEYS = {
    popupDismissed: 'glf_popup_dismissed',
    popupDismissedAt: 'glf_popup_dismissed_at',
    emailSignups: 'glf_email_signups',
    discountCodes: 'glf_discount_codes',
  };
  const POPUP_DELAY_MS = 2000;        // Show after 2 seconds
  const DISMISS_DAYS = 1;             // Don't show again for 1 day
  const DISCOUNT_PERCENT = 10;        // 10% off
  const CODE_PREFIX = 'GLF-WELCOME';

  /* ── DOM refs (lazy) ── */
  let els = {};

  /* ── Generate unique discount code ── */
  function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let suffix = '';
    for (let i = 0; i < 4; i++) {
      suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    return `${CODE_PREFIX}-${suffix}`;
  }

  /* ── localStorage helpers ── */
  function getSignups() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.emailSignups) || '[]');
    } catch { return []; }
  }

  function saveSignup(email, code) {
    const signups = getSignups();
    // Prevent duplicate emails
    if (signups.some(s => s.email.toLowerCase() === email.toLowerCase())) {
      const existing = signups.find(s => s.email.toLowerCase() === email.toLowerCase());
      return existing ? existing.code : code;
    }
    signups.unshift({
      email: email.toLowerCase().trim(),
      code: code,
      used: false,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEYS.emailSignups, JSON.stringify(signups));
    return code;
  }

  function getDiscountCodes() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.discountCodes) || '[]');
    } catch { return []; }
  }

  function saveDiscountCode(code, email) {
    const codes = getDiscountCodes();
    if (codes.some(c => c.code === code)) return;
    codes.push({
      code: code,
      email: email,
      percent: DISCOUNT_PERCENT,
      used: false,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEYS.discountCodes, JSON.stringify(codes));
  }

  function markCodeUsedLocal(code) {
    // Mark in discount codes (localStorage)
    const codes = getDiscountCodes();
    const idx = codes.findIndex(c => c.code === code);
    if (idx !== -1) {
      codes[idx].used = true;
      codes[idx].usedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.discountCodes, JSON.stringify(codes));
    }
    // Mark in signups (localStorage)
    const signups = getSignups();
    const sIdx = signups.findIndex(s => s.code === code);
    if (sIdx !== -1) {
      signups[sIdx].used = true;
      localStorage.setItem(STORAGE_KEYS.emailSignups, JSON.stringify(signups));
    }
  }

  /* ── Mark code as used — calls server first, then localStorage ── */
  async function markCodeUsed(code, email, orderId) {
    // Always mark locally
    markCodeUsedLocal(code);

    // Also mark on server (source of truth)
    try {
      await fetch('/api/use-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, email: email || '', orderId: orderId || '' }),
      });
    } catch {
      // Server unavailable — local mark is the fallback
    }
  }

  /* ── Validate a discount code — returns { valid, percent, error } ── */
  /* Synchronous local validation (fast fallback) */
  function validateCodeLocal(code) {
    if (!code || typeof code !== 'string') {
      return { valid: false, percent: 0, error: 'Please enter a discount code.' };
    }
    const cleaned = code.trim().toUpperCase();
    const codes = getDiscountCodes();
    const match = codes.find(c => c.code === cleaned);

    if (!match) {
      return { valid: false, percent: 0, error: 'Invalid discount code.' };
    }
    if (match.used) {
      return { valid: false, percent: 0, error: 'This code has already been used.' };
    }
    return { valid: true, percent: match.percent, code: match.code, error: null };
  }

  /* Async server-first validation (source of truth) */
  async function validateCode(code, email) {
    if (!code || typeof code !== 'string') {
      return { valid: false, percent: 0, error: 'Please enter a discount code.' };
    }

    // Try server validation first
    try {
      const res = await fetch('/api/validate-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, email: email || '' }),
      });
      if (res.ok) {
        const data = await res.json();
        // If server gave a definitive answer (not a fallback), use it
        if (!data.fallback) {
          return {
            valid: data.valid,
            percent: data.valid ? data.percent : 0,
            code: data.code || code.trim().toUpperCase(),
            email: data.email || null,
            error: data.error || null,
          };
        }
      }
    } catch {
      // Server unavailable — fall through to local validation
    }

    // Fallback to localStorage validation
    return validateCodeLocal(code);
  }

  /* ── Should we show the popup? ── */
  function shouldShow() {
    // Session-level: don't show again in this tab session
    if (sessionStorage.getItem('glf_popup_shown')) return false;
    // Long-term: check if user already submitted their email
    const signups = getSignups();
    if (signups.length > 0) return false;
    return true;
  }

  function markDismissed() {
    sessionStorage.setItem('glf_popup_shown', 'true');
  }

  /* ── Show / Hide popup ── */
  function show() {
    if (!els.popup) return;
    els.backdrop.classList.add('active');
    els.popup.classList.add('active');
    document.body.style.overflow = 'hidden';
    // Focus the input
    setTimeout(() => els.input && els.input.focus(), 400);
  }

  function hide() {
    if (!els.popup) return;
    els.backdrop.classList.remove('active');
    els.popup.classList.remove('active');
    document.body.style.overflow = '';
  }

  /* ── Email validation ── */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /* ── Submit handler ── */
  async function handleSubmit(e) {
    e.preventDefault();

    const email = els.input.value.trim();
    const errorEl = els.error;
    const submitBtn = els.submitBtn;

    // Reset error state
    els.input.classList.remove('error');
    errorEl.classList.remove('visible');

    // Validate
    if (!email || !isValidEmail(email)) {
      els.input.classList.add('error');
      errorEl.textContent = !email ? 'Please enter your email address.' : 'Please enter a valid email address.';
      errorEl.classList.add('visible');
      els.input.focus();
      return;
    }

    // Check localStorage first — if this email already signed up, block immediately
    const existingSignups = getSignups();
    const alreadyLocal = existingSignups.find(s => s.email.toLowerCase() === email.toLowerCase());
    if (alreadyLocal) {
      showAlreadySubscribed();
      return;
    }

    // Loading state
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');

    // Generate code
    const code = generateCode();

    // Try API call — server is source of truth
    try {
      const res = await fetch('/api/signup-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      if (res.ok) {
        const data = await res.json();

        // Server says email already received the welcome offer
        if (data.already_subscribed) {
          submitBtn.disabled = false;
          submitBtn.classList.remove('loading');
          showAlreadySubscribed();
          return;
        }

        // New signup succeeded on server
        if (data.success && data.code) {
          // Save locally as cache
          saveSignup(email, data.code);
          saveDiscountCode(data.code, email);
          showSuccess(data.code, email);
          return;
        }

        // Fallback: server returned source: 'local' (Supabase not configured)
        if (data.source === 'local' && data.code) {
          saveSignup(email, data.code);
          saveDiscountCode(data.code, email);
          showSuccess(data.code, email);
          return;
        }
      }
    } catch {
      // API not available — continue with localStorage fallback
    }

    // Save locally (fallback when API is unavailable)
    const finalCode = saveSignup(email, code);
    saveDiscountCode(finalCode, email);

    showSuccess(finalCode, email);
  }

  /* ── Show "already subscribed" message in popup ── */
  function showAlreadySubscribed() {
    markDismissed();
    els.formState.style.display = 'none';
    els.success.classList.add('active');
    els.codeDisplay.textContent = '';

    // Replace the success content with an already-subscribed message
    const successInner = els.success;
    successInner.innerHTML = `
      <div style="text-align:center;padding:8px 0">
        <div style="font-size:2rem;margin-bottom:12px">📧</div>
        <div style="font-family:var(--font-heading,Georgia,serif);font-size:1.15rem;color:var(--dark,#1a1a1a);margin-bottom:8px;font-weight:500">
          Already Subscribed
        </div>
        <div style="font-size:0.88rem;color:var(--text-muted,#888);line-height:1.5;margin-bottom:16px">
          This email has already received the welcome offer.<br>
          Each customer can only receive one welcome discount.
        </div>
        <a href="index.html" style="font-size:0.85rem;color:var(--sage-dark,#5a7a5e);font-weight:500;text-decoration:none">
          Continue Shopping →
        </a>
      </div>
    `;

    // Reset button state
    els.submitBtn.disabled = false;
    els.submitBtn.classList.remove('loading');
  }

  function showSuccess(code, email) {
    // Save locally as well (in case API saved but local didn't)
    saveSignup(email, code);
    saveDiscountCode(code, email);

    // Mark popup as submitted (don't show again)
    markDismissed();

    // Hide form, show success
    els.formState.style.display = 'none';
    els.success.classList.add('active');
    els.codeDisplay.textContent = code;

    // Reset button
    els.submitBtn.disabled = false;
    els.submitBtn.classList.remove('loading');
  }

  /* ── Copy code to clipboard ── */
  function handleCopy() {
    const code = els.codeDisplay.textContent;
    if (!code || code === '---') return;
    navigator.clipboard.writeText(code).then(() => {
      els.copyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sage-dark)" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>';
      setTimeout(() => {
        els.copyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
      }, 2000);
    }).catch(() => {});
  }

  /* ── Exit intent detection (desktop only) ── */
  function setupExitIntent() {
    if ('ontouchstart' in window) return; // Skip on mobile
    let triggered = false;
    document.addEventListener('mouseout', (e) => {
      if (triggered) return;
      if (e.clientY <= 5 && shouldShow()) {
        triggered = true;
        show();
      }
    });
  }

  /* ── Remove a signup by email ── */
  function removeSignup(email) {
    const signups = getSignups().filter(s => s.email !== email);
    localStorage.setItem(STORAGE_KEYS.emailSignups, JSON.stringify(signups));
    // Also remove the discount code
    const codes = getDiscountCodes().filter(c => c.email !== email);
    localStorage.setItem(STORAGE_KEYS.discountCodes, JSON.stringify(codes));
  }

  /* ── Admin: render email signups table ── */
  function renderAdminTable() {
    const tbody = document.getElementById('adminEmailsBody');
    const countEl = document.getElementById('adminEmailCount');
    if (!tbody) return;

    const signups = getSignups();
    if (countEl) countEl.textContent = `${signups.length} signup${signups.length !== 1 ? 's' : ''}`;

    if (signups.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:32px">No signups yet.</td></tr>';
      return;
    }

    tbody.innerHTML = signups.map(s => {
      const date = new Date(s.createdAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      return `<tr>
        <td style="font-weight:500">${escapeHtml(s.email)}</td>
        <td><code style="font-size:0.8rem;background:var(--sage-pale);padding:3px 8px;border-radius:4px;color:var(--sage-dark);letter-spacing:0.04em">${escapeHtml(s.code)}</code></td>
        <td>${s.used
          ? '<span class="admin-status-badge completed">Used</span>'
          : '<span class="admin-status-badge pending">Unused</span>'
        }</td>
        <td style="color:var(--text-muted);font-size:0.82rem">${date}</td>
        <td><button onclick="if(confirm('Delete this signup?')){EmailPopup.removeSignup('${escapeHtml(s.email)}');EmailPopup.renderAdminTable()}" style="font-size:0.78rem;padding:4px 10px;border:none;background:none;color:var(--text-muted);cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='#C0392B'" onmouseout="this.style.color='var(--text-muted)'" title="Delete">✕</button></td>
      </tr>`;
    }).join('');
  }

  /* ── Admin: export CSV ── */
  function exportCSV() {
    const signups = getSignups();
    if (signups.length === 0) return;
    const header = 'Email,Discount Code,Used,Signed Up\n';
    const rows = signups.map(s =>
      `${s.email},${s.code},${s.used ? 'Yes' : 'No'},${s.createdAt}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `greenlife-email-signups-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function escapeHtml(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── Init ── */
  function init() {
    // Cache DOM elements
    els = {
      backdrop: document.getElementById('emailPopupBackdrop'),
      popup: document.getElementById('emailPopup'),
      closeBtn: document.getElementById('emailPopupClose'),
      form: document.getElementById('emailPopupForm'),
      input: document.getElementById('emailPopupInput'),
      error: document.getElementById('emailPopupError'),
      submitBtn: document.getElementById('emailPopupSubmit'),
      formState: document.getElementById('emailPopupFormState'),
      success: document.getElementById('emailPopupSuccess'),
      codeDisplay: document.getElementById('emailPopupCode'),
      copyBtn: document.getElementById('emailPopupCopyBtn'),
      shopLink: document.getElementById('emailPopupShopLink'),
    };

    if (!els.popup) return;

    // Event listeners
    els.closeBtn.addEventListener('click', () => { markDismissed(); hide(); });
    els.backdrop.addEventListener('click', () => { markDismissed(); hide(); });
    els.form.addEventListener('submit', handleSubmit);
    els.copyBtn.addEventListener('click', handleCopy);

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && els.popup.classList.contains('active')) {
        markDismissed();
        hide();
      }
    });

    // "Start Shopping" link closes popup
    els.shopLink.addEventListener('click', () => {
      hide();
    });

    // Clear input error on typing
    els.input.addEventListener('input', () => {
      els.input.classList.remove('error');
      els.error.classList.remove('visible');
    });

    // Show popup after delay (if not dismissed)
    if (shouldShow()) {
      setTimeout(() => {
        if (shouldShow()) show();
      }, POPUP_DELAY_MS);
    }

    // Exit intent (backup trigger)
    setupExitIntent();

    // Admin tab: render signups table when tab is clicked
    const emailTabBtn = document.querySelector('[data-admin-tab="emailSignups"]');
    if (emailTabBtn) {
      emailTabBtn.addEventListener('click', renderAdminTable);
    }

    // Admin: CSV export
    const exportBtn = document.getElementById('adminExportEmailsBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportCSV);
    }
  }

  // Run init immediately if DOM is already ready, otherwise wait
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API (for checkout page to use)
  return {
    validateCode,        // async — server-first, returns Promise
    validateCodeLocal,   // sync — localStorage only (fast fallback)
    markCodeUsed,        // async — marks on server + localStorage
    getSignups,
    getDiscountCodes,
    removeSignup,
    renderAdminTable,
    DISCOUNT_PERCENT,
  };
})();
