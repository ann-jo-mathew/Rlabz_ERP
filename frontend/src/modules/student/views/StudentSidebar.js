/**
 * Dynamic Sidebar Replacer for Student Portal
 * Overrides the navigation links in DashboardLayout with Student Portal sub-pages.
 */
export function renderStudentSidebar() {
  const sidebarNav = document.querySelector('.sidebar-nav');
  if (!sidebarNav) return;

  // Render the student specific links only if not already done
  if (sidebarNav.dataset.portal !== 'student') {
    sidebarNav.dataset.portal = 'student';
    sidebarNav.innerHTML = `
      <ul>
        <li>
          <a href="/student">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" rx="1"></rect>
              <rect x="14" y="3" width="7" height="7" rx="1"></rect>
              <rect x="14" y="14" width="7" height="7" rx="1"></rect>
              <rect x="3" y="14" width="7" height="7" rx="1"></rect>
            </svg>
            <span>Dashboard</span>
          </a>
        </li>
        <li>
          <a href="/student/projects">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>My Projects</span>
          </a>
        </li>
        <li>
          <a href="/student/proposals">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span>Project Proposals</span>
          </a>
        </li>
        <li>
          <a href="/student/reports">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="9" y1="18" x2="15" y2="18"></line>
              <line x1="10" y1="14" x2="14" y2="14"></line>
              <path d="M21 16V8a2 2 0 0 0-1.95-2H20a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2h.05A2 2 0 0 0 2 8v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2z"></path>
            </svg>
            <span>Reports & Work Logs</span>
          </a>
        </li>
        <li>
          <a href="/student/meetings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>Meetings</span>
          </a>
        </li>
        <li>
          <a href="/student/github">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
            <span>GitHub</span>
          </a>
        </li>
        <li>
          <a href="/student/chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Chat</span>
          </a>
        </li>
      </ul>
    `;
  }

  // Update active css classes on matching sidebar link
  const currentPath = window.location.pathname;
  sidebarNav.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href');
    if (href) {
      const isActive = currentPath === href || (href !== '/student' && currentPath.startsWith(href));
      a.className = isActive ? 'active' : '';
    }
  });
}
