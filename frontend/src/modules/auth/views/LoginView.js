import { useAuthStore } from '@/core/stores/auth.js';

export function LoginView(route, router) {
  const authStore = useAuthStore();
  const container = document.createElement('div');
  container.className = 'login-container';

  container.innerHTML = `
    <div class="login-box animate-fade-in">
      <div class="login-brand">
        <div class="logo-badge">R</div>
        <h2>RLABZ ERP</h2>
        <p class="hint">Use <code>admin</code> / <code>password</code> to test the mock auth.</p>
      </div>

      <div id="error-box" class="alert-error" style="display: none;"></div>

      <form id="login-form">
        <div class="form-group">
          <label for="username">Username</label>
          <input id="username" type="text" value="admin" required placeholder="Enter username" />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input id="password" type="password" value="password" required placeholder="Enter password" />
        </div>
        <button id="submit-btn" type="submit" class="btn-primary">
          <span id="btn-text">Login</span>
        </button>
      </form>
    </div>
  `;

  const form = container.querySelector('#login-form');
  const usernameInput = container.querySelector('#username');
  const passwordInput = container.querySelector('#password');
  const submitBtn = container.querySelector('#submit-btn');
  const btnText = container.querySelector('#btn-text');
  const errorBox = container.querySelector('#error-box');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Set loading state
    submitBtn.disabled = true;
    btnText.innerHTML = `<div class="spinner"></div> Logging in...`;
    errorBox.style.display = 'none';

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    const success = await authStore.login(username, password);

    if (success) {
      router.push('/dashboard');
    } else {
      errorBox.textContent = 'Invalid credentials. Please use admin / password.';
      errorBox.style.display = 'block';
      submitBtn.disabled = false;
      btnText.textContent = 'Login';
    }
  });

  return container;
}

export default LoginView;
