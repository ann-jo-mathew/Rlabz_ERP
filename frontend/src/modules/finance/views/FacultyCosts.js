import { financeService } from '../services/FinanceService.js';
import { updateFinanceSidebar } from '../layouts/FinanceLayout.js';

export async function FacultyCosts(route, router) {
  const container = document.createElement('div');
  container.className = 'finance-module animate-fade-in';
  setTimeout(updateFinanceSidebar, 0);

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  try {
    const facultyCosts = await financeService.getFacultyCosts();
    
    container.innerHTML = `
      <div class="fin-page-header">
        <div>
          <h1>Faculty & Resource Costs</h1>
          <p>Track internal resource costs associated with RLabZ projects</p>
        </div>
      </div>
      
      <div class="fin-panel">
        <div class="fin-panel-header">
          <div class="fin-panel-title">Resource Cost Ledger</div>
        </div>
        <div class="fin-table-wrap">
          <table class="fin-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Resource Name</th>
                <th>Role / Designation</th>
                <th>Total Cost</th>
                <th>Date</th>
                <th>Status</th>
                <th>Tx Reference</th>
              </tr>
            </thead>
            <tbody>
              ${facultyCosts.map(fc => `
                <tr>
                  <td><div style="font-weight:600">${fc.projectName}</div></td>
                  <td>${fc.name}</td>
                  <td>${fc.role}</td>
                  <td style="font-weight:700">${fmt(fc.amount)}</td>
                  <td>${fc.date}</td>
                  <td><span class="fin-badge ${fc.status === 'Paid' ? 'success' : 'warning'}">${fc.status}</span></td>
                  <td style="font-size:0.8rem;color:var(--text-muted);font-family:monospace;">${fc.txRef || '-'}</td>
                </tr>
              `).join('')}
              ${facultyCosts.length === 0 ? '<tr><td colspan="7" style="text-align:center;color:var(--text-muted)">No faculty costs recorded</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;

  } catch (e) {
    container.innerHTML = `<div class="alert-error">Failed to load faculty costs.</div>`;
  }

  return container;
}

export default FacultyCosts;
