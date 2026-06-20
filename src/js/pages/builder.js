/* Visual Combo Builder Page Controller */
import store from '../store.js';
import { parseComboToHtml, DIRECTION_ARROWS, MOTIONS } from '../utils/combo-parser.js';
import { escapeHtml } from '../utils/security.js';
import { hideGameSidebar } from '../components/game-sidebar.js';
import {
  extractYouTubeVideoId,
  extractTwitchInfo,
  fetchVideoTitle,
  fetchTwitchVideoTitle,
  validateVideoTitle,
  GAME_VIDEO_KEYWORDS
} from '../utils/video-validator.js';

/**
 * Renders the visual combo builder workspace containing the interactive virtual lab pad controls,
 * real-time notation compilation preview, and details submission forms.
 * @param {function} navigateCallback - SPA router callback.
 */
export function renderBuilderPage(navigateCallback) {
  const mount = document.getElementById('content-mount');
  if (!mount) return;

  // Single column focus layout — hide game sidebar
  hideGameSidebar();
  mount.className = 'has-right-sidebar';

  const games = store.getGames();
  
  // Local state for builder
  let selectedGame = '';
  let selectedCharacter = '';
  let notationSequence = []; // Array of combo actions/steps, e.g. ["236HP", "5LP", "623HP"]
  let currentStepBuffer = ''; // Buffer for the step currently being built, e.g. "236" then "236HP"

  mount.innerHTML = `
    <!-- Builder Area (Left) -->
    <div id="builder-left-pane">
      <div>
        <h1>COMBO BUILDER</h1>
        <p class="wiki-empty-text">Interactively construct fighting game combos and generate visual notations.</p>
      </div>

      <!-- Live Preview Card -->
      <div class="card">
        <h4 class="form-label">
          Live Notation Preview
        </h4>
        <div id="builder-live-preview">
          <span class="text-muted">Start clicking the virtual pad below to build your combo...</span>
        </div>
        <div id="builder-buffer-preview">
          <!-- Buffer helper injected here -->
        </div>
        <div class="flex justify-between items-center" style="margin-top: 12px;">
          <span class="form-label">Character: <strong id="preview-char-label">${selectedCharacter || 'None'}</strong> (${games[selectedGame] ? games[selectedGame].name : 'No Game'})</span>
          <button class="btn btn-secondary btn-sm" id="btn-clear-all">Clear Combo</button>
        </div>
      </div>

      <!-- Combo Configurator -->
      <div class="card">
        <div class="flex gap-4" style="flex-wrap: wrap; margin-bottom: 20px;">
          <!-- Game Select -->
          <div style="flex: 1; min-width: 200px;">
            <label class="form-label" for="builder-game-select">Game</label>
            <select id="builder-game-select" name="game" class="form-select">
              <option value="">Select Game</option>
              ${Object.values(games).map(function (g) {
                return `<option value="${g.id}">${g.name}</option>`;
              }).join('')}
            </select>
          </div>
          <!-- Character Select -->
          <div style="flex: 1; min-width: 200px;">
            <label class="form-label" for="builder-char-select">Character</label>
            <div class="flex gap-2">
              <select id="builder-char-select" name="character" class="form-select"></select>
              <button id="btn-add-builder-char" class="btn btn-secondary" style="padding: 0 12px; height: 38px;" title="Add new DLC character">
                <i class="fa-solid fa-plus"></i>
              </button>
            </div>
          </div>
        </div>

        <div>
          <!-- Visual Keypad Panel -->
          <div id="virtual-keypad-container">
            <h4 class="form-label" style="border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 16px;">
              Virtual Lab Pad
            </h4>
            
            <div class="flex flex-col gap-4">
              <!-- Joystick Grid (Numpad) -->
              <div>
                <span class="form-label">1. Joystick Directions</span>
                <div class="flex gap-4" style="flex-wrap: wrap;">
                  <!-- Left: Arrows Grid -->
                  <div class="joystick-grid">
                    <button class="btn btn-secondary pad-dir" data-dir="7">↖</button>
                    <button class="btn btn-secondary pad-dir" data-dir="8">↑</button>
                    <button class="btn btn-secondary pad-dir" data-dir="9">↗</button>
                    
                    <button class="btn btn-secondary pad-dir" data-dir="4">←</button>
                    <button class="btn btn-secondary pad-dir" data-dir="5">•</button>
                    <button class="btn btn-secondary pad-dir" data-dir="6">→</button>
                    
                    <button class="btn btn-secondary pad-dir" data-dir="1">↙</button>
                    <button class="btn btn-secondary pad-dir" data-dir="2">↓</button>
                    <button class="btn btn-secondary pad-dir" data-dir="3">↘</button>
                  </div>
                  
                  <!-- Right: Motion Shortcuts -->
                  <div class="motion-shortcuts">
                    <button class="btn btn-secondary pad-motion btn-sm" data-motion="236">QCF (236)</button>
                    <button class="btn btn-secondary pad-motion btn-sm" data-motion="214">QCB (214)</button>
                    <button class="btn btn-secondary pad-motion btn-sm" data-motion="623">DP (623)</button>
                    <button class="btn btn-secondary pad-motion btn-sm" data-motion="41236">HCF</button>
                    <button class="btn btn-secondary pad-motion btn-sm" data-motion="63214">HCB</button>
                    <button class="btn btn-secondary pad-motion btn-sm" data-motion="5">Neutral</button>
                  </div>
                </div>
              </div>

              <!-- Action Buttons Pad -->
              <div>
                <span class="form-label">2. Attack Buttons</span>
                <div id="attack-buttons-grid">
                  <!-- Dynamic game buttons go here -->
                </div>
              </div>

              <!-- Sequence link tools -->
              <div class="flex gap-2" style="border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 8px;">
                <button class="btn btn-accent btn-sm" id="btn-link-move" style="flex: 2;">
                  <i class="fa-solid fa-arrow-right-long"></i> Link Next Move
                </button>
                <button class="btn btn-secondary btn-sm" id="btn-delete-last" style="flex: 1;" title="Delete last input">
                  <i class="fa-solid fa-delete-left"></i> Undo
                </button>
              </div>
            </div>
          </div>

          <!-- Manual Notation edit Option -->
          <div class="form-group" style="margin-top: 16px;">
            <label class="form-label" for="builder-manual-input">Manual Notation Editor (Optional)</label>
            <input type="text" id="builder-manual-input" name="manualNotation" class="form-input" placeholder="Or type directly (e.g., 236P > 5K > 2D)" />
            <span class="wiki-update-log" style="margin-top: 4px;">Use &gt; or , or -&gt; as move links.</span>
          </div>
        </div>
      </div>

      <!-- Combo Details Submission Form -->
      <div class="card">
        <h3 class="wiki-console-title">
          Combo Details & Publishing
        </h3>
        
        <div class="form-group">
          <label class="form-label" for="combo-title">Combo Title</label>
          <input type="text" id="combo-title" name="title" class="form-input" placeholder="e.g. High Damage Corner Carry, Bread & Butter..." />
        </div>

        <div class="flex gap-4" style="flex-wrap: wrap;">
          <div class="form-group" style="flex: 1; min-width: 120px;">
            <label class="form-label" for="combo-damage">Damage</label>
            <input type="text" id="combo-damage" name="damage" class="form-input" placeholder="e.g. 250 or 2100" />
          </div>
          <div class="form-group" style="flex: 1; min-width: 120px;">
            <label class="form-label" for="combo-meter">Meter Required</label>
            <input type="text" id="combo-meter" name="meter" class="form-input" placeholder="e.g. 50% or 2 Bars" />
          </div>
          <div class="form-group" style="flex: 1; min-width: 120px;">
            <label class="form-label" for="combo-difficulty">Execution Difficulty</label>
            <select id="combo-difficulty" name="difficulty" class="form-select">
              <option value="easy">Easy</option>
              <option value="medium" selected>Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="combo-description">Execution Description/Notes (Optional)</label>
          <textarea id="combo-description" name="description" class="form-textarea" placeholder="Provide tips on timing, counter-hit states, spacing, or matchups..."></textarea>
        </div>

        <div class="form-group">
          <label class="form-label" for="combo-video">Demonstration Video Link (YouTube/Twitch - Optional)</label>
          <div class="video-input-wrapper">
            <i id="combo-video-icon" class="fa-solid fa-video video-input-icon"></i>
            <input type="text" id="combo-video" name="video" class="form-input post-video-input" placeholder="https://www.youtube.com/watch?v=..." />
          </div>
          
          <!-- Format hint -->
          <div id="video-format-hint" class="wiki-comment-item" style="display: none; margin-top: 8px;">
            <i class="fa-solid fa-circle-info" style="color: var(--color-primary); margin-right: 5px;"></i>
            <span id="video-format-hint-text"></span>
          </div>

          <!-- Validation banner -->
          <div id="video-validation-banner" style="display: none; margin-top: 8px;"></div>

          <!-- Confirmation checkbox row -->
          <div id="video-confirm-row" style="display: none; margin-top: 8px;">
            <label class="wiki-comment-user" style="cursor: pointer; display: flex; align-items: flex-start; gap: 10px;" for="video-confirm-checkbox">
              <input type="checkbox" id="video-confirm-checkbox" name="videoConfirm" aria-label="Confirm video relevance" style="width: 16px; height: 16px; margin-top: 2px;">
              <span id="video-confirm-label">I confirm this video is directly relevant to the tagged game and the character shown in the combo.</span>
            </label>
          </div>
        </div>

        <div style="text-align: right; margin-top: 24px;">
          <button class="btn btn-primary" id="btn-publish-combo">Publish to Dojo</button>
        </div>
      </div>
    </div>

    <!-- Sidebar Guidelines (Right) -->
    <div id="builder-sidebar" class="flex flex-col gap-6">
      <div class="card">
        <h3 class="wiki-console-title">
          <i class="fa-solid fa-circle-info"></i> How to Build
        </h3>
        <ol class="dojo-notations-list" style="margin-left: 16px;">
          <li>Select the <strong>Game</strong> and <strong>Character</strong> you are labbing.</li>
          <li>Choose a **Joystick Direction** (like 2/↓ or 236/QCF) from the pad. It buffers into the current step.</li>
          <li>Select an **Attack Button** (like P, K, or LP) to complete the current move and add it!</li>
          <li>Or simply type the raw text into the **Manual Notation Editor**!</li>
          <li>Click **Link Next Move (➔)** to separate individual moves in your sequence.</li>
        </ol>
      </div>
    </div>
  `;

  // Draw characters dropdown
  function drawCharacters(selectValue = null) {
    const charSelect = document.getElementById('builder-char-select');
    if (!charSelect) return;
    
    const game = store.getGame(selectedGame);
    const chars = game ? game.characters : [];
    
    if (chars.length > 0) {
      charSelect.innerHTML = chars.map(function (c) {
        return `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`;
      }).join('');
    } else {
      charSelect.innerHTML = '<option value="">Select Character</option>';
    }
    
    if (selectValue && chars.includes(selectValue)) {
      selectedCharacter = selectValue;
      charSelect.value = selectValue;
    } else {
      selectedCharacter = chars[0] || '';
      if (chars.length > 0) {
        charSelect.value = selectedCharacter;
      } else {
        charSelect.value = '';
      }
    }
    
    const previewChar = document.getElementById('preview-char-label');
    if (previewChar) previewChar.innerText = selectedCharacter || 'None';
  }

  // Draw game specific attack button pad
  function drawAttackButtons() {
    const pad = document.getElementById('attack-buttons-grid');
    if (!pad) return;

    const game = games[selectedGame];
    if (!game) {
      pad.innerHTML = '<span class="text-muted builder-pad-empty-text">Select a game to load buttons.</span>';
      return;
    }
    let buttons = [];

    if (game.notationType === 'gg') {
      buttons = [
        { code: 'P', name: 'Punch', class: 'btn-p' },
        { code: 'K', name: 'Kick', class: 'btn-k' },
        { code: 'S', name: 'Slash', class: 'btn-s' },
        { code: 'HS', name: 'Heavy Slash', class: 'btn-hs' },
        { code: 'D', name: 'Dust', class: 'btn-d' }
      ];
    } else if (game.notationType === 'sf') {
      buttons = [
        { code: 'LP', name: 'Light Punch', class: 'btn-lp' },
        { code: 'MP', name: 'Medium Punch', class: 'btn-mp' },
        { code: 'HP', name: 'Heavy Punch', class: 'btn-hp' },
        { code: 'LK', name: 'Light Kick', class: 'btn-lk' },
        { code: 'MK', name: 'Medium Kick', class: 'btn-mk' },
        { code: 'HK', name: 'Heavy Kick', class: 'btn-hk' }
      ];
    } else if (game.notationType === 'tekken') {
      buttons = [
        { code: '1', name: 'Left Punch (1)', class: 'btn-t1' },
        { code: '2', name: 'Right Punch (2)', class: 'btn-t2' },
        { code: '3', name: 'Left Kick (3)', class: 'btn-t3' },
        { code: '4', name: 'Right Kick (4)', class: 'btn-t4' }
      ];
    } else if (game.notationType === 'smash') {
      buttons = [
        { code: 'A', name: 'Attack (A)', class: 'btn-a' },
        { code: 'B', name: 'Special (B)', class: 'btn-b' },
        { code: 'X', name: 'Jump (X)', class: 'btn-x' },
        { code: 'Y', name: 'Jump (Y)', class: 'btn-y' }
      ];
    }

    pad.innerHTML = buttons.map(function (b) {
      return `
        <button class="btn pad-attack-btn builder-pad-attack-btn ${b.class}" data-btn="${b.code}">
          ${b.code} (${b.name.split(' ')[0]})
        </button>
      `;
    }).join('');

    // Attach attack button events
    pad.querySelectorAll('.pad-attack-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const btnCode = btn.getAttribute('data-btn');
        
        // Append attack to current direction buffer
        // Example: buffer was "236" -> becomes "236P"
        currentStepBuffer += btnCode;
        
        // Push completed step to notation array
        notationSequence.push(currentStepBuffer);
        currentStepBuffer = ''; // reset buffer for next step
        
        updateNotationPreview();
        updateBufferPreview();
      });
    });
  }

  function updateBufferPreview() {
    const bufferMount = document.getElementById('builder-buffer-preview');
    if (!bufferMount) return;

    if (!currentStepBuffer) {
      bufferMount.innerHTML = `<span class="builder-buffer-empty-text">Joystick buffer is empty. Click a direction or motion on the pad above to begin a step.</span>`;
      return;
    }

    let display = '';
    let temp = currentStepBuffer;

    // Check motion
    for (const [num, label] of Object.entries(MOTIONS)) {
      if (temp.startsWith(num)) {
        display += `<span class="combo-motion builder-motion-tag">${label}</span>`;
        temp = temp.substring(num.length);
        break;
      }
    }

    // Check directions
    for (let char of temp) {
      const arrow = DIRECTION_ARROWS[char] || char;
      display += `<span class="combo-dir builder-dir-tag">${arrow}</span>`;
    }

    bufferMount.innerHTML = `
      <div class="flex items-center gap-2 builder-buffer-status-row">
        <span class="builder-buffer-status-label">Buffered:</span>
        <strong class="builder-buffer-status-display">${display || 'Neutral'}</strong>
        <span class="builder-buffer-status-hint">(Select an Attack Button below to add this step)</span>
      </div>
    `;
  }

  // Live preview refresh
  function updateNotationPreview() {
    const previewMount = document.getElementById('builder-live-preview');
    const manualInput = document.getElementById('builder-manual-input');
    if (!previewMount) return;

    // Join with separator
    const notationString = notationSequence.join(' > ');

    if (!notationString) {
      previewMount.innerHTML = `<span class="text-muted font-md">Start clicking the virtual pad below to build your combo...</span>`;
      if (manualInput) manualInput.value = '';
      return;
    }

    previewMount.innerHTML = parseComboToHtml(notationString);
    if (manualInput) {
      manualInput.value = notationString;
    }
  }

  function updateBuilderFormatHint() {
    const formatHint = document.getElementById('video-format-hint');
    const formatHintText = document.getElementById('video-format-hint-text');
    const gameSel = document.getElementById('builder-game-select');
    const charSel = document.getElementById('builder-char-select');
    if (!formatHint || !formatHintText || !gameSel || !charSel) return;

    const gameId = gameSel.value;
    const charName = charSel.value;

    if (!gameId || !charName) {
      formatHint.style.display = 'none';
      return;
    }

    const gameData = GAME_VIDEO_KEYWORDS[gameId];
    if (!gameData) {
      formatHint.style.display = 'none';
      return;
    }

    formatHintText.textContent =
      `Video title must mention the game (e.g. "${gameData.label}") ` +
      `and the character (e.g. "${charName}"). ` +
      `Example: "${gameData.label} - ${charName} BnB Combo Guide"`;
    formatHint.style.display = 'block';
  }

  const resetBuilderValidationUI = function () {
    const validationBanner = document.getElementById('video-validation-banner');
    const confirmRow = document.getElementById('video-confirm-row');
    const confirmCheckbox = document.getElementById('video-confirm-checkbox');
    if (validationBanner) {
      validationBanner.style.display = 'none';
      validationBanner.innerHTML = '';
    }
    if (confirmRow) {
      confirmRow.style.display = 'none';
    }
    if (confirmCheckbox) {
      confirmCheckbox.checked = false;
    }
  };

  const showBuilderConfirmRow = function (gameId) {
    const confirmRow = document.getElementById('video-confirm-row');
    const confirmLabel = document.getElementById('video-confirm-label');
    const confirmCheckbox = document.getElementById('video-confirm-checkbox');
    if (!confirmRow || !confirmLabel || !confirmCheckbox) return;

    const gameData = GAME_VIDEO_KEYWORDS[gameId];
    const gameName = gameData ? gameData.label : 'the tagged game';
    const charName = selectedCharacter || 'the tagged character';
    confirmLabel.textContent =
      `I confirm this video is a ${gameName} combo or clip featuring ${charName}.`;
    confirmRow.style.display = 'block';
    confirmCheckbox.checked = false;
  };

  const renderBuilderValidationBanner = function (result, safeTitle) {
    const validationBanner = document.getElementById('video-validation-banner');
    if (!validationBanner) return;

    if (!result) {
      // oEmbed failed — show neutral info banner, do not block
      validationBanner.style.display = 'block';
      validationBanner.style.background = 'rgba(245,158,11,0.06)';
      validationBanner.style.border = '1px solid rgba(245,158,11,0.2)';
      validationBanner.style.color = 'var(--text-secondary)';
      validationBanner.innerHTML =
        '<i class="fa-solid fa-triangle-exclamation color-accent icon-mr-1"></i>' +
        'Could not verify video title (network issue). The confirmation checkbox is required to continue.';
      showBuilderConfirmRow(selectedGame);
      return;
    }

    if (result.isValid) {
      validationBanner.style.display = 'block';
      validationBanner.style.background = 'rgba(34,197,94,0.06)';
      validationBanner.style.border = '1px solid rgba(34,197,94,0.2)';
      validationBanner.style.color = 'var(--color-success)';
      validationBanner.innerHTML =
        `<i class="fa-solid fa-circle-check icon-mr-1"></i>` +
        `Video "${safeTitle}" looks relevant to <strong>${escapeHtml(result.label)}</strong>. ` +
        `Confirmation checkbox still required before publishing.`;
      showBuilderConfirmRow(selectedGame);
      return;
    }

    // Mismatch — build specific missing-keyword feedback
    const missing = [];
    if (!result.hasGameKeyword) missing.push(`the game name ("${escapeHtml(result.label)}")`);
    if (!result.hasCharKeyword) missing.push('the character name');
    validationBanner.style.display = 'block';
    validationBanner.style.background = 'rgba(239,68,68,0.06)';
    validationBanner.style.border = '1px solid rgba(239,68,68,0.2)';
    validationBanner.style.color = 'var(--color-danger)';
    validationBanner.innerHTML =
      `<i class="fa-solid fa-triangle-exclamation icon-mr-1"></i>` +
      `Video title "${safeTitle}" is missing ${missing.join(' and ')}. ` +
      `Please use a video whose title clearly mentions both. You may still post, ` +
      `but must confirm relevance below.`;
    showBuilderConfirmRow(selectedGame);
  };

  const setupVideoValidationEvents = function () {
    const videoInput = document.getElementById('combo-video');
    const videoIcon = document.getElementById('combo-video-icon');
    const validationBanner = document.getElementById('video-validation-banner');
    const confirmRow = document.getElementById('video-confirm-row');
    if (!videoInput || !videoIcon || !validationBanner) return;

    // Platform icon real-time update on input event
    videoInput.addEventListener('input', function () {
      const val = videoInput.value.trim();
      if (extractYouTubeVideoId(val)) {
        videoIcon.className = 'fa-brands fa-youtube';
        videoIcon.style.color = '#ff0000';
      } else if (extractTwitchInfo(val)) {
        videoIcon.className = 'fa-brands fa-twitch';
        videoIcon.style.color = '#9146ff';
      } else {
        videoIcon.className = 'fa-solid fa-video';
        videoIcon.style.color = 'var(--text-muted)';
      }
    });

    // oEmbed title validation on blur event
    videoInput.addEventListener('blur', async function () {
      const rawUrl = videoInput.value.trim();
      if (!rawUrl) {
        resetBuilderValidationUI();
        return;
      }

      const youtubeId = extractYouTubeVideoId(rawUrl);
      const twitchUrl = extractTwitchInfo(rawUrl);

      if (!youtubeId && !twitchUrl) {
        validationBanner.style.display = 'block';
        validationBanner.style.background = 'rgba(239,68,68,0.06)';
        validationBanner.style.border = '1px solid rgba(239,68,68,0.2)';
        validationBanner.style.color = 'var(--color-danger)';
        validationBanner.innerHTML =
          '<i class="fa-solid fa-link-slash icon-mr-1"></i>' +
          'That does not look like a valid YouTube or Twitch URL. Please use a full YouTube or Twitch link.';
        if (confirmRow) confirmRow.style.display = 'none';
        return;
      }

      validationBanner.style.display = 'block';
      validationBanner.style.background = 'rgba(59,130,246,0.05)';
      validationBanner.style.border = '1px solid rgba(59,130,246,0.12)';
      validationBanner.style.color = 'var(--text-muted)';
      validationBanner.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin icon-mr-1"></i>Checking video title...';

      let rawTitle = null;
      if (youtubeId) {
        rawTitle = await fetchVideoTitle(youtubeId);
      } else if (twitchUrl) {
        rawTitle = await fetchTwitchVideoTitle(twitchUrl);
      }

      const safeTitle = escapeHtml(rawTitle || '');
      const result = rawTitle ? validateVideoTitle(rawTitle, selectedGame, selectedCharacter) : null;
      renderBuilderValidationBanner(result, safeTitle);
    });
  };

  // Initialize Select values
  drawCharacters();
  drawAttackButtons();
  updateBufferPreview();
  updateBuilderFormatHint();
  setupVideoValidationEvents();

  // Attach select change listeners
  const gameSelect = document.getElementById('builder-game-select');
  gameSelect.addEventListener('change', function (e) {
    selectedGame = e.target.value;
    notationSequence = [];
    currentStepBuffer = '';
    drawCharacters();
    drawAttackButtons();
    updateNotationPreview();
    updateBufferPreview();
    updateBuilderFormatHint();
    const videoInput = document.getElementById('combo-video');
    if (videoInput && videoInput.value.trim()) {
      videoInput.dispatchEvent(new Event('blur'));
    } else {
      resetBuilderValidationUI();
    }
  });

  const charSelect = document.getElementById('builder-char-select');
  charSelect.addEventListener('change', function (e) {
    selectedCharacter = e.target.value;
    const previewChar = document.getElementById('preview-char-label');
    if (previewChar) previewChar.innerText = selectedCharacter;
    updateBuilderFormatHint();
    const videoInput = document.getElementById('combo-video');
    if (videoInput && videoInput.value.trim()) {
      videoInput.dispatchEvent(new Event('blur'));
    } else {
      resetBuilderValidationUI();
    }
  });

  // Attach add character listener
  const btnAddChar = document.getElementById('btn-add-builder-char');
  if (btnAddChar) {
    btnAddChar.addEventListener('click', async function () {
      // Check if user is logged in
      if (!store.getCurrentUser()) {
        window.showToast('Please log in or register an account to add new DLC characters.');
        return;
      }
      if (!selectedGame) {
        window.showToast('Please select a game first.');
        return;
      }
      const game = store.getGame(selectedGame);
      const gameName = game ? game.name : selectedGame;
      const charName = window.prompt(`Enter the name of the missing DLC character for ${gameName}:`);
      if (charName === null) return; // User cancelled
      
      const cleanName = charName.trim();
      if (!cleanName) {
        window.showToast('Character name cannot be empty.');
        return;
      }
      
      window.showToast('Adding character to database...');
      const success = await store.addGameCharacter(selectedGame, cleanName);
      if (success) {
        window.showToast(`${cleanName} successfully added!`);
        drawCharacters(cleanName);
        updateBuilderFormatHint();
        const videoInput = document.getElementById('combo-video');
        if (videoInput && videoInput.value.trim()) {
          videoInput.dispatchEvent(new Event('blur'));
        } else {
          resetBuilderValidationUI();
        }
      } else {
        window.showToast('Failed to add character to database.');
      }
    });
  }

  // Attach pad direction listeners (joystick buttons)
  const dirButtons = mount.querySelectorAll('.pad-dir');
  dirButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const dirVal = btn.getAttribute('data-dir');
      // If 5 (neutral), it can stand alone, else prepend it to attack button
      if (dirVal === '5') {
        currentStepBuffer = '5';
      } else {
        currentStepBuffer += dirVal;
      }
      updateBufferPreview();
    });
  });

  const motionButtons = mount.querySelectorAll('.pad-motion');
  motionButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const motionVal = btn.getAttribute('data-motion');
      if (motionVal === '5') {
        currentStepBuffer = '5';
      } else {
        currentStepBuffer = motionVal;
      }
      updateBufferPreview();
    });
  });

  // Attach edit controls
  document.getElementById('btn-link-move').addEventListener('click', function () {
    // Usually link is automatic since attack push closes the step,
    // but if they want to force a blank link slot or manual separation:
    if (currentStepBuffer) {
      notationSequence.push(currentStepBuffer);
      currentStepBuffer = '';
    }
    updateNotationPreview();
    updateBufferPreview();
  });

  document.getElementById('btn-delete-last').addEventListener('click', function () {
    if (currentStepBuffer) {
      currentStepBuffer = '';
    } else {
      notationSequence.pop();
    }
    updateNotationPreview();
    updateBufferPreview();
  });

  document.getElementById('btn-clear-all').addEventListener('click', function () {
    notationSequence = [];
    currentStepBuffer = '';
    updateNotationPreview();
    updateBufferPreview();
    window.showToast('Combo cleared.');
  });

  // Attach manual typing editor change listener
  const manualInput = document.getElementById('builder-manual-input');
  manualInput.addEventListener('input', function (e) {
    const val = e.target.value.trim();
    if (!val) {
      notationSequence = [];
      updateNotationPreview();
      return;
    }
    
    // Split by delimiters
    const steps = val.split(/\s*(?:>|,|->)\s*/);
    notationSequence = steps.filter(function (s) {
      return s.trim() !== '';
    });
    
    const previewMount = document.getElementById('builder-live-preview');
    if (previewMount) {
      previewMount.innerHTML = parseComboToHtml(val);
    }
  });

  // Publish Button click
  document.getElementById('btn-publish-combo').addEventListener('click', async function () {
    if (!selectedGame) {
      window.showToast('Please select a game before publishing.');
      return;
    }
    if (!selectedCharacter) {
      window.showToast('Please select a character before publishing.');
      return;
    }
    const notationVal = manualInput.value.trim();
    if (!notationVal) {
      window.showToast('Please enter a combo sequence notation before publishing.');
      return;
    }

    const titleVal = document.getElementById('combo-title').value.trim();
    if (!titleVal) {
      window.showToast('Please enter a descriptive combo title.');
      return;
    }

    const videoUrlVal = document.getElementById('combo-video').value.trim();
    if (videoUrlVal && !document.getElementById('video-confirm-checkbox').checked) {
      window.showToast('Please confirm that the video is relevant to the tagged game.');
      const confirmRow = document.getElementById('video-confirm-row');
      if (confirmRow) confirmRow.style.display = 'block';
      const confirmCheckbox = document.getElementById('video-confirm-checkbox');
      if (confirmCheckbox) confirmCheckbox.focus();
      return;
    }

    // Explicit acknowledgement browser confirm dialog on publish if video is provided
    if (videoUrlVal) {
      const gameData = GAME_VIDEO_KEYWORDS[selectedGame];
      const gameName = gameData ? gameData.label : selectedGame;
      const charName = selectedCharacter || 'the tagged character';
      const confirmed = window.confirm(
        `Do you acknowledge and confirm that this post represents ${gameName} and features ${charName}?`
      );
      if (!confirmed) return;
    }

    const comboData = {
      game: selectedGame,
      character: selectedCharacter,
      title: titleVal,
      notation: notationVal,
      damage: document.getElementById('combo-damage').value.trim() || 'N/A',
      meter: document.getElementById('combo-meter').value.trim() || 'None',
      difficulty: document.getElementById('combo-difficulty').value,
      description: document.getElementById('combo-description').value.trim(),
      videoUrl: videoUrlVal
    };

    const result = await store.saveCombo(comboData);
    if (result.success) {
      window.showToast('Combo published to Dojo & Feed successfully!');
      // Navigate to Dojo combos tab
      navigateCallback('combos');
    } else {
      window.showToast(result.error || 'Failed to save combo.');
    }
  });
}
