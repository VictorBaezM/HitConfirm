// src/js/pages/hub.js
/**
 * Renders the Strategy Hub page, showing a grid of character cards.
 * @param {function} navigateCallback - SPA router navigation function.
 */
import { renderStrategyHub } from '../components/strategy-hub.js';
import { hideGameSidebar } from '../components/game-sidebar.js';

export function renderHubPage(navigateCallback) {
  const mount = document.getElementById('content-mount');
  if (!mount) return;

  hideGameSidebar();
  mount.className = 'has-right-sidebar';

  // Simple layout: header + hub container + licensing footer
  mount.innerHTML = `
    <div class="hub-page">
      <h1 class="gradient-text hub-title">Strategy Hub</h1>
      <p class="hub-description">Select a character to view detailed frame data and strategy information.</p>
      <div id="strategy-hub-mount" class="strategy-hub"></div>
      <div class="license-footer p-4 text-sm text-center mt-6">
        <a href="LICENSES.txt" target="_blank" class="text-muted hover:underline">Image Credits & Licenses</a>
      </div>
    </div>
  `;

  // Render the grid of character cards
  renderStrategyHub(navigateCallback);
}
