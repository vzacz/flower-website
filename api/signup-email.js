/* ============================================================
   POST /api/signup-email
   Saves an email signup + discount code to Supabase.
   One-time welcome discount per email — database is source of truth.
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
    const { email, code } = req.body || {};

    // Validate email
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required.' });
    }
    const cleanEmail = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }
    if (cleanEmail.length > 200) {
      return res.status(400).json({ error: 'Email too long.' });
    }

    // Validate discount code
    if (!code || typeof code !== 'string' || code.length > 30) {
      return res.status(400).json({ error: 'Invalid discount code.' });
    }

    // Check if Supabase is configured
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      // Supabase not configured — return success so frontend still works
      return res.status(200).json({
        success: true,
        code: code,
        source: 'local',
        message: 'Saved locally (Supabase not configured).',
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for existing signup with this email
    const { data: existing } = await supabase
      .from('email_signups')
      .select('email, discount_code, used')
      .eq('email', cleanEmail)
      .limit(1);

    if (existing && existing.length > 0) {
      // Email already signed up — do NOT issue a new code
      return res.status(200).json({
        success: false,
        already_subscribed: true,
        used: existing[0].used || false,
        message: 'This email has already received the welcome offer.',
      });
    }

    // Insert new signup
    const { data, error } = await supabase
      .from('email_signups')
      .insert({
        email: cleanEmail,
        discount_code: code.trim().toUpperCase(),
        used: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      // Still return success so frontend works
      return res.status(200).json({
        success: true,
        code: code,
        source: 'local',
        message: 'Saved locally (database error).',
      });
    }

    return res.status(200).json({
      success: true,
      code: data.discount_code,
      id: data.id,
    });

  } catch (err) {
    console.error('signup-email error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
