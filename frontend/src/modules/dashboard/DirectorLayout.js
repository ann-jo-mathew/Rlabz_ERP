import { DashboardLayout } from '@/core/layouts/DashboardLayout.js';
import './dashboard.css';

export async function DirectorLayout(contentChild, route, router) {
  // Render global layout first
  const layoutElement = await DashboardLayout(contentChild, route, router);

  // Clean topbar user profile display to say "Director" instead of "Director & Co-ordinator"
  const userNameEl = layoutElement.querySelector('.topbar .user-name');
  if (userNameEl && userNameEl.textContent.includes('Director & Co-ordinator')) {
    userNameEl.textContent = 'Director';
  }

  // Update stored user object if name was set to "Director & Co-ordinator"
  try {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (storedUser && storedUser.name === 'Director & Co-ordinator') {
      storedUser.name = 'Director';
      localStorage.setItem('user', JSON.stringify(storedUser));
    }
  } catch (e) {
    // Ignore storage parse errors
  }

  const sidebarNav = layoutElement.querySelector('.sidebar-nav');
  if (sidebarNav) {
    const iconOverview = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>`;
    const iconProjects = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`;
    const iconStudents = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
    const iconClients = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`;
    const iconFinance = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`;
    const iconAudit = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`;
    const iconGithub = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>`;

    const navItems = [
      { title: 'Director Overview', path: '/dashboard', icon: iconOverview },
      { title: 'Projects & Proposals', path: '/dashboard/projects', icon: iconProjects },
      { title: 'Student Track Roster', path: '/dashboard/students', icon: iconStudents },
      { title: 'Client Requirements', path: '/dashboard/clients', icon: iconClients },
      { title: 'Finance Oversight', path: '/dashboard/finance', icon: iconFinance },
      { title: 'System Audit Log', path: '/dashboard/audit', icon: iconAudit },
      { title: 'GitHub Integration', path: '/dashboard/github', icon: iconGithub }
    ];

    const navHTML = navItems.map(item => `
      <li>
        <a href="${item.path}" data-path="${item.path}">
          ${item.icon}
          <span>${item.title}</span>
        </a>
      </li>
    `).join('');

    sidebarNav.innerHTML = `<ul>${navHTML}</ul>`;

    const updateActiveState = () => {
      const currentPath = window.location.pathname;
      sidebarNav.querySelectorAll('a').forEach(a => {
        const path = a.getAttribute('data-path') || a.getAttribute('href');
        if (!path) return;

        let isActive = false;
        if (path === '/dashboard' || path === '/dashboard/') {
          // Director Overview is ONLY active when path is exactly /dashboard or /dashboard/
          isActive = (currentPath === '/dashboard' || currentPath === '/dashboard/');
        } else {
          // Sub-routes match exactly or prefix match (e.g. /dashboard/projects)
          isActive = (currentPath === path || currentPath === `${path}/` || currentPath.startsWith(`${path}/`));
        }

        if (isActive) {
          a.classList.add('active');
        } else {
          a.classList.remove('active');
        }
      });
    };

    // Run active update immediately and after microtask
    updateActiveState();
    setTimeout(updateActiveState, 0);

    // Attach click listeners for SPA routing and active state updates
    sidebarNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const targetPath = a.getAttribute('data-path');
        if (targetPath) {
          router.push(targetPath);
          setTimeout(updateActiveState, 10);
        }
      });
    });
  }

  return layoutElement;
}

export default DirectorLayout;
