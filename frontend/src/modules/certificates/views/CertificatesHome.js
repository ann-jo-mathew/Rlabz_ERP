import { authStore } from '@/core/stores/auth.js';
import '../certificates.css';

export function CertificatesHome(route, router) {
  const container = document.createElement('div');

  let certificates = [];

  function getAuthToken() {
    return authStore?.token || localStorage.getItem('token') || localStorage.getItem('access_token') || null;
  }

  async function fetchCertificates() {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');

    const resp = await fetch('http://127.0.0.1:8000/api/certificates', {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      throw new Error(body.error || 'Failed to load certificates');
    }

    const data = await resp.json();
    const raw = Array.isArray(data?.data) ? data.data : [];
    certificates = raw.map(normalizeCertificate);
    return certificates;
  }

  function normalizeCertificate(cert) {
    return {
      id: cert.id,
      student: cert.student?.name || 'Unknown student',
      studentEmail: cert.student?.email || '',
      project: cert.project?.title || 'Unknown project',
      module: cert.module?.module_name || '',
      certificateNumber: cert.certificate_number,
      description: cert.description,
      date: cert.issue_date,
      issuer: cert.issuer?.name || '',
      status: 'Issued',
    };
  }

  const reports = [
    {
      id: 1,
      project: 'Hospital Management System',
      description: 'Final report and code handover documentation',
      date: '12 Aug 2026',
      status: 'Completed'
    },
    {
      id: 2,
      project: 'Campus ERP',
      description: 'Final project documentation',
      date: '10 Aug 2026',
      status: 'Completed'
    },
    {
      id: 3,
      project: 'Student Portal',
      description: 'Final report pending submission',
      date: '-',
      status: 'Pending'
    }
  ];

  function render() {
    container.innerHTML = `
      <div class="certificates-page">

        <!-- HEADER -->
        <div class="certificates-header">
          <div>
            <h1>Certificates & Reporting</h1>
            <p>
              Generate, manage and retrieve project certificates and final reports.
            </p>
          </div>

          <button class="cert-primary-btn" id="issue-certificate-btn">
            + Issue Certificate
          </button>
        </div>

        <!-- STATISTICS -->
        <div class="cert-stats">

          <div class="cert-stat-card">
            <span>Total Certificates</span>
            <strong>${certificates.length}</strong>
          </div>

          <div class="cert-stat-card">
            <span>Issued</span>
            <strong>
              ${certificates.filter(c => c.status === 'Issued').length}
            </strong>
          </div>

          <div class="cert-stat-card">
            <span>Pending</span>
            <strong>
              ${certificates.filter(c => c.status === 'Pending').length}
            </strong>
          </div>

          <div class="cert-stat-card">
            <span>Final Reports</span>
            <strong>${reports.length}</strong>
          </div>

        </div>

        <!-- CERTIFICATES -->
        <div class="cert-panel">

          <div class="cert-panel-header">
            <div>
              <h2>Project Certificates</h2>
              <p>Certificates issued to students who completed projects.</p>
            </div>

            <input
              type="text"
              id="certificate-search"
              placeholder="Search student or project..."
            />
          </div>

          <div class="cert-table-wrapper">

            <table class="cert-table">

              <thead>
                <tr>
                  <th>Student</th>
                  <th>Project</th>
                  <th>Certificate No.</th>
                  <th>Issue Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody id="certificate-table-body"></tbody>

            </table>

          </div>

        </div>

        <!-- REPORTS -->
        <div class="cert-panel">

          <div class="cert-panel-header">

            <div>
              <h2>Final Project Reports</h2>
              <p>
                Final reports and code handover documentation submitted when
                projects are closed.
              </p>
            </div>

            <input
              type="text"
              id="report-search"
              placeholder="Search projects..."
            />

          </div>

          <div id="report-list" class="report-list"></div>

        </div>

        <!-- ISSUE CERTIFICATE MODAL -->
        <div id="certificate-modal-root"></div>

      </div>
    `;

    // fetch live certificates then render
    fetchCertificates().then(() => renderCertificates(certificates)).catch((err) => {
      console.error(err);
      const tbody = container.querySelector('#certificate-table-body');
      if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#b91c1c;">${err.message}</td></tr>`;
    });

    renderReports(reports);

    // Search certificates
    container
      .querySelector('#certificate-search')
      ?.addEventListener('input', (e) => {
        const search = e.target.value.toLowerCase();

        const filtered = certificates.filter(c =>
          c.student.toLowerCase().includes(search) ||
          c.project.toLowerCase().includes(search)
        );

        renderCertificates(filtered);
      });

    // Search reports
    container
      .querySelector('#report-search')
      ?.addEventListener('input', (e) => {
        const search = e.target.value.toLowerCase();

        const filtered = reports.filter(r =>
          r.project.toLowerCase().includes(search)
        );

        renderReports(filtered);
      });

    // Issue certificate
    container
      .querySelector('#issue-certificate-btn')
      ?.addEventListener('click', showIssueModal);
  }

  function renderCertificates(data) {
    const tbody = container.querySelector('#certificate-table-body');

    if (!tbody) return;

    if (data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:2rem;">
            No certificates found.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = data.map(cert => `

      <tr>

        <td>
          <strong>${cert.student}</strong>
        </td>

        <td>${cert.project}${cert.module ? `<br><small style="color:#6b7280;">${cert.module}</small>` : ''}</td>

        <td>${cert.certificateNumber}</td>

        <td>${cert.date}</td>

        <td>
          <span class="cert-status ${cert.status.toLowerCase()}">
            ${cert.status}
          </span>
        </td>

        <td>

          <button
            class="cert-action"
            data-id="${cert.id}"
            data-action="${cert.status === 'Pending' ? 'review' : 'view'}"
          >
            ${cert.status === 'Pending' ? 'Review' : 'View'}
          </button>

        </td>

      </tr>

    `).join('');

    tbody.querySelectorAll('.cert-action').forEach(button => {
      button.addEventListener('click', async () => {
        const id = Number(button.dataset.id);
        try {
          const token = getAuthToken();
          if (!token) throw new Error('Authentication required');
          const resp = await fetch(`http://127.0.0.1:8000/api/certificates/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!resp.ok) {
            const body = await resp.json().catch(() => ({}));
            throw new Error(body.error || 'Failed to load certificate');
          }
          const body = await resp.json();
          const cert = normalizeCertificate(body?.data || body);
          showCertificateDetails(cert);
        } catch (err) {
          console.error(err);
          alert(err.message || 'Unable to load certificate details');
        }
      });
    });
  }

  function renderReports(data) {
    const reportList = container.querySelector('#report-list');
    if (!reportList) return;

    if (data.length === 0) {
      reportList.innerHTML = `
        <div style="padding:2rem; text-align:center; color:#6b7280;">
          No reports found.
        </div>
      `;
      return;
    }

    reportList.innerHTML = data.map(report => `
      <div class="report-item">

        <div>

          <strong>${report.project}</strong>

          <p>${report.description}</p>

          <small>
            ${report.date} • ${report.status}
          </small>

        </div>

        <button
          class="cert-action"
          data-report-id="${report.id}"
        >
          View Report
        </button>

      </div>
    `).join('');

    reportList.querySelectorAll('.cert-action').forEach(button => {
      button.addEventListener('click', () => {
        const id = Number(button.dataset.reportId);
        const report = reports.find(r => r.id === id);
        if (report) showReportDetails(report);
      });
    });
  }

  function showCertificateDetails(certificate) {
    const modalRoot =
      container.querySelector('#certificate-modal-root');

    modalRoot.innerHTML = `
    <div class="director-modal-overlay">
      <div class="director-modal">

        <div class="director-modal-header">
          <h3>Certificate Preview</h3>

          <button
            class="btn-director btn-director-outline"
            id="close-cert-modal"
          >
            ✕
          </button>
        </div>

        <div class="director-modal-body">

          <div
            style="
              background: white;
              border: 6px solid #1e3a8a;
              padding: 40px;
              text-align: center;
              margin: 10px;
            "
          >

            <p
              style="
                letter-spacing: 4px;
                font-weight: bold;
              "
            >
              RLABZ
            </p>

            <h1>
              CERTIFICATE
            </h1>

            <h2>
              OF PROJECT COMPLETION
            </h2>

            <p>
              This is to certify that
            </p>

            <h2>
              ${certificate.student}
            </h2>

            <p>
              ${
                certificate.description ||
                'Successfully completed the assigned project module.'
              }
            </p>

            <p>
              <strong>Project:</strong>
              ${certificate.project}
            </p>

            ${certificate.module ? `
            <p>
              <strong>Module:</strong>
              ${certificate.module}
            </p>
            ` : ''}

            <p>
              <strong>Certificate No:</strong>
              ${
                certificate.certificateNumber ||
                'CERT-2026-001'
              }
            </p>

            <p>
              <strong>Issue Date:</strong>
              ${certificate.date}
            </p>

            <br>

            <p>
              <strong>Coordinator</strong>
              <br>
              Authorized Signatory
            </p>

          </div>

        </div>

        <div class="director-modal-footer">

          <button
            class="cert-primary-btn"
            id="download-certificate"
          >
            Print Certificate
          </button>

          <button
            class="btn-director btn-director-outline"
            id="close-cert-footer"
          >
            Close
          </button>

        </div>

      </div>
    </div>
  `;

    modalRoot
      .querySelector('#close-cert-modal')
      ?.addEventListener('click', () => {
        modalRoot.innerHTML = '';
      });

    modalRoot
      .querySelector('#close-cert-footer')
      ?.addEventListener('click', () => {
        modalRoot.innerHTML = '';
      });

    modalRoot
      .querySelector('#download-certificate')
      ?.addEventListener('click', () => {
      alert(
  'Certificate for ' + certificate.student + ' is ready for printing.'
);
      });
  }

  function showReportDetails(report) {
    const modalRoot = container.querySelector('#certificate-modal-root');

    modalRoot.innerHTML = `

      <div class="director-modal-overlay">

        <div class="director-modal">

          <div class="director-modal-header">

            <h3>${report.project}</h3>

            <button
              class="btn-director btn-director-outline"
              id="close-report-modal"
            >
              ✕
            </button>

          </div>

          <div class="director-modal-body">

            <p>
              <strong>Documentation:</strong>
              ${report.description}
            </p>

            <p>
              <strong>Status:</strong>
              ${report.status}
            </p>

            <p>
              <strong>Date:</strong>
              ${report.date}
            </p>

            <hr>

            <p>
              Final project report and code handover documentation
              would be attached here when connected to the backend.
            </p>

          </div>

          <div class="director-modal-footer">

            <button
              class="cert-primary-btn"
              id="close-report-btn"
            >
              Close
            </button>

          </div>

        </div>

      </div>
    `;

    modalRoot
      .querySelector('#close-report-modal')
      ?.addEventListener('click', () => {
        modalRoot.innerHTML = '';
      });

    modalRoot
      .querySelector('#close-report-btn')
      ?.addEventListener('click', () => {
        modalRoot.innerHTML = '';
      });
  }

  function showIssueModal() {
    const modalRoot = container.querySelector('#certificate-modal-root');
    const today = new Date().toISOString().slice(0, 10);

    modalRoot.innerHTML = `
      <div class="director-modal-overlay">
        <div class="director-modal">
          <div class="director-modal-header">
            <h3>Issue Single Certificate</h3>
            <button class="btn-director btn-director-outline" id="close-issue-modal">✕</button>
          </div>

          <div class="director-modal-body">

            <div style="margin-bottom:0.5rem;">
              <label><strong>Project</strong></label>
              <select id="certificate-project"><option value="">Loading projects...</option></select>
            </div>

            <div style="margin-bottom:0.5rem;">
              <label><strong>Module</strong></label>
              <select id="certificate-module"><option value="">Select project first</option></select>
            </div>

            <div style="margin-bottom:0.5rem;">
              <label><strong>Student</strong></label>
              <select id="certificate-student"><option value="">Select module first</option></select>
            </div>

            <div style="margin-bottom:0.5rem;">
              <label><strong>Issue Date</strong></label>
              <input id="certificate-date" type="date" value="${today}" />
            </div>

            <div style="margin-bottom:0.5rem;">
              <label><strong>Certificate File (optional)</strong></label>
              <input id="certificate-file" type="text" placeholder="Path/URL to certificate file, if any" />
            </div>

            <p style="font-size:0.8rem;color:#6b7280;">Certificate number and description are generated automatically.</p>

            <div id="issue-error" style="color:#b91c1c;margin-top:0.5rem;"></div>

          </div>

          <div class="director-modal-footer">
            <button class="btn-director btn-director-outline" id="cancel-issue">Cancel</button>
            <button class="cert-primary-btn" id="confirm-issue">Issue Certificate</button>
          </div>
        </div>
      </div>
    `;

    // Close handlers
    modalRoot.querySelector('#close-issue-modal')?.addEventListener('click', () => { modalRoot.innerHTML = ''; });
    modalRoot.querySelector('#cancel-issue')?.addEventListener('click', () => { modalRoot.innerHTML = ''; });

    // Helpers
    async function fetchProjects() {
      const token = getAuthToken();
      const resp = await fetch('http://127.0.0.1:8000/api/coordinator/projects', {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (!resp.ok) return [];
      const body = await resp.json().catch(() => ({}));
      return Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []);
    }

    async function fetchProjectDetail(projectId) {
      const token = getAuthToken();
      const resp = await fetch(`http://127.0.0.1:8000/api/coordinator/projects/${projectId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (!resp.ok) return null;
      const body = await resp.json().catch(() => ({}));
      return body?.data?.project || body?.project || null;
    }

    async function fetchModuleEligibleStudents(moduleId) {
      const token = getAuthToken();
      const resp = await fetch(`http://127.0.0.1:8000/api/certificates/modules/${moduleId}/eligible-students`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (!resp.ok) return { data: [], module_status: null };
      const body = await resp.json().catch(() => ({}));
      return { data: Array.isArray(body?.data) ? body.data : [], module_status: body?.module_status };
    }

    async function postCertificate(payload) {
      const token = getAuthToken();
      const resp = await fetch('http://127.0.0.1:8000/api/certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        let errMsg = body.error || body.message;
        if (body.errors && typeof body.errors === 'object') {
          errMsg = Object.values(body.errors).flat().join(', ');
        }
        throw new Error(errMsg || 'Failed to issue certificate');
      }
      return body;
    }

    // Populate projects select
    (async () => {
      const projectSelect = modalRoot.querySelector('#certificate-project');
      const moduleSelect = modalRoot.querySelector('#certificate-module');
      const studentSelect = modalRoot.querySelector('#certificate-student');
      projectSelect.innerHTML = `<option value="">Select a project</option>`;
      try {
        const projects = await fetchProjects();
        projects.forEach(p => {
          const opt = document.createElement('option');
          opt.value = p.id;
          opt.textContent = p.title || p.client_name || `Project ${p.id}`;
          projectSelect.appendChild(opt);
        });
      } catch (err) {
        projectSelect.innerHTML = `<option value="">Unable to load projects</option>`;
      }

      // When project selected, populate that project's modules
      projectSelect.addEventListener('change', async () => {
        const pid = projectSelect.value;
        moduleSelect.innerHTML = `<option value="">Loading modules...</option>`;
        studentSelect.innerHTML = `<option value="">Select module first</option>`;
        if (!pid) {
          moduleSelect.innerHTML = `<option value="">Select project first</option>`;
          return;
        }
        try {
          const project = await fetchProjectDetail(pid);
          const modules = Array.isArray(project?.modules) ? project.modules : [];
          if (!modules.length) {
            moduleSelect.innerHTML = `<option value="">No modules found for this project</option>`;
            return;
          }
          moduleSelect.innerHTML = `<option value="">Select a module</option>`;
          modules.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = `${m.module_name} (${m.status === 'completed' ? 'Completed' : m.status.replace('_', ' ')})`;
            opt.disabled = m.status !== 'completed';
            moduleSelect.appendChild(opt);
          });
        } catch (err) {
          moduleSelect.innerHTML = `<option value="">Unable to load modules</option>`;
        }
      });

      // When module selected, populate students eligible via module_student
      moduleSelect.addEventListener('change', async () => {
        const moduleId = moduleSelect.value;
        studentSelect.innerHTML = `<option value="">Loading students...</option>`;
        if (!moduleId) {
          studentSelect.innerHTML = `<option value="">Select module first</option>`;
          return;
        }
        try {
          const { data: eligible } = await fetchModuleEligibleStudents(moduleId);
          if (!eligible.length) {
            studentSelect.innerHTML = `<option value="">No students assigned to this module</option>`;
            return;
          }
          studentSelect.innerHTML = `<option value="">Select a student</option>`;
          eligible.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.name + (s.email ? ` (${s.email})` : '');
            studentSelect.appendChild(opt);
          });
        } catch (err) {
          studentSelect.innerHTML = `<option value="">Unable to load students</option>`;
        }
      });

      // Confirm issue handler
      modalRoot.querySelector('#confirm-issue')?.addEventListener('click', async () => {
        const errEl = modalRoot.querySelector('#issue-error');
        errEl.textContent = '';
        const projectId = Number(projectSelect.value || 0);
        const moduleId = Number(moduleSelect.value || 0);
        const studentId = Number(studentSelect.value || 0);
        const issueDate = modalRoot.querySelector('#certificate-date').value;
        const certificateFile = (modalRoot.querySelector('#certificate-file').value || '').trim();

        if (!projectId) return errEl.textContent = 'Please select a project.';
        if (!moduleId) return errEl.textContent = 'Please select a module.';
        if (!studentId) return errEl.textContent = 'Please select a student.';
        if (!issueDate) return errEl.textContent = 'Please select an issue date.';

        try {
          await postCertificate({
            project_id: projectId,
            module_id: moduleId,
            student_id: studentId,
            issue_date: issueDate,
            certificate_file: certificateFile || undefined,
          });
          alert('Certificate issued successfully');
          modalRoot.innerHTML = '';
          try {
            await fetchCertificates();
            renderCertificates(certificates);
          } catch (e) {
            console.error('Failed to refresh certificates', e);
          }
        } catch (err) {
          console.error(err);
          errEl.textContent = err.message || 'Failed to issue certificate';
        }
      });
    })();
  }

  render();

  return container;
}

export default CertificatesHome;
