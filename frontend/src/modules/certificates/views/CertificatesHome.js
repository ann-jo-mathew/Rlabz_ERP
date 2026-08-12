import '../certificates.css';

export function CertificatesHome(route, router) {
  const container = document.createElement('div');

  const certificates = [
    {
      id: 1,
      student: 'Rahul Kumar',
      project: 'Hospital Management System',
      track: 'Nova',
      date: '12 Aug 2026',
      status: 'Issued'
    },
    {
      id: 2,
      student: 'Anjali Menon',
      project: 'Hospital Management System',
      track: 'Orbit',
      date: '12 Aug 2026',
      status: 'Issued'
    },
    {
      id: 3,
      student: 'Arjun Nair',
      project: 'Hospital Management System',
      track: 'Spark',
      date: '-',
      status: 'Pending'
    },
    {
      id: 4,
      student: 'Meera Joseph',
      project: 'Campus ERP',
      track: 'Orbit',
      date: '10 Aug 2026',
      status: 'Issued'
    }
  ];

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
                  <th>Track</th>
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

    renderCertificates(certificates);
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

        <td>${cert.project}</td>

        <td>
          <span class="cert-track ${cert.track.toLowerCase()}">
            ${cert.track}
          </span>
        </td>

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

      button.addEventListener('click', () => {

        const id = Number(button.dataset.id);

        const certificate = certificates.find(c => c.id === id);

        if (certificate) {
          showCertificateDetails(certificate);
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

        if (report) {
          showReportDetails(report);
        }

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

            <h3>Certificate Details</h3>

            <button
              class="btn-director btn-director-outline"
              id="close-cert-modal"
            >
              ✕
            </button>

          </div>

          <div class="director-modal-body">

            <p>
              <strong>Student:</strong>
              ${certificate.student}
            </p>

            <p>
              <strong>Project:</strong>
              ${certificate.project}
            </p>

            <p>
              <strong>Track:</strong>
              ${certificate.track}
            </p>

            <p>
              <strong>Status:</strong>
              ${certificate.status}
            </p>

            <p>
              <strong>Issue Date:</strong>
              ${certificate.date}
            </p>

          </div>

          <div class="director-modal-footer">

            ${
              certificate.status === 'Pending'
                ? `
                  <button
                    class="cert-primary-btn"
                    id="approve-certificate"
                  >
                    Issue Certificate
                  </button>
                `
                : `
                  <button
                    class="cert-primary-btn"
                    id="download-certificate"
                  >
                    Download Certificate
                  </button>
                `
            }

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
      .querySelector('#approve-certificate')
      ?.addEventListener('click', () => {

        alert(
          `Certificate issued to ${certificate.student}.`
        );

        modalRoot.innerHTML = '';
      });

    modalRoot
      .querySelector('#download-certificate')
      ?.addEventListener('click', () => {

        alert(
          `Certificate for ${certificate.student} is ready for download.`
        );

      });
  }

  function showReportDetails(report) {

    const modalRoot =
      container.querySelector('#certificate-modal-root');

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

    const modalRoot =
      container.querySelector('#certificate-modal-root');

    modalRoot.innerHTML = `

      <div class="director-modal-overlay">

        <div class="director-modal">

          <div class="director-modal-header">

            <h3>Issue Project Certificates</h3>

            <button
              class="btn-director btn-director-outline"
              id="close-issue-modal"
            >
              ✕
            </button>

          </div>

          <div class="director-modal-body">

            <label>
              <strong>Project</strong>
            </label>

            <select id="certificate-project">

              <option value="">
                Select completed project
              </option>

              <option>
                Hospital Management System
              </option>

              <option>
                Campus ERP
              </option>

              <option>
                Student Portal
              </option>

            </select>

            <p style="font-size:0.85rem; color:#6b7280;">
              All eligible students assigned to the selected project
              will receive a certificate.
            </p>

          </div>

          <div class="director-modal-footer">

            <button
              class="btn-director btn-director-outline"
              id="cancel-issue"
            >
              Cancel
            </button>

            <button
              class="cert-primary-btn"
              id="confirm-issue"
            >
              Issue Certificates
            </button>

          </div>

        </div>

      </div>
    `;

    modalRoot
      .querySelector('#close-issue-modal')
      ?.addEventListener('click', () => {
        modalRoot.innerHTML = '';
      });

    modalRoot
      .querySelector('#cancel-issue')
      ?.addEventListener('click', () => {
        modalRoot.innerHTML = '';
      });

    modalRoot
      .querySelector('#confirm-issue')
      ?.addEventListener('click', () => {

        const project =
          modalRoot.querySelector('#certificate-project').value;

        if (!project) {
          alert('Please select a project.');
          return;
        }

        alert(
          `Certificates issued to all eligible students on "${project}".`
        );

        modalRoot.innerHTML = '';
      });
  }

  render();

  return container;
}

export default CertificatesHome;