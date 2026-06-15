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
  
  // 1. Spacing around plus signs
  res = res.replace(/\s*\+\s*/g, '+');

  // 2. SF/2D button slang combinations involving "forward" (medium kick)
  res = res.replace(/\b(?:crouching|crouch|cr)\s+forward\b/g, 'cr.MK');
  res = res.replace(/\b(?:standing|stand|st|s)\s+forward\b/g, 's.MK');
  
  // 3. Diagonal and cardinal direction words (game-aware mapping)
  if (gameId === 't8') {
    res = res.replace(/\bdown[- ]forward\b/g, 'df');
    res = res.replace(/\bdown[- ]back\b/g, 'db');
    res = res.replace(/\bup[- ]forward\b/g, 'uf');
    res = res.replace(/\bup[- ]back\b/g, 'ub');
    res = res.replace(/\bdownforward\b/g, 'df');
    res = res.replace(/\bdownback\b/g, 'db');
    res = res.replace(/\bupforward\b/g, 'uf');
    res = res.replace(/\bupback\b/g, 'ub');
    
    res = res.replace(/\bneutral\b/g, '5');
    res = res.replace(/\b(?:forward|fwd)\b/g, 'f');
    res = res.replace(/\bback\b/g, 'b');
    res = res.replace(/\bdown\b/g, 'd');
    res = res.replace(/\bup\b/g, 'u');
  } else {
    res = res.replace(/\bdown[- ]forward\b/g, '3');
    res = res.replace(/\bdown[- ]back\b/g, '1');
    res = res.replace(/\bup[- ]forward\b/g, '9');
    res = res.replace(/\bup[- ]back\b/g, '7');
    res = res.replace(/\bdownforward\b/g, '3');
    res = res.replace(/\bdownback\b/g, '1');
    res = res.replace(/\bupforward\b/g, '9');
    res = res.replace(/\bupback\b/g, '7');
    
    res = res.replace(/\bneutral\b/g, '5');
    res = res.replace(/\b(?:forward|fwd)\b/g, '6');
    res = res.replace(/\bback\b/g, '4');
    res = res.replace(/\bdown\b/g, '2');
    res = res.replace(/\bup\b/g, '8');
  }

  // 4. Positional & State Slang with negative lookahead to prevent double dots
  res = res.replace(/\b(?:crouching|crouch|cr|low)\b(?!\.)/g, 'cr.');
  res = res.replace(/\b(?:standing|stand|st|s)\b(?!\.)/g, 's.');
  res = res.replace(/\b(?:jumping|jump|j|air)\b(?!\.)/g, 'j.');
  res = res.replace(/\b(?:while standing|ws)\b(?!\.)/g, 'ws.');

  // 5. Button Strengths & Synonyms (ordered to map full phrases before single terms)
  res = res.replace(/\bmedium\s+punch\b/g, 'MP');
  res = res.replace(/\bmedium\s+kick\b/g, 'MK');
  res = res.replace(/\blight\s+punch\b/g, 'LP');
  res = res.replace(/\blight\s+kick\b/g, 'LK');
  res = res.replace(/\bheavy\s+punch\b/g, 'HP');
  res = res.replace(/\bheavy\s+kick\b/g, 'HK');

  res = res.replace(/\bjab\b/g, 'LP');
  res = res.replace(/\bshort\b/g, 'LK');
  res = res.replace(/\bstrong\b/g, 'MP');
  res = res.replace(/\bfierce\b/g, 'HP');
  res = res.replace(/\broundhouse\b/g, 'HK');
  res = res.replace(/\brh\b/g, 'HK');

  res = res.replace(/\bmedium\b/g, 'M');
  res = res.replace(/\bmed\b/g, 'M');
  res = res.replace(/\blight\b/g, 'L');
  res = res.replace(/\bheavy\b/g, 'H');
  res = res.replace(/\bpunch\b/g, 'P');
  res = res.replace(/\bkick\b/g, 'K');

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
