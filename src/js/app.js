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
import { render404Page } from './pages/404.js';
import { slugifyCharacterName } from './utils/slugifier.js';

// Global application state
let currentPage = 'feed';
let pageOptions = {};

function getUrlForPage(pageId, options = {}) {
  switch (pageId) {
    case 'feed':
      return '/feed';
    case 'combos':
      return options.game ? `/dojo?game=${options.game}` : '/dojo';
    case 'builder':
      return '/builder';
    case 'hub':
      return '/hub';
    case 'profile':
      return options.userId ? `/profile/${options.userId}` : '/profile';
    case 'character':
      return `/character/${options.gameId}/${slugifyCharacterName(options.charName)}`;
    case '404':
      return options.path || '/404';
    default:
      return '/feed';
  }
}

function getPageForUrlFromPath(path, search) {
  const searchParams = new URLSearchParams(search);
  
  if (path === '/' || path === '' || path === '/index.html' || path === '/feed') {
    return { pageId: 'feed', options: {} };
  }
  
  if (path.startsWith('/feed')) {
    return { pageId: 'feed', options: {} };
  }
  
  if (path.startsWith('/dojo') || path.startsWith('/combos')) {
    const game = searchParams.get('game') || searchParams.get('gameId');
    return { pageId: 'combos', options: game ? { game } : {} };
  }
  
  if (path.startsWith('/builder')) {
    return { pageId: 'builder', options: {} };
  }
  
  if (path.startsWith('/hub')) {
    return { pageId: 'hub', options: {} };
  }
  
  if (path.startsWith('/profile')) {
    const parts = path.split('/').filter(Boolean);
    const userId = parts[1]; // /profile/:userId
    return { pageId: 'profile', options: userId ? { userId } : {} };
  }
  
  if (path.startsWith('/character')) {
    const parts = path.split('/').filter(Boolean);
    const gameId = parts[1];
    const charName = parts[2] ? decodeURIComponent(parts[2]) : '';
    if (!gameId || !charName) {
      return { pageId: '404', options: { path } };
    }
    return { pageId: 'character', options: { gameId, charName } };
  }
  
  return { pageId: '404', options: { path } };
}

function getPageForUrl() {
  return getPageForUrlFromPath(window.location.pathname, window.location.search);
}

/**
 * Handles Single Page Application routing by dynamically rendering components.
 * @param {string} pageId - The ID of the page/view to display (e.g., 'feed', 'combos', 'builder').
 * @param {Object} [options={}] - Optional context parameters passed to the page view.
 * @param {boolean} [pushState=true] - Whether to push the new URL to the browser history.
 */
export function navigate(pageId, options = {}, pushState = true) {
  currentPage = pageId;
  pageOptions = options;

  if (pushState) {
    const newUrl = getUrlForPage(pageId, options);
    window.history.pushState(null, '', newUrl);
  }
  
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
      // 1. Run lightweight global initialization check
      if (store.loadAllData) {
        await store.loadAllData();
      }

      // 2. Run page-specific lazy data loading
      if (currentPage === 'feed') {
        if (store.fetchFeedData) {
          await store.fetchFeedData();
        }
      } else if (currentPage === 'combos') {
        if (store.fetchCombosData) {
          await store.fetchCombosData(pageOptions.game);
        }
      } else if (currentPage === 'profile') {
        const targetId = pageOptions.userId || (store.getCurrentUser() ? store.getCurrentUser().id : null);
        if (targetId && store.fetchProfileData) {
          await store.fetchProfileData(targetId);
        }
      } else if (currentPage === 'character') {
        if (pageOptions.gameId && pageOptions.charName && store.fetchCharacterData) {
          await store.fetchCharacterData(pageOptions.gameId, pageOptions.charName);
        }
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
        case '404':
          render404Page(navigate);
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

// Handle browser back/forward buttons
window.addEventListener('popstate', function () {
  const route = getPageForUrl();
  navigate(route.pageId, route.options, false);
});

// Intercept clicks on links for soft routing
document.addEventListener('click', function (e) {
  const anchor = e.target.closest('a');
  if (anchor && anchor.href && anchor.host === window.location.host && !anchor.target) {
    const url = new URL(anchor.href);
    const path = url.pathname;
    
    // Check if the path maps to one of our routes
    const isAppRoute = ['/feed', '/dojo', '/combos', '/builder', '/hub', '/profile', '/character'].some(function (r) {
      return path.startsWith(r);
    }) || path === '/';
    
    if (isAppRoute) {
      e.preventDefault();
      const route = getPageForUrlFromPath(path, url.search);
      navigate(route.pageId, route.options);
    }
  }
});

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

  const route = getPageForUrl();
  navigate(route.pageId, route.options, false);
});
