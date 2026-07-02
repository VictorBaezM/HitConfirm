import { hideGameSidebar } from '../components/game-sidebar.js';

/**
 * Renders the custom FGC-themed "404 - ROUND LOST" fallback screen.
 * @param {function} navigateCallback - SPA router callback.
 */
export function render404Page(navigateCallback) {
  const mount = document.getElementById('content-mount');
  if (!mount) return;

  hideGameSidebar();
  mount.className = 'has-right-sidebar';

  mount.innerHTML = `
    <div class="card p-8 flex flex-col items-center justify-center text-center gap-6" style="grid-column: span 3; min-height: 400px; margin-top: 2rem;">
      <span class="material-symbols-rounded text-danger" style="font-size: 80px;">error</span>
      <h1 class="gradient-text" style="font-size: 3rem; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: 2px;">
        Round Lost
      </h1>
      <h2 style="font-size: 1.5rem; margin: 0; font-weight: 500; color: var(--color-text-muted);">
        404 - Page Not Found
      </h2>
      <p style="max-width: 400px; color: var(--color-text-muted); line-height: 1.6; margin: 0;">
        The combo you are searching for does not exist in the database, or the strategy guide has been removed. Check the input and try again!
      </p>
      <button class="btn btn-primary px-6 py-3 mt-4 flex items-center gap-2" id="btn-404-home">
        <span class="material-symbols-rounded">home</span>
        Back to Feed
      </button>
    </div>
  `;

  const btn = document.getElementById('btn-404-home');
  if (btn) {
    btn.addEventListener('click', function () {
      navigateCallback('feed');
    });
  }
}
