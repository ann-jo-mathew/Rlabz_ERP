export function CoordinatorReports(route, router) {
  const container = document.createElement('div');

  const reports = [
    {
      project: 'Hospital Management System',
      client: 'Rajagiri Hospital',
      status: 'Completed',
      progress: 100,
      date: '12 Aug 2026'
    },
    {
      project: 'Campus ERP',
      client: 'Rajagiri College',
      status: 'Completed',
      progress: 100,
      date: '10 Aug 2026'
    },
    {
      project: 'Student Portal',
      client: 'Computer Science Department',
      status: 'In Progress',
      progress: 72,
      date: '-'
    }
  ];

  function render() {
    container.innerHTML = `
      <div class="certificates-page">

        <div class="certificates-header">
          <div>
            <h1>Project Reports</h1>
            <p>
              View and manage project reports, documentation and
              code handover records.
            </p>
          </div>
        </div>

        <!-- Summary -->
        <div class="cert-stats">

          <div class="cert-stat-card">
            <span>Total Projects</span>
            <strong>${reports.length}</strong>
          </div>

          <div class="cert-stat-card">
            <span>Completed</span>
            <strong>
              ${reports.filter(r => r.status === 'Completed').length}
            </strong>
          </div>

          <div class="cert-stat-card">
            <span>In Progress</span>
            <strong>
              ${reports.filter(r => r.status === 'In Progress').length}
            </strong>
          </div>

          <div class="cert-stat-card">
            <span>Final Reports</span>
            <strong>
              ${reports.filter(r => r.status === 'Completed').length}
            </strong>
          </div>

        </div>

        <!-- Reports -->
        <div class="cert-panel">

          <div class="cert-panel-header">
            <div>
              <h2>Project Documentation</h2>
              <p>
                Final reports and code handover documentation
                for completed projects.
              </p>
            </div>

            <input
              type="text"
              id="report-search"
              placeholder="Search projects..."
            />
          </div>

          <div class="cert-table-wrapper">

            <table class="cert-table">

              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Completion Date</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody id="reports-table-body"></tbody>

            </table>

          </div>

        </div>

        <!-- Report details -->
        <div id="report-modal-root"></div>

      </div>
    `;

    renderReports(reports);

    container
      .querySelector('#report-search')
      ?.addEventListener('input', (e) => {

        const search = e.target.value.toLowerCase();

        const filtered = reports.filter(report =>
          report.project.toLowerCase().includes(search) ||
          report.client.toLowerCase().includes(search)
        );

        renderReports(filtered);
      });
  }

  function renderReports(data) {

    const tbody = container.querySelector('#reports-table-body');

    if (!tbody) return;

    if (data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:2rem;">
            No reports found.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = data.map(report => `
      <tr>

        <td>
          <strong>${report.project}</strong>
        </td>

        <td>${report.client}</td>

        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <div
              style="
                width:80px;
                height:6px;
                background:#e5e7eb;
                border-radius:10px;
                overflow:hidden;
              "
            >
              <div
                style="
                  width:${report.progress}%;
                  height:100%;
                  background:#2563eb;
                "
              ></div>
            </div>

            <span>${report.progress}%</span>
          </div>
        </td>

        <td>
          <span class="cert-status ${
            report.status === 'Completed'
              ? 'issued'
              : 'pending'
          }">
            ${report.status}
          </span>
        </td>

        <td>${report.date}</td>

        <td>
          <button
            class="cert-action"
            data-project="${report.project}"
          >
            View
          </button>
        </td>

      </tr>
    `).join('');

    tbody.querySelectorAll('.cert-action').forEach(button => {

      button.addEventListener('click', () => {

        const projectName = button.dataset.project;

        const report = reports.find(
          r => r.project === projectName
        );

        if (report) {
          showReport(report);
        }

      });

    });
  }

  function showReport(report) {

    const modalRoot =
      container.querySelector('#report-modal-root');

    modalRoot.innerHTML = `
      <div class="director-modal-overlay">

        <div class="director-modal">

          <div class="director-modal-header">

            <h3>${report.project}</h3>

            <button
              class="btn-director btn-director-outline"
              id="close-report"
            >
              ✕
            </button>

          </div>

          <div class="director-modal-body">

            <p>
              <strong>Client:</strong>
              ${report.client}
            </p>

            <p>
              <strong>Status:</strong>
              ${report.status}
            </p>

            <p>
              <strong>Progress:</strong>
              ${report.progress}%
            </p>

            <hr>

            <h4>Final Documentation</h4>

            <p>
              Final project report and documentation associated
              with this project.
            </p>

            <h4>Code Handover</h4>

            <p>
              Code handover documentation and repository details
              will be stored here when the backend is connected.
            </p>

          </div>

          <div class="director-modal-footer">

            ${
              report.status === 'Completed'
                ? `
                  <button
                    class="cert-primary-btn"
                    id="download-report"
                  >
                    Download Report
                  </button>
                `
                : ''
            }

            <button
              class="cert-outline-btn"
              id="close-report-btn"
            >
              Close
            </button>

          </div>

        </div>

      </div>
    `;

    modalRoot
      .querySelector('#close-report')
      ?.addEventListener('click', () => {
        modalRoot.innerHTML = '';
      });

    modalRoot
      .querySelector('#close-report-btn')
      ?.addEventListener('click', () => {
        modalRoot.innerHTML = '';
      });

    modalRoot
      .querySelector('#download-report')
      ?.addEventListener('click', () => {
        alert(
          `Final report for "${report.project}" will be downloaded once backend file storage is connected.`
        );
      });
  }

  render();

  return container;
}

export default CoordinatorReports;