const { supabase } = require('./_lib/supabase');
const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const { data, error } = await supabase
      .from('site_config')
      .select('data')
      .eq('id', 1)
      .single();

    if (!error && data) return res.status(200).json(data.data);
  } catch (e) {}

  // Supabase unavailable — fall back to committed config.json
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'config.json'), 'utf8');
    return res.status(200).json(JSON.parse(raw));
  } catch (e) {}

  res.status(200).json(null);
};
