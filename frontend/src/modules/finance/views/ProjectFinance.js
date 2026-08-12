import { financeService } from '../services/FinanceService.js';
import { updateFinanceSidebar } from '../layouts/FinanceLayout.js';

export async function ProjectFinance(route, router) {
  const container = document.createElement('div');
  container.className = 'finance-module animate-fade-in';
  setTimeout(updateFinanceSidebar, 0);

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  if (route.params && route.params.id) {
    // ── PROJECT DETAIL VIEW ───────────────────────────────────────
    try {
      const details = await financeService.getProjectDetails(route.params.id);
      const { project, payments, payroll, faculty } = details;

      const recvPct = project.totalBilling > 0 ? Math.round((project.collected / project.totalBilling) * 100) : 0;
      const devTotal = project.dev_student + project.dev_faculty + project.dev_rlabz;
      const hostTotal = project.host_ssl + project.host_domain + project.host_api;

      container.innerHTML = `
        <div class="fin-page-header">
          <div>
            <button class="fin-back-link" id="back-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Back to Projects
            </button>
            <h1>${project.name}</h1>
            <p>Client: ${project.client}&nbsp;&nbsp;|&nbsp;&nbsp;Status: <span class="fin-badge ${project.status === 'Closed' ? 'success' : 'info'}">${project.status}</span></p>
          </div>
        </div>

        <div class="fin-kpi-strip">
          <div class="fin-kpi-card teal">
            <div class="kpi-label">Amount Collected</div>
            <div class="kpi-value">${fmt(project.collected)}</div>
            <div class="kpi-sub">${recvPct}% of billed revenue</div>
          </div>
          <div class="fin-kpi-card ${project.outstanding > 0 ? 'warning' : 'primary'}">
            <div class="kpi-label">Amount Outstanding</div>
            <div class="kpi-value">${fmt(project.outstanding)}</div>
            <div class="kpi-sub">${project.outstanding > 0 ? 'Pending from client' : 'Fully collected ✓'}</div>
          </div>
          <div class="fin-kpi-card indigo">
            <div class="kpi-label">Total Expenses</div>
            <div class="kpi-value">${fmt(project.totalExpenses)}</div>
            <div class="kpi-sub">Across all resource types</div>
          </div>
          <div class="fin-kpi-card primary">
            <div class="kpi-label">Project Margin</div>
            <div class="kpi-value">${fmt(project.margin)}</div>
            <div class="kpi-sub">Pre-tax margin</div>
          </div>
        </div>

        <div class="fin-grid-2">
          <!-- Cost Distribution -->
          <div class="fin-panel">
            <div class="fin-panel-header">
              <div class="fin-panel-title">Project Cost Distribution</div>
            </div>
            <div style="padding: 0 0.25rem;">
              <div class="fin-cost-section">
                <div class="fin-cost-section-title">Development Charges</div>
                <div class="fin-cost-item"><span class="label">Student</span><span class="value">${fmt(project.dev_student)}</span></div>
                <div class="fin-cost-item"><span class="label">Faculty</span><span class="value">${fmt(project.dev_faculty)}</span></div>
                <div class="fin-cost-item"><span class="label">RLabZ</span><span class="value">${fmt(project.dev_rlabz)}</span></div>
                <div class="fin-cost-total" style="font-size:0.82rem;"><span>Dev. Subtotal</span><span>${fmt(devTotal)}</span></div>
              </div>

              <div class="fin-cost-section" style="margin-top:0.75rem;">
                <div class="fin-cost-section-title">Hosting Charges</div>
                <div class="fin-cost-item"><span class="label">SSL</span><span class="value">${fmt(project.host_ssl)}</span></div>
                <div class="fin-cost-item"><span class="label">Domain</span><span class="value">${fmt(project.host_domain)}</span></div>
                <div class="fin-cost-item"><span class="label">API</span><span class="value">${project.host_api > 0 ? fmt(project.host_api) : '<span style="color:var(--text-muted);font-weight:400;">Not applicable</span>'}</span></div>
                <div class="fin-cost-total" style="font-size:0.82rem;"><span>Hosting Subtotal</span><span>${fmt(hostTotal)}</span></div>
              </div>

              <div class="fin-cost-section" style="margin-top:0.75rem;">
                <div class="fin-cost-section-title">Maintenance & Support</div>
                ${project.maintenance_support > 0
                  ? `<div class="fin-cost-item"><span class="label">Annual Support</span><span class="value">${fmt(project.maintenance_support)}</span></div>`
                  : `<div class="fin-cost-item"><span class="label" style="font-style:italic;">Not included</span><span class="value">–</span></div>`
                }
              </div>

              <div style="margin-top: 1rem; border-top: 2px solid var(--border-color); padding-top: 0.75rem;">
                <div class="fin-cost-item"><span class="label">Subtotal (Ex. GST)</span><span class="value">${fmt(project.subtotal)}</span></div>
                <div class="fin-cost-item"><span class="label">GST (${(financeService.gstRate * 100)}% — mock)</span><span class="value">${fmt(project.gst)}</span></div>
                <div class="fin-cost-total"><span>Total Project Billing</span><span style="color:var(--primary)">${fmt(project.totalBilling)}</span></div>
              </div>
            </div>
          </div>

          <!-- Client Payments History -->
          <div class="fin-panel">
            <div class="fin-panel-header">
              <div class="fin-panel-title">Client Payments</div>
              <button class="fin-btn outline sm" id="add-payment-btn">+ Record Payment</button>
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
                      <div style="font-weight:600">${pr.studentName}</div>
                      <div style="font-size:0.75rem;color:var(--text-muted)">${pr.id}</div>
                    </td>
                    <td><span class="fin-badge ${pr.designation === 'Nova' ? 'nova' : pr.designation === 'Orbit' ? 'orbit' : 'spark'}">${pr.designation}</span></td>
                    <td><span class="fin-badge indigo">Student</span></td>
                    <td style="font-weight:700">${fmt(pr.grossAmount)}</td>
                    <td><span class="fin-badge ${pr.status === 'Paid' ? 'success' : 'warning'}">${pr.status}</span></td>
                  </tr>
                `).join('')}
                ${faculty.map(fc => `
                  <tr>
                    <td>
                      <div style="font-weight:600">${fc.name}</div>
                      <div style="font-size:0.75rem;color:var(--text-muted)">${fc.id}</div>
                    </td>
                    <td>${fc.role}</td>
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
      container.querySelector('#add-payment-btn').addEventListener('click', () => alert('Record Payment — requires final DB/API mapping.'));

    } catch (e) {
      container.innerHTML = `<div class="alert-error">Failed to load project details: ${e.message}</div>`;
    }

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
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Approved">Approved</option>
              <option value="Active">Active</option>
              <option value="Closed">Closed</option>
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
              <input type="text" class="fin-input" id="new-p-name" placeholder="e.g. Library Portal">
            </div>
            <div class="fin-form-group">
              <label>Client / Source</label>
              <input type="text" class="fin-input" id="new-p-client" placeholder="e.g. Rajagiri College">
            </div>
            <div class="fin-form-group">
              <label>Estimated Cost (₹)</label>
              <input type="number" class="fin-input" id="new-p-est" placeholder="0">
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
                <th style="color:var(--warning-text,#92400e)">Outstanding</th>
                <th>Expenses</th>
                <th>Margin</th>
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
      </div>
    `;

    let allProjects = [];
    
    const renderProjects = () => {
      const searchTerm = container.querySelector('#search-input').value.toLowerCase();
      const statusFilter = container.querySelector('#status-filter').value;
      const tbody = container.querySelector('#projects-tbody');
      const noResults = container.querySelector('#no-results');
      const countEl = container.querySelector('#results-count');
      
      const filtered = allProjects.filter(p => {
        const matchName = p.name.toLowerCase().includes(searchTerm) || p.client.toLowerCase().includes(searchTerm);
        const matchStatus = statusFilter === 'All' || p.status === statusFilter;
        return matchName && matchStatus;
      });

      countEl.textContent = `${filtered.length} of ${allProjects.length} projects`;

      if (filtered.length === 0) {
        tbody.innerHTML = '';
        noResults.style.display = 'block';
      } else {
        noResults.style.display = 'none';
        tbody.innerHTML = filtered.map(p => `
          <tr>
            <td>
              <div style="font-weight:600">${p.name}</div>
              <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px">${p.client}</div>
            </td>
            <td><span class="fin-badge ${p.status === 'Closed' ? 'success' : p.status === 'Active' ? 'info' : 'neutral'}">${p.status}</span></td>
            <td>${fmt(p.estimated_cost)}</td>
            <td style="font-weight:600">${fmt(p.totalBilling)}</td>
            <td style="color:var(--primary);font-weight:700">${fmt(p.collected)}</td>
            <td style="color:#d97706;font-weight:700">${fmt(p.outstanding)}</td>
            <td>${fmt(p.totalExpenses)}</td>
            <td style="font-weight:700;color:${p.margin > 0 ? 'var(--primary)' : '#ef4444'}">${fmt(p.margin)}</td>
            <td>
              <button class="fin-btn outline sm view-details-btn" data-id="${p.id}">View Details</button>
            </td>
          </tr>
        `).join('');

        container.querySelectorAll('.view-details-btn').forEach(btn => {
          btn.addEventListener('click', () => router.push(`/finance/projects/${btn.dataset.id}`));
        });
      }
    };

    const loadProjects = async () => {
      allProjects = await financeService.getProjectFinances();
      renderProjects();
    };

    container.querySelector('#search-input').addEventListener('input', renderProjects);
    container.querySelector('#status-filter').addEventListener('change', renderProjects);
    container.querySelector('#clear-filters-btn').addEventListener('click', () => {
      container.querySelector('#search-input').value = '';
      container.querySelector('#status-filter').value = 'All';
      renderProjects();
    });

    const addForm = container.querySelector('#add-project-form');
    container.querySelector('#add-project-btn').addEventListener('click', () => addForm.classList.add('visible'));
    container.querySelector('#cancel-new-project').addEventListener('click', () => addForm.classList.remove('visible'));
    container.querySelector('#save-new-project').addEventListener('click', async () => {
      const data = {
        name: container.querySelector('#new-p-name').value.trim() || 'New Project',
        client: container.querySelector('#new-p-client').value.trim() || 'Unknown',
        estimated_cost: parseFloat(container.querySelector('#new-p-est').value) || 0,
        dev_student: parseFloat(container.querySelector('#new-p-dev-stu').value) || 0,
        dev_faculty: parseFloat(container.querySelector('#new-p-dev-fac').value) || 0,
        dev_rlabz: parseFloat(container.querySelector('#new-p-dev-rlabz').value) || 0,
        host_ssl: parseFloat(container.querySelector('#new-p-host-ssl').value) || 0,
        host_domain: parseFloat(container.querySelector('#new-p-host-dom').value) || 0,
        host_api: parseFloat(container.querySelector('#new-p-host-api').value) || 0,
        maintenance_support: parseFloat(container.querySelector('#new-p-maint').value) || 0,
      };
      await financeService.addProjectFinance(data);
      addForm.classList.remove('visible');
      loadProjects();
    });

    loadProjects();
  }

  return container;
}

export default ProjectFinance;
