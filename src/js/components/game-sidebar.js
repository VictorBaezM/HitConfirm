/* Left Game Sidebar Component — game-sidebar.js */
import store from '../store.js';

/**
 * Renders the persistent left game-filter sidebar into #game-sidebar-mount.
 * Shows game list and difficulty filters. Calls onGameChange / onDifficultyChange
 * callbacks when the user makes a selection.
 *
 * @param {Object}   options
 * @param {string}   options.activeGame         - Currently selected game id ('all' | 'sf6' | 't8' | etc.)
 * @param {string[]} options.activeDifficulties - Array of currently checked difficulty strings
 * @param {function} options.onGameChange       - Callback(gameId: string) when a game is clicked
 * @param {function} options.onDifficultyChange - Callback(difficulties: string[]) when checkboxes change
 */
export function renderGameSidebar({ activeGame = 'all', activeDifficulties = [], onGameChange, onDifficultyChange } = {}) {
  const mount = document.getElementById('game-sidebar-mount');
  if (!mount) return;

  const games = store.getGames(); // { sf6: {id, name}, t8: {id, name}, ... }
  const difficulties = ['Beginner', 'Intermediate', 'Advanced'];

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

  // Build difficulty filter HTML
  const difficultyHtml = difficulties.map(d => {
    const checked = activeDifficulties.includes(d) ? 'checked' : '';
    const id = `diff-check-${d.toLowerCase()}`;
    return `
      <label class="sidebar-filter-item" for="${id}">
        <input type="checkbox" id="${id}" data-difficulty="${d}" ${checked}>
        ${d}
      </label>
    `;
  }).join('');

  mount.innerHTML = `
    <div class="sidebar-section">
      <div class="sidebar-section-label">Games</div>
      ${gameItemsHtml}
    </div>
    <div class="sidebar-divider"></div>
    <div class="sidebar-section">
      <div class="sidebar-section-label">Difficulty</div>
      ${difficultyHtml}
    </div>
  `;

  // Attach game selection events
  mount.querySelectorAll('.sidebar-game-item').forEach(item => {
    item.addEventListener('click', () => {
      const gameId = item.getAttribute('data-game');
      if (onGameChange) onGameChange(gameId);
    });
  });

  // Attach difficulty checkbox events
  mount.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const selected = [...mount.querySelectorAll('input[type="checkbox"]:checked')]
        .map(el => el.getAttribute('data-difficulty'));
      if (onDifficultyChange) onDifficultyChange(selected);
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
