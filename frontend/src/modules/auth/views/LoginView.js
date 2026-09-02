import { useAuthStore } from '@/core/stores/auth.js';

export function LoginView(route, router) {
  const authStore = useAuthStore();
  const container = document.createElement('div');
  container.className = 'login-container';

  const mockPresets = [
    { label: 'Director', user: 'director', pass: 'director123' },
    { label: 'Co-ordinator', user: 'coordinator', pass: 'password123' },
    { label: 'Finance Head', user: 'finance_head', pass: 'finance123' },
    { label: 'Faculty', user: 'faculty', pass: 'faculty123' },
    { label: 'Student', user: 'student', pass: 'student123' }
  ];

  container.innerHTML = `
    <div class="login-box animate-fade-in" style="max-width: 480px;">
      <div class="login-brand">
        <div class="logo-badge">R</div>
        <h2>RLABZ ERP</h2>
        <p class="hint">Please sign in to continue</p>
      </div>

      <div id="error-box" class="alert-error" style="display: none;"></div>

      <form id="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input id="email" type="email" required placeholder="name@rajagiri.edu" pattern=".*@rajagiri\.edu$" title="Email must contain @rajagiri.edu" />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <div style="position: relative;">
            <input id="password" type="password" required placeholder="Enter password" style="width: 100%; padding-right: 40px;" />
            <button type="button" id="toggle-password" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center;">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-eye"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>
        </div>
        <button id="submit-btn" type="submit" class="btn-primary">
          <span id="btn-text">Login to ERP</span>
        </button>
      </form>
    </div>
  `;

  const form = container.querySelector('#login-form');
  const emailInput = container.querySelector('#email');
  const passwordInput = container.querySelector('#password');
  const submitBtn = container.querySelector('#submit-btn');
  const btnText = container.querySelector('#btn-text');
  const errorBox = container.querySelector('#error-box');
  const togglePasswordBtn = container.querySelector('#toggle-password');

  togglePasswordBtn.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    if (type === 'text') {
      togglePasswordBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-eye-off"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
    } else {
      togglePasswordBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-eye"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    submitBtn.disabled = true;
    btnText.innerHTML = `<div class="spinner"></div> Authenticating...`;
    errorBox.style.display = 'none';

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email.includes('@rajagiri.edu')) {
      errorBox.textContent = 'Email must contain @rajagiri.edu';
      errorBox.style.display = 'block';
      submitBtn.disabled = false;
      btnText.textContent = 'Login to ERP';
      return;
    }

    const success = await authStore.login(email, password);

    if (success) {
      const targetRoute = authStore.user?.defaultRoute || '/dashboard';
      router.push(targetRoute);
    } else {
      errorBox.textContent = 'Invalid email or password.';
      errorBox.style.display = 'block';
      submitBtn.disabled = false;
      btnText.textContent = 'Login to ERP';
    }
  });

  return container;
}

export default LoginView;
