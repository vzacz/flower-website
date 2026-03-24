/* ── Floating WhatsApp Button ─────────────────────────────
   Reusable across all pages. Injects itself into the DOM.
   Adjusts position when email popup is visible.
   ───────────────────────────────────────────────────────── */
(() => {
  const PHONE = '14154126225';
  const MESSAGE = encodeURIComponent("Hi, I'm interested in your flowers!");
  const WA_URL = `https://wa.me/${PHONE}?text=${MESSAGE}`;

  // Create button
  const btn = document.createElement('a');
  btn.href = WA_URL;
  btn.target = '_blank';
  btn.rel = 'noopener noreferrer';
  btn.className = 'whatsapp-float';
  btn.setAttribute('aria-label', 'Chat on WhatsApp');
  btn.setAttribute('title', 'Chat on WhatsApp');
  btn.innerHTML = `
    <svg viewBox="0 0 32 32" width="28" height="28" fill="#fff">
      <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.9 15.9 0 0016.004 32C24.826 32 32 24.826 32 16.004 32 7.176 24.826 0 16.004 0zm9.312 22.594c-.39 1.1-2.274 2.1-3.132 2.174-.804.068-1.558.384-5.252-1.094-4.45-1.78-7.284-6.35-7.504-6.642-.22-.294-1.79-2.384-1.79-4.548s1.134-3.226 1.538-3.668c.404-.44.882-.552 1.176-.552.294 0 .588.002.844.016.272.014.636-.104.994.758.39.936 1.322 3.228 1.438 3.462.116.234.194.506.038.8-.154.296-.234.478-.46.738-.228.26-.478.58-.682.778-.228.22-.466.46-.2.902.268.44 1.186 1.96 2.548 3.176 1.75 1.562 3.226 2.046 3.684 2.276.456.228.724.192.99-.116.266-.31 1.142-1.332 1.448-1.79.304-.46.61-.378 1.028-.228.42.15 2.654 1.252 3.11 1.48.456.228.76.342.874.53.116.186.116 1.092-.274 2.194z"/>
    </svg>`;

  document.body.appendChild(btn);

  // Watch for email popup visibility to shift button up
  const popup = document.getElementById('emailPopup');
  if (popup) {
    const observer = new MutationObserver(() => {
      const isVisible = popup.classList.contains('active') ||
                        getComputedStyle(popup).display !== 'none';
      btn.classList.toggle('whatsapp-float--shifted', isVisible);
    });
    observer.observe(popup, { attributes: true, attributeFilter: ['class', 'style'] });
  }
})();
