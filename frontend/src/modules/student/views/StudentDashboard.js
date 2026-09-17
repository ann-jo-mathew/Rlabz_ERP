import { renderStudentSidebar } from './StudentSidebar.js';
import {
  fetchLiveDashboard,
  getDashboardData,
  getProjects,
  getMeetings,
  getNotifications,
  updateStudentTaskStatus
} from './studentStore.js';
import { useAuthStore } from '@/core/stores/auth.js';
import { StudentSwal, showStudentSuccess, showStudentError } from '../studentAlerts.js';
import '../student.css';

export async function StudentDashboard(route, router) {
  renderStudentSidebar();

  const container = document.createElement('div');
  container.className = 'student-portal-container animate-fade-in student-dashboard-view';

  const authStore = useAuthStore();
  const currentUser = authStore.user;

  // Local state
  let taskFilter = 'all'; // 'all' | 'pending' | 'completed'
  let isSyncing = false;

  // Initial fresh fetch from backend
  await fetchLiveDashboard(true);

  function render() {
    const dashboard = getDashboardData() || {};
    const projects = dashboard.projects || getProjects() || [];
    const tasks = dashboard.tasks || [];
    const modules = dashboard.modules || [];
    const meetings = dashboard.meetings || getMeetings() || [];
    const notifications = dashboard.notifications || getNotifications() || [];
    const stats = dashboard.stats || {};

    // Display latest 1 or 2 meetings and notifications
    const displayedMeetings = meetings.slice(0, 2);
    const displayedNotifications = notifications.slice(0, 2);

    // KPIs
    const activeProjectsCount = stats.activeProjectsCount ?? projects.filter(p => p.status === 'In Progress').length;
    const pendingTasksCount = stats.pendingTasksCount ?? tasks.filter(t => t.rawStatus !== 'completed').length;
    const completedTasksCount = stats.completedTasksCount ?? tasks.filter(t => t.rawStatus === 'completed').length;
    const assignedModulesCount = stats.assignedModulesCount ?? modules.length;
    const upcomingMeetingsCount = stats.upcomingMeetingsCount ?? meetings.filter(m => m.status === 'Scheduled').length;

    // Display only the latest 3 tasks in the dashboard
    const displayedTasks = tasks.slice(0, 3);

    // Student Designation / Role Label
    const studentDesignation = currentUser?.designation || (projects.length > 0 ? projects[0].designation : 'Nova');
    const studentName = currentUser?.name || 'Student';
    const studentInitial = studentName.charAt(0).toUpperCase();

    // 1. Build Task Rows (Latest 3)
    const taskRows = displayedTasks.map(t => {
      const isCompleted = t.rawStatus === 'completed';
      const isInProgress = t.rawStatus === 'in_progress';
      const isBlocked = t.rawStatus === 'blocked';

      return `
        <tr>
          <td style="max-width: 260px;">
            <div class="student-dash-task-title">${t.title}</div>
            ${t.description ? `<div class="student-dash-task-sub" title="${t.description}">${t.description}</div>` : ''}
            <div class="student-dash-task-pills">
              <span class="student-dash-tag ${t.type === 'module' ? 'module' : 'task'}">
                ${t.type === 'module' ? 'Module / Sprint' : 'Sub-Task'}
              </span>
              <span class="student-dash-tag project">${t.project}</span>
              <span class="student-dash-tag" style="background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;">${t.module}</span>
            </div>
          </td>
          <td>
            <div style="font-size: 0.825rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              ${t.assignedBy || 'Supervisor'}
            </div>
          </td>
          <td>
            <div style="display: flex; flex-direction: column; gap: 3px;">
              <span style="font-size: 0.825rem; font-weight: 600; color: ${t.isOverdue ? '#dc2626' : 'var(--text-secondary)'};">
                ${t.dueDate}
              </span>
              ${t.isOverdue ? `<span class="student-badge-overdue" style="width: fit-content;">Overdue</span>` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // 2. Identify Genuine Bug Fixes & Rework Assigned by Faculty or Coordinator
    const completedProjects = projects.filter(p => (p.status || '').toLowerCase() === 'completed' || p.progress === 100);
    const completedProjectsCount = completedProjects.length;

    const bugFixList = [];
    const seenTaskIds = new Set();

    const allProjectTasks = projects.flatMap(p => {
      const pModules = p.modulesList || p.modules || [];
      return pModules.flatMap(m => (m.tasks || []).map(t => ({
        ...t,
        project: p.title,
        projectId: p.id
      })));
    });

    const combinedStudentTasks = [...allProjectTasks, ...tasks];

    combinedStudentTasks.forEach(t => {
      if (!t.id || seenTaskIds.has(String(t.id))) return;
      
      const isReworkByFaculty = t.isRework === true || (t.reviewStatus && t.reviewStatus.toLowerCase() === 'rejected');

      if (isReworkByFaculty) {
        seenTaskIds.add(String(t.id));
        bugFixList.push({
          id: String(t.id),
          title: t.title,
          project: t.project || 'Academic Project',
          isRework: true,
          status: 'Rework / Fix Required',
          assignedBy: t.assignedBy || 'Faculty / Coordinator'
        });
      }
    });

    const bugFixesCount = bugFixList.length;

    // 3. Build Meeting Items (Latest 1 or 2)
    const meetingItems = displayedMeetings.map(m => {
      let day = '—';
      let month = 'MTG';
      if (m.date) {
        const dObj = new Date(m.date);
        if (!isNaN(dObj.getTime())) {
          day = dObj.getDate();
          month = dObj.toLocaleString('default', { month: 'short' });
        } else {
          const parts = m.date.split(' ');
          if (parts.length >= 2) {
            month = parts[0];
            day = parts[1].replace(',', '');
          }
        }
      }

      const hasLink = Boolean(m.meetingLink && m.meetingLink.startsWith('http'));

      return `
        <div class="student-dash-meeting-item">
          <div class="student-dash-meeting-datebox">
            <span class="student-dash-meeting-day">${day}</span>
            <span class="student-dash-meeting-month">${month}</span>
          </div>
          <div class="student-dash-meeting-info">
            <div class="student-dash-meeting-title" title="${m.title}">${m.title}</div>
            <div class="student-dash-meeting-meta">
              <span>⏰ ${m.time || '10:00 AM'}</span>
              <span>•</span>
              <span style="color: #0284c7; font-weight: 700;">${m.project}</span>
            </div>
          </div>
          ${hasLink ? `
            <a href="${m.meetingLink}" target="_blank" rel="noopener noreferrer" class="student-dash-meeting-btn" title="Join Video Session">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 10l5-5v14l-5-5"></path><rect x="2" y="6" width="13" height="12" rx="2"></rect></svg>
              <span>Join</span>
            </a>
          ` : `
            <span class="student-badge student-badge-info" style="font-size: 0.7rem; flex-shrink: 0;">${m.status}</span>
          `}
        </div>
      `;
    }).join('');

    // 4. Build Notifications List (Latest 1 or 2)
    const notifItems = displayedNotifications.map(n => {
      let iconColor = '#0284c7';
      let iconBg = '#e0f2fe';
      if (n.type === 'meeting_scheduled') { iconColor = '#0284c7'; iconBg = '#e0f2fe'; }
      else if (n.type === 'task_assigned') { iconColor = '#d97706'; iconBg = '#fef3c7'; }
      else if (n.type === 'module_assigned') { iconColor = '#7c3aed'; iconBg = '#f3e8ff'; }

      return `
        <div class="student-dash-notif-item">
          <div class="student-dash-notif-icon-box" style="background: ${iconBg}; color: ${iconColor};">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </div>
          <div class="student-dash-notif-content">
            <span class="student-dash-notif-title">${n.message}</span>
            <span class="student-dash-notif-time">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              ${n.time || 'Recently'}
            </span>
          </div>
        </div>
      `;
    }).join('');

    // 5. Render HTML Output
    container.innerHTML = `
      <!-- Dashboard Top Header -->
      <div class="student-header">
        <h1>Student Dashboard</h1>
        <p>Welcome back, <strong>${studentName}</strong>!</p>
      </div>


      <!-- Advanced 6-Card KPI Grid -->
      <div class="student-dash-kpi-grid">
        <!-- 1. Active Projects -->
        <div class="student-dash-kpi-card kpi-blue" id="kpi-projects" title="Click to view active projects">
          <div class="student-dash-kpi-top">
            <div class="student-dash-kpi-icon blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div class="student-dash-kpi-arrow">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
          </div>
          <div class="student-dash-kpi-info">
            <span class="student-dash-kpi-val">${activeProjectsCount}</span>
            <span class="student-dash-kpi-lbl">Active Projects</span>
          </div>
        </div>

        <!-- 2. Completed Projects -->
        <div class="student-dash-kpi-card kpi-emerald" id="kpi-completed-projects" title="Click to view completed projects">
          <div class="student-dash-kpi-top">
            <div class="student-dash-kpi-icon emerald">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <div class="student-dash-kpi-arrow">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
          </div>
          <div class="student-dash-kpi-info">
            <span class="student-dash-kpi-val" style="color: #059669;">${completedProjectsCount}</span>
            <span class="student-dash-kpi-lbl">Completed Projects</span>
          </div>
        </div>

        <!-- 3. Pending Tasks -->
        <div class="student-dash-kpi-card kpi-indigo" id="kpi-tasks" title="Click to view assigned tasks">
          <div class="student-dash-kpi-top">
            <div class="student-dash-kpi-icon indigo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"></path>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
              </svg>
            </div>
            <div class="student-dash-kpi-arrow">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
          </div>
          <div class="student-dash-kpi-info">
            <span class="student-dash-kpi-val" style="color: #4f46e5;">${pendingTasksCount}</span>
            <span class="student-dash-kpi-lbl">Pending Tasks</span>
          </div>
        </div>

        <!-- 4. Bug Fixes / Rework -->
        <div class="student-dash-kpi-card kpi-coral" id="kpi-bug-fixes" title="${bugFixesCount > 0 ? 'Click to inspect ' + bugFixesCount + ' bug fixes / rework' : 'Click to view bug fixes status'}">
          <div class="student-dash-kpi-top">
            <div class="student-dash-kpi-icon coral">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="8" height="14" x="8" y="5" rx="4"></rect>
                <path d="m19 7-3 2"></path>
                <path d="m5 7 3 2"></path>
                <path d="m19 19-3-2"></path>
                <path d="m5 19 3-2"></path>
                <path d="M20 13h-4"></path>
                <path d="M4 13h4"></path>
                <path d="m10 4 1 2"></path>
                <path d="m14 4-1 2"></path>
              </svg>
            </div>
            <div class="student-dash-kpi-arrow">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
          </div>
          <div class="student-dash-kpi-info">
            <span class="student-dash-kpi-val" style="color: ${bugFixesCount > 0 ? '#dc2626' : 'var(--text-muted)'};">${bugFixesCount}</span>
            <span class="student-dash-kpi-lbl">Bug Fixes / Rework</span>
          </div>
        </div>

        <!-- 5. Assigned Modules -->
        <div class="student-dash-kpi-card kpi-purple" id="kpi-modules" title="Click to view sprints & modules">
          <div class="student-dash-kpi-top">
            <div class="student-dash-kpi-icon purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
            </div>
            <div class="student-dash-kpi-arrow">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
          </div>
          <div class="student-dash-kpi-info">
            <span class="student-dash-kpi-val" style="color: #9333ea;">${assignedModulesCount}</span>
            <span class="student-dash-kpi-lbl">Assigned Modules</span>
          </div>
        </div>

        <!-- 6. Upcoming Meetings -->
        <div class="student-dash-kpi-card kpi-amber" id="kpi-meetings" title="Click to view scheduled meetings">
          <div class="student-dash-kpi-top">
            <div class="student-dash-kpi-icon amber">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <div class="student-dash-kpi-arrow">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
          </div>
          <div class="student-dash-kpi-info">
            <span class="student-dash-kpi-val" style="color: #d97706;">${upcomingMeetingsCount}</span>
            <span class="student-dash-kpi-lbl">Upcoming Meetings</span>
          </div>
        </div>
      </div>

      <!-- Main 2-Column Split Grid -->
      <div class="student-dash-grid">
        
        <!-- Left Column: Tasks -->
        <div style="display: flex; flex-direction: column; gap: 22px;">

          <!-- SECTION 1: My Assigned Tasks & Deliverables -->
          <div class="student-dash-card" id="card-assigned-tasks">
            <div class="student-dash-card-header">
              <div class="student-dash-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2">
                  <path d="M9 11l3 3L22 4"></path>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <span>My Assigned Tasks &amp; Deliverables</span>
                <span class="student-dash-card-badge" style="background: #e0f2fe; color: #0284c7;">
                  ${tasks.length} Assigned
                </span>
                <span class="student-dash-card-badge">
                  Latest 3
                </span>
              </div>
            </div>

            <!-- Tasks Table -->
            <div class="student-dash-table-wrap">
              <table class="student-dash-table">
                <thead>
                  <tr>
                    <th style="width: 50%;">Task &amp; Scope</th>
                    <th style="width: 28%;">Assigned By</th>
                    <th style="width: 22%;">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${taskRows || `
                    <tr>
                      <td colspan="3" style="text-align: center; padding: 36px 20px; color: var(--text-muted);">
                        <div style="font-size: 1.75rem; margin-bottom: 6px;">📋</div>
                        <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">No tasks assigned</div>
                        <div style="font-size: 0.78rem;">Your supervisor will assign project modules and deliverable tickets.</div>
                      </td>
                    </tr>
                  `}
                </tbody>
              </table>

              ${tasks.length > 0 ? `
                <div class="student-dash-table-footer" style="margin-top: 12px;">
                  <span>
                    Showing <strong>${displayedTasks.length}</strong> of <strong>${tasks.length}</strong> tasks (Latest 3)
                  </span>
                  <button type="button" class="student-btn student-btn-outline student-btn-sm btn-view-all-tasks" style="font-size: 0.75rem; padding: 4px 12px; font-weight: 700;">
                    View Projects &amp; All Tasks (${tasks.length}) →
                  </button>
                </div>
              ` : ''}
            </div>
          </div>

        </div>

        <!-- Right Column: Upcoming Meetings & Live Notifications -->
        <div style="display: flex; flex-direction: column; gap: 22px;">

          <!-- SECTION 2: Upcoming Meetings & Sessions -->
          <div class="student-dash-card">
            <div class="student-dash-card-header">
              <div class="student-dash-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>Upcoming Meetings</span>
                <span class="student-dash-card-badge" style="background: #fef3c7; color: #b45309;">
                  Latest ${displayedMeetings.length}
                </span>
              </div>

              <button type="button" class="student-btn student-btn-outline student-btn-sm btn-nav-meetings" style="font-size: 0.75rem; padding: 4px 10px;">
                Calendar (${meetings.length}) →
              </button>
            </div>

            <div class="student-dash-meetings-list">
              ${meetingItems || `
                <div style="text-align: center; padding: 28px 16px; color: var(--text-muted); background: var(--bg-canvas-light); border-radius: 12px;">
                  <div style="font-size: 1.5rem; margin-bottom: 6px;">📅</div>
                  <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">No meetings scheduled</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Faculty will post standup links here.</div>
                </div>
              `}
            </div>
          </div>

          <!-- SECTION 3: Recent Assignment Activity & Notifications -->
          <div class="student-dash-card">
            <div class="student-dash-card-header">
              <div class="student-dash-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <span>Recent Activity &amp; Alerts</span>
                <span class="student-dash-card-badge" style="background: #e0f2fe; color: #0284c7;">
                  Latest ${displayedNotifications.length}
                </span>
              </div>
            </div>

            <div class="student-dash-notif-list">
              ${notifItems || `
                <div style="text-align: center; padding: 28px 16px; color: var(--text-muted); background: var(--bg-canvas-light); border-radius: 12px;">
                  <div style="font-size: 1.5rem; margin-bottom: 6px;">🔔</div>
                  <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">No recent notifications</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">New task alerts will appear here.</div>
                </div>
              `}
            </div>
          </div>

        </div>
      </div>
    `;

    // -------------------------------------------------------------------------
    // EVENT BINDINGS
    // -------------------------------------------------------------------------

    // 1. Sync Live Data button
    const syncBtn = container.querySelector('#btn-sync-data');
    syncBtn?.addEventListener('click', async () => {
      if (isSyncing) return;
      isSyncing = true;
      render();

      try {
        await fetchLiveDashboard(true);
        StudentSwal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Dashboard Synchronized',
          text: 'Loaded live assignments from Coordinator & Faculty.',
          showConfirmButton: false,
          timer: 2500,
          timerProgressBar: true
        });
      } catch (err) {
        showStudentError('Sync Failed', err.message || 'Could not reach server.');
      } finally {
        isSyncing = false;
        render();
      }
    });

    // 2. Task status changes
    container.querySelectorAll('.student-task-status-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        const taskId = select.getAttribute('data-task-id');
        const taskType = select.getAttribute('data-task-type') || 'task';
        const newStatus = e.target.value;
        select.disabled = true;

        try {
          await updateStudentTaskStatus(taskId, newStatus, taskType);
          StudentSwal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: taskType === 'module' ? 'Module Status Updated' : 'Task Status Updated',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
          });
          render();
        } catch (err) {
          select.disabled = false;
          showStudentError('Update Failed', err.message || 'Could not update task status.');
        }
      });
    });

    // 3. Task filter pills
    container.querySelectorAll('#card-assigned-tasks .student-filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        taskFilter = pill.getAttribute('data-filter');
        render();
      });
    });

    // 4. KPI card clicks
    container.querySelector('#kpi-projects')?.addEventListener('click', () => {
      router.push('/student/projects');
    });

    container.querySelector('#kpi-completed-projects')?.addEventListener('click', () => {
      router.push('/student/projects');
    });

    container.querySelector('#kpi-tasks')?.addEventListener('click', () => {
      taskFilter = 'pending';
      render();
      container.querySelector('#card-assigned-tasks')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    container.querySelector('#kpi-bug-fixes')?.addEventListener('click', () => {
      if (bugFixList.length > 0) {
        const listHtml = bugFixList.map(b => `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--bg-canvas-light); border: 1px solid var(--border-subtle); border-radius: 8px; margin-bottom: 8px; text-align: left;">
            <div>
              <div style="font-weight: 700; color: var(--text-primary); font-size: 0.88rem;">${b.title}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                <span>Project: <strong>${b.project}</strong></span>
              </div>
            </div>
            <span class="student-badge ${b.isRework ? 'student-badge-danger' : 'student-badge-warning'}" style="font-size: 0.72rem; padding: 3px 8px; font-weight: 700;">
              ${b.status}
            </span>
          </div>
        `).join('');

        StudentSwal.fire({
          title: `<span style="display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">
            <span style="color: #dc2626;">🔧</span> Bug Fixes & Rework (${bugFixList.length})
          </span>`,
          html: `
            <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 14px; text-align: center;">
              The following rework or bug fix tickets have been requested by Faculty or Coordinator:
            </div>
            <div style="max-height: 280px; overflow-y: auto; padding-right: 4px;">
              ${listHtml}
            </div>
          `,
          confirmButtonText: 'Go to Projects Workspace →',
          confirmButtonColor: '#0284c7',
          showCancelButton: true,
          cancelButtonText: 'Close'
        }).then((res) => {
          if (res.isConfirmed) {
            router.push('/student/projects');
          }
        });
      } else {
        StudentSwal.fire({
          icon: 'success',
          title: '0 Bug Fixes Pending',
          text: 'No bug fixes or rework tickets have been assigned by Faculty or Coordinator. All your deliverables are in order.',
          confirmButtonText: 'Great!',
          confirmButtonColor: '#0284c7'
        });
      }
    });

    container.querySelector('#kpi-modules')?.addEventListener('click', () => {
      router.push('/student/projects');
    });

    container.querySelector('#kpi-meetings')?.addEventListener('click', () => {
      router.push('/student/meetings');
    });

    // 5. Navigation buttons
    container.querySelectorAll('.btn-nav-projects').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        router.push('/student/projects');
      });
    });

    container.querySelector('.btn-nav-meetings')?.addEventListener('click', () => {
      router.push('/student/meetings');
    });

    container.querySelectorAll('.btn-view-all-tasks').forEach(btn => {
      btn.addEventListener('click', () => {
        router.push('/student/projects');
      });
    });
  }

  render();
  return container;
}

export default StudentDashboard;
