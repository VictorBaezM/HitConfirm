/**
 * Converts a character name to a URL-safe lowercase slug (e.g. "A.B.A" -> "a-b-a").
 * @param {string} name - The character name.
 * @returns {string} The slugified name.
 */
export function slugifyCharacterName(name) {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
