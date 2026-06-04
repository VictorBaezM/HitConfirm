/* User Registration & Login Modal Handlers */
import store from '../store.js';

export function openAuthModal(type = 'login', navigateCallback) {
  const overlay = document.getElementById('modal-container');
  const titleMount = document.getElementById('modal-title');
  const bodyMount = document.getElementById('modal-body');
  
  if (!overlay || !bodyMount) return;

  const games = store.getGames();

  if (type === 'login') {
    titleMount.innerText = 'DOJO MEMBER SIGN-IN';
    bodyMount.innerHTML = `
      <div class="form-group">
        <label class="form-label">Username</label>
        <input type="text" id="auth-username" class="form-input" placeholder="Enter your username..." />
      </div>
      <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 16px;">
        Demo Accounts: <strong>SolManiac</strong>, <strong>DaigoFan99</strong>, or <strong>ElectricWindGod</strong>. Or type a new name and click "Create Account" instead!
      </div>
      
      <div class="flex justify-between items-center" style="margin-top: 24px;">
        <a id="btn-toggle-auth-reg" href="#" style="font-size: 0.85rem; font-family: var(--font-heading); font-weight: 700;">Create an account</a>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm" id="btn-auth-cancel">Cancel</button>
          <button class="btn btn-primary btn-sm" id="btn-auth-submit">Sign In</button>
        </div>
      </div>
    `;

    // Sign in trigger
    const submitBtn = bodyMount.querySelector('#btn-auth-submit');
    const usernameInput = bodyMount.querySelector('#auth-username');
    
    const handleLogin = () => {
      const usernameVal = usernameInput.value.trim();
      if (!usernameVal) {
        window.showToast('Please type a username.');
        return;
      }

      const result = store.loginUser(usernameVal);
      if (result.success) {
        window.showToast(`Welcome back, ${result.user.username}!`);
        overlay.classList.remove('open');
        navigateCallback('feed');
      } else {
        window.showToast(result.error || 'Login failed.');
      }
    };

    submitBtn.addEventListener('click', handleLogin);
    usernameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleLogin();
    });

    bodyMount.querySelector('#btn-toggle-auth-reg').addEventListener('click', (e) => {
      e.preventDefault();
      openAuthModal('register', navigateCallback);
    });

  } else {
    titleMount.innerText = 'CREATE DOJO ACCOUNT';
    bodyMount.innerHTML = `
      <div class="form-group">
        <label class="form-label">Create Username</label>
        <input type="text" id="auth-username" class="form-input" placeholder="Choose a unique username..." />
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">Main Game</label>
          <select id="auth-game" class="form-select">
            ${Object.values(games).map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label">Main Character</label>
          <select id="auth-char" class="form-select"></select>
        </div>
      </div>

      <div class="flex justify-between items-center" style="margin-top: 24px;">
        <a id="btn-toggle-auth-login" href="#" style="font-size: 0.85rem; font-family: var(--font-heading); font-weight: 700;">Already have account?</a>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm" id="btn-auth-cancel">Cancel</button>
          <button class="btn btn-primary btn-sm" id="btn-auth-submit">Register</button>
        </div>
      </div>
    `;

    const gameSel = bodyMount.querySelector('#auth-game');
    const charSel = bodyMount.querySelector('#auth-char');

    const fillChars = () => {
      const gameId = gameSel.value;
      charSel.innerHTML = games[gameId].characters.map(c => `<option value="${c}">${c}</option>`).join('');
    };

    gameSel.addEventListener('change', fillChars);
    fillChars();

    // Register trigger
    const submitBtn = bodyMount.querySelector('#btn-auth-submit');
    const usernameInput = bodyMount.querySelector('#auth-username');
    
    const handleRegister = () => {
      const usernameVal = usernameInput.value.trim();
      if (!usernameVal) {
        window.showToast('Please choose a username.');
        return;
      }

      const result = store.registerUser(usernameVal, gameSel.value, charSel.value);
      if (result.success) {
        window.showToast(`Account created! Welcome, ${result.user.username}!`);
        overlay.classList.remove('open');
        navigateCallback('profile');
      } else {
        window.showToast(result.error || 'Failed to create account.');
      }
    };

    submitBtn.addEventListener('click', handleRegister);
    usernameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleRegister();
    });

    bodyMount.querySelector('#btn-toggle-auth-login').addEventListener('click', (e) => {
      e.preventDefault();
      openAuthModal('login', navigateCallback);
    });
  }

  // Common Close listeners
  bodyMount.querySelector('#btn-auth-cancel').addEventListener('click', () => {
    overlay.classList.remove('open');
  });

  overlay.classList.add('open');
}

// Attach globally so components can invoke easily
window.openAuthModal = openAuthModal;
