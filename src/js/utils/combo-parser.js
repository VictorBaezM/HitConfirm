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

  const directionKeys = Object.keys(DIRECTION_ARROWS).sort(function (a, b) { return b.length - a.length; });
  const buttonKeys = Object.keys(BUTTON_CLASSES).sort(function (a, b) { return b.length - a.length; });

  // 1. Check for jump prefix at the very start of the step
  let hasJumpPrefix = false;
  if (trimmed.toLowerCase().startsWith('j.')) {
    trimmed = trimmed.substring(2);
    hasJumpPrefix = true;
  } else if (trimmed.toLowerCase().startsWith('j') && trimmed.length > 1 && /^[0-9pksda-z]/i.test(trimmed.charAt(1))) {
    const isWord = /^[a-z]{3,}/i.test(trimmed);
    if (!isWord) {
      trimmed = trimmed.substring(1);
      hasJumpPrefix = true;
    }
  }

  if (hasJumpPrefix) {
    const arrow = DIRECTION_ARROWS['8']; // ↑
    html += `<span class="combo-dir" title="Jump">${arrow}</span>`;
    parsedAny = true;
  }

  // 2. Check for specific motion inputs (like 236, 214) at the start and render as arrow sequences
  for (const num of Object.keys(MOTIONS)) {
    if (trimmed.startsWith(num)) {
      for (const char of num) {
        const arrow = DIRECTION_ARROWS[char];
        html += `<span class="combo-dir" title="Direction ${char}">${arrow}</span>`;
      }
      trimmed = trimmed.substring(num.length);
      parsedAny = true;
      break;
    }
  }

  // 3. Check for directional inputs/modifiers/charges
  let matchedDir = true;
  while (matchedDir && trimmed.length > 0) {
    matchedDir = false;

    // Check for charge inputs (e.g., [4] or [2])
    if (trimmed.startsWith('[')) {
      const closeIndex = trimmed.indexOf(']');
      if (closeIndex !== -1) {
        const chargeDir = trimmed.substring(1, closeIndex).toLowerCase();
        const arrow = DIRECTION_ARROWS[chargeDir] || chargeDir.toUpperCase();
        html += `<span class="combo-dir combo-charge" title="Charge ${chargeDir}">[${arrow}]</span>`;
        trimmed = trimmed.substring(closeIndex + 1);

        if (trimmed.startsWith('+')) {
          trimmed = trimmed.substring(1);
        }

        parsedAny = true;
        matchedDir = true;
        continue;
      }
    }

    for (const dirKey of directionKeys) {
      if (trimmed.toLowerCase().startsWith(dirKey) && 
          !(dirKey === '1' || dirKey === '2' || dirKey === '3' || dirKey === '4' ? trimmed.length === 1 : false)) {
        
        const arrow = DIRECTION_ARROWS[dirKey];
        html += `<span class="combo-dir" title="Direction ${dirKey}">${arrow}</span>`;
        trimmed = trimmed.substring(dirKey.length);
        
        if (trimmed.startsWith('+')) {
          trimmed = trimmed.substring(1);
        }
        
        parsedAny = true;
        matchedDir = true;
        break;
      }
    }
  }

  // 4. Process remaining action button codes
  let remaining = trimmed.toLowerCase();
  
  if (remaining.startsWith('c.') || remaining.startsWith('f.')) {
    const prefix = remaining.substring(0, 2);
    html += `<span class="text-muted builder-pad-empty-text">${prefix}</span>`;
    remaining = remaining.substring(2);
  }

  while (remaining.length > 0) {
    if (remaining.startsWith(' ')) {
      remaining = remaining.trimStart();
      continue;
    }
    if (remaining.startsWith('.') || remaining.startsWith('+') || remaining.startsWith(',') || remaining.startsWith('>')) {
      remaining = remaining.substring(1);
      continue;
    }

    // Check charge inputs inside loop
    if (remaining.startsWith('[')) {
      const closeIndex = remaining.indexOf(']');
      if (closeIndex !== -1) {
        const chargeDir = remaining.substring(1, closeIndex).toLowerCase();
        const arrow = DIRECTION_ARROWS[chargeDir] || chargeDir.toUpperCase();
        html += `<span class="combo-dir combo-charge" title="Charge ${chargeDir}">[${arrow}]</span>`;
        remaining = remaining.substring(closeIndex + 1);
        parsedAny = true;
        continue;
      }
    }

    // Check directions dynamically inside the loop
    let loopDirMatched = false;
    for (const dirKey of ['d/f', 'd/b', 'u/f', 'u/b', 'f', 'b', 'd', 'u']) {
      if (remaining.startsWith(dirKey)) {
        const arrow = DIRECTION_ARROWS[dirKey];
        html += `<span class="combo-dir" title="Direction ${dirKey}">${arrow}</span>`;
        remaining = remaining.substring(dirKey.length);
        loopDirMatched = true;
        break;
      }
    }
    if (loopDirMatched) {
      parsedAny = true;
      continue;
    }

    let abbrevMatched = false;
    for (const abbrev of ['ssl', 'ssr', 'ws', 'wr', 'fc', 'ss', 'ch']) {
      if (remaining.startsWith(abbrev)) {
        html += `<span class="combo-custom-action">${abbrev.toUpperCase()}</span>`;
        remaining = remaining.substring(abbrev.length);
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
        buttonMatched = true;
        break;
      }
    }

    if (!buttonMatched) {
      const wordMatch = remaining.match(/^[a-z]+/i);
      if (wordMatch) {
        const word = wordMatch[0];
        html += `<span class="combo-custom-action">${word.toUpperCase()}</span>`;
        remaining = remaining.substring(word.length);
      } else {
        const char = remaining.charAt(0).toUpperCase();
        html += `<span class="combo-custom-action">${char}</span>`;
        remaining = remaining.substring(1);
      }
      parsedAny = true;
    }
  }

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
        <i class="fa-solid fa-circle-question"></i>
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
