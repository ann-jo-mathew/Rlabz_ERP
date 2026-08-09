import { DashboardLayout } from '@/core/layouts/DashboardLayout.js';

export async function FacultyLayout(contentChild, route, router) {
    // Render the global layout first
    const layoutElement = await DashboardLayout(contentChild, route, router);
    
    // Find the faculty link in the sidebar
    const facultyLink = layoutElement.querySelector('.sidebar-nav a[href="/faculty"]');
    
    if (facultyLink) {
        const parentLi = facultyLink.parentElement;
        
        // Ensure we don't add the links multiple times
        if (!parentLi.parentElement.querySelector('.faculty-injected')) {
            const currentPath = window.location.pathname;
            
            // Icons matching the style of the dashboard
            const iconProfile = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
            const iconProjects = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`;
            const iconStudents = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
            
            const sublinks = [
                { title: 'Faculty Profile', path: '/faculty/profile', icon: iconProfile },
                { title: 'Faculty Projects', path: '/faculty/projects', icon: iconProjects },
                { title: 'Faculty Students', path: '/faculty/students', icon: iconStudents }
            ];
            
            // Insert them backwards immediately after the parentLi so they appear in correct order
            [...sublinks].reverse().forEach(sub => {
                const li = document.createElement('li');
                li.className = 'faculty-injected';
                
                const a = document.createElement('a');
                a.href = sub.path;
                // No custom class needed; inherits .sidebar-nav a
                a.innerHTML = `${sub.icon}<span>${sub.title}</span>`;
                
                // Route on click instead of full page reload
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    router.push(sub.path);
                });
                
                li.appendChild(a);
                parentLi.after(li);
            });
            
            // Fix the title of the original faculty link to act as "Faculty Home"
            const span = facultyLink.querySelector('span');
            if (span) span.textContent = 'Faculty Dashboard';
        }
        
        // Manage active states on every render
        const currentPath = window.location.pathname;
        
        // Ensure main dashboard link is clean
        facultyLink.className = '';
        
        // Manage active state manually to ensure exact styling match
        if (currentPath === '/faculty') {
            facultyLink.classList.add('active');
        } else {
            facultyLink.classList.remove('active');
        }
        
        // Prevent global router from incorrectly re-applying active state
        // by modifying the href.
        facultyLink.setAttribute('href', '#faculty-dashboard');
        facultyLink.addEventListener('click', (e) => {
            e.preventDefault();
            router.push('/faculty');
        });
        
        // Update active state for injected sublinks
        const injectedLinks = parentLi.parentElement.querySelectorAll('.faculty-injected a');
        injectedLinks.forEach(a => {
            if (a.getAttribute('href') === currentPath) {
                a.classList.add('active');
            } else {
                a.classList.remove('active');
            }
        });
    }
    
    return layoutElement;
}
