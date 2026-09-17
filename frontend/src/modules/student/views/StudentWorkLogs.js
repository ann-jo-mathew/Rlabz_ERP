import { renderStudentSidebar } from './StudentSidebar.js';
import { getProjects, getWorkLogs, saveWorkLog, getProjectTasks, ensureDataLoaded } from './studentStore.js';
import { StudentSwal, showStudentSuccess, showStudentError, showStudentWarning } from '../studentAlerts.js';
import '../student.css';

export async function StudentWorkLogs(route, router) {
  await ensureDataLoaded();
  renderStudentSidebar();

  const container = document.createElement('div');
  container.className = 'student-portal-container animate-fade-in student-worklogs-view';

  // Form & Filter State
  const todayStr = new Date().toISOString().split('T')[0];
  let formProjectId = '';
  let formTaskId = '';
  let availableTasks = [];
  let loadingTasks = false;
  let formDate = todayStr;
  let formHours = '';
  let formDescription = '';
  let formSubmitting = false;

  let logSearch = '';
  let logProjectFilter = 'all'; // 'all' or project title
  let logStatusFilter = 'all';  // 'all' | 'approved' | 'pending' | 'rejected'

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
      console.error('Error fetching project tasks for work log:', err);
      availableTasks = [];
    } finally {
      loadingTasks = false;
      render();
    }
  }

  function render() {
    const projects = getProjects() || [];
    const logs = getWorkLogs() || [];

    // Filter Options for Form & Header
    const projectOptionsHtml = projects.map(p => `
      <option value="${p.id}" ${String(formProjectId) === String(p.id) ? 'selected' : ''}>${p.title}</option>
    `).join('');

    const logProjectFilterOptions = projects.map(p => `
      <option value="${p.title}" ${logProjectFilter === p.title ? 'selected' : ''}>${p.title}</option>
    `).join('');

    // Scoped logs for KPI metrics (depends on selected project filter)
    const scopeLogs = logProjectFilter === 'all' 
      ? logs 
      : logs.filter(l => l.project === logProjectFilter);

    // Filtered Work Logs for Table (includes search & status)
    const filteredLogs = scopeLogs.filter(l => {
      if (logStatusFilter !== 'all') {
        const s = (l.status || 'pending').toLowerCase();
        if (s !== logStatusFilter.toLowerCase()) return false;
      }
      if (logSearch.trim()) {
        const q = logSearch.toLowerCase().trim();
        const matchDesc = (l.description || '').toLowerCase().includes(q);
        const matchProj = (l.project || '').toLowerCase().includes(q);
        const matchDate = (l.date || '').toLowerCase().includes(q);
        const matchTask = (l.taskTitle || l.taskCode || '').toLowerCase().includes(q);
        if (!matchDesc && !matchProj && !matchDate && !matchTask) return false;
      }
      return true;
    });

    const isFiltersActive = logSearch.trim() !== '' || logProjectFilter !== 'all' || logStatusFilter !== 'all';
    
    // KPI Calculations (Dynamically reflect the chosen project scope)
    const scopeTotalHours = scopeLogs.reduce((sum, log) => sum + parseFloat(log.hours || 0), 0);
    const scopeTotalEntries = scopeLogs.length;
    const scopeApprovedHours = scopeLogs
      .filter(l => (l.status || '').toLowerCase() === 'approved')
      .reduce((sum, log) => sum + parseFloat(log.hours || 0), 0);
    const scopePendingCount = scopeLogs.filter(l => (l.status || 'pending').toLowerCase() === 'pending').length;

    const filteredHours = filteredLogs.reduce((sum, log) => sum + parseFloat(log.hours || 0), 0);
    const scopeBadgeLabel = logProjectFilter === 'all' ? 'All Projects' : logProjectFilter;

    const logRowsHtml = filteredLogs.map(l => {
      const status = (l.status || 'pending').toLowerCase();
      let statusClass = 'pending';
      if (status === 'approved') statusClass = 'approved';
      else if (status === 'rejected') statusClass = 'rejected';

      return `
        <tr>
          <td>
            <div class="student-wl-proj-title">${l.project}</div>
            <div class="student-wl-date-sub">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline; vertical-align:middle;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              ${l.date}
            </div>
          </td>
          <td>
            ${l.taskCode ? `
              <span class="student-wl-task-code">${l.taskCode}</span>
              <div class="student-wl-task-title">${l.taskTitle || 'Assigned Task'}</div>
            ` : `
              <span style="color: var(--text-secondary); font-size: 0.82rem; font-weight:600;">${l.taskId ? 'Task #' + l.taskId : 'General Project Effort'}</span>
            `}
          </td>
          <td>
            <div class="student-wl-hours-val">
              ${parseFloat(l.hours || 0).toFixed(1)} hrs
            </div>
          </td>
          <td>
            <div class="student-wl-desc-text">${l.description || 'No work description provided.'}</div>
          </td>
          <td style="text-align: center;">
            <span class="student-wl-status-badge ${statusClass}">
              ${statusClass === 'approved' ? `
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
              ` : statusClass === 'pending' ? `
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              ` : `
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              `}
              ${status.toUpperCase()}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <!-- Header Banner with Project Scope Selector -->
      <div class="student-wl-header-wrapper">
        <div class="student-wl-header-left">
          <div class="student-wl-brand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div>
            <h1 class="student-wl-title">Daily Work Logs</h1>
            <p class="student-wl-subtitle">Log your daily working hours and track completed project effort across sprints.</p>
          </div>
        </div>

        <!-- Scope Project Switcher -->
        <div class="student-wl-project-selector">
          <span class="student-wl-select-label">Project Scope:</span>
          <select id="header-scope-select" class="student-wl-header-select">
            <option value="all" ${logProjectFilter === 'all' ? 'selected' : ''}>All Assigned Projects</option>
            ${logProjectFilterOptions}
          </select>
        </div>
      </div>

      <!-- KPI Summary Cards (Dynamic to Project Scope) -->
      <div class="student-wl-kpi-grid">
        <div class="student-wl-kpi-card kpi-blue">
          <div class="student-wl-kpi-icon blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div class="student-wl-kpi-info">
            <div class="student-wl-kpi-val">${scopeTotalHours.toFixed(1)} hrs</div>
            <div class="student-wl-kpi-lbl">Total Logged <span style="font-size: 0.68rem; font-weight:500; text-transform:none; color:var(--text-muted);">(${scopeBadgeLabel})</span></div>
          </div>
        </div>

        <div class="student-wl-kpi-card kpi-indigo">
          <div class="student-wl-kpi-icon indigo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
          </div>
          <div class="student-wl-kpi-info">
            <div class="student-wl-kpi-val">${scopeTotalEntries}</div>
            <div class="student-wl-kpi-lbl">Total Entries <span style="font-size: 0.68rem; font-weight:500; text-transform:none; color:var(--text-muted);">(${scopeBadgeLabel})</span></div>
          </div>
        </div>

        <div class="student-wl-kpi-card kpi-emerald">
          <div class="student-wl-kpi-icon emerald">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div class="student-wl-kpi-info">
            <div class="student-wl-kpi-val">${scopeApprovedHours.toFixed(1)} hrs</div>
            <div class="student-wl-kpi-lbl">Approved Effort <span style="font-size: 0.68rem; font-weight:500; text-transform:none; color:var(--text-muted);">(${scopeBadgeLabel})</span></div>
          </div>
        </div>

        <div class="student-wl-kpi-card kpi-amber">
          <div class="student-wl-kpi-icon amber">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <div class="student-wl-kpi-info">
            <div class="student-wl-kpi-val">${scopePendingCount}</div>
            <div class="student-wl-kpi-lbl">Pending Review <span style="font-size: 0.68rem; font-weight:500; text-transform:none; color:var(--text-muted);">(${scopeBadgeLabel})</span></div>
          </div>
        </div>
      </div>

      <!-- 2-Column Split: Log Form (Left) & Log History (Right) -->
      <div class="student-wl-split-layout">
        <!-- Work Log Submission Form Card -->
        <div class="student-wl-form-card">
          <h3 class="student-wl-form-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Log Working Hours
          </h3>

          <form id="worklog-form">
            <!-- 1. Select Project -->
            <div class="student-wl-form-group">
              <label for="log-project">Project <span style="color:#dc2626;">*</span></label>
              <select id="log-project" class="student-wl-select" required>
                <option value="" disabled ${!formProjectId ? 'selected' : ''}>-- Select Project --</option>
                ${projectOptionsHtml}
              </select>
            </div>

            <!-- 2. Select Assigned Task -->
            <div class="student-wl-form-group">
              <label for="log-task">
                <span>Assigned Task</span> <span style="color:#dc2626;">*</span>
              </label>
              <select id="log-task" class="student-wl-select" ${!formProjectId || loadingTasks ? 'disabled' : ''} required>
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
                  <span>No active tasks assigned to you for this project. Completed tasks are hidden.</span>
                </div>
              ` : ''}
            </div>

            <!-- 3. Work Date -->
            <div class="student-wl-form-group">
              <label for="log-date">Work Date <span style="color:#dc2626;">*</span></label>
              <input type="date" id="log-date" class="student-wl-input" value="${formDate}" required>
            </div>

            <!-- 4. Hours Worked -->
            <div class="student-wl-form-group">
              <label for="log-hours">
                <span>Hours Worked</span> <span style="color:#dc2626;">*</span>
              </label>
              <input type="number" id="log-hours" class="student-wl-input" min="0.5" max="24" step="0.5" placeholder="e.g. 4.5" value="${formHours}" required>
  
            </div>

            <!-- 5. Work Description -->
            <div class="student-wl-form-group">
              <label for="log-desc">Work Description <span style="color:#dc2626;">*</span></label>
              <textarea id="log-desc" class="student-wl-textarea" placeholder="Briefly describe what tasks you implemented during these hours..." required>${formDescription}</textarea>
            </div>

            <button type="submit" id="btn-submit-worklog" class="student-wl-btn-submit" ${formSubmitting || (formProjectId && availableTasks.length === 0) ? 'disabled' : ''}>
              ${formSubmitting ? `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg>
                <span>Submitting Entry...</span>
              ` : `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Submit Log Entry</span>
              `}
            </button>
          </form>
        </div>

        <!-- Work Logs List Table Card -->
        <div class="student-wl-history-card">
          <div class="student-wl-history-header">
            <h3 class="student-wl-history-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
              Daily Log History
            </h3>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="student-badge student-badge-success" style="font-size: 0.78rem; font-weight: 800;">
                Filtered: ${filteredHours.toFixed(1)} hrs
              </span>
              <span class="student-badge student-badge-info" style="font-size: 0.78rem; font-weight: 800;">
                Scope Total: ${scopeTotalHours.toFixed(1)} hrs
              </span>
            </div>
          </div>

          <!-- Work Logs Filter Bar -->
          <div class="student-wl-filter-bar">
            <div class="student-wl-search-wrap">
              <svg class="student-wl-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" id="log-search-input" class="student-wl-search-input" placeholder="Search task, project, or description..." value="${logSearch}">
            </div>

            <select id="log-proj-filter" class="student-wl-select-filter">
              <option value="all" ${logProjectFilter === 'all' ? 'selected' : ''}>All Projects</option>
              ${logProjectFilterOptions}
            </select>

            <select id="log-status-filter" class="student-wl-select-filter">
              <option value="all" ${logStatusFilter === 'all' ? 'selected' : ''}>All Status</option>
              <option value="approved" ${logStatusFilter === 'approved' ? 'selected' : ''}>Approved</option>
              <option value="pending" ${logStatusFilter === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="rejected" ${logStatusFilter === 'rejected' ? 'selected' : ''}>Rejected</option>
            </select>

            ${isFiltersActive ? `
              <button type="button" id="btn-clear-log-filters" class="student-wl-btn-reset" title="Reset all filters">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                Reset
              </button>
            ` : ''}
          </div>

          <!-- Table Wrap -->
          <div class="student-wl-table-wrap">
            <table class="student-wl-table">
              <thead>
                <tr>
                  <th style="width: 22%;">Date &amp; Project</th>
                  <th style="width: 26%;">Assigned Task</th>
                  <th style="width: 12%;">Hours</th>
                  <th style="width: 28%;">Description</th>
                  <th style="width: 12%; text-align: center;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${logRowsHtml || `
                  <tr>
                    <td colspan="5" style="text-align: center; padding: 36px 20px;">
                      <div style="font-size: 1.75rem; margin-bottom: 6px;">⏰</div>
                      <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">No work log entries found</div>
                      <div style="font-size: 0.78rem; color: var(--text-muted);">Use the form on the left to record your daily working hours.</div>
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    setupListeners();
  }

  function setupListeners() {
    const searchInput = container.querySelector('#log-search-input');
    searchInput?.addEventListener('input', (e) => {
      logSearch = e.target.value;
      render();
      const input = container.querySelector('#log-search-input');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    });

    // Top Header Project Scope Switcher
    container.querySelector('#header-scope-select')?.addEventListener('change', (e) => {
      const selectedProj = e.target.value;
      logProjectFilter = selectedProj;
      
      // Auto-set the form's project if a specific project is selected
      const projects = getProjects() || [];
      if (selectedProj !== 'all') {
        const found = projects.find(p => p.title === selectedProj);
        if (found) {
          handleProjectSelection(found.id);
          return;
        }
      }
      render();
    });

    // Table Filter Project Dropdown
    container.querySelector('#log-proj-filter')?.addEventListener('change', (e) => {
      logProjectFilter = e.target.value;
      render();
    });

    container.querySelector('#log-status-filter')?.addEventListener('change', (e) => {
      logStatusFilter = e.target.value;
      render();
    });

    container.querySelector('#btn-clear-log-filters')?.addEventListener('click', () => {
      logSearch = '';
      logProjectFilter = 'all';
      logStatusFilter = 'all';
      render();
    });

    const projectSelect = container.querySelector('#log-project');
    projectSelect?.addEventListener('change', (e) => {
      handleProjectSelection(e.target.value);
    });

    const taskSelect = container.querySelector('#log-task');
    taskSelect?.addEventListener('change', (e) => {
      formTaskId = e.target.value;
    });

    const dateInput = container.querySelector('#log-date');
    dateInput?.addEventListener('change', (e) => {
      formDate = e.target.value;
    });

    const hoursInput = container.querySelector('#log-hours');
    hoursInput?.addEventListener('input', (e) => {
      formHours = e.target.value;
    });

    // Quick hour chips
    container.querySelectorAll('.btn-quick-hour').forEach(chip => {
      chip.addEventListener('click', () => {
        const val = chip.getAttribute('data-val');
        formHours = val;
        const hInp = container.querySelector('#log-hours');
        if (hInp) hInp.value = val;
      });
    });

    const descInput = container.querySelector('#log-desc');
    descInput?.addEventListener('input', (e) => {
      formDescription = e.target.value;
    });

    const workLogForm = container.querySelector('#worklog-form');
    workLogForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const projectId = formProjectId;
      const taskId = container.querySelector('#log-task')?.value || formTaskId;
      const date = container.querySelector('#log-date').value;
      const hours = container.querySelector('#log-hours').value;
      const description = container.querySelector('#log-desc').value.trim();

      if (!projectId) {
        StudentSwal.fire({
          icon: 'warning',
          title: 'Project Required',
          text: 'Please select a project.',
          confirmButtonColor: '#0284c7'
        });
        return;
      }

      if (!taskId) {
        StudentSwal.fire({
          icon: 'warning',
          title: 'Task Required',
          text: 'Please select an assigned task.',
          confirmButtonColor: '#0284c7'
        });
        return;
      }

      formSubmitting = true;
      render();

      try {
        await saveWorkLog({ projectId, taskId, date, hours, description });
        formHours = '';
        formDescription = '';
        formTaskId = '';
        formSubmitting = false;
        render();

        StudentSwal.fire({
          icon: 'success',
          title: 'Logged Successfully',
          text: `Logged ${hours} hours for task.`,
          confirmButtonColor: '#0284c7'
        });
      } catch (err) {
        formSubmitting = false;
        render();
        StudentSwal.fire({
          icon: 'error',
          title: 'Error Logging Hours',
          text: err.message || 'Failed to submit work log.',
          confirmButtonColor: '#0284c7'
        });
      }
    });
  }

  render();
  return container;
}

export default StudentWorkLogs;
