/* Combos Dojo Page Controller */
import store from '../store.js';
import { renderComboCard } from '../components/combo-card.js';
import { renderGameSidebar, showGameSidebar } from '../components/game-sidebar.js';

/**
 * Renders the Training Dojo combos page containing text query search filters,
 * game drop-down menus, difficulty tags, master boards, and combo lists.
 * @param {function} navigateCallback - SPA router callback.
 * @param {Object} [initialFilters={}] - Predefined filter parameters (e.g. { game: 'sf6' }).
 */
export function renderCombosPage(navigateCallback, initialFilters = {}) {
  const mount = document.getElementById('content-mount');
  if (!mount) return;

  // Show left sidebar and set 3-column layout
  mount.className = 'has-game-sidebar';
  showGameSidebar();

  const games = store.getGames();
  const currentUser = store.getCurrentUser();

  // Load initial filters (if navigated from sidebar)
  let activeGame = initialFilters.game || 'all';
  let activeDifficulty = 'all';
  let searchQuery = '';

  mount.innerHTML = `
    <!-- Dojo Content (Left) -->
    <div id="dojo-left-pane">
      <div class="dojo-title-container">
        <div>
          <h1 class="gradient-text dojo-title-main">TRAINING DOJO</h1>
          <p class="dojo-title-desc">Browse community optimization combos and inputs.</p>
        </div>
        <button class="btn btn-primary" id="dojo-create-combo-btn">
          <i class="fa-solid fa-plus"></i> Share Combo
        </button>
      </div>

      <!-- Dojo Tab Toggle -->
      <div class="tabs dojo-tabs-wrapper">
        <div class="game-chip tab active" id="dojo-tab-all">Browse Dojo</div>
        <div class="game-chip tab" id="dojo-tab-following">Following Dojo</div>
      </div>

      <!-- Filters Panel -->
      <div class="card dojo-filters-card">
        <div class="dojo-filters-grid">
          <!-- Search box -->
          <div class="dojo-search-relative">
            <input type="text" id="dojo-search-char" class="form-input dojo-search-field" placeholder="Search by character (e.g. Sol, Ryu, Kazuya)..." value="" />
          </div>

          <div class="dojo-select-filters-grid">
            <!-- Game selector drop -->
            <div>
              <select id="dojo-game-filter" class="form-select dojo-select-filter-box">
                <option value="all">All Games</option>
                ${Object.values(games).map(function (g) {
                  return `<option value="${g.id}">${g.name}</option>`;
                }).join('')}
              </select>
            </div>

            <!-- Difficulty selector drop -->
            <div>
              <select id="dojo-difficulty-filter" class="form-select dojo-select-filter-box">
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Combo Grid -->
      <div id="dojo-combos-list"></div>
    </div>

    <!-- Dojo Sidebar (Right) -->
    <div id="dojo-sidebar" class="flex flex-col gap-6">

      <div class="card dojo-sidebar-card">
        <h3 class="dojo-sidebar-heading">
          <i class="fa-solid fa-trophy dojo-sidebar-heading-ticon"></i> Top Lab Masters
        </h3>
        <div id="top-lab-masters-mount" class="flex flex-col gap-3">
          <!-- Dynamically populated -->
        </div>
      </div>
    </div>
  `;

  // Restore filters if passed from feed
  if (initialFilters.game) {
    const gameSel = document.getElementById('dojo-game-filter');
    if (gameSel) gameSel.value = initialFilters.game;
  }

  let activeDojoTab = 'all'; // 'all' or 'following'

  // Draw list function
  function drawList() {
    const listMount = document.getElementById('dojo-combos-list');
    if (!listMount) return;

    let combos = store.getCombos();
    
    // 1. Filter by Following tab
    if (activeDojoTab === 'following') {
      if (!currentUser) {
        listMount.innerHTML = `
          <div class="card dojo-locked-card">
            <i class="fa-solid fa-lock icon-lg mb-3 color-secondary"></i>
            <h3>Log in to see combos from followed users</h3>
            <p class="font-md mt-1">Follow other lab masters and see their optimized combos here!</p>
          </div>
        `;
        return;
      }
      const followingList = currentUser.following || [];
      if (followingList.length === 0) {
        listMount.innerHTML = `
          <div class="card feed-empty-card">
            <i class="fa-solid fa-user-plus icon-lg mb-3 color-secondary"></i>
            <h3>Your Following Dojo is empty</h3>
            <p class="font-md mt-1">Follow other players in the community to customize your Dojo.</p>
          </div>
        `;
        return;
      }
      combos = combos.filter(function (c) { return followingList.includes(c.userId); });
    }
    
    // 2. Perform Filtering
    const filtered = combos.filter(function (c) {
      // Game Filter
      if (activeGame !== 'all' && c.game !== activeGame) return false;
      // Difficulty Filter
      if (activeDifficulty !== 'all' && c.difficulty !== activeDifficulty) return false;
      // Character Search query
      if (searchQuery) {
        const charName = c.character.toLowerCase();
        const titleText = c.title.toLowerCase();
        const searchNorm = searchQuery.toLowerCase();
        if (!charName.includes(searchNorm) && !titleText.includes(searchNorm)) {
          return false;
        }
      }
      return true;
    });

    if (filtered.length === 0) {
      listMount.innerHTML = `
        <div class="card feed-empty-card">
          <i class="fa-solid fa-compass icon-lg mb-3 color-primary"></i>
          <h3>No matching combos found</h3>
          <p class="font-md mt-1">Try modifying your search queries or game filter categories.</p>
        </div>
      `;
      return;
    }

    listMount.innerHTML = '';
    filtered.forEach(function (combo) {
      listMount.appendChild(renderComboCard(combo, navigateCallback));
    });
  }

  // Draw top lab masters
  function drawTopLabMasters() {
    const mastersMount = document.getElementById('top-lab-masters-mount');
    if (!mastersMount) return;

    const combosList = store.getCombos();
    const usersList = store.getUsers();

    const comboCounts = {};
    combosList.forEach(function (c) {
      if (c.userId) {
        comboCounts[c.userId] = (comboCounts[c.userId] || 0) + 1;
      }
    });

    const rankedUsers = usersList
      .map(function (u) {
        return {
          ...u,
          comboCount: comboCounts[u.id] || 0
        };
      })
      .sort(function (a, b) {
        return b.comboCount - a.comboCount || a.username.localeCompare(b.username);
      })
      .slice(0, 3);

    mastersMount.innerHTML = '';
    
    if (rankedUsers.length === 0) {
      mastersMount.innerHTML = `<p class="font-xs text-muted text-center m-0">No active users found.</p>`;
      return;
    }

    rankedUsers.forEach(function (user, index) {
      const row = document.createElement('div');
      row.className = 'flex justify-between items-center font-sm';
      
      row.innerHTML = `
        <span class="master-link underline-link">
          ${index + 1}. ${user.username}
        </span>
        <span class="text-muted">${user.comboCount} combo${user.comboCount === 1 ? '' : 's'}</span>
      `;

      row.querySelector('.master-link').addEventListener('click', function () {
        navigateCallback('profile', { userId: user.id });
      });

      mastersMount.appendChild(row);
    });
  }

  drawList();
  drawTopLabMasters();

  // Initialize game logo selector sidebar
  function initDojoSidebar(gameId) {
    renderGameSidebar({
      activeGame: gameId,
      onGameChange: function (selectedId) {
        activeGame = selectedId;
        const gameFilterEl = document.getElementById('dojo-game-filter');
        if (gameFilterEl) gameFilterEl.value = selectedId;
        drawList();
        initDojoSidebar(selectedId);
      }
    });
  }

  initDojoSidebar(activeGame);

  // Attach Dojo Tab listeners
  const tabAll = document.getElementById('dojo-tab-all');
  const tabFollowing = document.getElementById('dojo-tab-following');
  
  tabAll.addEventListener('click', function () {
    tabAll.classList.add('active');
    tabFollowing.classList.remove('active');
    tabStrategy.classList.remove('active');
    activeDojoTab = 'all';
    drawList();
  });
  
  tabFollowing.addEventListener('click', function () {
    tabFollowing.classList.add('active');
    tabAll.classList.remove('active');
    tabStrategy.classList.remove('active');
    activeDojoTab = 'following';
    drawList();
  });

  // Attach filter event handlers
  const searchInput = document.getElementById('dojo-search-char');
  searchInput.addEventListener('input', function (e) {
    searchQuery = e.target.value;
    drawList();
  });

  const gameFilter = document.getElementById('dojo-game-filter');
  gameFilter.addEventListener('change', function (e) {
    activeGame = e.target.value;
    drawList();
    initDojoSidebar(activeGame);
  });

  const difficultyFilter = document.getElementById('dojo-difficulty-filter');
  difficultyFilter.addEventListener('change', function (e) {
    activeDifficulty = e.target.value;
    drawList();
  });

  // Attach Create button click
  document.getElementById('dojo-create-combo-btn').addEventListener('click', function () {
    if (!currentUser) {
      window.openAuthModal('login', navigateCallback);
    } else {
      navigateCallback('builder');
    }
  });
}
