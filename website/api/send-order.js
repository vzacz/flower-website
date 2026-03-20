/* ============================================================
   GREEN LIFE FLOWERS — ORDER EMAIL API
   Vercel Serverless Function
   Sends order details to henryalanromero@hotmail.com via Resend
   ============================================================ */

const { Resend } = require('resend');

module.exports = async function handler(req, res) {
  // ── CORS headers (allow frontend to call this) ──
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    console.error(`[send-order] Wrong method: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // ── Parse body ──
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (err) {
    console.error('[send-order] Failed to parse request body:', err.message);
    return res.status(400).json({ error: 'Invalid JSON body.' });
  }

  const { customer, items, subtotal, total, orderId } = body;

  // ── Server-side validation ──
  if (!customer || !items || !Array.isArray(items) || items.length === 0) {
    console.error('[send-order] Missing required fields:', { hasCustomer: !!customer, itemCount: items?.length });
    return res.status(400).json({ error: 'Missing required order data (customer and items).' });
  }

  const { firstName, lastName, email } = customer;

  if (!firstName || !firstName.trim()) {
    return res.status(400).json({ error: 'First name is required.' });
  }
  if (!lastName || !lastName.trim()) {
    return res.status(400).json({ error: 'Last name is required.' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  // ── Check env var ──
  if (!process.env.RESEND_API_KEY) {
    console.error('[send-order] RESEND_API_KEY is not set in environment variables!');
    return res.status(500).json({ error: 'Email service is not configured. Contact the site owner.' });
  }

  // ── Build email HTML ──
  const itemRows = items.map(item => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;">${item.name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;text-align:center;">${item.qty}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;">${item.unit || ''}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;text-align:right;">$${(item.price * item.qty).toFixed(2)}</td>
    </tr>
  `).join('');

  const emailHtml = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;color:#2d2d2d;">
      <div style="background:#4a7c59;padding:28px 24px;border-radius:8px 8px 0 0;">
        <h1 style="margin:0;color:#fff;font-size:22px;font-weight:600;">🌿 New Order from Green Life Flowers</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Order ${orderId || 'N/A'}</p>
      </div>

      <div style="padding:24px;background:#fff;border:1px solid #e5e5e5;border-top:none;">
        <h2 style="font-size:16px;color:#4a7c59;margin:0 0 12px;border-bottom:2px solid #4a7c59;padding-bottom:6px;">Customer Details</h2>
        <table style="width:100%;font-size:14px;margin-bottom:20px;">
          <tr><td style="padding:4px 0;color:#888;width:120px;">Name</td><td style="padding:4px 0;font-weight:500;">${firstName} ${lastName}</td></tr>
          <tr><td style="padding:4px 0;color:#888;">Email</td><td style="padding:4px 0;"><a href="mailto:${email}" style="color:#4a7c59;">${email}</a></td></tr>
          ${customer.phone ? `<tr><td style="padding:4px 0;color:#888;">Phone</td><td style="padding:4px 0;">${customer.phone}</td></tr>` : ''}
          ${customer.company ? `<tr><td style="padding:4px 0;color:#888;">Company</td><td style="padding:4px 0;">${customer.company}</td></tr>` : ''}
          ${customer.address ? `<tr><td style="padding:4px 0;color:#888;">Address</td><td style="padding:4px 0;">${customer.address}${customer.city ? ', ' + customer.city : ''}</td></tr>` : ''}
          ${customer.notes ? `<tr><td style="padding:4px 0;color:#888;vertical-align:top;">Notes</td><td style="padding:4px 0;font-style:italic;">${customer.notes}</td></tr>` : ''}
        </table>

        <h2 style="font-size:16px;color:#4a7c59;margin:0 0 12px;border-bottom:2px solid #4a7c59;padding-bottom:6px;">Order Items</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          <thead>
            <tr style="background:#f5f5f0;">
              <th style="padding:10px 12px;text-align:left;font-size:13px;color:#666;font-weight:600;">Item</th>
              <th style="padding:10px 12px;text-align:center;font-size:13px;color:#666;font-weight:600;">Qty</th>
              <th style="padding:10px 12px;text-align:left;font-size:13px;color:#666;font-weight:600;">Unit</th>
              <th style="padding:10px 12px;text-align:right;font-size:13px;color:#666;font-weight:600;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <div style="text-align:right;padding:12px;background:#f5f5f0;border-radius:6px;">
          <span style="font-size:18px;font-weight:700;color:#2d2d2d;">Total: $${(total || subtotal || 0).toFixed(2)}</span>
        </div>
      </div>

      <div style="padding:16px 24px;background:#f9f9f6;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 8px 8px;font-size:12px;color:#999;text-align:center;">
        This order was submitted via the Green Life Flowers website.
      </div>
    </div>
  `;

  // ── Send via Resend ──
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    console.log(`[send-order] Sending order ${orderId} for ${firstName} ${lastName} (${email})...`);

    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Green Life Flowers <onboarding@resend.dev>',
      to: ['henryalanromero@hotmail.com'],
      replyTo: email.trim(),
      subject: `🌿 New Order ${orderId || ''} — ${firstName} ${lastName}`,
      html: emailHtml,
    });

    if (error) {
      console.error('[send-order] Resend API error:', JSON.stringify(error));
      return res.status(500).json({ error: 'Failed to send email. Please try again.', details: error.message });
    }

    console.log(`[send-order] Email sent successfully! Resend ID: ${data.id}`);
    return res.status(200).json({ success: true, messageId: data.id });

  } catch (err) {
    console.error('[send-order] Unexpected error:', err.message, err.stack);
    return res.status(500).json({ error: 'Server error while sending email.', details: err.message });
  }
};
