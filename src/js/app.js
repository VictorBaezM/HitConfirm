/* Main Application Router & Entry Point */
import store from './store.js';
import { renderNavbar } from './components/navbar.js';
import { renderFeedPage } from './pages/feed.js';
import { renderCombosPage } from './pages/combos.js';
import { renderBuilderPage } from './pages/builder.js';
import { renderStrategyPage } from './pages/strategy.js';
import { renderProfilePage } from './pages/profile.js';
import { openAuthModal } from './pages/auth.js';

// Global application state
let currentPage = 'feed';
let pageOptions = {};

/**
 * Handles Single Page Application routing by dynamically rendering components.
 * @param {string} pageId - The ID of the page/view to display (e.g., 'feed', 'combos', 'builder').
 * @param {Object} [options={}] - Optional context parameters passed to the page view.
 */
export function navigate(pageId, options = {}) {
  currentPage = pageId;
  pageOptions = options;
  
  // 1. Render navbar
  renderNavbar(currentPage, navigate);
  
  // Scroll page to top
  window.scrollTo(0, 0);

  // 2. Render target page
  const contentMount = document.getElementById('content-mount');
  if (!contentMount) return;

  // Clear previous HTML and display loading state
  contentMount.innerHTML = `
    <div class="spinner-container" style="grid-column: span 3;">
      <div class="spinner"></div>
    </div>
  `;

  // Short timeout to create smooth transition feel
  setTimeout(async () => {
    try {
      // Pre-fetch all data from Supabase to fill store memory cache
      if (store.loadAllData) {
        await store.loadAllData();
      }

      switch (currentPage) {
        case 'feed':
          renderFeedPage(navigate);
          break;
        case 'combos':
          renderCombosPage(navigate, pageOptions);
          break;
        case 'builder':
          renderBuilderPage(navigate);
          break;
        case 'strategy':
          renderStrategyPage(navigate);
          break;
        case 'profile':
          renderProfilePage(navigate, pageOptions);
          break;
        default:
          renderFeedPage(navigate);
      }
    } catch (err) {
      console.error('Routing Error:', err);
      contentMount.innerHTML = `
        <div class="card" style="grid-column: span 3; text-align: center; border-color: var(--color-danger);">
          <h3 style="color: var(--color-danger);">Navigation Failed</h3>
          <p style="font-size:0.9rem; color: var(--text-secondary); margin-top:4px;">${err.message}</p>
          <button class="btn btn-primary btn-sm" id="btn-recovery-home" style="margin-top:16px;">Go to Feed</button>
        </div>
      `;
      document.getElementById('btn-recovery-home')?.addEventListener('click', () => navigate('feed'));
    }
  }, 150);
}

/**
 * Displays a global sliding toast notification at the bottom right.
 * @param {string} message - Text notification description content.
 * @param {number} [duration=3000] - Lifespan duration in milliseconds before hiding.
 */
window.showToast = function(message, duration = 3000) {
  const toast = document.getElementById('toast-notification');
  if (!toast) return;

  toast.innerHTML = `<i class="fa-solid fa-bell" style="color: var(--color-secondary); margin-right: 8px;"></i> ${message}`;
  toast.style.transform = 'translateY(0)';
  
  setTimeout(() => {
    toast.style.transform = 'translateY(150px)';
  }, duration);
};

/**
 * Configures the global modal overlays and attaches close handlers.
 */
function setupGlobalModals() {
  const container = document.getElementById('modal-container');
  const closeBtn = document.getElementById('modal-close');
  
  if (!container || !closeBtn) return;

  // Hide modal on close button click
  closeBtn.addEventListener('click', () => {
    container.classList.remove('open');
  });

  // Hide modal on click outside modal content card
  container.addEventListener('click', (e) => {
    if (e.target === container) {
      container.classList.remove('open');
    }
  });

  // Share globally so auth can use it
  window.openAuthModal = (type, navCallback) => {
    openAuthModal(type, navCallback);
  };
}

// Bootstrap Application
document.addEventListener('DOMContentLoaded', () => {
  setupGlobalModals();
  navigate('feed');
});
