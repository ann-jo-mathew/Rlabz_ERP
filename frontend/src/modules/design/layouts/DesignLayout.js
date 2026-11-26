import { useAuthStore } from '../../../core/stores/auth.js';
import { API_BASE } from '../../../core/config/api.js';
import '../design.css';

export function updateDesignSidebar() {
  const currentPath = window.location.pathname;
  const sidebarNav = document.querySelector('.design-sidebar-nav');
  if (!sidebarNav) return;

  sidebarNav.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href');
    if (href) {
      // Exact match for root design dashboard, prefix match for others
      const isActive = (href === '/design') 
        ? (currentPath === '/design' || currentPath === '/design/')
        : (currentPath === href || currentPath.startsWith(href + '/'));

      if (isActive) {
        a.classList.add('active');
      } else {
        a.classList.remove('active');
      }
    }
  });
}

export async function DesignLayout(contentChild, route, router) {
  const authStore = useAuthStore();
  const currentPath = window.location.pathname;
  
  const wrapper = document.createElement('div');
  wrapper.className = 'dashboard-layout design-layout';
  
  const displayName = authStore.user?.name || authStore.user?.username || 'Design Head';
  const roleName = authStore.role ? authStore.role.replace('_', ' ').toUpperCase() : 'DESIGN HEAD';
  const initial = displayName.charAt(0).toUpperCase();
  const email = authStore.user?.email || 'designhead@rajagiri.edu';
  const department = authStore.user?.department || 'Design & Creative Studio';

  const isDedicatedDesignRole = authStore.role === 'design_head';
  const returnPortalPath = authStore.user?.defaultRoute || (authStore.role === 'student' ? '/student' : (authStore.role === 'faculty' ? '/faculty' : (authStore.role === 'coordinator' ? '/coordinator' : (authStore.role === 'admin' ? '/admin' : '/dashboard'))));

  // 12 Mandatory Sidebar Entries
  const navLinks = [
    ...(!isDedicatedDesignRole ? [{
      path: returnPortalPath,
      title: '← Return to Portal',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>'
    }] : []),
    {
      path: '/design',
      title: 'Dashboard',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>'
    },
    {
      path: '/design/users',
      title: 'Users & Roles',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>'
    },
    {
      path: '/design/brand-kit',
      title: 'Brand Kit',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="m4.93 4.93 4.24 4.24"></path><path d="m14.83 9.17 4.24-4.24"></path><path d="m14.83 14.83 4.24 4.24"></path><path d="m9.17 14.83-4.24 4.24"></path><circle cx="12" cy="12" r="4"></circle></svg>'
    },
    {
      path: '/design/requests',
      title: 'Design Requests',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>'
    },
    {
      path: '/design/scheduling',
      title: 'Assignment & Scheduling',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>'
    },
    {
      path: '/design/tickets',
      title: 'Tickets',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"></path></svg>'
    },
    {
      path: '/design/version-control',
      title: 'Version Control & Feedback',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>'
    },
    {
      path: '/design/approvals',
      title: 'Approval & Sign-off',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
    },
    {
      path: '/design/assets',
      title: 'Asset Library',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>'
    },
    {
      path: '/design/notifications',
      title: 'Notifications',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>'
    },
    {
      path: '/design/reports',
      title: 'Reports',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>'
    },
    {
      path: '/design/audit-log',
      title: 'Audit Log',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>'
    }
  ];

  const navLinksHTML = navLinks.map(mod => `
    <li>
      <a href="${mod.path}">
        ${mod.icon}
        <span>${mod.title}</span>
      </a>
    </li>
  `).join('');

  let topbarTitle = 'DESIGN STUDIO & DASHBOARD';
  if (currentPath === '/design/profile' || route?.name === 'design-profile') {
    topbarTitle = 'USER PROFILE & SECURITY';
  } else if (route?.title) {
    topbarTitle = route.title;
  } else if (route?.name) {
    topbarTitle = route.name.toUpperCase().replace(/-/g, ' ');
  }

  wrapper.innerHTML = `
    <!-- Mobile Sidebar Backdrop Overlay -->
    <div class="sidebar-backdrop" id="design-sidebar-backdrop"></div>

    <aside class="sidebar design-sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <img src="/assets/Rlabz_Logo_dark.png" alt="RLabZ ERP" class="sidebar-watermark" style="height: 84px; width: auto;" />
        </div>
        <button class="sidebar-close-btn" id="design-sidebar-close-btn" aria-label="Close navigation menu" title="Close navigation">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="18" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <!-- NOTE: Deliberately avoiding .sidebar-nav class to prevent core router from overriding this -->
      <nav class="design-sidebar-nav sidebar-nav-container">
        <ul>
          ${navLinksHTML}
        </ul>
      </nav>
    </aside>

    <div class="main-wrapper design-main-wrapper">
      <header class="topbar">
        <div class="topbar-left">
          <button class="mobile-sidebar-toggle" id="design-mobile-sidebar-toggle" aria-label="Toggle navigation menu" title="Open navigation">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div class="topbar-title">${topbarTitle}</div>
        </div>
        <div style="display:flex; align-items:center; gap: 0.85rem;">
          <div class="user-profile" id="design-user-profile-header" style="position: relative; cursor: pointer;" title="View Profile & Settings">
            <div class="avatar" id="design-topbar-avatar">${initial}</div>
            <div class="user-details">
              <span class="user-name" id="design-topbar-name">${displayName}</span>
              <span class="user-role" style="color: var(--primary-accent, #00bfa5); font-weight: 600;">${roleName}</span>
            </div>

            <!-- Floating Profile Popover (Identical to Finance Layout) -->
            <div class="profile-popover" id="design-profile-popover">
              <div class="profile-popover-header">
                <div class="profile-popover-avatar" id="design-popover-avatar">
                  ${initial}
                </div>
                <div class="profile-popover-meta">
                  <span class="profile-popover-name" id="design-popover-name">${displayName}</span>
                  <span class="profile-popover-role" id="design-popover-role">${roleName}</span>
                </div>
              </div>
              <div class="profile-popover-body">
                <div class="profile-popover-row">
                  <span class="profile-popover-label">Designation:</span>
                  <span class="profile-popover-value" id="design-popover-designation" style="font-weight: 700;">${roleName}</span>
                </div>
                <div class="profile-popover-row">
                  <span class="profile-popover-label">Email:</span>
                  <span class="profile-popover-value" id="design-popover-email">${email}</span>
                </div>
                <div class="profile-popover-row">
                  <span class="profile-popover-label">Department:</span>
                  <span class="profile-popover-value" id="design-popover-department">${department}</span>
                </div>
              </div>
              <div class="profile-popover-footer" style="padding: 10px 14px; background: #f8fafc; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end;">
                <a href="/design/profile" id="design-popover-profile-link" style="font-size: 0.8rem; font-weight: 600; color: #059669; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                  Profile Settings & Change Password &rarr;
                </a>
              </div>
            </div>
          </div>

          <button id="design-logout-btn" class="logout-icon-btn" title="Logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </header>
      
      <main class="content-outlet design-content-outlet" id="layout-outlet"></main>
    </div>

    <!-- Native Right Floating Bell & Slide-Out Drawer (Flush to Right Border) -->
    <button class="fin-bell-trigger" id="design-layout-bell-btn" title="View Action Items &amp; Notifications">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
      <span class="fin-bell-badge" id="design-layout-bell-badge" style="display: none;">0</span>
    </button>

    <!-- Drawer Backdrop -->
    <div class="fin-drawer-backdrop" id="design-layout-drawer-backdrop"></div>

    <!-- Notification Drawer -->
    <div class="fin-notification-drawer" id="design-layout-notification-drawer">
      <div class="fin-drawer-header">
        <div class="fin-drawer-title-wrap">
          <span class="fin-drawer-title">Design Action Items</span>
          <span class="fin-drawer-count" id="design-layout-drawer-count" style="display: none;">0</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <a href="/design/notifications" class="fin-btn outline sm" id="btn-design-drawer-top-view-all" style="font-size: 0.75rem; padding: 4px 10px; font-weight: 700; text-decoration: none; border-radius: 6px;">
            View All ↗
          </a>
          <button class="fin-drawer-close" id="design-layout-drawer-close" title="Close Drawer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      <div class="fin-drawer-body" id="design-layout-drawer-body">
        <div style="text-align: center; padding: 2.5rem 1rem; color: #64748b; font-size: 0.9rem;">
          Loading action items...
        </div>
      </div>
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
  const mobileToggleBtn = wrapper.querySelector('#design-mobile-sidebar-toggle');
  const sidebarCloseBtn = wrapper.querySelector('#design-sidebar-close-btn');
  const sidebarBackdrop = wrapper.querySelector('#design-sidebar-backdrop');
  const sidebarEl = wrapper.querySelector('.design-sidebar');
  const designSidebarNav = wrapper.querySelector('.design-sidebar-nav');

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

  if (designSidebarNav) {
    designSidebarNav.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && window.innerWidth <= 992) {
        closeMobileSidebar();
      }
    });
  }

  // Bind Native Drawer Controls
  const bellBtn = wrapper.querySelector('#design-layout-bell-btn');
  const drawer = wrapper.querySelector('#design-layout-notification-drawer');
  const backdrop = wrapper.querySelector('#design-layout-drawer-backdrop');
  const closeBtn = wrapper.querySelector('#design-layout-drawer-close');
  const drawerBody = wrapper.querySelector('#design-layout-drawer-body');
  const bellBadge = wrapper.querySelector('#design-layout-bell-badge');
  const drawerCount = wrapper.querySelector('#design-layout-drawer-count');

  function openDrawer() {
    drawer?.classList.add('open');
    backdrop?.classList.add('open');
    bellBtn?.classList.add('drawer-open');
  }

  function closeDrawer() {
    drawer?.classList.remove('open');
    backdrop?.classList.remove('open');
    bellBtn?.classList.remove('drawer-open');
  }

  bellBtn?.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
  backdrop?.addEventListener('click', closeDrawer);

  // Load Action Items & Notifications for Drawer
  async function loadDrawerNotifications() {
    const tkn = localStorage.getItem('token');
    if (!tkn) return;
    try {
      const res = await fetch(`${API_BASE}/design/notifications`, {
        headers: { Authorization: `Bearer ${tkn}`, 'Content-Type': 'application/json' }
      }).then(r => r.ok ? r.json() : null);

      if (res && res.status === 'success') {
        const dismissed = JSON.parse(localStorage.getItem('design_dismissed_alerts') || '[]');
        const activeAlerts = (res.alerts || []).filter(a => !dismissed.includes(a.id));
        const unreadDb = (res.data || []).filter(n => !n.is_read);

        const totalUnread = activeAlerts.length + unreadDb.length;

        if (totalUnread > 0) {
          if (bellBadge) {
            bellBadge.textContent = totalUnread;
            bellBadge.style.display = 'block';
          }
          if (drawerCount) {
            drawerCount.textContent = totalUnread;
            drawerCount.style.display = 'inline-block';
          }
          bellBtn?.classList.add('fin-bell-shake');
        } else {
          if (bellBadge) bellBadge.style.display = 'none';
          if (drawerCount) drawerCount.style.display = 'none';
          bellBtn?.classList.remove('fin-bell-shake');
        }

        if (drawerBody) {
          if (activeAlerts.length === 0 && unreadDb.length === 0) {
            drawerBody.innerHTML = `
              <div style="text-align:center; padding: 2.5rem 1rem; color: #64748b; font-size: 0.9rem;">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">🎉</div>
                No pending action items.<br>All design briefs are scoped, assigned, and on schedule.
              </div>
            `;
          } else {
            const allItemsHtml = [
              ...activeAlerts.map(a => `
                <div class="fin-action-card ${a.isOverdue || (a.daysLeft !== null && a.daysLeft <= 0) ? 'card-overdue' : 'card-upcoming'}" data-ticket-id="${a.ticketId || ''}" role="button" tabindex="0">
                  <div class="fin-card-header-row">
                    <span class="fin-cat-badge fin-cat-${a.type || 'info'}">${a.category}</span>
                    ${a.daysLeft !== null && a.daysLeft !== undefined ? `
                      <span class="fin-countdown-tag ${a.isOverdue || a.daysLeft < 0 ? 'tag-red' : (a.daysLeft === 0 ? 'tag-red' : 'tag-amber')}">
                        ${a.isOverdue || a.daysLeft < 0 ? `${Math.abs(a.daysLeft)}d Overdue` : (a.daysLeft === 0 ? 'Due Today' : `${a.daysLeft}d Left`)}
                      </span>
                    ` : `
                      <span class="fin-countdown-tag tag-amber">Action Needed</span>
                    `}
                  </div>
                  <div class="fin-card-msg">${a.message}</div>
                  <div class="fin-card-meta">
                    <span class="fin-project-name">${a.ticketNumber ? `<strong>${a.ticketNumber}</strong> · ` : ''}${a.projectName || 'Design Studio'}</span>
                  </div>
                </div>
              `),
              ...unreadDb.map(n => `
                <div class="fin-action-card card-upcoming" role="button" tabindex="0">
                  <div class="fin-card-header-row">
                    <span class="fin-cat-badge fin-cat-info">${n.category || 'NOTIFICATION'}</span>
                    <span class="fin-countdown-tag tag-blue">New</span>
                  </div>
                  <div class="fin-card-msg">${n.message}</div>
                  <div class="fin-card-meta">
                    <span class="fin-project-name">${new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              `)
            ].join('');

            drawerBody.innerHTML = allItemsHtml;

            // Click action cards
            drawerBody.querySelectorAll('.fin-action-card').forEach(card => {
              card.addEventListener('click', () => {
                const ticketId = card.getAttribute('data-ticket-id');
                closeDrawer();
                if (ticketId) {
                  if (router && typeof router.push === 'function') router.push(`/design/tickets/${ticketId}`);
                  else window.location.href = `/design/tickets/${ticketId}`;
                } else {
                  if (router && typeof router.push === 'function') router.push('/design/notifications');
                  else window.location.href = '/design/notifications';
                }
              });
            });
          }
        }
      }
    } catch (e) {
      console.warn('Could not load design drawer alerts:', e);
    }
  }

  loadDrawerNotifications();
  window.addEventListener('design-notifications-updated', loadDrawerNotifications);

  // Update active sidebar link
  setTimeout(updateDesignSidebar, 0);

  // Bind User Profile Header Click & Popover
  const userProfileHeader = wrapper.querySelector('#design-user-profile-header');
  const profilePopover = wrapper.querySelector('#design-profile-popover');
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

    const popoverProfileLink = profilePopover.querySelector('#design-popover-profile-link');
    if (popoverProfileLink) {
      popoverProfileLink.addEventListener('click', (e) => {
        e.preventDefault();
        profilePopover.style.display = 'none';
        if (router && typeof router.push === 'function') {
          router.push('/design/profile');
        } else {
          window.location.href = '/design/profile';
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
        const nameEl = wrapper.querySelector('#design-topbar-name');
        const popoverName = wrapper.querySelector('#design-popover-name');
        const popoverEmail = wrapper.querySelector('#design-popover-email');
        const popoverDept = wrapper.querySelector('#design-popover-department');
        
        if (nameEl && p.name) nameEl.textContent = p.name;
        if (popoverName && p.name) popoverName.textContent = p.name;
        if (popoverEmail && p.email) popoverEmail.textContent = p.email;
        if (popoverDept && p.department) popoverDept.textContent = p.department;
      })
      .catch(() => {});
    }
  }

  // Bind Logout
  const logoutBtn = wrapper.querySelector('#design-logout-btn');
  logoutBtn?.addEventListener('click', () => {
    authStore.logout();
    router.push('/auth/login');
  });

  return wrapper;
}
