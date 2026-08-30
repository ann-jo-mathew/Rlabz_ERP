export function CoordinatorReports(route, router) {
  const container = document.createElement('div');

  const reports = [
  {
    id: 1,
    project: 'Hospital Management System',
    client: 'Rajagiri Hospital',
    progress: 100,
    status: 'Completed',
    completionDate: '12 Aug 2026',

    projectReports: [
      {
        title: 'Initial Progress Report',
        uploadedBy: 'Rahul Kumar',
        date: '05 Aug 2026'
      },
      {
        title: 'Final Progress Report',
        uploadedBy: 'Coordinator',
        date: '11 Aug 2026'
      }
    ],

    finalDocuments: {
      finalReport: 'hospital-management-final-report.pdf',
      codeHandover: 'hospital-management-code-handover.pdf',
      closureNotes: 'Final report submitted and source code handed over successfully.',
      uploadedOn: '12 Aug 2026'
    },

    closure: {
      finalStatus: 'Completed',
      closedBy: 'Co-ordinator',
      closureDate: '12 Aug 2026',
      remarks: 'All project deliverables completed and source code handed over successfully.'
    }
  },

  {
    id: 2,
    project: 'Campus ERP',
    client: 'Rajagiri College',
    progress: 100,
    status: 'Completed',
    completionDate: '10 Aug 2026',

    projectReports: [
      {
        title: 'Project Progress Report',
        uploadedBy: 'Meera Joseph',
        date: '07 Aug 2026'
      }
    ],

    finalDocuments: {
      finalReport: 'campus-erp-final-report.pdf',
      codeHandover: 'campus-erp-code-handover.pdf',
      closureNotes: 'Project completed and final documentation submitted.',
      uploadedOn: '10 Aug 2026'
    },

    closure: {
      finalStatus: 'Completed',
      closedBy: 'Co-ordinator',
      closureDate: '10 Aug 2026',
      remarks: 'Project completed successfully and final deliverables received.'
    }
  },

  {
    id: 3,
    project: 'Student Portal',
    client: 'Computer Science Department',
    progress: 72,
    status: 'In Progress',
    completionDate: '-',

    projectReports: [
      {
        title: 'Weekly Progress Report',
        uploadedBy: 'Arjun Nair',
        date: '16 Aug 2026'
      }
    ],

    finalDocuments: {
      finalReport: null,
      codeHandover: null,
      closureNotes: null,
      uploadedOn: null
    },

    closure: {
      finalStatus: 'Not Closed',
      closedBy: '-',
      closureDate: '-',
      remarks: 'Project is still in progress.'
    }
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

  if (!modalRoot) return;

  const projectReports = report.projectReports || [];
  const finalDocuments = report.finalDocuments || {};
  const closure = report.closure || {};

  modalRoot.innerHTML = `

    <div class="director-modal-overlay">

      <div
        class="director-modal"
        style="
          max-width: 850px;
          width: 95%;
          max-height: 85vh;
          overflow-y: auto;
        "
      >

        <!-- HEADER -->

        <div class="director-modal-header">

          <div>

            <h3>${report.project}</h3>

            <p style="
              margin: 5px 0 0;
              color: #6b7280;
            ">
              Project Reports & Documentation
            </p>

          </div>

          <button
            class="btn-director btn-director-outline"
            id="close-report"
          >
            ✕
          </button>

        </div>


        <!-- BODY -->

        <div class="director-modal-body">

          <!-- PROJECT INFORMATION -->

          <h4>Project Information</h4>

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

          <p>
            <strong>Completion Date:</strong>
            ${report.completionDate}
          </p>


          <hr>


          <!-- PROJECT REPORTS -->

          <h4>Project Reports</h4>

          <p style="
            color: #6b7280;
            margin-bottom: 15px;
          ">
            Reports uploaded during the project lifecycle.
          </p>

          ${
            projectReports.length > 0
              ? projectReports.map(projectReport => `

                  <div
                    style="
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      padding: 12px;
                      margin-bottom: 10px;
                      background: #f8fafc;
                      border-radius: 8px;
                    "
                  >

                    <div>

                      <strong>
                        ${projectReport.title}
                      </strong>

                      <div style="
                        font-size: 13px;
                        color: #6b7280;
                        margin-top: 4px;
                      ">
                        Uploaded by ${projectReport.uploadedBy}
                        • ${projectReport.date}
                      </div>

                    </div>

                    <button
                      class="cert-action"
                      type="button"
                    >
                      View
                    </button>

                  </div>

                `).join('')
              : `
                  <p style="color:#6b7280;">
                    No project reports uploaded yet.
                  </p>
                `
          }


          <hr>


          <!-- FINAL PROJECT DOCUMENTS -->

          <h4>Final Project Documents</h4>

          <p style="
            color: #6b7280;
            margin-bottom: 15px;
          ">
            Final report and code handover documentation
            submitted when the project is completed.
          </p>


          <!-- FINAL REPORT -->

          <div style="
            padding: 14px;
            background: #f8fafc;
            border-radius: 8px;
            margin-bottom: 10px;
          ">

            <strong>Final Report</strong>

            <p style="
              margin: 5px 0 10px;
              color: #6b7280;
            ">
              ${
                finalDocuments.finalReport ||
                'Not submitted yet.'
              }
            </p>

            ${
              finalDocuments.finalReport
                ? `
                    <button
                      class="cert-action"
                      type="button"
                      id="view-final-report"
                    >
                      View / Download
                    </button>
                  `
                : ''
            }

          </div>


          <!-- CODE HANDOVER -->

          <div style="
            padding: 14px;
            background: #f8fafc;
            border-radius: 8px;
            margin-bottom: 10px;
          ">

            <strong>Code Handover</strong>

            <p style="
              margin: 5px 0 10px;
              color: #6b7280;
            ">
              ${
                finalDocuments.codeHandover ||
                'Not submitted yet.'
              }
            </p>

            ${
              finalDocuments.codeHandover
                ? `
                    <button
                      class="cert-action"
                      type="button"
                      id="view-code-handover"
                    >
                      View / Download
                    </button>
                  `
                : ''
            }

          </div>


          <!-- CLOSURE NOTES -->

          <div style="
            padding: 14px;
            background: #f8fafc;
            border-radius: 8px;
            margin-bottom: 10px;
          ">

            <strong>Closure Notes</strong>

            <p style="
              margin: 5px 0;
              color: #6b7280;
            ">
              ${
                finalDocuments.closureNotes ||
                'No closure notes submitted.'
              }
            </p>

            ${
              finalDocuments.uploadedOn
                ? `
                    <small style="color:#6b7280;">
                      Uploaded on ${finalDocuments.uploadedOn}
                    </small>
                  `
                : ''
            }

          </div>


          <hr>


          <!-- PROJECT CLOSURE -->

          <h4>Project Closure</h4>

          <p style="
            color: #6b7280;
            margin-bottom: 15px;
          ">
            Official closure record for this project.
          </p>

          <div style="
            background: #f8fafc;
            padding: 18px;
            border-radius: 8px;
          ">

            <p>
              <strong>Final Status:</strong>
              ${closure.finalStatus}
            </p>

            <p>
              <strong>Closed By:</strong>
              ${closure.closedBy}
            </p>

            <p>
              <strong>Closure Date:</strong>
              ${closure.closureDate}
            </p>

            <p>
              <strong>Remarks:</strong>
              ${closure.remarks}
            </p>

          </div>

        </div>


        <!-- FOOTER -->

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


  // CLOSE X BUTTON

  modalRoot
    .querySelector('#close-report')
    ?.addEventListener('click', () => {

      modalRoot.innerHTML = '';

    });


  // CLOSE BUTTON

  modalRoot
    .querySelector('#close-report-btn')
    ?.addEventListener('click', () => {

      modalRoot.innerHTML = '';

    });


  // FINAL REPORT BUTTON

  modalRoot
    .querySelector('#view-final-report')
    ?.addEventListener('click', () => {

      alert(
        `Final report for "${report.project}" is ready for viewing.`
      );

    });


  // CODE HANDOVER BUTTON

  modalRoot
    .querySelector('#view-code-handover')
    ?.addEventListener('click', () => {

      alert(
        `Code handover documentation for "${report.project}" is ready for viewing.`
      );

    });


  // DOWNLOAD BUTTON

  modalRoot
    .querySelector('#download-report')
    ?.addEventListener('click', () => {

      alert(
        `Final documentation for "${report.project}" will be downloaded once backend file storage is connected.`
      );

    });

}

  render();

  return container;
}

export default CoordinatorReports;