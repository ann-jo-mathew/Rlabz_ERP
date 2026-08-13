import '../faculty.css';

export function FacultyHome(route, router) {
    const container = document.createElement('div');

    container.className = 'faculty-home';

    container.innerHTML = `
        <div class="dashboard-header-container" style="display: flex; justify-content: space-between; align-items: center; position: relative;">
            <div class="page-header" style="margin-bottom: 0;">
                <h1>Faculty Dashboard</h1>
                <p>Overview of your assigned projects and students.</p>
            </div>
            <div class="notification-container" style="position: relative;">
                <button id="noti-bell-btn" class="noti-bell-btn" style="background: none; border: none; font-size: 24px; cursor: pointer; position: relative; padding: 5px;">
                    🔔
                    <span class="noti-badge" style="position: absolute; top: 0; right: 0; background: #ef4444; color: white; border-radius: 50%; font-size: 11px; padding: 2px 6px; font-weight: bold;">3</span>
                </button>
                <div id="noti-dropdown" class="noti-dropdown" style="display: none; position: absolute; right: 0; top: 45px; width: 320px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); z-index: 1000; padding: 15px;">
                    <h4 style="margin: 0 0 10px; font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; color: #1e293b;">Recent Notifications</h4>
                    <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px;">
                        <li style="font-size: 13px; color: #334155; padding-bottom: 8px; border-bottom: 1px dashed #f1f5f9; text-align: left;">
                            <strong>📁 Project Assigned:</strong> HMS project assigned to you. <span style="font-size: 11px; color: #94a3b8; display: block; margin-top: 2px;">Just now</span>
                        </li>
                        <li style="font-size: 13px; color: #334155; padding-bottom: 8px; border-bottom: 1px dashed #f1f5f9; text-align: left;">
                            <strong>🏃‍♂️ Sprint Uploaded:</strong> Sprint 2 uploaded for RLabZ ERP. <span style="font-size: 11px; color: #94a3b8; display: block; margin-top: 2px;">2 hours ago</span>
                        </li>
                        <li style="font-size: 13px; color: #334155; text-align: left;">
                            <strong>🐙 Repo Added:</strong> Booking System repository link added. <span style="font-size: 11px; color: #94a3b8; display: block; margin-top: 2px;">Yesterday</span>
                        </li>
                    </ul>
                    <div style="margin-top: 12px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px;">
                        <a href="/faculty/notifications" id="noti-view-all" style="font-size: 12px; color: #087f5b; font-weight: 600; text-decoration: none;">View All Notifications</a>
                    </div>
                </div>
            </div>
        </div>

        <div class="faculty-stats" style="margin-top: 30px;">

            <div class="faculty-stat-card">
                <div class="stat-icon">📁</div>
                <div>
                    <h3>3</h3>
                    <p>Projects Assigned</p>
                </div>
            </div>

            <div class="faculty-stat-card">
                <div class="stat-icon">👥</div>
                <div>
                    <h3>7</h3>
                    <p>Total Students</p>
                </div>
            </div>

            <div class="faculty-stat-card">
                <div class="stat-icon">📅</div>
                <div>
                    <h3>2</h3>
                    <p>Meetings Today</p>
                </div>
            </div>

            <div class="faculty-stat-card">
                <div class="stat-icon">🔗</div>
                <div>
                    <h3>2</h3>
                    <p>Pending GitHub Verification</p>
                </div>
            </div>

        </div>

        <div class="faculty-dashboard-section">

            <div class="faculty-section-header">
                <h2>My Projects</h2>
            </div>

            <div class="faculty-project-list">

                <div class="faculty-project-card">
                    <div>
                        <h3>RLabZ ERP</h3>
                        <p>Client: Rajagiri College</p>
                        <span class="faculty-status active">
                            In Progress
                        </span>
                    </div>

                    <div class="faculty-project-progress">
                        <p>Progress: 70%</p>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width:70%"></div>
                        </div>
                    </div>
                </div>

                <div class="faculty-project-card">
                    <div>
                        <h3>Student Management System</h3>
                        <p>Client: Computer Science Department</p>
                        <span class="faculty-status active">
                            In Progress
                        </span>
                    </div>

                    <div class="faculty-project-progress">
                        <p>Progress: 50%</p>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width:50%"></div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    `;

    // Interactive Notification bell and dropdown logic
    const bellBtn = container.querySelector('#noti-bell-btn');
    const dropdown = container.querySelector('#noti-dropdown');
    
    bellBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        const isShown = dropdown.style.display === 'block';
        dropdown.style.display = isShown ? 'none' : 'block';
    });

    // Close dropdown on click outside
    document.addEventListener('click', () => {
        if (dropdown) dropdown.style.display = 'none';
    });

    dropdown?.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Route click logic for View All Notifications link
    const viewAllLink = container.querySelector('#noti-view-all');
    viewAllLink?.addEventListener('click', (e) => {
        e.preventDefault();
        if (router) {
            router.push('/faculty/notifications');
        }
    });

    return container;
}

export default FacultyHome;