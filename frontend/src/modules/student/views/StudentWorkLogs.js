import { renderStudentSidebar } from './StudentSidebar.js';
import { getProjects, getWorkLogs, saveWorkLog, getProjectTasks, ensureDataLoaded } from './studentStore.js';
import { StudentSwal, showStudentSuccess, showStudentError, showStudentWarning } from '../studentAlerts.js';
import '../student.css';

export async function StudentWorkLogs(route, router) {
  await ensureDataLoaded();
  renderStudentSidebar();

  const container = document.createElement('div');
  container.className = 'student-portal-container animate-fade-in';

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
  let logProjectFilter = 'all';

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

    // Filter Options
    const projectOptionsHtml = projects.map(p => `
      <option value="${p.id}" ${String(formProjectId) === String(p.id) ? 'selected' : ''}>${p.title}</option>
    `).join('');

    const logProjectFilterOptions = projects.map(p => `
      <option value="${p.title}" ${logProjectFilter === p.title ? 'selected' : ''}>${p.title}</option>
    `).join('');

    // Filtered Work Logs
    const filteredLogs = logs.filter(l => {
      if (logProjectFilter !== 'all' && l.project !== logProjectFilter) return false;
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

    const isFiltersActive = logSearch.trim() !== '' || logProjectFilter !== 'all';
    const totalHours = logs.reduce((sum, log) => sum + parseFloat(log.hours || 0), 0);
    const filteredHours = filteredLogs.reduce((sum, log) => sum + parseFloat(log.hours || 0), 0);

    const logRowsHtml = filteredLogs.map(l => {
      const status = (l.status || 'pending').toLowerCase();
      const statusClass = status === 'approved' ? 'student-badge-success' : status === 'rejected' ? 'student-badge-danger' : 'student-badge-warning';
      return `
        <tr style="vertical-align: top; border-bottom: 1px solid var(--border-color, #e2e8f0);">
          <td style="padding: 12px 14px;">
            <div style="font-weight: 600; font-size: 0.88rem; color: var(--text-main);">${l.project}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">${l.date}</div>
          </td>
          <td style="padding: 12px 14px;">
            ${l.taskCode ? `
              <span class="daily-task-code-badge">${l.taskCode}</span>
              <div style="font-weight: 600; font-size: 0.84rem; color: var(--text-main);">${l.taskTitle || 'Assigned Task'}</div>
            ` : `
              <span style="color: #94a3b8; font-size: 0.8rem;">${l.taskId ? 'Task #' + l.taskId : 'General Tasks'}</span>
            `}
          </td>
          <td style="padding: 12px 14px; font-weight: 700; color: var(--primary); font-size: 0.9rem;">
            ${l.hours} hrs
          </td>
          <td style="padding: 12px 14px; font-size: 0.85rem; color: var(--text-muted); line-height: 1.45; white-space: pre-wrap;">
            ${l.description}
          </td>
          <td style="padding: 12px 14px; text-align: center;">
            <span class="student-badge ${statusClass}">${l.status ? l.status.toUpperCase() : 'PENDING'}</span>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="student-header">
        <h1>Daily Work Logs</h1>
        <p>Log your daily working hours and track completed project effort across sprints.</p>
      </div>

      <div class="student-split-pane" style="grid-template-columns: 1fr 1.6fr; gap: 24px; align-items: start;">
        <!-- Work Log Form -->
        <div class="student-card reports-form-card" style="height: fit-content;">
          <div class="student-card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #059669;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span>Log Working Hours</span>
          </div>

          <form id="worklog-form" class="student-form">
            <!-- 1. Select Project -->
            <div class="student-form-group">
              <label for="log-project">Project <span style="color:#dc2626;">*</span></label>
              <select id="log-project" class="student-select" required>
                <option value="" disabled ${!formProjectId ? 'selected' : ''}>-- Select Project --</option>
                ${projectOptionsHtml}
              </select>
            </div>

            <!-- 2. Select Assigned Task -->
            <div class="student-form-group">
              <label for="log-task">
                <span>Assigned Task</span> <span style="color:#dc2626;">*</span>
              </label>
              <select id="log-task" class="student-select" ${!formProjectId || loadingTasks ? 'disabled' : ''} required>
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
            <div class="student-form-group">
              <label for="log-date">Work Date <span style="color:#dc2626;">*</span></label>
              <input type="date" id="log-date" class="student-input" value="${formDate}" required>
            </div>

            <!-- 4. Hours Worked -->
            <div class="student-form-group">
              <label for="log-hours">Hours Worked <span style="color:#dc2626;">*</span></label>
              <input type="number" id="log-hours" class="student-input" min="0.5" max="24" step="0.5" placeholder="e.g. 4.5" value="${formHours}" required>
            </div>

            <!-- 5. Work Description -->
            <div class="student-form-group">
              <label for="log-desc">Work Description <span style="color:#dc2626;">*</span></label>
              <textarea id="log-desc" class="student-textarea" placeholder="Briefly describe what tasks you worked on during these hours..." style="min-height: 110px;" required>${formDescription}</textarea>
            </div>

            <button type="submit" id="btn-submit-worklog" class="student-btn student-btn-primary" style="justify-content:center; margin-top:8px; width: 100%;" ${formSubmitting || (formProjectId && availableTasks.length === 0) ? 'disabled' : ''}>
              ${formSubmitting ? 'Submitting Entry...' : 'Submit Log Entry'}
            </button>
          </form>
        </div>

        <!-- Work Logs List Table -->
        <div class="student-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
            <div class="student-card-title" style="margin-bottom:0;">Daily Log History</div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="student-badge student-badge-success" style="font-size:0.8rem; padding: 4px 10px;">
                Filtered: ${filteredHours} hrs
              </span>
              <span class="student-badge student-badge-info" style="font-size:0.8rem; padding: 4px 10px;">
                Total: ${totalHours} hrs
              </span>
            </div>
          </div>

          <!-- Work Logs Filter Bar -->
          <div class="student-filter-bar">
            <div class="student-search-wrapper" style="flex: 1.5;">
              <svg class="student-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" id="log-search-input" class="student-search-input" placeholder="Search description, task, or date..." value="${logSearch}">
            </div>

            <select id="log-proj-filter" class="student-filter-select">
              <option value="all" ${logProjectFilter === 'all' ? 'selected' : ''}>All Projects</option>
              ${logProjectFilterOptions}
            </select>

            ${isFiltersActive ? `
              <button type="button" id="btn-clear-log-filters" class="student-filter-btn-clear" title="Reset filters">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                Reset
              </button>
            ` : ''}
          </div>

          <div class="student-table-container daily-reports-scroll-container">
            <table class="student-table" style="width: 100%;">
              <thead>
                <tr>
                  <th style="width: 20%;">Date & Project</th>
                  <th style="width: 25%;">Assigned Task</th>
                  <th style="width: 12%;">Hours</th>
                  <th style="width: 31%;">Description</th>
                  <th style="width: 12%; text-align: center;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${logRowsHtml || `
                  <tr>
                    <td colspan="5">
                      <div class="student-empty-filter">
                        <div class="student-empty-filter-icon">⏰</div>
                        <div class="student-empty-filter-text">No work log entries found</div>
                        <div class="student-empty-filter-sub">Use the form on the left to record your daily working hours.</div>
                      </div>
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

    container.querySelector('#log-proj-filter')?.addEventListener('change', (e) => {
      logProjectFilter = e.target.value;
      render();
    });

    container.querySelector('#btn-clear-log-filters')?.addEventListener('click', () => {
      logSearch = '';
      logProjectFilter = 'all';
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
          confirmButtonColor: '#059669'
        });
        return;
      }

      if (!taskId) {
        StudentSwal.fire({
          icon: 'warning',
          title: 'Task Required',
          text: 'Please select an assigned task.',
          confirmButtonColor: '#059669'
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
          confirmButtonColor: '#059669'
        });
      } catch (err) {
        formSubmitting = false;
        render();
        StudentSwal.fire({
          icon: 'error',
          title: 'Error Logging Hours',
          text: err.message || 'Failed to submit work log.',
          confirmButtonColor: '#059669'
        });
      }
    });
  }

  render();
  return container;
}

export default StudentWorkLogs;
