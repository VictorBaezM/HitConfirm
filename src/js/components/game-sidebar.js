/* Left Game Sidebar Component — game-sidebar.js */
import store from '../store.js';

/**
 * Renders the persistent left game-filter sidebar into #game-sidebar-mount.
 * Shows game list and calls onGameChange callback when a game is selected.
 *
 * @param {Object}   options
 * @param {string}   options.activeGame         - Currently selected game id ('all' | 'sf6' | 't8' | etc.)
 * @param {function} options.onGameChange       - Callback(gameId: string) when a game is clicked
 */
export function renderGameSidebar({ activeGame = 'all', onGameChange } = {}) {
  const mount = document.getElementById('game-sidebar-mount');
  if (!mount) return;

  const games = store.getGames(); // { sf6: {id, name}, t8: {id, name}, ... }

  // Build game list HTML
  let gameItemsHtml = `
    <div class="sidebar-game-item ${activeGame === 'all' ? 'active' : ''}" data-game="all" id="sidebar-game-all">
      <span class="sidebar-game-dot dot-all"></span>
      All Games
    </div>
  `;

  Object.values(games).forEach(game => {
    const isActive = activeGame === game.id ? 'active' : '';
    gameItemsHtml += `
      <div class="sidebar-game-item ${isActive}" data-game="${game.id}" id="sidebar-game-${game.id}">
        <span class="sidebar-game-dot dot-${game.id}"></span>
        ${game.name}
      </div>
    `;
  });

  mount.innerHTML = `
    <div class="sidebar-section">
      <div class="sidebar-section-label">Games</div>
      ${gameItemsHtml}
    </div>
  `;

  // Attach game selection events
  mount.querySelectorAll('.sidebar-game-item').forEach(item => {
    item.addEventListener('click', () => {
      const gameId = item.getAttribute('data-game');
      if (onGameChange) onGameChange(gameId);
    });
  });
}

/**
 * Makes the game sidebar visible.
 * Call this at the start of renderFeedPage() and renderCombosPage().
 */
export function showGameSidebar() {
  const mount = document.getElementById('game-sidebar-mount');
  if (mount) mount.style.display = 'block';
}

/**
 * Hides the game sidebar.
 * Call this at the start of renderBuilderPage(), renderStrategyPage(), renderProfilePage().
 */
export function hideGameSidebar() {
  const mount = document.getElementById('game-sidebar-mount');
  if (mount) mount.style.display = 'none';
}
