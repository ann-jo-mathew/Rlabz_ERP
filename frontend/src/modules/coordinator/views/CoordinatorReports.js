import { authStore } from '@/core/stores/auth.js';
import html2pdf from 'html2pdf.js';
import { API_BASE } from '@/core/config/api.js';

function getAuthToken() {
  return authStore?.token || localStorage.getItem('token') || localStorage.getItem('access_token') || null;
}

function formatLabel(value, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getCompletion(project) {
  const modules = Array.isArray(project?.modules) ? project.modules : [];
  const tasks = modules.flatMap((module) => Array.isArray(module.tasks) ? module.tasks : []);
  const total = tasks.length;
  const completed = tasks.filter((task) => String(task.status || '').toLowerCase() === 'completed').length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  return { total, completed, percent };
}

async function fetchProjects() {
  const token = getAuthToken();
  if (!token) return [];

  const resp = await fetch(`${API_BASE}/coordinator/projects`, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.ok) return [];
  const body = await resp.json().catch(() => ({}));
  return Array.isArray(body?.data) ? body.data : [];
}

function buildReportBodyHtml(project) {
  const completion = getCompletion(project);
  const students = Array.isArray(project.students) ? project.students : [];
  const faculty = Array.isArray(project.faculty) ? project.faculty : [];
  const requirements = Array.isArray(project.requirements) ? project.requirements : [];
  const modules = Array.isArray(project.modules) ? project.modules : [];
  const closure = project.closure || null;

  return `
    <h4>Project Overview</h4>
    <p><strong>Project Type:</strong> ${formatLabel(project.project_type)}</p>
    <p><strong>Source:</strong> ${formatLabel(project.source_type)}${project.brought_by ? ` (${project.brought_by})` : ''}</p>
    <p><strong>Status:</strong> ${formatLabel(project.status)}</p>
    <p><strong>Priority:</strong> ${formatLabel(project.priority)}</p>
    <p><strong>Budget:</strong> ${project.budget ? `₹${Number(project.budget).toLocaleString('en-IN')}` : '—'}</p>
    <p><strong>Expected Timeline:</strong> ${formatDate(project.expected_timeline)}</p>
    <p><strong>Description:</strong> ${project.requirements_text || '—'}</p>
    <p><strong>Deliverables:</strong> ${project.deliverables || '—'}</p>

    <hr>
    <h4>Client Information</h4>
    <p><strong>Client:</strong> ${project.client_name || '—'}</p>
    <p><strong>Contact Email:</strong> ${project.contact_email || '—'}</p>
    <p><strong>Contact Phone:</strong> ${project.contact_phone || '—'}</p>

    <hr>
    <h4>Assigned Students (${students.length})</h4>
    ${students.length
      ? students.map((s) => `<p>• ${s.name}${s.pivot?.role ? ` — ${formatLabel(s.pivot.role)}` : ''}${s.email ? ` (${s.email})` : ''}</p>`).join('')
      : '<p style="color:#6b7280;">No students assigned.</p>'}

    <hr>
    <h4>Assigned Faculty (${faculty.length})</h4>
    ${faculty.length
      ? faculty.map((f) => `<p>• ${f.name}${f.email ? ` (${f.email})` : ''}</p>`).join('')
      : '<p style="color:#6b7280;">No faculty assigned.</p>'}

    <hr>
    <h4>Modules &amp; Progress</h4>
    <p>${completion.completed} of ${completion.total} tasks completed (${completion.percent}%)</p>
    ${modules.length
      ? modules.map((m) => `<p><strong>${m.module_name || m.name || 'Module'}</strong> — ${formatLabel(m.status)}</p>`).join('')
      : '<p style="color:#6b7280;">No modules recorded.</p>'}

    <hr>
    <h4>Requirements</h4>
    ${requirements.length
      ? requirements.map((r) => `<p>• ${r.description}</p>`).join('')
      : '<p style="color:#6b7280;">No requirements recorded.</p>'}

    ${closure ? `
      <hr>
      <h4>Project Closure</h4>
      <p><strong>Final Status:</strong> ${formatLabel(closure.final_status)}</p>
      <p><strong>Closure Date:</strong> ${formatDate(closure.closure_date)}</p>
      <p><strong>Remarks:</strong> ${closure.remarks || '—'}</p>
    ` : ''}
  `;
}

async function downloadReportPdf(project, btn) {
  const originalText = btn.textContent;
  btn.textContent = 'Generating...';
  btn.disabled = true;

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'font-family:Arial,sans-serif;color:#1a1a1a;padding:40px;max-width:950px;margin:0 auto;';
  wrapper.innerHTML = `
    <div style="border-bottom:3px solid #1e3a8a;padding-bottom:14px;margin-bottom:24px;">
      <div style="font-size:22px;font-weight:900;color:#1e3a8a;margin-bottom:4px;">RLabZ — Project Report</div>
      <div style="font-size:13px;font-weight:700;color:#333;">${project.title}</div>
      <div style="font-size:12px;color:#888;margin-top:4px;">Generated: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>
    ${buildReportBodyHtml(project)}
    <div style="margin-top:30px;text-align:center;font-size:10px;color:#bbb;border-top:1px solid #e2e8f0;padding-top:12px;">
      This is a system-generated report from RLabZ ERP. Data is indicative and subject to final verification.
    </div>
  `;

  try {
    await html2pdf().set({
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `RLabZ_${String(project.title).replace(/\s+/g, '_')}_Report.pdf`,
      image: { type: 'jpeg', quality: 0.97 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'css', avoid: 'p' },
    }).from(wrapper).save();
  } catch (err) {
    alert('PDF generation failed: ' + err.message);
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

export function CoordinatorReports(route, router) {
  const container = document.createElement('div');

  let projects = [];
  let loadError = null;

  function render() {
    container.innerHTML = `
      <div class="certificates-page">

        <div class="certificates-header">
          <div>
            <h1>Project Reports</h1>
            <p>View and download a full PDF report for every project.</p>
          </div>
        </div>

        <div class="cert-stats">
          <div class="cert-stat-card">
            <span>Total Projects</span>
            <strong id="stat-total">0</strong>
          </div>
          <div class="cert-stat-card">
            <span>Closed</span>
            <strong id="stat-closed">0</strong>
          </div>
          <div class="cert-stat-card">
            <span>In Progress</span>
            <strong id="stat-in-progress">0</strong>
          </div>
          <div class="cert-stat-card">
            <span>Proposed</span>
            <strong id="stat-proposed">0</strong>
          </div>
        </div>

        <div class="cert-panel">
          <div class="cert-panel-header">
            <div>
              <h2>Project Documentation</h2>
              <p>Download a PDF report generated from live project data.</p>
            </div>
            <input type="text" id="report-search" placeholder="Search projects..." />
          </div>

          <div class="cert-table-wrapper">
            <table class="cert-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Expected Timeline</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="reports-table-body"></tbody>
            </table>
          </div>
        </div>

        <div id="report-modal-root"></div>

      </div>
    `;

    fetchProjects()
      .then((data) => {
        projects = data;
        updateStats(projects);
        renderReports(projects);
      })
      .catch((err) => {
        loadError = err.message || 'Failed to load projects';
        const tbody = container.querySelector('#reports-table-body');
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#b91c1c;">${loadError}</td></tr>`;
      });

    container.querySelector('#report-search')?.addEventListener('input', (e) => {
      const search = e.target.value.toLowerCase();
      const filtered = projects.filter((p) =>
        (p.title || '').toLowerCase().includes(search) ||
        (p.client_name || '').toLowerCase().includes(search)
      );
      renderReports(filtered);
    });
  }

  function updateStats(data) {
    container.querySelector('#stat-total').textContent = data.length;
    container.querySelector('#stat-closed').textContent = data.filter((p) => p.status === 'closed').length;
    container.querySelector('#stat-in-progress').textContent = data.filter((p) => p.status === 'in_progress').length;
    container.querySelector('#stat-proposed').textContent = data.filter((p) => p.status === 'proposed').length;
  }

  function renderReports(data) {
    const tbody = container.querySelector('#reports-table-body');
    if (!tbody) return;

    if (!data.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:2rem;">
            No projects found.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = data.map((project) => {
      const completion = getCompletion(project);
      return `
        <tr>
          <td><strong>${project.title}</strong></td>
          <td>${project.client_name || '—'}</td>
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <div style="width:80px; height:6px; background:#e5e7eb; border-radius:10px; overflow:hidden;">
                <div style="width:${completion.percent}%; height:100%; background:#2563eb;"></div>
              </div>
              <span>${completion.percent}%</span>
            </div>
          </td>
          <td>
            <span class="cert-status ${project.status === 'closed' ? 'issued' : 'pending'}">
              ${formatLabel(project.status)}
            </span>
          </td>
          <td>${formatDate(project.expected_timeline)}</td>
          <td>
            <button class="cert-action" data-project-id="${project.id}">View / Download</button>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.cert-action').forEach((button) => {
      button.addEventListener('click', () => {
        const id = Number(button.dataset.projectId);
        const project = data.find((p) => p.id === id) || projects.find((p) => p.id === id);
        if (project) showReport(project);
      });
    });
  }

  function showReport(project) {
    const modalRoot = container.querySelector('#report-modal-root');
    if (!modalRoot) return;

    modalRoot.innerHTML = `
      <div class="director-modal-overlay">
        <div class="director-modal" style="max-width:850px; width:95%; max-height:85vh; overflow-y:auto;">

          <div class="director-modal-header">
            <div>
              <h3>${project.title}</h3>
              <p style="margin:5px 0 0; color:#6b7280;">${project.client_name || 'Client information unavailable'}</p>
            </div>
            <button class="btn-director btn-director-outline" id="close-report">✕</button>
          </div>

          <div class="director-modal-body">
            ${buildReportBodyHtml(project)}
          </div>

          <div class="director-modal-footer">
            <button class="cert-primary-btn" id="download-report">Download PDF Report</button>
            <button class="cert-outline-btn" id="close-report-btn">Close</button>
          </div>

        </div>
      </div>
    `;

    modalRoot.querySelector('#close-report')?.addEventListener('click', () => { modalRoot.innerHTML = ''; });
    modalRoot.querySelector('#close-report-btn')?.addEventListener('click', () => { modalRoot.innerHTML = ''; });
    modalRoot.querySelector('#download-report')?.addEventListener('click', (e) => downloadReportPdf(project, e.currentTarget));
  }

  render();

  return container;
}

export default CoordinatorReports;
