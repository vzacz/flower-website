/* ============================================================
   POST /api/use-discount
   Marks a discount code as used in Supabase after checkout.
   Server-side source of truth — prevents code reuse.
   ============================================================ */

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { code, email, orderId } = req.body || {};

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, error: 'Discount code is required.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const cleanEmail = email ? email.toLowerCase().trim() : null;

    // Check if Supabase is configured
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(200).json({
        success: true,
        source: 'local',
        message: 'Marked locally (Supabase not configured).',
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the discount code record
    const { data: existing, error: fetchError } = await supabase
      .from('email_signups')
      .select('id, email, discount_code, used')
      .eq('discount_code', cleanCode)
      .limit(1);

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError);
      return res.status(200).json({ success: false, error: 'Database error.' });
    }

    if (!existing || existing.length === 0) {
      return res.status(200).json({ success: false, error: 'Discount code not found.' });
    }

    // Already used — reject
    if (existing[0].used) {
      return res.status(200).json({ success: false, error: 'This code has already been used.' });
    }

    // If email provided, verify code belongs to that email
    if (cleanEmail && existing[0].email !== cleanEmail) {
      return res.status(200).json({
        success: false,
        error: 'This discount code is linked to a different email address.',
      });
    }

    // Mark as used
    const { error: updateError } = await supabase
      .from('email_signups')
      .update({
        used: true,
        used_at: new Date().toISOString(),
        used_order_id: orderId || null,
      })
      .eq('id', existing[0].id);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return res.status(200).json({ success: false, error: 'Failed to mark code as used.' });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('use-discount error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};
