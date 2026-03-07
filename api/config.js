import { supabase } from './_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { data, error } = await supabase
    .from('site_config')
    .select('data')
    .eq('id', 1)
    .single();

  if (error || !data) return res.status(200).json(null);
  res.status(200).json(data.data);
}
