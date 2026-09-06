import '../faculty.css';

export function FacultyHome(route, router) {
    const container = document.createElement('div');
    container.className = 'faculty-home';

    let storedUser = null;
    try {
        storedUser = JSON.parse(localStorage.getItem('user'));
    } catch (e) {
        storedUser = null;
    }

    const token = localStorage.getItem('token');
    const apiBase = window.location.port === '8000' ? '/api' : 'http://127.0.0.1:8000/api';

    // Dashboard State
    let dashboardData = null;
    let isLoading = true;

    // Standard Monochromatic Stroke SVG Icons (Feather / Lucide Style)
    const iconBell = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`;
    const iconProjects = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`;
    const iconStudents = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
    const iconCalendar = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
    const iconGit = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M13 6h3a2 2 0 0 1 2 2v7"></path><line x1="6" y1="9" x2="6" y2="21"></line></svg>`;
    const iconMapPin = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
    const iconMiniCalendar = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
    const iconMiniUsers = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>`;

    function render() {
        if (isLoading) {
            container.innerHTML = `
                <div style="padding: 5rem 2rem; text-align: center; color: var(--text-muted, #64748b);">
                    <div class="spinner" style="border-top-color: var(--primary, #059669); margin: 0 auto 1rem; width: 36px; height: 36px;"></div>
                    <p style="font-size: 0.95rem;">Loading faculty dashboard...</p>
                </div>
            `;
            return;
        }

        const faculty = dashboardData?.faculty || {
            name: storedUser?.name || 'Faculty Member',
            email: storedUser?.email || 'faculty@rajagiri.edu',
            designation: 'Associate Professor',
            department: 'Department of Computer Applications'
        };

        const stats = dashboardData?.stats || {
            projects_count: 0,
            students_count: 0,
            meetings_today_count: 0,
            past_meetings_pending_count: 0,
            github_repos_count: 0
        };

        const projects = dashboardData?.projects || [];
        const upcomingMeetings = dashboardData?.upcoming_meetings || [];
        const notifications = dashboardData?.notifications || [];
        const unreadNotiCount = notifications.filter(n => !n.is_read).length;

        container.innerHTML = `
            <!-- HEADER WITH FACULTY DETAILS & NOTIFICATION BELL -->
            <div class="dashboard-header-container" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1.25rem; margin-bottom: 2rem;">
                <div class="page-header" style="margin-bottom: 0;">
                    <h1 style="margin: 0 0 0.4rem; font-size: 1.65rem; font-weight: 700; color: var(--text-main, #0f172a);">Faculty Dashboard</h1>
                    <p style="margin: 0; font-size: 0.92rem; color: var(--text-muted, #64748b); line-height: 1.5;">
                        Welcome back, <strong style="color: var(--text-main, #0f172a); font-weight: 600;">${faculty.name}</strong> 
                        &bull; <span style="color: var(--primary, #059669); font-weight: 600;">${faculty.designation}</span> 
                        &bull; ${faculty.department} (${faculty.email})
                    </p>
                </div>

                <!-- Notifications Bell Dropdown -->
                <div class="notification-container" style="position: relative;">
                    <button id="noti-bell-btn" class="noti-bell-btn" title="Notifications" style="background: white; border: 1px solid var(--border-color, #e2e8f0); border-radius: 10px; cursor: pointer; position: relative; padding: 0.6rem 0.85rem; box-shadow: 0 1px 2px rgba(0,0,0,0.05); display: flex; align-items: center; gap: 0.4rem; color: var(--text-main, #334155);">
                        ${iconBell}
                        ${unreadNotiCount > 0 ? `
                            <span class="noti-badge" style="background: #ef4444; color: white; border-radius: 9999px; font-size: 0.72rem; padding: 2px 6px; font-weight: 700;">
                                ${unreadNotiCount}
                            </span>
                        ` : ''}
                    </button>

                    <div id="noti-dropdown" class="noti-dropdown" style="display: none; position: absolute; right: 0; top: 48px; width: 340px; background: white; border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1)); z-index: 1000; padding: 1rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color, #e2e8f0); padding-bottom: 0.5rem; margin-bottom: 0.75rem;">
                            <h4 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: var(--text-main, #0f172a);">Recent Notifications</h4>
                            <span style="font-size: 0.75rem; color: var(--text-muted, #64748b);">${notifications.length} total</span>
                        </div>

                        ${notifications.length === 0 ? `
                            <p style="font-size: 0.85rem; color: var(--text-muted, #64748b); margin: 1.5rem 0; text-align: center;">No new notifications.</p>
                        ` : `
                            <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.6rem; max-height: 250px; overflow-y: auto;">
                                ${notifications.map(n => `
                                    <li style="font-size: 0.82rem; color: var(--text-main, #334155); padding-bottom: 0.5rem; border-bottom: 1px dashed var(--border-color, #f1f5f9); text-align: left;">
                                        ${n.message}
                                        <span style="font-size: 0.72rem; color: var(--text-muted, #94a3b8); display: block; margin-top: 2px;">${n.created_at || 'Recently'}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        `}

                        <div style="margin-top: 0.75rem; text-align: center; border-top: 1px solid var(--border-color, #e2e8f0); padding-top: 0.5rem;">
                            <a href="/faculty/notifications" id="noti-view-all" style="font-size: 0.82rem; color: var(--primary, #059669); font-weight: 600; text-decoration: none;">View All Notifications →</a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- LIVE STATS OF THE LOGGED-IN FACULTY (CLEAN MONOCHROMATIC ELEGANCE) -->
            <div class="faculty-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 2.25rem;">
                
                <div class="faculty-card-panel" style="display: flex; align-items: center; gap: 1.1rem; padding: 1.4rem; background: #ffffff; border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                    <div style="width: 44px; height: 44px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; color: var(--primary, #059669); flex-shrink: 0;">
                        ${iconProjects}
                    </div>
                    <div>
                        <h3 style="margin: 0 0 2px; font-size: 1.6rem; font-weight: 700; color: var(--text-main, #0f172a); line-height: 1.2;">${stats.projects_count}</h3>
                        <p style="margin: 0; font-size: 0.84rem; color: var(--text-muted, #64748b); font-weight: 500;">Projects Assigned</p>
                    </div>
                </div>

                <div class="faculty-card-panel" style="display: flex; align-items: center; gap: 1.1rem; padding: 1.4rem; background: #ffffff; border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                    <div style="width: 44px; height: 44px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; color: #475569; flex-shrink: 0;">
                        ${iconStudents}
                    </div>
                    <div>
                        <h3 style="margin: 0 0 2px; font-size: 1.6rem; font-weight: 700; color: var(--text-main, #0f172a); line-height: 1.2;">${stats.students_count}</h3>
                        <p style="margin: 0; font-size: 0.84rem; color: var(--text-muted, #64748b); font-weight: 500;">Students Mentored</p>
                    </div>
                </div>

                <div class="faculty-card-panel" style="display: flex; align-items: center; gap: 1.1rem; padding: 1.4rem; background: #ffffff; border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                    <div style="width: 44px; height: 44px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; color: #475569; flex-shrink: 0;">
                        ${iconCalendar}
                    </div>
                    <div>
                        <h3 style="margin: 0 0 2px; font-size: 1.6rem; font-weight: 700; color: var(--text-main, #0f172a); line-height: 1.2;">${stats.meetings_today_count}</h3>
                        <p style="margin: 0; font-size: 0.84rem; color: var(--text-muted, #64748b); font-weight: 500;">Meetings Today</p>
                    </div>
                </div>

                <div class="faculty-card-panel" style="display: flex; align-items: center; gap: 1.1rem; padding: 1.4rem; background: #ffffff; border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                    <div style="width: 44px; height: 44px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; color: #475569; flex-shrink: 0;">
                        ${iconGit}
                    </div>
                    <div>
                        <h3 style="margin: 0 0 2px; font-size: 1.6rem; font-weight: 700; color: var(--text-main, #0f172a); line-height: 1.2;">${stats.github_repos_count}</h3>
                        <p style="margin: 0; font-size: 0.84rem; color: var(--text-muted, #64748b); font-weight: 500;">Linked Repositories</p>
                    </div>
                </div>

            </div>

            <!-- MAIN CONTENT GRID (GENEROUS SPACING & ELEGANT PROPORTIONS) -->
            <div style="display: grid; grid-template-columns: 1.65fr 1.1fr; gap: 1.75rem; align-items: flex-start;">
                
                <!-- 1. ASSIGNED PROJECTS -->
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem;">
                        <h2 style="margin: 0; font-size: 1.2rem; font-weight: 700; color: var(--text-main, #0f172a);">
                            Assigned Projects (${projects.length})
                        </h2>
                        <a href="/faculty/projects" class="nav-link-btn" style="font-size: 0.84rem; color: var(--primary, #059669); font-weight: 600; text-decoration: none;">
                            View All Projects →
                        </a>
                    </div>

                    ${projects.length === 0 ? `
                        <div class="faculty-card-panel" style="text-align: center; color: var(--text-muted, #94a3b8); padding: 3rem; background: #ffffff; border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px;">
                            No projects currently assigned to your account.
                        </div>
                    ` : `
                        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                            ${projects.map(p => {
                                const status = (p.status || 'in_progress').toLowerCase();
                                const progress = p.progress || 0;

                                return `
                                    <div class="faculty-card-panel" style="padding: 1.5rem; background: #ffffff; border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: box-shadow 0.2s ease;">
                                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
                                            <div>
                                                <h3 style="margin: 0 0 0.35rem; font-size: 1.1rem; font-weight: 700; color: var(--text-main, #0f172a);">${p.title}</h3>
                                                <p style="margin: 0; font-size: 0.86rem; color: var(--text-muted, #64748b);">
                                                    Client: <strong style="color: var(--text-main, #334155);">${p.client_name || 'Rajagiri College'}</strong>
                                                    &nbsp;&bull;&nbsp; Type: ${p.project_type || 'Web App'}
                                                </p>
                                            </div>
                                            <span class="status-badge ${status.replace(' ', '_')}">
                                                ${status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </div>

                                        <div style="margin-top: 1.25rem;">
                                            <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 0.4rem;">
                                                <span style="color: var(--text-muted, #64748b); font-weight: 500;">
                                                    Tasks Completion: <strong style="color: var(--text-main, #0f172a);">${p.completed_tasks || 0} / ${p.total_tasks || 0}</strong> Tasks
                                                </span>
                                                <strong style="color: var(--primary, #059669); font-weight: 700;">${progress}%</strong>
                                            </div>
                                            <div style="width: 100%; height: 6px; background: #f1f5f9; border-radius: 9999px; overflow: hidden;">
                                                <div style="width: ${progress}%; height: 100%; background: var(--primary, #059669); border-radius: 9999px; transition: width 0.4s ease;"></div>
                                            </div>
                                        </div>

                                        <div style="margin-top: 1.25rem; padding-top: 0.85rem; border-top: 1px solid var(--border-color, #f1f5f9); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
                                            <span style="font-size: 0.84rem; color: var(--text-muted, #64748b); display: inline-flex; align-items: center; gap: 0.35rem;">
                                                ${iconMiniUsers} <strong style="color: var(--text-main, #334155);">${p.students_count || 0}</strong> Students Assigned
                                            </span>
                                            <div style="display: flex; gap: 0.5rem;">
                                                <button class="btn btn-outline btn-sm btn-nav-project" data-id="${p.id}">
                                                    Project Details
                                                </button>
                                                <button class="btn btn-primary btn-sm shadow-hover btn-nav-assign" data-id="${p.id}">
                                                    Assign Tasks
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </div>

                <!-- 2. UPCOMING MEETINGS -->
                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                    
                    <div class="faculty-card-panel" style="padding: 1.5rem; background: #ffffff; border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; border-bottom: 1px solid var(--border-color, #f1f5f9); padding-bottom: 0.75rem;">
                            <h3 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: var(--text-main, #0f172a);">
                                Upcoming Meetings
                            </h3>
                            <a href="/faculty/meetings" class="nav-link-btn" style="font-size: 0.82rem; color: var(--primary, #059669); font-weight: 600; text-decoration: none;">
                                Schedule →
                            </a>
                        </div>

                        ${upcomingMeetings.length === 0 ? `
                            <p style="font-size: 0.88rem; color: var(--text-muted, #64748b); margin: 0; text-align: center; padding: 2rem 1rem;">
                                No upcoming meetings scheduled.
                            </p>
                        ` : `
                            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                                ${upcomingMeetings.map(m => {
                                    const dateObj = new Date((m.scheduled_at || '').replace(' ', 'T'));
                                    const dateFormatted = isNaN(dateObj) ? m.scheduled_at : dateObj.toLocaleString('en-US', {
                                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
                                    });

                                    return `
                                        <div style="padding: 0.9rem 1rem; background: var(--bg-main, #f8fafc); border: 1px solid var(--border-color, #e2e8f0); border-radius: 9px;">
                                            <strong style="font-size: 0.9rem; color: var(--text-main, #0f172a); display: block; margin-bottom: 0.2rem;">${m.title}</strong>
                                            <div style="font-size: 0.8rem; color: var(--primary, #059669); font-weight: 600; margin-bottom: 0.35rem;">${m.project_name}</div>
                                            <div style="display: flex; gap: 0.75rem; font-size: 0.78rem; color: var(--text-muted, #64748b); flex-wrap: wrap;">
                                                <span>${iconMiniCalendar} ${dateFormatted}</span>
                                                <span>${iconMapPin} ${m.location || 'Google Meet'}</span>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        `}
                    </div>

                </div>

            </div>
        `;

        setupInteractiveListeners();
    }

    function setupInteractiveListeners() {
        // Notification bell dropdown toggle
        const bellBtn = container.querySelector('#noti-bell-btn');
        const dropdown = container.querySelector('#noti-dropdown');
        
        bellBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const isShown = dropdown.style.display === 'block';
            dropdown.style.display = isShown ? 'none' : 'block';
        });

        document.addEventListener('click', (e) => {
            if (dropdown && !dropdown.contains(e.target) && e.target !== bellBtn) {
                dropdown.style.display = 'none';
            }
        });

        // SPA Navigation for links and buttons
        container.querySelectorAll('a[href^="/faculty"]').forEach(a => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                const path = a.getAttribute('href');
                if (router) router.push(path);
            });
        });

        // Project details button
        container.querySelectorAll('.btn-nav-project').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (router) router.push(`/faculty/projects/${id}`);
            });
        });

        // Assign tasks button
        container.querySelectorAll('.btn-nav-assign').forEach(btn => {
            btn.addEventListener('click', () => {
                if (router) router.push('/faculty/sprints');
            });
        });
    }

    async function loadDashboardData() {
        try {
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };
            const queryParam = storedUser?.email ? `?email=${encodeURIComponent(storedUser.email)}` : '';
            const res = await fetch(`${apiBase}/faculty/dashboard${queryParam}`, { headers });

            if (res.ok) {
                dashboardData = await res.json();
            } else {
                dashboardData = null;
            }
        } catch (err) {
            console.error('Error fetching faculty dashboard data:', err);
            dashboardData = null;
        } finally {
            isLoading = false;
            render();
        }
    }

    render();
    loadDashboardData();

    return container;
}

export default FacultyHome;