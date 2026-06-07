/* Feed/Timeline Page Controller */
import store from '../store.js';
import { renderPostCard } from '../components/post-card.js';
import { renderComboCard } from '../components/combo-card.js';
import { renderGameSidebar, showGameSidebar } from '../components/game-sidebar.js';

/**
 * Renders the main dashboard timeline feed, chip selectors, hottest combos, and Dojo challenge widget.
 * @param {function} navigateCallback - SPA router callback.
 */
export function renderFeedPage(navigateCallback) {
  const mount = document.getElementById('content-mount');
  if (!mount) return;

  // Show the left game sidebar and set layout class
  mount.className = 'has-game-sidebar';
  showGameSidebar();

  const currentUser = store.getCurrentUser();
  const games = store.getGames();
  
  // Set up layout structures
  mount.innerHTML = `
    <!-- Feed Area (Left) -->
    <div id="feed-left-pane">
      <!-- Create Post Panel -->
      <div id="post-creator-box"></div>

      <!-- Feed Pill Tabs -->
      <div class="pill-tabs" style="margin-bottom: 16px;">
        <div class="pill-tab active" id="feed-tab-all" data-tab="all">All Activity</div>
        <div class="pill-tab" id="feed-tab-following" data-tab="following">Following</div>
      </div>

      <!-- Feed Timeline -->
      <div id="timeline-list"></div>
    </div>

    <!-- Sidebar Dashboard Widgets (Right) -->
    <div id="feed-sidebar" class="flex flex-col gap-6">
      <!-- Dojo Training Widget -->
      <div class="card" style="padding: 20px;">
        <h3 style="font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 12px;">
          <i class="fa-solid fa-fire" style="color: var(--color-primary);"></i> Hottest Combos
        </h3>
        <div id="sidebar-hot-combos" class="flex flex-col gap-3"></div>
        <button class="btn btn-secondary btn-sm w-full" id="sidebar-go-dojo" style="margin-top: 12px; font-size: 0.75rem;">
          Browse Dojo
        </button>
      </div>

      <!-- FGC Event Tracker -->
      <div class="card" style="padding: 20px;">
        <h3 style="font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 12px;">
          <i class="fa-solid fa-trophy" style="color: var(--color-accent);"></i> Weekly Dojo Challenge
        </h3>
        <div style="background: rgba(0,0,0,0.15); padding: 12px; border-radius: 6px; font-size: 0.85rem; border: 1px solid rgba(255,255,255,0.03);">
          <div style="font-weight: 800; color: var(--color-secondary); margin-bottom: 4px;">Street Fighter 6 Ryu Challenge</div>
          <p style="color: var(--text-secondary); margin-bottom: 8px;">Perform a corner combo ending in Shin Shoryuken with maximum damage scaling.</p>
          <div class="flex items-center justify-between" style="font-size: 0.8rem;">
            <span>Reward: <strong style="color: var(--color-accent);">"Legend" Title</strong></span>
            <span>Ends: <strong>3 days</strong></span>
          </div>
        </div>
        <button class="btn btn-primary btn-sm w-full" id="sidebar-go-builder" style="margin-top: 12px; font-size: 0.75rem;">
          Try in Combo Builder
        </button>
      </div>

      <!-- FGC Game Resources & Patch Notes Widget -->
      <div class="card" style="padding: 20px;" id="feed-news-resources-widget">
        <h3 style="font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 12px;">
          <i class="fa-solid fa-newspaper" style="color: var(--color-primary);"></i> Game Resources & Patches
        </h3>
        <div class="flex flex-col gap-3">
          <!-- SF6 -->
          <div style="background: rgba(0,0,0,0.15); padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.02);">
            <div style="font-weight: 800; color: var(--text-primary); font-size: 0.85rem; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
              <span>Street Fighter 6</span>
              <span class="badge badge-sf6" style="font-size: 0.6rem; padding: 1px 4px;">SF6</span>
            </div>
            <div class="flex gap-2" style="flex-wrap: wrap;">
              <a href="https://www.streetfighter.com/6/" target="_blank" rel="noopener noreferrer" class="game-resource-btn game-resource-btn-sf6">
                <i class="fa-solid fa-globe"></i> Site
              </a>
              <a href="https://www.streetfighter.com/6/en-us/character/" target="_blank" rel="noopener noreferrer" class="game-resource-btn game-resource-btn-sf6">
                <i class="fa-solid fa-users"></i> Roster
              </a>
              <a href="https://www.streetfighter.com/6/en-us/buckler/battle_change/" target="_blank" rel="noopener noreferrer" class="game-resource-btn game-resource-btn-sf6">
                <i class="fa-solid fa-file-lines"></i> Patches
              </a>
            </div>
          </div>
          
          <!-- Tekken 8 -->
          <div style="background: rgba(0,0,0,0.15); padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.02);">
            <div style="font-weight: 800; color: var(--text-primary); font-size: 0.85rem; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
              <span>Tekken 8</span>
              <span class="badge badge-t8" style="font-size: 0.6rem; padding: 1px 4px;">T8</span>
            </div>
            <div class="flex gap-2" style="flex-wrap: wrap;">
              <a href="https://tekken.com/" target="_blank" rel="noopener noreferrer" class="game-resource-btn game-resource-btn-t8">
                <i class="fa-solid fa-globe"></i> Site
              </a>
              <a href="https://bandainamcoent.com/games/tekken-8" target="_blank" rel="noopener noreferrer" class="game-resource-btn game-resource-btn-t8">
                <i class="fa-solid fa-users"></i> Roster
              </a>
              <a href="https://bandainamcoent.com/news?game=tekken-8" target="_blank" rel="noopener noreferrer" class="game-resource-btn game-resource-btn-t8">
                <i class="fa-solid fa-file-lines"></i> Patches
              </a>
            </div>
          </div>

          <!-- GGST -->
          <div style="background: rgba(0,0,0,0.15); padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.02);">
            <div style="font-weight: 800; color: var(--text-primary); font-size: 0.85rem; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
              <span>Guilty Gear -Strive-</span>
              <span class="badge badge-ggst" style="font-size: 0.6rem; padding: 1px 4px;">GGST</span>
            </div>
            <div class="flex gap-2" style="flex-wrap: wrap;">
              <a href="https://www.guiltygear.com/ggst/en/" target="_blank" rel="noopener noreferrer" class="game-resource-btn game-resource-btn-ggst">
                <i class="fa-solid fa-globe"></i> Site
              </a>
              <a href="https://www.guiltygear.com/ggst/en/character/" target="_blank" rel="noopener noreferrer" class="game-resource-btn game-resource-btn-ggst">
                <i class="fa-solid fa-users"></i> Roster
              </a>
              <a href="https://www.guiltygear.com/ggst/en/news/" target="_blank" rel="noopener noreferrer" class="game-resource-btn game-resource-btn-ggst">
                <i class="fa-solid fa-file-lines"></i> Patches
              </a>
            </div>
          </div>

          <!-- SSBU -->
          <div style="background: rgba(0,0,0,0.15); padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.02);">
            <div style="font-weight: 800; color: var(--text-primary); font-size: 0.85rem; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
              <span>Smash Ultimate</span>
              <span class="badge badge-ssbu" style="font-size: 0.6rem; padding: 1px 4px;">SSBU</span>
            </div>
            <div class="flex gap-2" style="flex-wrap: wrap;">
              <a href="https://www.smashbros.com/en_US/" target="_blank" rel="noopener noreferrer" class="game-resource-btn game-resource-btn-ssbu">
                <i class="fa-solid fa-globe"></i> Site
              </a>
              <a href="https://www.smashbros.com/en_US/char/index.html" target="_blank" rel="noopener noreferrer" class="game-resource-btn game-resource-btn-ssbu">
                <i class="fa-solid fa-users"></i> Roster
              </a>
              <a href="https://en-americas-support.nintendo.com/app/answers/detail/a_id/42809" target="_blank" rel="noopener noreferrer" class="game-resource-btn game-resource-btn-ssbu">
                <i class="fa-solid fa-file-lines"></i> Patches
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Draw Creator Box
  renderCreatorBox(navigateCallback);

  // Draw Timeline List
  let activeGameFilter = 'all';
  let activeFeedTab = 'all'; // 'all' or 'following'

  const refreshTimeline = () => {
    const listMount = document.getElementById('timeline-list');
    if (!listMount) return;

    let posts = store.getPosts();
    
    // 1. Filter by feed tab
    if (activeFeedTab === 'following') {
      if (!currentUser) {
        listMount.innerHTML = `
          <div class="card" style="text-align: center; padding: 48px; color: var(--text-secondary); border-color: rgba(255, 0, 91, 0.15);">
            <i class="fa-solid fa-lock" style="font-size: 2.5rem; margin-bottom: 12px; color: var(--color-secondary);"></i>
            <h3>Log in to see your following feed</h3>
            <p style="font-size: 0.9rem; margin-top: 4px;">Follow other players and keep up with their lab clips and notes!</p>
          </div>
        `;
        return;
      }
      const followingList = currentUser.following || [];
      if (followingList.length === 0) {
        listMount.innerHTML = `
          <div class="card" style="text-align: center; padding: 48px; color: var(--text-secondary);">
            <i class="fa-solid fa-user-plus" style="font-size: 2.5rem; margin-bottom: 12px; color: var(--color-secondary);"></i>
            <h3>Your following feed is empty</h3>
            <p style="font-size: 0.9rem; margin-top: 4px;">Follow other players in the community to customize your activity feed.</p>
          </div>
        `;
        return;
      }
      posts = posts.filter(p => followingList.includes(p.userId));
    }

    // 2. Filter by game chip
    const filtered = activeGameFilter === 'all' 
      ? posts 
      : posts.filter(p => p.game === activeGameFilter);

    if (filtered.length === 0) {
      listMount.innerHTML = `
        <div class="card" style="text-align: center; padding: 48px; color: var(--text-secondary);">
          <i class="fa-solid fa-face-sad-tear" style="font-size: 2.5rem; margin-bottom: 12px; color: var(--color-secondary);"></i>
          <h3>No posts found here yet</h3>
          <p style="font-size: 0.9rem; margin-top: 4px;">Be the first to share your thoughts, videos or strategies!</p>
        </div>
      `;
      return;
    }

    listMount.innerHTML = '';
    filtered.forEach(post => {
      listMount.appendChild(renderPostCard(post, navigateCallback));
    });
  };

  refreshTimeline();

  // Attach Feed Pill Tab listeners
  const tabAll = document.getElementById('feed-tab-all');
  const tabFollowing = document.getElementById('feed-tab-following');
  
  tabAll.addEventListener('click', () => {
    tabAll.classList.add('active');
    tabFollowing.classList.remove('active');
    activeFeedTab = 'all';
    refreshTimeline();
  });
  
  tabFollowing.addEventListener('click', () => {
    tabFollowing.classList.add('active');
    tabAll.classList.remove('active');
    activeFeedTab = 'following';
    refreshTimeline();
  });

  // Draw Hot Combos Widget
  const refreshHotCombos = () => {
    const sideMount = document.getElementById('sidebar-hot-combos');
    if (!sideMount) return;

    const combos = store.getCombos().slice(0, 2);
    if (combos.length === 0) {
      sideMount.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-muted);">No combos shared yet.</p>`;
      return;
    }

    sideMount.innerHTML = '';
    combos.forEach(combo => {
      const row = document.createElement('div');
      row.style.background = 'rgba(255, 255, 255, 0.02)';
      row.style.border = '1px solid var(--border-color)';
      row.style.borderRadius = '6px';
      row.style.padding = '10px';
      row.style.cursor = 'pointer';
      row.style.transition = 'border-color var(--transition-fast)';
      row.innerHTML = `
        <div class="flex items-center justify-between" style="margin-bottom: 4px; font-size: 0.75rem;">
          <span class="badge badge-${combo.game}" style="font-size:0.65rem; padding: 2px 6px;">${combo.game.toUpperCase()}</span>
          <span style="font-weight: 700; color: var(--color-accent);">${combo.damage} DMG</span>
        </div>
        <div style="font-weight: 700; font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${combo.character}: ${combo.title}
        </div>
      `;
      row.addEventListener('click', () => {
        navigateCallback('combos', { game: combo.game });
      });
      sideMount.appendChild(row);
    });
  };

  refreshHotCombos();

  // Attach Sidebar Button Listeners
  document.getElementById('sidebar-go-dojo').addEventListener('click', () => navigateCallback('combos'));
  document.getElementById('sidebar-go-builder').addEventListener('click', () => navigateCallback('builder'));

  // Initialize Left Game Sidebar
  const initSidebar = (activeGame, activeDifficulties) => {
    renderGameSidebar({
      activeGame,
      activeDifficulties,
      onGameChange: (gameId) => {
        activeGameFilter = gameId;
        refreshTimeline();
        initSidebar(gameId, activeDifficulties);
      },
      onDifficultyChange: (difficulties) => {
        activeDifficulties = difficulties;
        initSidebar(activeGameFilter, difficulties);
      }
    });
  };

  initSidebar(activeGameFilter, []);
}

/**
 * Renders the post creation panel. Displays a registration banner if logged out,
 * or text area and tags inputs if logged in.
 * @param {function} navigateCallback - SPA router callback.
 */
function renderCreatorBox(navigateCallback) {
  const mount = document.getElementById('post-creator-box');
  if (!mount) return;

  const currentUser = store.getCurrentUser();
  const games = store.getGames();

  if (!currentUser) {
    mount.innerHTML = `
      <div class="card" style="margin-bottom: 24px; text-align: center; border-color: rgba(255, 0, 91, 0.15); background: linear-gradient(135deg, rgba(255, 0, 91, 0.03), rgba(0, 240, 255, 0.03));">
        <h3 style="margin-bottom: 4px; font-size: 1.15rem;">Join the HitConfirm Community</h3>
        <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 16px;">Create an account to post clips, comment on frame data, and share combo layouts.</p>
        <div class="flex justify-center gap-3">
          <button class="btn btn-primary btn-sm btn-feed-signup">Sign Up Now</button>
          <button class="btn btn-secondary btn-sm btn-feed-login">Log In</button>
        </div>
      </div>
    `;

    mount.querySelector('.btn-feed-signup').addEventListener('click', () => {
      window.openAuthModal('register', navigateCallback);
    });
    mount.querySelector('.btn-feed-login').addEventListener('click', () => {
      window.openAuthModal('login', navigateCallback);
    });
    return;
  }

  // Logged-in feed layout
  mount.innerHTML = `
    <div class="card" style="margin-bottom: 24px;">
      <h3 style="font-size: 1.1rem; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
        <i class="fa-solid fa-pen-nib" style="color: var(--color-primary);"></i> Share a Strategic Thought or Clip
      </h3>
      
      <div class="form-group" style="margin-bottom: 12px;">
        <textarea class="form-textarea post-input" placeholder="What are you learning in the lab today? Use **bold** for combos or #hashtags..." style="min-height: 80px; font-size: 0.9rem;"></textarea>
      </div>

      <div class="flex gap-3" style="flex-wrap: wrap; margin-bottom: 12px;">
        <!-- Game Dropdown tag -->
        <div style="flex: 1; min-width: 140px;">
          <select class="form-select post-game-select" style="padding: 8px 12px; font-size: 0.85rem;">
            <option value="">Tag Game (Optional)</option>
            ${Object.values(games).map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
          </select>
        </div>

        <!-- Video Input Link -->
        <div style="flex: 2; min-width: 200px; display: flex; align-items: center; position: relative;">
          <i class="fa-brands fa-youtube" style="position: absolute; left: 12px; color: #ff0000; font-size: 1.1rem;"></i>
          <input type="text" class="form-input post-video-input" placeholder="YouTube Video URL (Optional)" style="padding: 8px 12px 8px 36px; font-size: 0.85rem;" />
        </div>
      </div>

      <div class="flex justify-between items-center" style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px;">
        <span style="font-size: 0.8rem; color: var(--text-muted);">Posting as <strong>${currentUser.username}</strong></span>
        <button class="btn btn-primary btn-sm btn-submit-post">Publish Post</button>
      </div>
    </div>
  `;

  // Publish action
  const submitBtn = mount.querySelector('.btn-submit-post');
  const postContent = mount.querySelector('.post-input');
  const gameSelect = mount.querySelector('.post-game-select');
  const videoInput = mount.querySelector('.post-video-input');

  submitBtn.addEventListener('click', async () => {
    const text = postContent.value.trim();
    if (!text) {
      window.showToast('Please type something to post.');
      return;
    }

    const postData = {
      content: text,
      game: gameSelect.value || '',
      videoUrl: videoInput.value.trim() || ''
    };

    const result = await store.savePost(postData);
    if (result.success) {
      postContent.value = '';
      gameSelect.value = '';
      videoInput.value = '';
      window.showToast('Post published successfully!');
      renderFeedPage(navigateCallback); // Redraw timeline
    } else {
      window.showToast(result.error || 'Failed to post.');
    }
  });
}
