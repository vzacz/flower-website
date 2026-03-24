/* ── Delivery Area Banner ──────────────────────────────────
   Injects a fixed top banner on all pages notifying users
   about Bay Area-only delivery.
   ───────────────────────────────────────────────────────── */
(function() {
  // Don't show if user dismissed it this session
  if (sessionStorage.getItem('gl_banner_dismissed')) return;

  var banner = document.createElement('div');
  banner.className = 'delivery-banner';
  banner.id = 'deliveryBanner';
  banner.setAttribute('role', 'status');
  banner.innerHTML =
    '<span>\uD83D\uDE9A Bay Area Delivery Only \u2014 <a href="index.html#contact">Contact us</a> for orders outside the region</span>' +
    '<button class="delivery-banner-close" aria-label="Dismiss banner" title="Dismiss">&times;</button>';

  document.body.insertBefore(banner, document.body.firstChild);
  document.body.classList.add('has-delivery-banner');

  banner.querySelector('.delivery-banner-close').addEventListener('click', function() {
    banner.remove();
    document.body.classList.remove('has-delivery-banner');
    sessionStorage.setItem('gl_banner_dismissed', '1');
  });
})();
