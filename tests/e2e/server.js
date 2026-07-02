/**
 * Static file server for Playwright E2E tests.
 * Serves the HitConfirm SPA root on http://localhost:5000
 * with correct MIME types for ES modules (.js → text/javascript).
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
const ROOT = path.join(__dirname, '..', '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.mjs':  'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

http.createServer((req, res) => {
  // Intercept Vercel API routes for offline testing
  const parsedUrl = req.url.split('?')[0];
  if (parsedUrl.startsWith('/api/')) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    if (
      parsedUrl === '/api/combos/save' ||
      parsedUrl === '/api/posts/create' ||
      parsedUrl === '/api/combos/vote' ||
      parsedUrl === '/api/posts/vote' ||
      parsedUrl === '/api/combos/comment' ||
      parsedUrl === '/api/strategies/vote' ||
      parsedUrl === '/api/strategies/save'
    ) {
      return res.end(JSON.stringify({ success: true }));
    }
    if (parsedUrl === '/api/news') {
      const newsMock = [
        { gameId: 'sf6', title: 'Check out gameplay for the first Year 4 character, Yasmine!', date: 'Jun 18, 2026', url: 'https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1835871199303153' },
        { gameId: 't8', title: 'Kunimitsu is available', date: 'Jun 2, 2026', url: 'https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1833968530900260' },
        { gameId: 'ggst', title: 'Ranked Match Phase 4 is LIVE!', date: 'Jun 1, 2026', url: 'https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1833968530899308' },
        { gameId: 'dbfz', title: 'WILD POWER AWAKENS', date: 'Apr 20, 2026', url: 'https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1830163047266250' },
        { gameId: 'gbvsr', title: 'Deluxe Character Passes Are on Sale Now!', date: 'Jun 11, 2026', url: 'https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1835236783562335' },
        { gameId: 'dnfd', title: '📣Spring Sale 2025 is LIVE! DNF Duel & Season Pass 70% OFF NOW📣', date: 'Mar 12, 2025', url: 'https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1794014851381295' },
        { gameId: 'ssbu', title: 'Super Smash Bros. Ultimate active development has concluded. Version 13.0.3 is live.', date: 'January 25, 2026', url: 'https://www.nintendo.com' }
      ];
      return res.end(JSON.stringify(newsMock));
    }
    if (parsedUrl === '/api/dustloop') {
      const queryParams = new URL(req.url, `http://${req.headers.host || 'localhost'}`).searchParams;
      const gameId = queryParams.get('gameId') || 'ggst';
      let jsonPath = '';
      if (gameId === 'sf6') {
        jsonPath = path.join(ROOT, 'src', 'data', 'sf6_cached.json');
      } else if (gameId === 't8') {
        jsonPath = path.join(ROOT, 'src', 'data', 't8_cached.json');
      } else if (gameId === 'ggst') {
        jsonPath = path.join(ROOT, 'src', 'data', 'ggst_cached.json');
      } else {
        let charaName = 'dummy';
        if (gameId === 'dnfd') {
          charaName = 'Grappler';
        } else if (gameId === 'dbfz') {
          charaName = 'Goku (Super Saiyan)';
        } else if (gameId === 'dbfzce') {
          charaName = 'SS Goku';
        } else if (gameId === 'gbvsr') {
          charaName = 'Anila';
        }
        const dummyMove = {
          character: charaName,
          name: 'Standing Light Punch',
          input: '5LP',
          damage: '400',
          startup: '5',
          active: '2',
          recovery: '10',
          blockAdv: '-2',
          hitAdv: '+3'
        };
        return res.end(JSON.stringify([dummyMove]));
      }
      fs.readFile(jsonPath, (err, fileData) => {
        if (err) {
          res.writeHead(500);
          return res.end(JSON.stringify({ error: err.message }));
        }
        return res.end(fileData);
      });
      return;
    }
    return res.end(JSON.stringify([]));
  }

  // Default to index.html for SPA root
  let urlPath = req.url === '/' ? '/index.html' : req.url;
  // Strip query strings
  urlPath = urlPath.split('?')[0];

  const filePath = path.join(ROOT, urlPath);
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // If it is a virtual SPA route (no file extension), serve index.html
      if (!ext) {
        const indexHtmlPath = path.join(ROOT, 'index.html');
        fs.readFile(indexHtmlPath, (errIndex, dataIndex) => {
          if (errIndex) {
            res.writeHead(404);
            res.end('Not found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(dataIndex);
          }
        });
        return;
      }
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`HitConfirm test server running at http://localhost:${PORT}`);
});
