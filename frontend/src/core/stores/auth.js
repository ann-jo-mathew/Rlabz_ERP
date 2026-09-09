/**
 * RLABZ AUTH STORE (Vanilla JS Implementation)
 * State management for user authentication, JWT tokens, and permissions.
 */

import { API_BASE } from '../config/api.js';

class AuthStore {
  constructor() {
    this.token = localStorage.getItem('token') || null;
    let storedUser = null;
    try {
      storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser) {
        if (storedUser.email === 'nova@rajagiri.edu') {
          storedUser.name = "Student Nova";
          storedUser.designation = "Nova";
          storedUser.isTeamLead = true;
        } else if (storedUser.email === 'orbit@rajagiri.edu') {
          storedUser.name = "Student Orbit";
          storedUser.designation = "Orbit";
          storedUser.isTeamLead = false;
        } else if (storedUser.email === 'spark@rajagiri.edu') {
          storedUser.name = "Student Spark";
          storedUser.designation = "Spark";
          storedUser.isTeamLead = false;
        }
        if (storedUser.role === 'student') {
          storedUser.department = storedUser.department || 'Computer Applications';
          storedUser.course = storedUser.course || 'MCA';
          storedUser.semester = storedUser.semester || 3;
          storedUser.semester_text = storedUser.semester_text || '2nd Year / 3rd Semester';
        }
      }
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

  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        this.token = data.access_token;
        this.user = data.user;

        if (this.user.email === 'nova@rajagiri.edu') {
          this.user.name = "Student Nova";
          this.user.designation = "Nova";
          this.user.isTeamLead = true;
        } else if (this.user.email === 'orbit@rajagiri.edu') {
          this.user.name = "Student Orbit";
          this.user.designation = "Orbit";
          this.user.isTeamLead = false;
        } else if (this.user.email === 'spark@rajagiri.edu') {
          this.user.name = "Student Spark";
          this.user.designation = "Spark";
          this.user.isTeamLead = false;
        }
        if (this.user.role === 'student') {
          this.user.department = this.user.department || 'Computer Applications';
          this.user.course = this.user.course || 'MCA';
          this.user.semester = this.user.semester || 3;
          this.user.semester_text = this.user.semester_text || '2nd Year / 3rd Semester';
        }

        localStorage.setItem('token', this.token);
        localStorage.setItem('user', JSON.stringify(this.user));
        this.notify();
        return true;
      }
      throw new Error(data.error || 'Login failed');
    } catch (error) {
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
