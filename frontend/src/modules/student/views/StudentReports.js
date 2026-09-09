import { renderStudentSidebar } from './StudentSidebar.js';
import { getProjects, getReports, getWorkLogs, saveReport, saveWorkLog, ensureDataLoaded } from './studentStore.js';
import { StudentSwal, showStudentSuccess, showStudentError, showStudentWarning } from '../studentAlerts.js';
import '../student.css';

export async function StudentReports(route, router) {
  await ensureDataLoaded();
  renderStudentSidebar();

  const container = document.createElement('div');
  container.className = 'student-portal-container animate-fade-in';

  let activeTab = 'reports'; // 'reports' or 'logs'
  let reportType = 'Weekly'; // default 'Weekly'
  let selectedReportFile = null;
  let formSubmitting = false;
  let feedbackMessage = null; // { type: 'success' | 'error', text: '' }

  // Filter States
  let reportSearch = '';
  let reportTypeFilter = 'all'; // 'all' | 'weekly' | 'daily'
  let reportStatusFilter = 'all'; // 'all' | 'pending' | 'approved' | 'rejected'
  let reportProjectFilter = 'all';

  let logSearch = '';
  let logProjectFilter = 'all';

  function formatBytes(bytes, decimals = 1) {
    if (!bytes) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  function render() {
    const projects = getProjects() || [];
    const reports = getReports() || [];
    const logs = getWorkLogs() || [];

    // 1. Build Project Options HTML for Form & Filters
    const projectFormOptions = projects.map(p => `<option value="${p.id}">${p.title}</option>`).join('');
    const workLogProjectOptions = projects.map(p => `<option value="${p.title}">${p.title}</option>`).join('');

    const projectFilterOptions = projects.map(p => `
      <option value="${p.id}" ${reportProjectFilter === String(p.id) ? 'selected' : ''}>${p.title}</option>
    `).join('');

    const logProjectFilterOptions = projects.map(p => `
      <option value="${p.title}" ${logProjectFilter === p.title ? 'selected' : ''}>${p.title}</option>
    `).join('');

    // 2. Filter Reports
    const filteredReports = reports.filter(r => {
      if (reportTypeFilter !== 'all' && (r.type || '').toLowerCase() !== reportTypeFilter.toLowerCase()) return false;
      if (reportStatusFilter !== 'all' && (r.status || 'pending').toLowerCase() !== reportStatusFilter.toLowerCase()) return false;
      if (reportProjectFilter !== 'all' && String(r.projectId || '') !== String(reportProjectFilter)) return false;

      if (reportSearch.trim()) {
        const q = reportSearch.toLowerCase().trim();
        const matchDone = (r.workDone || '').toLowerCase().includes(q);
        const matchDate = (r.date || '').toLowerCase().includes(q);
        const matchProj = (r.projectTitle || '').toLowerCase().includes(q);
        const matchFeed = (r.feedback || '').toLowerCase().includes(q);
        if (!matchDone && !matchDate && !matchProj && !matchFeed) return false;
      }

      return true;
    });

    const isReportFiltersActive = reportSearch.trim() !== '' || reportTypeFilter !== 'all' || reportStatusFilter !== 'all' || reportProjectFilter !== 'all';

    // 3. Build Reports Rows
    const reportRows = filteredReports.map(r => {
      const status = (r.status || 'Pending').toLowerCase();
      const statusClass = status === 'approved' ? 'student-badge-success' : status === 'rejected' ? 'student-badge-danger' : 'student-badge-warning';
      const isWeekly = (r.type || '').toLowerCase() === 'weekly';
      const hasAttachment = Boolean(r.reportFile);
      const downloadLink = r.downloadUrl || (r.reportFile ? `http://127.0.0.1:8000/storage/${r.reportFile}` : null);
      const token = localStorage.getItem('token');
      const authenticatedDownloadUrl = downloadLink ? (downloadLink.includes('?') ? `${downloadLink}&token=${token}` : `${downloadLink}?token=${token}`) : '#';

      return `
        <tr style="vertical-align: top; border-bottom: 1px solid var(--border-color, #e2e8f0);">
          <td style="padding: 12px 14px;">
            <div style="font-weight: 600; font-size: 0.88rem; color: var(--text-main);">${r.date}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
              ${r.projectTitle || 'General'}
            </div>
          </td>
          <td style="padding: 12px 14px;">
            <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-start;">
              <span class="student-badge ${isWeekly ? 'student-badge-info' : ''}" style="display: inline-block; font-size: 0.75rem;">${r.type}</span>
              <span class="student-badge ${statusClass}" style="display: inline-block; font-size: 0.72rem;">${r.status || 'Pending'}</span>
            </div>
          </td>
          <td style="padding: 12px 14px;">
            <div style="font-size: 0.84rem; color: var(--text-main); line-height: 1.45; white-space: pre-wrap;">${r.workDone}</div>
            ${r.feedback ? `
              <div class="report-feedback-callout">
                <div class="report-feedback-header">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  <span>Supervisor Feedback:</span>
                </div>
                <div class="report-feedback-body">${r.feedback}</div>
              </div>
            ` : ''}
          </td>
          <td style="padding: 12px 14px; text-align: center;">
            ${hasAttachment ? `
              <a href="${authenticatedDownloadUrl}" target="_blank" download="${r.fileName || 'Report_Document'}" class="student-report-attachment-btn" title="Download ${r.fileName || 'Weekly Report File'}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                <span>${r.fileName ? (r.fileName.length > 14 ? r.fileName.substring(0, 11) + '...' : r.fileName) : 'Download'}</span>
              </a>
            ` : `
              <span style="color: #94a3b8; font-size: 0.8rem;">—</span>
            `}
          </td>
        </tr>
      `;
    }).join('');

    // 4. Filter Work Logs
    const filteredLogs = logs.filter(l => {
      if (logProjectFilter !== 'all' && l.project !== logProjectFilter) return false;
      if (logSearch.trim()) {
        const q = logSearch.toLowerCase().trim();
        const matchDesc = (l.description || '').toLowerCase().includes(q);
        const matchProj = (l.project || '').toLowerCase().includes(q);
        const matchDate = (l.date || '').toLowerCase().includes(q);
        if (!matchDesc && !matchProj && !matchDate) return false;
      }
      return true;
    });

    const isLogFiltersActive = logSearch.trim() !== '' || logProjectFilter !== 'all';
    const totalHours = logs.reduce((sum, log) => sum + parseFloat(log.hours || 0), 0);
    const filteredHours = filteredLogs.reduce((sum, log) => sum + parseFloat(log.hours || 0), 0);

    const logRows = filteredLogs.map(l => {
      const statusClass = l.status === 'approved' ? 'student-badge-success' : l.status === 'rejected' ? 'student-badge-danger' : 'student-badge-warning';
      return `
        <tr>
          <td>
            <div style="font-weight: 600;">${l.project}</div>
            <div style="font-size: 0.78rem; color: var(--text-light); margin-top: 2px;">${l.date}</div>
          </td>
          <td style="font-weight: 700; color: var(--primary);">${l.hours} hrs</td>
          <td style="font-size: 0.85rem; color: var(--text-muted); line-height:1.4;">${l.description}</td>
          <td>
            <span class="student-badge ${statusClass}">${l.status ? l.status.toUpperCase() : 'PENDING'}</span>
          </td>
        </tr>
      `;
    }).join('');

    // Today's date string in YYYY-MM-DD
    const todayStr = new Date().toISOString().split('T')[0];

    // Build overall layout
    container.innerHTML = `
      <div class="student-header">
        <h1>Reports & Work Logs</h1>
        <p>Log your daily working hours and submit regular Daily or Weekly Progress Reports to your supervisor.</p>
      </div>

      ${feedbackMessage ? `
        <div class="student-toast-alert ${feedbackMessage.type}">
          <span>${feedbackMessage.text}</span>
          <button id="btn-close-toast" class="student-toast-close">&times;</button>
        </div>
      ` : ''}

      <!-- Tab Buttons -->
      <div class="student-tabs">
        <button class="student-tab-btn ${activeTab === 'reports' ? 'active' : ''}" id="tab-reports">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          <span>Progress Reports</span>
        </button>
        <button class="student-tab-btn ${activeTab === 'logs' ? 'active' : ''}" id="tab-logs">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <span>Daily Work Logs</span>
        </button>
      </div>

      <!-- Tab Content -->
      <div id="tab-content-outlet">
        ${activeTab === 'reports' ? `
          <div class="student-split-pane" style="grid-template-columns: 1fr 1.65fr; gap: 24px; align-items: start;">
            <!-- Report Form -->
            <div class="student-card reports-form-card" style="height: fit-content;">
              <div class="student-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #059669;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                <span>Submit Progress Report</span>
              </div>
              <form id="report-form" class="student-form">
                <!-- Project Selection -->
                <div class="student-form-group">
                  <label for="rep-project">Project</label>
                  <select id="rep-project" class="student-select">
                    <option value="">-- Select Project --</option>
                    ${projectFormOptions}
                  </select>
                </div>

                <!-- Report Type -->
                <div class="student-form-group">
                  <label for="rep-type">Report Type</label>
                  <select id="rep-type" class="student-select">
                    <option value="Weekly" ${reportType === 'Weekly' ? 'selected' : ''}>Weekly Progress Report</option>
                    <option value="Daily" ${reportType === 'Daily' ? 'selected' : ''}>Daily Progress Report</option>
                  </select>
                  <span style="font-size:0.75rem; color:var(--text-muted); margin-top:4px; display:block;">
                    Weekly reports allow document attachment (PDF / Word).
                  </span>
                </div>

                <div class="student-form-group">
                  <label for="rep-date">Report Date</label>
                  <input type="date" id="rep-date" class="student-input" value="${todayStr}" required>
                </div>

                <div class="student-form-group">
                  <label for="rep-done">Work Completed & Summary</label>
                  <textarea id="rep-done" class="student-textarea" placeholder="Detail tasks completed, blockers, and next steps..." style="min-height: 110px;" required></textarea>
                </div>

                <!-- File Attachment Field: Shown ONLY for Weekly reports -->
                <div class="student-form-group" id="report-file-group" style="display: ${reportType === 'Weekly' ? 'block' : 'none'};">
                  <label style="display:flex; justify-content:space-between; align-items:center;">
                    <span>Weekly Report Document</span>
                    <span style="font-size:0.72rem; color:var(--primary); font-weight:600;">Allowed for Weekly only</span>
                  </label>

                  <!-- Custom Styled Dropzone -->
                  <div class="student-file-dropzone" id="report-dropzone" style="display: ${selectedReportFile ? 'none' : 'block'};">
                    <input type="file" id="report-file-input" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style="display:none;">
                    <div class="student-dropzone-inner" id="dropzone-clickable">
                      <div class="student-dropzone-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                      </div>
                      <div class="student-dropzone-text">
                        <strong>Click to upload</strong> or drag and drop
                      </div>
                      <div class="student-dropzone-hint">
                        PDF or DOCX documents only (Max: 10MB)
                      </div>
                    </div>
                  </div>

                  <!-- File Preview Card when file is selected -->
                  <div class="student-file-preview-card" id="report-file-preview" style="display: ${selectedReportFile ? 'flex' : 'none'};">
                    <div class="student-file-preview-info">
                      <div class="student-file-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                      </div>
                      <div>
                        <div class="student-file-name" id="preview-filename">${selectedReportFile ? selectedReportFile.name : ''}</div>
                        <div class="student-file-size" id="preview-filesize">${selectedReportFile ? formatBytes(selectedReportFile.size) : ''}</div>
                      </div>
                    </div>
                    <button type="button" class="student-btn-remove-file" id="btn-remove-file" title="Remove file">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>

                  <div id="file-error-msg" style="display:none; color:#dc2626; font-size:0.78rem; margin-top:6px; font-weight:500;"></div>
                </div>

                <button type="submit" id="btn-submit-report" class="student-btn student-btn-primary" style="justify-content:center; margin-top:8px; width: 100%;" ${formSubmitting ? 'disabled' : ''}>
                  ${formSubmitting ? 'Submitting Report...' : 'Submit Progress Report'}
                </button>
              </form>
            </div>

            <!-- Reports List Table -->
            <div class="student-card">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <div class="student-card-title" style="margin-bottom:0;">Submitted Progress Reports</div>
                <span class="student-badge student-badge-info" style="font-size:0.75rem;">
                  Showing ${filteredReports.length} of ${reports.length}
                </span>
              </div>

              <!-- Reports Filter Bar -->
              <div class="student-filter-bar">
                <div class="student-search-wrapper">
                  <svg class="student-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input type="text" id="rep-search-input" class="student-search-input" placeholder="Search work done, date, or feedback..." value="${reportSearch}">
                </div>

                <!-- Type Filter Pills -->
                <div class="student-filter-pills">
                  <button type="button" class="student-filter-pill ${reportTypeFilter === 'all' ? 'active' : ''}" data-type="all">All</button>
                  <button type="button" class="student-filter-pill ${reportTypeFilter === 'weekly' ? 'active' : ''}" data-type="weekly">Weekly</button>
                  <button type="button" class="student-filter-pill ${reportTypeFilter === 'daily' ? 'active' : ''}" data-type="daily">Daily</button>
                </div>

                <!-- Status Select -->
                <select id="rep-status-filter" class="student-filter-select">
                  <option value="all" ${reportStatusFilter === 'all' ? 'selected' : ''}>All Statuses</option>
                  <option value="pending" ${reportStatusFilter === 'pending' ? 'selected' : ''}>Pending</option>
                  <option value="approved" ${reportStatusFilter === 'approved' ? 'selected' : ''}>Approved</option>
                  <option value="rejected" ${reportStatusFilter === 'rejected' ? 'selected' : ''}>Rejected</option>
                </select>

                <!-- Project Select -->
                <select id="rep-proj-filter" class="student-filter-select">
                  <option value="all" ${reportProjectFilter === 'all' ? 'selected' : ''}>All Projects</option>
                  ${projectFilterOptions}
                </select>

                <!-- Reset Button -->
                ${isReportFiltersActive ? `
                  <button type="button" id="btn-clear-rep-filters" class="student-filter-btn-clear" title="Reset filters">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    Reset
                  </button>
                ` : ''}
              </div>

              <!-- Reports Table -->
              <div class="student-table-container">
                <table class="student-table" style="width: 100%;">
                  <thead>
                    <tr>
                      <th style="width: 22%;">Date & Project</th>
                      <th style="width: 18%;">Type & Status</th>
                      <th style="width: 44%;">Report Content</th>
                      <th style="width: 16%; text-align: center;">Attachment</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${reportRows || `
                      <tr>
                        <td colspan="4">
                          <div class="student-empty-filter">
                            <div class="student-empty-filter-icon">📑</div>
                            <div class="student-empty-filter-text">No reports match your filters</div>
                            <div class="student-empty-filter-sub">Try changing or clearing your search and filter parameters.</div>
                            <button type="button" id="btn-empty-clear-rep" class="student-btn student-btn-outline student-btn-sm" style="margin: 0 auto;">
                              Clear All Filters
                            </button>
                          </div>
                        </td>
                      </tr>
                    `}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ` : `
          <div class="student-split-pane" style="grid-template-columns: 1fr 1.5fr; gap: 24px; align-items: start;">
            <!-- Work Log Form -->
            <div class="student-card reports-form-card">
              <div class="student-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #059669;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span>Log Work Hours</span>
              </div>
              <form id="worklog-form" class="student-form">
                <div class="student-form-group">
                  <label for="log-project">Project</label>
                  <select id="log-project" class="student-select" required>
                    <option value="" disabled selected>Select project</option>
                    ${workLogProjectOptions}
                  </select>
                </div>

                <div class="student-form-group">
                  <label for="log-date">Work Date</label>
                  <input type="date" id="log-date" class="student-input" value="${todayStr}" required>
                </div>

                <div class="student-form-group">
                  <label for="log-hours">Hours Worked</label>
                  <input type="number" id="log-hours" class="student-input" min="0.5" max="24" step="0.5" placeholder="e.g. 4.5" required>
                </div>

                <div class="student-form-group">
                  <label for="log-desc">Work Description</label>
                  <textarea id="log-desc" class="student-textarea" placeholder="Briefly describe what tasks you worked on..." required></textarea>
                </div>

                <button type="submit" class="student-btn student-btn-primary" style="justify-content:center; margin-top:8px; width: 100%;">
                  Submit Log Entry
                </button>
              </form>
            </div>

            <!-- Work Logs List Table -->
            <div class="student-card">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
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
                <div class="student-search-wrapper">
                  <svg class="student-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input type="text" id="log-search-input" class="student-search-input" placeholder="Search description or date..." value="${logSearch}">
                </div>

                <select id="log-proj-filter" class="student-filter-select">
                  <option value="all" ${logProjectFilter === 'all' ? 'selected' : ''}>All Projects</option>
                  ${logProjectFilterOptions}
                </select>

                ${isLogFiltersActive ? `
                  <button type="button" id="btn-clear-log-filters" class="student-filter-btn-clear" title="Reset filters">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    Reset
                  </button>
                ` : ''}
              </div>

              <div class="student-table-container">
                <table class="student-table">
                  <thead>
                    <tr>
                      <th style="width: 25%;">Project & Date</th>
                      <th style="width: 15%;">Hours</th>
                      <th style="width: 45%;">Description</th>
                      <th style="width: 15%;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${logRows || `
                      <tr>
                        <td colspan="4">
                          <div class="student-empty-filter">
                            <div class="student-empty-filter-icon">⏰</div>
                            <div class="student-empty-filter-text">No work log entries found</div>
                            <div class="student-empty-filter-sub">Try changing your search or project filters.</div>
                            <button type="button" id="btn-empty-clear-log" class="student-btn student-btn-outline student-btn-sm" style="margin: 0 auto;">
                              Clear All Filters
                            </button>
                          </div>
                        </td>
                      </tr>
                    `}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `}
      </div>
    `;

    setupListeners();
  }

  function setupListeners() {
    // Close toast button
    container.querySelector('#btn-close-toast')?.addEventListener('click', () => {
      feedbackMessage = null;
      render();
    });

    // Tab Click listeners
    container.querySelector('#tab-reports')?.addEventListener('click', () => {
      activeTab = 'reports';
      render();
    });

    container.querySelector('#tab-logs')?.addEventListener('click', () => {
      activeTab = 'logs';
      render();
    });

    if (activeTab === 'reports') {
      const typeSelect = container.querySelector('#rep-type');
      const fileGroup = container.querySelector('#report-file-group');
      const fileInput = container.querySelector('#report-file-input');
      const dropzone = container.querySelector('#report-dropzone');
      const filePreview = container.querySelector('#report-file-preview');
      const fileError = container.querySelector('#file-error-msg');
      const removeBtn = container.querySelector('#btn-remove-file');

      // Filter event handlers for Reports
      const repSearchInput = container.querySelector('#rep-search-input');
      repSearchInput?.addEventListener('input', (e) => {
        reportSearch = e.target.value;
        render();
        const newInput = container.querySelector('#rep-search-input');
        if (newInput) {
          newInput.focus();
          newInput.setSelectionRange(newInput.value.length, newInput.value.length);
        }
      });

      container.querySelectorAll('.student-filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          reportTypeFilter = pill.getAttribute('data-type');
          render();
        });
      });

      container.querySelector('#rep-status-filter')?.addEventListener('change', (e) => {
        reportStatusFilter = e.target.value;
        render();
      });

      container.querySelector('#rep-proj-filter')?.addEventListener('change', (e) => {
        reportProjectFilter = e.target.value;
        render();
      });

      const clearRepFilters = () => {
        reportSearch = '';
        reportTypeFilter = 'all';
        reportStatusFilter = 'all';
        reportProjectFilter = 'all';
        render();
      };
      container.querySelector('#btn-clear-rep-filters')?.addEventListener('click', clearRepFilters);
      container.querySelector('#btn-empty-clear-rep')?.addEventListener('click', clearRepFilters);

      // 1. Report Type Change Listener
      typeSelect?.addEventListener('change', (e) => {
        reportType = e.target.value;
        if (reportType === 'Daily') {
          // Hide file attachment and clear file
          if (fileGroup) fileGroup.style.display = 'none';
          selectedReportFile = null;
          if (fileInput) fileInput.value = '';
          if (filePreview) filePreview.style.display = 'none';
          if (dropzone) dropzone.style.display = 'block';
          if (fileError) fileError.style.display = 'none';
        } else {
          // Show file attachment for Weekly
          if (fileGroup) fileGroup.style.display = 'block';
        }
      });

      // 2. File Selection & Validation
      function handleFile(file) {
        if (!file) return;

        const allowedExtensions = ['pdf', 'docx'];
        const ext = file.name.split('.').pop().toLowerCase();

        if (!allowedExtensions.includes(ext)) {
          showFileError('Invalid file type. Only PDF (.pdf) and Word (.docx) files are allowed.');
          fileInput.value = '';
          selectedReportFile = null;
          StudentSwal.fire({
            icon: 'error',
            title: 'Invalid File Format',
            text: 'Only PDF (.pdf) and Word (.docx) files are allowed for Weekly Progress Reports.',
            confirmButtonColor: '#059669'
          });
          return;
        }

        const maxSizeBytes = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSizeBytes) {
          showFileError(`File size exceeds 10MB limit (Selected file: ${formatBytes(file.size)}).`);
          fileInput.value = '';
          selectedReportFile = null;
          StudentSwal.fire({
            icon: 'warning',
            title: 'File Size Limit Exceeded',
            text: `The selected file (${formatBytes(file.size)}) exceeds the maximum allowed limit of 10MB.`,
            confirmButtonColor: '#059669'
          });
          return;
        }

        // Valid file
        selectedReportFile = file;
        hideFileError();
        render();
      }

      function showFileError(msg) {
        if (fileError) {
          fileError.textContent = msg;
          fileError.style.display = 'block';
        }
      }

      function hideFileError() {
        if (fileError) {
          fileError.textContent = '';
          fileError.style.display = 'none';
        }
      }

      container.querySelector('#dropzone-clickable')?.addEventListener('click', () => {
        fileInput?.click();
      });

      fileInput?.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleFile(e.target.files[0]);
        }
      });

      dropzone?.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('drag-over');
      });

      dropzone?.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
      });

      dropzone?.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFile(e.dataTransfer.files[0]);
        }
      });

      removeBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedReportFile = null;
        if (fileInput) fileInput.value = '';
        render();
      });

      // Submit Report Form
      const reportForm = container.querySelector('#report-form');
      reportForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const type = container.querySelector('#rep-type').value;
        const date = container.querySelector('#rep-date').value;
        const projectId = container.querySelector('#rep-project')?.value || '';
        const workDone = container.querySelector('#rep-done').value.trim();

        if (!type || !date || !workDone) {
          StudentSwal.fire({
            icon: 'warning',
            title: 'Missing Required Fields',
            text: 'Please enter report date and work done description.',
            confirmButtonColor: '#059669'
          });
          return;
        }

        formSubmitting = true;
        render();

        try {
          const formData = new FormData();
          formData.append('type', type);
          formData.append('date', date);
          formData.append('workDone', workDone);
          if (projectId) {
            formData.append('projectId', projectId);
          }

          // Attach file ONLY for Weekly reports
          if (type.toLowerCase() === 'weekly' && selectedReportFile) {
            formData.append('report_file', selectedReportFile);
          }

          await saveReport(formData);

          selectedReportFile = null;
          formSubmitting = false;
          feedbackMessage = { type: 'success', text: `${type} Progress Report submitted successfully!` };
          render();

          StudentSwal.fire({
            icon: 'success',
            title: 'Report Submitted!',
            text: `${type} Progress Report for ${date} has been submitted successfully to your supervisor.`,
            confirmButtonColor: '#059669'
          });
        } catch (err) {
          formSubmitting = false;
          feedbackMessage = { type: 'error', text: err.message || 'Failed to submit report. Please try again.' };
          render();

          StudentSwal.fire({
            icon: 'error',
            title: 'Submission Failed',
            text: err.message || 'Failed to submit report. Please try again.',
            confirmButtonColor: '#059669'
          });
        }
      });
    }

    if (activeTab === 'logs') {
      // Work Logs Filters
      const logSearchInput = container.querySelector('#log-search-input');
      logSearchInput?.addEventListener('input', (e) => {
        logSearch = e.target.value;
        render();
        const newInput = container.querySelector('#log-search-input');
        if (newInput) {
          newInput.focus();
          newInput.setSelectionRange(newInput.value.length, newInput.value.length);
        }
      });

      container.querySelector('#log-proj-filter')?.addEventListener('change', (e) => {
        logProjectFilter = e.target.value;
        render();
      });

      const clearLogFilters = () => {
        logSearch = '';
        logProjectFilter = 'all';
        render();
      };
      container.querySelector('#btn-clear-log-filters')?.addEventListener('click', clearLogFilters);
      container.querySelector('#btn-empty-clear-log')?.addEventListener('click', clearLogFilters);

      const workLogForm = container.querySelector('#worklog-form');
      workLogForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const project = container.querySelector('#log-project').value;
        const date = container.querySelector('#log-date').value;
        const hours = parseFloat(container.querySelector('#log-hours').value);
        const description = container.querySelector('#log-desc').value.trim();

        if (!project || !date || isNaN(hours) || !description) {
          StudentSwal.fire({
            icon: 'warning',
            title: 'Incomplete Entry',
            text: 'Please fill in all project, date, hours, and description fields.',
            confirmButtonColor: '#059669'
          });
          return;
        }

        try {
          await saveWorkLog({ project, date, hours, description });
          feedbackMessage = { type: 'success', text: 'Work log recorded successfully.' };
          render();

          StudentSwal.fire({
            icon: 'success',
            title: 'Work Log Saved!',
            text: `Recorded ${hours} hours worked on ${project} for ${date}.`,
            timer: 2500,
            showConfirmButton: false,
            timerProgressBar: true
          });
        } catch (err) {
          feedbackMessage = { type: 'error', text: err.message || 'Failed to save work log.' };
          render();

          StudentSwal.fire({
            icon: 'error',
            title: 'Error Saving Work Log',
            text: err.message || 'Failed to save work log.',
            confirmButtonColor: '#059669'
          });
        }
      });
    }
  }

  render();
  return container;
}

export default StudentReports;
