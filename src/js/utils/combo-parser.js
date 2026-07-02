/* Combo Notation Visual Parser */
import { escapeHtml } from './security.js';

// Directional mappings (Numpad notation)
export const DIRECTION_ARROWS = {
  '1': '↙',
  '2': '↓',
  '3': '↘',
  '4': '←',
  '5': '•', // Neutral
  '6': '→',
  '7': '↖',
  '8': '↑',
  '9': '↗',
  // Standard character arrow directions
  'd/f': '↘',
  'd/b': '↙',
  'u/f': '↗',
  'u/b': '↖',
  'f': '→',
  'b': '←',
  'd': '↓',
  'u': '↑'
};

export const MOTIONS = {
  '236': 'QCF',
  '214': 'QCB',
  '623': 'DP',
  '421': 'RDP',
  '41236': 'HCF',
  '63214': 'HCB',
  '32146': 'TK'
};

// Button classifications
const BUTTON_CLASSES = {
  // GG / Anime
  'p': 'btn-p',
  'k': 'btn-k',
  's': 'btn-s',
  'hs': 'btn-hs',
  'd': 'btn-d',
  'u': 'btn-u',

  // Granblue
  'l': 'btn-l',
  'm': 'btn-m',
  'h': 'btn-h',
  
  // Street Fighter
  'lp': 'btn-lp',
  'mp': 'btn-mp',
  'hp': 'btn-hp',
  'lk': 'btn-lk',
  'mk': 'btn-mk',
  'hk': 'btn-hk',

  // Tekken
  '1': 'btn-t1',
  '2': 'btn-t2',
  '3': 'btn-t3',
  '4': 'btn-t4',

  // Smash
  'a': 'btn-a',
  'b': 'btn-b',
  'x': 'btn-x',
  'y': 'btn-y'
};

/**
 * Parses a single fighting game combo notation step (e.g. "236HS" or "d/f+2")
 * into visual joystick arrow and styled action button HTML tags.
 * @param {string} stepStr - The move input string.
 * @returns {string} - The generated HTML string representing the styled move.
 */
function parseComboStep(stepStr) {
  let trimmed = escapeHtml(stepStr.trim());
  if (!trimmed) return '';

  let html = `<div class="combo-step">`;
  let parsedAny = false;

  // 1. Check for specific motion inputs (like 236, 214) at the start
  for (const [num, label] of Object.entries(MOTIONS)) {
    if (trimmed.startsWith(num)) {
      html += `<span class="combo-motion">${label}</span>`;
      trimmed = trimmed.substring(num.length);
      parsedAny = true;
      break;
    }
  }

  // 2. Check for directional inputs/modifers
  // Sort keys by length descending to match longer strings first (like 'd/f' before 'd')
  const directionKeys = Object.keys(DIRECTION_ARROWS).sort(function (a, b) { return b.length - a.length; });
  
  // We can loop to parse directions and modifiers (+ signs, etc.)
  let matchedDir = true;
  while (matchedDir && trimmed.length > 0) {
    matchedDir = false;
    for (const dirKey of directionKeys) {
      if (trimmed.toLowerCase().startsWith(dirKey) && 
          // Ensure we don't accidentally consume numbers meant for Tekken buttons if it's not a sole direction
          !(dirKey === '1' || dirKey === '2' || dirKey === '3' || dirKey === '4' ? trimmed.length === 1 : false)) {
        
        const arrow = DIRECTION_ARROWS[dirKey];
        html += `<span class="combo-dir" title="Direction ${dirKey}">${arrow}</span>`;
        trimmed = trimmed.substring(dirKey.length);
        
        // Skip '+' symbols if they separate directions from buttons (e.g. d/f+2)
        if (trimmed.startsWith('+')) {
          trimmed = trimmed.substring(1);
        }
        
        parsedAny = true;
        matchedDir = true;
        break;
      }
    }
  }

  // 3. Process remaining action button codes
  // We can look for buttons (P, K, S, HS, D, LP, MP, HP, LK, MK, HK, etc.)
  let remaining = trimmed.toLowerCase();
  
  // Special prefixes like 'c.' or 'f.' in Guilty Gear (close/far slash)
  if (remaining.startsWith('c.') || remaining.startsWith('f.')) {
    const prefix = remaining.substring(0, 2);
    html += `<span class="text-muted builder-pad-empty-text">${prefix}</span>`;
    remaining = remaining.substring(2);
  }

  // Look for matchable buttons in the remaining string
  const buttonKeys = Object.keys(BUTTON_CLASSES).sort(function (a, b) { return b.length - a.length; });
  
  while (remaining.length > 0) {
    let abbrevMatched = false;
    for (const abbrev of ['ssl', 'ssr', 'ws', 'wr', 'fc', 'ss', 'ch']) {
      if (remaining.startsWith(abbrev)) {
        html += `<span class="combo-custom-action">${abbrev.toUpperCase()}</span>`;
        remaining = remaining.substring(abbrev.length);
        if (remaining.startsWith('+')) {
          remaining = remaining.substring(1);
        }
        abbrevMatched = true;
        break;
      }
    }
    if (abbrevMatched) {
      parsedAny = true;
      continue;
    }

    let buttonMatched = false;
    for (const btnKey of buttonKeys) {
      if (remaining.startsWith(btnKey)) {
        const btnClass = BUTTON_CLASSES[btnKey];
        html += `<span class="combo-btn ${btnClass}">${btnKey.toUpperCase()}</span>`;
        remaining = remaining.substring(btnKey.length);
        
        // Skip '+' between buttons
        if (remaining.startsWith('+')) {
          remaining = remaining.substring(1);
        }
        
        buttonMatched = true;
        parsedAny = true;
        break;
      }
    }

    if (!buttonMatched) {
      // If we can't parse a specific letter, just output it as custom text inside the step bubble
      const char = remaining.charAt(0).toUpperCase();
      html += `<span class="combo-custom-action">${char}</span>`;
      remaining = remaining.substring(1);
      parsedAny = true;
    }
  }

  // Fallback if we couldn't parse anything
  if (!parsedAny) {
    return `<span class="combo-text-fallback">${stepStr}</span>`;
  }

  html += `</div>`;
  return html;
}

/**
 * Main parser entry point. Takes a full combo notation sequence (e.g. "5K > 2D > 214K"),
 * normalizes delimiters, and converts it into a full sequence of beautiful HTML elements.
 * @param {string} notationString - The raw fighting game combo notation sequence string.
 * @returns {string} - Generated HTML content displaying the full graphical input list.
 */
export function parseComboToHtml(notationString) {
  if (!notationString) return '<span class="text-muted">No inputs recorded</span>';

  // Normalize delimiters (replace '->' or ',' with '>')
  let normalized = notationString
    .replace(/\s*->\s*/g, ' > ')
    .replace(/\s*,\s*/g, ' > ')
    .replace(/\s*>\s*/g, ' > ');

  const steps = normalized.split('>');
  
  let html = `<div class="combo-sequence">`;
  
  steps.forEach(function (step, idx) {
    if (idx > 0) {
      html += `<span class="combo-flow">➔</span>`;
    }
    html += parseComboStep(step);
  });

  html += `</div>`;
  return html;
}

/**
 * Standard visual HTML rendering wrapper for fighting game combo notations.
 * Used uniformly across timeline feed posts and dojo combo cards.
 * @param {string} notationString - The raw numpad/text combo notation string.
 * @returns {string} - Styled HTML markup block representing the sequence.
 */
export function renderNotationHtml(notationString) {
  if (!notationString || !notationString.trim()) return '';
  return `
    <div class="wiki-combo-sequence">
      ${parseComboToHtml(notationString)}
      <div class="wiki-notation-helper">
        <span class="material-symbols-rounded">help</span>
        <div class="wiki-notation-tooltip">
          <div class="tooltip-title">Reading Notations</div>
          <ul>
            <li><strong>Anime (GG):</strong> Numpad directions (e.g., 236 = QCF) and buttons: <strong>P</strong> (Punch), <strong>K</strong> (Kick), <strong>S</strong> (Slash), <strong>HS</strong> (Heavy), <strong>D</strong> (Dust).</li>
            <li><strong>SF6:</strong> Classic directions (2MK = cr.MK) and buttons: <strong>LP/LK</strong>, <strong>MP/MK</strong>, <strong>HP/HK</strong>.</li>
            <li><strong>Tekken:</strong> Buttons <strong>1</strong> (LP), <strong>2</strong> (RP), <strong>3</strong> (LK), <strong>4</strong> (RK) with arrow directions.</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

// Directional emojis mapping (numpad direction standard P1)
const DIRECTION_EMOJIS = {
  '1': '↙️',
  '2': '⬇️',
  '3': '↘️',
  '4': '⬅️',
  '5': '🟡',
  '6': '➡️',
  '7': '↖️',
  '8': '⬆️',
  '9': '↗️',
  'd/f': '↘️',
  'd/b': '↙️',
  'u/f': '↗️',
  'u/b': '↖️',
  'f': '➡️',
  'b': '⬅️',
  'd': '⬇️',
  'u': '⬆️',
  'db': '↙️',
  'df': '↘️',
  'ub': '↖️',
  'uf': '↗️'
};

const MOTION_EMOJIS = {
  '1632143': '↙️⬅️↙️⬇️↘️➡️↘️',
  '3412361': '↘️➡️↘️⬇️↙️⬅️↙️',
  '41236987': '⬅️↙️⬇️↘️➡️↗️⬆️↖️',
  '4268': '⬅️↙️⬇️↘️➡️↗️⬆️↖️',
  '63214789': '➡️↘️⬇️↙️⬅️↖️⬆️↗️',
  '6248': '➡️↘️⬇️↙️⬅️↖️⬆️↗️',
  '41236': '⬅️↙️⬇️↘️➡️',
  '426': '⬅️↙️⬇️↘️➡️',
  'hcf': '⬅️↙️⬇️↘️➡️',
  '63214': '➡️↘️⬇️↙️⬅️',
  '624': '➡️↘️⬇️↙️⬅️',
  'hcb': '➡️↘️⬇️↙️⬅️',
  '236': '⬇️↘️➡️',
  'qcf': '⬇️↘️➡️',
  '214': '⬇️↙️⬅️',
  'qcb': '⬇️↙️⬅️',
  '698': '➡️↗️⬆️',
  '478': '⬅️↖️⬆️',
  '632': '➡️↘️⬇️',
  '412': '⬅️↙️⬇️',
  '896': '⬆️↗️➡️',
  '874': '⬆️↖️⬅️',
  '623': '➡️⬇️↘️',
  'dp': '➡️⬇️↘️',
  '421': '⬅️⬇️↙️',
  'rdp': '⬅️⬇️↙️'
};

const STATE_PREFIXES = {
  'j.': 'j.',
  'jc.': 'jc.',
  'ch.': 'ch.',
  'cr.': 'cr.',
  's.': 's.',
  'st.': 'st.',
  'c.': 'c.',
  'cl.': 'c.',
  'f.': 'f.',
  'ws.': 'ws.',
  'ws': 'ws.'
};

const DELIMITER_MAP = {
  '>': ' > ',
  '->': ' > ',
  ',': ' , ',
  'xx': ' xx ',
  '~': ' ~ '
};

function normalizeCommunitySlang(str, gameId) {
  let res = str.toLowerCase();
  
  // Remove commas inside parentheses to prevent splitting on them as step delimiters
  res = res.replace(/\(([^)]+)\)/g, (match, p1) => {
    return `(${p1.replace(/,/g, ' ')})`;
  });
  
  // 1. Spacing around plus signs
  res = res.replace(/\s*\+\s*/g, '+');

  // 2. SF/2D button slang combinations involving "forward" (medium kick)
  res = res.replace(/\b(?:crouching|crouch|cr)\s+forward\b/g, 'cr.MK');
  res = res.replace(/\b(?:standing|stand|st|s)\s+forward\b/g, 's.MK');
  
  // 3. Diagonal and cardinal direction words (game-aware mapping)
  const useLetter = gameId === 't8';
  const dirWords = [
    [/\bdown[- ]forward\b/g, useLetter ? 'df' : '3'],
    [/\bdown[- ]back\b/g,    useLetter ? 'db' : '1'],
    [/\bup[- ]forward\b/g,   useLetter ? 'uf' : '9'],
    [/\bup[- ]back\b/g,      useLetter ? 'ub' : '7'],
    [/\bdownforward\b/g,     useLetter ? 'df' : '3'],
    [/\bdownback\b/g,        useLetter ? 'db' : '1'],
    [/\bupforward\b/g,       useLetter ? 'uf' : '9'],
    [/\bupback\b/g,          useLetter ? 'ub' : '7'],
    [/\bneutral\b/g,         '5'],
    [/\b(?:forward|fwd)\b/g, useLetter ? 'f' : '6'],
    [/\bback\b/g,            useLetter ? 'b' : '4'],
    [/\bdown\b/g,            useLetter ? 'd' : '2'],
    [/\bup\b/g,              useLetter ? 'u' : '8']
  ];
  for (const [pattern, replacement] of dirWords) {
    res = res.replace(pattern, replacement);
  }

  // 4. Positional & State Slang with negative lookahead to prevent double dots
  const stateSlang = [
    [/\b(?:crouching|crouch|cr|low)\b(?!\.)/g, 'cr.'],
    [/\b(?:standing|stand|st|s)\b(?!\.)/g,     's.'],
    [/\b(?:jumping|jump|j|air)\b(?!\.)(?!\s+(?:ok|only)\b)/g,      'j.'],
    [/\b(?:while standing|ws)\b(?!\.)/g,       'ws.']
  ];
  for (const [pattern, replacement] of stateSlang) {
    res = res.replace(pattern, replacement);
  }

  // 5. Button Strengths & Synonyms (ordered: full phrases before single terms)
  const buttonSlang = [
    [/\bmedium\s+punch\b/g, 'MP'], [/\bmedium\s+kick\b/g, 'MK'],
    [/\blight\s+punch\b/g,  'LP'], [/\blight\s+kick\b/g,  'LK'],
    [/\bheavy\s+punch\b/g,  'HP'], [/\bheavy\s+kick\b/g,  'HK'],
    [/\bjab\b/g, 'LP'],   [/\bshort\b/g, 'LK'],  [/\bstrong\b/g, 'MP'],
    [/\bfierce\b/g, 'HP'], [/\broundhouse\b/g, 'HK'], [/\brh\b/g, 'HK'],
    [/\bmedium\b/g, 'M'],  [/\bmed\b/g, 'M'],     [/\blight\b/g, 'L'],
    [/\bheavy\b/g, 'H'],   [/\bpunch\b/g, 'P'],   [/\bkick\b/g, 'K']
  ];
  for (const [pattern, replacement] of buttonSlang) {
    res = res.replace(pattern, replacement);
  }

  return res;
}

function translateStepToEmoji(stepStr, gameId) {
  let trimmed = stepStr.trim();
  if (!trimmed) return '';

  let prefixHtml = '';
  
  for (const [key, value] of Object.entries(STATE_PREFIXES)) {
    const escKey = key.replace(/\./g, '\\.');
    const regex = new RegExp('^' + escKey, 'i');
    if (regex.test(trimmed)) {
      prefixHtml += value;
      trimmed = trimmed.replace(regex, '');
      break;
    }
  }

  let remaining = trimmed.trim();
  let motionHtml = '';
  let dirHtml = '';
  let buttonHtml = '';

  let matchedCharge = true;
  while (matchedCharge) {
    matchedCharge = false;
    const chargeMatch = remaining.match(/^\[([1-9]|[a-z/]+)\]/i);
    if (chargeMatch) {
      const inner = chargeMatch[1].toLowerCase();
      const arrow = DIRECTION_EMOJIS[inner] || inner.toUpperCase();
      dirHtml += `[${arrow}] `;
      remaining = remaining.substring(chargeMatch[0].length).trim();
      matchedCharge = true;
    }
  }

  let matchedRelease = true;
  while (matchedRelease) {
    matchedRelease = false;
    const releaseMatch = remaining.match(/^\]([a-z0-9])\[/i);
    if (releaseMatch) {
      const inner = releaseMatch[1].toLowerCase();
      const arrow = DIRECTION_EMOJIS[inner];
      const display = arrow || inner.toUpperCase();
      dirHtml += `]${display}[ `;
      remaining = remaining.substring(releaseMatch[0].length).trim();
      matchedRelease = true;
    }
  }

  if (gameId !== 't8') {
    for (const [num, emoji] of Object.entries(MOTION_EMOJIS)) {
      const regex = new RegExp('^' + num, 'i');
      if (regex.test(remaining)) {
        motionHtml += emoji;
        remaining = remaining.replace(regex, '').trim();
        break;
      }
    }
  }

  const directionKeys = Object.keys(DIRECTION_EMOJIS).sort((a, b) => b.length - a.length);
  let matchedDir = true;
  while (matchedDir && remaining.length > 0) {
    matchedDir = false;
    for (const dirKey of directionKeys) {
      if (gameId === 't8' && ['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(dirKey)) {
        continue;
      }
      // Only restrict single-letter directions (d, f, b, u) in non-Tekken games.
      // Two-letter direction keys like 'df', 'db', 'uf', 'ub' can be safely processed in any game.
      const isLetterDir = ['d', 'f', 'b', 'u'].includes(dirKey);
      if (isLetterDir && gameId !== 't8') {
        continue;
      }
      
      const regex = new RegExp('^' + dirKey.replace(/\//g, '\\/'), 'i');
      if (regex.test(remaining)) {
        if (!(dirKey === '1' || dirKey === '2' || dirKey === '3' || dirKey === '4' ? remaining.length === 1 : false)) {
          dirHtml += DIRECTION_EMOJIS[dirKey];
          remaining = remaining.replace(regex, '').trim();
          matchedDir = true;
          break;
        }
      }
    }
    if (remaining.startsWith('+')) {
      remaining = remaining.substring(1).trim();
      matchedDir = true;
    }
  }

  if (remaining.length > 0) {
    if (remaining.startsWith('+')) {
      remaining = remaining.substring(1).trim();
    }
    buttonHtml = remaining.toUpperCase();
  }

  dirHtml = dirHtml.trim();

  let parts = [];
  if (prefixHtml) parts.push(prefixHtml);
  
  let motionAndDir = '';
  if (motionHtml) motionAndDir += motionHtml;
  if (dirHtml) motionAndDir += (motionHtml ? ' ' : '') + dirHtml;
  if (motionAndDir) parts.push(motionAndDir);
  
  if (buttonHtml) parts.push(buttonHtml);

  return parts.join(' ');
}

/**
 * Translates combo notation step-by-step into clean unicode text emojis for copy-paste sharing.
 * @param {string} notationStr - The raw text combo notation string.
 * @param {string} gameId - The ID of the active game context.
 * @returns {string} - Plain-text emoji representation of the input string.
 */
export function translateNotationToEmoji(notationStr, gameId) {
  if (!notationStr) return '';

  const normalizedSlang = normalizeCommunitySlang(notationStr, gameId);

  const regex = /(\s*(?:>|->|xx|~|,)\s*)/g;
  const tokens = normalizedSlang.split(regex);

  let resultStr = '';
  tokens.forEach(token => {
    const trimmedToken = token.trim();
    if (!trimmedToken) return;

    if (['>', '->', 'xx', '~', ','].includes(trimmedToken)) {
      const displayDelim = DELIMITER_MAP[trimmedToken] || trimmedToken;
      resultStr += displayDelim;
    } else {
      resultStr += translateStepToEmoji(trimmedToken, gameId);
    }
  });

  return resultStr.trim();
}

// Inject joystick animations into document head at runtime
if (typeof document !== 'undefined') {
  if (!document.getElementById('joystick-animations-css')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'joystick-animations-css';
    styleEl.textContent = `
      /* Notation visibility toggling rules */
      .combo-sequence .notation-joystick {
        display: none !important;
      }
      .combo-sequence .notation-text {
        display: inline-flex !important;
      }
      .show-joysticks .combo-sequence .notation-joystick {
        display: inline-flex !important;
      }
      .show-joysticks .combo-sequence .notation-text {
        display: none !important;
      }

      /* Switch UI Toggle Styles */
      .notation-toggle-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: auto;
        background: rgba(30, 30, 32, 0.45);
        border: 1px solid rgba(255, 255, 255, 0.15);
        padding: 6px 12px;
        border-radius: 8px;
        font-family: var(--font-mono);
        font-size: 0.8rem;
        font-weight: bold;
        color: var(--text-secondary);
      }
      .switch {
        position: relative;
        display: inline-block;
        width: 38px;
        height: 20px;
        margin-bottom: 0;
      }
      .switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #3a3a3c;
        transition: .3s;
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      .slider:before {
        position: absolute;
        content: "";
        height: 14px;
        width: 14px;
        left: 2px;
        bottom: 2px;
        background-color: #aeaeae;
        transition: .3s;
        border-radius: 50%;
      }
      input:checked + .slider {
        background-color: var(--color-primary, #ff9f0a);
      }
      input:checked + .slider:before {
        transform: translateX(18px);
        background-color: #fff;
        box-shadow: 0 0 8px var(--color-primary, #ff9f0a);
      }

      .joystick-container {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        background: rgba(30, 30, 32, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 6px;
        vertical-align: middle;
        box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 1px rgba(255, 255, 255, 0.05);
        margin-right: 0.15rem;
        position: relative;
        overflow: hidden;
      }
      .joystick-svg {
        width: 24px;
        height: 24px;
        display: block;
      }
      .joystick-gate {
        stroke: rgba(255, 255, 255, 0.22);
        stroke-width: 1.5;
        fill: rgba(10, 10, 12, 0.5);
      }
      .joystick-center {
        fill: rgba(255, 255, 255, 0.15);
      }
      .joystick-dustcover {
        fill: #151517;
        stroke: rgba(255, 255, 255, 0.18);
        stroke-width: 0.8;
      }
      .joystick-lever {
        transform-origin: 16px 16px;
      }
      @keyframes joystick-dir-1 { 0%, 100% { transform: translate(0, 0); } 25%, 75% { transform: translate(-7px, 7px); } }
      @keyframes joystick-dir-2 { 0%, 100% { transform: translate(0, 0); } 25%, 75% { transform: translate(0, 10px); } }
      @keyframes joystick-dir-3 { 0%, 100% { transform: translate(0, 0); } 25%, 75% { transform: translate(7px, 7px); } }
      @keyframes joystick-dir-4 { 0%, 100% { transform: translate(0, 0); } 25%, 75% { transform: translate(-10px, 0); } }
      @keyframes joystick-dir-6 { 0%, 100% { transform: translate(0, 0); } 25%, 75% { transform: translate(10px, 0); } }
      @keyframes joystick-dir-7 { 0%, 100% { transform: translate(0, 0); } 25%, 75% { transform: translate(-7px, -7px); } }
      @keyframes joystick-dir-8 { 0%, 100% { transform: translate(0, 0); } 25%, 75% { transform: translate(0, -10px); } }
      @keyframes joystick-dir-9 { 0%, 100% { transform: translate(0, 0); } 25%, 75% { transform: translate(7px, -7px); } }
      .joystick-anim-1 .joystick-lever { animation: joystick-dir-1 2s infinite ease-in-out; }
      .joystick-anim-2 .joystick-lever { animation: joystick-dir-2 2s infinite ease-in-out; }
      .joystick-anim-3 .joystick-lever { animation: joystick-dir-3 2s infinite ease-in-out; }
      .joystick-anim-4 .joystick-lever { animation: joystick-dir-4 2s infinite ease-in-out; }
      .joystick-anim-6 .joystick-lever { animation: joystick-dir-6 2s infinite ease-in-out; }
      .joystick-anim-7 .joystick-lever { animation: joystick-dir-7 2s infinite ease-in-out; }
      .joystick-anim-8 .joystick-lever { animation: joystick-dir-8 2s infinite ease-in-out; }
      .joystick-anim-9 .joystick-lever { animation: joystick-dir-9 2s infinite ease-in-out; }
      .joystick-anim-hold-1 .joystick-lever { transform: translate(-7px, 7px); }
      .joystick-anim-hold-2 .joystick-lever { transform: translate(0, 10px); }
      .joystick-anim-hold-3 .joystick-lever { transform: translate(7px, 7px); }
      .joystick-anim-hold-4 .joystick-lever { transform: translate(-10px, 0); }
      @keyframes joystick-motion-236 {
        0%, 100% { transform: translate(0, 0); }
        20% { transform: translate(0, 10px); }
        45% { transform: translate(7px, 7px); }
        70%, 85% { transform: translate(10px, 0); }
      }
      @keyframes joystick-motion-214 {
        0%, 100% { transform: translate(0, 0); }
        20% { transform: translate(0, 10px); }
        45% { transform: translate(-7px, 7px); }
        70%, 85% { transform: translate(-10px, 0); }
      }
      @keyframes joystick-motion-623 {
        0%, 100% { transform: translate(0, 0); }
        20% { transform: translate(10px, 0); }
        45% { transform: translate(0, 10px); }
        70%, 85% { transform: translate(7px, 7px); }
      }
      @keyframes joystick-motion-421 {
        0%, 100% { transform: translate(0, 0); }
        20% { transform: translate(-10px, 0); }
        45% { transform: translate(0, 10px); }
        70%, 85% { transform: translate(-7px, 7px); }
      }
      @keyframes joystick-motion-41236 {
        0%, 100% { transform: translate(0, 0); }
        15% { transform: translate(-10px, 0); }
        30% { transform: translate(-7px, 7px); }
        45% { transform: translate(0, 10px); }
        60% { transform: translate(7px, 7px); }
        75%, 90% { transform: translate(10px, 0); }
      }
      @keyframes joystick-motion-63214 {
        0%, 100% { transform: translate(0, 0); }
        15% { transform: translate(10px, 0); }
        30% { transform: translate(7px, 7px); }
        45% { transform: translate(0, 10px); }
        60% { transform: translate(-7px, 7px); }
        75%, 90% { transform: translate(-10px, 0); }
      }
      @keyframes joystick-motion-c46 {
        0%, 45% { transform: translate(-10px, 0); }
        55%, 80% { transform: translate(10px, 0); }
        90%, 100% { transform: translate(0, 0); }
      }
      @keyframes joystick-motion-c28 {
        0%, 45% { transform: translate(0, 10px); }
        55%, 80% { transform: translate(0, -10px); }
        90%, 100% { transform: translate(0, 0); }
      }
      .joystick-anim-236 .joystick-lever { animation: joystick-motion-236 1.8s infinite ease-in-out; }
      .joystick-anim-214 .joystick-lever { animation: joystick-motion-214 1.8s infinite ease-in-out; }
      .joystick-anim-623 .joystick-lever { animation: joystick-motion-623 1.8s infinite ease-in-out; }
      .joystick-anim-421 .joystick-lever { animation: joystick-motion-421 1.8s infinite ease-in-out; }
      .joystick-anim-41236 .joystick-lever { animation: joystick-motion-41236 2.2s infinite ease-in-out; }
      .joystick-anim-63214 .joystick-lever { animation: joystick-motion-63214 2.2s infinite ease-in-out; }
      .joystick-anim-c46 .joystick-lever { animation: joystick-motion-c46 2.2s infinite ease-in-out; }
      .joystick-anim-c28 .joystick-lever { animation: joystick-motion-c28 2.2s infinite ease-in-out; }
      @keyframes joystick-charge-pulsate {
        0%, 100% { opacity: 0.35; transform: scale(1); }
        50% { opacity: 0.75; transform: scale(1.25); }
      }
      .joystick-charge-area-pulsate {
        animation: joystick-charge-pulsate 1.5s infinite ease-in-out;
        transform-origin: center;
      }
    `;
    document.head.appendChild(styleEl);
  }
}

function renderJoystickSvg(animId, title = '') {
  // SVG path overlays for each motion type
  function arc(d, arrowD) {
    return `
      <path d="${d}" fill="none" stroke="rgba(255, 159, 10, 0.45)" stroke-width="2" stroke-dasharray="2,2" />
      <path d="${arrowD}" fill="none" stroke="rgba(255, 159, 10, 0.65)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    `;
  }
  function corner(d, arrowD) {
    return `
      <path d="${d}" fill="none" stroke="rgba(255, 159, 10, 0.45)" stroke-width="2" stroke-dasharray="2,2" stroke-linejoin="round" />
      <path d="${arrowD}" fill="none" stroke="rgba(255, 159, 10, 0.65)" stroke-width="1.5" stroke-linecap="round" />
    `;
  }
  function chargeDot(cx, cy, opacity = 0.25, strokeOp = 0.5) {
    return `<circle cx="${cx}" cy="${cy}" r="4.5" fill="rgba(0, 132, 255, ${opacity})" stroke="rgba(0, 132, 255, ${strokeOp})" stroke-width="1" class="joystick-charge-area-pulsate" />`;
  }

  const MOTION_PATHS = {
    '236':   arc('M16 26 A 10 10 0 0 0 26 16', 'M24 13 L27 16 L24 19'),
    '214':   arc('M16 26 A 10 10 0 0 1 6 16',  'M8 13 L5 16 L8 19'),
    '623':   corner('M26 16 L16 26 L23 23', 'M20 23 L23 23 L23 20'),
    '421':   corner('M6 16 L16 26 L9 23',   'M12 23 L9 23 L9 20'),
    '41236': arc('M6 16 A 10 10 0 0 0 26 16',  'M24 13 L27 16 L24 19'),
    '63214': arc('M26 16 A 10 10 0 0 1 6 16',  'M8 13 L5 16 L8 19'),
    'c46':   arc('M6 16 L26 16',  'M24 13 L27 16 L24 19'),
    'c28':   arc('M16 26 L16 6',  'M13 9 L16 6 L19 9')
  };

  const CHARGE_INDICATORS = {
    'c46': chargeDot(6, 16),
    'c28': chargeDot(16, 26)
  };

  const HOLD_COORDS = { '4': [6, 16], '2': [16, 26], '1': [9, 23], '3': [23, 23] };

  const DIR_GUIDE_COORDS = {
    '1': [9, 23], '2': [16, 26], '3': [23, 23], '4': [6, 16],
    '6': [26, 16], '7': [9, 9], '8': [16, 6], '9': [23, 9]
  };

  let pathHtml = MOTION_PATHS[animId] || '';
  let chargeIndicator = CHARGE_INDICATORS[animId] || '';

  // Hold directions (e.g. hold-4, hold-2)
  if (animId.startsWith('hold-')) {
    const coords = HOLD_COORDS[animId.substring(5)] || [16, 16];
    chargeIndicator = chargeDot(coords[0], coords[1], 0.3, 0.6);
  }

  // Direction guide line for single-direction animations
  let dirGuide = '';
  const guideCoords = DIR_GUIDE_COORDS[animId];
  if (guideCoords) {
    dirGuide = `<line x1="16" y1="16" x2="${guideCoords[0]}" y2="${guideCoords[1]}" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1.5" stroke-dasharray="1.5,1.5" />`;
  }

  return `
    <div class="joystick-container" title="${escapeHtml(title)}">
      <svg class="joystick-svg joystick-anim-${animId}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="balltop-grad" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#ff9f0a" />
            <stop offset="60%" stop-color="#ff3b30" />
            <stop offset="100%" stop-color="#8e0000" />
          </radialGradient>
          <radialGradient id="balltop-grad-hold" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#0a84ff" />
            <stop offset="60%" stop-color="#0066cc" />
            <stop offset="100%" stop-color="#003366" />
          </radialGradient>
        </defs>
        <circle cx="16" cy="16" r="12" class="joystick-gate" />
        <circle cx="16" cy="16" r="2.5" class="joystick-center" />
        ${dirGuide}
        ${chargeIndicator}
        ${pathHtml}
        <g class="joystick-lever">
          <circle cx="16" cy="16" r="7" class="joystick-dustcover" />
          <circle cx="16" cy="16" r="5" fill="url(#${animId.startsWith('hold-') ? 'balltop-grad-hold' : 'balltop-grad'})" />
        </g>
      </svg>
    </div>
  `.trim();
}

function renderDirectionElement(numDirection, titleStr) {
  return `
    <span class="notation-text combo-dir" title="${escapeHtml(titleStr)}">${numDirection}</span>
    <span class="notation-joystick joystick-wrapper">${renderJoystickSvg(numDirection, titleStr)}</span>
  `.trim();
}

function renderMotionElement(motionId, titleStr) {
  const CHARGE_TEXT = {
    'c46': ['[←]', 'Charge [4]', '→', 'Direction 6'],
    'c28': ['[↓]', 'Charge [2]', '↑', 'Direction 8']
  };

  let textHtml = '';
  const chargeInfo = CHARGE_TEXT[motionId];
  if (chargeInfo) {
    textHtml = `
      <span class="notation-text combo-dir" title="${chargeInfo[1]}">${chargeInfo[0]}</span>
      <span class="notation-text combo-dir" title="${chargeInfo[3]}">${chargeInfo[2]}</span>
    `;
  } else {
    textHtml = `<span class="notation-text combo-dir" title="${titleStr}">${motionId}</span>`;
  }

  return `
    ${textHtml.trim()}
    <span class="notation-joystick joystick-wrapper">${renderJoystickSvg(motionId, titleStr)}</span>
  `.trim();
}

function parseStrategyHubStep(stepStr, gameId) {
  let remaining = escapeHtml(stepStr.trim());
  if (!remaining) return '';

  let html = `<div class="combo-step">`;
  let parsedAny = false;

  // Game-specific configuration: buttons and direction overrides
  const GAME_CONFIG = {
    t8:    { buttons: ['1', '2', '3', '4'], dirOverrides: [] },
    sf6:   { buttons: ['lp', 'mp', 'hp', 'lk', 'mk', 'hk', 'p', 'k'], dirOverrides: [] },
    ggst:  { buttons: ['p', 'k', 's', 'hs', 'd'], dirOverrides: ['d'] },
    gbvsr: { buttons: ['l', 'm', 'h', 'u'], dirOverrides: ['u'] }
  };

  const DIR_MAP = {
    '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
    'db': '1', 'd/b': '1',
    'd': '2',
    'df': '3', 'd/f': '3',
    'b': '4',
    'f': '6',
    'ub': '7', 'u/b': '7',
    'u': '8',
    'uf': '9', 'u/f': '9'
  };
  // Remove direction keys that are game-specific buttons (e.g. D=Dust in GGST, U=Unique in GBVSR)
  const config = GAME_CONFIG[gameId];
  if (config) {
    for (const key of config.dirOverrides) delete DIR_MAP[key];
  }

  while (remaining.length > 0) {
    if (remaining.startsWith(' ')) {
      remaining = remaining.trim();
      continue;
    }

    if (remaining.startsWith('+')) {
      html += `<span class="combo-plus">+</span>`;
      remaining = remaining.substring(1).trim();
      continue;
    }

    // Delimiters/Connectors (e.g., 'or', 'and', '/', '|')
    const delimiterMatch = remaining.match(/^(or|and)\b/i) || remaining.match(/^(\/|\|)/);
    if (delimiterMatch) {
      const delim = delimiterMatch[0];
      html += `<span class="combo-connector">${delim.toLowerCase()}</span>`;
      remaining = remaining.substring(delim.length).trim();
      parsedAny = true;
      continue;
    }

    let matched = false;

    // 1a. Combined jump prefix (e.g., j.H, j.K) – treat as one token
    const jumpCombinedMatch = remaining.match(/^j\.[A-Za-z]+/i);
    if (jumpCombinedMatch) {
      const token = jumpCombinedMatch[0];
      html += `<span class="text-muted builder-pad-empty-text" style="font-size: 0.75rem; margin-right: 0.2rem;">${token}</span>`;
      remaining = remaining.substring(token.length).trim();
      parsedAny = true;
      matched = true;
      continue;
    }

    // 1. State & Proximity Prefixes
    const muted = (text) => `<span class="text-muted builder-pad-empty-text" style="font-size: 0.75rem; margin-right: 0.2rem;">${text}</span>`;
    const prefixRules = [
      { key: 'jc.', html: muted('jc.') },
      { key: 'j.',  html: muted('j.') },
      { key: 'cr.', html: '<span class="combo-dir" title="Crouch">↓</span>' },
      { key: 'st.', html: '<span class="combo-dir" title="Stand">•</span>' },
      { key: 'c.',  html: muted('c.') },
      { key: 'f.',  html: muted('f.') },
      { key: 's.',  html: '<span class="combo-dir" title="Stand">•</span>' }
    ];

    for (const rule of prefixRules) {
      const regex = new RegExp('^' + rule.key.replace(/\./g, '\\.'), 'i');
      if (regex.test(remaining)) {
        html += rule.html;
        remaining = remaining.replace(regex, '').trim();
        parsedAny = true;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // 2. Complex charge motions (e.g. [4]6 or [2]8)
    const complexChargeMatch = remaining.match(/^\[(4|2|db|d\/b|d)\]\s*(6|8|f|u)(?![0-9])/i);
    if (complexChargeMatch) {
      const holdRaw = complexChargeMatch[1].toLowerCase();
      const releaseRaw = complexChargeMatch[2].toLowerCase();
      const holdNum = DIR_MAP[holdRaw];
      const releaseNum = DIR_MAP[releaseRaw];
      let animId = '';
      let title = '';
      if (holdNum === '4' && releaseNum === '6') {
        animId = 'c46';
        title = 'Charge Back, Forward';
      } else if (holdNum === '2' && releaseNum === '8') {
        animId = 'c28';
        title = 'Charge Down, Up';
      }
      if (animId) {
        html += renderMotionElement(animId, title);
        remaining = remaining.substring(complexChargeMatch[0].length).trim();
        parsedAny = true;
        if (remaining.startsWith('+')) remaining = remaining.substring(1).trim();
        continue;
      }
    }

    // 3. Bracketed Charge/Hold (single, e.g. [4] or [D] for Dust)
    const chargeMatch = remaining.match(/^\[([1-9]|[a-z/]+)\]/i);
    if (chargeMatch) {
      const inner = chargeMatch[1].toLowerCase();
      const innerNum = DIR_MAP[inner] || inner;
      
      // Check if this is actually a held button (e.g. [D] for Dust in GGST)
      const isButtonHold = !DIR_MAP[inner] && BUTTON_CLASSES[inner];
      
      if (isButtonHold) {
        // Render as a held button press
        const btnClass = BUTTON_CLASSES[inner];
        html += `<span class="combo-btn ${btnClass}" title="Hold ${inner.toUpperCase()}">[${inner.toUpperCase()}]</span>`;
      } else {
        const title = `Charge [${inner.toUpperCase()}]`;
        const arrow = DIRECTION_ARROWS[innerNum] || inner.toUpperCase();
        
        let joystickPart = '';
        if (['1', '2', '3', '4', '6', '7', '8', '9'].includes(innerNum)) {
          joystickPart = renderJoystickSvg(`hold-${innerNum}`, title);
        } else {
          joystickPart = `<span class="combo-dir" title="${title}">[${arrow}]</span>`;
        }
        
        html += `
          <span class="notation-text combo-dir" title="${title}">[${arrow}]</span>
          <span class="notation-joystick joystick-wrapper">${joystickPart}</span>
        `;
      }
      remaining = remaining.substring(chargeMatch[0].length).trim();
      parsedAny = true;
      if (remaining.startsWith('+')) remaining = remaining.substring(1).trim();
      continue;
    }

    // 4. Bracketed Release (single, e.g. ]4[)
    const releaseMatch = remaining.match(/^\]([a-z0-9])\[/i);
    if (releaseMatch) {
      const inner = releaseMatch[1].toLowerCase();
      const innerNum = DIR_MAP[inner] || inner;
      const title = `Release ]${inner.toUpperCase()}[`;
      const arrow = DIRECTION_ARROWS[innerNum];
      const display = arrow || inner.toUpperCase();
      html += `<span class="combo-dir" title="${title}">]${display}[</span>`;
      remaining = remaining.substring(releaseMatch[0].length).trim();
      parsedAny = true;
      if (remaining.startsWith('+')) remaining = remaining.substring(1).trim();
      continue;
    }

    // 5. Complex Motion Inputs (non-Tekken)
    if (gameId !== 't8') {
      const motionKeys = Object.keys(MOTIONS).sort((a, b) => b.length - a.length);
      for (const num of motionKeys) {
        if (remaining.startsWith(num)) {
          const label = MOTIONS[num];
          html += renderMotionElement(num, `${label} (${num})`);
          remaining = remaining.substring(num.length).trim();
          parsedAny = true;
          matched = true;
          break;
        }
      }
      if (matched) continue;
    }

    // 6a. Counter Hit (CH) descriptor (case-insensitive, optionally with dot)
    const chMatch = remaining.match(/^ch\b\.?/i);
    if (chMatch) {
      html += `<span class="combo-descriptor-ch">CH</span>`;
      remaining = remaining.substring(chMatch[0].length).trim();
      parsedAny = true;
      continue;
    }

    // 6b. Stance & Condition descriptors (case-insensitive, optionally with dot)
    const stanceMatch = remaining.match(/^(ssl|ssr|ws|wr|fc|ss|sen)\b\.?/i);
    if (stanceMatch) {
      const stanceName = stanceMatch[1].toUpperCase();
      html += `<span class="combo-descriptor">${stanceName}</span>`;
      remaining = remaining.substring(stanceMatch[0].length).trim();
      parsedAny = true;
      continue;
    }

    // 6c. Parenthesized descriptors (e.g. (air ok), (Hold, OK), (HOLD))
    const parenMatch = remaining.match(/^\(([^)]+)\)/);
    if (parenMatch) {
      const content = parenMatch[1].trim().toUpperCase().replace(/\s*,\s*/g, ' ').replace(/\s+/g, ' ');
      html += `<span class="combo-descriptor">${content}</span>`;
      remaining = remaining.substring(parenMatch[0].length).trim();
      parsedAny = true;
      continue;
    }

    // 6d. Unparenthesized descriptors (e.g. air ok, air only, hold ok, hold only)
    const airHoldMatch = remaining.match(/^(air|hold)\s+(ok|only)\b/i);
    if (airHoldMatch) {
      const adjective = airHoldMatch[1].toUpperCase();
      const type = airHoldMatch[2].toUpperCase();
      html += `<span class="combo-descriptor">${adjective} ${type}</span>`;
      remaining = remaining.substring(airHoldMatch[0].length).trim();
      parsedAny = true;
      continue;
    }

    // 6e. Hold keyword prefix (e.g. Hold HP -> HOLD badge then HP button)
    const holdWordMatch = remaining.match(/^hold\b\.?/i);
    if (holdWordMatch) {
      html += `<span class="combo-descriptor">HOLD</span>`;
      remaining = remaining.substring(holdWordMatch[0].length).trim();
      parsedAny = true;
      continue;
    }

    // 7. Game-Specific Active Buttons (uses GAME_CONFIG defined above)
    const activeButtons = config ? config.buttons : Object.keys(BUTTON_CLASSES);
    const buttonKeys = activeButtons.sort((a, b) => b.length - a.length);

    for (const btnKey of buttonKeys) {
      const regex = new RegExp('^' + btnKey, 'i');
      if (regex.test(remaining)) {
        // Check what follows: allow if next char is another button start, digit, symbol, space, or end
        const afterBtn = remaining.substring(btnKey.length);
        const nextChar = afterBtn.length > 0 ? afterBtn[0] : '';
        const isValidEnd = nextChar === '' || /[\d\s+>~,.\-\[\]\(\)\/|]/.test(nextChar) ||
          buttonKeys.some(bk => afterBtn.toLowerCase().startsWith(bk));
        if (isValidEnd) {
          const btnClass = BUTTON_CLASSES[btnKey];
          html += `<span class="combo-btn ${btnClass}">${btnKey.toUpperCase()}</span>`;
          remaining = remaining.substring(btnKey.length).trim();
          parsedAny = true;
          matched = true;
          break;
        }
      }
    }
    if (matched) continue;

    // 8. Diagonal/Cardinal directions (d/f, db, etc.)
    const dirKeys = ['d/f', 'd/b', 'u/f', 'u/b', 'db', 'df', 'ub', 'uf', 'd', 'f', 'b', 'u'];
    for (const dirKey of dirKeys) {
      const regex = new RegExp('^' + dirKey.replace(/\//g, '\\/') + '(?![a-z])', 'i');
      if (regex.test(remaining)) {
        const numDirection = DIR_MAP[dirKey.toLowerCase()];
        if (numDirection !== undefined) {
          html += renderDirectionElement(numDirection, `Direction ${dirKey.toUpperCase()} (${numDirection})`);
          remaining = remaining.replace(regex, '').trim();
          parsedAny = true;
          matched = true;
          break;
        }
      }
    }
    if (matched) continue;

    // 9. Numpad directions for non-Tekken games (digits 1-9)
    if (gameId !== 't8') {
      const numMatch = remaining.match(/^[1-9]/);
      if (numMatch) {
        const digit = numMatch[0];
        // Skip neutral '5' — it's implied when no direction precedes a button
        if (digit === '5') {
          remaining = remaining.substring(1).trim();
          parsedAny = true;
          continue;
        }
        html += renderDirectionElement(digit, `Direction ${digit}`);
        remaining = remaining.substring(1).trim();
        parsedAny = true;
        continue;
      }
    }

    // 10. Standard words (alphabetic sequence)
    const wordMatch = remaining.match(/^[a-z]+/i);
    if (wordMatch) {
      const word = wordMatch[0];
      html += `<span class="combo-custom-action">${word.toUpperCase()}</span>`;
      remaining = remaining.substring(word.length).trim();
      parsedAny = true;
      continue;
    }

    // 11. Fallback for single symbol/character
    const char = remaining.charAt(0);
    html += `<span class="combo-custom-action">${char.toUpperCase()}</span>`;
    remaining = remaining.substring(1).trim();
    parsedAny = true;
  }

  if (!parsedAny) {
    return `<span class="combo-text-fallback">${stepStr}</span>`;
  }

  html += `</div>`;
  return html;
}

/**
 * Parses raw fighting game notations into compact visual elements optimized for the strategy hub.
 * @param {string} notationString - The raw numpad/text combo notation string.
 * @param {string} gameId - The ID of the active game context.
 * @returns {string} - Rendered HTML block of input badges and arrows.
 */
export function parseStrategyHubNotationToHtml(notationString, gameId) {
  if (!notationString || !notationString.trim()) {
    return '<span class="text-muted">-</span>';
  }

  const normalizedSlang = normalizeCommunitySlang(notationString, gameId);

  const regex = /(\s*(?:>|->|xx|~|,)\s*)/g;
  const tokens = normalizedSlang.split(regex);

  let html = `<div class="combo-sequence" style="display: inline-flex; align-items: center; gap: 0.25rem; flex-wrap: wrap;">`;

  const DELIMITER_HTML = {
    '>':  '<span class="combo-flow" style="font-size: 0.9rem; color: var(--text-muted); opacity: 0.8;">➔</span>',
    '->': '<span class="combo-flow" style="font-size: 0.9rem; color: var(--text-muted); opacity: 0.8;">➔</span>',
    ',':  '<span class="combo-flow" style="font-size: 0.9rem; color: var(--text-muted); opacity: 0.8;">➔</span>',
    'xx': '<span class="combo-flow text-danger" style="font-weight: bold; font-size: 0.85rem; margin: 0 0.1rem;">xx</span>',
    '~':  '<span class="combo-flow text-warning" style="font-weight: bold; font-size: 0.85rem; margin: 0 0.1rem;">~</span>'
  };

  tokens.forEach(token => {
    const trimmedToken = token.trim();
    if (!trimmedToken) return;

    const delimHtml = DELIMITER_HTML[trimmedToken];
    if (delimHtml) {
      html += delimHtml;
    } else {
      html += parseStrategyHubStep(trimmedToken, gameId);
    }
  });

  html += `</div>`;
  return html;
}
