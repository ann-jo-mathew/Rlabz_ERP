import { useAuthStore } from '../../../core/stores/auth.js';

export function updateFinanceSidebar() {
  const currentPath = window.location.pathname;
  const sidebarNav = document.querySelector('.finance-sidebar-nav');
  if (!sidebarNav) return;

  sidebarNav.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href');
    if (href) {
      // Exact match for the root finance dashboard, prefix match for others
      const isActive = (href === '/finance') 
        ? currentPath === href 
        : currentPath.startsWith(href);

      if (isActive) {
        a.classList.add('active');
      } else {
        a.classList.remove('active');
      }
    }
  });
}

export async function FinanceLayout(contentChild, route, router) {
  const authStore = useAuthStore();
  
  const wrapper = document.createElement('div');
  wrapper.className = 'dashboard-layout finance-layout animate-fade-in';
  
  const displayName = authStore.user?.name || authStore.user?.username || 'Finance User';
  const roleName = authStore.role ? authStore.role.replace('_', ' ').toUpperCase() : 'FINANCE HEAD';
  const initial = displayName.charAt(0).toUpperCase();

  const navLinks = [
    { path: '/finance', title: 'Finance Overview', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>' },
    { path: '/finance/projects', title: 'Project Finance', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>' },
    { path: '/finance/student-payroll', title: 'Student Payroll', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>' },
    { path: '/finance/faculty-costs', title: 'Faculty / Resource Costs', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>' },
    { path: '/finance/transactions', title: 'Transactions', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>' },
    { path: '/finance/invoices', title: 'Invoices & Bills', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>' },
    { path: '/finance/reports', title: 'Financial Reports', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>' }
  ];

  const navLinksHTML = navLinks.map(mod => `
    <li>
      <a href="${mod.path}">
        ${mod.icon}
        <span>${mod.title}</span>
      </a>
    </li>
  `).join('');

  wrapper.innerHTML = `
    <aside class="sidebar finance-sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <span>RLABZ ERP</span>
          <span class="badge">FINANCE</span>
        </div>
      </div>
      <!-- NOTE: Deliberately avoiding .sidebar-nav class to prevent core router from overriding this -->
      <nav class="finance-sidebar-nav sidebar-nav-container">
        <ul>
          ${navLinksHTML}
        </ul>
      </nav>
      <div class="sidebar-footer">
        <button id="finance-logout-btn" class="logout-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>

    <div class="main-wrapper finance-main-wrapper">
      <header class="topbar">
        <div class="topbar-title">${route.name ? route.name.toUpperCase().replace(/-/g, ' ') : 'FINANCE & PAYROLL'}</div>
        <div class="user-profile">
          <div class="avatar">${initial}</div>
          <div class="user-details">
            <span class="user-name">${displayName}</span>
            <span class="user-role" style="color: var(--primary-accent); font-weight: 600;">${roleName}</span>
          </div>
        </div>
      </header>
      
      <main class="content-outlet finance-content-outlet" id="layout-outlet"></main>
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
  const logoutBtn = wrapper.querySelector('#finance-logout-btn');
  logoutBtn?.addEventListener('click', () => {
    authStore.logout();
    router.push('/auth/login');
  });

  return wrapper;
}
