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
  const directionKeys = Object.keys(DIRECTION_ARROWS).sort((a, b) => b.length - a.length);
  
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
    html += `<span style="color: var(--text-muted); font-size: 0.8rem;">${prefix}</span>`;
    remaining = remaining.substring(2);
  }

  // Look for matchable buttons in the remaining string
  const buttonKeys = Object.keys(BUTTON_CLASSES).sort((a, b) => b.length - a.length);
  
  while (remaining.length > 0) {
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
  
  steps.forEach((step, idx) => {
    if (idx > 0) {
      html += `<span class="combo-flow">➔</span>`;
    }
    html += parseComboStep(step);
  });

  html += `</div>`;
  return html;
}
