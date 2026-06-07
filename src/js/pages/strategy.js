/* Strategy Guides & Matchup Hub Page Controller */
import store from '../store.js';
import { escapeHtml } from '../utils/security.js';
import { hideGameSidebar } from '../components/game-sidebar.js';

/**
 * Renders the Strategy Hub page, containing directories of matchup strategy articles,
 * a frame punish cheat sheet reference directory table, and a dedicated guide reader view.
 * @param {function} navigateCallback - SPA router callback.
 */
export function renderStrategyPage(navigateCallback) {
  const mount = document.getElementById('content-mount');
  if (!mount) return;

  // Split layout — hide game sidebar on this page
  hideGameSidebar();
  mount.className = 'has-right-sidebar';

  const games = store.getGames();
  const currentUser = store.getCurrentUser();
  
  let selectedGame = 'all';
  let activeGuide = null; // Currently reading guide object

  const refreshPage = () => {
    const guides = store.getStrategies();
    const filteredGuides = selectedGame === 'all' 
      ? guides 
      : guides.filter(g => g.game === selectedGame);

    mount.innerHTML = `
      <!-- Guides List & Matrix (Left Column) -->
      <div id="strategy-left-pane">
        <div class="flex justify-between items-center" style="margin-bottom: 24px;">
          <div>
            <h1 class="gradient-text" style="font-size: 1.8rem;">STRATEGY HUB</h1>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">Study frames, matchups, punish guides, and lab tutorials.</p>
          </div>
          <button class="btn btn-primary btn-sm" id="btn-create-guide">
            <i class="fa-solid fa-pen-to-square"></i> Post Guide
          </button>
        </div>

        <!-- Selector Bar -->
        <div class="game-selector-bar" id="strategy-game-chips" style="margin-bottom: 20px;">
          <div class="game-chip ${selectedGame === 'all' ? 'active' : ''}" data-game="all">All Games</div>
          ${Object.values(games).map(g => `
            <div class="game-chip ${selectedGame === g.id ? 'active' : ''}" data-game="${g.id}">${g.name}</div>
          `).join('')}
        </div>

        <!-- Frame Punish Cheat Sheet (Dynamic Matchup Matrix Widget) -->
        <div class="card" style="padding: 16px; margin-bottom: 24px; border-color: rgba(0, 240, 255, 0.15);">
          <h3 style="font-size: 1rem; margin-bottom: 8px; color: var(--color-secondary);">
            <i class="fa-solid fa-table-list"></i> Matchup Punish Directory
          </h3>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 12px;">Quick frame reference notes for key matchups.</div>
          
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
              <thead>
                <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-primary); font-family: var(--font-heading); font-weight: 700;">
                  <th style="padding: 8px;">Game</th>
                  <th style="padding: 8px;">Character</th>
                  <th style="padding: 8px;">Move Name</th>
                  <th style="padding: 8px;">On Block</th>
                  <th style="padding: 8px; color: var(--color-primary);">Optimal Punish</th>
                </tr>
              </thead>
              <tbody id="cheat-sheet-tbody">
                <!-- Injected row filters -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- Guides Catalog List -->
        <h3 style="font-size: 1.2rem; margin-bottom: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
          Guides Directory
        </h3>
        <div id="guides-list" class="flex flex-col gap-4">
          <!-- Injected guides -->
        </div>
      </div>

      <!-- Guide Reader Panel / Sidebar Widget (Right Column) -->
      <div id="strategy-sidebar" class="flex flex-col gap-6">
        <div id="guide-viewer" class="card" style="min-height: 250px; display: flex; flex-direction: column; justify-content: center; position: sticky; top: 90px;">
          <!-- Displays instructions or active guide details -->
        </div>
      </div>
    `;

    // 1. Draw Matchup table rows based on selectedGame filter
    drawMatchupTable();

    // 2. Draw Guides Directory
    drawGuidesList(filteredGuides);

    // 3. Draw Active Guide View
    drawActiveGuide();

    // Attach chip listeners
    const chips = mount.querySelectorAll('#strategy-game-chips .game-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        selectedGame = chip.getAttribute('data-game');
        refreshPage();
      });
    });

    // Attach create guide click
    document.getElementById('btn-create-guide').addEventListener('click', () => {
      if (!currentUser) {
        window.openAuthModal('login', navigateCallback);
      } else {
        openCreateGuideModal();
      }
    });
  };

  const drawMatchupTable = () => {
    const tbody = document.getElementById('cheat-sheet-tbody');
    if (!tbody) return;

    const data = [
      { game: 'sf6', char: 'Ken', move: 'Medium Dragonlash (623MK)', block: '+1', punish: 'Interrupt startup (22f)' },
      { game: 'sf6', char: 'Ryu', move: 'Heavy Donkey Kick (236HK)', block: '-14', punish: 'Standard cr.MK Link' },
      { game: 't8', char: 'Reina', move: 'Sentai low sweep (SEN 3)', block: '-12', punish: 'i12 ws Twin Pistons (ws4,4)' },
      { game: 't8', char: 'Yoshimitsu', move: 'Flash (d+1+4)', block: '-15', punish: 'Block & launch (u/f+4)' },
      { game: 'ggst', char: 'Sol Badguy', move: 'Fafnir (41236HS)', block: '+2', punish: 'Faultless defend to push back' },
      { game: 'ggst', char: 'Ky Kiske', move: 'Stun Dipper (236K)', block: '-15', punish: 'Far S > 2S or full launch punch' }
    ];

    const filtered = selectedGame === 'all' ? data : data.filter(d => d.game === selectedGame);

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="padding: 12px; text-align: center; color: var(--text-muted);">No cheat sheet reference for this filter.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(d => `
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.03); hover: background-color: rgba(255,255,255,0.01);">
        <td style="padding: 8px; font-weight:700; color: var(--color-secondary); text-transform:uppercase; font-size:0.75rem;">${d.game}</td>
        <td style="padding: 8px; font-weight:700;">${d.char}</td>
        <td style="padding: 8px; color: var(--text-secondary); font-family: var(--font-mono); font-size:0.8rem;">${d.move}</td>
        <td style="padding: 8px; font-weight:700; color: ${d.block.startsWith('+') ? 'var(--color-success)' : 'var(--color-danger)'}">${d.block}</td>
        <td style="padding: 8px; color: var(--text-primary); font-family: var(--font-heading); font-weight:600;">${d.punish}</td>
      </tr>
    `).join('');
  };

  const drawGuidesList = (guides) => {
    const listMount = document.getElementById('guides-list');
    if (!listMount) return;

    if (guides.length === 0) {
      listMount.innerHTML = `
        <div class="card" style="text-align: center; padding: 24px; color: var(--text-secondary);">
          <p>No guides shared yet. Be the first to share notes!</p>
        </div>
      `;
      return;
    }

    listMount.innerHTML = '';
    guides.forEach(guide => {
      const item = document.createElement('div');
      item.className = 'card card-hoverable';
      item.style.padding = '16px';
      item.style.cursor = 'pointer';
      
      const badge = `<span class="badge badge-${guide.game}" style="font-size: 0.65rem;">${guide.game.toUpperCase()}</span>`;
      
      item.innerHTML = `
        <div class="flex justify-between items-center" style="margin-bottom: 6px;">
          <div class="flex items-center gap-2">
            ${badge}
            <span class="badge" style="background: rgba(255,255,255,0.05); font-size: 0.65rem;">${escapeHtml(guide.character)}</span>
          </div>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${guide.upvotes} 🔥</span>
        </div>
        <h4 style="font-size: 1.05rem; margin-bottom: 4px;">${escapeHtml(guide.title)}</h4>
        <div style="font-size: 0.75rem; color: var(--text-secondary);">By ${escapeHtml(guide.author)}</div>
      `;

      item.addEventListener('click', () => {
        activeGuide = guide;
        drawActiveGuide();
      });

      listMount.appendChild(item);
    });

    // Default load first guide if none active
    if (!activeGuide && guides.length > 0) {
      activeGuide = guides[0];
    }
  };

  const drawActiveGuide = () => {
    const viewer = document.getElementById('guide-viewer');
    if (!viewer) return;

    if (!activeGuide) {
      viewer.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--text-secondary);">
          <i class="fa-solid fa-book-open-reader" style="font-size: 2rem; margin-bottom: 12px; color: var(--text-muted);"></i>
          <h4>Select a guide to read details</h4>
          <p style="font-size: 0.8rem; margin-top: 4px;">Browse matchup techniques or create your own thread!</p>
        </div>
      `;
      return;
    }

    const currentUser = store.getCurrentUser();
    const upvoted = currentUser && activeGuide.upvotedBy && activeGuide.upvotedBy.includes(currentUser.id);
    const voteBtnClass = upvoted ? 'active' : '';

    viewer.innerHTML = `
      <div class="flex items-center gap-2" style="margin-bottom: 12px; font-size: 0.75rem;">
        <span class="badge badge-${activeGuide.game}">${activeGuide.game.toUpperCase()}</span>
        <span class="badge" style="background: rgba(255,255,255,0.05);">${escapeHtml(activeGuide.character)}</span>
      </div>

      <h2 style="font-size: 1.4rem; line-height: 1.2; margin-bottom: 8px;">${escapeHtml(activeGuide.title)}</h2>
      <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 20px;">
        Written by <strong>${escapeHtml(activeGuide.author)}</strong>
      </div>

      <div class="strategy-content" style="font-size: 0.9rem; border-top: 1px solid var(--border-color); padding-top: 16px; margin-bottom: 24px; white-space: pre-wrap;">
        ${formatGuideMarkdown(activeGuide.content)}
      </div>

      <div class="flex items-center justify-between" style="border-top: 1px solid var(--border-color); padding-top: 16px;">
        <div class="flex items-center gap-3">
          <button class="btn-icon btn-upvote-guide ${voteBtnClass}" title="Upvote Guide">
            <i class="fa-solid fa-fire"></i>
          </button>
          <span class="guide-upvote-count" style="font-family: var(--font-heading); font-weight: 700; font-size: 0.9rem;">${activeGuide.upvotes} 🔥</span>
        </div>
        <span style="font-size: 0.75rem; color: var(--text-muted);">Shared with HitConfirm Dojo</span>
      </div>
    `;

    // Attach upvote event handler
    viewer.querySelector('.btn-upvote-guide').addEventListener('click', async () => {
      if (!currentUser) {
        window.openAuthModal('login', navigateCallback);
        return;
      }
      const result = await store.upvoteStrategy(activeGuide.id);
      if (result.success) {
        viewer.querySelector('.guide-upvote-count').innerText = `${result.upvotes} 🔥`;
        const btn = viewer.querySelector('.btn-upvote-guide');
        if (result.upvoted) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
        // Sync original list count
        const origList = store.getStrategies();
        activeGuide = origList.find(g => g.id === activeGuide.id);
        drawGuidesList(selectedGame === 'all' ? origList : origList.filter(g => g.game === selectedGame));
      } else {
        window.showToast(result.error || 'Failed to update reaction.');
      }
    });
  };

  const openCreateGuideModal = () => {
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    
    modalTitle.innerText = 'CREATE STRATEGY ARTICLE';
    
    modalBody.innerHTML = `
      <div class="form-group">
        <label class="form-label">Guide Title</label>
        <input type="text" id="modal-guide-title" class="form-input" placeholder="e.g. Punishing Ryu Fireballs, Neutral Guide..." />
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">Game</label>
          <select id="modal-guide-game" class="form-select">
            ${Object.values(games).map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">Character Focus</label>
          <select id="modal-guide-char" class="form-select">
            <!-- Populated via script -->
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Guide Content (Strategy, Tips, Punishes)</label>
        <textarea id="modal-guide-content" class="form-textarea" style="min-height: 200px;" placeholder="Outline your matchup strategies. Markdown supported (e.g. ### Headers, 1. Lists)"></textarea>
      </div>

      <div class="flex justify-end gap-3" style="margin-top: 24px;">
        <button class="btn btn-secondary" id="modal-guide-cancel">Cancel</button>
        <button class="btn btn-primary" id="modal-guide-publish">Publish Guide</button>
      </div>
    `;

    // Populate chars dropdown based on active modal game select
    const modalGameSel = document.getElementById('modal-guide-game');
    const modalCharSel = document.getElementById('modal-guide-char');
    
    const fillChars = () => {
      const gameId = modalGameSel.value;
      modalCharSel.innerHTML = games[gameId].characters.map(c => `
        <option value="${c}">${c}</option>
      `).join('');
    };

    modalGameSel.addEventListener('change', fillChars);
    fillChars(); // seed initial values

    // Display modal
    const overlay = document.getElementById('modal-container');
    overlay.classList.add('open');

    // Attach buttons inside modal
    document.getElementById('modal-guide-cancel').addEventListener('click', () => {
      overlay.classList.remove('open');
    });

    document.getElementById('modal-guide-publish').addEventListener('click', async () => {
      const titleVal = document.getElementById('modal-guide-title').value.trim();
      const gameVal = modalGameSel.value;
      const charVal = modalCharSel.value;
      const contentVal = document.getElementById('modal-guide-content').value.trim();

      if (!titleVal || !contentVal) {
        window.showToast('Please fill out the title and guide content.');
        return;
      }

      const result = await store.saveStrategy({
        game: gameVal,
        character: charVal,
        title: titleVal,
        content: contentVal
      });

      if (result.success) {
        window.showToast('Strategy guide published successfully!');
        overlay.classList.remove('open');
        activeGuide = result.strategy; // Open newly created guide automatically
        refreshPage();
      } else {
        window.showToast(result.error || 'Failed to publish.');
      }
    });
  };

  // Run initializer draw
  refreshPage();
}

function formatGuideMarkdown(text) {
  const escaped = escapeHtml(text);
  // Simple custom Markdown rendering to HTML:
  let formatted = escaped
    .replace(/### (.*?)\n/g, '<h4 style="font-family:var(--font-heading); color:var(--color-secondary); margin-top:16px; margin-bottom:8px;">$1</h4>')
    .replace(/## (.*?)\n/g, '<h3 style="font-family:var(--font-heading); color:var(--color-secondary); margin-top:20px; margin-bottom:8px; border-bottom:1px solid var(--border-color); padding-bottom:4px;">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-primary);">$1</strong>')
    .replace(/- (.*?)\n/g, '<li style="margin-left:16px; font-size:0.85rem; color:var(--text-secondary);">$1</li>')
    .replace(/\n\n/g, '<br/>');

  return formatted;
}
