import { DashboardLayout } from '@/core/layouts/DashboardLayout.js';
import './coordinator.css';

export async function CoordinatorLayout(contentChild, route, router) {
  const layoutElement = await DashboardLayout(contentChild, route, router);
  layoutElement.classList.add('coordinator-layout');

  const sidebarNav = layoutElement.querySelector('.sidebar-nav');

  if (sidebarNav) {
    const iconOverview = `
      <svg width="18" height="18" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="7" rx="1"></rect>
        <rect x="14" y="3" width="7" height="7" rx="1"></rect>
        <rect x="14" y="14" width="7" height="7" rx="1"></rect>
        <rect x="3" y="14" width="7" height="7" rx="1"></rect>
      </svg>`;

    const iconProjects = `
      <svg width="18" height="18" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5
        a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
      </svg>`;

    const iconStudents = `
      <svg width="18" height="18" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5
        a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>`;

    const iconMeetings = `
      <svg width="18" height="18" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="4" width="18" height="18" rx="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>`;

    const iconCertificates = `
      <svg width="18" height="18" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 15l-3 3-1-4-4-1 3-3-1-4
        4 1 2-3 2 3 4-1-1 4 3 3-4 1-1 4z"></path>
      </svg>`;

    const iconReports = `
      <svg width="18" height="18" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16
        a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="8" y1="13" x2="16" y2="13"></line>
        <line x1="8" y1="17" x2="16" y2="17"></line>
      </svg>`;

    const navItems = [
      {
        title: 'Coordinator Overview',
        path: '/coordinator',
        icon: iconOverview
      },
      {
        title: 'Projects',
        path: '/coordinator/projects',
        icon: iconProjects
      },
      {
        title: 'Students',
        path: '/coordinator/students',
        icon: iconStudents
      },
      {
        title: 'Meetings',
        path: '/coordinator/meetings',
        icon: iconMeetings
      },
      {
        title: 'Certificates',
        path: '/certificates',
        icon: iconCertificates
      },
      {
        title: 'Reports',
        path: '/coordinator/reports',
        icon: iconReports
      }
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
        const path = a.getAttribute('data-path');

        if (!path) return;

        let isActive = false;

        if (path === '/coordinator') {
          isActive =
            currentPath === '/coordinator' ||
            currentPath === '/coordinator/';
        } else {
          isActive =
            currentPath === path ||
            currentPath === `${path}/` ||
            currentPath.startsWith(`${path}/`);
        }

        a.classList.toggle('active', isActive);
      });
    };

    updateActiveState();

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

export default CoordinatorLayout;