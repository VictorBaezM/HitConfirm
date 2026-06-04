/* LocalStorage State Manager (HitConfirm Database) */

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
  { id: '1', username: 'SolManiac', avatarColor: '#ff005b', mainGame: 'ggst', mainChar: 'Sol Badguy', rank: 'Celestial' },
  { id: '2', username: 'DaigoFan99', avatarColor: '#ffaa00', mainGame: 'sf6', mainChar: 'Ryu', rank: 'Master' },
  { id: '3', username: 'ElectricWindGod', avatarColor: '#00f0ff', mainGame: 't8', mainChar: 'Kazuya', rank: 'Tekken King' }
];

const DEFAULT_COMBOS = [
  {
    id: 'c1',
    userId: '1',
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
    userId: '2',
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
    userId: '3',
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
    userId: '2',
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
    userId: '3',
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

class Store {
  constructor() {
    this.init();
  }

  init() {
    // Check if data is already in local storage, if not, write seeds
    if (!localStorage.getItem('hc_users')) {
      localStorage.setItem('hc_users', JSON.stringify(DEFAULT_USERS));
    }
    if (!localStorage.getItem('hc_combos')) {
      localStorage.setItem('hc_combos', JSON.stringify(DEFAULT_COMBOS));
    }
    if (!localStorage.getItem('hc_posts')) {
      localStorage.setItem('hc_posts', JSON.stringify(DEFAULT_POSTS));
    }
    if (!localStorage.getItem('hc_strategies')) {
      localStorage.setItem('hc_strategies', JSON.stringify(DEFAULT_STRATEGIES));
    }

    // Load active session
    this.currentUser = JSON.parse(localStorage.getItem('hc_current_user')) || null;
  }

  // Games DB (static)
  getGames() {
    return DEFAULT_GAMES;
  }

  getGame(gameId) {
    return DEFAULT_GAMES[gameId];
  }

  // Users DB
  getUsers() {
    return JSON.parse(localStorage.getItem('hc_users'));
  }

  getCurrentUser() {
    return this.currentUser;
  }

  setCurrentUser(user) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem('hc_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('hc_current_user');
    }
  }

  registerUser(username, mainGame, mainChar) {
    const users = this.getUsers();
    
    // Check duplicate
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, error: 'Username already taken.' };
    }

    const colors = ['#ff005b', '#00f0ff', '#ffaa00', '#00ff66', '#d966ff', '#ff8800'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newUser = {
      id: 'u_' + Date.now(),
      username,
      avatarColor: randomColor,
      mainGame,
      mainChar,
      rank: 'Beginner',
      savedCombos: []
    };

    users.push(newUser);
    localStorage.setItem('hc_users', JSON.stringify(users));
    this.setCurrentUser(newUser);
    return { success: true, user: newUser };
  }

  loginUser(username) {
    const users = this.getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (user) {
      this.setCurrentUser(user);
      return { success: true, user };
    }
    return { success: false, error: 'User not found. Try registering instead!' };
  }

  logout() {
    this.setCurrentUser(null);
  }

  // Combos DB
  getCombos() {
    return JSON.parse(localStorage.getItem('hc_combos'));
  }

  saveCombo(comboData) {
    const combos = this.getCombos();
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

    combos.unshift(newCombo);
    localStorage.setItem('hc_combos', JSON.stringify(combos));

    // Auto-create a feed post about it!
    this.savePost({
      game: comboData.game,
      content: `💥 Just shared a new combo for ${DEFAULT_GAMES[comboData.game].name} - **${comboData.character}**! \n\n"${comboData.title}"\nNotation: \`${comboData.notation}\``,
      videoUrl: comboData.videoUrl || ''
    });

    return { success: true, combo: newCombo };
  }

  upvoteCombo(comboId) {
    const combos = this.getCombos();
    const user = this.getCurrentUser();
    if (!user) return { success: false, error: 'Log in to vote!' };

    const combo = combos.find(c => c.id === comboId);
    if (!combo) return { success: false };

    if (!combo.upvotedBy) combo.upvotedBy = [];

    const index = combo.upvotedBy.indexOf(user.id);
    if (index === -1) {
      combo.upvotedBy.push(user.id);
      combo.upvotes += 1;
    } else {
      combo.upvotedBy.splice(index, 1);
      combo.upvotes -= 1;
    }

    localStorage.setItem('hc_combos', JSON.stringify(combos));
    return { success: true, upvotes: combo.upvotes, upvoted: index === -1 };
  }

  addComboComment(comboId, commentText) {
    const combos = this.getCombos();
    const user = this.getCurrentUser();
    if (!user) return { success: false, error: 'Log in to comment!' };

    const combo = combos.find(c => c.id === comboId);
    if (!combo) return { success: false };

    const comment = {
      id: 'cc_' + Date.now(),
      username: user.username,
      text: commentText,
      date: new Date().toISOString().split('T')[0]
    };

    combo.comments.push(comment);
    localStorage.setItem('hc_combos', JSON.stringify(combos));
    return { success: true, comments: combo.comments };
  }

  // Saved / Bookmark Combos
  toggleSaveCombo(comboId) {
    const user = this.getCurrentUser();
    if (!user) return { success: false, error: 'Log in to bookmark combos!' };

    const users = this.getUsers();
    const dbUser = users.find(u => u.id === user.id);
    
    if (!dbUser.savedCombos) dbUser.savedCombos = [];
    
    const index = dbUser.savedCombos.indexOf(comboId);
    let saved = false;
    if (index === -1) {
      dbUser.savedCombos.push(comboId);
      saved = true;
    } else {
      dbUser.savedCombos.splice(index, 1);
      saved = false;
    }

    localStorage.setItem('hc_users', JSON.stringify(users));
    this.setCurrentUser(dbUser); // update active session
    return { success: true, saved };
  }

  // Feed Posts DB
  getPosts() {
    return JSON.parse(localStorage.getItem('hc_posts'));
  }

  savePost(postData) {
    const posts = this.getPosts();
    const user = this.getCurrentUser();
    if (!user) return { success: false, error: 'Must be logged in to post.' };

    const newPost = {
      id: 'p_' + Date.now(),
      userId: user.id,
      username: user.username,
      avatarColor: user.avatarColor,
      game: postData.game,
      content: postData.content,
      videoUrl: postData.videoUrl || '',
      upvotes: 0,
      upvotedBy: [],
      comments: [],
      createdAt: new Date().toISOString()
    };

    posts.unshift(newPost);
    localStorage.setItem('hc_posts', JSON.stringify(posts));
    return { success: true, post: newPost };
  }

  upvotePost(postId) {
    const posts = this.getPosts();
    const user = this.getCurrentUser();
    if (!user) return { success: false, error: 'Log in to vote!' };

    const post = posts.find(p => p.id === postId);
    if (!post) return { success: false };

    if (!post.upvotedBy) post.upvotedBy = [];

    const index = post.upvotedBy.indexOf(user.id);
    if (index === -1) {
      post.upvotedBy.push(user.id);
      post.upvotes += 1;
    } else {
      post.upvotedBy.splice(index, 1);
      post.upvotes -= 1;
    }

    localStorage.setItem('hc_posts', JSON.stringify(posts));
    return { success: true, upvotes: post.upvotes, upvoted: index === -1 };
  }

  addPostComment(postId, commentText) {
    const posts = this.getPosts();
    const user = this.getCurrentUser();
    if (!user) return { success: false, error: 'Log in to comment!' };

    const post = posts.find(p => p.id === postId);
    if (!post) return { success: false };

    const comment = {
      id: 'pc_' + Date.now(),
      username: user.username,
      text: commentText,
      date: new Date().toISOString().split('T')[0]
    };

    post.comments.push(comment);
    localStorage.setItem('hc_posts', JSON.stringify(posts));
    return { success: true, comments: post.comments };
  }

  // Strategy Guides DB
  getStrategies() {
    return JSON.parse(localStorage.getItem('hc_strategies'));
  }

  saveStrategy(strategyData) {
    const strategies = this.getStrategies();
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

    strategies.unshift(newStrategy);
    localStorage.setItem('hc_strategies', JSON.stringify(strategies));

    // Also share to feed!
    this.savePost({
      game: strategyData.game,
      content: `📚 Just posted a new strategy guide: **"${strategyData.title}"** for **${strategyData.character}**! Check it out in the Strategy Hub.`
    });

    return { success: true, strategy: newStrategy };
  }

  upvoteStrategy(strategyId) {
    const strategies = this.getStrategies();
    const user = this.getCurrentUser();
    if (!user) return { success: false, error: 'Log in to vote!' };

    const strategy = strategies.find(s => s.id === strategyId);
    if (!strategy) return { success: false };

    if (!strategy.upvotedBy) strategy.upvotedBy = [];

    const index = strategy.upvotedBy.indexOf(user.id);
    if (index === -1) {
      strategy.upvotedBy.push(user.id);
      strategy.upvotes += 1;
    } else {
      strategy.upvotedBy.splice(index, 1);
      strategy.upvotes -= 1;
    }

    localStorage.setItem('hc_strategies', JSON.stringify(strategies));
    return { success: true, upvotes: strategy.upvotes, upvoted: index === -1 };
  }
}

export const store = new Store();
export default store;
