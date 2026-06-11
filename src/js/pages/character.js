// src/js/pages/character.js
// Page to display detailed frame data for a specific character with sorting and filtering.
// Expected navigation call: navigate('character', { gameId: 'ggst', charName: 'Sol Badguy' })

import store from '../store.js';
import { cleanDustloopValue, parseNumericValue, formatAdvantageBadge } from '../utils/dustloop-helpers.js';

export function renderCharacterPage(navigateCallback, options = {}) {
  const { gameId, charName } = options;
  const mount = document.getElementById('content-mount');
  if (!mount) return;

  const sanitizedChar = charName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  const portraitUrl = `/src/images/characters/${gameId}/${sanitizedChar}.png`;

  // Page level state
  let searchQuery = '';
  let sortByField = '';
  let sortOrder = 'asc'; // 'asc' or 'desc'
  let rawRows = [];

  // Main Page Layout Structure
  mount.innerHTML = `
    <div class="character-page">
      <button class="btn btn-secondary btn-sm" id="btn-back">← Back to Strategy Hub</button>
      
      <div class="character-header flex justify-between items-end gap-4 mt-6 pb-6">
        <div class="flex items-center gap-4">
          <img src="${portraitUrl}" alt="${charName}" class="character-portrait-large" onerror="this.onerror=null; this.src='/src/images/placeholder.svg';" />
          <div>
            <h1 class="gradient-text m-0">${charName}</h1>
            <p class="text-secondary m-0 mt-1">${getGameName(gameId)} Frame Data</p>
          </div>
        </div>
        <img src="/src/images/logo_${gameId}.png" alt="${getGameName(gameId)} Logo" class="game-header-logo-large" onerror="this.style.display='none';" />
      </div>

      <!-- Controls & Search -->
      <div id="character-table-mount">
        <!-- Will be populated dynamically by loading or drawing -->
        <div class="spinner-container p-12 text-center">
          <div class="spinner"></div>
          <p class="text-muted mt-2">Loading frame data from Supabase cache...</p>
        </div>
      </div>

      <div class="license-footer p-4 text-sm text-center">
        <a href="LICENSES.txt" target="_blank" class="text-muted hover:underline">Image Credits & Licenses</a>
      </div>
    </div>
  `;

  // Attach back button listener
  document.getElementById('btn-back').addEventListener('click', function () {
    navigateCallback('hub');
  });

  // Load the frame data
  store.fetchDustloopData(gameId).then(data => {
    // Check if the game is unsupported
    if (data && data._unsupported) {
      drawUnsupportedState(data.note || 'Data is not supported for this title.');
      return;
    }
    
    rawRows = data || [];
    drawTableContainer();
  }).catch(err => {
    const container = document.getElementById('character-table-mount');
    if (container) {
      container.innerHTML = `
        <div class="unsupported-notice">
          <i class="fa-solid fa-triangle-exclamation unsupported-icon"></i>
          <h3 class="text-danger">Failed to Load Frame Data</h3>
          <p class="text-muted">${err.message || err}</p>
        </div>
      `;
    }
  });

  // Draw notice for unsupported titles (Phase 2 placeholder)
  function drawUnsupportedState(note) {
    const container = document.getElementById('character-table-mount');
    if (!container) return;

    container.innerHTML = `
      <div class="unsupported-notice">
        <i class="fa-solid fa-triangle-exclamation unsupported-icon"></i>
        <h3>Phase 2 Expansion</h3>
        <p class="text-secondary max-w-md mt-2 mb-6">
          HitConfirm currently fetches frame data from Dustloop for Arc System Works titles in Phase 1. 
          Support for this title is coming in Phase 2.
        </p>
        <div class="badge badge-secondary p-3">${note}</div>
      </div>
    `;
  }

  // Draw the wrapper cards, search bar, and mount the table rows
  function drawTableContainer() {
    const container = document.getElementById('character-table-mount');
    if (!container) return;

    // Filter rows belonging to this character first
    const characterRows = rawRows.filter(r => 
      (r.chara || r.Character || r.character || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === 
      charName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    );

    if (characterRows.length === 0) {
      container.innerHTML = `
        <div class="unsupported-notice">
          <i class="fa-solid fa-folder-open unsupported-icon"></i>
          <h3>No Data Available</h3>
          <p class="text-muted">No frame data rows match character "${charName}".</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="table-controls">
        <div class="search-wrapper w-full md:w-72 relative">
          <i class="fa-solid fa-magnifying-glass search-icon absolute left-3 top-1/2 transform -translate-y-1/2 text-muted"></i>
          <input type="text" id="table-search" class="form-input pl-10 w-full" placeholder="Search moves by name or input..." value="${searchQuery}" />
        </div>
      </div>

      <div class="frame-data-card">
        <div class="frame-data-table-wrapper">
          <table class="frame-data-table" id="data-table-el">
            <!-- Table headers and body will be injected here -->
          </table>
        </div>
      </div>
    `;

    // Attach search box listener
    const searchInput = document.getElementById('table-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderRows(characterRows);
      });
    }

    // Initial render of rows
    renderRows(characterRows);
  }

  // Render the table header and body rows based on search and sort states
  function renderRows(filteredRows) {
    const tableEl = document.getElementById('data-table-el');
    if (!tableEl) return;

    // 1. Filter moves matching the search input (name or input)
    let processedRows = filteredRows.filter(row => {
      const name = String(row.name || '').toLowerCase();
      const input = String(row.input || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      return name.includes(query) || input.includes(query);
    });

    // 2. Map columns dynamically based on keys present in the first row
    // We omit 'chara' / 'character' from the table since it's redundant
    const allKeys = processedRows.length > 0 ? Object.keys(processedRows[0]) : [];
    const fieldsToRender = allKeys.filter(key => 
      !['chara', 'character', 'Char'].includes(key)
    );

    // Map fields to friendly header labels
    const friendlyHeaders = fieldsToRender.map(key => {
      switch (key) {
        case 'name': return 'Move';
        case 'input': return 'Command';
        case 'damage': return 'Damage';
        case 'guard': return 'Guard';
        case 'startup': return 'Startup';
        case 'active': return 'Active';
        case 'recovery': return 'Recovery';
        case 'onBlock': return 'On Block';
        case 'onHit': return 'On Hit';
        default: return key.charAt(0).toUpperCase() + key.slice(1);
      }
    });

    // 3. Apply sorting if a field is active
    if (sortByField) {
      processedRows.sort((a, b) => {
        const valA = cleanDustloopValue(a[sortByField] || '');
        const valB = cleanDustloopValue(b[sortByField] || '');

        // Determine if numeric sorting should be used
        const isNumeric = ['startup', 'active', 'recovery', 'onBlock', 'onHit', 'damage'].includes(sortByField);
        
        if (isNumeric) {
          const numA = parseNumericValue(valA);
          const numB = parseNumericValue(valB);
          return sortOrder === 'asc' ? numA - numB : numB - numA;
        } else {
          return sortOrder === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
        }
      });
    }

    // 4. Generate Headers HTML
    const headersHtml = fieldsToRender.map((field, index) => {
      const label = friendlyHeaders[index];
      let sortClass = '';
      if (sortByField === field) {
        sortClass = sortOrder === 'asc' ? 'sorted-asc' : 'sorted-desc';
      }
      return `<th class="frame-data-th ${sortClass}" data-field="${field}">${label}</th>`;
    }).join('');

    // 5. Generate Body HTML
    let bodyHtml = '';
    if (processedRows.length === 0) {
      bodyHtml = `
        <tr>
          <td colspan="${fieldsToRender.length}" class="text-center p-6 text-muted">
            No moves match your search query.
          </td>
        </tr>
      `;
    } else {
      bodyHtml = processedRows.map(row => {
        const cells = fieldsToRender.map(field => {
          const rawVal = row[field];
          const cleanVal = cleanDustloopValue(rawVal);
          
          // Apply color coding for block and hit advantage
          if (['onBlock', 'onHit'].includes(field)) {
            return `<td class="frame-data-td">${formatAdvantageBadge(cleanVal)}</td>`;
          }
          return `<td class="frame-data-td">${escapeHtml(cleanVal)}</td>`;
        }).join('');
        return `<tr class="frame-data-tr">${cells}</tr>`;
      }).join('');
    }

    tableEl.innerHTML = `
      <thead>
        <tr>${headersHtml}</tr>
      </thead>
      <tbody>
        ${bodyHtml}
      </tbody>
    `;

    // 6. Attach sort click handlers to the new headers
    tableEl.querySelectorAll('.frame-data-th').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.getAttribute('data-field');
        if (sortByField === field) {
          sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          sortByField = field;
          sortOrder = 'asc';
        }
        renderRows(filteredRows);
      });
    });
  }
}

// ================================================================
// Helpers
// ================================================================

function getGameName(id) {
  const game = store.getGame(id);
  return game ? game.name : id.toUpperCase();
}

// Helpers imported from ../utils/dustloop-helpers.js

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
