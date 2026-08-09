import { DirectorService } from '../services/DirectorService.js';

export function DirectorFinance(route, router) {
  const container = document.createElement('div');
  container.className = 'director-dashboard';

  const fin = DirectorService.getFinanceSummary();
  const projects = DirectorService.getProjects();

  container.innerHTML = `
    <div class="director-header">
      <div>
        <h1>Finance & Payroll Oversight (Read-Only)</h1>
        <p>Director read-access integration into Module 5 (Finance & Payroll data).</p>
      </div>
      <div class="director-badge-role">
        Read-Only Access
      </div>
    </div>

    <!-- Financial KPI Summary Cards -->
    <div class="director-kpi-grid">
      <div class="director-kpi-card">
        <div class="director-kpi-top">
          <span class="director-kpi-title">Total Project Budgets</span>
          <div class="director-kpi-icon emerald">₹</div>
        </div>
        <div class="director-kpi-value">₹${fin.totalBudget.toLocaleString()}</div>
        <div class="director-kpi-subtext">Across all active & completed projects</div>
      </div>

      <div class="director-kpi-card">
        <div class="director-kpi-top">
          <span class="director-kpi-title">Disbursed Expenditures</span>
          <div class="director-kpi-icon blue">₹</div>
        </div>
        <div class="director-kpi-value">₹${fin.totalSpent.toLocaleString()}</div>
        <div class="director-kpi-subtext">Spent on project execution</div>
      </div>

      <div class="director-kpi-card">
        <div class="director-kpi-top">
          <span class="director-kpi-title">Student Payroll Disbursed</span>
          <div class="director-kpi-icon purple">₹</div>
        </div>
        <div class="director-kpi-value">₹${fin.stipendsDisbursed.toLocaleString()}</div>
        <div class="director-kpi-subtext">Monthly stipends based on designation</div>
      </div>

      <div class="director-kpi-card">
        <div class="director-kpi-top">
          <span class="director-kpi-title">Pending Client Invoices</span>
          <div class="director-kpi-icon amber">₹</div>
        </div>
        <div class="director-kpi-value">₹${fin.pendingInvoiceAmount.toLocaleString()}</div>
        <div class="director-kpi-subtext">${fin.pendingInvoices} unpaid invoices pending collection</div>
      </div>
    </div>

    <!-- Payroll Allocation by Designation Track -->
    <div class="director-panel">
      <div class="director-panel-header">
        <h2>Student Payroll Breakdown by Track (Module 5 Integration)</h2>
      </div>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:1rem;">
        <div style="background:#f3e8ff; padding:1.25rem; border-radius:10px; border:1px solid #d8b4fe;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="track-badge nova">Nova Lead Track</span>
            <strong style="color:#7e22ce; font-size:1.1rem;">₹${fin.payrollByTrack.Nova.toLocaleString()}</strong>
          </div>
          <p style="font-size:0.8rem; color:#6b7280; margin:0.5rem 0 0 0;">Highest stipend tier for independent project leads.</p>
        </div>

        <div style="background:#dbeafe; padding:1.25rem; border-radius:10px; border:1px solid #93c5fd;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="track-badge orbit">Orbit Dev Track</span>
            <strong style="color:#1d4ed8; font-size:1.1rem;">₹${fin.payrollByTrack.Orbit.toLocaleString()}</strong>
          </div>
          <p style="font-size:0.8rem; color:#6b7280; margin:0.5rem 0 0 0;">Standard developer stipend tier for active contributors.</p>
        </div>

        <div style="background:#d1fae5; padding:1.25rem; border-radius:10px; border:1px solid #6ee7b7;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="track-badge spark">Spark Learner Track</span>
            <strong style="color:#047857; font-size:1.1rem;">₹${fin.payrollByTrack.Spark.toLocaleString()}</strong>
          </div>
          <p style="font-size:0.8rem; color:#6b7280; margin:0.5rem 0 0 0;">Entry-level intern stipend tier for learners.</p>
        </div>
      </div>
    </div>

    <!-- Project Budget vs Expenditure Table -->
    <div class="director-panel">
      <div class="director-panel-header">
        <h2>Project Financial Tracking Overview</h2>
      </div>

      <div class="director-table-responsive">
        <table class="director-table">
          <thead>
            <tr>
              <th>Project Title</th>
              <th>Client Name</th>
              <th>Total Budget</th>
              <th>Current Spent</th>
              <th>Remaining Budget</th>
              <th>Financial Health</th>
            </tr>
          </thead>
          <tbody>
            ${projects.map(p => {
              const remaining = p.budget - p.spent;
              const percentSpent = Math.round((p.spent / p.budget) * 100);
              return `
                <tr>
                  <td><strong>${p.title}</strong><br><small style="color:#6b7280">${p.id}</small></td>
                  <td>${p.clientName}</td>
                  <td>₹${p.budget.toLocaleString()}</td>
                  <td>₹${p.spent.toLocaleString()}</td>
                  <td style="color:${remaining >= 0 ? '#059669' : '#dc2626'}">₹${remaining.toLocaleString()}</td>
                  <td>
                    <span class="status-badge ${percentSpent > 90 ? 'rejected' : 'completed'}">
                      ${percentSpent}% Utilized
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  return container;
}

export default DirectorFinance;
