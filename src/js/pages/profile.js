/* Player Profile/Dashboard Page Controller */
import store from '../store.js';
import { renderComboCard } from '../components/combo-card.js';
import { renderPostCard } from '../components/post-card.js';

/**
 * Renders the player dashboard profile page containing custom avatar highlights,
 * status details, personal published combos, saved training bookmarks, and posts history.
 * @param {function} navigateCallback - SPA router callback.
 */
export function renderProfilePage(navigateCallback) {
  const mount = document.getElementById('content-mount');
  if (!mount) return;

  // Dual column layout
  mount.className = 'has-right-sidebar';

  const currentUser = store.getCurrentUser();
  const games = store.getGames();

  // If user is not logged in, show lock/auth prompt screen
  if (!currentUser) {
    mount.innerHTML = `
      <div style="grid-column: span 2; display: flex; justify-content: center; align-items: center; padding: 64px 16px;">
        <div class="card" style="max-width: 480px; width: 100%; text-align: center; border-color: rgba(0, 240, 255, 0.2); box-shadow: var(--glow-secondary);">
          <i class="fa-solid fa-lock" style="font-size: 3rem; color: var(--color-secondary); filter: drop-shadow(var(--glow-secondary)); margin-bottom: 18px;"></i>
          <h2 style="font-size: 1.6rem; margin-bottom: 8px;">Dojo Locker Room</h2>
          <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 24px;">
            Log in or sign up to personalize your Dojo, save optimal combos for training sessions, and join matchup discussions.
          </p>
          <div class="flex justify-center gap-3">
            <button class="btn btn-primary btn-sm btn-profile-signup">Register Account</button>
            <button class="btn btn-secondary btn-sm btn-profile-login">Sign In</button>
          </div>
        </div>
      </div>
    `;

    mount.querySelector('.btn-profile-signup').addEventListener('click', () => {
      window.openAuthModal('register', navigateCallback);
    });
    mount.querySelector('.btn-profile-login').addEventListener('click', () => {
      window.openAuthModal('login', navigateCallback);
    });
    return;
  }

  // Logged-in profile dashboard
  let activeTab = 'my-combos'; // my-combos, saved-combos, my-posts

  const drawDashboard = () => {
    const mainGameName = games[currentUser.mainGame]?.name || currentUser.mainGame;
    
    mount.innerHTML = `
      <!-- User profile submissions (Left Pane) -->
      <div id="profile-left-pane">
        <!-- Submissions Navigation Tabs -->
        <div class="tabs">
          <div class="tab ${activeTab === 'my-combos' ? 'active' : ''}" data-tab="my-combos">My Combos</div>
          <div class="tab ${activeTab === 'saved-combos' ? 'active' : ''}" data-tab="saved-combos">Saved Combos</div>
          <div class="tab ${activeTab === 'my-posts' ? 'active' : ''}" data-tab="my-posts">My Posts</div>
        </div>

        <!-- Dynamic Content List -->
        <div id="profile-submissions-list"></div>
      </div>

      <!-- User Info & Lab Details Sidebar (Right Pane) -->
      <div id="profile-sidebar" class="flex flex-col gap-6">
        <!-- Card details -->
        <div class="card" style="text-align: center; position: relative;">
          <div class="avatar avatar-large" style="border-color: ${currentUser.avatarColor}; margin: 0 auto 16px auto;">
            ${currentUser.username.substring(0, 2).toUpperCase()}
          </div>
          
          <h2 style="font-size: 1.5rem; margin-bottom: 4px;">${currentUser.username}</h2>
          <div style="font-family: var(--font-heading); font-weight: 700; color: var(--color-accent); font-size: 0.85rem; text-transform: uppercase; margin-bottom: 16px;">
            ${currentUser.rank || 'Beginner'}
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px; text-align: left; padding: 12px; background: rgba(0,0,0,0.15); border-radius: 6px; border: 1px solid rgba(255,255,255,0.03); font-size: 0.85rem; margin-bottom: 16px;">
            <div class="flex justify-between">
              <span style="color: var(--text-secondary);">Main Game:</span>
              <strong style="color: var(--text-primary);">${mainGameName}</strong>
            </div>
            <div class="flex justify-between">
              <span style="color: var(--text-secondary);">Main Character:</span>
              <strong style="color: var(--text-primary);">${currentUser.mainChar}</strong>
            </div>
          </div>

          <button class="btn btn-secondary btn-sm w-full" id="btn-edit-profile-mains">
            <i class="fa-solid fa-user-gear"></i> Edit Main Pick
          </button>
        </div>

        <!-- Stats widget -->
        <div class="card" style="padding: 20px;">
          <h3 style="font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 12px;">
            Dojo Achievement Status
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; text-align: center;">
            <div style="background: rgba(0,0,0,0.15); padding: 10px; border-radius: 6px;">
              <div style="font-size: 1.3rem; font-weight:800; color: var(--color-primary);">${countUserCombos()}</div>
              <div style="font-size: 0.75rem; color: var(--text-secondary);">Created Combos</div>
            </div>
            <div style="background: rgba(0,0,0,0.15); padding: 10px; border-radius: 6px;">
              <div style="font-size: 1.3rem; font-weight:800; color: var(--color-secondary);">${currentUser.savedCombos?.length || 0}</div>
              <div style="font-size: 0.75rem; color: var(--text-secondary);">Saved Combos</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Draw Tab content
    drawTabList();

    // Attach Tab listeners
    const tabs = mount.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeTab = tab.getAttribute('data-tab');
        drawTabList();
      });
    });

    // Attach Edit button listener
    document.getElementById('btn-edit-profile-mains').addEventListener('click', () => {
      openEditMainsModal();
    });
  };

  const countUserCombos = () => {
    return store.getCombos().filter(c => c.userId === currentUser.id).length;
  };

  const drawTabList = () => {
    const listMount = document.getElementById('profile-submissions-list');
    if (!listMount) return;

    listMount.innerHTML = '';

    if (activeTab === 'my-combos') {
      const combos = store.getCombos().filter(c => c.userId === currentUser.id);
      if (combos.length === 0) {
        listMount.innerHTML = `
          <div class="card" style="text-align: center; padding: 36px; color: var(--text-secondary);">
            <p>You haven't posted any combos yet. Go to the Combo Builder to publish one!</p>
          </div>
        `;
        return;
      }
      combos.forEach(combo => {
        listMount.appendChild(renderComboCard(combo, navigateCallback));
      });
    } else if (activeTab === 'saved-combos') {
      const savedIds = currentUser.savedCombos || [];
      const combos = store.getCombos().filter(c => savedIds.includes(c.id));
      if (combos.length === 0) {
        listMount.innerHTML = `
          <div class="card" style="text-align: center; padding: 36px; color: var(--text-secondary);">
            <p>Your saved list is empty. Explore other player's combo cards and bookmark them!</p>
          </div>
        `;
        return;
      }
      combos.forEach(combo => {
        listMount.appendChild(renderComboCard(combo, navigateCallback));
      });
    } else if (activeTab === 'my-posts') {
      const posts = store.getPosts().filter(p => p.userId === currentUser.id);
      if (posts.length === 0) {
        listMount.innerHTML = `
          <div class="card" style="text-align: center; padding: 36px; color: var(--text-secondary);">
            <p>You haven't shared any timeline updates yet.</p>
          </div>
        `;
        return;
      }
      posts.forEach(post => {
        listMount.appendChild(renderPostCard(post, navigateCallback));
      });
    }
  };

  const openEditMainsModal = () => {
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    modalTitle.innerText = 'EDIT PROFILE SETTINGS';

    modalBody.innerHTML = `
      <div class="form-group">
        <label class="form-label">Main Game</label>
        <select id="modal-edit-game" class="form-select">
          ${Object.values(games).map(g => `
            <option value="${g.id}" ${currentUser.mainGame === g.id ? 'selected' : ''}>${g.name}</option>
          `).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Main Character</label>
        <select id="modal-edit-char" class="form-select"></select>
      </div>

      <div class="flex justify-end gap-3" style="margin-top: 24px;">
        <button class="btn btn-secondary" id="modal-edit-cancel">Cancel</button>
        <button class="btn btn-primary" id="modal-edit-save">Save Info</button>
      </div>
    `;

    const editGameSel = document.getElementById('modal-edit-game');
    const editCharSel = document.getElementById('modal-edit-char');

    const fillEditChars = () => {
      const gameId = editGameSel.value;
      const charList = games[gameId].characters;
      editCharSel.innerHTML = charList.map(c => `
        <option value="${c}" ${currentUser.mainChar === c ? 'selected' : ''}>${c}</option>
      `).join('');
    };

    editGameSel.addEventListener('change', fillEditChars);
    fillEditChars(); // initialize

    const overlay = document.getElementById('modal-container');
    overlay.classList.add('open');

    document.getElementById('modal-edit-cancel').addEventListener('click', () => {
      overlay.classList.remove('open');
    });

    document.getElementById('modal-edit-save').addEventListener('click', async () => {
      const dbUser = { ...currentUser };
      dbUser.mainGame = editGameSel.value;
      dbUser.mainChar = editCharSel.value;

      const { supabase } = await import('../supabase.js');
      const { error } = await supabase.from('users').update({
        main_game: editGameSel.value,
        main_char: editCharSel.value
      }).eq('id', currentUser.id);

      if (error) {
        window.showToast('Failed to save: ' + error.message);
        return;
      }

      store.setCurrentUser(dbUser); // update active session
      window.showToast('Profile mains updated.');
      overlay.classList.remove('open');
      drawDashboard();
    });
  };

  drawDashboard();
}
