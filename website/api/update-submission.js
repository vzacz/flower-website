/* ============================================================
   GREEN LIFE FLOWERS — UPDATE SUBMISSION STATUS API
   Vercel Serverless Function
   Updates status of a contact submission in Supabase
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

  const { id, status } = body;
  const validStatuses = ['new', 'contacted', 'completed'];

  if (!id) return res.status(400).json({ error: 'Submission ID is required.' });
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Database is not configured.' });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  try {
    const { data, error } = await supabase
      .from('contact_submissions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[update-submission] Supabase error:', error);
      return res.status(500).json({ error: 'Failed to update submission.' });
    }

    return res.status(200).json({ success: true, submission: data });
  } catch (err) {
    console.error('[update-submission] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
};
