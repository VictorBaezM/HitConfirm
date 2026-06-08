/* Feed/Timeline Page Controller */
import store from '../store.js';
import { renderPostCard } from '../components/post-card.js';
import { renderComboCard } from '../components/combo-card.js';
import { renderGameSidebar, showGameSidebar } from '../components/game-sidebar.js';
import { extractYouTubeVideoId, fetchVideoTitle, validateVideoTitle, GAME_VIDEO_KEYWORDS } from '../utils/video-validator.js';
import { escapeHtml } from '../utils/security.js';

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
      <div class="pill-tabs">
        <div class="pill-tab active" id="feed-tab-all" data-tab="all">All Activity</div>
        <div class="pill-tab" id="feed-tab-following" data-tab="following">Following</div>
      </div>

      <!-- Feed Timeline -->
      <div id="timeline-list"></div>
    </div>

    <!-- Sidebar Dashboard Widgets (Right) -->
    <div id="feed-sidebar" class="flex flex-col gap-6">
      <!-- Dojo Training Widget -->
      <div class="card">
        <h3 class="wiki-console-title">
          <i class="fa-solid fa-fire"></i> Hottest Combos
        </h3>
        <div id="sidebar-hot-combos" class="flex flex-col gap-3"></div>
        <button class="btn btn-secondary btn-sm w-full" id="sidebar-go-dojo">
          Browse Dojo
        </button>
      </div>

      <!-- FGC Event Tracker -->
      <div class="card">
        <h3 class="wiki-console-title">
          <i class="fa-solid fa-trophy"></i> Weekly Dojo Challenge
        </h3>
        <div class="wiki-comment-item">
          <div class="wiki-comment-user">Street Fighter 6 Ryu Challenge</div>
          <p class="wiki-comment-text">Perform a corner combo ending in Shin Shoryuken with maximum damage scaling.</p>
          <div class="flex items-center justify-between">
            <span>Reward: <strong>"Legend" Title</strong></span>
            <span>Ends: <strong>3 days</strong></span>
          </div>
        </div>
        <button class="btn btn-primary btn-sm w-full" id="sidebar-go-builder">
          Try in Combo Builder
        </button>
      </div>

      <!-- FGC Game Resources & Patch Notes Widget -->
      <div class="card" id="feed-news-resources-widget">
        <h3 class="wiki-console-title">
          <i class="fa-solid fa-newspaper"></i> Game Resources & Patches
        </h3>
        <div class="flex flex-col gap-3">
          <!-- SF6 -->
          <div class="wiki-comment-item">
            <div class="wiki-comment-meta">
              <span>Street Fighter 6</span>
              <span class="badge badge-sf6">SF6</span>
            </div>
            <div class="flex gap-2">
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
          <div class="wiki-comment-item">
            <div class="wiki-comment-meta">
              <span>Tekken 8</span>
              <span class="badge badge-t8">T8</span>
            </div>
            <div class="flex gap-2">
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
          <div class="wiki-comment-item">
            <div class="wiki-comment-meta">
              <span>Guilty Gear -Strive-</span>
              <span class="badge badge-ggst">GGST</span>
            </div>
            <div class="flex gap-2">
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
          <div class="wiki-comment-item">
            <div class="wiki-comment-meta">
              <span>Smash Ultimate</span>
              <span class="badge badge-ssbu">SSBU</span>
            </div>
            <div class="flex gap-2">
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
      row.className = 'wiki-comment-item wiki-hoverable';
      row.style.cursor = 'pointer';
      row.innerHTML = `
        <div class="flex items-center justify-between">
          <span class="badge badge-${combo.game}">${combo.game.toUpperCase()}</span>
          <span class="wiki-char-badge">${combo.damage} DMG</span>
        </div>
        <div class="wiki-comment-user" style="margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
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

      <div class="flex gap-3" style="flex-wrap: wrap; margin-bottom: 8px;">
        <!-- Game Dropdown tag -->
        <div style="flex: 1; min-width: 140px;">
          <select class="form-select post-game-select" style="padding: 8px 12px; font-size: 0.85rem;" id="post-game-select">
            <option value="">Tag Game (Optional)</option>
            ${Object.values(games).map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
          </select>
        </div>

        <!-- Character Dropdown tag -->
        <div style="flex: 1; min-width: 140px; display: none;" id="post-char-select-container">
          <select class="form-select post-char-select" style="padding: 8px 12px; font-size: 0.85rem;" id="post-char-select">
            <option value="">Select Character</option>
          </select>
        </div>

        <!-- Video Input Link -->
        <div style="flex: 2; min-width: 200px; display: flex; align-items: center; position: relative;">
          <i class="fa-brands fa-youtube" style="position: absolute; left: 12px; color: #ff0000; font-size: 1.1rem;"></i>
          <input type="text" class="form-input post-video-input" id="post-video-input"
            placeholder="YouTube Video URL (Optional)"
            style="padding: 8px 12px 8px 36px; font-size: 0.85rem;" />
        </div>
      </div>

      <!-- Video format hint (always visible when a game is selected) -->
      <div id="video-format-hint" style="display: none; font-size: 0.78rem; color: var(--text-muted); margin-bottom: 8px; padding: 6px 10px; border-radius: var(--radius-sm); background: rgba(59,130,246,0.05); border: 1px solid rgba(59,130,246,0.12);">
        <i class="fa-solid fa-circle-info" style="color: var(--color-primary); margin-right: 5px;"></i>
        <span id="video-format-hint-text"></span>
      </div>

      <!-- oEmbed validation banner (shown after URL is entered) -->
      <div id="video-validation-banner" style="display: none; font-size: 0.82rem; padding: 10px 12px; border-radius: var(--radius-sm); margin-bottom: 10px;"></div>

      <!-- Confirmation checkbox (shown when video + game are both present) -->
      <div id="video-confirm-row" style="display: none; margin-bottom: 12px;">
        <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer; font-size: 0.85rem; color: var(--text-secondary);">
          <input type="checkbox" id="video-confirm-checkbox" style="accent-color: var(--color-primary); width: 15px; height: 15px; margin-top: 2px; flex-shrink: 0; cursor: pointer;">
          <span id="video-confirm-label">I confirm this video is directly relevant to the tagged game and the character shown in the combo.</span>
        </label>
      </div>

      <div class="flex justify-between items-center" style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px;">
        <span style="font-size: 0.8rem; color: var(--text-muted);">Posting as <strong>${escapeHtml(currentUser.username)}</strong></span>
        <button class="btn btn-primary btn-sm btn-submit-post" id="btn-submit-post">Publish Post</button>
      </div>
    </div>
  `;

  // Element references
  const submitBtn  = mount.querySelector('#btn-submit-post');
  const postContent = mount.querySelector('.post-input');
  const gameSelect  = mount.querySelector('#post-game-select');
  const videoInput  = mount.querySelector('#post-video-input');
  const formatHint  = mount.querySelector('#video-format-hint');
  const formatHintText = mount.querySelector('#video-format-hint-text');
  const validationBanner = mount.querySelector('#video-validation-banner');
  const confirmRow  = mount.querySelector('#video-confirm-row');
  const confirmCheckbox = mount.querySelector('#video-confirm-checkbox');
  const confirmLabel = mount.querySelector('#video-confirm-label');
  const charSelect  = mount.querySelector('#post-char-select');
  const charSelectContainer = mount.querySelector('#post-char-select-container');

  /** Updates the format hint text whenever the selected game changes. */
  const updateFormatHint = () => {
    const gameId = gameSelect.value;
    if (!gameId) {
      formatHint.style.display = 'none';
      return;
    }
    const gameData = GAME_VIDEO_KEYWORDS[gameId];
    if (!gameData) return;
    const selectedCharName = charSelect.value;
    const exampleChar = selectedCharName || (gameData.characterKeywords[0].charAt(0).toUpperCase() + gameData.characterKeywords[0].slice(1));
    formatHintText.textContent =
      `Video title must mention the game (e.g. "${gameData.label}") ` +
      `and the character (e.g. "${exampleChar}"). ` +
      `Example: "${gameData.label} – ${exampleChar} BnB Combo Guide"`;
    formatHint.style.display = 'block';
  };

  /**
   * Renders the oEmbed validation result into the banner element.
   * Uses escapeHtml on the video title before any DOM insertion to prevent XSS.
   *
   * @param {{ isValid: boolean, hasGameKeyword: boolean, hasCharKeyword: boolean, label: string } | null} result
   * @param {string} safeTitle - HTML-escaped video title string.
   */
  const renderValidationBanner = (result, safeTitle) => {
    if (!result) {
      // oEmbed failed — show neutral info banner, do not block
      validationBanner.style.display = 'block';
      validationBanner.style.background = 'rgba(245,158,11,0.06)';
      validationBanner.style.border = '1px solid rgba(245,158,11,0.2)';
      validationBanner.style.color = 'var(--text-secondary)';
      validationBanner.innerHTML =
        '<i class="fa-solid fa-triangle-exclamation" style="color: var(--color-accent); margin-right: 6px;"></i>' +
        'Could not verify video title (network issue). The confirmation checkbox is required to continue.';
      showConfirmRow(gameSelect.value);
      return;
    }

    if (result.isValid) {
      validationBanner.style.display = 'block';
      validationBanner.style.background = 'rgba(34,197,94,0.06)';
      validationBanner.style.border = '1px solid rgba(34,197,94,0.2)';
      validationBanner.style.color = 'var(--color-success)';
      validationBanner.innerHTML =
        `<i class="fa-solid fa-circle-check" style="margin-right: 6px;"></i>` +
        `Video "${safeTitle}" looks relevant to <strong>${escapeHtml(result.label)}</strong>. ` +
        `Confirmation checkbox still required before publishing.`;
      showConfirmRow(gameSelect.value);
      return;
    }

    // Mismatch — build specific missing-keyword feedback
    const missing = [];
    if (!result.hasGameKeyword) missing.push(`the game name ("${escapeHtml(result.label)}")`);
    if (!result.hasCharKeyword) missing.push('the character name');
    validationBanner.style.display = 'block';
    validationBanner.style.background = 'rgba(239,68,68,0.06)';
    validationBanner.style.border = '1px solid rgba(239,68,68,0.2)';
    validationBanner.style.color = 'var(--color-danger)';
    validationBanner.innerHTML =
      `<i class="fa-solid fa-triangle-exclamation" style="margin-right: 6px;"></i>` +
      `Video title "${safeTitle}" is missing ${missing.join(' and ')}. ` +
      `Please use a video whose title clearly mentions both. You may still post, ` +
      `but must confirm relevance below.`;
    showConfirmRow(gameSelect.value);
  };

  /**
   * Shows the confirmation checkbox row with the correct game label.
   * @param {string} gameId - The currently selected game ID.
   */
  const showConfirmRow = (gameId) => {
    const gameData = GAME_VIDEO_KEYWORDS[gameId];
    const gameName = gameData ? gameData.label : 'the tagged game';
    const selectedCharName = charSelect.value;
    const charName = selectedCharName || 'the tagged character';
    confirmLabel.textContent =
      `I confirm this video is a ${gameName} combo or clip featuring ${charName}.`;
    confirmRow.style.display = 'block';
    confirmCheckbox.checked = false;
  };

  /** Hides validation UI when the video URL or game is cleared. */
  const resetValidationUI = () => {
    validationBanner.style.display = 'none';
    validationBanner.innerHTML = '';
    confirmRow.style.display = 'none';
    confirmCheckbox.checked = false;
  };

  // Wire: game select changes → update format hint, populate char dropdown, re-validate if URL present
  gameSelect.addEventListener('change', () => {
    const gameId = gameSelect.value;
    if (gameId) {
      const gameData = games[gameId];
      if (gameData && gameData.characters) {
        charSelect.innerHTML = `<option value="">Select Character</option>` +
          gameData.characters.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
        charSelectContainer.style.display = 'block';
      } else {
        charSelectContainer.style.display = 'none';
        charSelect.innerHTML = `<option value="">Select Character</option>`;
      }
    } else {
      charSelectContainer.style.display = 'none';
      charSelect.innerHTML = `<option value="">Select Character</option>`;
    }

    updateFormatHint();
    if (!videoInput.value.trim()) {
      resetValidationUI();
    } else {
      videoInput.dispatchEvent(new Event('blur'));
    }
  });

  // Wire: character select changes → re-validate if URL present, update format hint
  charSelect.addEventListener('change', () => {
    updateFormatHint();
    if (videoInput.value.trim()) {
      videoInput.dispatchEvent(new Event('blur'));
    }
  });

  // Wire: URL input loses focus → run oEmbed check
  videoInput.addEventListener('blur', async () => {
    const rawUrl = videoInput.value.trim();
    const gameId = gameSelect.value;

    if (!rawUrl) { resetValidationUI(); return; }
    if (!gameId)  { resetValidationUI(); return; }

    const videoId = extractYouTubeVideoId(rawUrl);
    if (!videoId) {
      validationBanner.style.display = 'block';
      validationBanner.style.background = 'rgba(239,68,68,0.06)';
      validationBanner.style.border = '1px solid rgba(239,68,68,0.2)';
      validationBanner.style.color = 'var(--color-danger)';
      validationBanner.innerHTML =
        '<i class="fa-solid fa-link-slash" style="margin-right: 6px;"></i>' +
        'That does not look like a valid YouTube URL. Please use a full youtube.com or youtu.be link.';
      confirmRow.style.display = 'none';
      return;
    }

    validationBanner.style.display = 'block';
    validationBanner.style.background = 'rgba(59,130,246,0.05)';
    validationBanner.style.border = '1px solid rgba(59,130,246,0.12)';
    validationBanner.style.color = 'var(--text-muted)';
    validationBanner.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin" style="margin-right: 6px;"></i>Checking video title...';

    const rawTitle = await fetchVideoTitle(videoId);
    const safeTitle = escapeHtml(rawTitle || '');
    const selectedChar = charSelect.value;
    const result = rawTitle ? validateVideoTitle(rawTitle, gameId, selectedChar) : null;
    renderValidationBanner(result, safeTitle);
  });

  // Publish action
  submitBtn.addEventListener('click', async () => {
    const text = postContent.value.trim();
    if (!text) {
      window.showToast('Please type something to post.');
      return;
    }

    const rawUrl = videoInput.value.trim();
    const gameId = gameSelect.value;
    const charId = charSelect.value;

    // Enforce character select if game is selected
    if (gameId && !charId) {
      window.showToast('Please select a character tag for your post.');
      charSelect.focus();
      return;
    }

    // If video + game are both provided, the confirmation checkbox is mandatory
    if (rawUrl && gameId && !confirmCheckbox.checked) {
      window.showToast('Please confirm that the video is relevant to the tagged game.');
      confirmRow.style.display = 'block';
      confirmCheckbox.focus();
      return;
    }

    // Explicit acknowledgement browser confirm dialog on publish if video is provided
    if (rawUrl && gameId) {
      const gameData = GAME_VIDEO_KEYWORDS[gameId];
      const gameName = gameData ? gameData.label : gameId;
      const charName = charId || 'the tagged character';
      const confirmed = window.confirm(
        `Do you acknowledge and confirm that this post represents ${gameName} and features ${charName}?`
      );
      if (!confirmed) return;
    }

    // Append hashtag for character automatically to post content
    let finalContent = text;
    if (charId) {
      const hashtag = '#' + charId.replace(/[-.\s]/g, '');
      if (!finalContent.toLowerCase().includes(hashtag.toLowerCase())) {
        finalContent += `\n\n${hashtag}`;
      }
    }

    const postData = {
      content: finalContent,
      game: gameId || '',
      videoUrl: rawUrl || ''
    };

    const result = await store.savePost(postData);
    if (result.success) {
      postContent.value = '';
      gameSelect.value = '';
      charSelect.value = '';
      charSelectContainer.style.display = 'none';
      videoInput.value = '';
      resetValidationUI();
      formatHint.style.display = 'none';
      window.showToast('Post published successfully!');
      renderFeedPage(navigateCallback);
    } else {
      window.showToast(result.error || 'Failed to post.');
    }
  });
}
