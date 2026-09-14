import { financeService } from '../services/FinanceService.js';
import { updateFinanceSidebar } from '../layouts/FinanceLayout.js';
import { renderPagination, setupPaginationListeners } from '../utils/pagination.js';

export async function ProjectFinance(route, router) {
  const container = document.createElement('div');
  container.className = 'finance-module animate-fade-in';
  setTimeout(updateFinanceSidebar, 0);

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  // ── Finance-lock helpers (Rule A + Rule B) ──────────────────────────────
  const LOCKED_STATUSES = ['closed', 'completed', 'cancelled'];

  const getFinanceLock = (project) => {
    if (project.finance_lock) return project.finance_lock;
    if (LOCKED_STATUSES.includes(project.status)) {
      const label = project.status.charAt(0).toUpperCase() + project.status.slice(1);
      return { locked: true, reason: 'status', label };
    }
    if (!project.budget || parseFloat(project.budget) <= 0) {
      return { locked: true, reason: 'no_budget', label: 'No Approved Budget' };
    }
    return { locked: false, reason: null, label: null };
  };

  const statusBadgeClass = (status) => {
    if (status === 'closed' || status === 'completed') return 'success';
    if (status === 'cancelled') return 'danger';
    if (status === 'in_progress') return 'info';
    if (status === 'accepted') return 'primary';
    return 'neutral';
  };
  // ────────────────────────────────────────────────────────────────────────

  if (route.params && route.params.id) {
    // ── PROJECT DETAIL VIEW ───────────────────────────────────────
    container.innerHTML = `
      <div style="display:flex; justify-content:center; align-items:center; height:300px; color:var(--text-muted)">
        <span class="fin-spinner" style="margin-right:10px"></span> Loading project details...
      </div>
    `;

    const loadProjectDetails = async () => {
      try {
        const projectData = await financeService.getProjectDetails(route.params.id);
        if (!projectData) throw new Error('Project finance details not found');
      
      const project    = projectData.project || {};
      const projectLock = getFinanceLock(project);
      const payments = (projectData.invoices || []).flatMap(inv => (inv.client_payments || []).map(cp => ({
        date: fmtDate(cp.payment_date),
        type: cp.payment_method ? cp.payment_method.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Bank Transfer',
        amount: cp.amount,
        status: 'Confirmed'
      })));
      const allResources = projectData.assigned_resources || [];
      const payroll = allResources.filter(r => r.type === 'Student');
      const faculty = allResources.filter(r => r.type === 'Faculty');
      const estCost = parseFloat(project.budget || projectData.total_development_amount || 0);
      const totalBilled = parseFloat(projectData.total_invoiced || 0);
      const collected = parseFloat(projectData.total_collected || 0);
      const billedPending = Math.max(0, totalBilled - collected);
      const unbilledBalance = Math.max(0, estCost - totalBilled);
      const totalRemaining = Math.max(0, estCost - collected);
      const budgetPct = estCost > 0 ? Math.round((collected / estCost) * 100) : 0;
      const billedPct = totalBilled > 0 ? Math.round((collected / totalBilled) * 100) : 0;
      const devTotal = projectData.development_allocations ? (projectData.development_allocations.reduce((sum, a) => sum + parseFloat(a.amount), 0)) : 0;
      const hostTotal = projectData.hosting_charges ? (projectData.hosting_charges.reduce((sum, h) => sum + parseFloat(h.amount), 0)) : 0;

      container.innerHTML = `
        <div class="fin-page-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h1>${project.title || 'Unknown Project'}</h1>
            <p>Client: ${project.client_name || '-'}&nbsp;&nbsp;|&nbsp;&nbsp;Status: <span class="fin-badge ${statusBadgeClass(project.status)}">${(project.status || 'active').replace('_', ' ')}</span>${projectLock.locked ? `&nbsp;<span style="font-size:0.75rem;font-weight:600;color:${projectLock.reason === 'status' ? '#b91c1c' : '#92400e'}">· ${projectLock.reason === 'status' ? '🔒 Locked' : '⚠ No Budget'}</span>` : ''}</p>
          </div>
          <div>
            <button class="btn-back-nav" id="back-btn" title="Return to Projects">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>Back to Projects</span>
            </button>
          </div>
        </div>

        <div class="fin-kpi-strip">
          <div class="fin-kpi-card teal">
            <div class="kpi-label">Collected</div>
            <div class="kpi-value">${fmt(collected)}</div>
            <div class="kpi-sub">${budgetPct}% of total budget (${billedPct}% of billed)</div>
          </div>
          <div class="fin-kpi-card ${totalRemaining > 0 ? 'warning' : 'primary'}">
            <div class="kpi-label">Pending from Client</div>
            <div class="kpi-value">${fmt(totalRemaining)}</div>
            <div class="kpi-sub" style="font-size:0.85rem; font-weight:500; line-height:1.45; margin-top:4px;">
              ${totalRemaining === 0 
                ? 'Fully collected ✓' 
                : `<div style="font-size:0.92rem; font-weight:600; margin-top:2px">Invoiced Pending: <strong style="font-weight:700">${fmt(billedPending)}</strong></div>
                   <div style="font-size:0.84rem; margin-top:2px">Unbilled Contract: <strong>${fmt(unbilledBalance)}</strong></div>`}
            </div>
          </div>
          <div class="fin-kpi-card indigo">
            <div class="kpi-label">Total Expenses</div>
            <div class="kpi-value">${fmt(projectData.total_expenses || 0)}</div>
            <div class="kpi-sub">Actual project expenditure</div>
          </div>
          <div class="fin-kpi-card primary">
            <div class="kpi-label">Project Profit</div>
            <div class="kpi-value">${fmt(collected - (projectData.total_expenses || 0))}</div>
            <div class="kpi-sub">Collected - Expenses</div>
          </div>
        </div>

        ${projectLock.locked ? `
        <div style="display:flex;align-items:center;gap:10px;background:${projectLock.reason === 'status' ? '#fee2e2' : '#fef3c7'};
          color:${projectLock.reason === 'status' ? '#991b1b' : '#92400e'};border-radius:10px;
          padding:0.75rem 1.25rem;margin-bottom:1.25rem;font-size:0.875rem;font-weight:500;
          border:1px solid ${projectLock.reason === 'status' ? '#fca5a5' : '#fcd34d'}">
          <span style="font-size:1.1rem">${projectLock.reason === 'status' ? '🔒' : '⚠'}</span>
          <span><strong>Read-only:</strong> ${projectLock.reason === 'status'
            ? `This project is <strong>${projectLock.label}</strong> — financial modifications are disabled.`
            : 'This project has no approved budget. Financial modifications are disabled until a budget is set.'}
          </span>
        </div>` : ''}

        <div class="fin-grid-2">
          <!-- Cost Distribution -->
          <div class="fin-panel">
            <div class="fin-panel-header">
              <div class="fin-panel-title">Project Cost Distribution</div>
            </div>
            <div style="padding: 0 0.25rem;">
              <div class="fin-cost-section">
                <div class="fin-cost-section-title">Development Charges</div>
                <div class="fin-cost-item"><span class="label">Total Dev</span><span class="value">${fmt(devTotal)}</span></div>
                <div class="fin-cost-total" style="font-size:0.82rem;"><span>Dev. Subtotal</span><span>${fmt(devTotal)}</span></div>
              </div>

              <div class="fin-cost-section" style="margin-top:0.75rem;">
                <div class="fin-cost-section-title">Hosting Charges</div>
                <div class="fin-cost-item"><span class="label">Total Hosting</span><span class="value">${fmt(hostTotal)}</span></div>
                <div class="fin-cost-total" style="font-size:0.82rem;"><span>Hosting Subtotal</span><span>${fmt(hostTotal)}</span></div>
              </div>

              <div class="fin-cost-section" style="margin-top:0.75rem;">
                <div class="fin-cost-section-title">Maintenance & Support</div>
                ${projectData.maintenance_support_charges?.length > 0
                  ? `<div class="fin-cost-item"><span class="label">Annual Support</span><span class="value">${fmt(projectData.maintenance_support_charges.reduce((s,c)=>s+parseFloat(c.amount),0))}</span></div>`
                  : `<div class="fin-cost-item"><span class="label" style="font-style:italic;">Not included</span><span class="value">–</span></div>`
                }
              </div>

              <div style="margin-top: 1rem; border-top: 2px solid var(--border-color); padding-top: 0.75rem;">
                <div class="fin-cost-item"><span class="label">Subtotal (Ex. GST)</span><span class="value">${fmt(projectData.total_development_amount || 0)}</span></div>
                <div class="fin-cost-total"><span>Total Project Billing</span><span style="color:var(--primary)">${fmt(projectData.total_invoiced || 0)}</span></div>
              </div>
            </div>
          </div>

          <!-- Client Payments History -->
          <div class="fin-panel">
            <div class="fin-panel-header">
              <div class="fin-panel-title">Client Payments</div>
              ${projectLock.locked
                ? `<button class="fin-btn outline sm" id="add-payment-btn" disabled aria-disabled="true"
                    title="${projectLock.reason === 'status'
                      ? 'Payments disabled: project is ' + projectLock.label
                      : 'Payments disabled: no approved budget set'}"
                    style="opacity:0.45;cursor:not-allowed">🔒 Record Payment</button>`
                : `<button class="fin-btn outline sm" id="add-payment-btn">+ Record Payment</button>`
              }
            </div>
            <div class="fin-table-wrap">
              <table class="fin-table">
                <thead>
                  <tr><th>Date</th><th>Type</th><th>Amount</th><th>Status</th></tr>
                </thead>
                <tbody>
                  ${payments.map(p => `
                    <tr>
                      <td>${p.date}</td>
                      <td>${p.type}</td>
                      <td style="font-weight:700">${fmt(p.amount)}</td>
                      <td><span class="fin-badge ${p.status === 'Confirmed' ? 'success' : 'warning'}">${p.status}</span></td>
                    </tr>
                  `).join('')}
                  ${payments.length === 0 ? '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:1.5rem">No payments recorded</td></tr>' : ''}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- SSL Information (Dynamically loaded) -->
        <div id="project-ssl-info-container"></div>

        <!-- Resource Expenses -->
        <div class="fin-panel">
          <div class="fin-panel-header">
            <div class="fin-panel-title">Student & Faculty Expenses</div>
          </div>
          <div class="fin-table-wrap">
            <table class="fin-table">
              <thead>
                <tr><th>Resource Name</th><th>Role / Designation</th><th>Type</th><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                ${payroll.map(pr => `
                  <tr>
                    <td>
                      <div style="font-weight:600">${pr.resource_name}</div>
                      <div style="font-size:0.75rem;color:var(--text-muted)">ID: ${pr.project_student_id}</div>
                    </td>
                    <td><span class="fin-badge ${String(pr.designation).toLowerCase() === 'nova' ? 'nova' : String(pr.designation).toLowerCase() === 'orbit' ? 'orbit' : 'spark'}">${pr.designation}</span></td>
                    <td><span class="fin-badge indigo">Student</span></td>
                    <td style="font-weight:700">${fmt(pr.amount)}</td>
                    <td><span class="fin-badge ${pr.status === 'Paid' ? 'success' : 'warning'}">${pr.status}</span></td>
                  </tr>
                `).join('')}
                ${faculty.map(fc => `
                  <tr>
                    <td>
                      <div style="font-weight:600">${fc.resource_name}</div>
                      <div style="font-size:0.75rem;color:var(--text-muted)">ID: ${fc.project_faculty_id}</div>
                    </td>
                    <td>${fc.designation}</td>
                    <td><span class="fin-badge neutral">Faculty</span></td>
                    <td style="font-weight:700">${fmt(fc.amount)}</td>
                    <td><span class="fin-badge ${fc.status === 'Paid' ? 'success' : 'warning'}">${fc.status}</span></td>
                  </tr>
                `).join('')}
                ${(payroll.length === 0 && faculty.length === 0) ? '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:1.5rem">No resources assigned</td></tr>' : ''}
              </tbody>
            </table>
          </div>
        </div>
      `;

      container.querySelector('#back-btn').addEventListener('click', () => router.push('/finance/projects'));
      const payBtn = container.querySelector('#add-payment-btn');
      if (payBtn && !projectLock.locked) {
        payBtn.addEventListener('click', () => {
          alert('Please record client payments via the Invoices Ledger.');
          router.push('/finance/invoices');
        });
      }

      // Fetch and render SSL Information
      const hasSsl = projectData.hosting_charges && projectData.hosting_charges.some(hc => hc.charge_type === 'ssl' && hc.domain_name);
      if (hasSsl) {
        const sslContainer = container.querySelector('#project-ssl-info-container');
        if (sslContainer) {
          sslContainer.innerHTML = `
            <div class="fin-panel" style="margin-bottom: 1.25rem;">
              <div class="fin-panel-header">
                <div class="fin-panel-title">SSL Information</div>
                <div class="fin-panel-subtitle">Live SSL Certificate Status</div>
              </div>
              <div style="padding: 1rem; text-align: center; color: var(--text-muted);">
                <span class="fin-spinner" style="margin-right:8px"></span> Fetching live SSL certificate...
              </div>
            </div>
          `;
          
          financeService._fetch('/finance/ssl-status').then(async response => {
            if (response && response.ssl_status) {
              const sslData = response.ssl_status.find(s => s.project_id === project.id);
              if (sslData) {
                let renewals = [];
                try {
                  const allRenewals = await financeService._fetch('/finance/ssl-renewal-history');
                  if (allRenewals && Array.isArray(allRenewals)) {
                    renewals = allRenewals.filter(r => r.project_id === project.id);
                  }
                } catch(e) {}
                
                const fmtN = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
                let statusBadge = '';
                if (sslData.error) {
                  statusBadge = '<span class="fin-badge danger">Unable to fetch SSL certificate</span>';
                } else if (sslData.status === 'Expired') {
                  statusBadge = '<span class="fin-badge danger">Expired</span>';
                } else if (sslData.status === 'Critical') {
                  statusBadge = '<span class="fin-badge danger">Critical</span>';
                } else if (sslData.status === 'Expiring Soon') {
                  statusBadge = '<span class="fin-badge warning">Expiring Soon</span>';
                } else {
                  statusBadge = '<span class="fin-badge success">Active</span>';
                }
                
                const renewalWarning = sslData.unrecorded_renewal
                  ? `<div style="background:#e0f2fe; color:#0369a1; padding: 10px; margin-top: 15px; border-radius: 6px; font-size: 0.9rem;">
                      <strong>Notice:</strong> SSL certificate appears to have been renewed. Please record the renewal expense if it has not already been recorded.
                     </div>`
                  : '';
                
                const renewalsTable = renewals.length > 0 ? `
                  <div style="margin-top: 1.5rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">
                    <div style="font-size: 0.95rem; font-weight: 600; margin-bottom: 10px;">Renewal History</div>
                    <div class="fin-table-wrap" style="max-height: 250px; overflow-y: auto;">
                      <table class="fin-table" style="font-size: 0.85rem;">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Previous Expiry</th>
                            <th>New Expiry</th>
                            <th>Amount</th>
                            <th>Renewed By</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${renewals.map(r => `
                            <tr>
                              <td>${fmtDate(r.renewal_date)}</td>
                              <td>${fmtDate(r.previous_expiry_date)}</td>
                              <td>${fmtDate(r.new_expiry_date)}</td>
                              <td style="font-weight: 600;">${fmtN(r.renewal_amount)}</td>
                              <td>${r.renewed_by_name || 'System / Unknown'}</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ` : '';
                
                sslContainer.innerHTML = `
                  <div class="fin-panel" style="margin-bottom: 1.25rem;">
                    <div class="fin-panel-header">
                      <div class="fin-panel-title">SSL Information</div>
                      <div class="fin-panel-subtitle">Live SSL Certificate Status</div>
                    </div>
                    <div class="fin-grid-2" style="padding: 0.5rem 0; gap: 1.5rem;">
                      <div>
                        <div style="margin-bottom: 0.75rem;">
                          <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 2px;">Domain</div>
                          <div style="font-weight: 600;">${sslData.domain}</div>
                        </div>
                        <div style="margin-bottom: 0.75rem;">
                          <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 2px;">Website</div>
                          <div style="font-weight: 600;"><a href="${sslData.ssl_url}" target="_blank" style="color:var(--primary);text-decoration:none;">${sslData.ssl_url}</a></div>
                        </div>
                        <div style="margin-bottom: 0.75rem;">
                          <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 2px;">Provider / Details</div>
                          <div style="font-weight: 500;">${sslData.provider}</div>
                        </div>
                      </div>
                      <div>
                        <div style="margin-bottom: 0.75rem;">
                          <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 2px;">Current SSL Expiry</div>
                          <div style="font-weight: 600;">${fmtDate(sslData.expiry_date)}</div>
                        </div>
                        <div style="margin-bottom: 0.75rem;">
                          <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 2px;">Days Remaining</div>
                          <div style="font-weight: 600;">${sslData.days_remaining !== null ? sslData.days_remaining + ' days' : '-'}</div>
                        </div>
                        <div style="margin-bottom: 0.75rem;">
                          <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 2px;">SSL Status</div>
                          <div>${statusBadge}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div style="border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 2rem;">
                      <div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 2px;">Initial SSL Cost</div>
                        <div style="font-weight: 600;">${sslData.initial_ssl_amount ? fmtN(sslData.initial_ssl_amount) : '-'}</div>
                      </div>
                      <div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 2px;">Total Renewal Cost</div>
                        <div style="font-weight: 600;">${sslData.total_renewal_cost !== null ? fmtN(sslData.total_renewal_cost) : '-'}</div>
                      </div>
                      <div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 2px;">Total SSL Spent</div>
                        <div style="font-weight: 700; color: var(--primary);">${sslData.total_ssl_spent !== null ? fmtN(sslData.total_ssl_spent) : '-'}</div>
                      </div>
                    </div>
                    
                    ${renewalsTable}
                    ${renewalWarning}
                  </div>
                `;
              } else {
                sslContainer.innerHTML = '';
              }
            }
          }).catch(err => {
            sslContainer.innerHTML = `
              <div class="fin-panel" style="margin-bottom: 1.25rem;">
                <div class="fin-panel-header">
                  <div class="fin-panel-title">SSL Information</div>
                  <div class="fin-panel-subtitle">Live SSL Certificate Status</div>
                </div>
                <div style="padding: 1rem; color: #dc2626;">
                  Failed to fetch SSL status.
                </div>
              </div>
            `;
          });
        }
      }

      } catch (e) {
        container.innerHTML = `<div class="alert-error" style="margin:2rem">Failed to load project details: ${e.message} <button class="fin-btn outline sm" onclick="window.location.reload()" style="margin-left:1rem">Retry</button></div>`;
      }
    };
    loadProjectDetails();

  } else {
    // ── ALL PROJECTS LIST VIEW ────────────────────────────────────
    container.innerHTML = `
      <div class="fin-page-header">
        <div>
          <h1>Project Finance</h1>
          <p>Financial breakdown of all RLabZ projects</p>
        </div>
        <button class="fin-btn primary" id="add-project-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add Project Finance
        </button>
      </div>
      
      <!-- Filter Bar -->
      <div class="fin-filter-bar">
        <div class="fin-filter-group" style="flex:2; min-width:200px;">
          <label>Search Project</label>
          <div class="fin-search-wrap">
            <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" id="search-input" class="fin-input" placeholder="Search by name or client...">
          </div>
        </div>
        <div class="fin-filter-group" style="min-width:160px; max-width:200px;">
          <label>Status</label>
          <div class="fin-select-wrap">
            <select id="status-filter" class="fin-input">
              <option value="All">All Status</option>
              <option value="accepted">Accepted</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
        <div style="align-self:flex-end;">
          <button id="clear-filters-btn" class="fin-btn outline">Clear Filters</button>
        </div>
      </div>

      <!-- Add Form -->
      <div id="add-project-form" class="fin-form-section">
        <h3 class="fin-form-title">Create Project Finance Record</h3>
        <div class="fin-grid-2">
          <div>
            <div class="fin-form-group">
              <label>Project Name</label>
              <select class="fin-input" id="new-p-name">
                <option value="">Select Project</option>
              </select>
            </div>
            <div class="fin-form-group">
              <label>Client / Source</label>
              <input type="text" class="fin-input" id="new-p-client" readonly style="background-color:var(--bg-light); cursor:not-allowed;">
            </div>
            <div class="fin-form-group">
              <label>Estimated Cost (₹)</label>
              <input type="number" class="fin-input" id="new-p-est" placeholder="0" readonly style="background-color:var(--bg-light); cursor:not-allowed;">
            </div>
            <div class="fin-form-subhead">Development Charges</div>
            <div class="fin-form-group">
              <label>Student (₹)</label>
              <input type="number" class="fin-input" id="new-p-dev-stu" placeholder="0">
            </div>
            <div class="fin-form-group">
              <label>Faculty (₹)</label>
              <input type="number" class="fin-input" id="new-p-dev-fac" placeholder="0">
            </div>
            <div class="fin-form-group">
              <label>RLabZ (₹)</label>
              <input type="number" class="fin-input" id="new-p-dev-rlabz" placeholder="0">
            </div>
          </div>
          <div>
            <div class="fin-form-subhead">Hosting Charges</div>
            <div class="fin-form-group">
              <label>SSL (₹)</label>
              <input type="number" class="fin-input" id="new-p-host-ssl" placeholder="0">
            </div>
            <div class="fin-form-group">
              <label>Domain (₹)</label>
              <input type="number" class="fin-input" id="new-p-host-dom" placeholder="0">
            </div>
            <div class="fin-form-group">
              <label>API (₹) — Optional</label>
              <input type="number" class="fin-input" id="new-p-host-api" placeholder="0 if not applicable">
            </div>
            <div class="fin-form-subhead">Maintenance & Support</div>
            <div class="fin-form-group">
              <label>Annual Support (₹)</label>
              <input type="number" class="fin-input" id="new-p-maint" placeholder="0 if not included">
            </div>
          </div>
        </div>
        <div class="fin-form-actions">
          <div id="form-save-error" style="display:none;background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5;
            border-radius:8px;padding:0.6rem 1rem;font-size:0.85rem;width:100%;margin-bottom:0.75rem;"></div>
          <button class="fin-btn primary" id="save-new-project">Save Finance Record</button>
          <button class="fin-btn outline" id="cancel-new-project">Cancel</button>
        </div>
      </div>
      
      <div class="fin-panel">
        <div class="fin-panel-header">
          <div class="fin-panel-title">Project Portfolio</div>
          <div id="results-count" style="font-size:0.8rem;color:var(--text-muted)"></div>
        </div>
        <div class="fin-table-wrap">
          <table class="fin-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Status</th>
                <th>Est. Cost</th>
                <th>Total Billing</th>
                <th style="color:var(--primary)">Collected</th>
                <th style="color:var(--warning-text,#92400e)">Pending from Client</th>
                <th>Expenses</th>
                <th>Project Profit</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="projects-tbody"></tbody>
          </table>
          <div id="no-results" style="display:none;text-align:center;padding:2.5rem;color:var(--text-muted)">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.35;margin-bottom:0.5rem"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <p style="margin:0;font-size:0.9rem">No projects match the current filters.</p>
          </div>
        </div>
        <div id="pagination-container"></div>
      </div>
    `;

    let allProjects = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    
    const renderProjects = () => {
      const searchTerm = container.querySelector('#search-input').value.toLowerCase();
      const statusFilter = container.querySelector('#status-filter').value;
      const tbody = container.querySelector('#projects-tbody');
      const noResults = container.querySelector('#no-results');
      const countEl = container.querySelector('#results-count');
      
      const filtered = allProjects.filter(p => {
        const pName = p.title || 'Unknown Project';
        const client = p.client_name || 'Unknown Client';
        const status = p.status || 'proposed';

        const matchName = pName.toLowerCase().includes(searchTerm) || client.toLowerCase().includes(searchTerm);
        const matchStatus = statusFilter === 'All' || status === statusFilter;
        return matchName && matchStatus;
      });

      countEl.textContent = `${filtered.length} projects`;

      const totalPages = Math.ceil(filtered.length / itemsPerPage);
      if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

      const start = (currentPage - 1) * itemsPerPage;
      const paginated = filtered.slice(start, start + itemsPerPage);

      const formatStatus = (s) => s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      if (filtered.length === 0) {
        tbody.innerHTML = '';
        noResults.style.display = 'block';
        container.querySelector('#pagination-container').innerHTML = '';
      } else {
        noResults.style.display = 'none';
        tbody.innerHTML = paginated.map(p => {
          const pf      = p.project_finance || {};
          const pName   = p.title || 'Unknown Project';
          const client  = p.client_name || 'Unknown Client';
          const status  = p.status || 'proposed';
          const lock    = getFinanceLock(p);
          const billing = pf.total_invoiced || 0;
          const collected = pf.total_collected || 0;
          const expenses  = pf.total_expenses || 0;
          const profit    = collected - expenses;

          const lockLabel = lock.locked
            ? (lock.reason === 'status'
                ? `<span style="font-size:0.68rem;font-weight:600;padding:2px 6px;border-radius:8px;background:#fee2e2;color:#b91c1c;margin-left:5px">🔒 ${lock.label}</span>`
                : `<span style="font-size:0.68rem;font-weight:600;padding:2px 6px;border-radius:8px;background:#fef3c7;color:#92400e;margin-left:5px">⚠ No Budget</span>`)
            : '';
          
          return `
          <tr style="${lock.locked ? 'background:rgba(0,0,0,0.014)' : ''}">
            <td>
              <div style="font-weight:600;display:flex;align-items:center;flex-wrap:wrap">${pName}${lockLabel}</div>
              <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px">${client}</div>
            </td>
            <td><span class="fin-badge ${statusBadgeClass(status)}">${formatStatus(status)}</span></td>
            <td>${fmt(p.budget || 0)}</td>
            <td style="font-weight:600">${fmt(billing)}</td>
            <td style="color:var(--primary);font-weight:700">${fmt(pf.total_collected || 0)}</td>
            <td style="color:#d97706;font-weight:700">${fmt(pf.pending_amount || 0)}</td>
            <td>${fmt(expenses)}</td>
            <td style="font-weight:700;color:${profit >= 0 ? 'var(--primary)' : '#ef4444'}">${fmt(profit)}</td>
            <td>
              <button class="fin-btn outline sm view-details-btn" data-id="${p.id}">View Details</button>
            </td>
          </tr>
        `}).join('');

        container.querySelectorAll('.view-details-btn').forEach(btn => {
          btn.addEventListener('click', () => router.push(`/finance/projects/${btn.dataset.id}`));
        });

        const paginationContainer = container.querySelector('#pagination-container');
        paginationContainer.innerHTML = renderPagination(filtered.length, currentPage, itemsPerPage);
        setupPaginationListeners(paginationContainer, (page) => {
          currentPage = page;
          renderProjects();
        });

        setTimeout(() => {
          const expContainer = container.querySelector('#pagination-container-expenses');
          if (expContainer) {
            setupPaginationListeners(expContainer, (page) => {
              expensesCurrentPage = page;
              renderResourceExpenses(expensesCurrentPage);
            });
          }
        }, 0);


      }
    };

    const loadProjects = async () => {
      const tbody = container.querySelector('#projects-tbody');
      const noResults = container.querySelector('#no-results');
      
      if (tbody) {
        noResults.style.display = 'none';
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:3rem;color:var(--text-muted)"><span class="fin-spinner" style="margin-right:10px"></span> Loading projects...</td></tr>`;
      }
      
      try {
        allProjects = await financeService.getProjectFinances();
        renderProjects();
        
        // All projects without a finance record are available for selection,
        // but locked ones (closed / cancelled / no budget) are shown as disabled.
        const availableProjects = allProjects.filter(p => !p.project_finance);
        const select = container.querySelector('#new-p-name');
        select.innerHTML = '<option value="">Select Project</option>' +
          availableProjects.map(p => {
            const lock = getFinanceLock(p);
            const suffix = lock.locked
              ? (lock.reason === 'status' ? ` (${lock.label} – Locked)` : ' (No Approved Budget)')
              : '';
            return `<option value="${p.id}" ${lock.locked ? 'disabled' : ''}>${p.title}${suffix}</option>`;
          }).join('');

        select.addEventListener('change', (e) => {
          const p = availableProjects.find(proj => proj.id == e.target.value);
          // Clear any inline form error when selection changes
          const formErr = container.querySelector('#form-save-error');
          if (formErr) formErr.style.display = 'none';
          if (p) {
            container.querySelector('#new-p-client').value = p.client_name || '';
            container.querySelector('#new-p-est').value = p.budget || p.estimated_cost || 0;
          } else {
            container.querySelector('#new-p-client').value = '';
            container.querySelector('#new-p-est').value = 0;
          }
        });

      } catch (e) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:2rem;color:#ef4444">Failed to load projects: ${e.message} <button class="fin-btn outline sm" onclick="window.location.reload()" style="margin-left:10px">Retry</button></td></tr>`;
      }
    };

    container.querySelector('#search-input').addEventListener('input', () => { currentPage = 1; renderProjects(); });
    container.querySelector('#status-filter').addEventListener('change', () => { currentPage = 1; renderProjects(); });
    container.querySelector('#clear-filters-btn').addEventListener('click', () => {
      container.querySelector('#search-input').value = '';
      container.querySelector('#status-filter').value = 'All';
      currentPage = 1;
      renderProjects();
    });

    const addForm = container.querySelector('#add-project-form');
    container.querySelector('#add-project-btn').addEventListener('click', () => addForm.classList.add('visible'));
    container.querySelector('#cancel-new-project').addEventListener('click', () => addForm.classList.remove('visible'));
    container.querySelector('#save-new-project').addEventListener('click', async () => {
      const projSelect = container.querySelector('#new-p-name');
      const formErr    = container.querySelector('#form-save-error');
      if (formErr) formErr.style.display = 'none';

      if (!projSelect.value) {
        if (formErr) { formErr.textContent = 'Please select a project.'; formErr.style.display = 'block'; }
        else alert('Please select a project.');
        return;
      }

      // Client-side lock guard (belt-and-suspenders before API call)
      const selectedProject = allProjects.find(p => p.id == projSelect.value);
      if (selectedProject) {
        const lock = getFinanceLock(selectedProject);
        if (lock.locked) {
          const msg = lock.reason === 'status'
            ? `Cannot create finance record: this project is ${lock.label} and locked.`
            : 'Cannot create finance record: this project has no approved budget set.';
          if (formErr) { formErr.textContent = msg; formErr.style.display = 'block'; }
          else alert(msg);
          return;
        }
      }

      const saveBtn = container.querySelector('#save-new-project');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';

      const data = {
        project_id:          projSelect.value,
        name:                projSelect.options[projSelect.selectedIndex].text,
        client:              container.querySelector('#new-p-client').value.trim() || 'Unknown',
        estimated_cost:      parseFloat(container.querySelector('#new-p-est').value) || 0,
        dev_student:         parseFloat(container.querySelector('#new-p-dev-stu').value) || 0,
        dev_faculty:         parseFloat(container.querySelector('#new-p-dev-fac').value) || 0,
        dev_rlabz:           parseFloat(container.querySelector('#new-p-dev-rlabz').value) || 0,
        host_ssl:            parseFloat(container.querySelector('#new-p-host-ssl').value) || 0,
        host_domain:         parseFloat(container.querySelector('#new-p-host-dom').value) || 0,
        host_api:            parseFloat(container.querySelector('#new-p-host-api').value) || 0,
        maintenance_support: parseFloat(container.querySelector('#new-p-maint').value) || 0,
      };

      try {
        await financeService.addProjectFinance(data);
        addForm.classList.remove('visible');
        loadProjects();
      } catch (e) {
        if (formErr) { formErr.textContent = e.message || 'Failed to save finance record.'; formErr.style.display = 'block'; }
        else alert(e.message || 'Failed to save finance record.');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Finance Record';
      }
    });

    loadProjects();
  }

  return container;
}

export default ProjectFinance;
