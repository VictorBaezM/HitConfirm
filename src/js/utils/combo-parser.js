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
function parseComboStep(stepStr, gameId) {
  let trimmed = escapeHtml(stepStr.trim());
  if (!trimmed) return '';

  let html = `<div class="combo-step">`;
  let parsedAny = false;

  // 1. Detect jump prefix (j., jump, j followed by button/number)
  const jumpRegex = /^j(\.|ump|(?=[A-Z0-9]))/i;
  if (jumpRegex.test(trimmed)) {
    html += `<span class="combo-dir" title="Jump">↑</span>`;
    trimmed = trimmed.replace(jumpRegex, '');
    parsedAny = true;
  }

  // 2. Detect close/far/crouch/standing prefixes
  const prefixRegex = /^(c\.|cl\.|f\.|st\.|cr\.|hj\.|sj\.|dj\.)/i;
  if (prefixRegex.test(trimmed)) {
    const match = trimmed.match(prefixRegex)[0];
    html += `<span class="text-muted builder-pad-empty-text">${match}</span>`;
    trimmed = trimmed.substring(match.length);
    parsedAny = true;
  }

  // 3. Process remaining string sequentially
  let remaining = trimmed;

  const directionKeys = Object.keys(DIRECTION_ARROWS).sort((a, b) => b.length - a.length);
  const buttonKeys = Object.keys(BUTTON_CLASSES).sort((a, b) => b.length - a.length);
  const customAbbrevs = ['ssl', 'ssr', 'ws', 'wr', 'fc', 'ss', 'ch'];

  while (remaining.length > 0) {
    // Skip separators like '+' or spaces
    if (remaining.startsWith('+') || remaining.startsWith(' ')) {
      remaining = remaining.substring(1);
      continue;
    }

    // A. Match charge bracket [X]
    const chargeMatch = remaining.match(/^\[([1-9]|[a-z])\]/i);
    if (chargeMatch) {
      const inner = chargeMatch[1].toLowerCase();
      const arrow = DIRECTION_ARROWS[inner] || inner.toUpperCase();
      html += `<span class="combo-dir combo-charge" title="Charge ${inner}">[${arrow}]</span>`;
      remaining = remaining.substring(chargeMatch[0].length);
      parsedAny = true;
      continue;
    }

    // B. Match release bracket ]X[
    const releaseMatch = remaining.match(/^\]([a-z0-9])\[/i);
    if (releaseMatch) {
      const inner = releaseMatch[1].toLowerCase();
      const arrow = DIRECTION_ARROWS[inner];
      const display = arrow || inner.toUpperCase();
      html += `<span class="combo-btn combo-release" title="Release ${inner}">]${display}[</span>`;
      remaining = remaining.substring(releaseMatch[0].length);
      parsedAny = true;
      continue;
    }

    // C. Match specific motion inputs (like 236, 214)
    let motionMatched = false;
    if (gameId !== 't8') {
      for (const [num, label] of Object.entries(MOTIONS)) {
        if (remaining.startsWith(num)) {
          html += `<span class="combo-motion">${label}</span>`;
          remaining = remaining.substring(num.length);
          parsedAny = true;
          motionMatched = true;
          break;
        }
      }
    }
    if (motionMatched) continue;

    // D. Match direction inputs
    let dirMatched = false;
    for (const dirKey of directionKeys) {
      if (remaining.toLowerCase().startsWith(dirKey)) {
        // Do not consume numbers 1,2,3,4 as directions if it's Tekken (t8)
        if (gameId === 't8' && ['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(dirKey)) {
          continue;
        }
        if (!(dirKey === '1' || dirKey === '2' || dirKey === '3' || dirKey === '4' ? remaining.length === 1 : false)) {
          const arrow = DIRECTION_ARROWS[dirKey];
          html += `<span class="combo-dir" title="Direction ${dirKey}">${arrow}</span>`;
          remaining = remaining.substring(dirKey.length);
          parsedAny = true;
          dirMatched = true;
          break;
        }
      }
    }
    if (dirMatched) continue;

    // E. Match custom abbreviations
    let abbrevMatched = false;
    for (const abbrev of customAbbrevs) {
      if (remaining.toLowerCase().startsWith(abbrev)) {
        html += `<span class="combo-custom-action">${abbrev.toUpperCase()}</span>`;
        remaining = remaining.substring(abbrev.length);
        parsedAny = true;
        abbrevMatched = true;
        break;
      }
    }
    if (abbrevMatched) continue;

    // F. Match action button keys
    let buttonMatched = false;
    for (const btnKey of buttonKeys) {
      if (remaining.toLowerCase().startsWith(btnKey)) {
        const btnClass = BUTTON_CLASSES[btnKey];
        html += `<span class="combo-btn ${btnClass}">${btnKey.toUpperCase()}</span>`;
        remaining = remaining.substring(btnKey.length);
        parsedAny = true;
        buttonMatched = true;
        break;
      }
    }
    if (buttonMatched) continue;

    // G. Fallback for unparsed characters
    const char = remaining.charAt(0).toUpperCase();
    html += `<span class="combo-custom-action">${char}</span>`;
    remaining = remaining.substring(1);
    parsedAny = true;
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
 * @param {string} [gameId] - Optional game ID context for parsing.
 * @returns {string} - Generated HTML content displaying the full graphical input list.
 */
export function parseComboToHtml(notationString, gameId) {
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
    html += parseComboStep(step, gameId);
  });

  html += `</div>`;
  return html;
}

/**
 * Standard visual HTML rendering wrapper for fighting game combo notations.
 * Used uniformly across timeline feed posts and dojo combo cards.
 * @param {string} notationString - The raw numpad/text combo notation string.
 * @param {string} [gameId] - Optional game ID context for parsing.
 * @returns {string} - Styled HTML markup block representing the sequence.
 */
export function renderNotationHtml(notationString, gameId) {
  if (!notationString || !notationString.trim()) return '';
  return `
    <div class="wiki-combo-sequence">
      ${parseComboToHtml(notationString, gameId)}
      <div class="wiki-notation-helper">
        <i class="fa-solid fa-circle-question"></i>
        <div class="wiki-notation-tooltip">
          <div class="tooltip-title">Reading Notations</div>
          <ul>
            <li><strong>Anime (GG):</strong> Numpad directions (e.g., 236 = QCF) and buttons: <strong>P</strong> (Punch), <strong>K</strong> (Kick), <strong>S</strong> (Slash), <strong>HS</strong> (Heavy), <strong>D</strong> (Dust).</li>
            <li><strong>SF6:</strong> Classic directions (2MK = cr.MK) and buttons: <strong>LP/LK</strong>, <strong>MP/MK</strong>, <strong>HP/HK</strong>.</li>
            <li><strong>Tekken:</strong> Buttons <strong>1</strong> (LP), <strong>2</strong> (RP), <strong>3</strong> (LK), <strong>4</strong> (RK) with arrow directions.</li>
            <li><strong>Credits:</strong> Notation translation logic powered by <a href="https://ygg-m.github.io/fg-input-translator/" target="_blank" rel="noopener noreferrer" style="color: var(--color-primary); text-decoration: underline;">Fighting Game Input Translator</a> by Ygor Goulart.</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}
