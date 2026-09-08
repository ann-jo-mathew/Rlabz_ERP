import { financeService } from '../services/FinanceService.js';
import { updateFinanceSidebar } from '../layouts/FinanceLayout.js';
import html2pdf from 'html2pdf.js';

export async function StudentPayroll(route, router) {
  const container = document.createElement('div');
  container.className = 'finance-module animate-fade-in';
  setTimeout(updateFinanceSidebar, 0);

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  const fmtDate = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    return isNaN(dt) ? d : dt.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  let payrollData = [];
  let allProjects = [];
  let rateHistory = [];
  let currentGlobalRate = 0;

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
      const projId = pr.project_id || '';
      const sName = pr.student_name || 'Unknown';
      const desg = (pr.designation || '').charAt(0).toUpperCase() + (pr.designation || '').slice(1);
      const status = pr.status || 'Pending';
      
      const matchProject = projectFilter === 'All' || projId.toString() === projectFilter;
      const matchDesg = desgFilter === 'All' || desg === desgFilter;
      const matchStatus = statusFilter === 'All' || status === statusFilter;
      const matchSearch = !searchTerm || sName.toLowerCase().includes(searchTerm) || (pr.project_student_id || '').toString().includes(searchTerm);
      return matchProject && matchDesg && matchStatus && matchSearch;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      noResults.style.display = 'block';
      return;
    }

    noResults.style.display = 'none';
    tbody.innerHTML = filtered.map(pr => {
      const sName = pr.student_name || 'Unknown';
      const projName = pr.project_name || 'Unknown';
      const desg = (pr.designation || '').charAt(0).toUpperCase() + (pr.designation || '').slice(1);
      const status = pr.status || 'Pending';

      const isPaid = status === 'Paid';
      const isPartial = status === 'Partially Paid';

      let actionHtml = '';
      if (isPaid) {
        actionHtml = `<button class="fin-btn outline sm receipt-btn" data-id="${pr.project_student_id}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Download Receipt
        </button>`;
      } else {
        actionHtml = `<button class="fin-btn primary sm process-btn" data-id="${pr.project_student_id}" data-desg="${pr.designation}" data-remaining="${pr.remaining_payable}">Process Payment</button>`;
      }

      const desgClass = desg === 'Nova' ? 'nova' : desg === 'Orbit' ? 'orbit' : 'spark';
      const statusClass = isPaid ? 'success' : isPartial ? 'info' : 'warning';

      return `
        <tr>
          <td>
            <div style="font-weight:600">${sName}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">PS-ID: ${pr.project_student_id}</div>
          </td>
          <td><span class="fin-badge ${desgClass}">${desg}</span></td>
          <td><div style="font-weight:500">${projName}</div></td>
          <td>
            <div class="fin-hours-cell">
              <span class="fin-hours-approved" style="display:block;margin-bottom:2px">Tasks: ${pr.completed_tasks || 0}</span>
              <span class="fin-hours-approved">Hours: ${pr.approved_hours || 0}</span>
            </div>
          </td>
          <td style="font-family:var(--font-mono,monospace);font-size:0.875rem;">₹${pr.hourly_rate || 0}/hr</td>
          <td style="font-weight:700;color:var(--text-main)">${fmt(pr.gross_amount || 0)}</td>
          <td style="color:var(--primary);font-weight:600">${fmt(pr.amount_paid || 0)}</td>
          <td style="color:#d97706;font-weight:600">${fmt(pr.remaining_payable || 0)}</td>
          <td><span class="fin-badge ${statusClass}">${status}</span></td>
          <td>${actionHtml}</td>
        </tr>
      `;
    }).join('');

    bindTableEvents();
  };

  const bindTableEvents = () => {
    container.querySelectorAll('.process-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const psId = btn.dataset.id;
        const desg = btn.dataset.desg;
        const remaining = parseFloat(btn.dataset.remaining) || 0;
        
        // Create payment modal
        const modal = document.createElement('div');
        modal.className = 'fin-modal-overlay';
        modal.innerHTML = `
          <div class="fin-modal">
            <h3 style="margin:0 0 1rem">Process Student Payment</h3>
            <div class="fin-form-group">
              <label>Amount (Max Remaining: ${fmt(remaining)})</label>
              <input type="number" class="fin-input" id="pay-amount" value="${remaining}" max="${remaining}" step="0.01">
            </div>
            <div class="fin-form-group">
              <label>Payment Date</label>
              <input type="date" class="fin-input" id="pay-date" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="fin-form-actions" style="margin-top:1rem">
              <button class="fin-btn primary" id="confirm-pay">Confirm Payment</button>
              <button class="fin-btn outline" id="cancel-pay">Cancel</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        
        modal.querySelector('#cancel-pay').addEventListener('click', () => modal.remove());
        modal.querySelector('#confirm-pay').addEventListener('click', async () => {
          const amount = parseFloat(modal.querySelector('#pay-amount').value);
          const payDate = modal.querySelector('#pay-date').value;
          if (!amount || amount <= 0) { alert('Enter a valid amount'); return; }
          try {
            await financeService.processPayroll({
              project_student_id: psId,
              amount: amount,
              payment_date: payDate,
              designation: desg
            });
            modal.remove();
            
            // set loading state before re-fetching
            const tbody = container.querySelector('#payroll-tbody');
            if (tbody) tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:3rem;color:var(--text-muted)"><span class="fin-spinner" style="margin-right:10px"></span> Updating payroll...</td></tr>`;
            
            payrollData = await financeService.getStudentPayroll();
            renderTable();
          } catch (e) {
            alert('Payment failed: ' + e.message);
          }
        });
      });
    });

    container.querySelectorAll('.receipt-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const pr = payrollData.find(p => p.project_student_id?.toString() === btn.dataset.id);
        if (!pr) return;
        btn.disabled = true;
        btn.innerHTML = '<span class="fin-spinner"></span>';
        try {
          await generateReceipt({
            studentName: pr.student_name,
            id: pr.project_student_id,
            designation: (pr.designation || '').charAt(0).toUpperCase() + (pr.designation || '').slice(1),
            projectName: pr.project_name,
            approvedHours: pr.approved_hours,
            rate: pr.hourly_rate,
            grossAmount: pr.gross_amount,
            txRef: 'SP-' + pr.project_student_id,
            paymentDate: new Date().toLocaleDateString('en-IN'),
            loggedHours: pr.approved_hours,
            period: 'Current Period'
          });
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
    container.innerHTML = `
      <div class="fin-page-header">
        <div>
          <h1>Student Payroll</h1>
          <p>Project-based student compensation management</p>
        </div>
      </div>

      <!-- Hourly Rate Manager -->
      <div class="fin-panel" style="margin-bottom: 2rem;">
        <div class="fin-panel-header">
          <div>
            <div class="fin-panel-title">Global Student Hourly Rate</div>
            <div class="fin-panel-subtitle">Manage the base hourly rate applied to all student payrolls</div>
          </div>
        </div>
        <div style="display:flex; gap:2rem; align-items:flex-start; padding:1.5rem;">
          <div style="flex:1; max-width: 300px; background:#f8fafb; border:1px solid #e2e8f0; border-radius:8px; padding:1rem;">
            <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.5rem">Current Base Rate</div>
            <div style="font-size:2rem; font-weight:700; color:var(--primary); margin-bottom:1rem" id="current-rate-display">₹0</div>
            <div class="fin-form-group" style="margin-bottom:0.5rem">
              <label>Update Rate (₹)</label>
              <input type="number" class="fin-input" id="new-rate-input" placeholder="New hourly rate" min="0" step="0.01" disabled>
            </div>
            <div style="display:flex; gap:0.5rem;">
              <button class="fin-btn outline w-full" id="edit-rate-btn">Edit Rate</button>
              <button class="fin-btn primary w-full" id="update-rate-btn" style="display:none;">Save Rate</button>
            </div>
          </div>
          
          <div style="flex:2;">
            <div style="font-size:0.9rem; font-weight:600; margin-bottom:0.75rem">Rate History</div>
            <div class="fin-table-wrap" style="max-height: 200px; overflow-y: auto;">
              <table class="fin-table" style="font-size:0.85rem">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Old Rate</th>
                    <th>New Rate</th>
                    <th>Updated By</th>
                  </tr>
                </thead>
                <tbody id="rate-history-tbody">
                  <tr><td colspan="4" style="text-align:center;color:var(--text-muted)">Loading history...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>


      <!-- Project-first picker -->
      <div class="fin-project-picker">
        <div class="fin-project-picker-title">Project Context</div>
        <div class="fin-select-wrap" style="max-width:400px;">
          <select id="project-filter" class="fin-input">
            <option value="All">All Projects</option>
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
              <option value="Pending">Pending</option>
              <option value="Partially Paid">Partially Paid</option>
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
                <th>Completed Tasks / Hours</th>
                <th>Rate</th>
                <th>Gross Amount</th>
                <th>Paid</th>
                <th>Remaining</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="payroll-tbody">
              <tr><td colspan="10" style="text-align:center;padding:3rem;color:var(--text-muted)"><span class="fin-spinner" style="margin-right:10px"></span> Loading payroll data...</td></tr>
            </tbody>
          </table>
          <div id="no-results" style="display:none;text-align:center;padding:2.5rem;color:var(--text-muted)">
            <p style="margin:0;font-size:0.9rem">No payroll records found for the selected filters.</p>
          </div>
        </div>
      </div>
    `;

    const loadData = async () => {
      try {
        payrollData = await financeService.getStudentPayroll();
        allProjects = await financeService.getProjectsList();
        
        const projectFilter = container.querySelector('#project-filter');
        projectFilter.innerHTML = '<option value="All">All Projects</option>' + allProjects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        
        renderTable();
        
        // Fetch and render rate history
        rateHistory = await financeService.getStudentHourlyRateHistory();
        if (payrollData.length > 0) {
           currentGlobalRate = payrollData[0].hourly_rate; // Or fetch separately if needed
           container.querySelector('#current-rate-display').textContent = '₹' + currentGlobalRate;
        }
        renderRateHistory();

      } catch (e) {
        container.querySelector('#payroll-tbody').innerHTML = `<tr><td colspan="10" style="text-align:center;padding:2rem;color:#ef4444">Failed to load payroll data: ${e.message} <button class="fin-btn outline sm" onclick="window.location.reload()" style="margin-left:10px">Retry</button></td></tr>`;
      }
    };

    const renderRateHistory = () => {
      const tbody = container.querySelector('#rate-history-tbody');
      if (!tbody) return;
      if (rateHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">No history available.</td></tr>';
        return;
      }
      tbody.innerHTML = rateHistory.map(h => `
        <tr>
          <td>${new Date(h.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
          <td>₹${h.old_rate}</td>
          <td style="font-weight:600; color:var(--primary)">₹${h.new_rate}</td>
          <td>${h.updated_by_name}</td>
        </tr>
      `).join('');
    };

    // Bind Edit Rate Button
    container.querySelector('#edit-rate-btn')?.addEventListener('click', () => {
      container.querySelector('#new-rate-input').disabled = false;
      container.querySelector('#new-rate-input').focus();
      container.querySelector('#edit-rate-btn').style.display = 'none';
      container.querySelector('#update-rate-btn').style.display = 'block';
    });

    // Bind Update Rate Button
    container.querySelector('#update-rate-btn')?.addEventListener('click', async () => {
      const newRateStr = container.querySelector('#new-rate-input').value;
      const newRate = parseFloat(newRateStr);
      if (isNaN(newRate) || newRate < 0) return alert('Enter a valid positive rate');
      
      const btn = container.querySelector('#update-rate-btn');
      btn.disabled = true;
      btn.textContent = 'Saving...';
      try {
        await financeService.updateStudentHourlyRate({ new_rate: newRate });
        alert('Global student hourly rate updated successfully!');
        window.location.reload(); // Reload to refresh history and potentially payroll calculation
      } catch (e) {
        alert('Failed to update rate: ' + e.message);
        btn.disabled = false;
        btn.textContent = 'Update Rate';
      }
    });

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

    loadData();

  } catch (e) {
    container.innerHTML = `<div class="alert-error">Failed to load payroll data: ${e.message}</div>`;
  }

  return container;
}

export default StudentPayroll;
