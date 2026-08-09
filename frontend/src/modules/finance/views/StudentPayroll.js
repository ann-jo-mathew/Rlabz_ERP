import { financeService } from '../services/FinanceService.js';
import { updateFinanceSidebar } from '../layouts/FinanceLayout.js';

export async function StudentPayroll(route, router) {
  const container = document.createElement('div');
  container.className = 'finance-module animate-fade-in';
  setTimeout(updateFinanceSidebar, 0);

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  let payrollData = [];

  const renderTable = () => {
    const tbody = container.querySelector('#payroll-tbody');
    if (!tbody) return;

    tbody.innerHTML = payrollData.map(pr => {
      const isPaid = pr.status === 'Paid';
      const isProcessing = pr.status === 'Processing';
      
      let actionHtml = '';
      if (pr.status === 'Pending') {
        actionHtml = `<button class="fin-btn primary sm process-btn" data-id="${pr.id}">Process Payment</button>`;
      } else if (isProcessing) {
        actionHtml = `<span style="color:var(--primary);font-size:0.85rem;font-weight:600;display:flex;align-items:center;gap:4px;"><span class="spinner" style="width:12px;height:12px;border-width:2px;margin:0;"></span> Processing...</span>`;
      } else if (isPaid) {
        actionHtml = `<button class="fin-btn outline sm receipt-btn" data-id="${pr.id}">Download Receipt</button>`;
      }

      return `
        <tr>
          <td>
            <div style="font-weight:600">${pr.studentName}</div>
            <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px">${pr.id}</div>
          </td>
          <td>${pr.designation}</td>
          <td>${pr.projectName}</td>
          <td>${pr.hours} hrs @ ${fmt(pr.rate)}/hr</td>
          <td style="font-weight:700">${fmt(pr.grossAmount)}</td>
          <td>${pr.period}</td>
          <td><span class="fin-badge ${isPaid ? 'success' : isProcessing ? 'info' : 'warning'}">${pr.status}</span></td>
          <td>${pr.paymentDate || '-'}</td>
          <td style="font-size:0.8rem;color:var(--text-muted);font-family:monospace;">${pr.txRef || '-'}</td>
          <td>${actionHtml}</td>
        </tr>
      `;
    }).join('');

    bindEvents();
  };

  const bindEvents = () => {
    container.querySelectorAll('.process-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        btn.disabled = true;
        btn.innerHTML = 'Starting...';
        
        // Optimistic UI update to processing
        const pr = payrollData.find(p => p.id === id);
        if (pr) pr.status = 'Processing';
        renderTable();

        try {
          await financeService.processPayroll(id);
          // Re-fetch or rely on the mutated state
          payrollData = await financeService.getStudentPayroll();
          renderTable();
        } catch (e) {
          alert('Failed to process payroll: ' + e.message);
        }
      });
    });

    container.querySelectorAll('.receipt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const pr = payrollData.find(p => p.id === id);
        alert(`Generating receipt for ${pr.studentName} (${pr.txRef}).\nPDF generation is available in Invoices section.`);
      });
    });
  };

  try {
    payrollData = await financeService.getStudentPayroll();
    
    container.innerHTML = `
      <div class="fin-page-header">
        <div>
          <h1>Student Payroll</h1>
          <p>Manage and process student project compensation</p>
        </div>
      </div>
      
      <div class="fin-panel">
        <div class="fin-panel-header">
          <div class="fin-panel-title">Payroll Ledger</div>
        </div>
        <div class="fin-table-wrap">
          <table class="fin-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Designation</th>
                <th>Assigned Project</th>
                <th>Rate / Hours</th>
                <th>Gross Amount</th>
                <th>Period</th>
                <th>Status</th>
                <th>Payment Date</th>
                <th>Tx Reference</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="payroll-tbody">
              <!-- Rendered via JS -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Initial render
    setTimeout(renderTable, 0);

  } catch (e) {
    container.innerHTML = `<div class="alert-error">Failed to load payroll data.</div>`;
  }

  return container;
}

export default StudentPayroll;
