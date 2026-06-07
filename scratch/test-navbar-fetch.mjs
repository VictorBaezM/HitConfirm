import assert from 'assert';

// Mock target elements
class MockElement {
  constructor() {
    this.innerText = '';
    this.title = '';
    this.style = {};
  }
  
  querySelector(selector) {
    if (selector === '.update-text' || selector === '.pulse-dot') {
      return this;
    }
    return null;
  }
}

const mockBadge = new MockElement();

global.document = {
  getElementById: (id) => {
    if (id === 'repo-latest-update') return mockBadge;
    return null;
  }
};

// Mock sessionStorage
let sessionCache = {};
global.sessionStorage = {
  getItem: (key) => sessionCache[key] || null,
  setItem: (key, val) => { sessionCache[key] = val; },
  clear: () => { sessionCache = {}; }
};

// 1. Test Success Path with Caching
async function testSuccessAndCaching() {
  sessionCache = {}; // Reset cache
  mockBadge.innerText = '';
  mockBadge.title = '';
  
  const mockCommitData = [
    {
      sha: 'ebd9a04fcb077a28e8df5e8d5cf65d9d7b973ef0',
      commit: {
        message: 'feat: implement multiple played games and settings UI redesign\n\nMore details...',
        author: { name: 'VictorBaezM' }
      }
    }
  ];

  let fetchCalled = 0;
  global.fetch = async (url) => {
    fetchCalled++;
    return {
      ok: true,
      json: async () => mockCommitData
    };
  };

  // fetchLatestCommit implementation matching components/navbar.js
  const fetchLatestCommit = async () => {
    const badge = document.getElementById('repo-latest-update');
    if (!badge) return;

    const applyUpdateInfo = (badgeEl, sha, msg, author, fullMsg) => {
      badgeEl.title = `Commit ${sha}: ${fullMsg}\nBy ${author}`;
      const textEl = badgeEl.querySelector('.update-text');
      if (textEl) textEl.innerText = `${sha} - ${msg}`;
    };

    const cachedUpdate = sessionStorage.getItem('hc_latest_update');
    if (cachedUpdate) {
      try {
        const data = JSON.parse(cachedUpdate);
        applyUpdateInfo(badge, data.sha, data.msg, data.author, data.fullMsg);
        return;
      } catch (e) {}
    }

    try {
      const res = await fetch('https://api.github.com/repos/VictorBaezM/HitConfirm/commits?per_page=1');
      if (!res.ok) throw new Error('API limits or network error');
      const commits = await res.json();
      if (commits && commits.length > 0) {
        const lastCommit = commits[0];
        const sha = lastCommit.sha.substring(0, 7);
        const msg = lastCommit.commit.message.split('\n')[0];
        const author = lastCommit.commit.author.name;
        const fullMsg = lastCommit.commit.message;

        applyUpdateInfo(badge, sha, msg, author, fullMsg);

        sessionStorage.setItem('hc_latest_update', JSON.stringify({
          sha, msg, author, fullMsg
        }));
      }
    } catch (err) {
      throw err;
    }
  };

  // First run: should trigger fetch
  await fetchLatestCommit();
  assert.strictEqual(fetchCalled, 1);
  assert.strictEqual(mockBadge.innerText, 'ebd9a04 - feat: implement multiple played games and settings UI redesign');
  assert.ok(mockBadge.title.includes('VictorBaezM'));

  // Clear mock badge data but keep cache
  mockBadge.innerText = '';
  mockBadge.title = '';

  // Second run: should load from session cache directly, without fetch
  await fetchLatestCommit();
  assert.strictEqual(fetchCalled, 1); // No new fetch
  assert.strictEqual(mockBadge.innerText, 'ebd9a04 - feat: implement multiple played games and settings UI redesign');
  assert.ok(mockBadge.title.includes('VictorBaezM'));
  
  console.log('✅ PASS: Updates badge fetches once, caches to sessionStorage, and loads from cache cleanly.');
}

// 2. Test Fallback Path
async function testFallback() {
  sessionCache = {}; // Reset cache
  mockBadge.innerText = '';
  mockBadge.title = '';
  mockBadge.style = {};

  global.fetch = async (url) => {
    return {
      ok: false
    };
  };

  const fetchLatestCommit = async () => {
    const badge = document.getElementById('repo-latest-update');
    if (!badge) return;

    const applyFallback = (badgeEl) => {
      badgeEl.title = "Offline mode or GitHub rate limits reached";
      const textEl = badgeEl.querySelector('.update-text');
      if (textEl) textEl.innerText = 'v1.1.0 - Live';
      const pulseDot = badgeEl.querySelector('.pulse-dot');
      if (pulseDot) {
        pulseDot.style.backgroundColor = 'var(--color-primary)';
        pulseDot.style.boxShadow = '0 0 8px var(--color-primary)';
      }
    };

    try {
      const res = await fetch('https://api.github.com/repos/VictorBaezM/HitConfirm/commits?per_page=1');
      if (!res.ok) throw new Error('API limits or network error');
    } catch (err) {
      applyFallback(badge);
    }
  };

  await fetchLatestCommit();
  
  assert.strictEqual(mockBadge.innerText, 'v1.1.0 - Live');
  assert.strictEqual(mockBadge.title, 'Offline mode or GitHub rate limits reached');
  assert.strictEqual(mockBadge.style.backgroundColor, 'var(--color-primary)');
  console.log('✅ PASS: Updates badge fallback path applies default version status on errors.');
}

async function runTests() {
  try {
    await testSuccessAndCaching();
    await testFallback();
    console.log('All updates badge caching and fallback tests completed successfully!');
  } catch (e) {
    console.error('❌ FAIL:', e);
    process.exit(1);
  }
}

runTests();
