import { renderCharacterCard } from './character-card.js';
import store from '../store.js';

export function renderStrategyHub(navigate, initialGameFilter = 'ggst') {
  const mount = document.getElementById('strategy-hub-mount');
  if (!mount) return;

  const games = store.getGames();
  
  // Set up the internal search, filter, and pagination state
  let searchFilter = '';
  let activeGameFilter = initialGameFilter;
  let currentPage = 1;
  const itemsPerPage = 16;

  function draw() {
    // 1. Gather all matching characters
    const allMatching = [];
    Object.values(games).forEach(game => {
      if (activeGameFilter !== 'all' && activeGameFilter !== game.id) return;
      const matching = (game.characters || []).filter(char => 
        char.toLowerCase().includes(searchFilter.toLowerCase())
      );
      matching.forEach(char => {
        allMatching.push({ gameId: game.id, charName: char });
      });
    });

    const totalItems = allMatching.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const pageItems = allMatching.slice(startIndex, endIndex);

    // Group current page items by gameId
    const itemsByGame = {};
    pageItems.forEach(item => {
      if (!itemsByGame[item.gameId]) {
        itemsByGame[item.gameId] = [];
      }
      itemsByGame[item.gameId].push(item.charName);
    });

    mount.innerHTML = `
      <!-- Filters and Search Bar Container -->
      <div class="hub-controls flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div class="search-wrapper w-full md:w-72 relative">
          <i class="fa-solid fa-magnifying-glass search-icon absolute left-3 top-1/2 transform -translate-y-1/2 text-muted"></i>
          <input type="text" id="hub-search" class="form-input pl-10 w-full" placeholder="Search characters..." value="${searchFilter}" />
        </div>
      </div>

      <!-- Relative container for loader overlay and sections wrapper -->
      <div style="position: relative; min-height: 250px; width: 100%;">
        <!-- Loading Overlay -->
        <div id="hub-loading-overlay" class="hub-loading-overlay">
          <div class="loader-content">
            <div class="spinner"></div>
            <div class="loading-progress-container">
              <div class="loading-progress-bar">
                <div id="hub-progress-fill" class="loading-progress-fill"></div>
              </div>
              <div id="hub-progress-text" class="loading-progress-text">Loading portraits...</div>
            </div>
          </div>
        </div>

        <div id="hub-sections-wrapper" class="hub-sections-wrapper loading">
          <!-- Game Sections List -->
          <div class="hub-sections-container flex flex-col gap-8">
            ${Object.values(games).map(game => {
              const sectionChars = itemsByGame[game.id] || [];
              if (sectionChars.length === 0) return '';

              const KNOWN_LOGOS = ['ggst', 'sf6', 'ssbu', 't8'];
              const logoHtml = KNOWN_LOGOS.includes(game.id)
                ? `<img src="src/images/logo_${game.id}.png" alt="${game.name} Logo" class="game-header-logo" onerror="this.style.display='none';" />`
                : `<i class="fa-solid fa-gamepad game-header-logo text-muted" style="font-size: 24px; width: 28px; text-align: center;"></i>`;

              return `
                <div class="game-section mb-6" id="section-${game.id}">
                  <div class="game-section-header flex items-center gap-3 mb-4 border-b border-color pb-2">
                    ${logoHtml}
                    <h3 class="gradient-text game-section-title m-0">${game.name}</h3>
                    <span class="character-countbadge badge badge-sm ml-auto">${sectionChars.length} characters</span>
                  </div>
                  <div class="character-grid" id="grid-${game.id}">
                    <!-- Character cards injected here -->
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Empty State -->
          <div id="hub-empty-state" class="text-center p-8 hidden">
            <i class="fa-solid fa-gamepad text-muted text-4xl mb-3"></i>
            <p class="text-muted font-md">No characters match your search filter.</p>
          </div>
        </div>
      </div>

      <!-- Pagination Controls -->
      <div class="hub-pagination flex justify-center items-center gap-4 mt-8 ${totalPages <= 1 ? 'hidden' : ''}">
        <button class="btn btn-sm btn-primary" id="btn-prev-page" ${currentPage === 1 ? 'disabled' : ''}>
          <i class="fa-solid fa-chevron-left mr-1"></i> Prev
        </button>
        <span class="text-muted font-mono text-sm" id="page-indicator">
          Page ${currentPage} of ${totalPages}
        </span>
        <button class="btn btn-sm btn-primary" id="btn-next-page" ${currentPage === totalPages ? 'disabled' : ''}>
          Next <i class="fa-solid fa-chevron-right ml-1"></i>
        </button>
      </div>
    `;

    // Inject character cards into the grids
    let totalVisible = 0;
    Object.values(games).forEach(game => {
      const grid = document.getElementById(`grid-${game.id}`);
      if (!grid) return;

      const sectionChars = itemsByGame[game.id] || [];
      sectionChars.forEach(char => {
        totalVisible++;
        const card = renderCharacterCard({
          gameId: game.id,
          charName: char,
          navigate
        });
        grid.appendChild(card);
      });
    });

    // Toggle empty state if no characters match
    const emptyState = document.getElementById('hub-empty-state');
    if (emptyState) {
      if (totalVisible === 0) {
        emptyState.classList.remove('hidden');
      } else {
        emptyState.classList.add('hidden');
      }
    }

    // Attach search event listener
    const searchInput = document.getElementById('hub-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchFilter = e.target.value;
        currentPage = 1; // Reset to page 1 on search filter change
        draw();
      });
      // Focus on input end when rendering
      searchInput.focus();
      const val = searchInput.value;
      searchInput.value = '';
      searchInput.value = val;
    }

    // Attach pagination button listeners
    const prevBtn = document.getElementById('btn-prev-page');
    const nextBtn = document.getElementById('btn-next-page');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          window.scrollTo(0, 0);
          draw();
        }
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
          currentPage++;
          window.scrollTo(0, 0);
          draw();
        }
      });
    }

    // Monitor portrait image loading to hide the overlay when ready
    const portraits = mount.querySelectorAll('.character-card .portrait');
    let loadedCount = 0;
    const totalImages = portraits.length;

    function hideLoader() {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      const overlay = document.getElementById('hub-loading-overlay');
      const wrapper = document.getElementById('hub-sections-wrapper');
      if (overlay && wrapper) {
        overlay.classList.add('fade-out');
        wrapper.classList.remove('loading');
        setTimeout(() => {
          overlay.classList.add('hidden');
        }, 300);
      }
    }

    function updateProgressBar() {
      const fill = document.getElementById('hub-progress-fill');
      const text = document.getElementById('hub-progress-text');
      if (totalImages > 0) {
        const percentage = Math.round((loadedCount / totalImages) * 100);
        if (fill) fill.style.width = `${percentage}%`;
        if (text) text.textContent = `Loading portraits: ${loadedCount} / ${totalImages} (${percentage}%)`;
      } else {
        if (fill) fill.style.width = '100%';
        if (text) text.textContent = 'Loading portraits: 100%';
      }
    }

    function checkImagesLoaded() {
      updateProgressBar();
      if (loadedCount >= totalImages) {
        hideLoader();
      }
    }

    let timeoutId = setTimeout(() => {
      hideLoader();
    }, 15000); // 15-second safety timeout fallback

    if (totalImages === 0) {
      updateProgressBar();
      hideLoader();
    } else {
      portraits.forEach(img => {
        if (img.complete) {
          loadedCount++;
        } else {
          img.addEventListener('load', () => {
            loadedCount++;
            checkImagesLoaded();
          });
          img.addEventListener('error', () => {
            loadedCount++;
            checkImagesLoaded();
          });
        }
      });
      updateProgressBar();
      checkImagesLoaded();
    }
  }

  // Initial draw
  draw();

  return {
    setGameFilter(gameId) {
      activeGameFilter = gameId;
      currentPage = 1; // Reset to page 1 on game selection change
      draw();
    }
  };
}
