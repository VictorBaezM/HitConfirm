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
      <div class="flex justify-between items-center" style="margin-bottom: 24px;">
        <div>
          <h1 class="gradient-text" style="font-size: 1.8rem;">TRAINING DOJO</h1>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">Browse community optimization combos and inputs.</p>
        </div>
        <button class="btn btn-primary" id="dojo-create-combo-btn">
          <i class="fa-solid fa-plus"></i> Share Combo
        </button>
      </div>

      <!-- Dojo Tab Toggle -->
      <div class="tabs" style="margin-bottom: 16px;">
        <div class="tab active" id="dojo-tab-all">Browse Dojo</div>
        <div class="tab" id="dojo-tab-following">Following Dojo</div>
      </div>

      <!-- Filters Panel -->
      <div class="card" style="padding: 16px; margin-bottom: 24px;">
        <div style="display: grid; grid-template-columns: 1fr; gap: 12px; align-items: center;">
          <!-- Search box -->
          <div style="position: relative;">
            <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"></i>
            <input type="text" id="dojo-search-char" class="form-input" placeholder="Search by character (e.g. Sol, Ryu, Kazuya)..." style="padding-left: 38px; font-size: 0.9rem;" value="" />
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px;">
            <!-- Game selector drop -->
            <div>
              <select id="dojo-game-filter" class="form-select" style="font-size: 0.85rem; padding: 10px 14px;">
                <option value="all">All Games</option>
                ${Object.values(games).map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
              </select>
            </div>

            <!-- Difficulty selector drop -->
            <div>
              <select id="dojo-difficulty-filter" class="form-select" style="font-size: 0.85rem; padding: 10px 14px;">
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
      <div class="card" style="padding: 20px;">
        <h3 style="font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 12px;">
          <i class="fa-solid fa-circle-question" style="color: var(--color-secondary);"></i> Reading Notations
        </h3>
        <ul style="padding-left: 18px; font-size: 0.85rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 8px;">
          <li><strong>Anime (GG):</strong> Numpad directions (e.g., 236 = QCF) and buttons: <strong>P</strong> (Punch), <strong>K</strong> (Kick), <strong>S</strong> (Slash), <strong>HS</strong> (Heavy), <strong>D</strong> (Dust).</li>
          <li><strong>SF6:</strong> Classic directions (2MK = cr.MK) and buttons: <strong>LP/LK</strong>, <strong>MP/MK</strong>, <strong>HP/HK</strong>.</li>
          <li><strong>Tekken:</strong> Buttons <strong>1</strong> (LP), <strong>2</strong> (RP), <strong>3</strong> (LK), <strong>4</strong> (RK) with arrow directions.</li>
        </ul>
      </div>

      <div class="card" style="padding: 20px;">
        <h3 style="font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 12px;">
          <i class="fa-solid fa-trophy" style="color: var(--color-accent);"></i> Top Lab Masters
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
  const drawList = () => {
    const listMount = document.getElementById('dojo-combos-list');
    if (!listMount) return;

    let combos = store.getCombos();
    
    // 1. Filter by Following tab
    if (activeDojoTab === 'following') {
      if (!currentUser) {
        listMount.innerHTML = `
          <div class="card" style="text-align: center; padding: 48px; color: var(--text-secondary); border-color: rgba(0, 240, 255, 0.15);">
            <i class="fa-solid fa-lock" style="font-size: 2.5rem; margin-bottom: 12px; color: var(--color-secondary);"></i>
            <h3>Log in to see combos from followed users</h3>
            <p style="font-size: 0.9rem; margin-top: 4px;">Follow other lab masters and see their optimized combos here!</p>
          </div>
        `;
        return;
      }
      const followingList = currentUser.following || [];
      if (followingList.length === 0) {
        listMount.innerHTML = `
          <div class="card" style="text-align: center; padding: 48px; color: var(--text-secondary);">
            <i class="fa-solid fa-user-plus" style="font-size: 2.5rem; margin-bottom: 12px; color: var(--color-secondary);"></i>
            <h3>Your Following Dojo is empty</h3>
            <p style="font-size: 0.9rem; margin-top: 4px;">Follow other players in the community to customize your Dojo.</p>
          </div>
        `;
        return;
      }
      combos = combos.filter(c => followingList.includes(c.userId));
    }
    
    // 2. Perform Filtering
    const filtered = combos.filter(c => {
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
        <div class="card" style="text-align: center; padding: 48px; color: var(--text-secondary);">
          <i class="fa-solid fa-compass" style="font-size: 2.5rem; margin-bottom: 12px; color: var(--color-primary);"></i>
          <h3>No matching combos found</h3>
          <p style="font-size: 0.9rem; margin-top: 4px;">Try modifying your search queries or game filter categories.</p>
        </div>
      `;
      return;
    }

    listMount.innerHTML = '';
    filtered.forEach(combo => {
      listMount.appendChild(renderComboCard(combo, navigateCallback));
    });
  };

  // Draw top lab masters
  const drawTopLabMasters = () => {
    const mastersMount = document.getElementById('top-lab-masters-mount');
    if (!mastersMount) return;

    const combosList = store.getCombos();
    const usersList = store.getUsers();

    const comboCounts = {};
    combosList.forEach(c => {
      if (c.userId) {
        comboCounts[c.userId] = (comboCounts[c.userId] || 0) + 1;
      }
    });

    const rankedUsers = usersList
      .map(u => ({
        ...u,
        comboCount: comboCounts[u.id] || 0
      }))
      .sort((a, b) => b.comboCount - a.comboCount || a.username.localeCompare(b.username))
      .slice(0, 3);

    mastersMount.innerHTML = '';
    
    if (rankedUsers.length === 0) {
      mastersMount.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; margin: 0;">No active users found.</p>`;
      return;
    }

    rankedUsers.forEach((user, index) => {
      const row = document.createElement('div');
      row.className = 'flex justify-between items-center';
      row.style.fontSize = '0.85rem';
      
      row.innerHTML = `
        <span class="master-link" style="font-weight: 700; color: var(--color-secondary); cursor: pointer; text-decoration: underline;">
          ${index + 1}. ${user.username}
        </span>
        <span style="color: var(--text-muted);">${user.comboCount} combo${user.comboCount === 1 ? '' : 's'}</span>
      `;

      row.querySelector('.master-link').addEventListener('click', () => {
        navigateCallback('profile', { userId: user.id });
      });

      mastersMount.appendChild(row);
    });
  };

  drawList();
  drawTopLabMasters();

  // Attach Dojo Tab listeners
  const tabAll = document.getElementById('dojo-tab-all');
  const tabFollowing = document.getElementById('dojo-tab-following');
  
  tabAll.addEventListener('click', () => {
    tabAll.classList.add('active');
    tabFollowing.classList.remove('active');
    activeDojoTab = 'all';
    drawList();
  });
  
  tabFollowing.addEventListener('click', () => {
    tabFollowing.classList.add('active');
    tabAll.classList.remove('active');
    activeDojoTab = 'following';
    drawList();
  });

  // Attach filter event handlers
  const searchInput = document.getElementById('dojo-search-char');
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    drawList();
  });

  const gameFilter = document.getElementById('dojo-game-filter');
  gameFilter.addEventListener('change', (e) => {
    activeGame = e.target.value;
    drawList();
  });

  const difficultyFilter = document.getElementById('dojo-difficulty-filter');
  difficultyFilter.addEventListener('change', (e) => {
    activeDifficulty = e.target.value;
    drawList();
  });

  // Attach Create button click
  document.getElementById('dojo-create-combo-btn').addEventListener('click', () => {
    if (!currentUser) {
      window.openAuthModal('login', navigateCallback);
    } else {
      navigateCallback('builder');
    }
  });
}
