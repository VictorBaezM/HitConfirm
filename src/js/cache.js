// src/js/cache.js
// Simple wrapper around localStorage for caching with timestamps.
// Data is stored as JSON string with {value, timestamp}.

export const cache = {
  /**
   * Retrieves a cached item if it exists and is not stale.
   * @param {string} key Cache key.
   * @param {number} maxAgeMs Maximum age in milliseconds. If omitted, returns any cached value.
   * @returns {any|null} Cached value or null if missing/expired.
   */
  get(key, maxAgeMs) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const { value, timestamp } = JSON.parse(raw);
      if (maxAgeMs !== undefined && Date.now() - timestamp > maxAgeMs) {
        // stale
        localStorage.removeItem(key);
        return null;
      }
      return value;
    } catch (e) {
      console.error('Cache get error:', e);
      return null;
    }
  },

  /**
   * Stores a value with current timestamp.
   * @param {string} key Cache key.
   * @param {any} value Value to cache (will be JSON serialized).
   */
  set(key, value) {
    try {
      const payload = { value, timestamp: Date.now() };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
      console.error('Cache set error:', e);
    }
  },

  /**
   * Clears a specific cache entry.
   * @param {string} key Cache key.
   */
  clear(key) {
    localStorage.removeItem(key);
  }
};
