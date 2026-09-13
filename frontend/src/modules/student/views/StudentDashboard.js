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
  container.className = 'student-portal-container animate-fade-in';

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

    // 1. Build Task Rows (Latest 3)
    const taskRows = displayedTasks.map(t => {
      const isCompleted = t.rawStatus === 'completed';
      const isInProgress = t.rawStatus === 'in_progress';
      const isBlocked = t.rawStatus === 'blocked';

      let statusBadgeClass = 'student-badge-warning';
      if (isCompleted) statusBadgeClass = 'student-badge-success';
      else if (isInProgress) statusBadgeClass = 'student-badge-info';
      else if (isBlocked) statusBadgeClass = 'student-badge-danger';

      return `
        <tr>
          <td style="max-width: 240px;">
            <div style="font-weight: 700; color: #0f172a; font-size: 0.88rem;">${t.title}</div>
            ${t.description ? `<div style="font-size: 0.75rem; color: #64748b; margin-top: 2px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${t.description}</div>` : ''}
            <div style="display: flex; gap: 6px; margin-top: 5px; flex-wrap: wrap;">
              <span class="student-badge" style="background: ${t.type === 'module' ? '#fdf4ff' : '#eff6ff'}; color: ${t.type === 'module' ? '#9333ea' : '#2563eb'}; font-size: 0.7rem; padding: 2px 6px; font-weight: 700;">
                ${t.type === 'module' ? 'Module / Sprint' : 'Sub-Task'}
              </span>
              <span class="student-badge" style="background: #f1f5f9; color: #475569; font-size: 0.7rem; padding: 2px 6px;">${t.project}</span>
              <span class="student-badge" style="background: #ecfdf5; color: #047857; font-size: 0.7rem; padding: 2px 6px;">${t.module}</span>
            </div>
          </td>
          <td>
            <div style="font-size: 0.825rem; font-weight: 600; color: #334155;">${t.assignedBy}</div>
          </td>
          <td>
            <div style="display: flex; flex-direction: column; gap: 3px;">
              <span style="font-size: 0.825rem; font-weight: 500; color: ${t.isOverdue ? '#dc2626' : '#475569'};">
                ${t.dueDate}
              </span>
              ${t.isOverdue ? `<span class="student-badge-overdue" style="width: fit-content;">Overdue</span>` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');



    // 2.5. Identify Genuine Bug Fixes & Rework Assigned by Faculty or Coordinator (strictly no demo data or heuristics)
    const completedProjects = projects.filter(p => (p.status || '').toLowerCase() === 'completed' || p.progress === 100);
    const completedProjectsCount = completedProjects.length;

    const bugFixList = [];
    const seenTaskIds = new Set();

    // Collect all tasks assigned to student across projects and granular tasks
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
      
      // In RLabz ERP, a task is ONLY a rework / bug fix if Faculty or Coordinator reviewed it and requested changes/rework (rejected)
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
      // Parse day & month from date string (e.g. "Mar 15, 2026" or "2026-03-15")
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
              <span style="color: #059669; font-weight: 600;">${m.project}</span>
              ${m.scheduledBy ? `<span>• By: ${m.scheduledBy}</span>` : ''}
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
      let iconColor = '#059669';
      if (n.type === 'meeting_scheduled') iconColor = '#2563eb';
      else if (n.type === 'task_assigned') iconColor = '#d97706';
      else if (n.type === 'module_assigned') iconColor = '#7c3aed';

      return `
        <div class="student-notif-item">
          <div class="student-notif-icon-box" style="color: ${iconColor};">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </div>
          <div class="student-notif-content">
            <span class="student-notif-title">${n.message}</span>
            <span class="student-notif-time">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              ${n.time || 'Recently'}
            </span>
          </div>
        </div>
      `;
    }).join('');

    // HTML Output
    container.innerHTML = `
      <!-- Dashboard Top Header -->
      <div class="student-dashboard-header">
        <div class="student-header-text">

          <h1>Student Dashboard</h1>
          <p>Welcome back, <strong>${studentName}</strong>! Track your assigned academic projects, tasks, meetings, and faculty reviews.</p>
        </div>

      

         
      </div>

      <!-- KPI Strip (Strict Single Row of 6 Cards) -->
      <div class="student-kpi-grid">
        <!-- 1. Active Projects -->
        <div class="student-kpi-card" id="kpi-projects" style="cursor: pointer;" title="Click to view active projects">
          <div class="student-kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div class="student-kpi-info">
            <span class="student-kpi-value">${activeProjectsCount}</span>
            <span class="student-kpi-label">Active Projects</span>
          </div>
          <div class="student-kpi-arrow">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
        </div>

        <!-- 2. Completed Projects -->
        <div class="student-kpi-card" id="kpi-completed-projects" style="cursor: pointer;" title="Click to view completed projects">
          <div class="student-kpi-icon" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); color: #16a34a; border: 1px solid #bbf7d0;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div class="student-kpi-info">
            <span class="student-kpi-value" style="color: #16a34a;">${completedProjectsCount}</span>
            <span class="student-kpi-label">Completed Projects</span>
          </div>
          <div class="student-kpi-arrow">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
        </div>

        <!-- 3. Pending Tasks -->
        <div class="student-kpi-card" id="kpi-tasks" style="cursor: pointer;" title="Click to view assigned tasks">
          <div class="student-kpi-icon" style="background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l3 3L22 4"></path>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
          </div>
          <div class="student-kpi-info">
            <span class="student-kpi-value" style="color: #2563eb;">${pendingTasksCount}</span>
            <span class="student-kpi-label">Pending Tasks</span>
          </div>
          <div class="student-kpi-arrow">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
        </div>

        <!-- 4. Bug Fixes -->
        <div class="student-kpi-card ${bugFixesCount > 0 ? 'kpi-card-alert' : ''}" id="kpi-bug-fixes" style="cursor: pointer;" title="${bugFixesCount > 0 ? 'Click to inspect ' + bugFixesCount + ' bug fixes / rework' : 'Click to view bug fixes status'}">
          <div class="student-kpi-icon" style="${bugFixesCount > 0 ? 'background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); color: #dc2626; border: 1px solid #fca5a5; box-shadow: 0 2px 8px rgba(220, 38, 38, 0.15);' : 'background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); color: #64748b; border: 1px solid #e2e8f0;'}">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
          <div class="student-kpi-info">
            <span class="student-kpi-value" style="color: ${bugFixesCount > 0 ? '#dc2626' : '#64748b'};">${bugFixesCount}</span>
            <span class="student-kpi-label">Bug Fixes</span>
          </div>
          <div class="student-kpi-arrow" style="${bugFixesCount > 0 ? 'color: #dc2626;' : ''}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
        </div>

        <!-- 5. Assigned Modules -->
        <div class="student-kpi-card" id="kpi-modules" style="cursor: pointer;" title="Click to view sprints & modules">
          <div class="student-kpi-icon" style="background: #fdf4ff; color: #9333ea; border: 1px solid #e9d5ff;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          <div class="student-kpi-info">
            <span class="student-kpi-value" style="color: #9333ea;">${assignedModulesCount}</span>
            <span class="student-kpi-label">Assigned Modules</span>
          </div>
          <div class="student-kpi-arrow">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
        </div>

        <!-- 6. Upcoming Meetings -->
        <div class="student-kpi-card" id="kpi-meetings" style="cursor: pointer;" title="Click to view scheduled meetings">
          <div class="student-kpi-icon" style="background: #fffbeb; color: #d97706; border: 1px solid #fde68a;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div class="student-kpi-info">
            <span class="student-kpi-value" style="color: #d97706;">${upcomingMeetingsCount}</span>
            <span class="student-kpi-label">Upcoming Meetings</span>
          </div>
          <div class="student-kpi-arrow">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
        </div>
      </div>

      <!-- Dashboard Main Grid (2 Columns: Tasks / Meetings & Notifications) -->
      <div class="student-dashboard-grid">
        
        <!-- Left Column: Tasks -->
        <div style="display: flex; flex-direction: column; gap: 24px;">

          <!-- SECTION 1: My Assigned Tasks & Deliverables -->
          <div class="student-card" id="card-assigned-tasks">
            <div class="student-card-header">
              <div class="student-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #2563eb;">
                  <path d="M9 11l3 3L22 4"></path>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <span>My Assigned Tasks & Deliverables</span>
                <span class="student-badge student-badge-info" style="font-size: 0.75rem; margin-left: 6px;">
                  ${tasks.length} Assigned
                </span>
                <span class="student-badge" style="background: #f1f5f9; color: #475569; font-size: 0.72rem; margin-left: 4px; font-weight: 600;">
                  Latest 3
                </span>
              </div>
            </div>

            <!-- Tasks Table -->
            <div class="student-table-container">
              <table class="student-table">
                <thead>
                  <tr>
                    <th style="width: 48%;">Task & Scope</th>
                    <th style="width: 30%;">Assigned By</th>
                    <th style="width: 22%;">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${taskRows || `
                    <tr>
                      <td colspan="3" style="text-align: center; padding: 36px 20px; color: #64748b;">
                        <div style="font-size: 1.75rem; margin-bottom: 6px;">📋</div>
                        <div style="font-weight: 700; color: #334155; margin-bottom: 4px;">No tasks assigned</div>
    
                      </td>
                    </tr>
                  `}
                </tbody>
              </table>

              ${tasks.length > 0 ? `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 0.8rem; color: #64748b;">
                  <span>
                    Showing <strong>${displayedTasks.length}</strong> of <strong>${tasks.length}</strong> tasks (Latest 3)
                  </span>
                  <button type="button" class="student-btn student-btn-outline student-btn-sm btn-view-all-tasks" style="font-size: 0.75rem; padding: 4px 12px; font-weight: 600;">
                    View Projects & All Tasks (${tasks.length}) →
                  </button>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- End of Tasks Column -->
        </div>

        <!-- Right Column: Upcoming Meetings & Live Notifications -->
        <div style="display: flex; flex-direction: column; gap: 24px;">

          <!-- SECTION 3: Upcoming Meetings & Sessions -->
          <div class="student-card">
            <div class="student-card-header">
              <div class="student-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #d97706;">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>Upcoming Meetings</span>
                <span class="student-badge" style="background: #fffbeb; color: #b45309; font-size: 0.72rem; margin-left: 6px; font-weight: 600;">
                  Latest ${displayedMeetings.length}
                </span>
              </div>

              <button type="button" class="student-btn student-btn-outline student-btn-sm btn-nav-meetings" style="font-size: 0.75rem; padding: 4px 10px;">
                Calendar (${meetings.length}) →
              </button>
            </div>

            <div class="student-dash-meetings-list">
              ${meetingItems || `
                <div style="text-align: center; padding: 28px 16px; color: #64748b;">
                  <div style="font-size: 1.5rem; margin-bottom: 6px;">📅</div>
                  <div style="font-size: 0.85rem; font-weight: 600; color: #334155;">No meetings scheduled</div>
                </div>
              `}
            </div>
          </div>

          <!-- SECTION 4: Recent Assignment Activity & Notifications -->
          <div class="student-card">
            <div class="student-card-header">
              <div class="student-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #059669;">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <span>Recent Activity & Alerts</span>
                <span class="student-badge" style="background: #ecfdf5; color: #047857; font-size: 0.72rem; margin-left: 6px; font-weight: 600;">
                  Latest ${displayedNotifications.length}
                </span>
              </div>
            </div>

            <div class="student-notif-list">
              ${notifItems || `
                <div class="student-notif-empty">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: #94a3b8;">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  <div>No recent notifications found.</div>
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
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 8px; text-align: left;">
            <div>
              <div style="font-weight: 700; color: #0f172a; font-size: 0.88rem;">${b.title}</div>
              <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">
                <span>Project: <strong>${b.project}</strong></span>
              </div>
            </div>
            <span class="student-badge ${b.isRework ? 'student-badge-danger' : 'student-badge-warning'}" style="font-size: 0.72rem; padding: 3px 8px; font-weight: 700;">
              ${b.status}
            </span>
          </div>
        `).join('');

        StudentSwal.fire({
          title: `<span style="display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 1.15rem; font-weight: 800; color: #0f172a;">
            <span style="color: #dc2626;">🔧</span> Bug Fixes & Rework (${bugFixList.length})
          </span>`,
          html: `
            <div style="font-size: 0.82rem; color: #64748b; margin-bottom: 14px; text-align: center;">
              The following rework or bug fix tickets have been requested by Faculty or Coordinator:
            </div>
            <div style="max-height: 280px; overflow-y: auto; padding-right: 4px;">
              ${listHtml}
            </div>
          `,
          confirmButtonText: 'Go to Projects Workspace →',
          confirmButtonColor: '#059669',
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
          confirmButtonColor: '#059669'
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
    container.querySelectorAll('.view-projects-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        router.push('/student/projects');
      });
    });

    container.querySelector('.btn-nav-projects')?.addEventListener('click', () => {
      router.push('/student/projects');
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
