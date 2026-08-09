import { financeService } from '../services/FinanceService.js';
import { updateFinanceSidebar } from '../layouts/FinanceLayout.js';

export async function Transactions(route, router) {
  const container = document.createElement('div');
  container.className = 'finance-module animate-fade-in';
  setTimeout(updateFinanceSidebar, 0);

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  try {
    const transactions = await financeService.getTransactions();
    
    // Filter logic placeholders
    
    container.innerHTML = `
      <div class="fin-page-header">
        <div>
          <h1>Financial Transactions</h1>
          <p>Master ledger for all RLabZ financial activities</p>
        </div>
        <div style="display:flex;gap:0.75rem;">
          <select class="fin-btn outline" id="filter-type" style="background:#fff;padding:0.5rem;">
            <option value="all">All Types</option>
            <option value="Client Payment">Client Payment</option>
            <option value="Student Payroll">Student Payroll</option>
            <option value="Faculty/Resource">Faculty/Resource</option>
            <option value="Expense">Expense</option>
          </select>
          <button class="fin-btn primary" id="apply-filter">Filter</button>
        </div>
      </div>
      
      <div class="fin-panel">
        <div class="fin-table-wrap">
          <table class="fin-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Date</th>
                <th>Project</th>
                <th>Type</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="txn-tbody">
              ${transactions.map(t => `
                <tr class="txn-row" data-type="${t.type}">
                  <td style="font-family:monospace;color:var(--primary);font-weight:600;">${t.id}</td>
                  <td>${t.date}</td>
                  <td><div style="font-weight:600">${t.projectName}</div></td>
                  <td><span class="fin-badge neutral">${t.type}</span></td>
                  <td style="color:var(--text-muted);font-size:0.8rem;">${t.desc}</td>
                  <td style="font-weight:700;color:${t.type === 'Client Payment' ? 'var(--primary)' : 'inherit'}">${fmt(t.amount)}</td>
                  <td>${t.method}</td>
                  <td><span class="fin-badge success">${t.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Implement minimal local filter
    container.querySelector('#apply-filter').addEventListener('click', () => {
      const type = container.querySelector('#filter-type').value;
      container.querySelectorAll('.txn-row').forEach(row => {
        if (type === 'all' || row.dataset.type === type) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });

  } catch (e) {
    container.innerHTML = `<div class="alert-error">Failed to load transactions.</div>`;
  }

  return container;
}

export default Transactions;
