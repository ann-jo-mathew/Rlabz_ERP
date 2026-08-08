import { useAuthStore } from '../stores/auth.js';
import { modules } from '../../module-manifest.js';

export async function DashboardLayout(contentChild, route, router) {
  const authStore = useAuthStore();
  const currentPath = window.location.pathname;

  // Filter available modules according to manifest and user permissions
  const availableModules = modules.filter(m => {
    if (!m.sidebar) return false;
    if (!authStore.modules.includes(m.name)) return false;
    return true;
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'dashboard-layout animate-fade-in';

  // Navigation Links HTML
  const navLinksHTML = availableModules.map(mod => {
    const isActive = currentPath.startsWith(mod.path);
    return `
      <li>
        <a href="${mod.path}" class="${isActive ? 'active' : ''}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7" rx="1"></rect>
            <rect x="14" y="3" width="7" height="7" rx="1"></rect>
            <rect x="14" y="14" width="7" height="7" rx="1"></rect>
            <rect x="3" y="14" width="7" height="7" rx="1"></rect>
          </svg>
          <span>${mod.title}</span>
        </a>
      </li>
    `;
  }).join('');

  const username = authStore.user?.username || 'User';
  const role = authStore.role || 'Guest';
  const initial = username.charAt(0).toUpperCase();

  wrapper.innerHTML = `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <span>RLABZ ERP</span>
          <span class="badge">PRO</span>
        </div>
      </div>
      <nav class="sidebar-nav">
        <ul>
          ${navLinksHTML}
        </ul>
      </nav>
      <div class="sidebar-footer">
        <button id="logout-btn" class="logout-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>

    <div class="main-wrapper">
      <header class="topbar">
        <div class="topbar-title">${route.name ? route.name.toUpperCase().replace('-', ' ') : 'ERP SYSTEM'}</div>
        <div class="user-profile">
          <div class="avatar">${initial}</div>
          <div class="user-details">
            <span class="user-name">Welcome, ${username}</span>
            <span class="user-role">${role}</span>
          </div>
        </div>
      </header>
      
      <main class="content-outlet" id="layout-outlet"></main>
    </div>
  `;

  // Attach Content Child
  const outlet = wrapper.querySelector('#layout-outlet');
  if (contentChild) {
    if (typeof contentChild === 'function') {
      const childEl = await contentChild(route, router);
      outlet.appendChild(childEl);
    } else {
      outlet.appendChild(contentChild);
    }
  }

  // Bind Logout
  const logoutBtn = wrapper.querySelector('#logout-btn');
  logoutBtn?.addEventListener('click', () => {
    authStore.logout();
    router.push('/login');
  });

  return wrapper;
}
