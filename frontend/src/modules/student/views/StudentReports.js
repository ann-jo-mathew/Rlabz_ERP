import { renderStudentSidebar } from './StudentSidebar.js';
import { getProjects, getReports, saveReport, getProjectTasks, ensureDataLoaded } from './studentStore.js';
import { StudentSwal, showStudentSuccess, showStudentError, showStudentWarning } from '../studentAlerts.js';
import { STORAGE_BASE } from '@/core/config/api.js';
import '../student.css';

export async function StudentReports(route, router) {
  await ensureDataLoaded();
  renderStudentSidebar();

  const container = document.createElement('div');
  container.className = 'student-portal-container animate-fade-in student-reports-view';

  // Active tab: 'weekly' (default, primary view) or 'daily' (submit & daily history)
  let activeTab = 'weekly';

  // Set to track expanded week report IDs (initially empty so all weeks are collapsed/short)
  let expandedWeekIds = new Set();

  // Daily Report Form State
  let formProjectId = '';
  let formTaskId = '';
  let formDate = new Date().toISOString().split('T')[0];
  let formWorkDone = '';
  let availableTasks = [];
  let loadingTasks = false;
  let formSubmitting = false;
  let feedbackMessage = null;

  // Filter States
  let weeklySearch = '';
  let weeklyProjectFilter = 'all';
  let weeklyStatusFilter = 'all';

  let dailySearch = '';
  let dailyProjectFilter = 'all';
  let dailyStatusFilter = 'all';

  // Helper to parse human-readable weekly summary into structured task cards
  function parseWeeklyWorkDone(workDoneText) {
    if (!workDoneText) return [];
    const lines = workDoneText.split('\n');
    const tasks = [];
    let currentTask = null;

    for (let rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.toLowerCase().startsWith('tasks worked on:')) continue;

      if (line.match(/^T-\d+\s*[—\-]/i) || (!line.startsWith('Status:') && !line.startsWith('•') && line.includes('—'))) {
        if (currentTask) tasks.push(currentTask);
        const parts = line.split(/[—\-]/);
        const code = parts[0].trim();
        const title = parts.slice(1).join('—').trim();
        currentTask = {
          code,
          title: title || code,
          status: 'In Progress',
          entries: []
        };
      } else if (line.startsWith('Status:') && currentTask) {
        currentTask.status = line.replace('Status:', '').trim();
      } else if (line.startsWith('•') && currentTask) {
        currentTask.entries.push(line.substring(1).trim());
      } else if (currentTask) {
        currentTask.entries.push(line);
      }
    }
    if (currentTask) tasks.push(currentTask);
    return tasks;
  }

  async function handleProjectSelection(projectId) {
    formProjectId = projectId;
    formTaskId = '';
    availableTasks = [];
    if (!projectId) {
      render();
      return;
    }

    loadingTasks = true;
    render();

    try {
      availableTasks = await getProjectTasks(projectId);
    } catch (err) {
      console.error('Error fetching project tasks:', err);
      availableTasks = [];
    } finally {
      loadingTasks = false;
      render();
    }
  }

  function render() {
    const projects = getProjects() || [];
    const allReports = getReports() || [];

    // Filter out invalid/unlinked reports
    const validReports = allReports
      .filter(r => r.projectId && String(r.projectId) !== '0' && (r.projectTitle || '').toLowerCase() !== 'general')
      .map(r => {
        if (!r.projectTitle) {
          const matched = projects.find(p => String(p.id) === String(r.projectId));
          if (matched) r.projectTitle = matched.title;
        }
        return r;
      });
    const weeklyReports = validReports.filter(r => (r.type || '').toLowerCase() === 'weekly');
    const dailyReports = validReports.filter(r => (r.type || '').toLowerCase() === 'daily');

    // KPI Metrics
    const totalWeeklyCount = weeklyReports.length;
    const totalDailyCount = dailyReports.length;
    const approvedCount = validReports.filter(r => (r.status || '').toLowerCase() === 'approved').length;
    const feedbackCount = validReports.filter(r => Boolean(r.feedback && r.feedback.trim())).length;

    // Filter Options
    const projectOptionsHtml = projects.map(p => `
      <option value="${p.id}" ${String(formProjectId) === String(p.id) ? 'selected' : ''}>${p.title}</option>
    `).join('');

    const weeklyProjectFilterOptions = projects.map(p => `
      <option value="${p.id}" ${weeklyProjectFilter === String(p.id) ? 'selected' : ''}>${p.title}</option>
    `).join('');

    const dailyProjectFilterOptions = projects.map(p => `
      <option value="${p.id}" ${dailyProjectFilter === String(p.id) ? 'selected' : ''}>${p.title}</option>
    `).join('');

    // Filtered Weekly Reports
    const filteredWeekly = weeklyReports.filter(r => {
      if (weeklyStatusFilter !== 'all' && (r.status || 'pending').toLowerCase() !== weeklyStatusFilter.toLowerCase()) return false;
      if (weeklyProjectFilter !== 'all' && String(r.projectId || '') !== String(weeklyProjectFilter)) return false;
      if (weeklySearch.trim()) {
        const q = weeklySearch.toLowerCase().trim();
        const matchDone = (r.workDone || '').toLowerCase().includes(q);
        const matchProj = (r.projectTitle || '').toLowerCase().includes(q);
        const matchDate = (r.weekLabel || r.date || '').toLowerCase().includes(q);
        const matchFeed = (r.feedback || '').toLowerCase().includes(q);
        if (!matchDone && !matchProj && !matchDate && !matchFeed) return false;
      }
      return true;
    });

    // Group Weekly Reports by Project
    const projectGroupsMap = {};
    for (let r of filteredWeekly) {
      if (!r.projectId || (r.projectTitle || '').toLowerCase() === 'general') continue;
      const pId = r.projectId;
      const pTitle = r.projectTitle || 'Project';
      if (!projectGroupsMap[pId]) {
        projectGroupsMap[pId] = {
          projectId: pId,
          projectTitle: pTitle,
          reports: []
        };
      }
      projectGroupsMap[pId].reports.push(r);
    }
    const projectGroups = Object.values(projectGroupsMap);

    // Filtered Daily Reports
    const filteredDaily = dailyReports.filter(r => {
      if (dailyStatusFilter !== 'all' && (r.status || 'pending').toLowerCase() !== dailyStatusFilter.toLowerCase()) return false;
      if (dailyProjectFilter !== 'all' && String(r.projectId || '') !== String(dailyProjectFilter)) return false;
      if (dailySearch.trim()) {
        const q = dailySearch.toLowerCase().trim();
        const matchDone = (r.workDone || '').toLowerCase().includes(q);
        const matchProj = (r.projectTitle || '').toLowerCase().includes(q);
        const matchDate = (r.date || '').toLowerCase().includes(q);
        const matchTask = (r.taskTitle || r.taskCode || '').toLowerCase().includes(q);
        if (!matchDone && !matchProj && !matchDate && !matchTask) return false;
      }
      return true;
    });

    // Build Project-wise & Week-wise Accordion HTML
    const token = localStorage.getItem('token');
    const weeklyAccordionHtml = projectGroups.map(pg => {
      const totalWeeks = pg.reports.length;
      return `
        <div class="student-rep-project-group">
          <!-- Project Group Header -->
          <div class="student-rep-project-header">
            <div class="student-rep-project-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
              <span>${pg.projectTitle}</span>
            </div>
            <span class="student-badge student-badge-info" style="font-size: 0.78rem; font-weight: 800;">
              ${totalWeeks} ${totalWeeks === 1 ? 'Week Compiled' : 'Weeks Compiled'}
            </span>
          </div>

          <!-- Week-wise Accordion List -->
          <div class="student-rep-weeks-list">
            ${pg.reports.map(r => {
              const isOpen = expandedWeekIds.has(r.id);
              const weekDisplay = r.weekLabel || `Week of ${r.date}`;
              const parsedTasks = parseWeeklyWorkDone(r.workDone);
              const status = (r.status || 'Pending').toLowerCase();
              const statusClass = status === 'approved' ? 'student-badge-success' : status === 'rejected' ? 'student-badge-danger' : 'student-badge-warning';
              const hasAttachment = Boolean(r.reportFile);
              const downloadLink = r.downloadUrl || (r.reportFile ? `${STORAGE_BASE}/${r.reportFile}` : null);
              const authDownloadUrl = downloadLink ? (downloadLink.includes('?') ? `${downloadLink}&token=${token}` : `${downloadLink}?token=${token}`) : '#';

              return `
                <div class="student-rep-week-item">
                  <!-- Week Header Row (Click to Toggle) -->
                  <div class="student-rep-week-header ${isOpen ? 'is-open' : ''}" data-toggle-id="${r.id}" title="${isOpen ? 'Click to collapse' : 'Click to inspect tasks and supervisor feedback'}">
                    <div class="student-rep-week-left">
                      <div class="student-rep-chevron">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                      </div>

                      <div class="student-rep-week-label">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        <span>${weekDisplay}</span>
                      </div>
                    </div>

                    <div class="student-rep-week-right">
                      <span class="student-badge student-badge-info" style="font-size: 0.72rem; font-weight: 700;">
                        ${parsedTasks.length} ${parsedTasks.length === 1 ? 'Task' : 'Tasks'}
                      </span>
                      <span class="student-badge ${statusClass}" style="font-size: 0.74rem;">${r.status || 'Pending'}</span>
                      ${hasAttachment ? `
                        <a href="${authDownloadUrl}" target="_blank" download="${r.fileName || 'Weekly_Report'}" class="student-btn student-btn-outline student-btn-sm" style="font-size: 0.72rem; padding: 3px 8px; text-decoration: none;" onclick="event.stopPropagation();">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                          <span>Doc</span>
                        </a>
                      ` : ''}
                    </div>
                  </div>

                  <!-- Collapsible Full Details Body -->
                  <div class="student-rep-week-body ${isOpen ? '' : 'is-collapsed'}">
                    <div style="font-size: 0.8rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em;">
                      Tasks Worked On
                    </div>

                    ${parsedTasks.length > 0 ? parsedTasks.map(t => {
                      const taskStatusLower = (t.status || '').toLowerCase();
                      const taskStatusClass = taskStatusLower === 'completed' ? 'student-badge-success' : taskStatusLower === 'todo' ? 'student-badge-info' : 'student-badge-warning';

                      return `
                        <div class="student-rep-task-box">
                          <div class="student-rep-task-top">
                            <span class="student-rep-task-code">${t.code}</span>
                            <span class="student-rep-task-title">${t.title}</span>
                            <span class="student-badge ${taskStatusClass}" style="font-size: 0.7rem;">${t.status}</span>
                          </div>
                          <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
                            ${t.entries.map(entry => {
                              const dateMatch = entry.match(/^\[(.*?)\]\s*(.*)$/);
                              if (dateMatch) {
                                return `
                                  <div class="student-rep-task-entry">
                                    <span style="color: #059669; font-weight: 800;">✓</span>
                                    <span style="font-size: 0.72rem; font-weight: 700; background: #e0f2fe; color: #0284c7; padding: 1px 6px; border-radius: 4px;">${dateMatch[1]}</span>
                                    <span>${dateMatch[2]}</span>
                                  </div>
                                `;
                              }
                              return `
                                <div class="student-rep-task-entry">
                                  <span style="color: #059669; font-weight: 800;">✓</span>
                                  <span>${entry}</span>
                                </div>
                              `;
                            }).join('')}
                          </div>
                        </div>
                      `;
                    }).join('') : `
                      <div style="font-size: 0.85rem; color: var(--text-primary); line-height: 1.5; white-space: pre-wrap; background: var(--bg-canvas-light); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 12px 14px;">
                        ${r.workDone}
                      </div>
                    `}

                    ${r.feedback ? `
                      <div class="student-rep-feedback-callout">
                        <div class="student-rep-feedback-head">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                          <span>Supervisor Feedback</span>
                        </div>
                        <div class="student-rep-feedback-text">${r.feedback}</div>
                      </div>
                    ` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');

    // Build Daily Table Rows
    const dailyRowsHtml = filteredDaily.map(r => {
      const status = (r.status || 'Pending').toLowerCase();
      const statusClass = status === 'approved' ? 'student-badge-success' : status === 'rejected' ? 'student-badge-danger' : 'student-badge-warning';

      return `
        <tr>
          <td>
            <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-primary);">${r.date}</div>
            <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 2px;">${r.projectTitle || ''}</div>
          </td>
          <td>
            ${r.taskCode ? `
              <span class="student-rep-task-code">${r.taskCode}</span>
              <div style="font-weight: 600; font-size: 0.82rem; color: var(--text-primary); margin-top: 3px;">${r.taskTitle || 'Assigned Task'}</div>
            ` : `
              <span style="color: var(--text-secondary); font-size: 0.8rem;">${r.taskId ? 'Task #' + r.taskId : 'Task'}</span>
            `}
            ${(r.branchName || r.githubPrUrl) ? `
              <div style="margin-top: 5px; display: flex; flex-wrap: wrap; gap: 4px; align-items: center;">
                ${r.branchName ? (r.branchUrl ? `
                  <a href="${r.branchUrl}" target="_blank" rel="noopener noreferrer" class="student-badge student-badge-info" style="font-size: 0.7rem; text-decoration: none; display: inline-flex; align-items: center; gap: 3px;" title="Open GitHub branch">
                    <span>🌿</span> <span>${r.branchName}</span>
                  </a>
                ` : `
                  <span class="student-badge student-badge-info" style="font-size: 0.7rem; display: inline-flex; align-items: center; gap: 3px;">
                    <span>🌿</span> <span>${r.branchName}</span>
                  </span>
                `) : ''}
                ${r.githubPrUrl ? `
                  <a href="${r.githubPrUrl}" target="_blank" rel="noopener noreferrer" class="student-badge student-badge-success" style="font-size: 0.7rem; text-decoration: none; display: inline-flex; align-items: center; gap: 3px;" title="View Pull Request">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    <span>PR</span>
                  </a>
                ` : ''}
              </div>
            ` : ''}
          </td>
          <td>
            <div style="font-size: 0.85rem; color: var(--text-primary); line-height: 1.5; white-space: pre-wrap;">${r.workDone}</div>
            ${r.feedback ? `
              <div class="student-rep-feedback-callout" style="margin-top: 8px;">
                <div class="student-rep-feedback-head">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  <span>Supervisor Feedback</span>
                </div>
                <div class="student-rep-feedback-text">${r.feedback}</div>
              </div>
            ` : ''}
          </td>
          <td style="text-align: center;">
            <span class="student-badge ${statusClass}" style="font-size: 0.72rem;">${r.status || 'Pending'}</span>
          </td>
        </tr>
      `;
    }).join('');

    // Render Container HTML
    container.innerHTML = `
      <!-- Header Banner -->
      <div class="student-rep-header-wrapper">
        <div class="student-rep-header-left">
          <div class="student-rep-brand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div>
            <h1 class="student-rep-title">Progress Reports</h1>
            <p class="student-rep-subtitle">Submit daily reports for assigned project tasks and inspect auto-compiled Weekly Progress Reports.</p>
          </div>
        </div>
      </div>

      <!-- KPI Metric Cards Grid -->
      <div class="student-rep-kpi-grid">
        <div class="student-rep-kpi-card kpi-blue">
          <div class="student-rep-kpi-icon blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
          </div>
          <div class="student-rep-kpi-info">
            <div class="student-rep-kpi-val">${totalWeeklyCount}</div>
            <div class="student-rep-kpi-lbl">Weekly Sprints</div>
          </div>
        </div>

        <div class="student-rep-kpi-card kpi-indigo">
          <div class="student-rep-kpi-icon indigo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </div>
          <div class="student-rep-kpi-info">
            <div class="student-rep-kpi-val">${totalDailyCount}</div>
            <div class="student-rep-kpi-lbl">Daily Submissions</div>
          </div>
        </div>

        <div class="student-rep-kpi-card kpi-emerald">
          <div class="student-rep-kpi-icon emerald">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div class="student-rep-kpi-info">
            <div class="student-rep-kpi-val">${approvedCount}</div>
            <div class="student-rep-kpi-lbl">Approved Reports</div>
          </div>
        </div>

        <div class="student-rep-kpi-card kpi-amber">
          <div class="student-rep-kpi-icon amber">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          </div>
          <div class="student-rep-kpi-info">
            <div class="student-rep-kpi-val">${feedbackCount}</div>
            <div class="student-rep-kpi-lbl">Feedback Notes</div>
          </div>
        </div>
      </div>

      ${feedbackMessage ? `
        <div class="student-toast-alert ${feedbackMessage.type}">
          <span>${feedbackMessage.text}</span>
          <button type="button" id="btn-close-toast" class="student-toast-close">&times;</button>
        </div>
      ` : ''}

      <!-- Pill Tab Switcher -->
      <div class="student-rep-tabs-bar">
        <button type="button" class="student-rep-tab-btn ${activeTab === 'weekly' ? 'active' : ''}" id="tab-weekly">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
          <span>Weekly Progress</span>
          <span class="student-rep-tab-badge">Auto</span>
        </button>
        <button type="button" class="student-rep-tab-btn ${activeTab === 'daily' ? 'active' : ''}" id="tab-daily">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          <span>Submit Daily Report</span>
        </button>
      </div>

      <!-- Tab Content Outlet -->
      <div id="tab-content-outlet">

        <!-- ================= TAB 1: WEEKLY PROGRESS ================= -->
        ${activeTab === 'weekly' ? `
          <div style="display: flex; flex-direction: column; gap: 20px;">
            <!-- Weekly Filter Bar -->
            <div class="student-card" style="padding: 12px 18px;">
              <div class="student-filter-bar" style="margin-bottom: 0;">
                <div class="student-search-wrapper" style="flex: 1.5;">
                  <svg class="student-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <input type="text" id="weekly-search-input" class="student-search-input" placeholder="Search tasks, work done, or supervisor feedback..." value="${weeklySearch}">
                </div>

                <select id="weekly-proj-filter" class="student-filter-select">
                  <option value="all" ${weeklyProjectFilter === 'all' ? 'selected' : ''}>All Projects</option>
                  ${weeklyProjectFilterOptions}
                </select>

                <select id="weekly-status-filter" class="student-filter-select">
                  <option value="all" ${weeklyStatusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
                  <option value="pending" ${weeklyStatusFilter === 'pending' ? 'selected' : ''}>Pending</option>
                  <option value="approved" ${weeklyStatusFilter === 'approved' ? 'selected' : ''}>Approved</option>
                  <option value="rejected" ${weeklyStatusFilter === 'rejected' ? 'selected' : ''}>Rejected</option>
                </select>

                <button type="button" id="btn-goto-daily" class="student-btn student-btn-primary student-btn-sm" style="margin-left: auto; gap: 6px;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  <span>Log Daily Report</span>
                </button>
              </div>
            </div>

            <!-- Project-wise Accordion Container -->
            ${projectGroups.length > 0 ? `
              <div>
                ${weeklyAccordionHtml}
              </div>
            ` : `
              <div class="student-card">
                <div class="student-empty-filter" style="padding: 48px 24px;">
                  <div class="student-empty-filter-icon">📅</div>
                  <div class="student-empty-filter-text">No Weekly Progress Reports Found</div>
                  <div class="student-empty-filter-sub" style="max-width: 480px; margin: 8px auto 20px;">
                    Weekly progress reports are automatically compiled whenever you submit a Daily Report for your assigned project tasks.
                  </div>
                  <button type="button" id="btn-empty-goto-daily" class="student-btn student-btn-primary" style="margin: 0 auto;">
                    Submit Daily Report
                  </button>
                </div>
              </div>
            `}
          </div>
        ` : ''}

        <!-- ================= TAB 2: DAILY REPORTS ================= -->
        ${activeTab === 'daily' ? `
          <div class="student-rep-split-layout">
            <!-- Submit Daily Report Form Card -->
            <div class="student-rep-form-card">
              <h3 class="student-rep-form-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                Submit Daily Report
              </h3>
              <form id="daily-report-form">
                <!-- 1. Select Project -->
                <div class="student-wl-form-group">
                  <label for="daily-rep-project">Project <span style="color:#dc2626;">*</span></label>
                  <select id="daily-rep-project" class="student-wl-select" required>
                    <option value="">-- Select Project --</option>
                    ${projectOptionsHtml}
                  </select>
                </div>

                <!-- 2. Select Assigned Task -->
                <div class="student-wl-form-group">
                  <label for="daily-rep-task">
                    <span>Assigned Task</span> <span style="color:#dc2626;">*</span>
                  </label>
                  <select id="daily-rep-task" class="student-wl-select" ${!formProjectId || loadingTasks ? 'disabled' : ''} required>
                    ${loadingTasks ? `
                      <option value="">Loading your assigned tasks...</option>
                    ` : !formProjectId ? `
                      <option value="">-- Select a project first --</option>
                    ` : availableTasks.length === 0 ? `
                      <option value="">-- No active tasks assigned to you --</option>
                    ` : `
                      <option value="">-- Select Assigned Task --</option>
                      ${availableTasks.map(t => `
                        <option value="${t.id}" ${String(formTaskId) === String(t.id) ? 'selected' : ''}>
                          ${t.isRework ? '[Rework Required] ' : ''}${t.code} — ${t.title} (${t.status})
                        </option>
                      `).join('')}
                    `}
                  </select>

                  ${(() => {
                    const selTask = availableTasks.find(t => String(t.id) === String(formTaskId));
                    if (!selTask) return '';
                    return `
                      <div style="margin-top: 6px; padding: 8px 10px; background: var(--bg-canvas-light); border: 1px solid var(--border-subtle); border-radius: 8px; font-size: 0.78rem;">
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
                          <span style="color: var(--text-muted); font-weight: 600;">Linked Branch:</span>
                          ${selTask.branchName ? `
                            ${selTask.branchUrl ? `
                              <a href="${selTask.branchUrl}" target="_blank" rel="noopener noreferrer" class="student-badge student-badge-info" style="font-size: 0.72rem; text-decoration: none; display: inline-flex; align-items: center; gap: 3px;">
                                <span>🌿</span> <span>${selTask.branchName}</span>
                              </a>
                            ` : `
                              <span class="student-badge student-badge-info" style="font-size: 0.72rem; display: inline-flex; align-items: center; gap: 3px;">
                                <span>🌿</span> <span>${selTask.branchName}</span>
                              </span>
                            `}
                          ` : `
                            <span style="color: var(--text-muted); font-style: italic;">No branch linked</span>
                          `}
                        </div>
                        ${selTask.githubPrUrl ? `
                          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-top: 4px;">
                            <span style="color: var(--text-muted); font-weight: 600;">Linked PR:</span>
                            <a href="${selTask.githubPrUrl}" target="_blank" rel="noopener noreferrer" style="color: #0284c7; font-weight: 700; text-decoration: underline; font-size: 0.75rem;">View PR ↗</a>
                          </div>
                        ` : ''}
                      </div>
                    `;
                  })()}

                  ${formProjectId && !loadingTasks && availableTasks.length === 0 ? `
                    <div style="font-size: 0.74rem; color: #b45309; margin-top: 4px; display: flex; align-items: center; gap: 4px;">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                      <span>No active or rework tasks assigned to you for this project. Completed tasks are hidden.</span>
                    </div>
                  ` : ''}
                </div>

                <!-- 3. Report Date -->
                <div class="student-wl-form-group">
                  <label for="daily-rep-date">Report Date <span style="color:#dc2626;">*</span></label>
                  <input type="date" id="daily-rep-date" class="student-wl-input" value="${formDate}" required>
                </div>

                <!-- 4. Work Done Description -->
                <div class="student-wl-form-group">
                  <label for="daily-rep-done">Work Completed &amp; Summary <span style="color:#dc2626;">*</span></label>
                  <textarea id="daily-rep-done" class="student-wl-textarea" placeholder="Detail the work accomplished for this task today, technical notes, or roadblocks..." required>${formWorkDone}</textarea>
                </div>

                <button type="submit" id="btn-submit-daily" class="student-wl-btn-submit" ${formSubmitting || (formProjectId && availableTasks.length === 0) ? 'disabled' : ''}>
                  ${formSubmitting ? `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg>
                    <span>Submitting Daily Report...</span>
                  ` : `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span>Submit Daily Report</span>
                  `}
                </button>
              </form>
            </div>

            <!-- Daily Reports History Table Card -->
            <div class="student-rep-history-card">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <h3 class="student-rep-form-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                  Daily Reports Log
                </h3>
                <span class="student-badge student-badge-info" style="font-size:0.75rem; font-weight: 800;">
                  ${filteredDaily.length} of ${dailyReports.length} Submitted
                </span>
              </div>

              <!-- Filter Bar for Daily Reports -->
              <div class="student-wl-filter-bar">
                <div class="student-wl-search-wrap">
                  <svg class="student-wl-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <input type="text" id="daily-search-input" class="student-wl-search-input" placeholder="Search work done, task, or date..." value="${dailySearch}">
                </div>

                <select id="daily-proj-filter" class="student-wl-select-filter">
                  <option value="all" ${dailyProjectFilter === 'all' ? 'selected' : ''}>All Projects</option>
                  ${dailyProjectFilterOptions}
                </select>

                <select id="daily-status-filter" class="student-wl-select-filter">
                  <option value="all" ${dailyStatusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
                  <option value="pending" ${dailyStatusFilter === 'pending' ? 'selected' : ''}>Pending</option>
                  <option value="approved" ${dailyStatusFilter === 'approved' ? 'selected' : ''}>Approved</option>
                  <option value="rejected" ${dailyStatusFilter === 'rejected' ? 'selected' : ''}>Rejected</option>
                </select>
              </div>

              <!-- Daily Reports Table -->
              <div class="student-rep-table-wrap">
                <table class="student-rep-table">
                  <thead>
                    <tr>
                      <th style="width: 22%;">Date &amp; Project</th>
                      <th style="width: 26%;">Assigned Task</th>
                      <th style="width: 40%;">Daily Work Log</th>
                      <th style="width: 12%; text-align: center;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${dailyRowsHtml || `
                      <tr>
                        <td colspan="4" style="text-align: center; padding: 36px 20px;">
                          <div style="font-size: 1.75rem; margin-bottom: 6px;">📝</div>
                          <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">No daily reports found</div>
                          <div style="font-size: 0.78rem; color: var(--text-muted);">Fill out the form on the left to log today's task progress.</div>
                        </td>
                      </tr>
                    `}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    setupListeners();
  }

  function setupListeners() {
    container.querySelector('#btn-close-toast')?.addEventListener('click', () => {
      feedbackMessage = null;
      render();
    });

    container.querySelector('#tab-weekly')?.addEventListener('click', () => {
      activeTab = 'weekly';
      render();
    });

    container.querySelector('#tab-daily')?.addEventListener('click', () => {
      activeTab = 'daily';
      render();
    });

    container.querySelector('#btn-goto-daily')?.addEventListener('click', () => {
      activeTab = 'daily';
      render();
    });

    container.querySelector('#btn-empty-goto-daily')?.addEventListener('click', () => {
      activeTab = 'daily';
      render();
    });

    if (activeTab === 'weekly') {
      const weeklySearchInput = container.querySelector('#weekly-search-input');
      weeklySearchInput?.addEventListener('input', (e) => {
        weeklySearch = e.target.value;
        render();
        const input = container.querySelector('#weekly-search-input');
        if (input) {
          input.focus();
          input.setSelectionRange(input.value.length, input.value.length);
        }
      });

      container.querySelector('#weekly-proj-filter')?.addEventListener('change', (e) => {
        weeklyProjectFilter = e.target.value;
        render();
      });

      container.querySelector('#weekly-status-filter')?.addEventListener('change', (e) => {
        weeklyStatusFilter = e.target.value;
        render();
      });

      container.querySelectorAll('.student-rep-week-header').forEach(header => {
        header.addEventListener('click', () => {
          const reportId = parseInt(header.getAttribute('data-toggle-id'));
          if (expandedWeekIds.has(reportId)) {
            expandedWeekIds.delete(reportId);
          } else {
            expandedWeekIds.clear();
            expandedWeekIds.add(reportId);
          }
          render();
        });
      });
    }

    if (activeTab === 'daily') {
      const projectSelect = container.querySelector('#daily-rep-project');
      projectSelect?.addEventListener('change', (e) => {
        handleProjectSelection(e.target.value);
      });

      const taskSelect = container.querySelector('#daily-rep-task');
      taskSelect?.addEventListener('change', (e) => {
        formTaskId = e.target.value;
        render();
      });

      const dateInput = container.querySelector('#daily-rep-date');
      dateInput?.addEventListener('change', (e) => {
        formDate = e.target.value;
      });

      const workInput = container.querySelector('#daily-rep-done');
      workInput?.addEventListener('input', (e) => {
        formWorkDone = e.target.value;
      });

      const dailyForm = container.querySelector('#daily-report-form');
      dailyForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const projectId = formProjectId;
        const taskId = container.querySelector('#daily-rep-task')?.value || formTaskId;
        const date = container.querySelector('#daily-rep-date')?.value || formDate;
        const workDone = container.querySelector('#daily-rep-done')?.value?.trim() || '';

        if (!projectId) {
          StudentSwal.fire({
            icon: 'warning',
            title: 'Project Required',
            text: 'Please select a project for this daily report.',
            confirmButtonColor: '#0284c7'
          });
          return;
        }

        if (!taskId) {
          StudentSwal.fire({
            icon: 'warning',
            title: 'Task Required',
            text: 'Please select an assigned task you worked on today.',
            confirmButtonColor: '#0284c7'
          });
          return;
        }

        if (!workDone || workDone.length < 3) {
          StudentSwal.fire({
            icon: 'warning',
            title: 'Description Required',
            text: 'Please describe the work completed for this task.',
            confirmButtonColor: '#0284c7'
          });
          return;
        }

        formSubmitting = true;
        render();

        try {
          await saveReport({
            projectId: parseInt(projectId),
            taskId: parseInt(taskId),
            date,
            workDone,
            type: 'daily'
          });

          formWorkDone = '';
          formTaskId = '';
          formSubmitting = false;
          feedbackMessage = {
            type: 'success',
            text: 'Daily Report submitted successfully! Your Weekly Progress Report has been automatically updated.'
          };

          render();

          StudentSwal.fire({
            icon: 'success',
            title: 'Daily Report Submitted!',
            html: `
              <p>Your daily log has been recorded and the corresponding <strong>Weekly Progress Report</strong> has been automatically generated/updated.</p>
            `,
            confirmButtonColor: '#0284c7',
            confirmButtonText: 'View Weekly Progress'
          }).then((result) => {
            if (result.isConfirmed) {
              activeTab = 'weekly';
              render();
            }
          });
        } catch (err) {
          formSubmitting = false;
          feedbackMessage = {
            type: 'error',
            text: err.message || 'Failed to submit daily report.'
          };
          render();

          StudentSwal.fire({
            icon: 'error',
            title: 'Submission Error',
            text: err.message || 'Could not submit daily report.',
            confirmButtonColor: '#0284c7'
          });
        }
      });

      const dailySearchInput = container.querySelector('#daily-search-input');
      dailySearchInput?.addEventListener('input', (e) => {
        dailySearch = e.target.value;
        render();
        const input = container.querySelector('#daily-search-input');
        if (input) {
          input.focus();
          input.setSelectionRange(input.value.length, input.value.length);
        }
      });

      container.querySelector('#daily-proj-filter')?.addEventListener('change', (e) => {
        dailyProjectFilter = e.target.value;
        render();
      });

      container.querySelector('#daily-status-filter')?.addEventListener('change', (e) => {
        dailyStatusFilter = e.target.value;
        render();
      });
    }
  }

  render();
  return container;
}

export default StudentReports;
