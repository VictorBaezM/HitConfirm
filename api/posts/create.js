const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jepptvwtzyinhqmapnzo.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplcHB0dnd0enlpbmhxbWFwbnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MTY1NjQsImV4cCI6MjA5NjI5MjU2NH0.mgzgw8KpwmdysMALboUBj3iiu-EUcxnqMmKPcVMSDGI';

module.exports = async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Parse Authorization Header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }
  const token = authHeader.split(' ')[1];

  // Create a server-side Supabase client bound to this user's JWT token
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  // Verify JWT token and retrieve the user object
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  const { post } = req.body;
  if (!post) {
    return res.status(400).json({ error: 'Missing post parameter' });
  }

  // Map client properties to Supabase database columns, forcing the user_id to the authorized token id
  const dbPost = {
    id: post.id || 'p_' + Date.now(),
    user_id: user.id,
    username: post.username || 'Anonymous',
    avatar_color: post.avatarColor || '#3b82f6',
    game: post.game || null,
    content: post.content,
    video_url: post.videoUrl || '',
    upvotes: post.upvotes || 0,
    upvoted_by: post.upvotedBy || [],
    comments: post.comments || [],
    created_at: post.createdAt || new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('posts')
      .insert(dbPost)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Serverless post save failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
