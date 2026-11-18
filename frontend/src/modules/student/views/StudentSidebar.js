import { useAuthStore } from '@/core/stores/auth.js';
import { getStudentProfilePhoto } from './studentStore.js';
import { updateTopBarAvatar } from '@/core/layouts/DashboardLayout.js';
export { updateTopBarAvatar };

export function updateStudentNavbarAvatar() {
  const authStore = useAuthStore();
  const photo = (authStore.role === 'student' ? getStudentProfilePhoto(authStore.user) : null) || authStore.user?.avatar || null;
  const displayName = authStore.user?.name || authStore.user?.username || 'Student';
  updateTopBarAvatar(photo, displayName);
}

export function renderStudentSidebar() {
  const authStore = useAuthStore();
  const currentPath = window.location.pathname;
  if (authStore.role !== 'student' && !currentPath.startsWith('/student')) {
    return;
  }

  // Ensure navbar avatar is synced with uploaded photo
  updateStudentNavbarAvatar();
  setTimeout(updateStudentNavbarAvatar, 50);

  const sidebarNav = document.querySelector('.sidebar-nav');
  
  // Apply layout class for fixed sidebar and scrollable main content
  const applyLayoutClass = () => {
    const layout = document.querySelector('.dashboard-layout');
    if (layout) {
      layout.classList.add('student-layout');
    }
    const outlet = document.querySelector('.content-outlet');
    if (outlet) {
      outlet.classList.add('student-content-outlet');
    }
  };
  applyLayoutClass();
  setTimeout(applyLayoutClass, 0);

  if (!sidebarNav) return;

  let hasDesignAccess = Boolean(authStore.user?.has_design_access);
  if (!hasDesignAccess) {
    try {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      hasDesignAccess = Boolean(stored?.has_design_access);
    } catch (_) {}
  }

  // Render the student specific links only if not already done or if design access changed
  const lastDesignAccess = sidebarNav.dataset.hasDesignAccess;
  if (sidebarNav.dataset.portal !== 'student' || !sidebarNav.querySelector('a[href="/student/work-logs"]') || lastDesignAccess !== String(hasDesignAccess)) {
    sidebarNav.dataset.portal = 'student';
    sidebarNav.dataset.hasDesignAccess = String(hasDesignAccess);

    const studentItems = [
      { title: 'Dashboard', path: '/student', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>`, perm: 'view-student' },
      { title: 'My Projects', path: '/student/projects', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`, perm: 'view-projects' },
      ...(hasDesignAccess ? [{ title: 'Design', path: '/student/design', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="m4.93 4.93 4.24 4.24"></path><path d="m14.83 9.17 4.24-4.24"></path><path d="m14.83 14.83 4.24 4.24"></path><path d="m9.17 14.83-4.24 4.24"></path><circle cx="12" cy="12" r="4"></circle></svg>`, perm: 'view-design' }] : []),
      { title: 'Progress Reports', path: '/student/reports', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="9" y1="18" x2="15" y2="18"></line><line x1="10" y1="14" x2="14" y2="14"></line><path d="M21 16V8a2 2 0 0 0-1.95-2H20a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2h.05A2 2 0 0 0 2 8v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2z"></path></svg>`, perm: 'view-student' },
      { title: 'Work Logs', path: '/student/work-logs', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`, perm: 'view-student' },
      { title: 'Certificates', path: '/student/certificates', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>`, anyPerms: ['view-certificates', 'view-certificates-read'] },
      { title: 'Meetings', path: '/student/meetings', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`, perm: 'view-communication' },
      { title: 'GitHub', path: '/student/github', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>`, perm: 'view-github' },
      { title: 'Chat', path: '/student/chat', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`, perm: 'view-communication' }
    ];

    const userPerms = authStore.permissions || [];
    const visibleStudentItems = studentItems.filter(item => {
      if (item.perm) return userPerms.includes(item.perm);
      if (item.anyPerms) return item.anyPerms.some(p => userPerms.includes(p));
      return true;
    });

    sidebarNav.innerHTML = `
      <ul>
        ${visibleStudentItems.map(item => `
          <li>
            <a href="${item.path}">
              ${item.icon}
              <span>${item.title}</span>
            </a>
          </li>
        `).join('')}
      </ul>
    `;
  }

  // Update active css classes on matching sidebar link
  sidebarNav.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href');
    if (href) {
      const isActive = currentPath === href || (href !== '/student' && currentPath.startsWith(href));
      a.className = isActive ? 'active' : '';
    }
  });
}
