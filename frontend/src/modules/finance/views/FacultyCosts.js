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

  const renderTable = () => {
    const tbody = container.querySelector('#fc-tbody');
    const noResults = container.querySelector('#no-results');
    if (!tbody) return;

    const searchTerm = container.querySelector('#search-input').value.toLowerCase();
    const statusFilter = container.querySelector('#status-filter').value;

    const filtered = facultyCosts.filter(fc => {
      const fName = fc.faculty_name || 'Unknown';
      const pName = fc.project_name || 'Unknown';
      const status = fc.payment_date ? 'Paid' : 'Pending';

      const matchName = fName.toLowerCase().includes(searchTerm) || pName.toLowerCase().includes(searchTerm);
      const matchStatus = statusFilter === 'All' || status === statusFilter;
      return matchName && matchStatus;
    });

    const countEl = container.querySelector('#results-count');
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
          <td>
            <div style="font-weight:600">${pName}</div>
          </td>
          <td>
            <div style="font-weight:600">${fName}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">PF-ID: ${fc.project_faculty_id}</div>
          </td>
          <td style="color:var(--text-muted)">Faculty</td>
          <td style="font-weight:700">${fmt(fc.amount || 0)}</td>
          <td style="color:var(--text-muted)">${fmtDate(fc.payment_date)}</td>
          <td><span class="fin-badge ${status === 'Paid' ? 'success' : 'warning'}">${status}</span></td>
        </tr>
      `}).join('');
    }
  };

  const loadData = async () => {
    facultyCosts = await financeService.getFacultyCosts();
    allProjects = await financeService.getProjectsList();

    const projectSelect = container.querySelector('#new-fc-project');
    if (projectSelect) {
      projectSelect.innerHTML = allProjects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    }
    renderTable();
  };

  container.innerHTML = `
    <div class="fin-page-header">
      <div>
        <h1>Faculty & Resource Costs</h1>
        <p>Track internal resource costs associated with RLabZ projects</p>
      </div>
      <button class="fin-btn primary" id="add-fc-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Record Cost
      </button>
    </div>

    <!-- Filter Bar -->
    <div class="fin-filter-bar">
      <div class="fin-filter-group" style="flex:2; min-width:200px;">
        <label>Search</label>
        <div class="fin-search-wrap">
          <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" id="search-input" class="fin-input" placeholder="Search by resource or project name...">
        </div>
      </div>
      <div class="fin-filter-group" style="min-width:140px; max-width:180px;">
        <label>Status</label>
        <div class="fin-select-wrap">
          <select id="status-filter" class="fin-input">
            <option value="All">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>
      <div style="align-self:flex-end;">
        <button id="clear-filters-btn" class="fin-btn outline">Clear Filters</button>
      </div>
    </div>

    <!-- Add Form (Hidden initially) -->
    <div id="add-fc-form" class="fin-form-section">
      <h3 class="fin-form-title">Record Resource Cost</h3>
      <div class="fin-grid-2">
        <div>
          <div class="fin-form-group">
            <label>Project</label>
            <div class="fin-select-wrap">
              <select class="fin-input" id="new-fc-project">
                <option value="">Select Project</option>
                <!-- Filled dynamically -->
              </select>
            </div>
          </div>
          <div class="fin-form-group">
            <label>Assigned Faculty</label>
            <div class="fin-select-wrap">
              <select class="fin-input" id="new-fc-faculty" disabled>
                <option value="">Select Project First</option>
              </select>
            </div>
          </div>
        </div>
        <div>
          <div class="fin-form-group">
            <label>Amount (₹)</label>
            <input type="number" class="fin-input" id="new-fc-amt" placeholder="0">
          </div>
          <div class="fin-form-group">
            <label>Date</label>
            <input type="date" class="fin-input" id="new-fc-date">
          </div>
        </div>
      </div>
      <div class="fin-form-actions">
        <button class="fin-btn primary" id="save-new-fc">Save Record</button>
        <button class="fin-btn outline" id="cancel-new-fc">Cancel</button>
      </div>
    </div>

    <div class="fin-panel">
      <div class="fin-panel-header">
        <div class="fin-panel-title">Resource Cost Ledger</div>
        <div id="results-count" style="font-size:0.8rem;color:var(--text-muted)"></div>
      </div>
      <div class="fin-table-wrap">
        <table class="fin-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Resource Name</th>
              <th>Role / Designation</th>
              <th>Total Cost</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="fc-tbody"></tbody>
        </table>
        <div id="no-results" style="display:none;text-align:center;padding:2.5rem;color:var(--text-muted)">
          <p style="margin:0;font-size:0.9rem">No results found.</p>
        </div>
      </div>
    </div>
  `;

  // Bind events
  container.querySelector('#search-input').addEventListener('input', renderTable);
  container.querySelector('#status-filter').addEventListener('change', renderTable);
  container.querySelector('#clear-filters-btn').addEventListener('click', () => {
    container.querySelector('#search-input').value = '';
    container.querySelector('#status-filter').value = 'All';
    renderTable();
  });

  const addForm = container.querySelector('#add-fc-form');
  const projectSelect = container.querySelector('#new-fc-project');
  const facultySelect = container.querySelector('#new-fc-faculty');
  
  container.querySelector('#add-fc-btn').addEventListener('click', () => addForm.classList.add('visible'));
  container.querySelector('#cancel-new-fc').addEventListener('click', () => addForm.classList.remove('visible'));
  
  projectSelect.addEventListener('change', async () => {
    const pId = projectSelect.value;
    if (!pId) {
      facultySelect.innerHTML = '<option value="">Select Project First</option>';
      facultySelect.disabled = true;
      return;
    }
    facultySelect.innerHTML = '<option value="">Loading...</option>';
    facultySelect.disabled = true;
    
    try {
      const faculties = await financeService.getProjectFaculties(pId);
      if (faculties.length === 0) {
        facultySelect.innerHTML = '<option value="">No faculty assigned to this project</option>';
      } else {
        facultySelect.innerHTML = faculties.map(f => `<option value="${f.project_faculty_id || f.id}">${f.resource_name} (${f.designation})</option>`).join('');
        facultySelect.disabled = false;
      }
    } catch (e) {
      facultySelect.innerHTML = '<option value="">Error loading faculties</option>';
    }
  });

  container.querySelector('#save-new-fc').addEventListener('click', async () => {
    const pfId = facultySelect.value;
    const amount = parseFloat(container.querySelector('#new-fc-amt').value) || 0;
    const date = container.querySelector('#new-fc-date').value;
    
    if (!pfId) {
      alert("Please select a faculty member.");
      return;
    }
    if (amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const data = {
      project_faculty_id: pfId,
      amount: amount,
      date: date || new Date().toISOString().split('T')[0] // The API expects payment_date, let's fix below
    };
    
    try {
      await financeService.addFacultyCost({ ...data, payment_date: data.date });
      addForm.classList.remove('visible');
      facultySelect.innerHTML = '<option value="">Select Project First</option>';
      facultySelect.disabled = true;
      projectSelect.value = '';
      container.querySelector('#new-fc-amt').value = '';
      container.querySelector('#new-fc-date').value = '';
      loadData();
    } catch(e) {
      alert('Failed to save cost: ' + e.message);
    }
  });

  loadData();
  return container;
}

export default FacultyCosts;
