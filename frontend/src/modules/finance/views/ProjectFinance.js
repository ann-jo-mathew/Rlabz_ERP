import { financeService } from '../services/FinanceService.js';
import { updateFinanceSidebar } from '../layouts/FinanceLayout.js';

export async function ProjectFinance(route, router) {
  const container = document.createElement('div');
  container.className = 'finance-module animate-fade-in';
  setTimeout(updateFinanceSidebar, 0);

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  if (route.params && route.params.id) {
    // ── PROJECT DETAIL VIEW ───────────────────────────────────────
    try {
      const details = await financeService.getProjectDetails(route.params.id);
      const { project, invoices, payroll, faculty, expenses } = details;

      const recvPct = project.totalBilling > 0 ? Math.round((project.collected / project.totalBilling) * 100) : 0;

      container.innerHTML = `
        <div class="fin-page-header">
          <div>
            <button class="fin-back-link" id="back-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Back to Projects
            </button>
            <h1>${project.name}</h1>
            <p>Client: ${project.client} | Status: <span class="fin-badge ${project.status === 'Completed' ? 'success' : 'info'}">${project.status}</span></p>
          </div>
        </div>

        <div class="fin-kpi-strip">
          <div class="fin-kpi-card teal">
            <div class="kpi-label">Amount Collected</div>
            <div class="kpi-value">${fmt(project.collected)}</div>
            <div class="kpi-sub">${recvPct}% of billed revenue</div>
          </div>
          <div class="fin-kpi-card ${project.outstanding > 0 ? 'warning' : 'primary'}">
            <div class="kpi-label">Amount Outstanding</div>
            <div class="kpi-value">${fmt(project.outstanding)}</div>
            <div class="kpi-sub">${project.outstanding > 0 ? 'Pending from client' : 'Fully collected ✓'}</div>
          </div>
          <div class="fin-kpi-card indigo">
            <div class="kpi-label">Total Expenses</div>
            <div class="kpi-value">${fmt(project.totalExpenses)}</div>
            <div class="kpi-sub">Across all resource types</div>
          </div>
          <div class="fin-kpi-card primary">
            <div class="kpi-label">Project Margin</div>
            <div class="kpi-value">${fmt(project.margin)}</div>
            <div class="kpi-sub">Pre-tax margin</div>
          </div>
        </div>

        <div class="fin-grid-2">
          <!-- Billing History -->
          <div class="fin-panel">
            <div class="fin-panel-header">
              <div class="fin-panel-title">Client Billing & Invoices</div>
            </div>
            <div class="fin-table-wrap">
              <table class="fin-table">
                <thead>
                  <tr><th>Invoice</th><th>Date</th><th>Amount</th><th>Status</th></tr>
                </thead>
                <tbody>
                  ${invoices.map(i => `
                    <tr>
                      <td>${i.id}</td>
                      <td>${i.date}</td>
                      <td style="font-weight:700">${fmt(i.grandTotal)}</td>
                      <td><span class="fin-badge ${i.status === 'Paid' ? 'success' : 'warning'}">${i.status}</span></td>
                    </tr>
                  `).join('')}
                  ${invoices.length === 0 ? '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">No invoices found</td></tr>' : ''}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Expenses Breakdown -->
          <div class="fin-panel">
            <div class="fin-panel-header">
              <div class="fin-panel-title">Expense Breakdown</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:1rem;">
              <div class="fin-breakdown-row">
                <span class="label">Student Payroll</span>
                <span class="value">${fmt(project.payrollCost)}</span>
              </div>
              <div class="fin-breakdown-row">
                <span class="label">Faculty / Resource Costs</span>
                <span class="value">${fmt(project.facultyCost)}</span>
              </div>
              <div class="fin-breakdown-row">
                <span class="label">Hosting Costs</span>
                <span class="value">${fmt(project.hostingCost)}</span>
              </div>
              <div class="fin-breakdown-row">
                <span class="label">Other Expenses</span>
                <span class="value">${fmt(project.otherCost)}</span>
              </div>
              <div class="fin-breakdown-total">
                <span>Total Expenses</span>
                <span style="color:var(--danger)">${fmt(project.totalExpenses)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Detailed Resource Costs -->
        <div class="fin-panel">
          <div class="fin-panel-header">
            <div class="fin-panel-title">Student & Faculty Costs Detail</div>
          </div>
          <div class="fin-table-wrap">
            <table class="fin-table">
              <thead>
                <tr>
                  <th>Resource Name</th>
                  <th>Role</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${payroll.map(pr => `
                  <tr>
                    <td>${pr.studentName}</td>
                    <td>${pr.designation}</td>
                    <td><span class="fin-badge indigo">Student</span></td>
                    <td>${fmt(pr.grossAmount)}</td>
                    <td><span class="fin-badge ${pr.status === 'Paid' ? 'success' : 'warning'}">${pr.status}</span></td>
                  </tr>
                `).join('')}
                ${faculty.map(fc => `
                  <tr>
                    <td>${fc.name}</td>
                    <td>${fc.role}</td>
                    <td><span class="fin-badge teal">Faculty</span></td>
                    <td>${fmt(fc.amount)}</td>
                    <td><span class="fin-badge ${fc.status === 'Paid' ? 'success' : 'warning'}">${fc.status}</span></td>
                  </tr>
                `).join('')}
                ${(payroll.length === 0 && faculty.length === 0) ? '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No resources assigned</td></tr>' : ''}
              </tbody>
            </table>
          </div>
        </div>
      `;

      container.querySelector('#back-btn').addEventListener('click', () => {
        router.push('/finance/projects');
      });

    } catch (e) {
      container.innerHTML = `<div class="alert-error">Failed to load project details: ${e.message}</div>`;
    }

  } else {
    // ── ALL PROJECTS LIST VIEW ────────────────────────────────────
    const projects = await financeService.getProjectFinances();
    
    container.innerHTML = `
      <div class="fin-page-header">
        <div>
          <h1>Project Finance</h1>
          <p>Financial breakdown of all RLabZ projects</p>
        </div>
      </div>
      
      <div class="fin-panel">
        <div class="fin-panel-header">
          <div class="fin-panel-title">Project Portfolio</div>
        </div>
        <div class="fin-table-wrap">
          <table class="fin-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Status</th>
                <th>Est. Cost</th>
                <th>Total Billing</th>
                <th>Collected</th>
                <th>Outstanding</th>
                <th>Expenses</th>
                <th>Margin</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${projects.map(p => `
                <tr>
                  <td>
                    <div style="font-weight:600">${p.name}</div>
                    <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px">${p.client}</div>
                  </td>
                  <td><span class="fin-badge ${p.status === 'Completed' ? 'success' : 'info'}">${p.status}</span></td>
                  <td>${fmt(p.estimated_cost)}</td>
                  <td>${fmt(p.totalBilling)}</td>
                  <td style="color:var(--primary);font-weight:600">${fmt(p.collected)}</td>
                  <td style="color:var(--warning);font-weight:600">${fmt(p.outstanding)}</td>
                  <td>${fmt(p.totalExpenses)}</td>
                  <td style="font-weight:700;color:${p.margin > 0 ? 'var(--primary)' : 'inherit'}">${fmt(p.margin)}</td>
                  <td>
                    <button class="fin-btn outline sm view-details-btn" data-id="${p.id}">View Details</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.querySelectorAll('.view-details-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        router.push(`/finance/projects/${btn.dataset.id}`);
      });
    });
  }

  return container;
}

export default ProjectFinance;
