import { useAuthStore } from '../../../core/stores/auth.js';
import { API_BASE } from '../../../core/config/api.js';
import '../finance.css';

export function updateFinanceSidebar() {
  const currentPath = window.location.pathname;
  const sidebarNav = document.querySelector('.finance-sidebar-nav');
  if (!sidebarNav) return;

  sidebarNav.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href');
    if (href) {
      // Exact match for the root finance dashboard, prefix match for others
      const isActive = (href === '/finance') 
        ? (currentPath === '/finance' || currentPath === '/finance/')
        : (currentPath === href || currentPath.startsWith(href + '/'));

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
  const currentPath = window.location.pathname;
  
  const wrapper = document.createElement('div');
  wrapper.className = 'dashboard-layout finance-layout animate-fade-in';
  
  const displayName = authStore.user?.name || authStore.user?.username || 'Finance User';
  const roleName = authStore.role ? authStore.role.replace('_', ' ').toUpperCase() : 'FINANCE HEAD';
  const initial = displayName.charAt(0).toUpperCase();
  const email = authStore.user?.email || 'finance@rajagiri.edu';
  const department = authStore.user?.department || 'Finance & Accounts';

  const navLinks = [
    { path: '/finance', title: 'Finance Overview', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>' },
    { path: '/finance/projects', title: 'Project Finance', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>' },
    { path: '/finance/cost-distribution', title: 'Cost Distribution', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>' },
    { path: '/finance/student-payroll', title: 'Student Payroll', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>' },
    { path: '/finance/faculty-costs', title: 'Faculty / Resource Costs', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>' },
    { path: '/finance/transactions', title: 'Transactions', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>' },
    { path: '/finance/invoices', title: 'Invoices & Bills', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>' },
    { path: '/finance/operational-costs', title: 'Operational Costs', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>' },
    { path: '/finance/reports', title: 'Financial Reports', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>' },
    { path: '/finance/profile', title: 'User Profile & Security', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>' }
  ];

  const navLinksHTML = navLinks.map(mod => `
    <li>
      <a href="${mod.path}">
        ${mod.icon}
        <span>${mod.title}</span>
      </a>
    </li>
  `).join('');

  let topbarTitle = 'FINANCE & PAYROLL';
  if (currentPath === '/finance/profile' || route?.name === 'finance-profile') {
    topbarTitle = 'USER PROFILE & SECURITY';
  } else if (authStore?.role === 'developer') {
    topbarTitle = 'DEVELOPER DASHBOARD';
  } else if (authStore?.role === 'director') {
    topbarTitle = 'DIRECTOR DASHBOARD';
  } else if (route?.title) {
    topbarTitle = route.title;
  } else if (route?.name) {
    topbarTitle = route.name.toUpperCase().replace(/-/g, ' ');
  }

  wrapper.innerHTML = `
    <!-- Mobile Sidebar Backdrop Overlay -->
    <div class="sidebar-backdrop" id="finance-sidebar-backdrop"></div>

    <aside class="sidebar finance-sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <img src="/assets/Rlabz_Logo_dark.png" alt="RLabZ ERP" class="sidebar-watermark" style="height: 84px; width: auto;" />
        </div>
        <button class="sidebar-close-btn" id="finance-sidebar-close-btn" aria-label="Close navigation menu" title="Close navigation">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="18" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <!-- NOTE: Deliberately avoiding .sidebar-nav class to prevent core router from overriding this -->
      <nav class="finance-sidebar-nav sidebar-nav-container">
        <ul>
          ${navLinksHTML}
        </ul>
      </nav>
    </aside>

    <div class="main-wrapper finance-main-wrapper">
      <header class="topbar">
        <div class="topbar-left">
          <button class="mobile-sidebar-toggle" id="finance-mobile-sidebar-toggle" aria-label="Toggle navigation menu" title="Open navigation">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div class="topbar-title">${topbarTitle}</div>
        </div>
        <div style="display:flex; align-items:center; gap: 0.85rem;">
          <div class="user-profile" id="finance-user-profile-header" style="position: relative; cursor: pointer;" title="View Profile & Settings">
            <div class="avatar" id="finance-topbar-avatar">${initial}</div>
            <div class="user-details">
              <span class="user-name" id="finance-topbar-name">${displayName}</span>
              <span class="user-role" style="color: var(--primary-accent); font-weight: 600;">${roleName}</span>
            </div>

            <!-- Floating Profile Popover -->
            <div class="profile-popover" id="finance-profile-popover">
              <div class="profile-popover-header">
                <div class="profile-popover-avatar" id="finance-popover-avatar">
                  ${initial}
                </div>
                <div class="profile-popover-meta">
                  <span class="profile-popover-name" id="finance-popover-name">${displayName}</span>
                  <span class="profile-popover-role" id="finance-popover-role">${roleName}</span>
                </div>
              </div>
              <div class="profile-popover-body">
                <div class="profile-popover-row">
                  <span class="profile-popover-label">Designation:</span>
                  <span class="profile-popover-value" id="finance-popover-designation" style="font-weight: 700;">${roleName}</span>
                </div>
                <div class="profile-popover-row">
                  <span class="profile-popover-label">Email:</span>
                  <span class="profile-popover-value" id="finance-popover-email">${email}</span>
                </div>
                <div class="profile-popover-row">
                  <span class="profile-popover-label">Department:</span>
                  <span class="profile-popover-value" id="finance-popover-department">${department}</span>
                </div>
              </div>
              <div class="profile-popover-footer" style="padding: 10px 14px; background: #f8fafc; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end;">
                <a href="/finance/profile" id="finance-popover-profile-link" style="font-size: 0.8rem; font-weight: 600; color: #059669; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                  Profile Settings & Change Password &rarr;
                </a>
              </div>
            </div>
          </div>

          <button id="finance-logout-btn" class="logout-icon-btn" title="Logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
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

  // Mobile Off-Canvas Sidebar Controls
  const mobileToggleBtn = wrapper.querySelector('#finance-mobile-sidebar-toggle');
  const sidebarCloseBtn = wrapper.querySelector('#finance-sidebar-close-btn');
  const sidebarBackdrop = wrapper.querySelector('#finance-sidebar-backdrop');
  const sidebarEl = wrapper.querySelector('.finance-sidebar');
  const finSidebarNav = wrapper.querySelector('.finance-sidebar-nav');

  const openMobileSidebar = () => {
    if (sidebarEl) sidebarEl.classList.add('mobile-open');
    if (sidebarBackdrop) sidebarBackdrop.classList.add('active');
    document.body.classList.add('sidebar-open-locked');
  };

  const closeMobileSidebar = () => {
    if (sidebarEl) sidebarEl.classList.remove('mobile-open');
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
    document.body.classList.remove('sidebar-open-locked');
  };

  if (mobileToggleBtn) mobileToggleBtn.addEventListener('click', openMobileSidebar);
  if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeMobileSidebar);
  if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeMobileSidebar);

  if (finSidebarNav) {
    finSidebarNav.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && window.innerWidth <= 992) {
        closeMobileSidebar();
      }
    });
  }

  // Bind User Profile Header Click & Popover
  const userProfileHeader = wrapper.querySelector('#finance-user-profile-header');
  const profilePopover = wrapper.querySelector('#finance-profile-popover');
  if (userProfileHeader && profilePopover) {
    userProfileHeader.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = window.getComputedStyle(profilePopover).display === 'block';
      profilePopover.style.display = isVisible ? 'none' : 'block';
    });

    document.addEventListener('click', () => {
      profilePopover.style.display = 'none';
    });

    profilePopover.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    const popoverProfileLink = profilePopover.querySelector('#finance-popover-profile-link');
    if (popoverProfileLink) {
      popoverProfileLink.addEventListener('click', (e) => {
        e.preventDefault();
        profilePopover.style.display = 'none';
        if (router && typeof router.push === 'function') {
          router.push('/finance/profile');
        } else {
          window.location.href = '/finance/profile';
        }
      });
    }

    // Sync live profile data from backend
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_BASE}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then(r => r.ok ? r.json() : null)
      .then(res => {
        if (!res) return;
        const p = res.user || res;
        const nameEl = wrapper.querySelector('#finance-topbar-name');
        const popoverName = wrapper.querySelector('#finance-popover-name');
        const popoverEmail = wrapper.querySelector('#finance-popover-email');
        const popoverDept = wrapper.querySelector('#finance-popover-department');
        
        if (nameEl && p.name) nameEl.textContent = p.name;
        if (popoverName && p.name) popoverName.textContent = p.name;
        if (popoverEmail && p.email) popoverEmail.textContent = p.email;
        if (popoverDept && p.department) popoverDept.textContent = p.department;
      })
      .catch(() => {});
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
