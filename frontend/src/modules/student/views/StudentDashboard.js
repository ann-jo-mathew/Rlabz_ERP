import { renderStudentSidebar } from './StudentSidebar.js';
import { getProjects, getMeetings, ensureDataLoaded } from './studentStore.js';
import { useAuthStore } from '@/core/stores/auth.js';
import '../student.css';

export async function StudentDashboard(route, router) {
  await ensureDataLoaded();
  // 1. Rewrite sidebar for student portal
  renderStudentSidebar();

  const authStore = useAuthStore();
  const currentUser = authStore.user;

  const container = document.createElement('div');
  container.className = 'student-portal-container animate-fade-in';

  // 2. Fetch mock data
  const projects = getProjects() || [];
  projects.forEach(p => {
    p.designation = currentUser?.designation || p.designation;
  });
  const meetings = getMeetings();

  // 3. Count KPIs
  const activeProjectsCount = projects.filter(p => p.status === 'In Progress').length;
  const upcomingMeetingsCount = meetings.filter(m => m.status === 'Scheduled').length;

  // 4. Mock notifications based on actual stored items
  const notifications = [
    { title: "Weekly Progress Review meeting scheduled for Aug 11", time: "2 hours ago" },
    { title: "Daily Work Log for Aug 8 successfully submitted", time: "1 day ago" },
    { title: "GitHub repository URL updated for RLabZ ERP - Student Portal", time: "2 days ago" }
  ];

  // 5. Render projects rows
  const projectRows = projects.map(p => `
    <tr>
      <td>
        <div style="font-weight: 600;">${p.title}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">${p.tech}</div>
      </td>
      <td>
        <span class="student-badge student-badge-info">${p.designation}</span>
      </td>
      <td>
        <span class="student-badge ${p.status === 'Completed' ? 'student-badge-success' : 'student-badge-warning'}">${p.status}</span>
      </td>
      <td>${p.faculty}</td>
      <td>
        <button class="student-btn student-btn-outline student-btn-sm view-btn" data-id="${p.id}">View Details</button>
      </td>
    </tr>
  `).join('');

  // 6. Build HTML
  container.innerHTML = `
    <div class="student-header">
      <h1>Student Dashboard</h1>
      <p>Manage your academic projects, submissions, logs, and communication.</p>
    </div>


    <!-- KPI Strip -->
    <div class="student-kpi-grid">
      <div class="student-kpi-card" id="kpi-projects">
        <div class="student-kpi-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
        </div>
        <div class="student-kpi-info">
          <span class="student-kpi-value">${activeProjectsCount}</span>
          <span class="student-kpi-label">Active Projects</span>
        </div>
      </div>

      <div class="student-kpi-card" id="kpi-meetings">
        <div class="student-kpi-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        </div>
        <div class="student-kpi-info">
          <span class="student-kpi-value">${upcomingMeetingsCount}</span>
          <span class="student-kpi-label">Upcoming Meetings</span>
        </div>
      </div>
    </div>

    <!-- Dashboard Main Area -->
    <div class="student-dashboard-grid">
      <!-- Projects Table Card -->
      <div class="student-card">
        <div class="student-card-title">My Projects</div>
        <div class="student-table-container">
          <table class="student-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Designation</th>
                <th>Status</th>
                <th>Faculty</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${projectRows || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);">No projects assigned.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Notifications Card -->
      <div class="student-card">
        <div class="student-card-title">Recent Notifications</div>
        <div style="display: flex; flex-direction: column;">
          ${notifications.map(n => `
            <div class="student-notif-item">
              <span class="student-notif-title">${n.title}</span>
              <span class="student-notif-time">${n.time}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  // Attach event handlers
  container.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      router.push('/student/projects');
    });
  });

  container.querySelector('#kpi-projects').addEventListener('click', () => {
    router.push('/student/projects');
  });



  container.querySelector('#kpi-meetings').addEventListener('click', () => {
    router.push('/student/meetings');
  });

  return container;
}

export default StudentDashboard;
