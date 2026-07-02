const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jepptvwtzyinhqmapnzo.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplcHB0dnd0enlpbmhxbWFwbnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MTY1NjQsImV4cCI6MjA5NjI5MjU2NH0.mgzgw8KpwmdysMALboUBj3iiu-EUcxnqMmKPcVMSDGI';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }
  const token = authHeader.split(' ')[1];

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  const { comboId } = req.body;
  if (!comboId) {
    return res.status(400).json({ error: 'Missing comboId parameter' });
  }

  try {
    const { data: combo, error: getError } = await supabase
      .from('combos')
      .select('*')
      .eq('id', comboId)
      .single();

    if (getError || !combo) {
      throw new Error(getError?.message || 'Combo not found');
    }

    const upvotedBy = combo.upvoted_by || [];
    const index = upvotedBy.indexOf(user.id);
    let upvotes = combo.upvotes || 0;

    if (index === -1) {
      upvotedBy.push(user.id);
      upvotes += 1;
    } else {
      upvotedBy.splice(index, 1);
      upvotes -= 1;
    }

    const { data: updatedCombo, error: updateError } = await supabase
      .from('combos')
      .update({ upvotes, upvoted_by: upvotedBy })
      .eq('id', comboId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return res.status(200).json(updatedCombo);
  } catch (err) {
    console.error('Serverless combo vote failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
