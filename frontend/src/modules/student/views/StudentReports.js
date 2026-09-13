import { renderStudentSidebar } from './StudentSidebar.js';
import { getProjects, getReports, saveReport, getProjectTasks, ensureDataLoaded } from './studentStore.js';
import { StudentSwal, showStudentSuccess, showStudentError, showStudentWarning } from '../studentAlerts.js';
import { STORAGE_BASE } from '@/core/config/api.js';
import '../student.css';

export async function StudentReports(route, router) {
  await ensureDataLoaded();
  renderStudentSidebar();

  const container = document.createElement('div');
  container.className = 'student-portal-container animate-fade-in';

  // Active tab: 'weekly' (default, primary view) or 'daily' (submit & daily history)
  let activeTab = 'weekly';

  // Set to track expanded week report IDs (initially empty so all weeks are short)
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

      // Check if line is a task header: e.g. "T-18 — Create Login Page Feature" or "T-18 - Title"
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

    // Filter out any invalid/unlinked reports and ignore legacy 'General' reports
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

    // Group Weekly Reports by Project (Only valid projects, no General)
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
        <div class="weekly-project-group">
          <!-- Project Group Header -->
          <div class="weekly-project-group-header">
            <div class="weekly-project-group-title">
              <div class="weekly-project-icon-box">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
              </div>
              <span>${pg.projectTitle}</span>
            </div>
            <span class="student-badge student-badge-info" style="font-size: 0.78rem;">
              ${totalWeeks} ${totalWeeks === 1 ? 'Week Logged' : 'Weeks Logged'}
            </span>
          </div>

          <!-- Week-wise Accordion List -->
          <div class="weekly-weeks-list">
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
                <div class="weekly-week-item">
                  <!-- Week Header Row with Arrow (Click to Toggle) -->
                  <div class="weekly-week-header ${isOpen ? 'is-open' : ''}" data-toggle-id="${r.id}" title="${isOpen ? 'Click to collapse' : 'Click to view full details'}">
                    <div class="weekly-week-header-left">
                      <!-- Dropdown Arrow Button -->
                      <div class="weekly-chevron">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                      </div>

                      <div class="weekly-week-label">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #64748b;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        <span>Week: ${weekDisplay}</span>
                      </div>

     
                    </div>

                    <div class="weekly-week-header-right">
                      <span class="student-badge student-badge-info" style="font-size: 0.72rem;">
                        ${parsedTasks.length} ${parsedTasks.length === 1 ? 'Task' : 'Tasks'}
                      </span>
                      <span class="student-badge ${statusClass}" style="font-size: 0.74rem;">${r.status || 'Pending'}</span>
                      ${hasAttachment ? `
                        <a href="${authDownloadUrl}" target="_blank" download="${r.fileName || 'Weekly_Report'}" class="student-report-attachment-btn" title="Download Document" style="font-size: 0.72rem; padding: 3px 8px;" onclick="event.stopPropagation();">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                          <span>Document</span>
                        </a>
                      ` : ''}
                    </div>
                  </div>

                  <!-- Collapsible Full Details Body -->
                  <div class="weekly-week-body ${isOpen ? '' : 'is-collapsed'}">
                    <div class="weekly-section-label">Tasks Worked On</div>

                    ${parsedTasks.length > 0 ? parsedTasks.map(t => {
                      const taskStatusLower = (t.status || '').toLowerCase();
                      const taskStatusClass = taskStatusLower === 'completed' ? 'student-badge-success' : taskStatusLower === 'todo' ? 'student-badge-info' : 'student-badge-warning';

                      return `
                        <div class="weekly-task-box">
                          <div class="weekly-task-top">
                            <span class="weekly-task-id-badge">${t.code}</span>
                            <span class="weekly-task-title">${t.title}</span>
                            <span class="student-badge ${taskStatusClass}" style="font-size: 0.7rem;">${t.status}</span>
                          </div>
                          <div class="weekly-task-entries">
                            ${t.entries.map(entry => {
                              const dateMatch = entry.match(/^\[(.*?)\]\s*(.*)$/);
                              if (dateMatch) {
                                return `
                                  <div class="weekly-task-entry">
                                    <span class="weekly-check-icon">✓</span>
                                    <span class="weekly-task-date-pill">${dateMatch[1]}</span>
                                    <span>${dateMatch[2]}</span>
                                  </div>
                                `;
                              }
                              return `
                                <div class="weekly-task-entry">
                                  <span class="weekly-check-icon">✓</span>
                                  <span>${entry}</span>
                                </div>
                              `;
                            }).join('')}
                          </div>
                        </div>
                      `;
                    }).join('') : `
                      <div style="font-size: 0.85rem; color: var(--text-main); line-height: 1.5; white-space: pre-wrap; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px;">
                        ${r.workDone}
                      </div>
                    `}

                    ${r.feedback ? `
                      <div class="weekly-feedback-callout">
                        <div class="weekly-feedback-head">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                          <span>Supervisor Feedback:</span>
                        </div>
                        <div class="weekly-feedback-text">${r.feedback}</div>
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
        <tr style="vertical-align: top; border-bottom: 1px solid var(--border-color, #e2e8f0);">
          <td style="padding: 12px 14px;">
            <div style="font-weight: 600; font-size: 0.88rem; color: var(--text-main);">${r.date}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">${r.projectTitle || ''}</div>
          </td>
          <td style="padding: 12px 14px;">
            ${r.taskCode ? `
              <span class="daily-task-code-badge">${r.taskCode}</span>
              <div style="font-weight: 600; font-size: 0.84rem; color: var(--text-main);">${r.taskTitle || 'Assigned Task'}</div>
            ` : `
              <span style="color: #94a3b8; font-size: 0.8rem;">${r.taskId ? 'Task #' + r.taskId : 'Task'}</span>
            `}
          </td>
          <td style="padding: 12px 14px;">
            <div style="font-size: 0.84rem; color: var(--text-main); line-height: 1.45; white-space: pre-wrap;">${r.workDone}</div>
            ${r.feedback ? `
              <div class="report-feedback-callout" style="margin-top: 8px;">
                <div class="report-feedback-header">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  <span>Supervisor Feedback:</span>
                </div>
                <div class="report-feedback-body">${r.feedback}</div>
              </div>
            ` : ''}
          </td>
          <td style="padding: 12px 14px; text-align: center;">
            <span class="student-badge ${statusClass}" style="font-size: 0.72rem;">${r.status || 'Pending'}</span>
          </td>
        </tr>
      `;
    }).join('');

    // Render Container HTML
    container.innerHTML = `
      <div class="student-header">
        <h1>Progress Reports</h1>
        <p>Submit daily reports for your assigned tasks. The system automatically creates and updates your Weekly Progress Reports per project.</p>
      </div>

      ${feedbackMessage ? `
        <div class="student-toast-alert ${feedbackMessage.type}">
          <span>${feedbackMessage.text}</span>
          <button id="btn-close-toast" class="student-toast-close">&times;</button>
        </div>
      ` : ''}

      <!-- Main Navigation Tabs -->
      <div class="student-tabs">
        <button class="student-tab-btn ${activeTab === 'weekly' ? 'active' : ''}" id="tab-weekly">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          <span>Weekly Progress</span>
          <span style="background: #ecfdf5; color: #047857; font-size: 0.68rem; font-weight: 700; padding: 2px 6px; border-radius: 9999px; margin-left: 4px;">Auto</span>
        </button>
        <button class="student-tab-btn ${activeTab === 'daily' ? 'active' : ''}" id="tab-daily">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          <span>Submit Daily Report</span>
        </button>
      </div>

      <!-- Tab Content Area -->
      <div id="tab-content-outlet">

        <!-- ================= TAB 1: WEEKLY PROGRESS (AUTO-GENERATED) ================= -->
        ${activeTab === 'weekly' ? `
          <div style="display: flex; flex-direction: column; gap: 20px;">
            <!-- Weekly Filter Bar -->
            <div class="student-card" style="padding: 14px 20px;">
              <div class="student-filter-bar" style="margin-bottom: 0;">
                <div class="student-search-wrapper" style="flex: 1.5;">
                  <svg class="student-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <input type="text" id="weekly-search-input" class="student-search-input" placeholder="Search weekly tasks, work done, or feedback..." value="${weeklySearch}">
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

            <!-- Project-wise Division with Week-wise Listing -->
            ${projectGroups.length > 0 ? `
              <div class="weekly-projects-container">
                ${weeklyAccordionHtml}
              </div>
            ` : `
              <div class="student-card">
                <div class="student-empty-filter" style="padding: 48px 24px;">
                  <div class="student-empty-filter-icon">📅</div>
                  <div class="student-empty-filter-text">No Weekly Progress Reports Found</div>
                  <div class="student-empty-filter-sub" style="max-width: 480px; margin: 8px auto 20px;">
                    Weekly progress is automatically generated whenever you submit a Daily Report for your assigned project tasks.
                  </div>
                  <button type="button" id="btn-empty-goto-daily" class="student-btn student-btn-primary" style="margin: 0 auto;">
                    Submit Your First Daily Report
                  </button>
                </div>
              </div>
            `}
          </div>
        ` : ''}

        <!-- ================= TAB 2: DAILY REPORTS (SUBMIT & HISTORY) ================= -->
        ${activeTab === 'daily' ? `
          <div class="student-split-pane" style="grid-template-columns: 1fr 1.6fr; gap: 24px; align-items: start;">
            <!-- Submit Daily Report Form -->
            <div class="student-card reports-form-card" style="height: fit-content;">
              <div class="student-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #059669;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                <span>Submit Daily Report</span>
              </div>
              <form id="daily-report-form" class="student-form">
                <!-- 1. Select Project -->
                <div class="student-form-group">
                  <label for="daily-rep-project">Project <span style="color:#dc2626;">*</span></label>
                  <select id="daily-rep-project" class="student-select" required>
                    <option value="">-- Select Project --</option>
                    ${projectOptionsHtml}
                  </select>
                </div>

                <!-- 2. Select Assigned Task -->
                <div class="student-form-group">
                  <label for="daily-rep-task">
                    <span>Assigned Task</span> <span style="color:#dc2626;">*</span>
                  </label>
                  <select id="daily-rep-task" class="student-select" ${!formProjectId || loadingTasks ? 'disabled' : ''} required>
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

                  ${formProjectId && !loadingTasks && availableTasks.length === 0 ? `
                    <div style="font-size: 0.74rem; color: #b45309; margin-top: 4px; display: flex; align-items: center; gap: 4px;">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                      <span>No active or rework tasks assigned to you for this project. Completed tasks are hidden.</span>
                    </div>
                  ` : ''}
                </div>

                <!-- 3. Report Date -->
                <div class="student-form-group">
                  <label for="daily-rep-date">Report Date <span style="color:#dc2626;">*</span></label>
                  <input type="date" id="daily-rep-date" class="student-input" value="${formDate}" required>
                </div>

                <!-- 4. Work Done Description -->
                <div class="student-form-group">
                  <label for="daily-rep-done">Work Completed & Summary <span style="color:#dc2626;">*</span></label>
                  <textarea id="daily-rep-done" class="student-textarea" placeholder="Detail the work accomplished for this task today, technical notes, or roadblocks..." style="min-height: 110px;" required>${formWorkDone}</textarea>
                </div>

                <!-- Auto Weekly Sync Notice -->


                <button type="submit" id="btn-submit-daily" class="student-btn student-btn-primary" style="justify-content:center; margin-top:14px; width: 100%;" ${formSubmitting || (formProjectId && availableTasks.length === 0) ? 'disabled' : ''}>
                  ${formSubmitting ? 'Submitting Daily Report...' : 'Submit Daily Report'}
                </button>
              </form>
            </div>

            <!-- Daily Reports History Table -->
            <div class="student-card">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <div class="student-card-title" style="margin-bottom:0;">Daily Reports Log</div>
                <span class="student-badge student-badge-info" style="font-size:0.75rem;">
                  Showing ${filteredDaily.length} of ${dailyReports.length} Submitted Reports
                </span>
              </div>

              <!-- Filter Bar for Daily Reports -->
              <div class="student-filter-bar">
                <div class="student-search-wrapper" style="flex: 1.4;">
                  <svg class="student-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <input type="text" id="daily-search-input" class="student-search-input" placeholder="Search work done, task, or date..." value="${dailySearch}">
                </div>

                <select id="daily-proj-filter" class="student-filter-select">
                  <option value="all" ${dailyProjectFilter === 'all' ? 'selected' : ''}>All Projects</option>
                  ${dailyProjectFilterOptions}
                </select>

                <select id="daily-status-filter" class="student-filter-select">
                  <option value="all" ${dailyStatusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
                  <option value="pending" ${dailyStatusFilter === 'pending' ? 'selected' : ''}>Pending</option>
                  <option value="approved" ${dailyStatusFilter === 'approved' ? 'selected' : ''}>Approved</option>
                  <option value="rejected" ${dailyStatusFilter === 'rejected' ? 'selected' : ''}>Rejected</option>
                </select>
              </div>

              <!-- Daily Reports Table (Scroll Container: displays 5 data items and scrolls for more) -->
              <div class="student-table-container daily-reports-scroll-container">
                <table class="student-table" style="width: 100%;">
                  <thead>
                    <tr>
                      <th style="width: 22%;">Date & Project</th>
                      <th style="width: 26%;">Assigned Task</th>
                      <th style="width: 40%;">Daily Work Log</th>
                      <th style="width: 12%; text-align: center;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${dailyRowsHtml || `
                      <tr>
                        <td colspan="4">
                          <div class="student-empty-filter">
                            <div class="student-empty-filter-icon">📝</div>
                            <div class="student-empty-filter-text">No daily reports found</div>
                            <div class="student-empty-filter-sub">Fill out the form on the left to log today's task progress.</div>
                          </div>
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
    // Toast close
    container.querySelector('#btn-close-toast')?.addEventListener('click', () => {
      feedbackMessage = null;
      render();
    });

    // Tab Navigation
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

    // Weekly Tab Filters & Collapsible Accordion
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

      // Bind Accordion Header Clicks (set all as short, and when only clicked make it displayed)
      container.querySelectorAll('.weekly-week-header').forEach(header => {
        header.addEventListener('click', () => {
          const reportId = parseInt(header.getAttribute('data-toggle-id'));
          if (expandedWeekIds.has(reportId)) {
            expandedWeekIds.delete(reportId);
          } else {
            expandedWeekIds.clear(); // Keep all others short, expand only the clicked week
            expandedWeekIds.add(reportId);
          }
          render();
        });
      });
    }

    // Daily Tab Form and Filters
    if (activeTab === 'daily') {
      const projectSelect = container.querySelector('#daily-rep-project');
      projectSelect?.addEventListener('change', (e) => {
        handleProjectSelection(e.target.value);
      });

      const taskSelect = container.querySelector('#daily-rep-task');
      taskSelect?.addEventListener('change', (e) => {
        formTaskId = e.target.value;
      });

      const dateInput = container.querySelector('#daily-rep-date');
      dateInput?.addEventListener('change', (e) => {
        formDate = e.target.value;
      });

      const workInput = container.querySelector('#daily-rep-done');
      workInput?.addEventListener('input', (e) => {
        formWorkDone = e.target.value;
      });

      // Submit Daily Report
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
            confirmButtonColor: '#059669'
          });
          return;
        }

        if (!taskId) {
          StudentSwal.fire({
            icon: 'warning',
            title: 'Task Required',
            text: 'Please select an assigned task you worked on today.',
            confirmButtonColor: '#059669'
          });
          return;
        }

        if (!workDone || workDone.length < 3) {
          StudentSwal.fire({
            icon: 'warning',
            title: 'Description Required',
            text: 'Please describe the work completed for this task.',
            confirmButtonColor: '#059669'
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

          // Reset form fields
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
            confirmButtonColor: '#059669',
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
            confirmButtonColor: '#059669'
          });
        }
      });

      // Daily Filter Handlers
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
