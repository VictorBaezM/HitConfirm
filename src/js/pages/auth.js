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
      <form id="auth-login-form">
        <div class="form-group">
          <label class="form-label" for="auth-email">Email Address</label>
          <input type="email" id="auth-email" name="email" class="form-input" placeholder="Enter your email..." required autocomplete="username" />
        </div>
        <div class="form-group">
          <label class="form-label" for="auth-password">Password</label>
          <input type="password" id="auth-password" name="password" class="form-input" placeholder="Enter your password..." required autocomplete="current-password" />
        </div>
        
        <div class="flex justify-between items-center mt-6">
          <a id="btn-toggle-auth-reg" href="#" class="auth-toggle-link">Create an account</a>
          <div class="flex gap-2">
            <button type="button" class="btn btn-secondary btn-sm" id="btn-auth-cancel">Cancel</button>
            <button type="submit" class="btn btn-primary btn-sm" id="btn-auth-submit">Sign In</button>
          </div>
        </div>
      </form>
    `;

    // Sign in trigger
    const form = bodyMount.querySelector('#auth-login-form');
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

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      handleLogin();
    });

    bodyMount.querySelector('#btn-toggle-auth-reg').addEventListener('click', function (e) {
      e.preventDefault();
      openAuthModal('register', navigateCallback);
    });

  } else {
    titleMount.innerText = 'CREATE DOJO ACCOUNT';
    bodyMount.innerHTML = `
      <form id="auth-register-form">
        <div class="form-group">
          <label class="form-label" for="auth-username">Username</label>
          <input type="text" id="auth-username" name="username" class="form-input" placeholder="Choose a unique username..." required autocomplete="username" />
        </div>

        <div class="form-group">
          <label class="form-label" for="auth-email">Email Address</label>
          <input type="email" id="auth-email" name="email" class="form-input" placeholder="Enter your email address..." required autocomplete="email" />
        </div>

        <div class="form-group">
          <label class="form-label" for="auth-password">Password</label>
          <input type="password" id="auth-password" name="password" class="form-input" placeholder="Choose a secure password..." required autocomplete="new-password" />
        </div>

        <div class="auth-modal-grid-2col">
          <div class="form-group mb-0">
            <label class="form-label" for="auth-game">Main Game</label>
            <select id="auth-game" name="game" class="form-select">
              ${Object.values(games).map(function (g) {
                return `<option value="${g.id}">${g.name}</option>`;
              }).join('')}
            </select>
          </div>
          <div class="form-group mb-0">
            <label class="form-label" for="auth-char">Main Character</label>
            <select id="auth-char" name="character" class="form-select"></select>
          </div>
        </div>

        <div class="flex justify-between items-center mt-6">
          <a id="btn-toggle-auth-login" href="#" class="auth-toggle-link">Already have account?</a>
          <div class="flex gap-2">
            <button type="button" class="btn btn-secondary btn-sm" id="btn-auth-cancel">Cancel</button>
            <button type="submit" class="btn btn-primary btn-sm" id="btn-auth-submit">Register</button>
          </div>
        </div>
      </form>
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
    const form = bodyMount.querySelector('#auth-register-form');
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

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      handleRegister();
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
