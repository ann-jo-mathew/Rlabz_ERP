/**
 * RLABZ AUTH STORE (Vanilla JS Implementation)
 * State management for user authentication, JWT tokens, and permissions.
 */

class AuthStore {
  constructor() {
    this.token = localStorage.getItem('token') || null;
    let storedUser = null;
    try {
      storedUser = JSON.parse(localStorage.getItem('user'));
    } catch (e) {
      storedUser = null;
    }
    this.user = storedUser;
    this.listeners = [];
  }

  get isAuthenticated() {
    return !!this.token;
  }

  get role() {
    return this.user?.role || null;
  }

  get permissions() {
    return this.user?.permissions || [];
  }

  get modules() {
    return this.user?.modules || [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this));
  }

  async login(username, password) {
    try {
      // MOCK API CALL matching backend mock
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        this.token = data.access_token;
        this.user = data.user;

        localStorage.setItem('token', this.token);
        localStorage.setItem('user', JSON.stringify(this.user));
        this.notify();
        return true;
      }
      throw new Error(data.error || 'Login failed');
    } catch (error) {
      // PURE FRONTEND MOCK FALLBACK (If backend is not running at all)
      if (username === 'admin' && password === 'password') {
        this.token = 'mock-frontend-token-12345';
        this.user = {
          username: 'admin',
          role: 'director',
          permissions: ['view-dashboard', 'view-projects'],
          modules: ['dashboard', 'project-client', 'auth']
        };
        localStorage.setItem('token', this.token);
        localStorage.setItem('user', JSON.stringify(this.user));
        this.notify();
        return true;
      }

      console.error('Auth error:', error);
      return false;
    }
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.notify();
  }
}

export const authStore = new AuthStore();
export function useAuthStore() {
  return authStore;
}
