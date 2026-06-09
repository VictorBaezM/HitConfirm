/* User Registration & Login Modal Handlers */
import store from '../store.js';
import { validatePasswordStrength } from '../utils/security.js';

/**
 * Renders and launches the authentication login or registration form inside the global modal overlay.
 * @param {string} [type='login'] - Type of the auth form ('login' or 'register').
 * @param {function} navigateCallback - SPA router callback to trigger page changes after successful login.
 */
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
        <label class="form-label">Email Address</label>
        <input type="email" id="auth-email" class="form-input" placeholder="Enter your email..." />
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input type="password" id="auth-password" class="form-input" placeholder="Enter your password..." />
      </div>
      
      <div class="flex justify-between items-center mt-6">
        <a id="btn-toggle-auth-reg" href="#" class="auth-toggle-link">Create an account</a>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm" id="btn-auth-cancel">Cancel</button>
          <button class="btn btn-primary btn-sm" id="btn-auth-submit">Sign In</button>
        </div>
      </div>
    `;

    // Sign in trigger
    const submitBtn = bodyMount.querySelector('#btn-auth-submit');
    const emailInput = bodyMount.querySelector('#auth-email');
    const passwordInput = bodyMount.querySelector('#auth-password');
    
    async function handleLogin() {
      const emailVal = emailInput.value.trim();
      const passwordVal = passwordInput.value;
      if (!emailVal || !passwordVal) {
        window.showToast('Please enter your email and password.');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerText = 'Signing In...';

      try {
        const result = await store.loginUser(emailVal, passwordVal);
        if (result.success) {
          window.showToast(`Welcome back, ${result.user.username}!`);
          overlay.classList.remove('open');
          navigateCallback('feed');
        } else {
          window.showToast(result.error || 'Login failed.');
        }
      } catch (err) {
        window.showToast(err.message || 'An unexpected error occurred.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Sign In';
      }
    }

    submitBtn.addEventListener('click', handleLogin);
    
    // Support enter key on both fields
    emailInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') handleLogin();
    });
    passwordInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') handleLogin();
    });

    bodyMount.querySelector('#btn-toggle-auth-reg').addEventListener('click', function (e) {
      e.preventDefault();
      openAuthModal('register', navigateCallback);
    });

  } else {
    titleMount.innerText = 'CREATE DOJO ACCOUNT';
    bodyMount.innerHTML = `
      <div class="form-group">
        <label class="form-label">Username</label>
        <input type="text" id="auth-username" class="form-input" placeholder="Choose a unique username..." />
      </div>

      <div class="form-group">
        <label class="form-label">Email Address</label>
        <input type="email" id="auth-email" class="form-input" placeholder="Enter your email address..." />
      </div>

      <div class="form-group">
        <label class="form-label">Password</label>
        <input type="password" id="auth-password" class="form-input" placeholder="Choose a secure password..." />
      </div>

      <div class="auth-modal-grid-2col">
        <div class="form-group mb-0">
          <label class="form-label">Main Game</label>
          <select id="auth-game" class="form-select">
            ${Object.values(games).map(function (g) {
              return `<option value="${g.id}">${g.name}</option>`;
            }).join('')}
          </select>
        </div>
        <div class="form-group mb-0">
          <label class="form-label">Main Character</label>
          <select id="auth-char" class="form-select"></select>
        </div>
      </div>

      <div class="flex justify-between items-center mt-6">
        <a id="btn-toggle-auth-login" href="#" class="auth-toggle-link">Already have account?</a>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm" id="btn-auth-cancel">Cancel</button>
          <button class="btn btn-primary btn-sm" id="btn-auth-submit">Register</button>
        </div>
      </div>
    `;

    const gameSel = bodyMount.querySelector('#auth-game');
    const charSel = bodyMount.querySelector('#auth-char');

    function fillChars() {
      const gameId = gameSel.value;
      charSel.innerHTML = games[gameId].characters.map(function (c) {
        return `<option value="${c}">${c}</option>`;
      }).join('');
    }

    gameSel.addEventListener('change', fillChars);
    fillChars();

    // Register trigger
    const submitBtn = bodyMount.querySelector('#btn-auth-submit');
    const usernameInput = bodyMount.querySelector('#auth-username');
    const emailInput = bodyMount.querySelector('#auth-email');
    const passwordInput = bodyMount.querySelector('#auth-password');
    
    async function handleRegister() {
      const usernameVal = usernameInput.value.trim();
      const emailVal = emailInput.value.trim();
      const passwordVal = passwordInput.value;

      if (!usernameVal || !emailVal || !passwordVal) {
        window.showToast('Please fill out all credentials.');
        return;
      }

      const passwordCheck = validatePasswordStrength(passwordVal);
      if (!passwordCheck.isValid) {
        window.showToast(passwordCheck.message, 5000);
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerText = 'Registering...';

      try {
        const result = await store.registerUser(emailVal, passwordVal, usernameVal, gameSel.value, charSel.value);
        if (result.success) {
          if (result.message) {
            window.showToast(result.message, 6000);
          } else {
            window.showToast(`Account created! Welcome, ${result.user.username}!`);
          }
          overlay.classList.remove('open');
          navigateCallback(result.message ? 'feed' : 'profile');
        } else {
          window.showToast(result.error || 'Failed to create account.');
        }
      } catch (err) {
        window.showToast(err.message || 'An unexpected error occurred.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Register';
      }
    }

    submitBtn.addEventListener('click', handleRegister);
    
    usernameInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') handleRegister();
    });
    emailInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') handleRegister();
    });
    passwordInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') handleRegister();
    });

    bodyMount.querySelector('#btn-toggle-auth-login').addEventListener('click', function (e) {
      e.preventDefault();
      openAuthModal('login', navigateCallback);
    });
  }

  // Common Close listeners
  bodyMount.querySelector('#btn-auth-cancel').addEventListener('click', function () {
    overlay.classList.remove('open');
  });

  overlay.classList.add('open');
}

// Attach globally so components can invoke easily
window.openAuthModal = openAuthModal;
