/* Navigation Bar Component */
import store from '../store.js';

/**
 * Dynamically renders the global navigation header bar.
 * @param {string} activePage - The current active page ID to set active styling.
 * @param {function} navigateCallback - Navigation routing callback.
 */
export function renderNavbar(activePage, navigateCallback) {
  const mount = document.getElementById('navbar-mount');
  if (!mount) return;

  const currentUser = store.getCurrentUser();

  const links = [
    { id: 'feed', label: 'Feed', icon: 'fa-square-rss' },
    { id: 'combos', label: 'Dojo', icon: 'fa-gamepad' },
    { id: 'builder', label: 'Builder', icon: 'fa-hammer' },
    { id: 'strategy', label: 'Guides', icon: 'fa-book-open' },
    { id: 'hub', label: 'Strategy Hub', icon: 'fa-book' }
  ];

  let linksHtml = '';
  links.forEach(function (link) {
    const isActive = activePage === link.id ? 'active' : '';
    linksHtml += `
      <li class="wiki-nav-item">
        <a class="wiki-nav-link nav-link ${isActive}" data-page="${link.id}">
          <i class="fa-solid ${link.icon}"></i>
          <span class="wiki-nav-text">${link.label}</span>
        </a>
      </li>
    `;
  });

  // Profile link requires login, or redirects to auth
  const profileActive = activePage === 'profile' ? 'active' : '';
  linksHtml += `
    <li class="wiki-nav-item">
      <a class="wiki-nav-link nav-link ${profileActive}" data-page="profile">
        <i class="fa-solid fa-user"></i>
        <span class="wiki-nav-text">My Dojo</span>
      </a>
    </li>
  `;

  let authHtml = '';
  if (currentUser) {
    authHtml = `
      <div class="wiki-auth-panel">
        <div class="wiki-user-avatar" style="border: 2px solid ${currentUser.avatarColor}">
          ${currentUser.username.substring(0, 2).toUpperCase()}
        </div>
        <div class="wiki-user-info">
          <span class="wiki-user-name">${currentUser.username}</span>
          <button id="logout-btn" class="wiki-logout-btn">
            <i class="fa-solid fa-right-from-bracket"></i> Sign Out
          </button>
        </div>
      </div>
    `;
  } else {
    authHtml = `
      <div class="wiki-auth-actions">
        <button id="nav-login-btn" class="wiki-btn wiki-btn-outline">Log In</button>
        <button id="nav-register-btn" class="wiki-btn wiki-btn-primary">Sign Up</button>
      </div>
    `;
  }

  mount.innerHTML = `
    <aside class="wiki-left-nav">
      <div class="wiki-brand" id="nav-logo" style="cursor: pointer;">
        <i class="fa-solid fa-bolt wiki-brand-icon"></i>
        <span class="wiki-brand-text">HITCONFIRM</span>
      </div>
      
      <ul class="wiki-nav-menu">
        ${linksHtml}
      </ul>
      
      <div class="wiki-nav-footer">
        ${authHtml}
        <div id="repo-latest-update" class="wiki-update-log">
          <span class="pulse-dot"></span>
          <span class="update-text">Checking updates...</span>
        </div>
      </div>
    </aside>
  `;

  // Attach Event Listeners
  // Attach Event Listeners
  mount.querySelectorAll('.wiki-nav-link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const page = link.getAttribute('data-page');
      navigateCallback(page);
    });
  });

  const logo = mount.querySelector('#nav-logo');
  if (logo) {
    logo.addEventListener('click', function () {
      navigateCallback('feed');
    });
  }

  const logoutBtn = mount.querySelector('#logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      store.logout();
      window.showToast('Logged out successfully.');
      navigateCallback('feed');
    });
  }

  const loginBtn = mount.querySelector('#nav-login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', function () {
      window.openAuthModal('login', navigateCallback);
    });
  }

  const registerBtn = mount.querySelector('#nav-register-btn');
  if (registerBtn) {
    registerBtn.addEventListener('click', function () {
      window.openAuthModal('register', navigateCallback);
    });
  }

  // Fetch latest commit dynamically from GitHub
  async function fetchLatestCommit() {
    const badge = document.getElementById('repo-latest-update');
    if (!badge) return;

    function applyUpdateInfo(badgeEl, sha, msg, author, fullMsg, dateStr) {
      let displayDate = 'Recent';
      try {
        const commitDate = new Date(dateStr);
        displayDate = commitDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      } catch (e) {
        displayDate = dateStr ? dateStr.split('T')[0] : 'Recent';
      }

      badgeEl.title = `Commit ${sha}: ${fullMsg}\nBy ${author}\nDate: ${dateStr}`;
      const textEl = badgeEl.querySelector('.update-text');
      if (textEl) textEl.innerText = `Updated: ${displayDate}`;
    }

    function applyFallback(badgeEl) {
      badgeEl.title = "Offline mode or GitHub rate limits reached";
      const textEl = badgeEl.querySelector('.update-text');
      if (textEl) textEl.innerText = 'Updated: Jun 7, 2026';
      const pulseDot = badgeEl.querySelector('.pulse-dot');
      if (pulseDot) {
        pulseDot.style.backgroundColor = 'var(--color-primary)';
        pulseDot.style.boxShadow = '0 0 8px var(--color-primary)';
      }
    }

    // Check session cache first to prevent redundant API queries and rate limiting
    const cachedUpdate = sessionStorage.getItem('hc_latest_update');
    if (cachedUpdate) {
      try {
        const data = JSON.parse(cachedUpdate);
        applyUpdateInfo(badge, data.sha, data.msg, data.author, data.fullMsg, data.dateStr);
        return;
      } catch (e) {
        // Ignore JSON error and fetch fresh data
      }
    }

    try {
      const res = await fetch('src/data/updates.json');
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (data && data.sha) {
        applyUpdateInfo(badge, data.sha, data.msg, data.author, data.fullMsg, data.dateStr);

        // Cache the result in session storage
        sessionStorage.setItem('hc_latest_update', JSON.stringify({
          sha: data.sha,
          msg: data.msg,
          author: data.author,
          fullMsg: data.fullMsg,
          dateStr: data.dateStr
        }));
      }
    } catch (err) {
      console.error("Failed to load local updates configuration:", err);
      applyFallback(badge);
    }
  };

  // Run asynchronously without blocking main thread
  setTimeout(fetchLatestCommit, 100);
}
