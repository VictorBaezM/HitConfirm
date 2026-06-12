import { renderCharacterCard } from './character-card.js';
import store from '../store.js';

export function renderStrategyHub(navigate) {
  const mount = document.getElementById('strategy-hub-mount');
  if (!mount) return;

  const games = store.getGames();
  
  // Set up the internal search and filter state
  let searchFilter = '';
  let activeGameFilter = 'ggst';

  function draw() {
    mount.innerHTML = `
      <!-- Filters and Search Bar Container -->
      <div class="hub-controls flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div class="search-wrapper w-full md:w-72 relative">
          <i class="fa-solid fa-magnifying-glass search-icon absolute left-3 top-1/2 transform -translate-y-1/2 text-muted"></i>
          <input type="text" id="hub-search" class="form-input pl-10 w-full" placeholder="Search characters..." value="${searchFilter}" />
        </div>
        
        <div class="game-filter-chips flex flex-wrap gap-2 justify-center">
          ${Object.values(games).map(g => `
            <button class="btn btn-sm btn-chip ${activeGameFilter === g.id ? 'active' : ''}" data-filter="${g.id}">
              ${g.name}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Relative container for loader overlay and sections wrapper -->
      <div style="position: relative; min-height: 250px; width: 100%;">
        <!-- Loading Overlay -->
        <div id="hub-loading-overlay" class="hub-loading-overlay">
          <div class="spinner"></div>
        </div>

        <div id="hub-sections-wrapper" class="hub-sections-wrapper loading">
          <!-- Game Sections List -->
          <div class="hub-sections-container flex flex-col gap-8">
            ${Object.values(games).map(game => {
              // Check if this game is filtered out by game chip
              if (activeGameFilter !== game.id) {
                return '';
              }

              // Filter characters by search text
              const matchingChars = (game.characters || []).filter(char => 
                char.toLowerCase().includes(searchFilter.toLowerCase())
              );

              // If no matching characters for this game, don't show the game section
              if (matchingChars.length === 0) {
                return '';
              }

              return `
                <div class="game-section mb-6" id="section-${game.id}">
                  <div class="game-section-header flex items-center gap-3 mb-4 border-b border-color pb-2">
                    <img src="/src/images/logo_${game.id}.png" alt="${game.name} Logo" class="game-header-logo" onerror="this.style.display='none';" />
                    <h3 class="gradient-text game-section-title m-0">${game.name}</h3>
                    <span class="character-countbadge badge badge-sm ml-auto">${matchingChars.length} characters</span>
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
    `;

    // Inject character cards into the grids
    let totalVisible = 0;
    Object.values(games).forEach(game => {
      const grid = document.getElementById(`grid-${game.id}`);
      if (!grid) return;

      const matchingChars = (game.characters || []).filter(char => 
        char.toLowerCase().includes(searchFilter.toLowerCase())
      );

      matchingChars.forEach(char => {
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
        // Re-draw grids based on search filter
        updateGridsOnly();
      });
      // Focus on input end when rendering
      searchInput.focus();
      const val = searchInput.value;
      searchInput.value = '';
      searchInput.value = val;
    }

    // Attach chip event listeners
    const chips = mount.querySelectorAll('.game-filter-chips .btn-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        activeGameFilter = chip.getAttribute('data-filter');
        draw();
      });
    });

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

    function checkImagesLoaded() {
      if (loadedCount >= totalImages) {
        hideLoader();
      }
    }

    let timeoutId = setTimeout(() => {
      hideLoader();
    }, 600); // 600ms safety timeout fallback

    if (totalImages === 0) {
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
      checkImagesLoaded();
    }
  }

  // Optimize search: instead of full redraw (which resets scroll/focus), just update cards visibility and grids
  function updateGridsOnly() {
    let totalVisible = 0;
    Object.values(games).forEach(game => {
      const section = document.getElementById(`section-${game.id}`);
      const grid = document.getElementById(`grid-${game.id}`);
      if (!grid || !section) return;

      grid.innerHTML = '';
      
      const isGameVisible = activeGameFilter === game.id;
      const matchingChars = isGameVisible ? (game.characters || []).filter(char => 
        char.toLowerCase().includes(searchFilter.toLowerCase())
      ) : [];

      if (matchingChars.length === 0) {
        section.classList.add('hidden');
      } else {
        section.classList.remove('hidden');
        matchingChars.forEach(char => {
          totalVisible++;
          const card = renderCharacterCard({
            gameId: game.id,
            charName: char,
            navigate
          });
          grid.appendChild(card);
        });
      }
    });

    const emptyState = document.getElementById('hub-empty-state');
    if (emptyState) {
      if (totalVisible === 0) {
        emptyState.classList.remove('hidden');
      } else {
        emptyState.classList.add('hidden');
      }
    }
  }

  // Initial draw
  draw();
}

