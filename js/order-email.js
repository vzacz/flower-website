/* ============================================================
   GREEN LIFE FLOWERS — ORDER CONFIRMATION EMAIL
   Uses EmailJS (free tier: 200 emails/month)

   SETUP:
   1. Sign up at https://www.emailjs.com (free)
   2. Create an Email Service (Gmail, Outlook, etc.)
   3. Create an Email Template with these variables:
      - {{order_id}}
      - {{customer_name}}
      - {{customer_email}}
      - {{order_items}}
      - {{order_total}}
      - {{delivery_date}}
      - {{order_notes}}
   4. Update the IDs below with your EmailJS credentials
   ============================================================ */

const OrderEmail = (() => {
  /* ── EmailJS Configuration ── */
  const CONFIG = {
    publicKey:  'wuYbjZD-f1vHnsvl9',
    serviceId:  'service_ut0ujye',
    templateId: 'template_1sl7d5s',
  };

  const EMAILJS_CDN = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';

  let emailjsLoaded = false;
  let emailjsLoading = false;

  /* ── Load EmailJS SDK on demand ── */
  function loadEmailJS() {
    return new Promise((resolve, reject) => {
      if (emailjsLoaded) { resolve(); return; }
      if (emailjsLoading) {
        // Wait for existing load
        const check = setInterval(() => {
          if (emailjsLoaded) { clearInterval(check); resolve(); }
        }, 100);
        return;
      }

      emailjsLoading = true;
      const script = document.createElement('script');
      script.src = EMAILJS_CDN;
      script.onload = () => {
        if (typeof emailjs !== 'undefined') {
          emailjs.init(CONFIG.publicKey);
          emailjsLoaded = true;
        }
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load EmailJS'));
      document.head.appendChild(script);
    });
  }

  /* ── Check if EmailJS is configured ── */
  function isConfigured() {
    return CONFIG.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY'
        && CONFIG.serviceId !== 'YOUR_SERVICE_ID'
        && CONFIG.templateId !== 'YOUR_TEMPLATE_ID';
  }

  /* ── Format order items for email ── */
  function formatItems(items) {
    return items.map(item =>
      `${item.name} — ${item.unit} x ${item.qty} — $${(item.price * item.qty).toFixed(2)}`
    ).join('\n');
  }

  /* ── Format delivery date ── */
  function formatDate(dateStr) {
    if (!dateStr) return 'To be arranged';
    try {
      const d = new Date(dateStr + 'T12:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  /* ── Send order confirmation email ── */
  async function sendConfirmation(order) {
    if (!isConfigured()) {
      console.log('[OrderEmail] EmailJS not configured — skipping email send.');
      console.log('[OrderEmail] To enable emails, update CONFIG in js/order-email.js');
      return { success: false, reason: 'not_configured' };
    }

    try {
      await loadEmailJS();

      const templateParams = {
        order_id:       order.id,
        customer_name:  `${order.customer.firstName} ${order.customer.lastName}`,
        customer_email: order.customer.email,
        order_items:    formatItems(order.items),
        order_total:    `$${order.total.toFixed(2)}`,
        delivery_date:  formatDate(order.deliveryDate),
        order_notes:    order.customer.notes || 'None',
        company:        order.customer.company || '',
        address:        order.customer.address || '',
        city:           order.customer.city || '',
        phone:          order.customer.phone || '',
      };

      console.log('[OrderEmail] Sending with params:', templateParams);
      const response = await emailjs.send(CONFIG.serviceId, CONFIG.templateId, templateParams);
      console.log('[OrderEmail] Confirmation sent:', response.status, response.text);
      return { success: true };
    } catch (err) {
      console.error('[OrderEmail] Failed to send. Error:', err?.text || err?.message || err);
      console.error('[OrderEmail] Full error:', JSON.stringify(err));
      return { success: false, reason: 'send_failed', error: err };
    }
  }

  return { sendConfirmation, isConfigured };
})();
