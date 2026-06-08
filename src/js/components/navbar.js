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
    { id: 'strategy', label: 'Guides', icon: 'fa-book-open' }
  ];

  let linksHtml = '';
  links.forEach(link => {
    const isActive = activePage === link.id ? 'active' : '';
    linksHtml += `
      <li>
        <a class="nav-link ${isActive}" data-page="${link.id}">
          <i class="fa-solid ${link.icon}"></i>
          <span>${link.label}</span>
        </a>
      </li>
    `;
  });

  // Profile link requires login, or redirects to auth
  const profileActive = activePage === 'profile' ? 'active' : '';
  linksHtml += `
    <li>
      <a class="nav-link ${profileActive}" data-page="profile">
        <i class="fa-solid fa-user"></i>
        <span>My Dojo</span>
      </a>
    </li>
  `;

  let authHtml = '';
  if (currentUser) {
    authHtml = `
      <div class="nav-actions">
        <div class="avatar" style="border-color: ${currentUser.avatarColor}">
          ${currentUser.username.substring(0, 2).toUpperCase()}
        </div>
        <span class="nav-user-label">
          ${currentUser.username}
        </span>
        <button id="logout-btn" class="btn btn-secondary btn-sm">
          <i class="fa-solid fa-right-from-bracket"></i>
        </button>
      </div>
    `;
  } else {
    authHtml = `
      <div class="nav-actions">
        <button id="nav-login-btn" class="btn btn-accent btn-sm">Log In</button>
        <button id="nav-register-btn" class="btn btn-primary btn-sm">Sign Up</button>
      </div>
    `;
  }

  mount.innerHTML = `
    <nav class="navbar">
      <div class="nav-flex-wrapper">
        <div class="nav-brand nav-logo-brand" id="nav-logo">
          <i class="fa-solid fa-bolt nav-logo-icon"></i>
          <span>HIT</span>CONFIRM
        </div>
        <div id="repo-latest-update" class="repo-update-badge">
          <span class="pulse-dot"></span>
          <span class="update-text">Checking updates...</span>
        </div>
      </div>
      <ul class="nav-links">
        ${linksHtml}
      </ul>
      ${authHtml}
    </nav>
  `;

  // Attach Event Listeners
  mount.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.getAttribute('data-page');
      navigateCallback(page);
    });
  });

  const logo = mount.querySelector('#nav-logo');
  if (logo) {
    logo.addEventListener('click', () => navigateCallback('feed'));
  }

  const logoutBtn = mount.querySelector('#logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      store.logout();
      window.showToast('Logged out successfully.');
      navigateCallback('feed');
    });
  }

  const loginBtn = mount.querySelector('#nav-login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      window.openAuthModal('login', navigateCallback);
    });
  }

  const registerBtn = mount.querySelector('#nav-register-btn');
  if (registerBtn) {
    registerBtn.addEventListener('click', () => {
      window.openAuthModal('register', navigateCallback);
    });
  }

  // Fetch latest commit dynamically from GitHub
  const fetchLatestCommit = async () => {
    const badge = document.getElementById('repo-latest-update');
    if (!badge) return;

    const applyUpdateInfo = (badgeEl, sha, msg, author, fullMsg, dateStr) => {
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
    };

    const applyFallback = (badgeEl) => {
      badgeEl.title = "Offline mode or GitHub rate limits reached";
      const textEl = badgeEl.querySelector('.update-text');
      if (textEl) textEl.innerText = 'Updated: Jun 7, 2026';
      const pulseDot = badgeEl.querySelector('.pulse-dot');
      if (pulseDot) {
        pulseDot.style.backgroundColor = 'var(--color-primary)';
        pulseDot.style.boxShadow = '0 0 8px var(--color-primary)';
      }
    };

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
      const res = await fetch('https://api.github.com/repos/VictorBaezM/HitConfirm/commits?per_page=1');
      if (!res.ok) throw new Error('API limits or network error');
      const commits = await res.json();
      if (commits && commits.length > 0) {
        const lastCommit = commits[0];
        const sha = lastCommit.sha.substring(0, 7);
        const msg = lastCommit.commit.message.split('\n')[0];
        const author = lastCommit.commit.author.name;
        const fullMsg = lastCommit.commit.message;
        const dateStr = lastCommit.commit.committer.date;

        applyUpdateInfo(badge, sha, msg, author, fullMsg, dateStr);

        // Cache the result in session storage
        sessionStorage.setItem('hc_latest_update', JSON.stringify({
          sha, msg, author, fullMsg, dateStr
        }));
      }
    } catch (err) {
      console.warn("Could not fetch latest updates:", err);
      applyFallback(badge);
    }
  };

  // Run asynchronously without blocking main thread
  setTimeout(fetchLatestCommit, 100);
}
