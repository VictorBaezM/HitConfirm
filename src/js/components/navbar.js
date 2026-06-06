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
        <span style="font-family: var(--font-heading); font-weight: 700; font-size: 0.9rem;">
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
      <div class="nav-brand" style="cursor: pointer;" id="nav-logo">
        <i class="fa-solid fa-bolt" style="color: var(--color-primary); filter: drop-shadow(var(--glow-primary));"></i>
        <span>HIT</span>CONFIRM
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
}
