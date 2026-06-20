/* Strategy Guides & Matchup Hub Page Controller */
import store from '../store.js';
import { escapeHtml } from '../utils/security.js';
import { renderGameSidebar, showGameSidebar } from '../components/game-sidebar.js';

/**
 * Renders the Strategy Hub page, containing directories of matchup strategy articles,
 * a frame punish cheat sheet reference directory table, and a dedicated guide reader view.
 * @param {function} navigateCallback - SPA router callback.
 */
export function renderStrategyPage(navigateCallback) {
  const mount = document.getElementById('content-mount');
  if (!mount) return;

  // Split layout — show game sidebar on this page
  showGameSidebar();
  mount.className = 'has-game-sidebar';

  const games = store.getGames();
  const currentUser = store.getCurrentUser();
  
  let selectedGame = (currentUser && currentUser.mainGame) ? currentUser.mainGame : 'ggst';
  let activeGuide = null; // Currently reading guide object

  function refreshPage() {
    const guides = store.getStrategies();
    const filteredGuides = selectedGame === 'all' 
      ? guides 
      : guides.filter(function (g) { return g.game === selectedGame; });

    mount.innerHTML = `
      <!-- Guides List & Matrix (Left Column) -->
      <div id="strategy-left-pane">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="gradient-text strategy-title">Guides</h1>
            <p class="strategy-desc">Post/Learn strategies on how to play with specific characters</p>
          </div>
          <button class="btn btn-primary btn-sm" id="btn-create-guide">
            <i class="fa-solid fa-pen-to-square"></i> Post Guide
          </button>
        </div>

        <!-- Guides Catalog List -->
        <h3 class="strategy-guides-heading">
          Guides Directory
        </h3>
        <div id="guides-list" class="flex flex-col gap-4">
          <!-- Injected guides -->
        </div>
      </div>

      <!-- Guide Reader Panel / Sidebar Widget (Right Column) -->
      <div id="strategy-sidebar" class="flex flex-col gap-6">
        <div id="guide-viewer" class="card strategy-guide-viewer">
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

    // Attach create guide click
    document.getElementById('btn-create-guide').addEventListener('click', function () {
      if (!currentUser) {
        window.openAuthModal('login', navigateCallback);
      } else {
        openCreateGuideModal();
      }
    });
  }

  function drawMatchupTable() {
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

    const filtered = selectedGame === 'all' ? data : data.filter(function (d) { return d.game === selectedGame; });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="p-3 text-center text-muted">No cheat sheet reference for this filter.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(function (d) {
      return `
        <tr class="strategy-matrix-tr">
          <td class="strategy-matrix-td-game">${d.game}</td>
          <td class="strategy-matrix-td-char">${d.char}</td>
          <td class="strategy-matrix-td-move">${d.move}</td>
          <td class="strategy-matrix-td-block" style="color: ${d.block.startsWith('+') ? 'var(--color-success)' : 'var(--color-danger)'}">${d.block}</td>
          <td class="strategy-matrix-td-punish">${d.punish}</td>
        </tr>
      `;
    }).join('');
  }

  function drawGuidesList(guides) {
    const listMount = document.getElementById('guides-list');
    if (!listMount) return;

    if (guides.length === 0) {
      listMount.innerHTML = `
        <div class="card strategy-empty-card">
          <p>No guides shared yet. Be the first to share notes!</p>
        </div>
      `;
      return;
    }

    listMount.innerHTML = '';
    guides.forEach(function (guide) {
      const item = document.createElement('div');
      item.className = 'card card-hoverable strategy-guide-item';
      
      const badge = `<span class="badge badge-${guide.game} strategy-badge-micro">${guide.game.toUpperCase()}</span>`;
      
      item.innerHTML = `
        <div class="strategy-guide-item-header">
          <div class="flex items-center gap-2">
            ${badge}
            <span class="badge strategy-badge-char">${escapeHtml(guide.character)}</span>
          </div>
        </div>
        <h4 class="strategy-guide-item-title">${escapeHtml(guide.title)}</h4>
        <div class="strategy-guide-item-author">${escapeHtml(guide.author)}</div>
        <span class="strategy-guide-item-meta">${guide.upvotes} 🔥</span>
      `;

      item.addEventListener('click', function () {
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

  function drawActiveGuide() {
    const viewer = document.getElementById('guide-viewer');
    if (!viewer) return;

    if (!activeGuide) {
      viewer.innerHTML = `
        <div class="strategy-viewer-empty">
          <i class="fa-solid fa-book-open-reader strategy-viewer-empty-icon"></i>
          <h4>Select a guide to read details</h4>
          <p class="strategy-viewer-empty-text">Browse matchup techniques or create your own thread!</p>
        </div>
      `;
      return;
    }

    const currentUser = store.getCurrentUser();
    const upvoted = currentUser && activeGuide.upvotedBy && activeGuide.upvotedBy.includes(currentUser.id);
    const voteBtnClass = upvoted ? 'active' : '';

    viewer.innerHTML = `
      <div class="strategy-viewer-header">
        <span class="badge badge-${activeGuide.game}">${activeGuide.game.toUpperCase()}</span>
        <span class="badge strategy-viewer-badge-char">${escapeHtml(activeGuide.character)}</span>
      </div>

      <h2 class="strategy-viewer-title">${escapeHtml(activeGuide.title)}</h2>
      <div class="strategy-guide-item-author">
       <strong>${escapeHtml(activeGuide.author)}</strong>
      </div>

      <div class="strategy-content strategy-viewer-content">
        ${formatGuideMarkdown(activeGuide.content)}
      </div>

      <div class="strategy-viewer-footer">
        <div class="flex items-center gap-3">
          <button class="btn-icon btn-upvote-guide ${voteBtnClass}" title="Upvote Guide">
            <i class="fa-solid fa-fire"></i>
          </button>
          <span class="guide-upvote-count strategy-viewer-upvote-count">${activeGuide.upvotes} 🔥</span>
        </div>
      </div>
    `;

    // Attach upvote event handler
    viewer.querySelector('.btn-upvote-guide').addEventListener('click', async function () {
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
        activeGuide = origList.find(function (g) { return g.id === activeGuide.id; });
        drawGuidesList(selectedGame === 'all' ? origList : origList.filter(function (g) { return g.game === selectedGame; }));
      } else {
        window.showToast(result.error || 'Failed to update reaction.');
      }
    });
  }

  function openCreateGuideModal() {
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    
    modalTitle.innerText = 'CREATE STRATEGY ARTICLE';
    
    modalBody.innerHTML = `
      <div class="form-group">
        <label class="form-label">Guide Title</label>
        <input type="text" id="modal-guide-title" class="form-input" placeholder="e.g. Punishing Ryu Fireballs, Neutral Guide..." />
      </div>

      <div class="strategy-modal-grid-2col">
        <div class="form-group strategy-modal-form-group-flat">
          <label class="form-label">Game</label>
          <select id="modal-guide-game" class="form-select">
            ${Object.values(games).map(function (g) {
              return `<option value="${g.id}">${g.name}</option>`;
            }).join('')}
          </select>
        </div>
        <div class="form-group strategy-modal-form-group-flat">
          <label class="form-label">Character Focus</label>
          <select id="modal-guide-char" class="form-select">
            <!-- Populated via script -->
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Guide Content (Strategy, Tips, Punishes)</label>
        <textarea id="modal-guide-content" class="form-textarea strategy-modal-textarea" placeholder="Outline your matchup strategies. Markdown supported (e.g. ### Headers, 1. Lists)"></textarea>
      </div>

      <div class="strategy-modal-actions">
        <button class="btn btn-secondary" id="modal-guide-cancel">Cancel</button>
        <button class="btn btn-primary" id="modal-guide-publish">Publish Guide</button>
      </div>
    `;

    // Populate chars dropdown based on active modal game select
    const modalGameSel = document.getElementById('modal-guide-game');
    const modalCharSel = document.getElementById('modal-guide-char');
    
    function fillChars() {
      const gameId = modalGameSel.value;
      modalCharSel.innerHTML = games[gameId].characters.map(function (c) {
        return `<option value="${c}">${c}</option>`;
      }).join('');
    }

    modalGameSel.addEventListener('change', fillChars);
    fillChars(); // seed initial values

    // Display modal
    const overlay = document.getElementById('modal-container');
    overlay.classList.add('open');

    // Attach buttons inside modal
    document.getElementById('modal-guide-cancel').addEventListener('click', function () {
      overlay.classList.remove('open');
    });

    document.getElementById('modal-guide-publish').addEventListener('click', async function () {
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
  }

  // Initialize Left Game Sidebar
  function initSidebar(activeGame) {
    renderGameSidebar({
      activeGame,
      onGameChange: function (gameId) {
        selectedGame = gameId;
        refreshPage();
        initSidebar(gameId);
      }
    });
  }

  // Run initializer draw
  refreshPage();
  initSidebar(selectedGame);
}

function formatGuideMarkdown(text) {
  const escaped = escapeHtml(text);
  // Simple custom Markdown rendering to HTML:
  let formatted = escaped
    .replace(/### (.*?)\n/g, '<h4>$1</h4>')
    .replace(/## (.*?)\n/g, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/- (.*?)\n/g, '<li>$1</li>')
    .replace(/\n\n/g, '<br/>');

  return formatted;
}
