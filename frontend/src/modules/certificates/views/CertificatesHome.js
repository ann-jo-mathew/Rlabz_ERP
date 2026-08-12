

import '../certificates.css';

export function CertificatesHome(route, router) {
  const container = document.createElement('div');

  container.innerHTML = `
    <div class="certificates-page">

      <div class="certificates-header">
        <div>
          <h1>Certificates & Reporting</h1>
          <p>Generate, manage and retrieve project certificates and final reports.</p>
        </div>

        <button class="cert-primary-btn" id="issue-certificate-btn">
          + Issue Certificate
        </button>
      </div>

      <div class="cert-stats">
        <div class="cert-stat-card">
          <span>Total Certificates</span>
          <strong>24</strong>
        </div>

        <div class="cert-stat-card">
          <span>Issued This Month</span>
          <strong>6</strong>
        </div>

        <div class="cert-stat-card">
          <span>Pending</span>
          <strong>3</strong>
        </div>

        <div class="cert-stat-card">
          <span>Final Reports</span>
          <strong>18</strong>
        </div>
      </div>

      <div class="cert-panel">

        <div class="cert-panel-header">
          <h2>Recent Certificates</h2>

          <input
            type="text"
            id="certificate-search"
            placeholder="Search certificates..."
          >
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

            <tbody>

              <tr>
                <td>Rahul Kumar</td>
                <td>Hospital Management System</td>
                <td><span class="cert-track nova">Nova</span></td>
                <td>12 Aug 2026</td>
                <td><span class="cert-status issued">Issued</span></td>
                <td>
                  <button class="cert-action">View</button>
                </td>
              </tr>

              <tr>
                <td>Anjali Menon</td>
                <td>Campus ERP</td>
                <td><span class="cert-track orbit">Orbit</span></td>
                <td>10 Aug 2026</td>
                <td><span class="cert-status issued">Issued</span></td>
                <td>
                  <button class="cert-action">View</button>
                </td>
              </tr>

              <tr>
                <td>Arjun Nair</td>
                <td>Student Portal</td>
                <td><span class="cert-track spark">Spark</span></td>
                <td>-</td>
                <td><span class="cert-status pending">Pending</span></td>
                <td>
                  <button class="cert-action">Review</button>
                </td>
              </tr>

            </tbody>
          </table>
        </div>

      </div>

      <div class="cert-panel">

        <div class="cert-panel-header">
          <h2>Final Project Reports</h2>

          <button class="cert-outline-btn">
            View All Reports
          </button>
        </div>

        <div class="report-list">

          <div class="report-item">
            <div>
              <strong>Hospital Management System</strong>
              <p>Final report and code handover documentation</p>
            </div>

            <button class="cert-action">View Report</button>
          </div>

          <div class="report-item">
            <div>
              <strong>Campus ERP</strong>
              <p>Final project documentation</p>
            </div>

            <button class="cert-action">View Report</button>
          </div>

        </div>

      </div>

    </div>
  `;

  container
    .querySelector('#issue-certificate-btn')
    ?.addEventListener('click', () => {
      alert('Certificate issuing form will be added here.');
    });

  return container;
}

export default CertificatesHome;