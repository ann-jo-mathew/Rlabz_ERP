import { financeService } from '../services/FinanceService.js';
import { updateFinanceSidebar } from '../layouts/FinanceLayout.js';

export async function FinancialReports(route, router) {
  const container = document.createElement('div');
  container.className = 'finance-module animate-fade-in';
  setTimeout(updateFinanceSidebar, 0);

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  try {
    const summary = await financeService.getDashboardSummary();
    const projects = await financeService.getProjectFinances();
    const invoices = await financeService.getInvoices();
    const payroll = await financeService.getStudentPayroll();

    // A. Project Profitability Report
    const projProfHtml = projects.map(p => `
      <tr>
        <td><div style="font-weight:600">${p.name}</div></td>
        <td>${fmt(p.totalBilling)}</td>
        <td style="color:var(--primary);">${fmt(p.collected)}</td>
        <td style="color:var(--warning);">${fmt(p.outstanding)}</td>
        <td style="color:var(--danger);">${fmt(p.totalExpenses)}</td>
        <td style="font-weight:700;">${fmt(p.margin)}</td>
      </tr>
    `).join('');

    // B. Expense Summary
    const expSummaryHtml = `
      <tr><td>Student Payroll</td><td style="font-weight:700">${fmt(summary.totalPayroll)}</td></tr>
      <tr><td>Faculty / Resource Costs</td><td style="font-weight:700">${fmt(summary.totalFaculty)}</td></tr>
      <tr><td>Hosting & Other Expenses</td><td style="font-weight:700">${fmt(summary.totalOtherExpenses)}</td></tr>
      <tr style="background:#f8fafc; border-top:2px solid var(--border-color);">
        <td style="font-weight:700;">Total Expenses</td>
        <td style="font-weight:800;color:var(--danger)">${fmt(summary.totalExpenses)}</td>
      </tr>
    `;

    // C. Accounts Receivable
    const accountsReceivableHtml = invoices.filter(i => i.status !== 'Paid').map(i => `
      <tr>
        <td>${i.client}</td>
        <td>${i.projectName}</td>
        <td style="font-family:monospace;">${i.id}</td>
        <td style="font-weight:700">${fmt(i.grandTotal)}</td>
        <td>${i.dueDate}</td>
        <td><span class="fin-badge warning">Pending</span></td>
      </tr>
    `).join('');

    // D. Payroll Summary
    const payrollSummary = {};
    payroll.forEach(pr => {
      if (!payrollSummary[pr.projectName]) {
        payrollSummary[pr.projectName] = { count: 0, gross: 0, paid: 0, pending: 0 };
      }
      payrollSummary[pr.projectName].count += 1;
      payrollSummary[pr.projectName].gross += pr.grossAmount;
      if (pr.status === 'Paid') payrollSummary[pr.projectName].paid += pr.grossAmount;
      else payrollSummary[pr.projectName].pending += pr.grossAmount;
    });

    const payrollSummaryHtml = Object.keys(payrollSummary).map(proj => {
      const data = payrollSummary[proj];
      return `
        <tr>
          <td><div style="font-weight:600">${proj}</div></td>
          <td>${data.count} records</td>
          <td style="font-weight:700">${fmt(data.gross)}</td>
          <td style="color:var(--primary);">${fmt(data.paid)}</td>
          <td style="color:var(--warning);">${fmt(data.pending)}</td>
        </tr>
      `;
    }).join('');


    container.innerHTML = `
      <div class="fin-page-header">
        <div>
          <h1>Financial Reports</h1>
          <p>Static reports generated from real-time data</p>
        </div>
      </div>
      
      <div class="fin-grid-2">
        <div class="fin-panel" style="margin-bottom:0">
          <div class="fin-panel-header">
            <div class="fin-panel-title">A. Project Profitability Report</div>
          </div>
          <div class="fin-table-wrap" style="max-height:300px;overflow-y:auto;">
            <table class="fin-table">
              <thead><tr><th>Project</th><th>Billing</th><th>Collected</th><th>Outst.</th><th>Expenses</th><th>Margin</th></tr></thead>
              <tbody>${projProfHtml}</tbody>
            </table>
          </div>
        </div>

        <div class="fin-panel" style="margin-bottom:0">
          <div class="fin-panel-header">
            <div class="fin-panel-title">B. Expense Summary</div>
          </div>
          <div class="fin-table-wrap">
            <table class="fin-table">
              <thead><tr><th>Category</th><th>Total Amount</th></tr></thead>
              <tbody>${expSummaryHtml}</tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="fin-grid-2">
        <div class="fin-panel" style="margin-bottom:0">
          <div class="fin-panel-header">
            <div class="fin-panel-title">C. Accounts Receivable</div>
          </div>
          <div class="fin-table-wrap" style="max-height:300px;overflow-y:auto;">
            <table class="fin-table">
              <thead><tr><th>Client</th><th>Project</th><th>Invoice</th><th>Amount</th><th>Due Date</th><th>Status</th></tr></thead>
              <tbody>
                ${accountsReceivableHtml || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No outstanding receivables</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <div class="fin-panel" style="margin-bottom:0">
          <div class="fin-panel-header">
            <div class="fin-panel-title">D. Payroll Summary</div>
          </div>
          <div class="fin-table-wrap" style="max-height:300px;overflow-y:auto;">
            <table class="fin-table">
              <thead><tr><th>Project</th><th>Records</th><th>Gross Payroll</th><th>Paid</th><th>Pending</th></tr></thead>
              <tbody>${payrollSummaryHtml}</tbody>
            </table>
          </div>
        </div>
      </div>
    `;

  } catch (e) {
    container.innerHTML = `<div class="alert-error">Failed to generate reports.</div>`;
  }

  return container;
}

export default FinancialReports;
