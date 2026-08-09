import { DirectorService } from '../services/DirectorService.js';

export function DirectorHome(route, router) {
  const container = document.createElement('div');
  container.className = 'director-dashboard';

  function render() {
    const stats = DirectorService.getOverview();
    const proposals = DirectorService.getProposals();
    const pendingProposals = proposals.filter(p => p.status === 'pending');
    const projects = DirectorService.getProjects();
    const auditLogs = DirectorService.getAuditLogs().slice(0, 4);
    const faculties = DirectorService.getFaculties();

    container.innerHTML = `
      <!-- Header -->
      <div class="director-header">
        <div>
          <h1>Director Overview & KPI Dashboard</h1>
          <p>Department Executive Control Center & High-Level Oversight Panel</p>
        </div>
        <div class="director-badge-role">
          Director Access
        </div>
      </div>

      <!-- Top KPI Cards Row -->
      <div class="director-kpi-grid">
        <div class="director-kpi-card">
          <div class="director-kpi-top">
            <span class="director-kpi-title">Active Projects</span>
            <div class="director-kpi-icon blue">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            </div>
          </div>
          <div class="director-kpi-value">${stats.activeProjects} / ${stats.totalProjects}</div>
          <div class="director-kpi-subtext">${stats.totalProjects - stats.activeProjects} Completed or Pending</div>
        </div>

        <div class="director-kpi-card">
          <div class="director-kpi-top">
            <span class="director-kpi-title">Pending Proposals</span>
            <div class="director-kpi-icon amber">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 16 14"></polyline></svg>
            </div>
          </div>
          <div class="director-kpi-value">${stats.pendingProposals}</div>
          <div class="director-kpi-subtext">Requires Director Approval</div>
        </div>

        <div class="director-kpi-card">
          <div class="director-kpi-top">
            <span class="director-kpi-title">Student Roster</span>
            <div class="director-kpi-icon purple">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
          </div>
          <div class="director-kpi-value">${stats.studentCounts.total}</div>
          <div class="director-kpi-subtext">
            <span class="track-badge nova" style="padding:1px 5px; font-size:0.65rem;">Nova: ${stats.studentCounts.nova}</span>
            <span class="track-badge orbit" style="padding:1px 5px; font-size:0.65rem;">Orbit: ${stats.studentCounts.orbit}</span>
            <span class="track-badge spark" style="padding:1px 5px; font-size:0.65rem;">Spark: ${stats.studentCounts.spark}</span>
          </div>
        </div>

        <div class="director-kpi-card">
          <div class="director-kpi-top">
            <span class="director-kpi-title">Financial Budget</span>
            <div class="director-kpi-icon emerald">₹</div>
          </div>
          <div class="director-kpi-value">₹${(stats.finance.totalBudget / 1000).toFixed(0)}k</div>
          <div class="director-kpi-subtext">Spent: ₹${(stats.finance.totalSpent / 1000).toFixed(0)}k | Disbursed: ₹${(stats.finance.stipendsDisbursed / 1000).toFixed(0)}k</div>
        </div>
      </div>

      <!-- Quick Action proposals & health -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1.25rem;">
        <div class="director-panel">
          <div class="director-panel-header">
            <h2>⚡ Proposals Needing Action (${pendingProposals.length})</h2>
            <button class="btn-director btn-director-outline btn-goto-projects">Manage Proposals</button>
          </div>
          ${pendingProposals.length === 0 ? `
            <p style="color:#6b7280; font-size:0.875rem; margin:0;">All project proposals are reviewed!</p>
          ` : `
            <div style="display:flex; flex-direction:column; gap:0.75rem;">
              ${pendingProposals.map(p => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:0.75rem; background:#f9fafb; border-radius:8px; border:1px solid #e5e7eb;">
                  <div>
                    <strong>${p.title}</strong><br>
                    <small style="color:#6b7280">${p.clientName} • ₹${p.estimatedBudget.toLocaleString()}</small>
                  </div>
                  <button class="btn-director btn-director-primary btn-open-proposal-modal" data-id="${p.id}">
                    Review
                  </button>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <div class="director-panel">
          <div class="director-panel-header">
            <h2>📊 Active Project Health</h2>
          </div>
          <div class="director-table-responsive">
            <table class="director-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Faculty Lead</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                ${projects.slice(0, 3).map(p => `
                  <tr>
                    <td><strong>${p.title}</strong></td>
                    <td>${p.facultyName}</td>
                    <td>
                      <div class="director-progress-bar-bg">
                        <div class="director-progress-bar-fill" style="width: ${p.progress}%"></div>
                      </div>
                      <strong>${p.progress}%</strong>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Recent System Audit Log -->
      <div class="director-panel">
        <div class="director-panel-header">
          <h2>🛡️ Recent System Audit Activity</h2>
          <button class="btn-director btn-director-outline btn-goto-audit">Full Audit Log</button>
        </div>
        <div style="display:flex; flex-direction:column; gap:0.75rem;">
          ${auditLogs.map(log => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:0.6rem 0.8rem; background:#f9fafb; border-radius:8px; font-size:0.825rem; border:1px solid #f3f4f6;">
              <div>
                <strong>${log.event}</strong> - <span style="color:#4b5563">${log.user}</span>
                <div style="color:#6b7280; font-size:0.75rem; margin-top:2px;">${log.details}</div>
              </div>
              <div style="font-size:0.7rem; color:#9ca3af; text-align:right; white-space:nowrap; margin-left:0.5rem;">
                ${log.timestamp}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Modal Container -->
      <div id="director-modal-root"></div>
    `;

    // Attach Event Listeners
    container.querySelector('.btn-goto-projects')?.addEventListener('click', () => router.push('/dashboard/projects'));
    container.querySelector('.btn-goto-audit')?.addEventListener('click', () => router.push('/dashboard/audit'));

    container.querySelectorAll('.btn-open-proposal-modal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const proposal = DirectorService.getProposals().find(p => p.id === id);
        if (proposal) showProposalModal(proposal, faculties);
      });
    });
  }

  function showProposalModal(proposal, faculties) {
    const modalHost = container.querySelector('#director-modal-root');
    modalHost.innerHTML = `
      <div class="director-modal-overlay">
        <div class="director-modal">
          <div class="director-modal-header">
            <h3>Review Proposal: ${proposal.title}</h3>
            <button class="btn-director btn-director-outline btn-close-modal">✕</button>
          </div>
          <div class="director-modal-body">
            <p><strong>Description:</strong> ${proposal.description}</p>
            <p><strong>Client:</strong> ${proposal.clientName} | <strong>Est. Budget:</strong> ₹${proposal.estimatedBudget.toLocaleString()}</p>
            
            <label style="font-weight:600; font-size:0.875rem;">Assign Lead Faculty:</label>
            <select id="modal-select-faculty" style="padding:0.5rem; border-radius:6px; border:1px solid #d1d5db;">
              ${faculties.map(f => `<option value="${f.id}" ${f.id === proposal.suggestedFaculty ? 'selected' : ''}>${f.name} (${f.department})</option>`).join('')}
            </select>

            <label style="font-weight:600; font-size:0.875rem;">Director Remarks:</label>
            <textarea id="modal-review-notes" rows="2" placeholder="Optional review remarks..." style="padding:0.5rem; border-radius:6px; border:1px solid #d1d5db; font-family:inherit;"></textarea>
          </div>
          <div class="director-modal-footer">
            <button class="btn-director btn-director-danger btn-reject-prop">Reject Proposal</button>
            <button class="btn-director btn-director-success btn-accept-prop">Accept & Approve</button>
          </div>
        </div>
      </div>
    `;

    modalHost.querySelector('.btn-close-modal').addEventListener('click', () => { modalHost.innerHTML = ''; });
    modalHost.querySelector('.btn-accept-prop').addEventListener('click', () => {
      const facId = modalHost.querySelector('#modal-select-faculty').value;
      const notes = modalHost.querySelector('#modal-review-notes').value;
      DirectorService.updateProposalStatus(proposal.id, 'accepted', notes, facId);
      modalHost.innerHTML = '';
      render();
    });
    modalHost.querySelector('.btn-reject-prop').addEventListener('click', () => {
      const notes = modalHost.querySelector('#modal-review-notes').value;
      DirectorService.updateProposalStatus(proposal.id, 'rejected', notes);
      modalHost.innerHTML = '';
      render();
    });
  }

  render();
  return container;
}

export default DirectorHome;
