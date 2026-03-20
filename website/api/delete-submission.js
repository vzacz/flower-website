/* ============================================================
   GREEN LIFE FLOWERS — DELETE SUBMISSION API
   Vercel Serverless Function
   Deletes a contact submission from Supabase
   ============================================================ */

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body.' });
  }

  const { id } = body;
  if (!id) return res.status(400).json({ error: 'Submission ID is required.' });

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Database is not configured.' });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  try {
    const { error } = await supabase
      .from('contact_submissions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[delete-submission] Supabase error:', error);
      return res.status(500).json({ error: 'Failed to delete submission.' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[delete-submission] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
};
