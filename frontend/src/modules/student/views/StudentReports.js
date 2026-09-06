import { renderStudentSidebar } from './StudentSidebar.js';
import { getProjects, getReports, getWorkLogs, saveReport, saveWorkLog, ensureDataLoaded } from './studentStore.js';
import '../student.css';

export async function StudentReports(route, router) {
  await ensureDataLoaded();
  renderStudentSidebar();

  const container = document.createElement('div');
  container.className = 'student-portal-container animate-fade-in';

  let activeTab = 'reports'; // 'reports' or 'logs'

  function render() {
    const projects = getProjects();
    const reports = getReports();
    const logs = getWorkLogs();

    // 1. Build Project Options HTML
    const projectOptions = projects.map(p => `<option value="${p.title}">${p.title}</option>`).join('');

    // 2. Build Reports Rows
    const reportRows = reports.map(r => {
      const statusClass = r.status === 'Approved' ? 'student-badge-success' : r.status === 'Rejected' ? 'student-badge-danger' : 'student-badge-warning';
      return `
        <tr style="vertical-align: top;">
          <td>
            <div style="font-weight: 600; font-size: 0.85rem; color: var(--text-main);">${r.date}</div>
          </td>
          <td>
            <span class="student-badge student-badge-info" style="margin-bottom: 4px; display: inline-block;">${r.type}</span>
            <span class="student-badge ${statusClass}" style="display: inline-block;">${r.status || 'Pending'}</span>
          </td>
          <td>
            <div style="font-weight: 600; font-size: 0.85rem; color: var(--text-main);">Work Done:</div>
            <div style="font-size: 0.825rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 6px;">${r.workDone}</div>
            ${r.feedback ? `
              <div style="background: #f8fafc; border: 1px solid var(--border-color); padding: 8px 12px; border-radius: 4px; font-size: 0.8rem; margin-top: 6px;">
                <strong style="color: var(--primary);">Supervisor Feedback:</strong>
                <span style="color: var(--text-muted);">${r.feedback}</span>
              </div>
            ` : ''}
          </td>
        </tr>
      `;
    }).join('');

    // 3. Build Work Logs Rows
    const totalHours = logs.reduce((sum, log) => sum + parseFloat(log.hours || 0), 0);
    const logRows = logs.map(l => {
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
        <p>Log your working hours and submit regular progress updates to your supervisor.</p>
      </div>

      <!-- Tab Buttons -->
      <div class="student-tabs">
        <button class="student-tab-btn ${activeTab === 'reports' ? 'active' : ''}" id="tab-reports">Progress Reports</button>
        <button class="student-tab-btn ${activeTab === 'logs' ? 'active' : ''}" id="tab-logs">Daily Work Logs</button>
      </div>

      <!-- Tab Content -->
      <div id="tab-content-outlet">
        ${activeTab === 'reports' ? `
          <div class="student-split-pane" style="grid-template-columns: 1fr 1.5fr;">
            <!-- Report Form -->
            <div class="student-card">
              <div class="student-card-title">Submit Progress Report</div>
              <form id="report-form" class="student-form">
                <div class="student-form-group">
                  <label for="rep-type">Report Type</label>
                  <select id="rep-type" class="student-select" required>
                    <option value="Daily">Daily Report</option>
                    <option value="Weekly" selected>Weekly Report</option>
                  </select>
                </div>

                <div class="student-form-group">
                  <label for="rep-date">Report Date</label>
                  <input type="date" id="rep-date" class="student-input" value="${todayStr}" required>
                </div>

                <div class="student-form-group">
                  <label for="rep-done">Work Done</label>
                  <textarea id="rep-done" class="student-textarea" placeholder="Detail tasks completed..." required></textarea>
                </div>

                <button type="submit" class="student-btn student-btn-primary" style="justify-content:center; margin-top:8px;">
                  Submit Progress Report
                </button>
              </form>
            </div>

            <!-- Reports List Table -->
            <div class="student-card">
              <div class="student-card-title">Submitted Progress Reports</div>
              <div class="student-table-container">
                <table class="student-table">
                  <thead>
                    <tr>
                      <th style="width: 25%;">Date</th>
                      <th style="width: 20%;">Type</th>
                      <th style="width: 55%;">Report Content</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${reportRows || '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);">No reports submitted.</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ` : `
          <div class="student-split-pane" style="grid-template-columns: 1fr 1.5fr;">
            <!-- Work Log Form -->
            <div class="student-card">
              <div class="student-card-title">Log Work Hours</div>
              <form id="worklog-form" class="student-form">
                <div class="student-form-group">
                  <label for="log-project">Project</label>
                  <select id="log-project" class="student-select" required>
                    <option value="" disabled selected>Select project</option>
                    ${projectOptions}
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

                <button type="submit" class="student-btn student-btn-primary" style="justify-content:center; margin-top:8px;">
                  Submit Log Entry
                </button>
              </form>
            </div>

            <!-- Work Logs List Table -->
            <div class="student-card">
              <div class="student-card-title" style="display:flex; justify-content:space-between; align-items:center;">
                <span>Daily Log History</span>
                <span class="student-badge student-badge-success" style="font-size:0.85rem; padding: 6px 12px;">Total Hours: ${totalHours} hrs</span>
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
                    ${logRows || '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">No log entries recorded.</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `}
      </div>
    `;

    // Bind Tab Click listeners
    container.querySelector('#tab-reports')?.addEventListener('click', () => {
      activeTab = 'reports';
      render();
    });

    container.querySelector('#tab-logs')?.addEventListener('click', () => {
      activeTab = 'logs';
      render();
    });

    // Bind Forms Submit listeners
    const reportForm = container.querySelector('#report-form');
    reportForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const type = container.querySelector('#rep-type').value;
      const date = container.querySelector('#rep-date').value;
      const workDone = container.querySelector('#rep-done').value.trim();

      if (!type || !date || !workDone) return;

      await saveReport({ type, date, workDone });
      render();
    });

    const workLogForm = container.querySelector('#worklog-form');
    workLogForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const project = container.querySelector('#log-project').value;
      const date = container.querySelector('#log-date').value;
      const hours = parseFloat(container.querySelector('#log-hours').value);
      const description = container.querySelector('#log-desc').value.trim();

      if (!project || !date || isNaN(hours) || !description) return;

      await saveWorkLog({ project, date, hours, description });
      render();
    });
  }

  render();
  return container;
}

export default StudentReports;
