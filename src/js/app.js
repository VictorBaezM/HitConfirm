/* Main Application Router & Entry Point */
import store from './store.js';
import { renderNavbar } from './components/navbar.js';
import { renderFeedPage } from './pages/feed.js';
import { renderCombosPage } from './pages/combos.js';
import { renderBuilderPage } from './pages/builder.js';
import { renderProfilePage } from './pages/profile.js';
import { openAuthModal } from './pages/auth.js';
import { renderCharacterPage } from './pages/character.js';
import { renderHubPage } from './pages/hub.js';

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
    <div class="spinner-container grid-col-span-3">
      <div class="spinner"></div>
    </div>
  `;

  // Short timeout to create smooth transition feel
  setTimeout(async function () {
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
        case 'profile':
          renderProfilePage(navigate, pageOptions);
          break;
        case 'character':
          renderCharacterPage(navigate, pageOptions);
          break;
        case 'hub':
          renderHubPage(navigate);
          break;
        default:
          renderFeedPage(navigate);
      }
    } catch (err) {
      console.error('Routing Error:', err);
      contentMount.innerHTML = `
        <div class="card grid-col-span-3 text-center border-danger">
          <h3 class="text-danger">Navigation Failed</h3>
          <p class="font-md text-secondary mt-1">${err.message}</p>
          <button class="btn btn-primary btn-sm mt-4" id="btn-recovery-home">Go to Feed</button>
        </div>
      `;
      document.getElementById('btn-recovery-home')?.addEventListener('click', function () {
        navigate('feed');
      });
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

  toast.innerHTML = `<span class="material-symbols-rounded text-secondary mr-2" style="font-size: 1.1rem; vertical-align: middle;">notifications</span> ${message}`;
  toast.style.transform = 'translateY(0)';
  
  setTimeout(function () {
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
  closeBtn.addEventListener('click', function () {
    container.classList.remove('open');
  });

  // Hide modal on click outside modal content card
  container.addEventListener('click', function (e) {
    if (e.target === container) {
      container.classList.remove('open');
    }
  });

  // Share globally so auth can use it
  window.openAuthModal = function (type, navCallback) {
    openAuthModal(type, navCallback);
  };
}

// Bootstrap Application
document.addEventListener('DOMContentLoaded', function () {
  setupGlobalModals();

  // Bind footer navigation links
  document.querySelectorAll('.footer-nav-link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const page = link.getAttribute('data-page');
      navigate(page);
    });
  });

  navigate('feed');
});
