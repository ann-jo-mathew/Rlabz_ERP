import { financeService } from '../services/FinanceService.js';
import { updateFinanceSidebar } from '../layouts/FinanceLayout.js';

export async function OperationalCosts(route, router) {
  const container = document.createElement('div');
  container.className = 'finance-module animate-fade-in';
  setTimeout(updateFinanceSidebar, 0);

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  const fmtDate = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    return isNaN(dt) ? d : dt.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  let allCosts = [];
  let renewalHistory = [];
  let currentFilter = 'ssl'; // default filter

  container.innerHTML = `
    <div class="fin-page-header">
      <div style="display:flex; justify-content:space-between; align-items:center; width: 100%;">
        <div>
          <h1>Operational & Infrastructure Costs</h1>
          <p>Manage project-specific Hosting, Domain, SSL, API services, and Maintenance</p>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="fin-btn primary" id="record-resource-btn">+ Record Resource</button>
          <button class="fin-btn secondary" id="record-maintenance-btn" style="background:#475569; color:#fff;">+ Record Maintenance & Support</button>
        </div>
      </div>
    </div>

    <div class="fin-panel">
      <div class="fin-panel-header" style="display:flex; justify-content:space-between; align-items:center;">
        <div class="fin-panel-title">Operational Costs Ledger</div>
        <div class="fin-filters" style="display:flex; gap:0.5rem;">
          <select class="fin-input" id="type-filter" style="width:200px; padding:0.25rem 0.5rem; height:auto;">
            <option value="ssl" selected>SSL</option>
            <option value="domain">Domain</option>
            <option value="api">API</option>
            <option value="hosting">Hosting</option>
            <option value="maintenance">Maintenance & Support</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>
      <div class="fin-table-wrap">
        <table class="fin-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Category</th>
              <th>Details/Provider</th>
              <th>Amount</th>
              <th>Start/Purchase Date</th>
              <th>Expiry Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="opcosts-tbody">
            <tr><td colspan="8" style="text-align:center;padding:3rem;color:var(--text-muted)"><span class="fin-spinner" style="margin-right:10px"></span> Loading operational costs...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div class="fin-panel" style="margin-top:2rem;">
      <div class="fin-panel-header">
        <div class="fin-panel-title">SSL Renewal History</div>
        <div class="fin-panel-subtitle">Historical log of all SSL certificate renewals</div>
      </div>
      <div class="fin-table-wrap">
        <table class="fin-table" style="font-size: 0.85rem">
          <thead>
            <tr>
              <th>Date</th>
              <th>Project / Details</th>
              <th>Prev Expiry</th>
              <th>New Expiry</th>
              <th>Amount</th>
              <th>Reference</th>
              <th>Renewed By</th>
            </tr>
          </thead>
          <tbody id="ssl-history-tbody">
            <tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted)">Loading renewal history...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  const renderTable = () => {
    const tbody = container.querySelector('#opcosts-tbody');
    let filtered = allCosts;
    
    if (currentFilter !== 'all') {
      filtered = allCosts.filter(c => c.category_raw === currentFilter);
    }

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:2rem">No records found for the selected filter</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(cost => {
      const isExpired = cost.expiryDate && new Date(cost.expiryDate) < new Date();
      
      let statusHtml = '<span class="fin-badge info">Active</span>';
      if (cost.expiryDate) {
        const daysLeft = Math.ceil((new Date(cost.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) {
          statusHtml = '<span class="fin-badge warning" style="background:#fee2e2;color:#dc2626;border-color:#f87171;">Expired</span>';
        } else if (daysLeft <= 7) {
          statusHtml = '<span class="fin-badge warning" style="background:#ffedd5;color:#c2410c;border-color:#fb923c;">Expiring Soon</span>';
        } else {
          statusHtml = '<span class="fin-badge success">Active</span>';
        }
      }

      const actionHtml = (cost.category_raw === 'ssl' || cost.category_raw === 'domain' || cost.category_raw === 'hosting') ? 
        `<button class="fin-btn outline sm renew-btn" data-pfid="${cost.pfid}" data-hcid="${cost.hcid}" data-type="${cost.category_raw}" data-provider="${cost.details}">Renew</button>` : '-';
      
      return `
      <tr>
        <td><div style="font-weight:600">${cost.project}</div></td>
        <td><span class="fin-badge indigo">${cost.category}</span></td>
        <td style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${cost.details}</td>
        <td style="font-weight:700">${fmt(cost.amount)}</td>
        <td style="color:var(--text-muted)">${fmtDate(cost.startDate)}</td>
        <td style="color:var(--text-muted); font-weight:600">${fmtDate(cost.expiryDate)}</td>
        <td>${statusHtml}</td>
        <td>${actionHtml}</td>
      </tr>
    `}).join('');

    bindRenewEvents();
  };

  const bindRenewEvents = () => {
    container.querySelectorAll('.renew-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pfid = btn.dataset.pfid;
        const hcid = btn.dataset.hcid;
        const type = btn.dataset.type;
        const prov = btn.dataset.provider;
        openResourceModal(pfid, type, prov, true, hcid);
      });
    });
  };

  const loadData = async () => {
    try {
      const allProjects = await financeService.getProjectFinances();
      allCosts = [];

      allProjects.forEach(p => {
        const pf = p.project_finance;
        if (!pf) return;
        const projName = p.title || 'Unknown Project';

        if (pf.hosting_charges && pf.hosting_charges.length > 0) {
          pf.hosting_charges.forEach(hc => {
            allCosts.push({
              hcid: hc.id,
              pfid: pf.id,
              project: projName,
              category: (hc.charge_type || 'hosting').toUpperCase(),
              category_raw: hc.charge_type || 'hosting',
              details: hc.reference_details || hc.provider || 'Internal/Unknown',
              amount: parseFloat(hc.amount) || 0,
              startDate: hc.purchase_date,
              expiryDate: hc.expiry_date
            });
          });
        }

        if (pf.maintenance_support_charges && pf.maintenance_support_charges.length > 0) {
          pf.maintenance_support_charges.forEach(mc => {
            allCosts.push({
              pfid: pf.id,
              project: projName,
              category: 'MAINTENANCE & SUPPORT',
              category_raw: 'maintenance',
              details: mc.description || 'Maintenance Contract',
              amount: parseFloat(mc.amount) || 0,
              startDate: mc.start_date,
              expiryDate: mc.end_date
            });
          });
        }
      });
      
      // Sort: Expiring earliest first
      allCosts.sort((a, b) => {
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return new Date(a.expiryDate) - new Date(b.expiryDate);
      });

      renderTable();
      
      try {
        renewalHistory = await financeService._fetch('/finance/ssl-renewal-history') || [];
        renderRenewalHistory();
      } catch (err) {
        console.error('Failed to load SSL history:', err);
      }
    } catch (e) {
      container.querySelector('#opcosts-tbody').innerHTML = `<tr><td colspan="8" style="text-align:center;color:#ef4444;padding:2rem">Failed to load operational costs: ${e.message} <button class="fin-btn outline sm" onclick="window.location.reload()" style="margin-left:10px">Retry</button></td></tr>`;
    }
  };

  const renderRenewalHistory = () => {
    const tbody = container.querySelector('#ssl-history-tbody');
    if (!tbody) return;
    if (renewalHistory.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:2rem">No SSL renewals found</td></tr>';
      return;
    }
    
    tbody.innerHTML = renewalHistory.map(h => `
      <tr>
        <td>${fmtDate(h.renewal_date)}</td>
        <td>
          <div style="font-weight:600">${h.project_name || 'Unknown Project'}</div>
          <div style="font-size:0.75rem; color:var(--text-muted)">${h.hosting_details || ''}</div>
        </td>
        <td style="color:var(--text-muted)">${fmtDate(h.previous_expiry_date)}</td>
        <td style="font-weight:600">${fmtDate(h.new_expiry_date)}</td>
        <td style="font-weight:700">${fmt(h.renewal_amount)}</td>
        <td style="font-family:monospace">${h.payment_reference || '-'}</td>
        <td>${h.renewed_by_name || 'System'}</td>
      </tr>
    `).join('');
  };

  container.querySelector('#type-filter').addEventListener('change', (e) => {
    currentFilter = e.target.value;
    renderTable();
  });

  const openResourceModal = async (defaultPfId = '', defaultType = 'ssl', defaultProvider = '', isRenewal = false, hcid = null) => {
    const projects = await financeService.getProjectFinances();
    const validProjects = projects.filter(p => p.project_finance && p.project_finance.id);

    const modal = document.createElement('div');
    modal.className = 'fin-modal-overlay';
    modal.innerHTML = `
      <div class="fin-modal" style="max-width: 500px;">
        <h3 style="margin:0 0 1rem">${isRenewal ? 'Renew Resource' : 'Record Resource Payment'}</h3>
        <div class="fin-form-group">
          <label>Project</label>
          <select class="fin-input" id="rr-project" ${isRenewal ? 'disabled' : ''}>
            <option value="">Select Project</option>
            ${validProjects.map(p => `<option value="${p.project_finance.id}" ${p.project_finance.id == defaultPfId ? 'selected' : ''}>${p.title}</option>`).join('')}
          </select>
        </div>
        <div class="fin-form-group">
          <label>Resource Type</label>
          <select class="fin-input" id="rr-type" ${isRenewal ? 'disabled' : ''}>
            <option value="ssl" ${defaultType === 'ssl' ? 'selected' : ''}>SSL Certificate</option>
            <option value="domain" ${defaultType === 'domain' ? 'selected' : ''}>Domain</option>
            <option value="api" ${defaultType === 'api' ? 'selected' : ''}>API Service</option>
            <option value="hosting" ${defaultType === 'hosting' ? 'selected' : ''}>Hosting / Server</option>
          </select>
        </div>
        <div class="fin-form-group">
          <label>Amount ${isRenewal ? '(Renewal Amount)' : ''}</label>
          <input type="number" class="fin-input" id="rr-amount" step="0.01" required>
        </div>
        <div style="display:flex; gap:1rem;">
          <div class="fin-form-group" style="flex:1">
            <label>${isRenewal ? 'Renewal Date' : 'Purchase Date'}</label>
            <input type="date" class="fin-input" id="rr-purchase" value="${new Date().toISOString().split('T')[0]}" required>
          </div>
          <div class="fin-form-group" style="flex:1">
            <label>New Expiry Date</label>
            <input type="date" class="fin-input" id="rr-expiry" required>
          </div>
        </div>
        <div class="fin-form-group">
          <label>Provider / Reference Details</label>
          <input type="text" class="fin-input" id="rr-ref" value="${defaultProvider}" placeholder="e.g. AWS, GoDaddy, Txn ID">
        </div>
        <div class="fin-form-actions" style="margin-top:1rem">
          <button class="fin-btn primary" id="confirm-rr">Save Record</button>
          <button class="fin-btn outline" id="cancel-rr">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#cancel-rr').addEventListener('click', () => modal.remove());
    modal.querySelector('#confirm-rr').addEventListener('click', async () => {
      const pfid = modal.querySelector('#rr-project').value;
      const type = modal.querySelector('#rr-type').value;
      const amt = parseFloat(modal.querySelector('#rr-amount').value);
      
      if (!pfid || !type || isNaN(amt) || amt < 0) {
        alert('Please fill all required fields properly.');
        return;
      }

      const confirmBtn = modal.querySelector('#confirm-rr');
      const originalText = confirmBtn.textContent;
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Saving...';

      try {
        if (isRenewal && hcid) {
            await financeService.renewSsl(hcid, {
                renewal_date: modal.querySelector('#rr-purchase').value,
                new_expiry_date: modal.querySelector('#rr-expiry').value,
                renewal_amount: amt,
                payment_reference: modal.querySelector('#rr-ref').value,
                remarks: 'Renewal'
            });
        } else {
            await financeService.addResourceCost({
                project_finance_id: pfid,
                charge_type: type,
                amount: amt,
                purchase_date: modal.querySelector('#rr-purchase').value,
                expiry_date: modal.querySelector('#rr-expiry').value,
                reference_details: modal.querySelector('#rr-ref').value
            });
        }
        modal.remove();
        loadData();
      } catch (err) {
        alert('Failed to save resource record: ' + err.message);
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
      }
    });
  };

  const openMaintenanceModal = async () => {
    const projects = await financeService.getProjectFinances();
    const validProjects = projects.filter(p => p.project_finance && p.project_finance.id);

    const modal = document.createElement('div');
    modal.className = 'fin-modal-overlay';
    modal.innerHTML = `
      <div class="fin-modal" style="max-width: 500px;">
        <h3 style="margin:0 0 1rem">Record Maintenance & Support</h3>
        <div class="fin-form-group">
          <label>Project</label>
          <select class="fin-input" id="rm-project">
            <option value="">Select Project</option>
            ${validProjects.map(p => `<option value="${p.project_finance.id}">${p.title}</option>`).join('')}
          </select>
        </div>
        <div class="fin-form-group">
          <label>Amount</label>
          <input type="number" class="fin-input" id="rm-amount" step="0.01" required>
        </div>
        <div style="display:flex; gap:1rem;">
          <div class="fin-form-group" style="flex:1">
            <label>Start Date</label>
            <input type="date" class="fin-input" id="rm-start" value="${new Date().toISOString().split('T')[0]}" required>
          </div>
          <div class="fin-form-group" style="flex:1">
            <label>End Date</label>
            <input type="date" class="fin-input" id="rm-end">
          </div>
        </div>
        <div class="fin-form-group">
          <label>Description</label>
          <textarea class="fin-input" id="rm-desc" rows="2" placeholder="Support period details..."></textarea>
        </div>
        <div class="fin-form-actions" style="margin-top:1rem">
          <button class="fin-btn primary" id="confirm-rm">Save Maintenance</button>
          <button class="fin-btn outline" id="cancel-rm">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#cancel-rm').addEventListener('click', () => modal.remove());
    modal.querySelector('#confirm-rm').addEventListener('click', async () => {
      const pfid = modal.querySelector('#rm-project').value;
      const amt = parseFloat(modal.querySelector('#rm-amount').value);
      
      if (!pfid || isNaN(amt) || amt < 0) {
        alert('Please fill all required fields properly.');
        return;
      }

      try {
        await financeService.addMaintenanceCost({
          project_finance_id: pfid,
          amount: amt,
          start_date: modal.querySelector('#rm-start').value,
          end_date: modal.querySelector('#rm-end').value || null,
          description: modal.querySelector('#rm-desc').value
        });
        modal.remove();
        loadData();
      } catch (err) {
        alert('Failed to save maintenance record: ' + err.message);
      }
    });
  };

  container.querySelector('#record-resource-btn').addEventListener('click', () => openResourceModal());
  container.querySelector('#record-maintenance-btn').addEventListener('click', () => openMaintenanceModal());

  loadData();

  return container;
}

export default OperationalCosts;
