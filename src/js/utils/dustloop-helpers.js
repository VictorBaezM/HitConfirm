// src/js/utils/dustloop-helpers.js
// Pure helper functions for cleaning, parsing, and formatting Dustloop frame data.

/**
 * Strips HTML tags, MediaWiki quotes, and normalizes spacing in values.
 * @param {any} val
 * @returns {string}
 */
export function cleanDustloopValue(val) {
  if (!val) return '';
  let str = String(val);
  // Remove HTML tags
  str = str.replace(/<[^>]*>/g, '');
  // Remove MediaWiki formatting bold/italic quotes
  str = str.replace(/'''/g, '').replace(/''/g, '');
  // Replace newlines or extra spaces
  str = str.replace(/\s+/g, ' ').trim();
  return str;
}

/**
 * Parses the first numeric value from a string for sorting purposes.
 * @param {string} val
 * @returns {number}
 */
export function parseNumericValue(val) {
  if (!val) return -9999;
  // Match the first integer or decimal (negative or positive)
  const match = val.match(/[-+]?\d+/);
  if (match) {
    return parseInt(match[0], 10);
  }
  // KD/Knockdown fallback for sorting
  if (val.toLowerCase().includes('kd') || val.toLowerCase().includes('knockdown')) {
    return 1000; // Place knockdown at the bottom or top of sorting
  }
  return 0;
}

/**
 * Formats clean advantage values into color-coded badge HTML.
 * @param {string} val
 * @returns {string}
 */
export function formatAdvantageBadge(val) {
  if (!val) return '';
  
  if (val === '0' || val === '+0' || val === '-0') {
    return `<span class="adv-badge adv-neutral">${val}</span>`;
  }
  if (val.startsWith('+')) {
    return `<span class="adv-badge adv-plus">${val}</span>`;
  }
  if (val.startsWith('-')) {
    return `<span class="adv-badge adv-minus">${val}</span>`;
  }
  
  // Check numeric value directly
  const num = parseInt(val, 10);
  if (!isNaN(num)) {
    if (num > 0) return `<span class="adv-badge adv-plus">+${num}</span>`;
    if (num < 0) return `<span class="adv-badge adv-minus">${num}</span>`;
    return `<span class="adv-badge adv-neutral">${num}</span>`;
  }
  
  return val;
}
