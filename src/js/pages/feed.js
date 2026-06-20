/* Feed/Timeline Page Controller */
import store from '../store.js';
import { renderPostCard } from '../components/post-card.js';
import { renderComboCard } from '../components/combo-card.js';
import { renderGameSidebar, showGameSidebar } from '../components/game-sidebar.js';
import { extractYouTubeVideoId, fetchVideoTitle, validateVideoTitle, GAME_VIDEO_KEYWORDS } from '../utils/video-validator.js';
import { escapeHtml } from '../utils/security.js';
import { fetchGameNews } from '../utils/news-fetcher.js';

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
          <span class="material-symbols-rounded icon-mr-1">whatshot</span>Hottest Combos
        </h3>
        <div id="sidebar-hot-combos" class="flex flex-col gap-3"></div>
        <button class="btn btn-secondary btn-sm w-full" id="sidebar-go-dojo">
          Browse Dojo
        </button>
      </div>

      <!-- FGC Game News Widget -->
      <div class="card" id="sidebar-game-news-card">
        <h3 class="wiki-console-title">
          <span class="material-symbols-rounded icon-mr-1">newspaper</span>Latest Game News
        </h3>
        <div id="sidebar-game-news-list" class="flex flex-col gap-3">
          <div class="text-center py-4 text-gray">
            <span class="material-symbols-rounded spin icon-mr-1">progress_activity</span>Loading latest news...
          </div>
        </div>
      </div>

      <!-- FGC Game Resources & Patch Notes Widget -->
      <div class="card" id="feed-news-resources-widget">
        <h3 class="wiki-console-title">
          <span class="material-symbols-rounded icon-mr-1">newspaper</span>Game Resources & Patches
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
                <span class="material-symbols-rounded icon-mr-1" style="font-size: 16px; vertical-align: middle;">public</span>Site
              </a>
              <a href="https://www.streetfighter.com/6/en-us/character/" target="_blank" rel="noopener noreferrer" class="game-resource-btn game-resource-btn-sf6">
                <span class="material-symbols-rounded icon-mr-1" style="font-size: 16px; vertical-align: middle;">group</span>Roster
              </a>
              <a href="https://www.streetfighter.com/6/en-us/buckler/battle_change/" target="_blank" rel="noopener noreferrer" class="game-resource-btn game-resource-btn-sf6">
                <span class="material-symbols-rounded icon-mr-1" style="font-size: 16px; vertical-align: middle;">article</span>Patches
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
                <span class="material-symbols-rounded icon-mr-1" style="font-size: 16px; vertical-align: middle;">public</span>Site
              </a>
              <a href="https://bandainamcoent.com/games/tekken-8" target="_blank" rel="noopener noreferrer" class="game-resource-btn game-resource-btn-t8">
                <span class="material-symbols-rounded icon-mr-1" style="font-size: 16px; vertical-align: middle;">group</span>Roster
              </a>
              <a href="https://bandainamcoent.com/news?game=tekken-8" target="_blank" rel="noopener noreferrer" class="game-resource-btn game-resource-btn-t8">
                <span class="material-symbols-rounded icon-mr-1" style="font-size: 16px; vertical-align: middle;">article</span>Patches
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
                <span class="material-symbols-rounded icon-mr-1" style="font-size: 16px; vertical-align: middle;">public</span>Site
              </a>
              <a href="https://www.guiltygear.com/ggst/en/character/" target="_blank" rel="noopener noreferrer" class="game-resource-btn game-resource-btn-ggst">
                <span class="material-symbols-rounded icon-mr-1" style="font-size: 16px; vertical-align: middle;">group</span>Roster
              </a>
              <a href="https://www.guiltygear.com/ggst/en/news/" target="_blank" rel="noopener noreferrer" class="game-resource-btn game-resource-btn-ggst">
                <span class="material-symbols-rounded icon-mr-1" style="font-size: 16px; vertical-align: middle;">article</span>Patches
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
                <span class="material-symbols-rounded icon-mr-1" style="font-size: 16px; vertical-align: middle;">public</span>Site
              </a>
              <a href="https://www.smashbros.com/en_US/char/index.html" target="_blank" rel="noopener noreferrer" class="game-resource-btn game-resource-btn-ssbu">
                <span class="material-symbols-rounded icon-mr-1" style="font-size: 16px; vertical-align: middle;">group</span>Roster
              </a>
              <a href="https://en-americas-support.nintendo.com/app/answers/detail/a_id/42809" target="_blank" rel="noopener noreferrer" class="game-resource-btn game-resource-btn-ssbu">
                <span class="material-symbols-rounded icon-mr-1" style="font-size: 16px; vertical-align: middle;">article</span>Patches
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

  function refreshTimeline() {
    const listMount = document.getElementById('timeline-list');
    if (!listMount) return;

    let posts = store.getPosts();
    
    // 1. Filter by feed tab
    if (activeFeedTab === 'following') {
      if (!currentUser) {
        listMount.innerHTML = `
          <div class="card" style="text-align: center; padding: 48px; color: var(--text-secondary); border-color: rgba(255, 0, 91, 0.15);">
            <span class="material-symbols-rounded" style="font-size: 2.5rem; margin-bottom: 12px; color: var(--color-secondary); display: block; margin-left: auto; margin-right: auto; width: fit-content;">lock</span>
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
            <span class="material-symbols-rounded" style="font-size: 2.5rem; margin-bottom: 12px; color: var(--color-secondary); display: block; margin-left: auto; margin-right: auto; width: fit-content;">person_add</span>
            <h3>Your following feed is empty</h3>
            <p style="font-size: 0.9rem; margin-top: 4px;">Follow other players in the community to customize your activity feed.</p>
          </div>
        `;
        return;
      }
      posts = posts.filter(function (p) { return followingList.includes(p.userId); });
    }

    // 2. Filter by game chip
    const filtered = activeGameFilter === 'all' 
      ? posts 
      : posts.filter(function (p) { return p.game === activeGameFilter; });

    if (filtered.length === 0) {
      listMount.innerHTML = `
        <div class="card" style="text-align: center; padding: 48px; color: var(--text-secondary);">
          <span class="material-symbols-rounded" style="font-size: 2.5rem; margin-bottom: 12px; color: var(--color-secondary); display: block; margin-left: auto; margin-right: auto; width: fit-content;">sentiment_very_dissatisfied</span>
          <h3>No posts found here yet</h3>
          <p style="font-size: 0.9rem; margin-top: 4px;">Be the first to share your thoughts, videos or strategies!</p>
        </div>
      `;
      return;
    }

    listMount.innerHTML = '';
    filtered.forEach(function (post) {
      listMount.appendChild(renderPostCard(post, navigateCallback));
    });
  }

  refreshTimeline();

  // Attach Feed Pill Tab listeners
  const tabAll = document.getElementById('feed-tab-all');
  const tabFollowing = document.getElementById('feed-tab-following');
  
  tabAll.addEventListener('click', function () {
    tabAll.classList.add('active');
    tabFollowing.classList.remove('active');
    activeFeedTab = 'all';
    refreshTimeline();
  });
  
  tabFollowing.addEventListener('click', function () {
    tabFollowing.classList.add('active');
    tabAll.classList.remove('active');
    activeFeedTab = 'following';
    refreshTimeline();
  });

  // Draw Hot Combos Widget
  function refreshHotCombos() {
    const sideMount = document.getElementById('sidebar-hot-combos');
    if (!sideMount) return;

    const combos = store.getCombos().slice(0, 2);
    if (combos.length === 0) {
      sideMount.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-muted);">No combos shared yet.</p>`;
      return;
    }

    sideMount.innerHTML = '';
    combos.forEach(function (combo) {
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
      row.addEventListener('click', function () {
        navigateCallback('combos', { game: combo.game });
      });
      sideMount.appendChild(row);
    });
  }

  refreshHotCombos();

  // Load dynamic game news for supported games
  async function loadSidebarNews() {
    const newsContainer = document.getElementById('sidebar-game-news-list');
    if (!newsContainer) return;

    try {
      const officialGameIds = Object.keys(games).filter(id => id !== 'dbfzce');
      const newsItems = await fetchGameNews(officialGameIds);
      
      let newsHtml = '';
      newsItems.forEach(item => {
        const game = games[item.gameId];
        const badgeClass = `badge-${item.gameId}`;
        const gameName = game ? game.name : item.gameId.toUpperCase();
        
        newsHtml += `
          <div class="wiki-news-game-item">
            <div class="wiki-news-game-header flex items-center justify-between">
              <span class="game-name font-semibold text-sm">${escapeHtml(gameName)}</span>
              <span class="badge ${badgeClass}">${item.gameId.toUpperCase()}</span>
            </div>
            <div class="wiki-news-article">
              <a class="news-title text-sm" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">
                ${escapeHtml(item.title)}
              </a>
              <div class="news-meta text-xs text-gray mt-1">
                <span class="material-symbols-rounded icon-mr-1" style="font-size: 14px; vertical-align: middle;">schedule</span>${escapeHtml(item.date)}
              </div>
            </div>
          </div>
        `;
      });

      newsContainer.innerHTML = newsHtml;
    } catch (err) {
      console.error('[Feed Page] Error loading sidebar news:', err);
      newsContainer.innerHTML = `
        <div class="text-center py-4 text-red">
          <span class="material-symbols-rounded icon-mr-1" style="font-size: 16px; vertical-align: middle;">warning</span>Failed to load latest news.
        </div>
      `;
    }
  }

  loadSidebarNews();

  // Attach Sidebar Button Listeners
  document.getElementById('sidebar-go-dojo').addEventListener('click', function () { navigateCallback('combos'); });

  // Initialize Left Game Sidebar
  function initSidebar(activeGame, activeDifficulties) {
    renderGameSidebar({
      activeGame,
      activeDifficulties,
      onGameChange: function (gameId) {
        activeGameFilter = gameId;
        refreshTimeline();
        initSidebar(gameId, activeDifficulties);
      },
      onDifficultyChange: function (difficulties) {
        activeDifficulties = difficulties;
        initSidebar(activeGameFilter, difficulties);
      }
    });
  }

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

    mount.querySelector('.btn-feed-signup').addEventListener('click', function () {
      window.openAuthModal('register', navigateCallback);
    });
    mount.querySelector('.btn-feed-login').addEventListener('click', function () {
      window.openAuthModal('login', navigateCallback);
    });
    return;
  }

  // Logged-in feed layout
  mount.innerHTML = `
    <div class="card">
      <h3 class="wiki-console-title">
        <span class="material-symbols-rounded icon-mr-1" style="vertical-align: middle;">edit</span>Share a Strategic Thought or Clip
      </h3>
      
      <div class="form-group">
        <textarea class="form-textarea post-input" name="content" aria-label="Post Content" placeholder="What are you learning in the lab today? Use **bold** for combos or #hashtags..."></textarea>
      </div>

      <div class="flex gap-3" style="flex-wrap: wrap; margin-bottom: 8px;">
        <!-- Game Dropdown tag -->
        <div style="flex: 1; min-width: 140px;">
          <select class="form-select post-game-select" id="post-game-select" name="game" aria-label="Tag Game">
            <option value="">Tag Game (Optional)</option>
            ${Object.values(games).map(function (g) {
              return `<option value="${g.id}">${g.name}</option>`;
            }).join('')}
          </select>
        </div>

        <!-- Character Dropdown tag -->
        <div style="flex: 1; min-width: 140px; display: none;" id="post-char-select-container">
          <select class="form-select post-char-select" id="post-char-select" name="character" aria-label="Select Character">
            <option value="">Select Character</option>
          </select>
        </div>

        <!-- Video Input Link -->
        <div class="video-input-wrapper" style="flex: 2; min-width: 200px;">
          <span id="combo-video-icon" class="material-symbols-rounded video-input-icon">videocam</span>
          <input type="text" id="post-video-input" name="video" class="form-input post-video-input" aria-label="YouTube Video URL" placeholder="YouTube Video URL (Optional)" />
        </div>
      </div>

      <!-- Combo Notation Input (placed underneath the chosen video row) -->
      <div class="form-group" style="margin-top: 12px;">
        <label class="form-label" for="post-notation-input">Combo Notation (Optional)</label>
        <input type="text" id="post-notation-input" name="notation" class="form-input" placeholder="e.g. 236P > 5K > 2D" />
      </div>

      <!-- Video format hint (always visible when a game is selected) -->
      <div id="video-format-hint" class="wiki-comment-item" style="display: none; margin-top: 8px;">
        <span class="material-symbols-rounded icon-mr-1" style="color: var(--color-primary); font-size: 18px; vertical-align: middle;">info</span>
        <span id="video-format-hint-text"></span>
      </div>

      <!-- oEmbed validation banner (shown after URL is entered) -->
      <div id="video-validation-banner" style="display: none; margin-top: 8px;"></div>

      <!-- Confirmation checkbox (shown when video + game are both present) -->
      <div id="video-confirm-row" style="display: none; margin-top: 8px;">
        <label class="wiki-comment-user" style="cursor: pointer; display: flex; align-items: flex-start; gap: 10px;" for="video-confirm-checkbox">
          <input type="checkbox" id="video-confirm-checkbox" name="videoConfirm" aria-label="Confirm video relevance" style="width: 16px; height: 16px; margin-top: 2px;">
          <span id="video-confirm-label">I confirm this video is directly relevant to the tagged game and the character shown in the combo.</span>
        </label>
      </div>

      <div class="flex justify-between items-center" style="border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 12px;">
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
  const notationInput = mount.querySelector('#post-notation-input');

  /** Updates the format hint text whenever the selected game changes. */
  function updateFormatHint() {
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
  }

  /**
   * Renders the oEmbed validation result into the banner element.
   * Uses escapeHtml on the video title before any DOM insertion to prevent XSS.
   *
   * @param {{ isValid: boolean, hasGameKeyword: boolean, hasCharKeyword: boolean, label: string } | null} result
   * @param {string} safeTitle - HTML-escaped video title string.
   */
  function renderValidationBanner(result, safeTitle) {
    if (!result) {
      // oEmbed failed — show neutral info banner, do not block
      validationBanner.style.display = 'block';
      validationBanner.style.background = 'rgba(245,158,11,0.06)';
      validationBanner.style.border = '1px solid rgba(245,158,11,0.2)';
      validationBanner.style.color = 'var(--text-secondary)';
      validationBanner.innerHTML =
        '<span class="material-symbols-rounded icon-mr-1" style="color: var(--color-accent); font-size: 16px; vertical-align: middle;">warning</span>' +
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
        `<span class="material-symbols-rounded icon-mr-1" style="font-size: 16px; vertical-align: middle;">check_circle</span>` +
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
      `<span class="material-symbols-rounded icon-mr-1" style="font-size: 16px; vertical-align: middle;">warning</span>` +
      `Video title "${safeTitle}" is missing ${missing.join(' and ')}. ` +
      `Please use a video whose title clearly mentions both. You may still post, ` +
      `but must confirm relevance below.`;
    showConfirmRow(gameSelect.value);
  }

  /**
   * Shows the confirmation checkbox row with the correct game label.
   * @param {string} gameId - The currently selected game ID.
   */
  function showConfirmRow(gameId) {
    const gameData = GAME_VIDEO_KEYWORDS[gameId];
    const gameName = gameData ? gameData.label : 'the tagged game';
    const selectedCharName = charSelect.value;
    const charName = selectedCharName || 'the tagged character';
    confirmLabel.textContent =
      `I confirm this video is a ${gameName} combo or clip featuring ${charName}.`;
    confirmRow.style.display = 'block';
    confirmCheckbox.checked = false;
  }

  /** Hides validation UI when the video URL or game is cleared. */
  function resetValidationUI() {
    validationBanner.style.display = 'none';
    validationBanner.innerHTML = '';
    confirmRow.style.display = 'none';
    confirmCheckbox.checked = false;
  }

  // Wire: game select changes → update format hint, populate char dropdown, re-validate if URL present
  gameSelect.addEventListener('change', function () {
    const gameId = gameSelect.value;
    if (gameId) {
      const gameData = games[gameId];
      if (gameData && gameData.characters) {
        charSelect.innerHTML = `<option value="">Select Character</option>` +
          gameData.characters.map(function (c) {
            return `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`;
          }).join('');
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
  charSelect.addEventListener('change', function () {
    updateFormatHint();
    if (videoInput.value.trim()) {
      videoInput.dispatchEvent(new Event('blur'));
    }
  });

  // Wire: URL input loses focus → run oEmbed check
  videoInput.addEventListener('blur', async function () {
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
        '<span class="material-symbols-rounded icon-mr-1" style="font-size: 16px; vertical-align: middle;">link_off</span>' +
        'That does not look like a valid YouTube URL. Please use a full youtube.com or youtu.be link.';
      confirmRow.style.display = 'none';
      return;
    }

    validationBanner.style.display = 'block';
    validationBanner.style.background = 'rgba(59,130,246,0.05)';
    validationBanner.style.border = '1px solid rgba(59,130,246,0.12)';
    validationBanner.style.color = 'var(--text-muted)';
    validationBanner.innerHTML =
      '<span class="material-symbols-rounded spin icon-mr-1" style="font-size: 16px; vertical-align: middle;">progress_activity</span>Checking video title...';

    const rawTitle = await fetchVideoTitle(videoId);
    const safeTitle = escapeHtml(rawTitle || '');
    const selectedChar = charSelect.value;
    const result = rawTitle ? validateVideoTitle(rawTitle, gameId, selectedChar) : null;
    renderValidationBanner(result, safeTitle);
  });

  // Publish action
  submitBtn.addEventListener('click', async function () {
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

    const postNotation = notationInput ? notationInput.value.trim() : '';
    if (postNotation) {
      finalContent += '\n\n---NOTATION---\n' + postNotation;
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
      if (notationInput) notationInput.value = '';
      resetValidationUI();
      formatHint.style.display = 'none';
      window.showToast('Post published successfully!');
      renderFeedPage(navigateCallback);
    } else {
      window.showToast(result.error || 'Failed to post.');
    }
  });
}
