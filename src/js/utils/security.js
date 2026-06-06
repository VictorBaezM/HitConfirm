/**
 * Escapes HTML special characters to prevent Cross-Site Scripting (XSS) attacks.
 * @param {string} unsafe - Raw, unsanitized string.
 * @returns {string} Clean, HTML-entity-encoded string.
 */
export function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
