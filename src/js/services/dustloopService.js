// src/js/services/dustloopService.js
// Service to fetch and parse frame data from Dustloop for a given game.
// Uses fetch to retrieve the HTML page, then DOMParser to extract the frame data table.

export const dustloopService = {
  // Mapping from internal game IDs to Dustloop URL slugs.
  gameUrlMap: {
    // Example IDs – adjust to match your store game IDs.
    ggst: "guilty-gear-strive",
    sf6: "street-fighter-6",
    tekken7: "tekken-7",
    // Add more mappings as needed.
  },

  /**
   * Build the full URL for a game's frame data page.
   * @param {string} gameId Internal game identifier.
   * @returns {string|null} Full URL or null if unknown.
   */
  getGameUrl(gameId) {
    const slug = this.gameUrlMap[gameId];
    if (!slug) return null;
    return `https://www.dustloop.com/frames/${slug}/`;
  },

  /**
   * Fetch the raw HTML for a game's frame data page.
   * @param {string} gameId
   * @returns {Promise<string>} HTML string.
   */
  async fetchGameHtml(gameId) {
    const url = this.getGameUrl(gameId);
    if (!url) throw new Error(`No Dustloop URL mapping for gameId ${gameId}`);
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) throw new Error(`Failed to fetch Dustloop page: ${response.status}`);
    return await response.text();
  },

  /**
   * Parse the frame data table from Dustloop HTML.
   * Returns an array of objects where each object represents a move.
   * @param {string} html
   * @returns {Array<Object>}
   */
  parseFrameData(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    // Dustloop frames are inside a table with class "frame-data" (may vary).
    const table = doc.querySelector("table.frame-data, table#movelist, table[data-table='frame']");
    if (!table) return [];
    const headers = [];
    const headerCells = table.querySelectorAll("thead th");
    headerCells.forEach((th) => headers.push(th.textContent.trim()));
    const rows = [];
    const tbodyRows = table.querySelectorAll("tbody tr");
    tbodyRows.forEach((tr) => {
      const cells = tr.querySelectorAll("td");
      const rowObj = {};
      cells.forEach((td, idx) => {
        const key = headers[idx] || `col${idx}`;
        rowObj[key] = td.textContent.trim();
      });
      rows.push(rowObj);
    });
    return rows;
  },

  /**
   * Public API – fetch parsed frame data for a given game.
   * @param {string} gameId Internal game ID.
   * @returns {Promise<Array<Object>>}
   */
  async fetchGameData(gameId) {
    const html = await this.fetchGameHtml(gameId);
    return this.parseFrameData(html);
  },
};
