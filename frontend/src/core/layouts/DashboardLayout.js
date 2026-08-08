import { useAuthStore } from '../stores/auth.js';
import { modules } from '../../module-manifest.js';

export async function DashboardLayout(contentChild, route, router) {
  const authStore = useAuthStore();
  const currentPath = window.location.pathname;

  // Icons lookup map
  const iconsMap = {
    IconDashboard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>`,
    IconCoordinator: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
    IconFaculty: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
    IconFinance: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
    IconStudent: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>`,
    IconProjects: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
    IconCommunication: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
    IconGithub: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>`,
    IconCertificates: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>`,
    IconAudit: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
  };

  // Filter available modules according to manifest and user permissions
  const userAllowedModules = authStore.modules || [];
  const availableModules = modules.filter(m => {
    if (!m.sidebar) return false;
    if (!userAllowedModules.includes(m.name)) return false;
    return true;
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'dashboard-layout animate-fade-in';

  // Navigation Links HTML
  const navLinksHTML = availableModules.map(mod => {
    const isActive = currentPath.startsWith(mod.path);
    const iconSvg = iconsMap[mod.icon] || iconsMap.IconDashboard;
    return `
      <li>
        <a href="${mod.path}" class="${isActive ? 'active' : ''}">
          ${iconSvg}
          <span>${mod.title}</span>
        </a>
      </li>
    `;
  }).join('');

  const displayName = authStore.user?.name || authStore.user?.username || 'User';
  const roleName = authStore.role ? authStore.role.replace('_', ' ').toUpperCase() : 'MEMBER';
  const initial = displayName.charAt(0).toUpperCase();

  wrapper.innerHTML = `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <span>RLABZ ERP</span>
          <span class="badge">${roleName}</span>
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
        <div class="topbar-title">${route.name ? route.name.toUpperCase().replace('-', ' ') : 'RLABZ ERP'}</div>
        <div class="user-profile">
          <div class="avatar">${initial}</div>
          <div class="user-details">
            <span class="user-name">${displayName}</span>
            <span class="user-role" style="color: var(--primary-accent); font-weight: 600;">${roleName}</span>
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
    router.push('/auth/login');
  });

  return wrapper;
}
