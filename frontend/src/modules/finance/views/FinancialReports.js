import { financeService } from '../services/FinanceService.js';
import { updateFinanceSidebar } from '../layouts/FinanceLayout.js';
import html2pdf from 'html2pdf.js';

export async function FinancialReports(route, router) {
  const container = document.createElement('div');
  container.className = 'finance-module animate-fade-in';
  setTimeout(updateFinanceSidebar, 0);

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  let data = {};

  const buildPDFHTML = (type, typeLabel, projectLabel, reportHTML) => `
    <div style="font-family: Arial, sans-serif; color: #1a1a1a; padding: 40px; max-width: 950px; margin: 0 auto;">
      <div style="border-bottom:3px solid #059669; padding-bottom:14px; margin-bottom:24px;">
        <div style="font-size:22px; font-weight:900; color:#059669; margin-bottom:4px;">RLabZ — Financial Report</div>
        <div style="font-size:13px; font-weight:700; color:#333;">${typeLabel}</div>
        <div style="font-size:12px; color:#888; margin-top:4px;">
          Filter: ${projectLabel}&nbsp;&nbsp;|&nbsp;&nbsp;Generated: ${new Date().toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })}
        </div>
      </div>
      ${reportHTML}
      <div style="margin-top:30px; text-align:center; font-size:10px; color:#bbb; border-top:1px solid #e2e8f0; padding-top:12px;">
        This is a system-generated report from RLabZ ERP. Data is indicative and subject to final verification.
      </div>
    </div>
  `;

  const tableStyle = 'width:100%; border-collapse:collapse; margin-bottom:20px; font-size:12px;';
  const thStyle = 'padding:9px 12px; text-align:left; font-size:10px; text-transform:uppercase; letter-spacing:0.05em; color:#64748b; border-bottom:2px solid #e2e8f0; font-weight:700; background:#f8fafc;';
  const tdStyle = 'padding:9px 12px; border-bottom:1px solid #e2e8f0;';

  const renderReport = () => {
    const reportContent = container.querySelector('#report-content');
    const noResults = container.querySelector('#no-report-results');
    const previewPanel = container.querySelector('#report-preview-panel');

    if (!reportContent) return;

    const type = container.querySelector('#report-type').value;
    const projectFilter = container.querySelector('#report-project').value;

    let html = '';
    let hasData = true;

    if (type === 'ProjectProfitability') {
      const filtered = projectFilter === 'All' ? data.projects : data.projects.filter(p => p.id.toString() === projectFilter);
      if (!filtered.length) { hasData = false; } else {
        html = `
          <h3 style="margin:0 0 12px 0;font-size:15px;">Project Profitability Report</h3>
          <table class="fin-table">
            <thead><tr>
              <th>Project</th><th>Billing</th><th>Collected</th><th>Outstanding</th><th>Expenses</th><th>Margin</th>
            </tr></thead>
            <tbody>
              ${filtered.map(p => `<tr>
                <td><div style="font-weight:600">${p.name}</div><div style="font-size:0.75rem;color:var(--text-muted)">${p.client}</div></td>
                <td style="font-weight:600">${fmt(p.totalBilling)}</td>
                <td style="color:var(--primary);font-weight:600">${fmt(p.collected)}</td>
                <td style="color:#d97706;font-weight:600">${fmt(p.outstanding)}</td>
                <td style="color:#ef4444;font-weight:600">${fmt(p.totalExpenses)}</td>
                <td style="font-weight:700">${fmt(p.margin)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        `;
      }
    }
    else if (type === 'Payroll') {
      const filtered = projectFilter === 'All' ? data.payroll : data.payroll.filter(p => p.projectId.toString() === projectFilter);
      if (!filtered.length) { hasData = false; } else {
        html = `
          <h3 style="margin:0 0 12px 0;font-size:15px;">Student Payroll Report</h3>
          <table class="fin-table">
            <thead><tr>
              <th>Student</th><th>Designation</th><th>Project</th><th>Logged Hrs</th><th>Approved Hrs</th><th>Rate</th><th>Amount</th><th>Status</th>
            </tr></thead>
            <tbody>
              ${filtered.map(pr => {
                const dc = pr.designation === 'Nova' ? 'nova' : pr.designation === 'Orbit' ? 'orbit' : 'spark';
                return `<tr>
                  <td><div style="font-weight:600">${pr.studentName}</div><div style="font-size:0.75rem;color:var(--text-muted)">${pr.id}</div></td>
                  <td><span class="fin-badge ${dc}">${pr.designation}</span></td>
                  <td>${pr.projectName}</td>
                  <td style="color:var(--text-muted)">${pr.loggedHours}h</td>
                  <td style="font-weight:600">${pr.approvedHours}h</td>
                  <td style="font-size:0.82rem">₹${pr.rate}/hr</td>
                  <td style="font-weight:700">${fmt(pr.grossAmount)}</td>
                  <td><span class="fin-badge ${pr.status === 'Paid' ? 'success' : 'warning'}">${pr.status}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        `;
      }
    }
    else if (type === 'Transactions') {
      const filtered = projectFilter === 'All' ? data.transactions : data.transactions.filter(t => t.projectId.toString() === projectFilter);
      if (!filtered.length) { hasData = false; } else {
        html = `
          <h3 style="margin:0 0 12px 0;font-size:15px;">Transaction Report</h3>
          <table class="fin-table">
            <thead><tr>
              <th>Txn ID</th><th>Date</th><th>Project</th><th>Type</th><th>Description</th><th>Amount</th><th>Category</th>
            </tr></thead>
            <tbody>
              ${filtered.map(t => `<tr>
                <td style="font-family:monospace;font-size:0.8rem;font-weight:600;color:var(--primary)">${t.id || '—'}</td>
                <td style="white-space:nowrap">${t.date}</td>
                <td style="font-weight:600">${t.projectName}</td>
                <td><span class="fin-badge neutral" style="font-size:0.72rem">${t.type}</span></td>
                <td style="font-size:0.82rem;color:var(--text-muted)">${t.desc}</td>
                <td style="font-weight:700">${fmt(t.amount)}</td>
                <td><span class="fin-badge ${t.incomeExpense === 'Income' ? 'success' : 'neutral'}" style="font-size:0.72rem">${t.incomeExpense}</span></td>
              </tr>`).join('')}
            </tbody>
          </table>
        `;
      }
    }
    else {
      html = `
        <div style="padding:2rem; text-align:center; color:var(--text-muted);">
          <p style="font-size:0.9rem;margin:0">${type} report is available as a configurable placeholder.<br>
          Connect to the Laravel API to populate with real-time aggregated data.</p>
        </div>
      `;
      hasData = true;
    }

    if (!hasData) {
      reportContent.innerHTML = '';
      noResults.style.display = 'block';
    } else {
      noResults.style.display = 'none';
      reportContent.innerHTML = html;
    }

    previewPanel.style.display = 'block';
  };

  const generatePDF = async () => {
    const type = container.querySelector('#report-type').value;
    const typeLabel = container.querySelector('#report-type').options[container.querySelector('#report-type').selectedIndex].text;
    const projectLabel = container.querySelector('#report-project').options[container.querySelector('#report-project').selectedIndex].text;
    const reportHTML = container.querySelector('#report-content').innerHTML;

    if (!reportHTML.trim()) { alert('Please generate a report first.'); return; }

    const fullHTML = buildPDFHTML(type, typeLabel, projectLabel, reportHTML
      // Adapt inline theme vars to static values for PDF
      .replace(/var\(--primary\)/g, '#059669')
      .replace(/var\(--text-muted\)/g, '#64748b')
      .replace(/var\(--text-main\)/g, '#1a1a1a')
    );

    // Override badge colors for PDF rendering (no CSS vars in html2canvas)
    const wrapper = document.createElement('div');
    wrapper.innerHTML = fullHTML;
    wrapper.querySelectorAll('.fin-badge').forEach(el => {
      const cls = [...el.classList];
      if (cls.includes('success')) { el.style.cssText = 'display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700;background:#d1fae5;color:#065f46;'; }
      else if (cls.includes('warning')) { el.style.cssText = 'display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700;background:#fef3c7;color:#92400e;'; }
      else if (cls.includes('nova')) { el.style.cssText = 'display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700;background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;'; }
      else if (cls.includes('orbit')) { el.style.cssText = 'display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700;background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;'; }
      else if (cls.includes('spark')) { el.style.cssText = 'display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700;background:#fffbeb;color:#92400e;border:1px solid #fde68a;'; }
      else { el.style.cssText = 'display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700;background:#f1f5f9;color:#475569;'; }
    });

    wrapper.querySelectorAll('.fin-table').forEach(t => {
      t.style.cssText = tableStyle;
    });
    wrapper.querySelectorAll('.fin-table th').forEach(th => { th.style.cssText = thStyle; });
    wrapper.querySelectorAll('.fin-table td').forEach(td => { td.style.cssText = tdStyle; });

    const btn = container.querySelector('#download-pdf-btn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<span class="fin-spinner"></span> Generating...';
    btn.disabled = true;

    try {
      await html2pdf().set({
        margin: [0.45, 0.45, 0.45, 0.45],
        filename: `RLabZ_${typeLabel.replace(/\s+/g, '_')}_Report.pdf`,
        image: { type: 'jpeg', quality: 0.97 },
        html2canvas: { scale: 2, useCORS: true, logging: false, width: 1050 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' },
        pagebreak: { mode: 'css', avoid: 'tr' }
      }).from(wrapper).save();
    } catch (err) {
      alert('PDF generation failed: ' + err.message);
    } finally {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }
  };

  try {
    data.summary = await financeService.getDashboardSummary();
    data.projects = await financeService.getProjectFinances();
    data.invoices = await financeService.getInvoices();
    data.payroll = await financeService.getStudentPayroll();
    data.transactions = await financeService.getTransactions();

    container.innerHTML = `
      <div class="fin-page-header">
        <div>
          <h1>Financial Reports</h1>
          <p>Generate and export project, payroll, and transaction reports</p>
        </div>
      </div>

      <!-- Report Configurator -->
      <div class="fin-panel">
        <div class="fin-panel-header">
          <div class="fin-panel-title">Report Configuration</div>
        </div>
        <div class="fin-filter-bar" style="margin-bottom:0; box-shadow:none; border:none; padding:0; background:transparent;">
          <div class="fin-filter-group" style="min-width:220px; max-width:340px;">
            <label>Report Type</label>
            <div class="fin-select-wrap">
              <select id="report-type" class="fin-input">
                <option value="ProjectProfitability">Project Profitability</option>
                <option value="Payroll">Student Payroll</option>
                <option value="Transactions">All Transactions</option>
                <option value="Weekly">Weekly Summary</option>
                <option value="Monthly">Monthly Summary</option>
              </select>
            </div>
          </div>
          <div class="fin-filter-group" style="min-width:200px; max-width:300px;">
            <label>Project Filter</label>
            <div class="fin-select-wrap">
              <select id="report-project" class="fin-input">
                <option value="All">All Projects</option>
                ${data.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
              </select>
            </div>
          </div>
          <div style="align-self:flex-end;">
            <button class="fin-btn primary" id="generate-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              Generate Report
            </button>
          </div>
        </div>
      </div>

      <!-- Report Preview -->
      <div id="report-preview-panel" class="fin-panel" style="display:none;">
        <div class="fin-panel-header">
          <div class="fin-panel-title">Report Preview</div>
          <button class="fin-btn outline sm" id="download-pdf-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Download PDF
          </button>
        </div>
        <div id="report-content" class="fin-table-wrap"></div>
        <div id="no-report-results" style="display:none;text-align:center;padding:2.5rem;color:var(--text-muted)">
          <p style="margin:0;font-size:0.9rem">No data available for the selected filters.</p>
        </div>
      </div>
    `;

    container.querySelector('#generate-btn').addEventListener('click', renderReport);
    container.querySelector('#download-pdf-btn').addEventListener('click', generatePDF);

  } catch (e) {
    container.innerHTML = `<div class="alert-error">Failed to load reports module: ${e.message}</div>`;
  }

  return container;
}

export default FinancialReports;
