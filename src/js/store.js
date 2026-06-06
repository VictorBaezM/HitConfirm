/* LocalStorage State Manager (HitConfirm Database) */
import { supabase } from './supabase.js';


const DEFAULT_GAMES = {
  sf6: {
    id: 'sf6',
    name: 'Street Fighter 6',
    characters: ['Ryu', 'Ken', 'Chun-Li', 'Luke', 'Guile', 'Juri', 'Cammy', 'Marisa', 'JP', 'Dee Jay'],
    notationType: 'sf'
  },
  t8: {
    id: 't8',
    name: 'Tekken 8',
    characters: ['Jin', 'Kazuya', 'Jun', 'Reina', 'Victor', 'Azucena', 'King', 'Lars', 'Hwoarang', 'Yoshimitsu'],
    notationType: 'tekken'
  },
  ggst: {
    id: 'ggst',
    name: 'Guilty Gear -Strive-',
    characters: ['Sol Badguy', 'Ky Kiske', 'May', 'Axl Low', 'Chipp Zanuff', 'Ramlethal Valentine', 'Nagoriyuki', 'Giovanna', 'Happy Chaos', 'Elphelt'],
    notationType: 'gg'
  },
  ssbu: {
    id: 'ssbu',
    name: 'Super Smash Bros. Ultimate',
    characters: ['Mario', 'Donkey Kong', 'Link', 'Samus', 'Yoshi', 'Kirby', 'Fox', 'Pikachu', 'Joker', 'Kazuya'],
    notationType: 'smash'
  }
};

const DEFAULT_USERS = [
  { id: '00000000-0000-0000-0000-000000000001', username: 'SolManiac', avatarColor: '#ff005b', mainGame: 'ggst', mainChar: 'Sol Badguy', rank: 'Celestial' },
  { id: '00000000-0000-0000-0000-000000000002', username: 'DaigoFan99', avatarColor: '#ffaa00', mainGame: 'sf6', mainChar: 'Ryu', rank: 'Master' },
  { id: '00000000-0000-0000-0000-000000000003', username: 'ElectricWindGod', avatarColor: '#00f0ff', mainGame: 't8', mainChar: 'Kazuya', rank: 'Tekken King' }
];

const DEFAULT_COMBOS = [
  {
    id: 'c1',
    userId: '00000000-0000-0000-0000-000000000001',
    username: 'SolManiac',
    avatarColor: '#ff005b',
    game: 'ggst',
    character: 'Sol Badguy',
    title: 'Easy Mid-screen Wall Break Combo',
    notation: '5K > 2D > 214K > c.S > 2H > 236KK > WS > 632146HS',
    damage: '240',
    meter: '50%',
    difficulty: 'medium',
    description: 'Requires slightly delayed 214K (Bandit Revolver) follow up. Deals massive damage and wall breaks from mid-screen.',
    upvotes: 42,
    upvotedBy: [],
    comments: [
      { id: 'cc1', username: 'ElectricWindGod', text: 'Does this work on lightweights like Chipp?', date: '2026-06-03' },
      { id: 'cc2', username: 'SolManiac', text: 'Yes, but the 214K delay needs to be tighter!', date: '2026-06-03' }
    ],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder embed
    createdAt: '2026-06-02T10:00:00Z'
  },
  {
    id: 'c2',
    userId: '00000000-0000-0000-0000-000000000002',
    username: 'DaigoFan99',
    avatarColor: '#ffaa00',
    game: 'sf6',
    character: 'Ryu',
    title: 'Bread and Butter Corner Carry',
    notation: '2MK > 236HP > 5LP > 5LK > 623HP',
    damage: '1850',
    meter: '0 Bar',
    difficulty: 'easy',
    description: 'Classic SF6 combo. Confirms off cr.MK low poke. Essential Ryu gameplay.',
    upvotes: 28,
    upvotedBy: [],
    comments: [],
    videoUrl: '',
    createdAt: '2026-06-03T14:30:00Z'
  },
  {
    id: 'c3',
    userId: '00000000-0000-0000-0000-000000000003',
    username: 'ElectricWindGod',
    avatarColor: '#00f0ff',
    game: 't8',
    character: 'Kazuya',
    title: 'Triple EWGF Punishment Combo',
    notation: '623+2, 623+2, 623+2, b+4, d/f+1,4, f+4',
    damage: '72',
    meter: 'None',
    difficulty: 'hard',
    description: 'Requires perfect execution of Electric Wind God Fists. Highly flashy and highly damaging.',
    upvotes: 95,
    upvotedBy: [],
    comments: [
      { id: 'cc3', username: 'DaigoFan99', text: 'Crazy execution! I can barely hit one EWGF.', date: '2026-06-04' }
    ],
    videoUrl: '',
    createdAt: '2026-06-04T08:15:00Z'
  }
];

const DEFAULT_POSTS = [
  {
    id: 'p1',
    userId: '00000000-0000-0000-0000-000000000002',
    username: 'DaigoFan99',
    avatarColor: '#ffaa00',
    game: 'sf6',
    content: 'Unbelievable grand finals at the local major tonight! The level of competition in SF6 is rising rapidly. Ken is looking top tier but the Cammy matchup is so tricky. What are your thoughts on Juri post-patch?',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    upvotes: 34,
    upvotedBy: [],
    comments: [
      { id: 'pc1', username: 'SolManiac', text: 'Juri is still incredibly strong. Her divekick setups are insane.', date: '2026-06-04' }
    ],
    createdAt: '2026-06-04T02:00:00Z'
  },
  {
    id: 'p2',
    userId: '00000000-0000-0000-0000-000000000003',
    username: 'ElectricWindGod',
    avatarColor: '#00f0ff',
    game: 't8',
    content: 'Just uploaded Kazuya\'s frame punish spreadsheet in the Strategy Hub. Make sure to check the match-up thread for Tekken 8 Reina punishes. Her pressure is fake if you duck the high followups!',
    videoUrl: '',
    upvotes: 56,
    upvotedBy: [],
    comments: [],
    createdAt: '2026-06-04T09:45:00Z'
  }
];

const DEFAULT_STRATEGIES = [
  {
    id: 's1',
    game: 'sf6',
    character: 'Ken',
    title: 'How to Deal with Ken\'s Dragonlash Kick',
    author: 'DaigoFan99',
    content: 'Ken\'s Dragonlash Kick (623K) is a common pressure tool. The Medium and Heavy versions are plus on block. \n\n### Counter Strategy:\n1. **React and Interrupt**: You can jab him out of the air during the startup of H Dragonlash. Startups: Light (18f), Medium (22f), Heavy (28f).\n2. **Perfect Parry**: H Dragonlash is highly telegraphed. Press parry right as he reaches the peak of his arc.\n3. **Invincible Reversals**: OD DP is a clean answer if you read it, but highly risky.',
    upvotes: 49,
    upvotedBy: [],
    createdAt: '2026-06-01T12:00:00Z'
  },
  {
    id: 's2',
    game: 't8',
    character: 'Reina',
    title: 'Reina Matchup Guide: Shutting Down Sentai Stance',
    author: 'ElectricWindGod',
    content: 'Reina gains transition into Sentai (SEN) stance from many of her pokes (e.g. f+2,3 or d/f+1). Knowing when you can press is key.\n\n### Key Punishes:\n- **SEN 3 (Low)**: -12 on block. Block and hit with your standard i12 low punisher.\n- **SEN 1+2 (Power Crush)**: Safe on block but linear. You can sidestep this or grab her if you predict it.\n- **SEN 1 (High, Power Crush)**: High input. If she inputs SEN 1, duck under it and launch punch!',
    upvotes: 68,
    upvotedBy: [],
    createdAt: '2026-06-03T18:20:00Z'
  }
];

// Database Object Mapping Utilities (snake_case database to camelCase frontend)

function mapUserFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    avatarColor: row.avatar_color,
    mainGame: row.main_game,
    mainChar: row.main_char,
    rank: row.rank,
    savedCombos: row.saved_combos || [],
    playedGames: row.played_games || [],
    gameCharacters: row.game_characters || {},
    following: row.following || []
  };
}

function mapUserToDb(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    avatar_color: user.avatarColor,
    main_game: user.mainGame,
    main_char: user.mainChar,
    rank: user.rank,
    saved_combos: user.savedCombos || [],
    played_games: user.playedGames || [],
    game_characters: user.gameCharacters || {},
    following: user.following || []
  };
}

function mapComboFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    username: row.username,
    avatarColor: row.avatar_color,
    game: row.game,
    character: row.character,
    title: row.title,
    notation: row.notation,
    damage: row.damage,
    meter: row.meter,
    difficulty: row.difficulty,
    description: row.description,
    upvotes: row.upvotes || 0,
    upvotedBy: row.upvoted_by || [],
    comments: row.comments || [],
    videoUrl: row.video_url,
    createdAt: row.created_at
  };
}

function mapComboToDb(combo) {
  if (!combo) return null;
  return {
    id: combo.id,
    user_id: combo.userId,
    username: combo.username,
    avatar_color: combo.avatarColor,
    game: combo.game,
    character: combo.character,
    title: combo.title,
    notation: combo.notation,
    damage: combo.damage,
    meter: combo.meter,
    difficulty: combo.difficulty,
    description: combo.description,
    upvotes: combo.upvotes || 0,
    upvoted_by: combo.upvotedBy || [],
    comments: combo.comments || [],
    video_url: combo.videoUrl,
    created_at: combo.createdAt
  };
}

function mapPostFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    username: row.username,
    avatarColor: row.avatar_color,
    game: row.game,
    content: row.content,
    videoUrl: row.video_url,
    upvotes: row.upvotes || 0,
    upvotedBy: row.upvoted_by || [],
    comments: row.comments || [],
    createdAt: row.created_at
  };
}

function mapPostToDb(post) {
  if (!post) return null;
  return {
    id: post.id,
    user_id: post.userId,
    username: post.username,
    avatar_color: post.avatarColor,
    game: post.game,
    content: post.content,
    video_url: post.videoUrl,
    upvotes: post.upvotes || 0,
    upvoted_by: post.upvotedBy || [],
    comments: post.comments || [],
    created_at: post.createdAt
  };
}

function mapStrategyFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    game: row.game,
    character: row.character,
    title: row.title,
    author: row.author,
    content: row.content,
    upvotes: row.upvotes || 0,
    upvotedBy: row.upvoted_by || [],
    createdAt: row.created_at
  };
}

function mapStrategyToDb(strat) {
  if (!strat) return null;
  return {
    id: strat.id,
    game: strat.game,
    character: strat.character,
    title: strat.title,
    author: strat.author,
    content: strat.content,
    upvotes: strat.upvotes || 0,
    upvoted_by: strat.upvotedBy || [],
    created_at: strat.createdAt
  };
}

class Store {
  constructor() {
    this.combos = [];
    this.posts = [];
    this.strategies = [];
    this.usersCache = [];
    this.currentUser = JSON.parse(localStorage.getItem('hc_current_user')) || null;
  }

  /**
   * Initializes the store system (legacy localstorage method, stubbed out for Supabase integration).
   */
  init() {
    // Session is loaded in constructor.
  }

  /**
   * Seeds default demo data to Supabase if the remote database is empty.
   */
  async seedSupabase() {
    console.log('Seeding Supabase tables with initial demo records...');
    
    // Seed users
    const dbUsers = DEFAULT_USERS.map(mapUserToDb);
    await supabase.from('users').insert(dbUsers);

    // Seed combos
    const dbCombos = DEFAULT_COMBOS.map(mapComboToDb);
    await supabase.from('combos').insert(dbCombos);

    // Seed posts
    const dbPosts = DEFAULT_POSTS.map(mapPostToDb);
    await supabase.from('posts').insert(dbPosts);

    // Seed strategies
    const dbStrategies = DEFAULT_STRATEGIES.map(mapStrategyToDb);
    await supabase.from('strategies').insert(dbStrategies);
    
    console.log('Seeding complete.');
  }

  /**
   * Asynchronously loads and updates memory caches from Supabase.
   * Automatically triggers seeding if the users table is completely empty.
   */
  async loadAllData() {
    try {
      // 1. Check user count to determine if database needs seeding
      const usersCount = await supabase.from('users').select('id', { count: 'exact', head: true });
      if (usersCount.count === 0) {
        await this.seedSupabase();
      }

      // 2. Fetch all tables in parallel
      const [combosRes, postsRes, strategiesRes, usersRes] = await Promise.all([
        supabase.from('combos').select('*').order('created_at', { ascending: false }),
        supabase.from('posts').select('*').order('created_at', { ascending: false }),
        supabase.from('strategies').select('*').order('created_at', { ascending: false }),
        supabase.from('users').select('*')
      ]);

      // 3. Map database rows to client objects
      this.combos = (combosRes.data || []).map(mapComboFromDb);
      this.posts = (postsRes.data || []).map(mapPostFromDb);
      this.strategies = (strategiesRes.data || []).map(mapStrategyFromDb);
      this.usersCache = (usersRes.data || []).map(mapUserFromDb);

      // Keep local list sync for backward-compatible lookups
      localStorage.setItem('hc_users', JSON.stringify(this.usersCache));

      // 4. Sync active user state if logged in via Supabase Auth
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        const freshUser = this.usersCache.find(u => u.id === session.user.id);
        if (freshUser) {
          this.setCurrentUser(freshUser);
        } else {
          this.setCurrentUser(null);
        }
      } else {
        this.setCurrentUser(null);
      }
    } catch (err) {
      console.error('Supabase loadAllData failed:', err);
    }
  }

  /**
   * Retrieves all static game entries.
   * @returns {Object} Static games dictionary.
   */
  getGames() {
    return DEFAULT_GAMES;
  }

  /**
   * Retrieves a specific static game entry by its ID.
   * @param {string} gameId - The identifier of the game.
   * @returns {Object} Game metadata structure.
   */
  getGame(gameId) {
    return DEFAULT_GAMES[gameId];
  }

  /**
   * Retrieves all cached user accounts.
   * @returns {Array<Object>} List of registered profiles.
   */
  getUsers() {
    return this.usersCache;
  }

  /**
   * Retrieves the current logged in user profile session.
   * @returns {Object|null} Active user profile session or null if logged out.
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Sets the active user profile session.
   * @param {Object|null} user - User profile object or null to clear session.
   */
  setCurrentUser(user) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem('hc_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('hc_current_user');
    }
  }

  /**
   * Registers a new user account in Supabase using Email/Password Auth.
   * @param {string} email - User email address.
   * @param {string} password - User password.
   * @param {string} username - Chosen username.
   * @param {string} mainGame - Chosen game ID.
   * @param {string} mainChar - Chosen character name.
   * @returns {Promise<Object>} Object indicating success status and new user object or error message.
   */
  /**
   * Registers a new user account in Supabase using Email/Password Auth.
   * @param {string} email - User email address.
   * @param {string} password - User password.
   * @param {string} username - Chosen username.
   * @param {string} mainGame - Chosen game ID.
   * @param {string} mainChar - Chosen character name.
   * @returns {Promise<Object>} Object indicating success status and new user object or error message.
   */
  async registerUser(email, password, username, mainGame, mainChar) {
    // Check duplicate locally first (fast check)
    if (this.usersCache.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, error: 'Username already taken.' };
    }

    const colors = ['#ff005b', '#00f0ff', '#ffaa00', '#00ff66', '#d966ff', '#ff8800'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          avatar_color: randomColor,
          main_game: mainGame,
          main_char: mainChar
        }
      }
    });

    if (signUpError) {
      return { success: false, error: signUpError.message };
    }

    const authUser = data.user;
    if (!authUser) {
      return { success: false, error: 'Sign up succeeded, but user data not returned.' };
    }

    // If auto-logged in (email confirmation disabled)
    if (data.session) {
      // Small delay to allow the DB trigger to complete inserting user record in public.users
      await new Promise(resolve => setTimeout(resolve, 500));

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (!profileError && profile) {
        const clientUser = mapUserFromDb(profile);
        this.usersCache.push(clientUser);
        this.setCurrentUser(clientUser);
        return { success: true, user: clientUser };
      } else if (profileError) {
        return { success: false, error: 'Failed to retrieve profile created by trigger: ' + profileError.message };
      }
    }

    // If session is null (email confirmation is enabled, user must verify email)
    return {
      success: true,
      user: { username },
      message: 'Account created! Please check your email inbox to verify your account before logging in.'
    };
  }

  /**
   * Logs in an existing user account using Email/Password.
   * @param {string} email - User email address.
   * @param {string} password - User password.
   * @returns {Promise<Object>} Object indicating success status and user profile or error message.
   */
  async loginUser(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const authUser = data.user;
    
    // Fetch profile
    let { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    // Fallback: If no profile row is found (e.g. signup failed to insert or trigger didn't run),
    // create it now since the client is fully authenticated and auth.uid() equals authUser.id.
    if (profileError && (profileError.code === 'PGRST116' || profileError.message.includes('0 rows'))) {
      const colors = ['#ff005b', '#00f0ff', '#ffaa00', '#00ff66', '#d966ff', '#ff8800'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const newUser = {
        id: authUser.id,
        username: authUser.user_metadata?.username || 'Player_' + authUser.id.substring(0, 8),
        avatarColor: authUser.user_metadata?.avatar_color || randomColor,
        mainGame: authUser.user_metadata?.main_game || 'sf6',
        mainChar: authUser.user_metadata?.main_char || 'Ryu',
        rank: 'Beginner',
        savedCombos: []
      };

      const { error: insertError } = await supabase.from('users').insert(mapUserToDb(newUser));
      if (!insertError) {
        profile = mapUserToDb(newUser);
        profileError = null;
      } else {
        return { success: false, error: 'Failed to create profile: ' + insertError.message };
      }
    } else if (profileError) {
      return { success: false, error: 'Profile not found: ' + profileError.message };
    }

    const clientUser = mapUserFromDb(profile);
    this.setCurrentUser(clientUser);
    return { success: true, user: clientUser };
  }

  /**
   * Logs out the current active session.
   */
  async logout() {
    await supabase.auth.signOut();
    this.setCurrentUser(null);
  }

  /**
   * Retrieves all cached shared combos.
   * @returns {Array<Object>} List of shared combos.
   */
  getCombos() {
    return this.combos;
  }

  /**
   * Saves a new combo to Supabase and automatically creates a corresponding timeline post.
   * @param {Object} comboData - Raw metadata of the new combo.
   * @returns {Promise<Object>} Object containing success status and the new combo object.
   */
  async saveCombo(comboData) {
    const user = this.getCurrentUser();
    if (!user) return { success: false, error: 'Must be logged in to share combos.' };

    const newCombo = {
      id: 'c_' + Date.now(),
      userId: user.id,
      username: user.username,
      avatarColor: user.avatarColor,
      game: comboData.game,
      character: comboData.character,
      title: comboData.title,
      notation: comboData.notation,
      damage: comboData.damage || 'N/A',
      meter: comboData.meter || 'None',
      difficulty: comboData.difficulty || 'medium',
      description: comboData.description || '',
      upvotes: 0,
      upvotedBy: [],
      comments: [],
      videoUrl: comboData.videoUrl || '',
      createdAt: new Date().toISOString()
    };

    const { error } = await supabase.from('combos').insert(mapComboToDb(newCombo));
    if (error) {
      return { success: false, error: error.message };
    }

    this.combos.unshift(newCombo);

    // Auto-create a feed post about it asynchronously (fire and forget / await both)
    await this.savePost({
      game: comboData.game,
      content: `💥 Just shared a new combo for ${DEFAULT_GAMES[comboData.game].name} - **${comboData.character}**! \n\n"${comboData.title}"\nNotation: \`${comboData.notation}\``,
      videoUrl: comboData.videoUrl || ''
    });

    return { success: true, combo: newCombo };
  }

  /**
   * Toggles upvote state on a combo in Supabase.
   * @param {string} comboId - Target combo identifier.
   * @returns {Promise<Object>} Success flag and updated upvotes count and state.
   */
  async upvoteCombo(comboId) {
    const user = this.getCurrentUser();
    if (!user) return { success: false, error: 'Log in to vote!' };

    const combo = this.combos.find(c => c.id === comboId);
    if (!combo) return { success: false };

    const upvotedBy = [...combo.upvotedBy];
    const index = upvotedBy.indexOf(user.id);
    let upvotes = combo.upvotes;

    if (index === -1) {
      upvotedBy.push(user.id);
      upvotes += 1;
    } else {
      upvotedBy.splice(index, 1);
      upvotes -= 1;
    }

    const { data, error } = await supabase.from('combos').update({
      upvotes,
      upvoted_by: upvotedBy
    }).eq('id', comboId).select();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'Database update failed. You may not have permission to react to this combo. (Check Row Level Security policies).' };
    }

    combo.upvotedBy = upvotedBy;
    combo.upvotes = upvotes;

    return { success: true, upvotes, upvoted: index === -1 };
  }

  /**
   * Appends an execution comment to a combo in Supabase.
   * @param {string} comboId - Target combo identifier.
   * @param {string} commentText - The text content of the reply.
   * @returns {Promise<Object>} Success flag and updated list of comments.
   */
  async addComboComment(comboId, commentText) {
    const user = this.getCurrentUser();
    if (!user) return { success: false, error: 'Log in to comment!' };

    const combo = this.combos.find(c => c.id === comboId);
    if (!combo) return { success: false };

    const comment = {
      id: 'cc_' + Date.now(),
      username: user.username,
      text: commentText,
      date: new Date().toISOString().split('T')[0]
    };

    const comments = [...combo.comments, comment];

    const { data, error } = await supabase.from('combos').update({ comments }).eq('id', comboId).select();
    if (error) {
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'Database update failed. You may not have permission to comment on this combo. (Check Row Level Security policies).' };
    }

    combo.comments = comments;
    return { success: true, comments };
  }

  /**
   * Bookmarks or removes a combo from the user's saved list in Supabase.
   * @param {string} comboId - Target combo identifier.
   * @returns {Promise<Object>} Success flag and active bookmark state.
   */
  async toggleSaveCombo(comboId) {
    const user = this.getCurrentUser();
    if (!user) return { success: false, error: 'Log in to bookmark combos!' };

    const savedCombos = [...user.savedCombos];
    const index = savedCombos.indexOf(comboId);
    let saved = false;

    if (index === -1) {
      savedCombos.push(comboId);
      saved = true;
    } else {
      savedCombos.splice(index, 1);
      saved = false;
    }

    const { data, error } = await supabase.from('users').update({
      saved_combos: savedCombos
    }).eq('id', user.id).select();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'Database update failed. You may not have permission to modify bookmarks.' };
    }

    user.savedCombos = savedCombos;
    this.setCurrentUser(user); // update local active session
    return { success: true, saved };
  }

  /**
   * Toggles the follow status of a target user.
   * @param {string} targetUserId - Target player's user ID.
   * @returns {Promise<Object>} Object containing success status and current followed state.
   */
  async toggleFollowUser(targetUserId) {
    const user = this.getCurrentUser();
    if (!user) return { success: false, error: 'Log in to follow players!' };

    const following = [...(user.following || [])];
    const index = following.indexOf(targetUserId);
    let followed = false;

    if (index === -1) {
      following.push(targetUserId);
      followed = true;
    } else {
      following.splice(index, 1);
      followed = false;
    }

    const { data, error } = await supabase.from('users').update({
      following: following
    }).eq('id', user.id).select();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'Database update failed. You may not have permission to follow players.' };
    }

    user.following = following;
    this.setCurrentUser(user); // Update local cache
    return { success: true, followed };
  }

  /**
   * Retrieves all cached timeline posts.
   * @returns {Array<Object>} List of posts.
   */
  getPosts() {
    return this.posts;
  }

  /**
   * Saves a new discussion post to Supabase.
   * @param {Object} postData - Post metadata (content, optional game, optional video).
   * @returns {Promise<Object>} Success flag and the new post object.
   */
  async savePost(postData) {
    const user = this.getCurrentUser();
    if (!user) return { success: false, error: 'Must be logged in to post.' };

    const newPost = {
      id: 'p_' + Date.now(),
      userId: user.id,
      username: user.username,
      avatarColor: user.avatarColor,
      game: postData.game || null,
      content: postData.content,
      videoUrl: postData.videoUrl || '',
      upvotes: 0,
      upvotedBy: [],
      comments: [],
      createdAt: new Date().toISOString()
    };

    const { error } = await supabase.from('posts').insert(mapPostToDb(newPost));
    if (error) {
      return { success: false, error: error.message };
    }

    this.posts.unshift(newPost);
    return { success: true, post: newPost };
  }

  /**
   * Toggles upvote state on a post in Supabase.
   * @param {string} postId - Target post identifier.
   * @returns {Promise<Object>} Success flag, updated upvote count, and toggle state.
   */
  async upvotePost(postId) {
    const user = this.getCurrentUser();
    if (!user) return { success: false, error: 'Log in to vote!' };

    const post = this.posts.find(p => p.id === postId);
    if (!post) return { success: false };

    const upvotedBy = [...post.upvotedBy];
    const index = upvotedBy.indexOf(user.id);
    let upvotes = post.upvotes;

    if (index === -1) {
      upvotedBy.push(user.id);
      upvotes += 1;
    } else {
      upvotedBy.splice(index, 1);
      upvotes -= 1;
    }

    const { data, error } = await supabase.from('posts').update({
      upvotes,
      upvoted_by: upvotedBy
    }).eq('id', postId).select();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'Database update failed. You may not have permission to react to this post. (Check Row Level Security policies).' };
    }

    post.upvotedBy = upvotedBy;
    post.upvotes = upvotes;
    return { success: true, upvotes, upvoted: index === -1 };
  }

  /**
   * Appends a comment to a timeline post in Supabase.
   * @param {string} postId - Target post identifier.
   * @param {string} commentText - Text content of the comment.
   * @returns {Promise<Object>} Success flag and updated comment list.
   */
  async addPostComment(postId, commentText) {
    const user = this.getCurrentUser();
    if (!user) return { success: false, error: 'Log in to comment!' };

    const post = this.posts.find(p => p.id === postId);
    if (!post) return { success: false };

    const comment = {
      id: 'pc_' + Date.now(),
      username: user.username,
      text: commentText,
      date: new Date().toISOString().split('T')[0]
    };

    const comments = [...post.comments, comment];

    const { data, error } = await supabase.from('posts').update({ comments }).eq('id', postId).select();
    if (error) {
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'Database update failed. You may not have permission to comment on this post. (Check Row Level Security policies).' };
    }

    post.comments = comments;
    return { success: true, comments };
  }

  /**
   * Retrieves all cached strategy articles.
   * @returns {Array<Object>} List of guides.
   */
  getStrategies() {
    return this.strategies;
  }

  /**
   * Saves a new strategy article in Supabase and cross-posts it to the social timeline.
   * @param {Object} strategyData - Strategy metadata (game, character, title, content).
   * @returns {Promise<Object>} Success flag and new strategy object.
   */
  async saveStrategy(strategyData) {
    const user = this.getCurrentUser();
    if (!user) return { success: false, error: 'Must be logged in to post guides.' };

    const newStrategy = {
      id: 's_' + Date.now(),
      game: strategyData.game,
      character: strategyData.character,
      title: strategyData.title,
      author: user.username,
      content: strategyData.content,
      upvotes: 0,
      upvotedBy: [],
      createdAt: new Date().toISOString()
    };

    const { error } = await supabase.from('strategies').insert(mapStrategyToDb(newStrategy));
    if (error) {
      return { success: false, error: error.message };
    }

    this.strategies.unshift(newStrategy);

    // Also share to feed!
    await this.savePost({
      game: strategyData.game,
      content: `📚 Just posted a new strategy guide: **"${strategyData.title}"** for **${strategyData.character}**! Check it out in the Strategy Hub.`
    });

    return { success: true, strategy: newStrategy };
  }

  /**
   * Toggles upvote state on a strategy guide in Supabase.
   * @param {string} strategyId - Target guide identifier.
   * @returns {Promise<Object>} Success flag, updated upvotes count, and toggle state.
   */
  async upvoteStrategy(strategyId) {
    const user = this.getCurrentUser();
    if (!user) return { success: false, error: 'Log in to vote!' };

    const strategy = this.strategies.find(s => s.id === strategyId);
    if (!strategy) return { success: false };

    const upvotedBy = [...strategy.upvotedBy];
    const index = upvotedBy.indexOf(user.id);
    let upvotes = strategy.upvotes;

    if (index === -1) {
      upvotedBy.push(user.id);
      upvotes += 1;
    } else {
      upvotedBy.splice(index, 1);
      upvotes -= 1;
    }

    const { data, error } = await supabase.from('strategies').update({
      upvotes,
      upvoted_by: upvotedBy
    }).eq('id', strategyId).select();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'Database update failed. You may not have permission to react to this strategy. (Check Row Level Security policies).' };
    }

    strategy.upvotedBy = upvotedBy;
    strategy.upvotes = upvotes;
    return { success: true, upvotes, upvoted: index === -1 };
  }
}

export const store = new Store();
export default store;
