import { financeService } from '../services/FinanceService.js';
import { updateFinanceSidebar } from '../layouts/FinanceLayout.js';

export async function CostDistribution(route, router) {
  const container = document.createElement('div');
  container.className = 'finance-module animate-fade-in';
  setTimeout(updateFinanceSidebar, 0);

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  // ── Lock helpers ──────────────────────────────────────────────────────────
  const LOCKED_STATUSES = ['closed', 'completed', 'cancelled'];

  /**
   * Returns { locked, reason, label } from the server-provided finance_lock
   * field (added by FinanceService::buildFinanceLock). Falls back to client-
   * side derivation when the field is absent (older API responses).
   */
  const getFinanceLock = (project) => {
    if (project.finance_lock) return project.finance_lock;
    // Fallback derivation
    if (LOCKED_STATUSES.includes(project.status)) {
      return { locked: true, reason: 'status', label: project.status.charAt(0).toUpperCase() + project.status.slice(1) };
    }
    if (!project.budget || parseFloat(project.budget) <= 0) {
      return { locked: true, reason: 'no_budget', label: 'No Approved Budget' };
    }
    return { locked: false, reason: null, label: null };
  };

  /** Human-readable lock tooltip text */
  const lockTooltip = (lock) => {
    if (!lock.locked) return '';
    if (lock.reason === 'status') return `🔒 Locked – project is ${lock.label}`;
    return '⚠ No approved budget set for this project';
  };

  /** Inline status badge HTML (beside project name in the table) */
  const lockBadgeHtml = (lock) => {
    if (!lock.locked) return '';
    if (lock.reason === 'status') {
      return `<span style="display:inline-flex;align-items:center;gap:3px;font-size:0.68rem;font-weight:600;
               padding:2px 7px;border-radius:9px;background:#fee2e2;color:#b91c1c;margin-left:6px">
               🔒 ${lock.label}</span>`;
    }
    return `<span style="display:inline-flex;align-items:center;gap:3px;font-size:0.68rem;font-weight:600;
             padding:2px 7px;border-radius:9px;background:#fef3c7;color:#92400e;margin-left:6px">
             ⚠ No Budget</span>`;
  };

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
      <div class="fin-filters" style="padding:1.5rem; border-bottom:1px solid #e2e8f0; display:flex; gap:1rem; flex-wrap:wrap; align-items:center;">
        <input type="text" class="fin-input" id="search-filter" placeholder="Search project or client..." style="max-width:300px;">
        <select class="fin-input" id="project-filter" style="max-width:300px;">
          <option value="All">All Projects</option>
        </select>
        <button id="clear-filters-btn" class="fin-btn outline">Clear Filters</button>
        <span style="font-size:0.78rem;color:var(--text-muted);margin-left:auto">
          🔒 = Locked &nbsp;|&nbsp; ⚠ = No Budget &nbsp;(visible but read-only)
        </span>
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
              <th>Action</th>
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
    const tbody     = container.querySelector('#cost-tbody');
    const noResults = container.querySelector('#no-results');
    const countEl   = container.querySelector('#results-count');

    const searchTxt  = (container.querySelector('#search-filter').value || '').toLowerCase();
    const projFilter = container.querySelector('#project-filter').value;

    const filtered = allProjectsData.filter(p => {
      if (projFilter !== 'All' && p.id.toString() !== projFilter) return false;
      if (searchTxt) {
        const matchTitle  = (p.title  || '').toLowerCase().includes(searchTxt);
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
      const finance     = p.project_finance || {};
      const allocations = finance.development_allocations || [];
      const lock        = getFinanceLock(p);

      const student = parseFloat(allocations.find(a => a.category === 'student')?.amount || 0);
      const faculty = parseFloat(allocations.find(a => a.category === 'faculty')?.amount || 0);
      const rlabz   = parseFloat(allocations.find(a => a.category === 'rlabz')?.amount || 0);
      const total   = parseFloat(finance.total_development_amount || 0);

      const sPct = total > 0 ? Math.round((student / total) * 100) : 33;
      const fPct = total > 0 ? Math.round((faculty / total) * 100) : 33;
      const rPct = total > 0 ? Math.round((rlabz  / total) * 100) : 34;

      // Button appearance differs for locked vs unlocked projects
      const btnStyle = lock.locked
        ? `opacity:0.45;cursor:not-allowed;pointer-events:none;`
        : '';
      const btnTitle = lock.locked ? lockTooltip(lock) : 'Distribute development cost';

      return `
        <tr style="${lock.locked ? 'background:rgba(0,0,0,0.015)' : ''}">
          <td>
            <div style="font-weight:600;display:flex;align-items:center;flex-wrap:wrap;gap:4px">
              ${p.title || 'Unknown'}
              ${lockBadgeHtml(lock)}
            </div>
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
              <div style="width:${sPct}%;background:${lock.locked ? '#9ca3af' : '#059669'}" title="Student ${sPct}%"></div>
              <div style="width:${fPct}%;background:${lock.locked ? '#c4c9d4' : '#0891b2'}" title="Faculty ${fPct}%"></div>
              <div style="width:${rPct}%;background:${lock.locked ? '#d1d5db' : '#6366f1'}" title="RLabZ ${rPct}%"></div>
            </div>
            <div style="display:flex;gap:8px;margin-top:4px;font-size:0.65rem;color:var(--text-muted)">
              <span style="display:flex;align-items:center;gap:3px"><span style="width:6px;height:6px;border-radius:50%;background:#059669;display:inline-block"></span>Stu</span>
              <span style="display:flex;align-items:center;gap:3px"><span style="width:6px;height:6px;border-radius:50%;background:#0891b2;display:inline-block"></span>Fac</span>
              <span style="display:flex;align-items:center;gap:3px"><span style="width:6px;height:6px;border-radius:50%;background:#6366f1;display:inline-block"></span>RLz</span>
            </div>
          </td>
          <td>
            <button
              class="fin-btn outline sm distribute-btn"
              data-id="${p.id}"
              data-total="${total}"
              data-student="${student}"
              data-faculty="${faculty}"
              data-rlabz="${rlabz}"
              data-locked="${lock.locked ? '1' : '0'}"
              data-lock-reason="${lock.reason || ''}"
              data-lock-label="${lock.label || ''}"
              title="${btnTitle}"
              style="${btnStyle}"
              ${lock.locked ? 'disabled aria-disabled="true"' : ''}
            >
              ${lock.locked ? (lock.reason === 'status' ? '🔒 Locked' : '⚠ No Budget') : 'Distribute'}
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Bind distribution modal events (only fires for non-locked buttons)
    container.querySelectorAll('.distribute-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => openDistributeModal(btn));
    });
  };

  // ── Distribute modal ───────────────────────────────────────────────────────
  const openDistributeModal = (btn) => {
    const pId   = btn.dataset.id;
    const total = parseFloat(btn.dataset.total)   || 0;
    const stu   = parseFloat(btn.dataset.student) || 0;
    const fac   = parseFloat(btn.dataset.faculty) || 0;
    const rlz   = parseFloat(btn.dataset.rlabz)   || 0;

    const modal = document.createElement('div');
    modal.className = 'fin-modal-overlay';
    modal.innerHTML = `
      <div class="fin-modal">
        <h3 style="margin:0 0 1rem">Distribute Development Cost</h3>
        <p style="margin:0 0 1rem;font-size:0.9rem;color:var(--text-muted)">Total Development Budget: <strong>${fmt(total)}</strong></p>

        <div id="modal-error" style="display:none;background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5;
          border-radius:8px;padding:0.65rem 1rem;margin-bottom:1rem;font-size:0.85rem;"></div>

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
      const s        = parseFloat(modal.querySelector('#dist-stu').value) || 0;
      const f        = parseFloat(modal.querySelector('#dist-fac').value) || 0;
      const r        = parseFloat(modal.querySelector('#dist-rlz').value) || 0;
      const assigned = s + f + r;
      const rem      = total - assigned;
      modal.querySelector('#dist-assigned').textContent = fmt(assigned);
      modal.querySelector('#dist-remaining').textContent = fmt(rem);
      modal.querySelector('#dist-remaining').style.color = rem < 0 ? '#e53e3e' : '#059669';
    };

    modal.querySelectorAll('.alloc-input').forEach(inp => inp.addEventListener('input', updateSummary));
    updateSummary();

    modal.querySelector('#cancel-dist').addEventListener('click', () => modal.remove());

    modal.querySelector('#confirm-dist').addEventListener('click', async () => {
      const s        = parseFloat(modal.querySelector('#dist-stu').value) || 0;
      const f        = parseFloat(modal.querySelector('#dist-fac').value) || 0;
      const r        = parseFloat(modal.querySelector('#dist-rlz').value) || 0;
      const assigned = s + f + r;
      const errorEl  = modal.querySelector('#modal-error');

      if (assigned > total) {
        if (!confirm('Total allocated exceeds development budget. Are you sure?')) return;
      }

      try {
        errorEl.style.display = 'none';
        const confirmBtn = modal.querySelector('#confirm-dist');
        confirmBtn.innerHTML = 'Saving…';
        confirmBtn.disabled = true;

        await financeService.updateAllocations(pId, {
          student_allocation: s,
          faculty_allocation: f,
          rlabz_allocation: r
        });
        modal.remove();
        loadData();
      } catch (e) {
        // Show server validation message inside the modal (not an alert)
        errorEl.textContent = e.message || 'Failed to update allocations.';
        errorEl.style.display = 'block';
        const confirmBtn = modal.querySelector('#confirm-dist');
        confirmBtn.innerHTML = 'Save Distribution';
        confirmBtn.disabled = false;
      }
    });
  };

  // ── Filters ────────────────────────────────────────────────────────────────
  container.querySelector('#search-filter').addEventListener('input', renderTable);
  container.querySelector('#project-filter').addEventListener('change', renderTable);
  container.querySelector('#clear-filters-btn').addEventListener('click', () => {
    container.querySelector('#search-filter').value = '';
    container.querySelector('#project-filter').value = 'All';
    renderTable();
  });

  // ── Data load ─────────────────────────────────────────────────────────────
  async function loadData() {
    try {
      allProjectsData = await financeService.getProjectFinances();

      const pSelect          = container.querySelector('#project-filter');
      const currentSelection = pSelect.value;

      // Dropdown: all projects visible; locked ones get a descriptive label suffix
      pSelect.innerHTML = '<option value="All">All Projects</option>' +
        allProjectsData.map(p => {
          const lock   = getFinanceLock(p);
          const suffix = lock.locked
            ? (lock.reason === 'status' ? ` (${lock.label} – Locked)` : ' (No Approved Budget)')
            : '';
          return `<option value="${p.id}">${p.title || p.name}${suffix}</option>`;
        }).join('');

      pSelect.value = currentSelection || 'All';
      renderTable();
    } catch (err) {
      console.error('Failed to load cost distribution:', err);
      container.querySelector('#cost-tbody').innerHTML =
        '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:1.5rem">Failed to load data</td></tr>';
    }
  }

  loadData();

  return container;
}

export default CostDistribution;
