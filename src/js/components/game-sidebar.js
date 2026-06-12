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
    <div class="wiki-console-tab ${activeGame === 'all' ? 'active' : ''}" data-game="all" id="sidebar-game-all" title="All Databases">
      <i class="fa-solid fa-database database-logo-icon"></i>
    </div>
  `;

  const KNOWN_LOGOS = ['ggst', 'sf6', 'ssbu', 't8'];

  Object.values(games).forEach(function (game) {
    const isActive = activeGame === game.id ? 'active' : '';
    const logoHtml = KNOWN_LOGOS.includes(game.id)
      ? `<img src="src/images/logo_${game.id}.png" alt="${game.name}" class="game-logo-image" />`
      : `<div class="game-logo-text">${game.name}</div>`;

    gameItemsHtml += `
      <div class="wiki-console-tab ${isActive}" data-game="${game.id}" id="sidebar-game-${game.id}" title="${game.name}">
        ${logoHtml}
      </div>
    `;
  });

  mount.innerHTML = `
    <div class="wiki-console">
      <div class="wiki-console-title">GAME SELECTOR</div>
      <div class="wiki-console-tabs-grid">
        ${gameItemsHtml}
      </div>
    </div>
  `;

  // Attach game selection events
  mount.querySelectorAll('.wiki-console-tab').forEach(function (item) {
    item.addEventListener('click', function () {
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
