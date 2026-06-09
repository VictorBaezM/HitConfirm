/* Player Profile/Dashboard Page Controller */
import store from '../store.js';
import { renderComboCard } from '../components/combo-card.js';
import { renderPostCard } from '../components/post-card.js';
import { escapeHtml } from '../utils/security.js';
import { hideGameSidebar } from '../components/game-sidebar.js';

/**
 * Renders the player dashboard profile page containing custom avatar highlights,
 * status details, personal published combos, saved training bookmarks, and posts history.
 * @param {function} navigateCallback - SPA router callback.
 * @param {Object} [options={}] - Route option parameters (e.g. { userId: '...' }).
 */
export function renderProfilePage(navigateCallback, options = {}) {
  const mount = document.getElementById('content-mount');
  if (!mount) return;

  // Dual column layout — hide game sidebar on profile page
  hideGameSidebar();
  mount.className = 'has-right-sidebar';

  const currentUser = store.getCurrentUser();
  const games = store.getGames();

  // Determine which user profile to render
  let targetUser = null;
  if (options.userId) {
    targetUser = store.getUsers().find(function (u) { return u.id === options.userId; });
  }

  const isPublicView = targetUser && (!currentUser || currentUser.id !== targetUser.id);
  const viewedUser = isPublicView ? targetUser : currentUser;

  // If no profile to display (logged out and trying to view own profile)
  if (!viewedUser) {
    mount.innerHTML = `
      <div class="profile-locker-wrapper">
        <div class="card profile-locker-card">
          <i class="fa-solid fa-lock profile-locker-icon"></i>
          <h2 class="profile-locker-title">Dojo Locker Room</h2>
          <p class="profile-locker-desc">
            Log in or sign up to personalize your Dojo, save optimal combos for training sessions, and join matchup discussions.
          </p>
          <div class="flex justify-center gap-3">
            <button class="btn btn-primary btn-sm btn-profile-signup">Register Account</button>
            <button class="btn btn-secondary btn-sm btn-profile-login">Sign In</button>
          </div>
        </div>
      </div>
    `;

    mount.querySelector('.btn-profile-signup').addEventListener('click', function () {
      window.openAuthModal('register', navigateCallback);
    });
    mount.querySelector('.btn-profile-login').addEventListener('click', function () {
      window.openAuthModal('login', navigateCallback);
    });
    return;
  }

  // Logged-in profile dashboard
  let activeTab = 'my-combos'; // my-combos, saved-combos, my-posts

  function countUserCombos(userId) {
    return store.getCombos().filter(function (c) { return c.userId === userId; }).length;
  }

  function drawTabList() {
    const listMount = document.getElementById('profile-submissions-list');
    if (!listMount) return;

    listMount.innerHTML = '';

    if (isPublicView || activeTab === 'my-combos') {
      const combos = store.getCombos().filter(function (c) { return c.userId === viewedUser.id; });
      if (combos.length === 0) {
        listMount.innerHTML = `
          <div class="card profile-empty-card">
            <p>${viewedUser.username} hasn't posted any combos yet.</p>
          </div>
        `;
        return;
      }
      combos.forEach(function (combo) {
        listMount.appendChild(renderComboCard(combo, navigateCallback));
      });
    } else if (activeTab === 'saved-combos') {
      const savedIds = viewedUser.savedCombos || [];
      const combos = store.getCombos().filter(function (c) { return savedIds.includes(c.id); });
      if (combos.length === 0) {
        listMount.innerHTML = `
          <div class="card profile-empty-card">
            <p>Your saved list is empty. Explore other player's combo cards and bookmark them!</p>
          </div>
        `;
        return;
      }
      combos.forEach(function (combo) {
        listMount.appendChild(renderComboCard(combo, navigateCallback));
      });
    } else if (activeTab === 'my-posts') {
      const posts = store.getPosts().filter(function (p) { return p.userId === viewedUser.id; });
      if (posts.length === 0) {
        listMount.innerHTML = `
          <div class="card profile-empty-card">
            <p>You haven't shared any timeline updates yet.</p>
          </div>
        `;
        return;
      }
      posts.forEach(function (post) {
        listMount.appendChild(renderPostCard(post, navigateCallback));
      });
    }
  }

  function drawDashboard() {
    const mainGameName = games[viewedUser.mainGame]?.name || viewedUser.mainGame;
    
    // Derive followers count
    const followersList = store.getUsers().filter(function (u) { return u.following && u.following.includes(viewedUser.id); });
    const followersCount = followersList.length;
    // Follow button if public view
    let followButtonHtml = '';
    if (isPublicView) {
      const isFollowing = currentUser && currentUser.following && currentUser.following.includes(viewedUser.id);
      const followText = isFollowing ? 'Following' : 'Follow';
      const followIcon = isFollowing ? 'fa-solid fa-user-check' : 'fa-solid fa-user-plus';
      const followBtnClass = isFollowing ? 'btn-secondary' : 'btn-primary';
      followButtonHtml = `
        <button class="btn ${followBtnClass} btn-sm w-full mt-3" id="btn-follow-user">
          <i class="${followIcon}"></i> ${followText}
        </button>
      `;
    }

    // Hide action tabs and edit pick buttons for public view
    const leftPaneHtml = isPublicView
      ? `
        <div class="tabs">
          <div class="tab active profile-tab-static">Published Combos</div>
        </div>
        <div id="profile-submissions-list"></div>
      `
      : `
        <div class="tabs">
          <div class="tab ${activeTab === 'my-combos' ? 'active' : ''}" data-tab="my-combos">My Combos</div>
          <div class="tab ${activeTab === 'saved-combos' ? 'active' : ''}" data-tab="saved-combos">Saved Combos</div>
          <div class="tab ${activeTab === 'my-posts' ? 'active' : ''}" data-tab="my-posts">My Posts</div>
        </div>
        <div id="profile-submissions-list"></div>
      `;

    const editButtonHtml = isPublicView
      ? ''
      : `
        <button class="btn btn-secondary btn-sm w-full mt-3" id="btn-edit-profile-mains">
          <i class="fa-solid fa-user-gear"></i> Edit Settings
        </button>
      `;

    const statsWidgetHtml = isPublicView
      ? `
        <div class="card profile-stats-card">
          <h3 class="profile-sidebar-heading">
            Dojo Achievement Status
          </h3>
          <div class="profile-stats-grid-1col">
            <div class="profile-stat-item">
              <div class="profile-stat-number color-primary">${countUserCombos(viewedUser.id)}</div>
              <div class="font-xs text-secondary">Created Combos</div>
            </div>
          </div>
        </div>
      `
      : `
        <div class="card profile-stats-card">
          <h3 class="profile-sidebar-heading">
            Dojo Achievement Status
          </h3>
          <div class="profile-stats-grid-2col">
            <div class="profile-stat-item">
              <div class="profile-stat-number color-primary">${countUserCombos(viewedUser.id)}</div>
              <div class="font-xs text-secondary">Created Combos</div>
            </div>
            <div class="profile-stat-item">
              <div class="profile-stat-number color-secondary">${viewedUser.savedCombos?.length || 0}</div>
              <div class="font-xs text-secondary">Saved Combos</div>
            </div>
          </div>
        </div>
      `;

    // Render other games played
    let playedGamesHtml = '';
    const playedGamesList = viewedUser.playedGames || [];
    const gameCharsMap = viewedUser.gameCharacters || {};
    
    if (playedGamesList.length > 0) {
      playedGamesHtml = `
        <div class="profile-games-section">
          <span class="profile-games-label">GAMES PLAYED:</span>
          <div class="flex flex-col gap-2">
            ${playedGamesList.map(function (gId) {
              const gameObj = games[gId];
              if (!gameObj) return '';
              const charsPlayed = gameCharsMap[gId] || [];
              const charsStr = charsPlayed.length > 0 ? charsPlayed.map(function (c) { return escapeHtml(c); }).join(', ') : 'No character mains';
              return `
                <div class="profile-game-item-card">
                  <div class="flex items-center justify-between mb-1">
                    <span class="badge badge-${gId} font-xs">${gameObj.name}</span>
                  </div>
                  <div class="profile-game-mains-text">Mains: <span class="profile-game-mains-val">${charsStr}</span></div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    mount.innerHTML = `
      <!-- User profile submissions (Left Pane) -->
      <div id="profile-left-pane">
        ${leftPaneHtml}
      </div>
 
      <!-- User Info & Lab Details Sidebar (Right Pane) -->
      <div id="profile-sidebar" class="flex flex-col gap-6">
        <!-- Card details -->
        <div class="card profile-info-card">
          <div class="avatar avatar-large profile-avatar-large-margin" style="border-color: ${viewedUser.avatarColor || '#00f0ff'};">
            ${viewedUser.username.substring(0, 2).toUpperCase()}
          </div>
          
          <h2 class="profile-username">${viewedUser.username}</h2>
          
          <div class="profile-meta-row">
            <span><strong>${countUserCombos(viewedUser.id)}</strong> Combos</span>
            <span>•</span>
            <span><strong>${followersCount}</strong> Followers</span>
          </div>

          <div class="profile-rank-badge">
            ${viewedUser.rank || 'Beginner'}
          </div>
 
          <div class="profile-details-box">
            <div class="flex justify-between">
              <span class="text-secondary">Main Game:</span>
              <strong class="text-primary">${mainGameName}</strong>
            </div>
            <div class="flex justify-between">
              <span class="text-secondary">Main Character:</span>
              <strong class="text-primary">${viewedUser.mainChar}</strong>
            </div>
          </div>
          ${playedGamesHtml}
          ${followButtonHtml}
          ${editButtonHtml}
        </div>
 
        <!-- Stats widget -->
        ${statsWidgetHtml}
      </div>
    `;
 
    // Draw Tab content
    drawTabList();
 
    // Attach Tab listeners only if it's the owner's profile
    if (!isPublicView) {
      const tabs = mount.querySelectorAll('.tab');
      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          tabs.forEach(function (t) { t.classList.remove('active'); });
          tab.classList.add('active');
          activeTab = tab.getAttribute('data-tab');
          drawTabList();
        });
      });
 
      // Attach Edit button listener
      document.getElementById('btn-edit-profile-mains').addEventListener('click', function () {
        openEditMainsModal();
      });
    }

    // Attach Follow button listener if public view
    if (isPublicView) {
      const followBtn = document.getElementById('btn-follow-user');
      if (followBtn) {
        followBtn.addEventListener('click', async function () {
          if (!currentUser) {
            window.openAuthModal('login', navigateCallback);
            return;
          }
          followBtn.disabled = true;
          const result = await store.toggleFollowUser(viewedUser.id);
          followBtn.disabled = false;
          if (result.success) {
            window.showToast(result.followed ? `Now following ${viewedUser.username}!` : `Unfollowed ${viewedUser.username}.`);
            drawDashboard();
          } else {
            window.showToast(result.error || 'Failed to update follow status.');
          }
        });
      }
    }
  }
  function openEditMainsModal() {
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    modalTitle.innerText = 'EDIT PROFILE SETTINGS';
 
    modalBody.innerHTML = `
      <div class="profile-modal-section-title">Primary Main Game</div>
      <div id="primary-game-select-container" class="game-select-chips">
        ${Object.values(games).map(function (g) {
          return `
            <div class="selection-chip ${currentUser.mainGame === g.id ? 'active' : ''}" data-game="${g.id}">
              ${g.name}
            </div>
          `;
        }).join('')}
      </div>

      <div class="profile-modal-section-title">Primary Main Character</div>
      <div class="char-selection-container">
        <div id="primary-char-select-grid" class="char-selection-grid">
          <!-- Filled dynamically -->
        </div>
      </div>

      <div class="profile-modal-section-title">Other Games & Mains</div>
      <div id="modal-other-games-container" class="profile-modal-other-games">
        <!-- Filled dynamically -->
      </div>
 
      <div class="profile-modal-actions">
        <button class="btn btn-secondary" id="modal-edit-cancel">Cancel</button>
        <button class="btn btn-primary" id="modal-edit-save">Save Info</button>
      </div>
    `;
 
    const primaryGameSelectContainer = document.getElementById('primary-game-select-container');
    const primaryCharSelectGrid = document.getElementById('primary-char-select-grid');
    const otherGamesContainer = document.getElementById('modal-other-games-container');
 
    let currentSelectedPrimaryGame = currentUser.mainGame;
    let currentSelectedPrimaryChar = currentUser.mainChar;

    async function handleAddDlc(gameId, gridElement, isPrimary) {
      const gameObj = games[gameId];
      if (!gameObj) return;

      const charName = window.prompt(`Enter the name of the missing DLC character for ${gameObj.name}:`);
      if (charName === null) return; // User cancelled

      const cleanName = charName.trim();
      if (!cleanName) {
        window.showToast('Character name cannot be empty.');
        return;
      }

      window.showToast('Adding character to database...');
      const success = await store.addGameCharacter(gameId, cleanName);
      if (success) {
        window.showToast(`${cleanName} successfully added!`);
        // Refresh local cache reference
        games[gameId] = store.getGame(gameId);

        if (isPrimary) {
          currentSelectedPrimaryChar = cleanName;
          fillPrimaryChars();
        } else {
          // Re-render other game grid characters
          const card = otherGamesContainer.querySelector(`.edit-game-card.game-${gameId}`);
          const grid = card.querySelector(`#char-selection-${gameId}`);
          
          // Collect currently selected active chars
          const currentActive = [];
          grid.querySelectorAll('.char-chip.active').forEach(function (ch) {
            currentActive.push(ch.getAttribute('data-char'));
          });
          // Auto-select the newly added character
          if (!currentActive.includes(cleanName)) {
            currentActive.push(cleanName);
          }

          // Render updated list
          grid.innerHTML = games[gameId].characters.map(function (c) {
            const isChecked = currentActive.includes(c);
            const activeChipClass = isChecked ? 'active' : '';
            return `
              <div class="char-chip ${activeChipClass}" data-game="${gameId}" data-char="${escapeHtml(c)}">
                ${escapeHtml(c)}
              </div>
            `;
          }).join('') + `
            <div class="char-chip-add profile-char-chip-add" data-game="${gameId}">
              <i class="fa-solid fa-plus"></i> Add DLC
            </div>
          `;

          // Re-bind listeners
          grid.querySelectorAll('.char-chip').forEach(function (chip) {
            chip.addEventListener('click', function (e) {
              e.stopPropagation();
              chip.classList.toggle('active');
            });
          });

          const addBtn = grid.querySelector('.char-chip-add');
          if (addBtn) {
            addBtn.addEventListener('click', function (e) {
              e.stopPropagation();
              handleAddDlc(gameId, grid, false);
            });
          }
        }
      } else {
        window.showToast('Failed to add character.');
      }
    }

    function fillPrimaryChars() {
      const gameObj = games[currentSelectedPrimaryGame];
      if (!gameObj) return;
      
      primaryCharSelectGrid.innerHTML = gameObj.characters.map(function (c) {
        const isSelected = currentSelectedPrimaryChar === c;
        const activeClass = isSelected ? 'active' : '';
        return `
          <div class="char-chip ${activeClass}" data-game="${currentSelectedPrimaryGame}" data-char="${escapeHtml(c)}">
            ${escapeHtml(c)}
          </div>
        `;
      }).join('') + `
        <div class="char-chip-add profile-char-chip-add" data-game="${currentSelectedPrimaryGame}">
          <i class="fa-solid fa-plus"></i> Add DLC
        </div>
      `;

      // Attach click listeners to primary character chips
      primaryCharSelectGrid.querySelectorAll('.char-chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
          primaryCharSelectGrid.querySelectorAll('.char-chip').forEach(function (ch) { ch.classList.remove('active'); });
          chip.classList.add('active');
          currentSelectedPrimaryChar = chip.getAttribute('data-char');
        });
      });

      // Attach click listener to primary Add DLC chip
      const addBtn = primaryCharSelectGrid.querySelector('.char-chip-add');
      if (addBtn) {
        addBtn.addEventListener('click', function () {
          handleAddDlc(currentSelectedPrimaryGame, primaryCharSelectGrid, true);
        });
      }
    };    // Attach click listeners to primary game selection chips
    primaryGameSelectContainer.querySelectorAll('.selection-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        primaryGameSelectContainer.querySelectorAll('.selection-chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        currentSelectedPrimaryGame = chip.getAttribute('data-game');
        
        // Auto-select first character of this game since we changed primary game
        const firstChar = games[currentSelectedPrimaryGame].characters[0] || '';
        currentSelectedPrimaryChar = firstChar;
        fillPrimaryChars();
      });
    });

    fillPrimaryChars(); // initialize primary character select
 
    // Render other games list as custom styled cards
    otherGamesContainer.innerHTML = Object.values(games).map(function (g) {
      const playsThisGame = currentUser.playedGames && currentUser.playedGames.includes(g.id);
      const activeClass = playsThisGame ? '' : 'hidden';
      const activeChars = currentUser.gameCharacters && currentUser.gameCharacters[g.id] || [];
      const activeCardClass = playsThisGame ? 'active' : '';
      
      return `
        <div class="edit-game-card ${activeCardClass} game-${g.id}" data-game="${g.id}">
          <div class="flex items-center justify-between pointer-events-none">
            <span class="badge badge-${g.id} profile-edit-game-badge">${g.name}</span>
            <span class="status-indicator profile-edit-game-status">
              ${playsThisGame ? '<i class="fa-solid fa-circle-check"></i> ACTIVE' : '<i class="fa-regular fa-circle"></i> INACTIVE'}
            </span>
          </div>
          <div id="char-selection-${g.id}" class="char-selection-grid profile-edit-char-grid ${activeClass}" onclick="event.stopPropagation();">
            ${g.characters.map(function (c) {
              const isChecked = activeChars.includes(c);
              const activeChipClass = isChecked ? 'active' : '';
              return `
                <div class="char-chip ${activeChipClass}" data-game="${g.id}" data-char="${escapeHtml(c)}">
                  ${escapeHtml(c)}
                </div>
              `;
            }).join('')}
            <div class="char-chip-add profile-char-chip-add" data-game="${g.id}">
              <i class="fa-solid fa-plus"></i> Add DLC
            </div>
          </div>
        </div>
      `;
    }).join('');
 
    // Toggle game card state
    otherGamesContainer.querySelectorAll('.edit-game-card').forEach(function (card) {
      card.addEventListener('click', function () {
        const gameId = card.getAttribute('data-game');
        const grid = card.querySelector(`#char-selection-${gameId}`);
        const indicator = card.querySelector('.status-indicator');
        
        card.classList.toggle('active');
        const isActive = card.classList.contains('active');
        
        if (isActive) {
          indicator.innerHTML = '<i class="fa-solid fa-circle-check"></i> ACTIVE';
          grid.classList.remove('hidden');
        } else {
          indicator.innerHTML = '<i class="fa-regular fa-circle"></i> INACTIVE';
          grid.classList.add('hidden');
          
          // Reset all chips inside this card
          grid.querySelectorAll('.char-chip').forEach(function (chip) {
            chip.classList.remove('active');
          });
        }
      });
    });

    // Toggle character chips inside cards
    otherGamesContainer.querySelectorAll('.char-chip').forEach(function (chip) {
      chip.addEventListener('click', function (e) {
        e.stopPropagation(); // Prevent toggling the game card itself
        chip.classList.toggle('active');
      });
    });

    // Toggle character add chips inside cards
    otherGamesContainer.querySelectorAll('.char-chip-add').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation(); // Prevent toggling the game card itself
        const gameId = btn.getAttribute('data-game');
        const grid = otherGamesContainer.querySelector(`#char-selection-${gameId}`);
        handleAddDlc(gameId, grid, false);
      });
    });
 
    const overlay = document.getElementById('modal-container');
    overlay.classList.add('open');
 
    document.getElementById('modal-edit-cancel').addEventListener('click', function () {
      overlay.classList.remove('open');
    });
 
    document.getElementById('modal-edit-save').addEventListener('click', async function () {
      const mainGameVal = currentSelectedPrimaryGame;
      const mainCharVal = currentSelectedPrimaryChar;
      
      const playedGames = [];
      const gameCharacters = {};
      
      otherGamesContainer.querySelectorAll('.edit-game-card').forEach(function (card) {
        if (card.classList.contains('active')) {
          const gameId = card.getAttribute('data-game');
          playedGames.push(gameId);
          gameCharacters[gameId] = [];
        }
      });
      
      otherGamesContainer.querySelectorAll('.char-selection-grid .char-chip').forEach(function (chip) {
        if (chip.classList.contains('active')) {
          const gameId = chip.getAttribute('data-game');
          const charName = chip.getAttribute('data-char');
          // Only add characters if their parent game card is active
          if (gameCharacters[gameId]) {
            gameCharacters[gameId].push(charName);
          }
        }
      });
      
      // Auto-include primary main selections
      if (!playedGames.includes(mainGameVal)) {
        playedGames.push(mainGameVal);
      }
      if (!gameCharacters[mainGameVal]) {
        gameCharacters[mainGameVal] = [];
      }
      if (!gameCharacters[mainGameVal].includes(mainCharVal)) {
        gameCharacters[mainGameVal].push(mainCharVal);
      }
 
      const dbUser = { ...currentUser };
      dbUser.mainGame = mainGameVal;
      dbUser.mainChar = mainCharVal;
      dbUser.playedGames = playedGames;
      dbUser.gameCharacters = gameCharacters;
 
      const { supabase } = await import('../supabase.js');
      const { data, error } = await supabase.from('users').update({
        main_game: mainGameVal,
        main_char: mainCharVal,
        played_games: playedGames,
        game_characters: gameCharacters
      }).eq('id', currentUser.id).select();
 
      if (error) {
        window.showToast('Failed to save: ' + error.message);
        return;
      }
      if (!data || data.length === 0) {
        window.showToast('Failed to save profile. RLS policies may restrict edits.');
        return;
      }
 
      store.setCurrentUser(dbUser); // update active session
      window.showToast('Profile settings updated successfully.');
      overlay.classList.remove('open');
      drawDashboard();
    });
  }
 
  drawDashboard();
}
