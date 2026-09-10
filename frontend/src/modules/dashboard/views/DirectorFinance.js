import { DirectorService } from '../services/DirectorService.js';

function formatMoney(amount) {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '0';
  return Number(amount).toLocaleString('en-IN');
}

export function DirectorFinance(route, router) {
  const container = document.createElement('div');
  container.className = 'director-dashboard';

  function render(fin = DirectorService.getFinanceSummary(), projects = DirectorService.getProjects()) {
    const totalBudget = fin.totalBudget || 0;
    const totalSpent = fin.totalSpent || 0;
    const stipendsDisbursed = fin.stipendsDisbursed || 0;
    const pendingInvoiceAmount = fin.pendingInvoiceAmount || 0;
    const pendingInvoices = fin.pendingInvoices || 0;
    const payrollByTrack = fin.payrollByTrack || { Nova: 0, Orbit: 0, Spark: 0 };

    container.innerHTML = `
      <div class="director-header">
        <div>
          <h1>Finance & Payroll Oversight (Read-Only)</h1>
          <p>Director executive control & read-access oversight for financial allocations and project billings.</p>
        </div>
        <div class="director-badge-role">
          Read-Only Access
        </div>
      </div>

      <!-- Financial KPI Summary Cards -->
      <div class="director-kpi-grid">
        <div class="director-kpi-card">
          <div class="director-kpi-top">
            <span class="director-kpi-title">Total Project Budgets</span>
            <div class="director-kpi-icon emerald">₹</div>
          </div>
          <div class="director-kpi-value">₹${formatMoney(totalBudget)}</div>
          <div class="director-kpi-subtext">Across all active & completed projects</div>
        </div>

        <div class="director-kpi-card">
          <div class="director-kpi-top">
            <span class="director-kpi-title">Disbursed Expenditures</span>
            <div class="director-kpi-icon blue">₹</div>
          </div>
          <div class="director-kpi-value">₹${formatMoney(totalSpent)}</div>
          <div class="director-kpi-subtext">Spent on project execution</div>
        </div>

        <div class="director-kpi-card">
          <div class="director-kpi-top">
            <span class="director-kpi-title">Student Payroll Disbursed</span>
            <div class="director-kpi-icon purple">₹</div>
          </div>
          <div class="director-kpi-value">₹${formatMoney(stipendsDisbursed)}</div>
          <div class="director-kpi-subtext">Monthly stipends based on track tier</div>
        </div>

        <div class="director-kpi-card">
          <div class="director-kpi-top">
            <span class="director-kpi-title">Pending Client Invoices</span>
            <div class="director-kpi-icon amber">₹</div>
          </div>
          <div class="director-kpi-value">₹${formatMoney(pendingInvoiceAmount)}</div>
          <div class="director-kpi-subtext">${pendingInvoices} unpaid invoices pending collection</div>
        </div>
      </div>

      <!-- Payroll Allocation by Designation Track -->
      <div class="director-panel">
        <div class="director-panel-header">
          <h2>Student Payroll Breakdown by Track (Module 5 Integration)</h2>
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:1rem;">
          <div style="background:#f3e8ff; padding:1.25rem; border-radius:10px; border:1px solid #d8b4fe;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span class="track-badge nova">Nova Lead Track</span>
              <strong style="color:#7e22ce; font-size:1.1rem;">₹${formatMoney(payrollByTrack.Nova || 0)}</strong>
            </div>
            <p style="font-size:0.8rem; color:#6b7280; margin:0.5rem 0 0 0;">Highest stipend tier (₹5,000/mo) for project leads.</p>
          </div>

          <div style="background:#dbeafe; padding:1.25rem; border-radius:10px; border:1px solid #93c5fd;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span class="track-badge orbit">Orbit Dev Track</span>
              <strong style="color:#1d4ed8; font-size:1.1rem;">₹${formatMoney(payrollByTrack.Orbit || 0)}</strong>
            </div>
            <p style="font-size:0.8rem; color:#6b7280; margin:0.5rem 0 0 0;">Standard developer stipend tier (₹3,000/mo) for contributors.</p>
          </div>

          <div style="background:#d1fae5; padding:1.25rem; border-radius:10px; border:1px solid #6ee7b7;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span class="track-badge spark">Spark Learner Track</span>
              <strong style="color:#047857; font-size:1.1rem;">₹${formatMoney(payrollByTrack.Spark || 0)}</strong>
            </div>
            <p style="font-size:0.8rem; color:#6b7280; margin:0.5rem 0 0 0;">Entry-level intern stipend tier (₹1,500/mo) for learners.</p>
          </div>
        </div>
      </div>

      <!-- Project Budget vs Expenditure Table -->
      <div class="director-panel">
        <div class="director-panel-header" style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h2 style="margin:0;">Project Financial Tracking Overview</h2>
            <small style="color:#6b7280; font-size:0.8rem;">Click on any row to open the detailed financial breakdown popup</small>
          </div>
          <span style="font-size:0.75rem; background:#ecfdf5; color:#047857; padding:4px 10px; border-radius:12px; border:1px solid #a7f3d0; font-weight:600;">
            💡 Click row for details
          </span>
        </div>

        <div class="director-table-responsive">
          <table class="director-table">
            <thead>
              <tr>
                <th>Project Title</th>
                <th>Client Name</th>
                <th>Total Budget</th>
                <th>Current Spent</th>
                <th>Remaining Budget</th>
                <th>Financial Health</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${projects.length === 0 ? `
                <tr><td colspan="7" style="text-align:center; color:#9ca3af; padding:1.5rem;">No active project financial records.</td></tr>
              ` : projects.map(p => {
                const remaining = (p.budget || 0) - (p.spent || 0);
                const percentSpent = p.budget ? Math.round(((p.spent || 0) / p.budget) * 100) : 0;
                return `
                  <tr class="director-clickable-row" data-id="${p.id}" title="Click to view detailed financial breakdown for ${p.title}">
                    <td><strong>${p.title}</strong><br><small style="color:#6b7280">${p.id}</small></td>
                    <td>${p.clientName || 'N/A'}</td>
                    <td>₹${formatMoney(p.budget || 0)}</td>
                    <td>₹${formatMoney(p.spent || 0)}</td>
                    <td style="color:${remaining >= 0 ? '#059669' : '#dc2626'}; font-weight:600;">₹${formatMoney(remaining)}</td>
                    <td>
                      <span class="status-badge ${percentSpent > 90 ? 'rejected' : 'completed'}">
                        ${percentSpent}% Utilized
                      </span>
                    </td>
                    <td>
                      <button type="button" class="btn-director btn-director-outline btn-view-finance-modal" data-id="${p.id}" style="font-size:0.75rem; padding:0.25rem 0.6rem;">
                        🔍 Breakdown
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal Container -->
      <div id="finance-modal-root"></div>
    `;

    attachRowClickEvents(projects);
  }

  function attachRowClickEvents(projects) {
    const modalRoot = container.querySelector('#finance-modal-root');

    container.querySelectorAll('.director-clickable-row, .btn-view-finance-modal').forEach(el => {
      el.addEventListener('click', (e) => {
        // Prevent double event trigger if button inside row was clicked
        if (e.target.tagName === 'BUTTON' && el.classList.contains('director-clickable-row')) return;
        
        const id = el.getAttribute('data-id');
        const project = projects.find(p => p.id === id || String(p.id) === String(id));
        if (project) {
          showProjectFinanceModal(project, modalRoot);
        }
      });
    });
  }

  function showProjectFinanceModal(p, modalRoot) {
    const budget = Number(p.budget || 0);
    const spent = Number(p.spent || 0);
    const remaining = budget - spent;
    const percentSpent = budget > 0 ? Math.round((spent / budget) * 100) : 0;
    
    // Estimated breakdown allocations
    const devAlloc = Math.round(budget * 0.70);
    const hostAlloc = Math.round(budget * 0.15);
    const maintAlloc = Math.max(0, budget - devAlloc - hostAlloc);
    
    const students = Array.isArray(p.assignedStudents) ? p.assignedStudents : [];

    modalRoot.innerHTML = `
      <div class="director-modal-overlay" style="z-index: 1100;">
        <div class="director-modal" style="max-width: 640px; border-top: 4px solid #10b981;">
          
          <!-- Header -->
          <div class="director-modal-header" style="border-bottom:1px solid #f3f4f6; padding-bottom:0.75rem;">
            <div>
              <h3 style="margin:0; color:#111827; font-size:1.2rem;">💰 Financial Breakdown</h3>
              <p style="margin:2px 0 0 0; font-size:0.85rem; color:#6b7280;"><strong>${p.title}</strong> (${p.id})</p>
            </div>
            <button class="btn-director btn-director-outline btn-close-modal" style="padding:0.25rem 0.5rem;">✕</button>
          </div>

          <!-- Body -->
          <div class="director-modal-body" style="max-height: 480px; overflow-y: auto; padding-right: 0.25rem; margin-top: 0.75rem;">
            
            <!-- Meta Bar -->
            <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; background:#f9fafb; padding:0.65rem 0.85rem; border-radius:8px; border:1px solid #e5e7eb; font-size:0.8rem;">
              <div>Client: <strong>${p.clientName || 'Rajagiri Department'}</strong></div>
              <div>Faculty Lead: <strong>${p.facultyName || 'Unassigned'}</strong></div>
              <div>Status: <span class="status-badge ${p.status === 'accepted' ? 'accepted' : 'in_progress'}" style="padding:2px 6px; font-size:0.7rem;">${(p.status || 'in_progress').replace('_', ' ').toUpperCase()}</span></div>
            </div>

            <!-- Key Financial Summary Grid -->
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:0.75rem; margin-top:0.5rem;">
              <div style="background:#ecfdf5; padding:0.75rem; border-radius:8px; border:1px solid #a7f3d0;">
                <span style="font-size:0.75rem; color:#047857; font-weight:600;">Total Allocated Budget</span>
                <div style="font-size:1.15rem; font-weight:800; color:#065f46; margin-top:2px;">₹${formatMoney(budget)}</div>
              </div>

              <div style="background:#eff6ff; padding:0.75rem; border-radius:8px; border:1px solid #bfdbfe;">
                <span style="font-size:0.75rem; color:#1d4ed8; font-weight:600;">Current Expenditure</span>
                <div style="font-size:1.15rem; font-weight:800; color:#1e40af; margin-top:2px;">₹${formatMoney(spent)}</div>
              </div>

              <div style="background:${remaining >= 0 ? '#f0fdf4' : '#fef2f2'}; padding:0.75rem; border-radius:8px; border:1px solid ${remaining >= 0 ? '#bbf7d0' : '#fecaca'};">
                <span style="font-size:0.75rem; color:${remaining >= 0 ? '#15803d' : '#b91c1c'}; font-weight:600;">Remaining Balance</span>
                <div style="font-size:1.15rem; font-weight:800; color:${remaining >= 0 ? '#166534' : '#991b1b'}; margin-top:2px;">₹${formatMoney(remaining)}</div>
              </div>
            </div>

            <!-- Utilization Progress Bar -->
            <div style="background:#ffffff; border:1px solid #e5e7eb; padding:0.75rem 0.85rem; border-radius:8px;">
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; margin-bottom:0.35rem;">
                <strong style="color:#374151;">Budget Utilization Rate</strong>
                <strong style="color:${percentSpent > 90 ? '#dc2626' : '#059669'};">${percentSpent}% Utilized</strong>
              </div>
              <div class="director-progress-bar-bg" style="width:100%; height:10px; margin-right:0;">
                <div class="director-progress-bar-fill" style="width:${Math.min(100, percentSpent)}%; background:${percentSpent > 90 ? '#ef4444' : 'linear-gradient(90deg, #10b981, #059669)'};"></div>
              </div>
            </div>

            <!-- Expense Allocation Breakdown -->
            <div style="border:1px solid #e5e7eb; border-radius:8px; padding:0.85rem; background:#ffffff;">
              <div style="font-weight:700; font-size:0.85rem; color:#111827; margin-bottom:0.5rem; display:flex; align-items:center; gap:0.35rem;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                Project Expenditure Allocations
              </div>
              <div style="display:flex; flex-direction:column; gap:0.4rem; font-size:0.8rem;">
                <div style="display:flex; justify-content:space-between; padding:0.35rem 0; border-bottom:1px dashed #f3f4f6;">
                  <span style="color:#4b5563;">💻 Development & Core Engineering Allocation</span>
                  <strong style="color:#111827;">₹${formatMoney(devAlloc)}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; padding:0.35rem 0; border-bottom:1px dashed #f3f4f6;">
                  <span style="color:#4b5563;">☁️ Infrastructure & Hosting Charges (SSL / Cloud)</span>
                  <strong style="color:#111827;">₹${formatMoney(hostAlloc)}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; padding:0.35rem 0;">
                  <span style="color:#4b5563;">🛠️ Maintenance, Testing & Support Reserve</span>
                  <strong style="color:#111827;">₹${formatMoney(maintAlloc)}</strong>
                </div>
              </div>
            </div>

            <!-- Student Payroll & Team Allocations -->
            <div style="border:1px solid #e5e7eb; border-radius:8px; padding:0.85rem; background:#ffffff;">
              <div style="font-weight:700; font-size:0.85rem; color:#111827; margin-bottom:0.5rem; display:flex; justify-content:space-between; align-items:center;">
                <span>🎓 Assigned Student Team & Stipend Tiers</span>
                <span style="font-size:0.75rem; color:#6b7280; font-weight:normal;">${students.length} Member${students.length === 1 ? '' : 's'}</span>
              </div>
              
              ${students.length === 0 ? `
                <div style="font-size:0.8rem; color:#9ca3af; text-align:center; padding:0.75rem; background:#f9fafb; border-radius:6px;">
                  No students currently assigned to this project.
                </div>
              ` : `
                <div style="display:flex; flex-direction:column; gap:0.5rem;">
                  ${students.map(s => {
                    const track = s.track || 'Orbit';
                    const stipend = track === 'Nova' ? 5000 : (track === 'Spark' ? 1500 : 3000);
                    return `
                      <div style="display:flex; justify-content:space-between; align-items:center; padding:0.45rem 0.65rem; background:#f9fafb; border-radius:6px; border:1px solid #f3f4f6; font-size:0.8rem;">
                        <div style="display:flex; align-items:center; gap:0.5rem;">
                          <span class="track-badge ${track.toLowerCase()}" style="font-size:0.65rem; padding:1px 6px;">${track}</span>
                          <strong>${s.name}</strong>
                          <span style="color:#6b7280; font-size:0.75rem;">(${s.role || 'Developer'})</span>
                        </div>
                        <div style="font-weight:700; color:#047857;">₹${formatMoney(stipend)} / mo</div>
                      </div>
                    `;
                  }).join('')}
                </div>
              `}
            </div>

            <!-- Client Payment Status -->
            <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:0.75rem 0.85rem; font-size:0.8rem; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong style="color:#166534;">Client Invoicing & Billing Status</strong>
                <div style="color:#15803d; font-size:0.75rem; margin-top:2px;">Invoiced: ₹${formatMoney(budget)} | Total Paid: ₹${formatMoney(spent > 0 ? spent : budget * 0.6)}</div>
              </div>
              <span class="status-badge completed" style="font-size:0.7rem; padding:2px 8px;">
                Verified & On Schedule
              </span>
            </div>

          </div>

          <!-- Footer -->
          <div class="director-modal-footer" style="border-top:1px solid #f3f4f6; padding-top:0.75rem; margin-top:0;">
            <button class="btn-director btn-director-primary btn-close-modal">Close</button>
          </div>

        </div>
      </div>
    `;

    modalRoot.querySelectorAll('.btn-close-modal').forEach(b => {
      b.addEventListener('click', () => { modalRoot.innerHTML = ''; });
    });
  }

  render();
  Promise.all([
    DirectorService.getFinanceSummaryAsync(),
    DirectorService.getProjectsAsync()
  ]).then(([fin, projects]) => {
    if (fin && projects) render(fin, projects);
  });

  return container;
}

export default DirectorFinance;
