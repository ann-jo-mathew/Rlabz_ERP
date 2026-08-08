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
      const mockUsers = {
        director: {
          password: 'director123',
          id: 1,
          username: 'director',
          name: 'Director & Co-ordinator',
          role: 'director',
          defaultRoute: '/dashboard',
          modules: ['dashboard', 'finance', 'project-client', 'github', 'audit-notifications', 'auth'],
          permissions: ['view-dashboard', 'view-finance-readonly', 'view-projects', 'view-github', 'view-audit-notifications'],
        },
        coordinator: {
          password: 'coord123',
          id: 2,
          username: 'coordinator',
          name: 'Co-ordinator',
          role: 'coordinator',
          defaultRoute: '/coordinator',
          modules: ['coordinator', 'finance', 'student', 'project-client', 'communication', 'github', 'certificates', 'auth'],
          permissions: ['view-coordinator', 'view-finance-readonly', 'view-student', 'view-projects', 'view-communication', 'view-github', 'view-certificates'],
        },
        finance_head: {
          password: 'finance123',
          id: 3,
          username: 'finance_head',
          name: 'Finance Head',
          role: 'finance_head',
          defaultRoute: '/finance',
          modules: ['finance', 'student', 'project-client', 'auth'],
          permissions: ['view-finance', 'view-student-designations', 'view-projects'],
        },
        faculty: {
          password: 'faculty123',
          id: 4,
          username: 'faculty',
          name: 'Faculty Member',
          role: 'faculty',
          defaultRoute: '/faculty',
          modules: ['faculty', 'project-client', 'communication', 'github', 'auth'],
          permissions: ['view-faculty', 'view-projects', 'view-communication', 'view-github'],
        },
        student: {
          password: 'student123',
          id: 5,
          username: 'student',
          name: 'Student User',
          role: 'student',
          defaultRoute: '/student',
          modules: ['student', 'project-client', 'communication', 'github', 'certificates', 'auth'],
          permissions: ['view-student', 'view-projects', 'view-communication', 'view-github', 'view-certificates-read'],
        },
        admin: {
          password: 'password',
          id: 99,
          username: 'admin',
          name: 'Administrator',
          role: 'director',
          defaultRoute: '/dashboard',
          modules: ['dashboard', 'finance', 'project-client', 'github', 'audit-notifications', 'auth'],
          permissions: ['view-dashboard', 'view-finance-readonly', 'view-projects', 'view-github', 'view-audit-notifications'],
        }
      };

      if (mockUsers[username] && mockUsers[username].password === password) {
        const userObj = { ...mockUsers[username] };
        delete userObj.password;

        this.token = `mock-frontend-token-${userObj.id}`;
        this.user = userObj;
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
