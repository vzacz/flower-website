/* ============================================================
   POST /api/validate-discount
   Validates a discount code against Supabase.
   Falls back gracefully if Supabase is not configured.
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
    const { code } = req.body || {};

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ valid: false, error: 'Discount code is required.' });
    }

    const cleanCode = code.trim().toUpperCase();

    // Check if Supabase is configured
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      // Can't validate server-side — let frontend handle it
      return res.status(200).json({
        valid: false,
        error: 'Server validation unavailable. Using local validation.',
        fallback: true,
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('email_signups')
      .select('email, discount_code, used')
      .eq('discount_code', cleanCode)
      .limit(1);

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(200).json({ valid: false, error: 'Validation error.', fallback: true });
    }

    if (!data || data.length === 0) {
      return res.status(200).json({ valid: false, error: 'Invalid discount code.' });
    }

    if (data[0].used) {
      return res.status(200).json({ valid: false, error: 'This code has already been used.' });
    }

    return res.status(200).json({
      valid: true,
      percent: 10,
      code: data[0].discount_code,
    });

  } catch (err) {
    console.error('validate-discount error:', err);
    return res.status(500).json({ valid: false, error: 'Internal server error.' });
  }
};
