import { useAuthStore } from '@/core/stores/auth.js';

export function LoginView(route, router) {
  const authStore = useAuthStore();
  const container = document.createElement('div');
  container.className = 'login-container';

  const mockPresets = [
    { label: 'Director', user: 'director', pass: 'director123' },
    { label: 'Co-ordinator', user: 'coordinator', pass: 'coord123' },
    { label: 'Finance Head', user: 'finance_head', pass: 'finance123' },
    { label: 'Faculty', user: 'faculty', pass: 'faculty123' },
    { label: 'Student', user: 'student', pass: 'student123' }
  ];

  container.innerHTML = `
    <div class="login-box animate-fade-in" style="max-width: 480px;">
      <div class="login-brand">
        <div class="logo-badge">R</div>
        <h2>RLABZ ERP</h2>
        <p class="hint">Select a role below or enter mock credentials:</p>
      </div>

      <!-- Quick Role Switcher Buttons for Demo -->
      <div class="role-selector-bar" style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 20px; justify-content: center;">
        ${mockPresets.map(p => `
          <button type="button" class="role-chip-btn" data-user="${p.user}" data-pass="${p.pass}" style="padding: 6px 12px; font-size: 0.78rem; font-weight: 600; border-radius: 20px; border: 1px solid var(--border-color); background: #f1f5f9; color: var(--text-main); cursor: pointer; transition: all 0.2s;">
            ${p.label}
          </button>
        `).join('')}
      </div>

      <div id="error-box" class="alert-error" style="display: none;"></div>

      <form id="login-form">
        <div class="form-group">
          <label for="username">Username</label>
          <input id="username" type="text" value="director" required placeholder="Enter username" />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input id="password" type="password" value="director123" required placeholder="Enter password" />
        </div>
        <button id="submit-btn" type="submit" class="btn-primary">
          <span id="btn-text">Login to ERP</span>
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

  // Quick preset button handlers
  container.querySelectorAll('.role-chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      usernameInput.value = btn.dataset.user;
      passwordInput.value = btn.dataset.pass;
      
      // Visual active indicator
      container.querySelectorAll('.role-chip-btn').forEach(b => {
        b.style.background = '#f1f5f9';
        b.style.color = 'var(--text-main)';
        b.style.borderColor = 'var(--border-color)';
      });
      btn.style.background = 'var(--primary)';
      btn.style.color = '#ffffff';
      btn.style.borderColor = 'var(--primary)';
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    submitBtn.disabled = true;
    btnText.innerHTML = `<div class="spinner"></div> Authenticating...`;
    errorBox.style.display = 'none';

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    const success = await authStore.login(username, password);

    if (success) {
      const targetRoute = authStore.user?.defaultRoute || '/dashboard';
      router.push(targetRoute);
    } else {
      errorBox.textContent = 'Invalid credentials. Refer to MOCK_LOGIN_CREDENTIALS.txt.';
      errorBox.style.display = 'block';
      submitBtn.disabled = false;
      btnText.textContent = 'Login to ERP';
    }
  });

  return container;
}

export default LoginView;
