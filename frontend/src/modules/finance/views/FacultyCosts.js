import { financeService } from '../services/FinanceService.js';
import { updateFinanceSidebar } from '../layouts/FinanceLayout.js';

export async function FacultyCosts(route, router) {
  const container = document.createElement('div');
  container.className = 'finance-module animate-fade-in';
  setTimeout(updateFinanceSidebar, 0);

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  const fmtDate = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    return isNaN(dt) ? d : dt.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  let facultyCosts = [];
  let allProjects = [];

  const renderFacultyTable = () => {
    const tbody = container.querySelector('#fc-tbody');
    const noResults = container.querySelector('#no-fc-results');
    if (!tbody) return;

    const searchTerm = container.querySelector('#fc-search').value.toLowerCase();
    const statusFilter = container.querySelector('#fc-status').value;

    const filtered = facultyCosts.filter(fc => {
      const fName = fc.faculty_name || 'Unknown';
      const pName = fc.project_name || 'Unknown';
      const status = fc.payment_date ? 'Paid' : 'Pending';

      const matchName = fName.toLowerCase().includes(searchTerm) || pName.toLowerCase().includes(searchTerm);
      const matchStatus = statusFilter === 'All' || status === statusFilter;
      return matchName && matchStatus;
    });

    const countEl = container.querySelector('#fc-count');
    if (countEl) countEl.textContent = `${filtered.length} records`;

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      noResults.style.display = 'block';
    } else {
      noResults.style.display = 'none';
      tbody.innerHTML = filtered.map(fc => {
        const fName = fc.faculty_name || 'Unknown';
        const pName = fc.project_name || 'Unknown';
        const status = fc.payment_date ? 'Paid' : 'Pending';

        return `
        <tr>
          <td><div style="font-weight:600">${pName}</div></td>
          <td>
            <div style="font-weight:600">${fName}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">PF-ID: ${fc.project_faculty_id}</div>
          </td>
          <td style="font-weight:700">${fmt(fc.amount || 0)}</td>
          <td style="color:var(--text-muted)">${fmtDate(fc.payment_date)}</td>
          <td><span class="fin-badge ${status === 'Paid' ? 'success' : 'warning'}">${status}</span></td>
        </tr>
      `}).join('');
    }
  };

  const loadData = async () => {
    const fTbody = container.querySelector('#fc-tbody');
    
    if (fTbody) fTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:3rem;color:var(--text-muted)"><span class="fin-spinner" style="margin-right:10px"></span> Loading faculty payments...</td></tr>`;
    
    try {
      facultyCosts = await financeService.getFacultyCosts();
      allProjects = await financeService.getProjectsList();

      const fProjSelect = container.querySelector('#new-fc-project');
      const options = '<option value="">Select Project</option>' + allProjects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
      
      if (fProjSelect) fProjSelect.innerHTML = options;
      
      renderFacultyTable();
    } catch (e) {
      if (fTbody) fTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:#ef4444">Failed to load data: ${e.message} <button class="fin-btn outline sm" onclick="window.location.reload()" style="margin-left:10px">Retry</button></td></tr>`;
    }
  };

  container.innerHTML = `
    <div class="fin-page-header">
      <div>
        <h1>Faculty Payment Ledger</h1>
        <p>Track faculty project payments based on development allocation pools</p>
      </div>
    </div>

    <!-- FACULTY SECTION -->
    <div id="section-faculty">
      <div class="fin-page-header" style="margin-bottom:1rem">
        <div></div>
        <button class="fin-btn primary" id="add-fc-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Record Faculty Payment
        </button>
      </div>

      <!-- Add Faculty Form -->
      <div id="add-fc-form" class="fin-form-section" style="display:none; margin-bottom: 24px;">
        <h3 class="fin-form-title">Record Faculty Payment</h3>
        <div class="fin-grid-2">
          <div>
            <div class="fin-form-group">
              <label>Project</label>
              <div class="fin-select-wrap">
                <select class="fin-input" id="new-fc-project"><option value="">Select Project</option></select>
              </div>
            </div>
            <div class="fin-form-group">
              <label>Assigned Faculty</label>
              <div class="fin-select-wrap">
                <select class="fin-input" id="new-fc-faculty" disabled><option value="">Select Project First</option></select>
              </div>
            </div>
          </div>
          <div>
            <div class="fin-form-group">
              <label>Amount (₹)</label>
              <input type="number" class="fin-input" id="new-fc-amt" placeholder="0">
            </div>
            <div class="fin-form-group">
              <label>Payment Date</label>
              <input type="date" class="fin-input" id="new-fc-date" value="${new Date().toISOString().split('T')[0]}">
            </div>
          </div>
        </div>
        <div class="fin-form-actions">
          <button class="fin-btn primary" id="save-new-fc">Save Payment</button>
          <button class="fin-btn outline" id="cancel-new-fc">Cancel</button>
        </div>
      </div>

      <!-- Faculty Filter -->
      <div class="fin-filter-bar">
        <div class="fin-filter-group" style="flex:2; min-width:200px;">
          <label>Search</label>
          <div class="fin-search-wrap">
            <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" id="fc-search" class="fin-input" placeholder="Search by faculty or project...">
          </div>
        </div>
        <div class="fin-filter-group" style="min-width:140px; max-width:180px;">
          <label>Status</label>
          <div class="fin-select-wrap">
            <select id="fc-status" class="fin-input">
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
        <div style="align-self:flex-end;">
          <button id="fc-clear-btn" class="fin-btn outline">Clear Filters</button>
        </div>
      </div>

      <div class="fin-panel">
        <div class="fin-panel-header">
          <div class="fin-panel-title">Faculty Payment Ledger</div>
          <div id="fc-count" style="font-size:0.8rem;color:var(--text-muted)"></div>
        </div>
        <div class="fin-table-wrap">
          <table class="fin-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Faculty Name</th>
                <th>Total Paid</th>
                <th>Payment Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="fc-tbody"></tbody>
          </table>
          <div id="no-fc-results" style="display:none;text-align:center;padding:2.5rem;color:var(--text-muted)"><p style="margin:0;font-size:0.9rem">No results found.</p></div>
        </div>
      </div>
    </div>
  `;

  // Bind UI Events
  const bindEvents = () => {
    // Forms toggling
    container.querySelector('#add-fc-btn').addEventListener('click', () => {
      container.querySelector('#add-fc-form').style.display = 'block';
    });
    
    container.querySelector('#cancel-new-fc').addEventListener('click', () => {
      container.querySelector('#add-fc-form').style.display = 'none';
      container.querySelector('#new-fc-amt').value = '';
      container.querySelector('#new-fc-project').value = '';
      container.querySelector('#new-fc-faculty').innerHTML = '<option value="">Select Project First</option>';
      container.querySelector('#new-fc-faculty').disabled = true;
    });

    // Populate faculties based on project selection
    container.querySelector('#new-fc-project').addEventListener('change', async (e) => {
      const pId = e.target.value;
      const fSelect = container.querySelector('#new-fc-faculty');
      if (!pId) {
        fSelect.innerHTML = '<option value="">Select Project First</option>';
        fSelect.disabled = true;
        return;
      }
      fSelect.innerHTML = '<option value="">Loading...</option>';
      fSelect.disabled = true;

      try {
        const facs = await financeService.getProjectFaculties(pId);
        if (facs && facs.length > 0) {
          fSelect.innerHTML = facs.map(f => `<option value="${f.project_faculty_id}">${f.resource_name}</option>`).join('');
          fSelect.disabled = false;
        } else {
          fSelect.innerHTML = '<option value="">No faculty assigned</option>';
        }
      } catch (err) {
        fSelect.innerHTML = '<option value="">Error loading</option>';
      }
    });

    // Save faculty cost
    container.querySelector('#save-new-fc').addEventListener('click', async () => {
      const pfId = container.querySelector('#new-fc-faculty').value;
      const amt = parseFloat(container.querySelector('#new-fc-amt').value);
      const date = container.querySelector('#new-fc-date').value;

      if (!pfId || isNaN(amt) || amt <= 0 || !date) {
        alert('Please fill out all fields properly.');
        return;
      }

      const btn = container.querySelector('#save-new-fc');
      const ogText = btn.textContent;
      btn.textContent = 'Saving...';
      btn.disabled = true;

      try {
        await financeService.addFacultyCost({
          project_faculty_id: pfId,
          amount: amt,
          payment_date: date
        });
        
        container.querySelector('#add-fc-form').style.display = 'none';
        container.querySelector('#new-fc-amt').value = '';
        container.querySelector('#new-fc-project').value = '';
        container.querySelector('#new-fc-faculty').innerHTML = '<option value="">Select Project First</option>';
        container.querySelector('#new-fc-faculty').disabled = true;
        
        loadData();
      } catch (err) {
        alert('Failed to save payment: ' + err.message);
      } finally {
        btn.textContent = ogText;
        btn.disabled = false;
      }
    });

    // Filter events
    ['keyup', 'change'].forEach(evt => {
      container.querySelector('#fc-search').addEventListener(evt, renderFacultyTable);
    });
    container.querySelector('#fc-status').addEventListener('change', renderFacultyTable);

    container.querySelector('#fc-clear-btn').addEventListener('click', () => {
      container.querySelector('#fc-search').value = '';
      container.querySelector('#fc-status').value = 'All';
      renderFacultyTable();
    });
  };

  bindEvents();
  loadData();

  return container;
}

export default FacultyCosts;
