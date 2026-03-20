/* ============================================================
   GREEN LIFE FLOWERS — CONTACT FORM SUBMISSION API
   Vercel Serverless Function
   Saves contact form submissions to Supabase
   ============================================================ */

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  // Parse body
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body.' });
  }

  const { name, email, message } = body;

  // Validation
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required.' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  // Check env
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('[submit-contact] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    return res.status(500).json({ error: 'Database is not configured. Contact the site owner.' });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  try {
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert([{
        name: name.trim().slice(0, 200),
        email: email.trim().toLowerCase().slice(0, 200),
        message: message.trim().slice(0, 2000),
        status: 'new',
      }])
      .select()
      .single();

    if (error) {
      console.error('[submit-contact] Supabase insert error:', error);
      return res.status(500).json({ error: 'Failed to save submission. Please try again.' });
    }

    console.log(`[submit-contact] Saved submission id=${data.id} from ${data.email}`);
    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error('[submit-contact] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
};
