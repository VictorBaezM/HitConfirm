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

  const { comboId, commentText } = req.body;
  if (!comboId || !commentText) {
    return res.status(400).json({ error: 'Missing comboId or commentText' });
  }

  try {
    // 1. Fetch user's profile to resolve current username
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('username')
      .eq('id', user.id)
      .single();

    const username = (profile && profile.username) || (user.email ? user.email.split('@')[0] : 'Anonymous');

    // 2. Fetch current combo
    const { data: combo, error: getError } = await supabase
      .from('combos')
      .select('comments')
      .eq('id', comboId)
      .single();

    if (getError || !combo) {
      throw new Error(getError?.message || 'Combo not found');
    }

    const comments = combo.comments || [];
    const newComment = {
      id: 'cc_' + Date.now(),
      username: username,
      text: commentText,
      createdAt: new Date().toISOString()
    };
    comments.push(newComment);

    // 3. Save update
    const { data: updatedCombo, error: updateError } = await supabase
      .from('combos')
      .update({ comments: comments })
      .eq('id', comboId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return res.status(200).json(updatedCombo);
  } catch (err) {
    console.error('Serverless combo comment failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
