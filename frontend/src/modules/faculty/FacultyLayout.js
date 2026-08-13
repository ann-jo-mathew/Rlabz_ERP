import { DashboardLayout } from '@/core/layouts/DashboardLayout.js';

export async function FacultyLayout(contentChild, route, router) {
    // Render the global layout first
    const layoutElement = await DashboardLayout(contentChild, route, router);
    
    // Custom sidebar content generator
    const setupCustomSidebar = () => {
        const sidebarNav = layoutElement.querySelector('.sidebar-nav');
        if (!sidebarNav) return;
        
        const currentPath = window.location.pathname;
        
        const iconProfile = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
        const iconDashboard = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>`;
        const iconReport = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;
        const iconProjects = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`;
        const iconMeetings = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
        const iconSprints = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>`;
        const iconGithub = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>`;
        const iconNotifications = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`;
        const iconStudents = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
        
        const menuItems = [
            { title: 'Dashboard', path: '/faculty', icon: iconDashboard },
            { title: 'Profile', path: '/faculty/profile', icon: iconProfile },
            { title: 'My Project', path: '/faculty/projects', icon: iconProjects },
            { title: 'Students', path: '/faculty/students', icon: iconStudents },
            { title: 'Sprint', path: '/faculty/sprints', icon: iconSprints },
            { title: 'Meetings', path: '/faculty/meetings', icon: iconMeetings },
            { title: 'GitHub Integration', path: '/github', icon: iconGithub },
            { title: 'Report', path: '/faculty/reports', icon: iconReport },        
            { title: 'Notifications', path: '/faculty/notifications', icon: iconNotifications }
        ];
        
        sidebarNav.innerHTML = `
            <ul>
                ${menuItems.map(item => {
                    const isActive = currentPath === item.path;
                    return `
                        <li>
                            <a href="${item.path}" class="${isActive ? 'active' : ''}">
                                ${item.icon}
                                <span>${item.title}</span>
                            </a>
                        </li>
                    `;
                }).join('')}
            </ul>
        `;
        
        // Setup client-side SPA routing listeners
        sidebarNav.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                const path = a.getAttribute('href');
                router.push(path);
            });
        });
    };
    
    // Initial side navigation setup
    setupCustomSidebar();
    
    // Create a MutationObserver to watch for sidebar updates and preserve our custom menu
    const sidebarNav = layoutElement.querySelector('.sidebar-nav');
    if (sidebarNav) {
        const observer = new MutationObserver(() => {
            // Disconnect to avoid infinite loop when modifying content inside observer callback
            observer.disconnect();
            setupCustomSidebar();
            // Reconnect
            observer.observe(sidebarNav, { childList: true });
        });
        
        observer.observe(sidebarNav, { childList: true });
    }
    
    return layoutElement;
}
