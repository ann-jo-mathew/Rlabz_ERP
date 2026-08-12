import { financeService } from '../services/FinanceService.js';
import { updateFinanceSidebar } from '../layouts/FinanceLayout.js';
import html2pdf from 'html2pdf.js';

export async function StudentPayroll(route, router) {
  const container = document.createElement('div');
  container.className = 'finance-module animate-fade-in';
  setTimeout(updateFinanceSidebar, 0);

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  let payrollData = [];
  let allProjects = [];

  // ─── Receipt PDF Generation ───────────────────────────────────
  const generateReceipt = (pr) => {
    const printEl = document.createElement('div');
    printEl.innerHTML = `
      <div style="font-family: Arial, sans-serif; color: #1a1a1a; padding: 40px; max-width: 700px; margin: 0 auto;">
        <!-- Header -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom: 3px solid #059669; padding-bottom: 18px; margin-bottom: 24px;">
          <div>
            <div style="font-size:24px; font-weight:900; color:#059669; letter-spacing:-0.5px;">RLabZ</div>
            <div style="font-size:12px; color:#666; margin-top:4px;">Modular Enterprise Resource Planning<br>Rajagiri College of Social Sciences, Kochi</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:18px; font-weight:800; color:#333; margin-bottom:4px;">STUDENT PAYROLL RECEIPT</div>
            <div style="font-size:12px; color:#666;">Ref: <strong>${pr.txRef}</strong></div>
            <div style="font-size:12px; color:#666;">Payment Date: <strong>${pr.paymentDate}</strong></div>
          </div>
        </div>

        <!-- Student Info -->
        <div style="display:flex; justify-content:space-between; margin-bottom:24px; background:#f8fafb; border-radius:8px; padding:16px 20px;">
          <div>
            <div style="font-size:11px; text-transform:uppercase; color:#888; letter-spacing:0.05em; margin-bottom:4px;">Student Name</div>
            <div style="font-size:16px; font-weight:700;">${pr.studentName}</div>
            <div style="font-size:12px; color:#666; margin-top:2px;">ID: ${pr.id}</div>
          </div>
          <div>
            <div style="font-size:11px; text-transform:uppercase; color:#888; letter-spacing:0.05em; margin-bottom:4px;">Designation</div>
            <div style="font-size:16px; font-weight:700;">${pr.designation}</div>
          </div>
          <div>
            <div style="font-size:11px; text-transform:uppercase; color:#888; letter-spacing:0.05em; margin-bottom:4px;">Project</div>
            <div style="font-size:16px; font-weight:700;">${pr.projectName}</div>
          </div>
        </div>

        <!-- Payroll Details -->
        <table style="width:100%; border-collapse:collapse; margin-bottom:24px; font-size:13px;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="padding:10px 14px; text-align:left; color:#555; font-size:11px; text-transform:uppercase; letter-spacing:0.05em; border-bottom:2px solid #e2e8f0;">Description</th>
              <th style="padding:10px 14px; text-align:right; color:#555; font-size:11px; text-transform:uppercase; letter-spacing:0.05em; border-bottom:2px solid #e2e8f0;">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid #e2e8f0;">
              <td style="padding:10px 14px;">Payroll Period</td>
              <td style="padding:10px 14px; text-align:right; font-weight:600;">${pr.period}</td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0;">
              <td style="padding:10px 14px;">Logged Hours</td>
              <td style="padding:10px 14px; text-align:right; color:#666;">${pr.loggedHours} hrs</td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0;">
              <td style="padding:10px 14px; font-weight:600;">Approved Hours</td>
              <td style="padding:10px 14px; text-align:right; font-weight:600;">${pr.approvedHours} hrs</td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0;">
              <td style="padding:10px 14px;">Applicable Rate (${pr.designation})</td>
              <td style="padding:10px 14px; text-align:right; font-weight:600;">₹${pr.rate}/hr</td>
            </tr>
          </tbody>
        </table>

        <!-- Total -->
        <div style="display:flex; justify-content:flex-end; margin-bottom:28px;">
          <table style="width:280px; font-size:14px;">
            <tr style="border-top:2px solid #059669;">
              <td style="padding:12px 14px; font-size:16px; font-weight:800;">Total Paid</td>
              <td style="padding:12px 14px; text-align:right; font-size:18px; font-weight:800; color:#059669;">${fmt(pr.grossAmount)}</td>
            </tr>
          </table>
        </div>

        <!-- Payment Status -->
        <div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:8px; padding:16px 20px;">
          <div style="font-size:11px; text-transform:uppercase; color:#065f46; letter-spacing:0.05em; margin-bottom:6px;">Payment Status</div>
          <div style="font-size:17px; font-weight:800; color:#059669;">PAID</div>
          <div style="font-size:13px; color:#065f46; margin-top:6px;">
            Paid on: <strong>${pr.paymentDate}</strong>&nbsp;&nbsp;|&nbsp;&nbsp;
            Transaction Ref: <strong style="font-family:monospace;">${pr.txRef}</strong>
          </div>
        </div>

        <div style="margin-top:30px; text-align:center; font-size:11px; color:#aaa;">
          This is a system-generated payroll receipt from RLabZ ERP. No signature required.
        </div>
      </div>
    `;

    const opt = {
      margin: 0.4,
      filename: `Payroll_Receipt_${pr.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'css' }
    };
    return html2pdf().set(opt).from(printEl).save();
  };

  // ─── Render Table ─────────────────────────────────────────────
  const renderTable = () => {
    const tbody = container.querySelector('#payroll-tbody');
    const noResults = container.querySelector('#no-results');
    if (!tbody) return;

    const projectFilter = container.querySelector('#project-filter').value;
    const desgFilter = container.querySelector('#desg-filter').value;
    const statusFilter = container.querySelector('#status-filter').value;
    const searchTerm = (container.querySelector('#search-input')?.value || '').toLowerCase();

    const filtered = payrollData.filter(pr => {
      const matchProject = projectFilter === 'All' || pr.projectId.toString() === projectFilter;
      const matchDesg = desgFilter === 'All' || pr.designation === desgFilter;
      const matchStatus = statusFilter === 'All' || pr.status === statusFilter;
      const matchSearch = !searchTerm || pr.studentName.toLowerCase().includes(searchTerm) || pr.id.toLowerCase().includes(searchTerm);
      return matchProject && matchDesg && matchStatus && matchSearch;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      noResults.style.display = 'block';
      return;
    }

    noResults.style.display = 'none';
    tbody.innerHTML = filtered.map(pr => {
      const isPaid = pr.status === 'Paid';
      const isProcessing = pr.status === 'Processing';
      const isApproved = pr.status === 'Approved';
      const isCalculated = pr.status === 'Calculated';

      let actionHtml = '';
      if (isCalculated) {
        actionHtml = `<button class="fin-btn outline sm approve-btn" data-id="${pr.id}">Approve</button>`;
      } else if (isApproved) {
        actionHtml = `<button class="fin-btn primary sm process-btn" data-id="${pr.id}">Process Payment</button>`;
      } else if (isProcessing) {
        actionHtml = `<span style="display:flex;align-items:center;gap:6px;color:var(--primary);font-size:0.8rem;font-weight:600;"><span class="fin-spinner"></span>Processing...</span>`;
      } else if (isPaid) {
        actionHtml = `<button class="fin-btn outline sm receipt-btn" data-id="${pr.id}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Download Receipt
        </button>`;
      }

      const desgClass = pr.designation === 'Nova' ? 'nova' : pr.designation === 'Orbit' ? 'orbit' : 'spark';
      const statusClass = isPaid ? 'success' : isApproved ? 'primary' : isProcessing ? 'info' : 'warning';

      return `
        <tr>
          <td>
            <div style="font-weight:600">${pr.studentName}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">${pr.id}</div>
          </td>
          <td><span class="fin-badge ${desgClass}">${pr.designation}</span></td>
          <td><div style="font-weight:500">${pr.projectName}</div></td>
          <td>
            <div class="fin-hours-cell">
              <span class="fin-hours-logged">Logged: ${pr.loggedHours}h</span>
              <span class="fin-hours-approved">Approved: ${pr.approvedHours}h</span>
            </div>
          </td>
          <td style="font-family:var(--font-mono,monospace);font-size:0.875rem;">₹${pr.rate}/hr</td>
          <td style="font-weight:700;color:var(--text-main)">${fmt(pr.grossAmount)}</td>
          <td style="font-size:0.875rem;color:var(--text-muted)">${pr.period}</td>
          <td><span class="fin-badge ${statusClass}">${pr.status}</span></td>
          <td>${actionHtml}</td>
        </tr>
      `;
    }).join('');

    bindTableEvents();
  };

  const bindTableEvents = () => {
    container.querySelectorAll('.approve-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pr = payrollData.find(p => p.id === btn.dataset.id);
        if (pr) { pr.status = 'Approved'; renderTable(); }
      });
    });

    container.querySelectorAll('.process-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const pr = payrollData.find(p => p.id === id);
        if (!pr) return;
        pr.status = 'Processing';
        renderTable();
        try {
          await financeService.processPayroll(id);
          payrollData = await financeService.getStudentPayroll();
          renderTable();
        } catch (e) {
          pr.status = 'Approved';
          renderTable();
          alert('Failed to process payroll: ' + e.message);
        }
      });
    });

    container.querySelectorAll('.receipt-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const pr = payrollData.find(p => p.id === btn.dataset.id);
        if (!pr || pr.status !== 'Paid') return;
        btn.disabled = true;
        btn.innerHTML = '<span class="fin-spinner"></span>';
        try {
          await generateReceipt(pr);
        } catch (e) {
          alert('Failed to generate receipt: ' + e.message);
        } finally {
          btn.disabled = false;
          btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Download Receipt`;
        }
      });
    });
  };

  try {
    payrollData = await financeService.getStudentPayroll();
    allProjects = await financeService.getProjectsList();

    container.innerHTML = `
      <div class="fin-page-header">
        <div>
          <h1>Student Payroll</h1>
          <p>Project-based student compensation management</p>
        </div>
      </div>

      <!-- Project-first picker -->
      <div class="fin-project-picker">
        <div class="fin-project-picker-title">Project Context</div>
        <div class="fin-select-wrap" style="max-width:400px;">
          <select id="project-filter" class="fin-input">
            <option value="All">All Projects</option>
            ${allProjects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- Additional Filters -->
      <div class="fin-filter-bar">
        <div class="fin-filter-group" style="flex:2; min-width:180px;">
          <label>Search Student</label>
          <div class="fin-search-wrap">
            <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" id="search-input" class="fin-input" placeholder="Search by student name or ID...">
          </div>
        </div>
        <div class="fin-filter-group" style="min-width:130px; max-width:160px;">
          <label>Designation</label>
          <div class="fin-select-wrap">
            <select id="desg-filter" class="fin-input">
              <option value="All">All</option>
              <option value="Nova">Nova</option>
              <option value="Orbit">Orbit</option>
              <option value="Spark">Spark</option>
            </select>
          </div>
        </div>
        <div class="fin-filter-group" style="min-width:140px; max-width:180px;">
          <label>Payment Status</label>
          <div class="fin-select-wrap">
            <select id="status-filter" class="fin-input">
              <option value="All">All Statuses</option>
              <option value="Calculated">Calculated</option>
              <option value="Approved">Approved</option>
              <option value="Processing">Processing</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
        </div>
        <div style="align-self:flex-end;">
          <button id="clear-filters-btn" class="fin-btn outline">Clear Filters</button>
        </div>
      </div>

      <!-- Table -->
      <div class="fin-panel">
        <div class="fin-panel-header">
          <div class="fin-panel-title">Payroll Ledger</div>
          <div id="payroll-count" style="font-size:0.8rem;color:var(--text-muted)"></div>
        </div>
        <div class="fin-table-wrap">
          <table class="fin-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Designation</th>
                <th>Project</th>
                <th>Hours (Logged / Approved)</th>
                <th>Rate</th>
                <th>Calculated Amount</th>
                <th>Period</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="payroll-tbody"></tbody>
          </table>
          <div id="no-results" style="display:none;text-align:center;padding:2.5rem;color:var(--text-muted)">
            <p style="margin:0;font-size:0.9rem">No payroll records found for the selected filters.</p>
          </div>
        </div>
      </div>
    `;

    const projectFilter = container.querySelector('#project-filter');
    const searchInput = container.querySelector('#search-input');
    const desgFilter = container.querySelector('#desg-filter');
    const statusFilter = container.querySelector('#status-filter');

    projectFilter.addEventListener('change', renderTable);
    searchInput.addEventListener('input', renderTable);
    desgFilter.addEventListener('change', renderTable);
    statusFilter.addEventListener('change', renderTable);

    container.querySelector('#clear-filters-btn').addEventListener('click', () => {
      projectFilter.value = 'All';
      searchInput.value = '';
      desgFilter.value = 'All';
      statusFilter.value = 'All';
      renderTable();
    });

    renderTable();

  } catch (e) {
    container.innerHTML = `<div class="alert-error">Failed to load payroll data: ${e.message}</div>`;
  }

  return container;
}

export default StudentPayroll;
