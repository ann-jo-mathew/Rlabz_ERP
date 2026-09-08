import { financeService } from '../services/FinanceService.js';
import { updateFinanceSidebar } from '../layouts/FinanceLayout.js';

export async function CostDistribution(route, router) {
  const container = document.createElement('div');
  container.className = 'finance-module animate-fade-in';
  setTimeout(updateFinanceSidebar, 0);

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  container.innerHTML = `
    <div class="fin-page-header">
      <div>
        <h1>Cost Distribution</h1>
        <p>Project cost distribution approved by Coordinator / Director</p>
      </div>
    </div>

    <div class="fin-panel">
      <div class="fin-panel-header">
        <div class="fin-panel-title">Project Allocations</div>
        <div id="results-count" style="font-size:0.8rem;color:var(--text-muted)"></div>
      </div>
      <div class="fin-filters" style="padding:1.5rem; border-bottom:1px solid #e2e8f0; display:flex; gap:1rem;">
        <input type="text" class="fin-input" id="search-filter" placeholder="Search project or client..." style="max-width:300px;">
        <select class="fin-input" id="project-filter" style="max-width:250px;">
          <option value="All">All Projects</option>
        </select>
        <button id="clear-filters-btn" class="fin-btn outline">Clear Filters</button>
      </div>
      <div class="fin-table-wrap">
        <table class="fin-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Student Allocation</th>
              <th>Faculty Allocation</th>
              <th>RLabZ Allocation</th>
              <th>Total Development Amount</th>
              <th>Distribution</th>
            </tr>
          </thead>
          <tbody id="cost-tbody"></tbody>
        </table>
        <div id="no-results" style="display:none;text-align:center;padding:2.5rem;color:var(--text-muted)">
          <p style="margin:0;font-size:0.9rem">No project cost distributions found.</p>
        </div>
      </div>
    </div>
  `;

    let allProjectsData = [];

    const renderTable = () => {
      const tbody = container.querySelector('#cost-tbody');
      const noResults = container.querySelector('#no-results');
      const countEl = container.querySelector('#results-count');
      
      const searchTxt = (container.querySelector('#search-filter').value || '').toLowerCase();
      const projFilter = container.querySelector('#project-filter').value;

      const filtered = allProjectsData.filter(p => {
        if (projFilter !== 'All' && p.id.toString() !== projFilter) return false;
        if (searchTxt) {
          const matchTitle = (p.title || '').toLowerCase().includes(searchTxt);
          const matchClient = (p.client_name || '').toLowerCase().includes(searchTxt);
          if (!matchTitle && !matchClient) return false;
        }
        return true;
      });

      if (!filtered || filtered.length === 0) {
        noResults.style.display = 'block';
        countEl.textContent = '0 projects';
        tbody.innerHTML = '';
        return;
      }

      countEl.textContent = `${filtered.length} projects`;
      noResults.style.display = 'none';

      tbody.innerHTML = filtered.map(p => {
        const finance = p.project_finance || {};
        const allocations = finance.development_allocations || [];

        const student = parseFloat(allocations.find(a => a.category === 'student')?.amount || 0);
        const faculty = parseFloat(allocations.find(a => a.category === 'faculty')?.amount || 0);
        const rlabz = parseFloat(allocations.find(a => a.category === 'rlabz')?.amount || 0);
        const total = parseFloat(finance.total_development_amount || 0);

        // Calculate percentages for distribution bar
        const sPct = total > 0 ? Math.round((student / total) * 100) : 33;
        const fPct = total > 0 ? Math.round((faculty / total) * 100) : 33;
        const rPct = total > 0 ? Math.round((rlabz / total) * 100) : 34;

        return `
          <tr>
            <td>
              <div style="font-weight:600">${p.title || 'Unknown'}</div>
              <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px">${p.client_name || '-'}</div>
            </td>
            <td>
              <div style="font-weight:600;color:#059669">${fmt(student)}</div>
              <div style="font-size:0.75rem;color:var(--text-muted)">${sPct}%</div>
            </td>
            <td>
              <div style="font-weight:600;color:#0891b2">${fmt(faculty)}</div>
              <div style="font-size:0.75rem;color:var(--text-muted)">${fPct}%</div>
            </td>
            <td>
              <div style="font-weight:600;color:#6366f1">${fmt(rlabz)}</div>
              <div style="font-size:0.75rem;color:var(--text-muted)">${rPct}%</div>
            </td>
            <td style="font-weight:700">${fmt(total)}</td>
            <td style="min-width:140px">
              <div style="display:flex;height:8px;border-radius:4px;overflow:hidden;background:#e2e8f0">
                <div style="width:${sPct}%;background:#059669" title="Student ${sPct}%"></div>
                <div style="width:${fPct}%;background:#0891b2" title="Faculty ${fPct}%"></div>
                <div style="width:${rPct}%;background:#6366f1" title="RLabZ ${rPct}%"></div>
              </div>
              <div style="display:flex;gap:8px;margin-top:4px;font-size:0.65rem;color:var(--text-muted)">
                <span style="display:flex;align-items:center;gap:3px"><span style="width:6px;height:6px;border-radius:50%;background:#059669;display:inline-block"></span>Stu</span>
                <span style="display:flex;align-items:center;gap:3px"><span style="width:6px;height:6px;border-radius:50%;background:#0891b2;display:inline-block"></span>Fac</span>
                <span style="display:flex;align-items:center;gap:3px"><span style="width:6px;height:6px;border-radius:50%;background:#6366f1;display:inline-block"></span>RLz</span>
              </div>
            </td>
            <td>
              <button class="fin-btn outline sm distribute-btn" data-id="${p.id}" data-total="${total}" data-student="${student}" data-faculty="${faculty}" data-rlabz="${rlabz}">
                Distribute
              </button>
            </td>
          </tr>
        `;
      }).join('');

      // Bind distribution events
      container.querySelectorAll('.distribute-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const pId = btn.dataset.id;
          const total = parseFloat(btn.dataset.total) || 0;
          const stu = parseFloat(btn.dataset.student) || 0;
          const fac = parseFloat(btn.dataset.faculty) || 0;
          const rlz = parseFloat(btn.dataset.rlabz) || 0;

          const modal = document.createElement('div');
          modal.className = 'fin-modal-overlay';
          modal.innerHTML = `
            <div class="fin-modal">
              <h3 style="margin:0 0 1rem">Distribute Development Cost</h3>
              <p style="margin:0 0 1rem;font-size:0.9rem;color:var(--text-muted)">Total Development Budget: <strong>${fmt(total)}</strong></p>
              
              <div class="fin-form-group">
                <label>Student Allocation (₹)</label>
                <input type="number" class="fin-input alloc-input" id="dist-stu" value="${stu}" min="0">
              </div>
              <div class="fin-form-group">
                <label>Faculty Allocation (₹)</label>
                <input type="number" class="fin-input alloc-input" id="dist-fac" value="${fac}" min="0">
              </div>
              <div class="fin-form-group">
                <label>RLabZ Allocation (₹)</label>
                <input type="number" class="fin-input alloc-input" id="dist-rlz" value="${rlz}" min="0">
              </div>
              
              <div style="font-size:0.85rem;margin:1rem 0;color:#666">
                Assigned: <span id="dist-assigned" style="font-weight:600">0</span> / 
                Remaining: <span id="dist-remaining" style="font-weight:600">0</span>
              </div>

              <div class="fin-form-actions" style="margin-top:1rem">
                <button class="fin-btn primary" id="confirm-dist">Save Distribution</button>
                <button class="fin-btn outline" id="cancel-dist">Cancel</button>
              </div>
            </div>
          `;
          document.body.appendChild(modal);

          const updateSummary = () => {
            const s = parseFloat(modal.querySelector('#dist-stu').value) || 0;
            const f = parseFloat(modal.querySelector('#dist-fac').value) || 0;
            const r = parseFloat(modal.querySelector('#dist-rlz').value) || 0;
            const assigned = s + f + r;
            const rem = total - assigned;
            
            modal.querySelector('#dist-assigned').textContent = fmt(assigned);
            modal.querySelector('#dist-remaining').textContent = fmt(rem);
            modal.querySelector('#dist-remaining').style.color = rem < 0 ? '#e53e3e' : '#059669';
          };

          modal.querySelectorAll('.alloc-input').forEach(inp => inp.addEventListener('input', updateSummary));
          updateSummary();

          modal.querySelector('#cancel-dist').addEventListener('click', () => modal.remove());
          modal.querySelector('#confirm-dist').addEventListener('click', async () => {
            const s = parseFloat(modal.querySelector('#dist-stu').value) || 0;
            const f = parseFloat(modal.querySelector('#dist-fac').value) || 0;
            const r = parseFloat(modal.querySelector('#dist-rlz').value) || 0;
            const assigned = s + f + r;

            if (assigned > total) {
              if(!confirm('Total allocated exceeds development budget. Are you sure?')) return;
            }
            
            try {
              const btn = modal.querySelector('#confirm-dist');
              btn.innerHTML = 'Saving...';
              btn.disabled = true;
              
              await financeService.updateAllocations(pId, {
                student_allocation: s,
                faculty_allocation: f,
                rlabz_allocation: r
              });
              modal.remove();
              loadData();
            } catch(e) {
              alert('Failed to update allocations: ' + e.message);
              modal.querySelector('#confirm-dist').innerHTML = 'Save Distribution';
              modal.querySelector('#confirm-dist').disabled = false;
            }
          });
        });
      });
    };

    container.querySelector('#search-filter').addEventListener('input', renderTable);
    container.querySelector('#project-filter').addEventListener('change', renderTable);
    container.querySelector('#clear-filters-btn').addEventListener('click', () => {
      container.querySelector('#search-filter').value = '';
      container.querySelector('#project-filter').value = 'All';
      renderTable();
    });

  async function loadData() {
    try {
      allProjectsData = await financeService.getProjectFinances();
      
      const pSelect = container.querySelector('#project-filter');
      const currentSelection = pSelect.value;
      pSelect.innerHTML = '<option value="All">All Projects</option>' + 
        allProjectsData.map(p => `<option value="${p.id}">${p.title || p.name}</option>`).join('');
      pSelect.value = currentSelection || 'All';
      
      renderTable();
    } catch (err) {
      console.error('Failed to load cost distribution:', err);
      container.querySelector('#cost-tbody').innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:1.5rem">Failed to load data</td></tr>';
    }
  }

  loadData();

  return container;
}

export default CostDistribution;
