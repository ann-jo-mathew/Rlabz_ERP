import { financeService } from '../services/FinanceService.js';
import { updateFinanceSidebar } from '../layouts/FinanceLayout.js';

export async function Transactions(route, router) {
  const container = document.createElement('div');
  container.className = 'finance-module animate-fade-in';
  setTimeout(updateFinanceSidebar, 0);

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  let transactions = [];
  let allProjects = [];

  const renderTable = () => {
    const tbody = container.querySelector('#txn-tbody');
    const noResults = container.querySelector('#no-results');
    if (!tbody) return;

    const searchTerm = container.querySelector('#search-input').value.toLowerCase();
    const typeFilter = container.querySelector('#filter-type').value;
    const projectFilter = container.querySelector('#filter-project').value;
    const ieFilter = container.querySelector('#filter-ie').value;

    const filtered = transactions.filter(t => {
      const matchSearch = (t.projectName || '').toLowerCase().includes(searchTerm) || (t.id || '').toLowerCase().includes(searchTerm) || (t.desc || '').toLowerCase().includes(searchTerm);
      const matchType = typeFilter === 'All' || t.type === typeFilter;
      const matchProject = projectFilter === 'All' || (t.projectId || '').toString() === projectFilter;
      const matchIE = ieFilter === 'All' || t.incomeExpense === ieFilter;
      return matchSearch && matchType && matchProject && matchIE;
    });

    const countEl = container.querySelector('#results-count');
    if (countEl) countEl.textContent = `${filtered.length} transactions`;

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      noResults.style.display = 'block';
    } else {
      noResults.style.display = 'none';
      tbody.innerHTML = filtered.map(t => {
        const isIncome = t.incomeExpense === 'Income';
        const amtColor = isIncome ? 'color:var(--primary)' : 'color:var(--text-main)';
        const amtPrefix = isIncome ? '+' : '−';
        return `
          <tr>
            <td style="font-family:monospace;font-size:0.8rem;color:var(--primary);font-weight:600;">${t.id || '—'}</td>
            <td style="white-space:nowrap;color:var(--text-muted)">${t.date}</td>
            <td><div style="font-weight:600">${t.projectName}</div></td>
            <td><span class="fin-badge neutral" style="font-size:0.72rem">${t.type}</span></td>
            <td style="font-size:0.825rem;color:var(--text-muted);max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${t.desc}</td>
            <td style="font-weight:700;${amtColor}">${amtPrefix} ${fmt(t.amount)}</td>
            <td>
              <span class="fin-badge ${isIncome ? 'success' : 'neutral'}" style="font-size:0.72rem">${t.incomeExpense}</span>
            </td>
            <td><span class="fin-badge success" style="font-size:0.72rem">${t.status}</span></td>
          </tr>
        `;
      }).join('');
    }
  };

  try {
    transactions = await financeService.getTransactions();
    allProjects = await financeService.getProjectsList();

    container.innerHTML = `
      <div class="fin-page-header">
        <div>
          <h1>Financial Transactions</h1>
          <p>Master ledger — all RLabZ financial activities</p>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="fin-filter-bar">
        <div class="fin-filter-group" style="flex:2; min-width:180px;">
          <label>Search</label>
          <div class="fin-search-wrap">
            <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" id="search-input" class="fin-input" placeholder="Search ID, project, description...">
          </div>
        </div>
        <div class="fin-filter-group" style="min-width:150px; max-width:200px;">
          <label>Project</label>
          <div class="fin-select-wrap">
            <select id="filter-project" class="fin-input">
              <option value="All">All Projects</option>
              ${allProjects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="fin-filter-group" style="min-width:140px; max-width:180px;">
          <label>Type</label>
          <div class="fin-select-wrap">
            <select id="filter-type" class="fin-input">
              <option value="All">All Types</option>
              <option value="Client Payment">Client Payment</option>
              <option value="Student Payroll">Student Payroll</option>
              <option value="Faculty/Resource">Faculty/Resource</option>
              <option value="Other Expense">Other Expense</option>
            </select>
          </div>
        </div>
        <div class="fin-filter-group" style="min-width:130px; max-width:160px;">
          <label>Income / Expense</label>
          <div class="fin-select-wrap">
            <select id="filter-ie" class="fin-input">
              <option value="All">All</option>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
          </div>
        </div>
        <div style="align-self:flex-end;">
          <button id="clear-filters-btn" class="fin-btn outline">Clear</button>
        </div>
      </div>

      <div class="fin-panel">
        <div class="fin-panel-header">
          <div class="fin-panel-title">Transaction Ledger</div>
          <div id="results-count" style="font-size:0.8rem;color:var(--text-muted)"></div>
        </div>
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
                <th>Category</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="txn-tbody"></tbody>
          </table>
          <div id="no-results" style="display:none;text-align:center;padding:2.5rem;color:var(--text-muted)">
            <p style="margin:0;font-size:0.9rem">No transactions match the current filters.</p>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#search-input').addEventListener('input', renderTable);
    container.querySelector('#filter-type').addEventListener('change', renderTable);
    container.querySelector('#filter-project').addEventListener('change', renderTable);
    container.querySelector('#filter-ie').addEventListener('change', renderTable);

    container.querySelector('#clear-filters-btn').addEventListener('click', () => {
      container.querySelector('#search-input').value = '';
      container.querySelector('#filter-type').value = 'All';
      container.querySelector('#filter-project').value = 'All';
      container.querySelector('#filter-ie').value = 'All';
      renderTable();
    });

    renderTable();

  } catch (e) {
    container.innerHTML = `<div class="alert-error">Failed to load transactions: ${e.message}</div>`;
  }

  return container;
}

export default Transactions;
