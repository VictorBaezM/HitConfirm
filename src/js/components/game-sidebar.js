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
const GAME_LOGOS = {
  all: `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="game-logo-svg">
      <path d="M12 18C12 12.48 20.95 8 32 8S52 12.48 52 18S43.05 28 32 28S12 23.52 12 18Z" fill="url(#all-grad)" stroke="#00cbd6" stroke-width="2"/>
      <path d="M12 18V28C12 33.52 20.95 38 32 38S52 33.52 52 28V18" stroke="#00cbd6" stroke-width="2" stroke-linecap="round"/>
      <path d="M12 28V38C12 43.52 20.95 48 32 48S52 43.52 52 38V28" stroke="#00cbd6" stroke-width="2" stroke-linecap="round"/>
      <defs>
        <linearGradient id="all-grad" x1="12" y1="8" x2="52" y2="28" gradientUnits="userSpaceOnUse">
          <stop stop-color="#00cbd6" stop-opacity="0.2"/>
          <stop offset="1" stop-color="#00cbd6" stop-opacity="0.6"/>
        </linearGradient>
      </defs>
    </svg>
  `,
  sf6: `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="game-logo-svg">
      <path d="M32 6L54 18V46L32 58L10 46V18L32 6Z" fill="url(#sf6-grad)" stroke="#ff6b00" stroke-width="3"/>
      <path d="M22 22 L29 42 H32 L25 22 Z" fill="#ffffff"/>
      <path d="M37 22 L30 42 H33 L40 22 Z" fill="#ffffff"/>
      <path d="M43 22 H47 V42 H43 Z" fill="#ffffff"/>
      <defs>
        <linearGradient id="sf6-grad" x1="10" y1="6" x2="54" y2="58" gradientUnits="userSpaceOnUse">
          <stop stop-color="#ff6b00" stop-opacity="0.1"/>
          <stop offset="1" stop-color="#ff6b00" stop-opacity="0.4"/>
        </linearGradient>
      </defs>
    </svg>
  `,
  t8: `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="game-logo-svg">
      <path d="M12 18 H38 L36 24 H28 L22 46 H15 L21 24 H12 Z" fill="#ffffff" stroke="#94a3b8" stroke-width="1"/>
      <path d="M35 18 H49 L47 31 H33 Z" fill="#ef4444"/>
      <path d="M32 33 H46 L44 46 H30 Z" fill="#ef4444"/>
      <path d="M37 22 H45 L44.5 27 H36.5 Z" fill="#1a1a1f"/>
      <path d="M34 37 H42 L41.5 42 H33.5 Z" fill="#1a1a1f"/>
    </svg>
  `,
  ggst: `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="game-logo-svg">
      <path d="M32 8 L35 12 A18 18 0 0 1 42 15 L47 13 L49 17 L45 20 A18 18 0 0 1 47 27 L52 28 L52 32 L47 33 A18 18 0 0 1 45 40 L49 43 L47 47 L42 45 A18 18 0 0 1 35 48 L32 52 L28 48 A18 18 0 0 1 21 45 L17 47 L15 43 L19 40 A18 18 0 0 1 17 33 L12 32 L12 28 L17 27 A18 18 0 0 1 19 20 L15 17 L17 13 L22 15 A18 18 0 0 1 29 12 Z" fill="#334155" stroke="#64748b" stroke-width="2"/>
      <circle cx="32" cy="32" r="15" fill="#1a1a1f"/>
      <path d="M22 22H14V42H22V34H18V30H26V42H14C12 42 11 41 11 39V25C11 23 12 22 14 22H22V25Z" fill="#ffffff"/>
      <path d="M40 22H32V42H40V34H37V30H44V42H32C30 42 29 41 29 39V25C29 23 30 22 32 22H40V25Z" fill="#ffffff"/>
      <path d="M48 14 L16 50" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>
    </svg>
  `,
  ssbu: `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="game-logo-svg">
      <mask id="smash-mask">
        <rect width="64" height="64" fill="white"/>
        <rect x="20" y="6" width="6" height="52" fill="black"/>
        <rect x="6" y="38" width="52" height="3" fill="black"/>
      </mask>
      <circle cx="32" cy="32" r="22" fill="url(#ssbu-grad)" mask="url(#smash-mask)"/>
      <defs>
        <linearGradient id="ssbu-grad" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
          <stop stop-color="#ff4500"/>
          <stop offset="0.5" stop-color="#ff8c00"/>
          <stop offset="1" stop-color="#ff2200"/>
        </linearGradient>
      </defs>
    </svg>
  `
};

export function renderGameSidebar({ activeGame = 'all', onGameChange } = {}) {
  const mount = document.getElementById('game-sidebar-mount');
  if (!mount) return;

  const games = store.getGames(); // { sf6: {id, name}, t8: {id, name}, ... }

  // Build game list HTML
  let gameItemsHtml = `
    <div class="wiki-console-tab ${activeGame === 'all' ? 'active' : ''}" data-game="all" id="sidebar-game-all" title="All Databases">
      ${GAME_LOGOS.all}
    </div>
  `;

  Object.values(games).forEach(function (game) {
    const isActive = activeGame === game.id ? 'active' : '';
    gameItemsHtml += `
      <div class="wiki-console-tab ${isActive}" data-game="${game.id}" id="sidebar-game-${game.id}" title="${game.name}">
        ${GAME_LOGOS[game.id] || ''}
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
