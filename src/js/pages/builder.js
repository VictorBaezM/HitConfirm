/* Visual Combo Builder Page Controller */
import store from '../store.js';
import { parseComboToHtml, DIRECTION_ARROWS, MOTIONS } from '../utils/combo-parser.js';
import { escapeHtml } from '../utils/security.js';
import { hideGameSidebar } from '../components/game-sidebar.js';

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
  let selectedGame = 'sf6';
  let selectedCharacter = games.sf6.characters[0];
  let notationSequence = []; // Array of combo actions/steps, e.g. ["236HP", "5LP", "623HP"]
  let currentStepBuffer = ''; // Buffer for the step currently being built, e.g. "236" then "236HP"

  mount.innerHTML = `
    <!-- Builder Area (Left) -->
    <div id="builder-left-pane">
      <div style="margin-bottom: 24px;">
        <h1 class="gradient-text" style="font-size: 1.8rem;">COMBO BUILDER</h1>
        <p style="color: var(--text-secondary); font-size: 0.9rem;">Interactively construct fighting game combos and generate visual notations.</p>
      </div>

      <!-- Live Preview Card -->
      <div class="card" style="border-color: var(--color-secondary); margin-bottom: 24px; background: linear-gradient(180deg, rgba(0,240,255,0.02) 0%, rgba(0,0,0,0) 100%);">
        <h4 style="font-family: var(--font-heading); color: var(--color-secondary); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
          Live Notation Preview
        </h4>
        <div id="builder-live-preview" style="min-height: 70px; display: flex; align-items: center;">
          <span class="text-muted" style="font-size: 0.9rem;">Start clicking the virtual pad below to build your combo...</span>
        </div>
        <div id="builder-buffer-preview" style="margin-top: 8px; font-size: 0.85rem; min-height: 20px;">
          <!-- Buffer helper injected here -->
        </div>
        <div class="flex justify-between items-center" style="margin-top: 12px; font-size: 0.8rem; color: var(--text-muted);">
          <span>Character: <strong id="preview-char-label" style="color:var(--text-primary);">${selectedCharacter}</strong> (${games[selectedGame].name})</span>
          <button class="btn btn-secondary btn-sm" id="btn-clear-all" style="padding: 4px 10px; font-size: 0.75rem;">Clear Combo</button>
        </div>
      </div>

      <!-- Combo Configurator -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="flex gap-4" style="flex-wrap: wrap; margin-bottom: 20px;">
          <!-- Game Select -->
          <div style="flex: 1; min-width: 200px;">
            <label class="form-label">Game</label>
            <select id="builder-game-select" class="form-select">
              ${Object.values(games).map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
            </select>
          </div>
          <!-- Character Select -->
          <div style="flex: 1; min-width: 200px;">
            <label class="form-label">Character</label>
            <div style="display: flex; gap: 8px;">
              <select id="builder-char-select" class="form-select" style="flex: 1;"></select>
              <button id="btn-add-builder-char" class="btn btn-secondary" style="padding: 0 12px; height: 38px; display: flex; align-items: center; justify-content: center; min-width: 38px;" title="Add new DLC character">
                <i class="fa-solid fa-plus"></i>
              </button>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr; gap: 24px;">
          <!-- Visual Keypad Panel -->
          <div id="virtual-keypad-container" style="background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); padding: 20px; border-radius: var(--radius-sm);">
            <h4 style="font-size: 0.95rem; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
              Virtual Lab Pad
            </h4>
            
            <div style="display: grid; grid-template-columns: 1fr; gap: 16px;">
              <!-- Joystick Grid (Numpad) -->
              <div>
                <span class="form-label" style="font-size: 0.8rem;">1. Joystick Directions</span>
                <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                  <!-- Left: Arrows Grid -->
                  <div style="display: grid; grid-template-columns: repeat(3, 40px); gap: 6px; width: 132px; justify-content: center; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 6px;">
                    <button class="btn btn-secondary pad-dir" data-dir="7" style="padding:0; width:40px; height:40px;">↖</button>
                    <button class="btn btn-secondary pad-dir" data-dir="8" style="padding:0; width:40px; height:40px;">↑</button>
                    <button class="btn btn-secondary pad-dir" data-dir="9" style="padding:0; width:40px; height:40px;">↗</button>
                    
                    <button class="btn btn-secondary pad-dir" data-dir="4" style="padding:0; width:40px; height:40px;">←</button>
                    <button class="btn btn-secondary pad-dir" data-dir="5" style="padding:0; width:40px; height:40px;">•</button>
                    <button class="btn btn-secondary pad-dir" data-dir="6" style="padding:0; width:40px; height:40px;">→</button>
                    
                    <button class="btn btn-secondary pad-dir" data-dir="1" style="padding:0; width:40px; height:40px;">↙</button>
                    <button class="btn btn-secondary pad-dir" data-dir="2" style="padding:0; width:40px; height:40px;">↓</button>
                    <button class="btn btn-secondary pad-dir" data-dir="3" style="padding:0; width:40px; height:40px;">↘</button>
                  </div>
                  
                  <!-- Right: Motion Shortcuts -->
                  <div style="flex: 1; min-width: 140px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; align-content: start;">
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
                <span class="form-label" style="font-size: 0.8rem;">2. Attack Buttons</span>
                <div id="attack-buttons-grid" style="display: flex; flex-wrap: wrap; gap: 8px;">
                  <!-- Dynamic game buttons go here -->
                </div>
              </div>

              <!-- Sequence link tools -->
              <div class="flex gap-2" style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px; margin-top: 8px;">
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
          <div>
            <label class="form-label">Manual Notation Editor (Optional)</label>
            <input type="text" id="builder-manual-input" class="form-input" placeholder="Or type directly (e.g., 236P > 5K > 2D)" style="font-family: var(--font-mono); font-size: 0.85rem;" />
            <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 4px;">Use <strong>&gt;</strong> or <strong>,</strong> or <strong>-&gt;</strong> as move links.</span>
          </div>
        </div>
      </div>

      <!-- Combo Details Submission Form -->
      <div class="card" style="margin-bottom: 24px;">
        <h3 style="font-size: 1.1rem; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
          Combo Details & Publishing
        </h3>
        
        <div class="form-group">
          <label class="form-label">Combo Title</label>
          <input type="text" id="combo-title" class="form-input" placeholder="e.g. High Damage Corner Carry, Bread & Butter..." />
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 16px; margin-bottom: 16px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Damage (or scaling)</label>
            <input type="text" id="combo-damage" class="form-input" placeholder="e.g. 250 or 2100" />
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Meter Required</label>
            <input type="text" id="combo-meter" class="form-input" placeholder="e.g. 50% or 2 Bars" />
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Execution Difficulty</label>
            <select id="combo-difficulty" class="form-select">
              <option value="easy">Easy</option>
              <option value="medium" selected>Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Execution Description/Notes (Optional)</label>
          <textarea id="combo-description" class="form-textarea" placeholder="Provide tips on timing, counter-hit states, spacing, or matchups..."></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Demonstration Video Link (YouTube/Twitch - Optional)</label>
          <input type="text" id="combo-video" class="form-input" placeholder="https://www.youtube.com/watch?v=..." />
        </div>

        <div style="text-align: right; margin-top: 24px;">
          <button class="btn btn-primary" id="btn-publish-combo">Publish to Dojo</button>
        </div>
      </div>
    </div>

    <!-- Sidebar Guidelines (Right) -->
    <div id="builder-sidebar" class="flex flex-col gap-6">
      <div class="card" style="padding: 20px;">
        <h3 style="font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 12px;">
          <i class="fa-solid fa-circle-info" style="color: var(--color-primary);"></i> How to Build
        </h3>
        <ol style="padding-left: 18px; font-size: 0.85rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 8px;">
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
  const drawCharacters = (selectValue = null) => {
    const charSelect = document.getElementById('builder-char-select');
    if (!charSelect) return;
    
    const game = store.getGame(selectedGame);
    const chars = game ? game.characters : [];
    charSelect.innerHTML = chars.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    
    if (selectValue && chars.includes(selectValue)) {
      selectedCharacter = selectValue;
      charSelect.value = selectValue;
    } else {
      selectedCharacter = chars[0] || '';
      if (chars.length > 0) charSelect.value = selectedCharacter;
    }
    
    const previewChar = document.getElementById('preview-char-label');
    if (previewChar) previewChar.innerText = selectedCharacter;
  };

  // Draw game specific attack button pad
  const drawAttackButtons = () => {
    const pad = document.getElementById('attack-buttons-grid');
    if (!pad) return;

    const game = games[selectedGame];
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

    pad.innerHTML = buttons.map(b => `
      <button class="btn pad-attack-btn ${b.class}" data-btn="${b.code}" style="padding: 8px 12px; font-size: 0.8rem; text-transform: uppercase;">
        ${b.code} (${b.name.split(' ')[0]})
      </button>
    `).join('');

    // Attach attack button events
    pad.querySelectorAll('.pad-attack-btn').forEach(btn => {
      btn.addEventListener('click', () => {
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
  };

  const updateBufferPreview = () => {
    const bufferMount = document.getElementById('builder-buffer-preview');
    if (!bufferMount) return;

    if (!currentStepBuffer) {
      bufferMount.innerHTML = `<span style="color: var(--text-muted); font-size: 0.8rem; font-weight: normal;">Joystick buffer is empty. Click a direction or motion on the pad above to begin a step.</span>`;
      return;
    }

    let display = '';
    let temp = currentStepBuffer;

    // Check motion
    for (const [num, label] of Object.entries(MOTIONS)) {
      if (temp.startsWith(num)) {
        display += `<span class="combo-motion" style="margin-right: 4px; font-size: 0.75rem; padding: 2px 6px;">${label}</span>`;
        temp = temp.substring(num.length);
        break;
      }
    }

    // Check directions
    for (let char of temp) {
      const arrow = DIRECTION_ARROWS[char] || char;
      display += `<span class="combo-dir" style="display: inline-block; font-size: 1.1rem; vertical-align: middle; margin-right: 4px;">${arrow}</span>`;
    }

    bufferMount.innerHTML = `
      <div class="flex items-center gap-2" style="background: rgba(255, 170, 0, 0.05); border: 1px dashed rgba(255, 170, 0, 0.3); padding: 8px 12px; border-radius: 6px; width: fit-content;">
        <span style="color: var(--color-accent); font-size: 0.75rem; font-family: var(--font-heading); text-transform: uppercase;">Buffered:</span>
        <strong style="font-size: 1rem; display: flex; align-items: center;">${display || 'Neutral'}</strong>
        <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: normal; margin-left: 6px;">(Select an Attack Button below to add this step)</span>
      </div>
    `;
  };

  // Live preview refresh
  const updateNotationPreview = () => {
    const previewMount = document.getElementById('builder-live-preview');
    const manualInput = document.getElementById('builder-manual-input');
    if (!previewMount) return;

    // Join with separator
    const notationString = notationSequence.join(' > ');

    if (!notationString) {
      previewMount.innerHTML = `<span class="text-muted" style="font-size: 0.9rem;">Start clicking the virtual pad below to build your combo...</span>`;
      if (manualInput) manualInput.value = '';
      return;
    }

    previewMount.innerHTML = parseComboToHtml(notationString);
    if (manualInput) {
      manualInput.value = notationString;
    }
  };

  // Initialize Select values
  drawCharacters();
  drawAttackButtons();
  updateBufferPreview();

  // Attach select change listeners
  const gameSelect = document.getElementById('builder-game-select');
  gameSelect.addEventListener('change', (e) => {
    selectedGame = e.target.value;
    notationSequence = [];
    currentStepBuffer = '';
    drawCharacters();
    drawAttackButtons();
    updateNotationPreview();
    updateBufferPreview();
  });

  const charSelect = document.getElementById('builder-char-select');
  charSelect.addEventListener('change', (e) => {
    selectedCharacter = e.target.value;
    const previewChar = document.getElementById('preview-char-label');
    if (previewChar) previewChar.innerText = selectedCharacter;
  });

  // Attach add character listener
  const btnAddChar = document.getElementById('btn-add-builder-char');
  if (btnAddChar) {
    btnAddChar.addEventListener('click', async () => {
      // Check if user is logged in
      if (!store.getCurrentUser()) {
        window.showToast('Please log in or register an account to add new DLC characters.');
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
      } else {
        window.showToast('Failed to add character to database.');
      }
    });
  }

  // Attach pad direction listeners (joystick buttons)
  const dirButtons = mount.querySelectorAll('.pad-dir');
  dirButtons.forEach(btn => {
    btn.addEventListener('click', () => {
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
  motionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
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
  document.getElementById('btn-link-move').addEventListener('click', () => {
    // Usually link is automatic since attack push closes the step,
    // but if they want to force a blank link slot or manual separation:
    if (currentStepBuffer) {
      notationSequence.push(currentStepBuffer);
      currentStepBuffer = '';
    }
    updateNotationPreview();
    updateBufferPreview();
  });

  document.getElementById('btn-delete-last').addEventListener('click', () => {
    if (currentStepBuffer) {
      currentStepBuffer = '';
    } else {
      notationSequence.pop();
    }
    updateNotationPreview();
    updateBufferPreview();
  });

  document.getElementById('btn-clear-all').addEventListener('click', () => {
    notationSequence = [];
    currentStepBuffer = '';
    updateNotationPreview();
    updateBufferPreview();
    window.showToast('Combo cleared.');
  });

  // Attach manual typing editor change listener
  const manualInput = document.getElementById('builder-manual-input');
  manualInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    if (!val) {
      notationSequence = [];
      updateNotationPreview();
      return;
    }
    
    // Split by delimiters
    const steps = val.split(/\s*(?:>|,|->)\s*/);
    notationSequence = steps.filter(s => s.trim() !== '');
    
    const previewMount = document.getElementById('builder-live-preview');
    if (previewMount) {
      previewMount.innerHTML = parseComboToHtml(val);
    }
  });

  // Publish Button click
  document.getElementById('btn-publish-combo').addEventListener('click', async () => {
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

    const comboData = {
      game: selectedGame,
      character: selectedCharacter,
      title: titleVal,
      notation: notationVal,
      damage: document.getElementById('combo-damage').value.trim() || 'N/A',
      meter: document.getElementById('combo-meter').value.trim() || 'None',
      difficulty: document.getElementById('combo-difficulty').value,
      description: document.getElementById('combo-description').value.trim(),
      videoUrl: document.getElementById('combo-video').value.trim()
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
