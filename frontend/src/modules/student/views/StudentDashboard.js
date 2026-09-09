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

    // Filter Tasks
    const filteredTasks = tasks.filter(t => {
      if (taskFilter === 'pending') return t.rawStatus !== 'completed';
      if (taskFilter === 'completed') return t.rawStatus === 'completed';
      return true;
    });

    // Display only the latest 3 tasks in the dashboard
    const displayedTasks = filteredTasks.slice(0, 3);

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
          <td>
            <select class="student-task-status-select ${t.rawStatus}" data-task-id="${t.id}" data-task-type="${t.type || 'task'}">
              <option value="todo" ${t.rawStatus === 'todo' ? 'selected' : ''}>⏳ Todo</option>
              <option value="in_progress" ${t.rawStatus === 'in_progress' ? 'selected' : ''}>🔄 In Progress</option>
              <option value="completed" ${t.rawStatus === 'completed' ? 'selected' : ''}>✓ Completed</option>
              <option value="blocked" ${t.rawStatus === 'blocked' ? 'selected' : ''}>⛔ Blocked</option>
            </select>
          </td>
        </tr>
      `;
    }).join('');

    // 2. Build Project Cards
    const projectCardsHtml = projects.map(p => {
      const teamList = p.membersList || p.team || [];
      const teamChipsHtml = teamList.map(m => {
        const isMe = m.isCurrentUser || (m.name && m.name.toLowerCase() === (currentUser?.name?.toLowerCase() || ''));
        const initial = (m.name || 'U').charAt(0).toUpperCase();
        let avatarClass = '';
        if (m.isTeamLead) {
          avatarClass = 'is-lead';
        } else if (m.role?.toLowerCase()?.includes('designer')) {
          avatarClass = 'is-designer';
        }

        return `
          <div class="team-member-mini-card ${isMe ? 'is-me' : ''}" title="${m.name} - ${m.roleDisplay || m.role || 'Member'}">
            <div class="member-mini-avatar ${avatarClass}">
              ${initial}
            </div>
            <div class="member-mini-info">
              <div class="member-mini-name-row">
                <span class="member-mini-name">${m.name}</span>
                ${isMe ? `<span class="member-tag-you">You</span>` : ''}
                ${m.isTeamLead ? `<span class="member-tag-lead">Lead</span>` : ''}
              </div>
              <span class="member-mini-role ${m.isTeamLead ? 'role-lead' : ''}">
                ${m.roleDisplay || m.role || 'Member'}
              </span>
            </div>
          </div>
        `;
      }).join('');

      // Modules & Tasks for this project
      const modulesList = p.modulesList || p.modules || [];
      const totalTasks = p.totalTasksCount ?? modulesList.reduce((acc, m) => acc + (m.tasks ? m.tasks.length : 0), 0);
      const completedTasks = p.completedTasksCount ?? modulesList.reduce((acc, m) => acc + (m.tasks ? m.tasks.filter(t => t.status === 'Completed').length : 0), 0);

      const modulesHtml = modulesList.length > 0 ? modulesList.map(mod => {
        const mStatus = mod.status || 'Todo';
        const mStatusClass = mStatus === 'Completed' ? 'student-badge-success' : (mStatus === 'In Progress' ? 'student-badge-warning' : 'student-badge-neutral');
        const modTasks = mod.tasks || [];
        const modDone = modTasks.filter(t => t.status === 'Completed').length;

        const tasksHtml = modTasks.length > 0 ? modTasks.map(t => {
          const isMyTask = t.isMyTask || (t.assignee && t.assignee.toLowerCase() === (currentUser?.name?.toLowerCase() || ''));
          const tStatusClass = t.status === 'Completed' ? 'status-completed' : (t.status === 'In Progress' ? 'status-progress' : 'status-todo');
          return `
            <div class="project-card-task-row ${isMyTask ? 'is-my-task' : ''}">
              <div class="task-row-left">
                <span class="task-status-bullet ${tStatusClass}"></span>
                <span class="task-row-title" title="${t.title}">${t.title}</span>
              </div>
              <div class="task-row-right">
                <span class="task-row-assignee">
                  ${t.assignee}
                  ${isMyTask ? `<span class="member-tag-you" style="margin-left: 4px; font-size: 0.58rem; padding: 0 4px;">You</span>` : ''}
                </span>
                <span class="task-row-status-pill ${tStatusClass}">${t.status}</span>
              </div>
            </div>
          `;
        }).join('') : `<div class="project-module-tasks-empty">No individual tasks defined in this module</div>`;

        return `
          <div class="project-module-card">
            <div class="project-module-card-header">
              <div class="project-module-name-box">
                <span class="module-folder-icon">📦</span>
                <span class="project-module-name" title="${mod.name}">${mod.name}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span class="student-badge ${mStatusClass}" style="font-size: 0.65rem; padding: 2px 7px;">${mStatus}</span>
                <span class="module-tasks-counter-pill">${modDone}/${modTasks.length} Tasks</span>
              </div>
            </div>
            <div class="project-module-tasks-container">
              ${tasksHtml}
            </div>
          </div>
        `;
      }).join('') : `<div style="font-size: 0.75rem; color: #94a3b8; font-style: italic; padding: 4px 0;">No modules assigned yet</div>`;

      return `
        <div class="student-dash-project-card">
          <div class="student-dash-project-header">
            <div class="student-dash-project-title-box">
              <div class="student-dash-project-title">${p.title}</div>
              <div class="student-dash-project-meta-row">
                <span class="student-dash-project-meta-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  Supervisor: <strong style="color: #334155;">${p.faculty || 'Faculty Member'}</strong>
                </span>
                <span class="student-dash-project-meta-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  Timeline: ${p.timeline && p.timeline !== 'Not specified' ? p.timeline : 'Active'}
                </span>
              </div>
            </div>
            <span class="student-badge ${p.status === 'Completed' ? 'student-badge-success' : 'student-badge-warning'}" style="font-size: 0.75rem;">
              ${p.status}
            </span>
          </div>

          <!-- Development Team Section -->
          <div class="project-team-section" style="margin-top: 2px; padding-top: 10px;">
            <div class="project-team-header">
              <span class="project-team-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #059669;">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                Development Team
              </span>
              <span class="project-team-count">${teamList.length} Member${teamList.length === 1 ? '' : 's'}</span>
            </div>

            <div class="project-team-cards-grid">
              ${teamChipsHtml || '<div style="font-size: 0.75rem; color: #94a3b8; font-style: italic;">No team members assigned yet</div>'}
            </div>
          </div>

          <!-- Project Modules & Tasks Section -->
          <div class="project-modules-section" style="margin-top: 4px; padding-top: 10px;">
            <div class="project-modules-header">
              <span class="project-modules-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #0284c7;">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                  <polyline points="2 17 12 22 22 17"></polyline>
                  <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
                Modules & Tasks
              </span>
              <span class="project-modules-count">${modulesList.length} Modules • ${totalTasks} Tasks</span>
            </div>

            <div class="project-modules-list" style="max-height: 220px;">
              ${modulesHtml}
            </div>
          </div>

          <div class="student-dash-project-footer">
            <div style="display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: #64748b;">
              <span>Progress: <strong>${p.progress ?? 0}%</strong> (${completedTasks}/${totalTasks} Tasks)</span>
              <div class="student-progress-bar-bg" style="width: 100px; height: 6px;">
                <div class="student-progress-bar-fill" style="width: ${p.progress ?? 0}%; height: 6px;"></div>
              </div>
            </div>

            <button type="button" class="student-btn student-btn-outline student-btn-sm view-projects-btn" data-id="${p.id}" style="font-size: 0.75rem; padding: 4px 12px;">
              Open Workspace →
            </button>
          </div>
        </div>
      `;
    }).join('');

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

      <!-- KPI Strip (4 responsive cards) -->
      <div class="student-kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">
        <!-- 1. Active Projects -->
        <div class="student-kpi-card" id="kpi-projects" style="cursor: pointer;" title="Click to view projects">
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

        <!-- 2. Assigned Tasks -->
        <div class="student-kpi-card" id="kpi-tasks" style="cursor: pointer;" title="Click to view assigned tasks">
          <div class="student-kpi-icon" style="background: #eff6ff; color: #2563eb;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l3 3L22 4"></path>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
          </div>
          <div class="student-kpi-info">
            <span class="student-kpi-value" style="color: #2563eb;">${pendingTasksCount}</span>
            <span class="student-kpi-label">Pending Tasks (${tasks.length} total)</span>
          </div>
          <div class="student-kpi-arrow">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
        </div>

        <!-- 3. Assigned Modules -->
        <div class="student-kpi-card" id="kpi-modules" style="cursor: pointer;" title="Click to view sprints & modules">
          <div class="student-kpi-icon" style="background: #fdf4ff; color: #9333ea;">
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

        <!-- 4. Upcoming Meetings -->
        <div class="student-kpi-card" id="kpi-meetings" style="cursor: pointer;" title="Click to view scheduled meetings">
          <div class="student-kpi-icon" style="background: #fffbeb; color: #d97706;">
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

      <!-- Dashboard Main Grid (2 Columns: Tasks & Projects / Meetings & Notifications) -->
      <div class="student-dashboard-grid" style="grid-template-columns: 1.8fr 1.2fr; gap: 24px; align-items: start;">
        
        <!-- Left Column: Tasks & Projects -->
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
                  ${pendingTasksCount} Pending
                </span>
                <span class="student-badge" style="background: #f1f5f9; color: #475569; font-size: 0.72rem; margin-left: 4px; font-weight: 600;">
                  Latest 3
                </span>
              </div>

              <!-- Task Filter Pills -->
              <div class="student-filter-pills" style="margin-bottom: 0;">
                <button type="button" class="student-filter-pill ${taskFilter === 'all' ? 'active' : ''}" data-filter="all" style="font-size: 0.75rem; padding: 4px 10px;">
                  All (${tasks.length})
                </button>
                <button type="button" class="student-filter-pill ${taskFilter === 'pending' ? 'active' : ''}" data-filter="pending" style="font-size: 0.75rem; padding: 4px 10px;">
                  Pending (${pendingTasksCount})
                </button>
                <button type="button" class="student-filter-pill ${taskFilter === 'completed' ? 'active' : ''}" data-filter="completed" style="font-size: 0.75rem; padding: 4px 10px;">
                  Done (${completedTasksCount})
                </button>
              </div>
            </div>

            <!-- Tasks Table -->
            <div class="student-table-container">
              <table class="student-table">
                <thead>
                  <tr>
                    <th style="width: 40%;">Task & Scope</th>
                    <th style="width: 25%;">Assigned By</th>
                    <th style="width: 17%;">Due Date</th>
                    <th style="width: 18%;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${taskRows || `
                    <tr>
                      <td colspan="4" style="text-align: center; padding: 36px 20px; color: #64748b;">
                        <div style="font-size: 1.75rem; margin-bottom: 6px;">📋</div>
                        <div style="font-weight: 700; color: #334155; margin-bottom: 4px;">No tasks assigned</div>
    
                      </td>
                    </tr>
                  `}
                </tbody>
              </table>

              ${filteredTasks.length > 0 ? `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 0.8rem; color: #64748b;">
                  <span>
                    Showing <strong>${displayedTasks.length}</strong> of <strong>${filteredTasks.length}</strong> ${taskFilter !== 'all' ? taskFilter : ''} tasks (Latest 3)
                  </span>
                  <button type="button" class="student-btn student-btn-outline student-btn-sm btn-view-all-tasks" style="font-size: 0.75rem; padding: 4px 12px; font-weight: 600;">
                    View Projects & All Tasks (${tasks.length}) →
                  </button>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- SECTION 2: My Projects & Faculty Supervisors -->

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

    container.querySelector('#kpi-tasks')?.addEventListener('click', () => {
      taskFilter = 'pending';
      render();
      container.querySelector('#card-assigned-tasks')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
