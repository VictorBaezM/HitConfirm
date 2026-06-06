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

/**
 * Validates a password against security policies (min 8 chars, uppercase, lowercase, number, special char).
 * @param {string} password - Raw password input.
 * @returns {Object} Validation status and feedback message.
 */
export function validatePasswordStrength(password) {
  if (!password) {
    return { isValid: false, message: 'Password is required.' };
  }
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long.' };
  }
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
    };
  }
  return { isValid: true, message: '' };
}
