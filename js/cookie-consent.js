/* ============================================================
   GREEN LIFE FLOWERS — COOKIE / PRIVACY CONSENT BANNER
   Shows once per visitor. Stores preference in localStorage.
   ============================================================ */

const CookieConsent = (() => {
  const STORAGE_KEY = 'glf_cookie_consent';

  function hasConsented() {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  function setConsent(value) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      consent: value,
      date: new Date().toISOString(),
    }));
  }

  function init() {
    if (hasConsented()) return;

    // Build banner
    const banner = document.createElement('div');
    banner.id = 'cookieConsent';
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie and privacy notice');

    banner.innerHTML = `
      <div class="cookie-banner-inner">
        <div class="cookie-banner-content">
          <div class="cookie-banner-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <p class="cookie-banner-text">
              We use cookies and collect personal data (email, name, address) to process your orders and improve your experience.
              By continuing to use this site, you agree to our
              <a href="privacy.html" class="cookie-banner-link">Privacy Policy</a>.
            </p>
          </div>
        </div>
        <div class="cookie-banner-actions">
          <button class="cookie-btn cookie-btn-accept" id="cookieAccept">Accept</button>
          <button class="cookie-btn cookie-btn-decline" id="cookieDecline">Decline Non-Essential</button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Animate in after short delay
    requestAnimationFrame(() => {
      requestAnimationFrame(() => banner.classList.add('visible'));
    });

    // Accept
    document.getElementById('cookieAccept').addEventListener('click', () => {
      setConsent('accepted');
      closeBanner(banner);
    });

    // Decline non-essential
    document.getElementById('cookieDecline').addEventListener('click', () => {
      setConsent('essential_only');
      closeBanner(banner);
    });
  }

  function closeBanner(banner) {
    banner.classList.remove('visible');
    banner.classList.add('closing');
    setTimeout(() => banner.remove(), 400);
  }

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { hasConsented, setConsent, init };
})();
