/* ============================================================
   GREEN LIFE FLOWERS — GET CONTACT SUBMISSIONS API
   Vercel Serverless Function
   Returns all contact submissions from Supabase (admin use)
   ============================================================ */

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Database is not configured.' });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  try {
    const { data, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[get-submissions] Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch submissions.' });
    }

    return res.status(200).json({ success: true, submissions: data });
  } catch (err) {
    console.error('[get-submissions] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
};
