import { DirectorService } from '../services/DirectorService.js';

export function DirectorHome(route, router) {
  const container = document.createElement('div');
  container.className = 'director-dashboard';

  function renderLoading() {
    container.innerHTML = `
      <div class="director-header">
        <div>
          <h1>Director Overview & KPI Dashboard</h1>
          <p>Department Executive Control Center & High-Level Oversight Panel</p>
        </div>
        <div class="director-badge-role">Director Access</div>
      </div>
      <div style="padding: 3rem; text-align: center; color: #6b7280; background: white; border-radius: 12px; border: 1px solid #e5e7eb;">
        <div style="display:inline-block; width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: #059669; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 0.75rem;"></div>
        <p style="margin: 0; font-weight: 500; font-size: 0.95rem;">Loading live dashboard metrics from database...</p>
      </div>
    `;
  }

  function render(stats = DirectorService.getOverview()) {
    stats = stats || DirectorService.getOverview() || {};
    const studentCounts = stats.studentCounts || { nova: 0, orbit: 0, spark: 0, total: 0 };
    const proposals = Array.isArray(DirectorService.getProposals()) ? DirectorService.getProposals() : [];
    const pendingProposals = proposals.filter(p => p.status === 'pending' || p.status === 'proposed');
    const projects = Array.isArray(DirectorService.getProjects()) ? DirectorService.getProjects() : [];
    const auditLogs = (Array.isArray(DirectorService.getAuditLogs()) ? DirectorService.getAuditLogs() : []).slice(0, 4);
    const faculties = Array.isArray(DirectorService.getFaculties()) ? DirectorService.getFaculties() : [];

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
      ${(() => {
        const activeProjects = stats.activeProjects || 0;
        const totalProjects = stats.totalProjects || 0;
        const remainingProjects = Math.max(0, totalProjects - activeProjects);
        const projectPercent = totalProjects > 0 ? Math.min(100, Math.round((activeProjects / totalProjects) * 100)) : 0;

        const pendingCount = stats.pendingProposals !== undefined ? stats.pendingProposals : 0;

        const totalStudents = studentCounts.total || 0;
        const nova = studentCounts.nova || 0;
        const orbit = studentCounts.orbit || 0;
        const spark = studentCounts.spark || 0;
        const totalFallback = totalStudents || 1;
        const novaPct = Math.round((nova / totalFallback) * 100);
        const orbitPct = Math.round((orbit / totalFallback) * 100);
        const sparkPct = Math.max(0, 100 - novaPct - orbitPct);

        const fin = stats.finance || {};
        const budget = Number(fin.totalBudget ?? fin.total_budget ?? 0);
        const spent = Number(fin.totalSpent ?? fin.total_spent ?? 0);
        const disbursed = Number(fin.stipendsDisbursed ?? fin.stipends_disbursed ?? 0);
        const spentPct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
        const remainingBudget = Math.max(0, budget - spent);

        return `
        <div class="director-kpi-grid">
          <!-- 1. Active Projects (Light Olive) -->
          <div class="director-kpi-card kpi-olive">
            <div class="kpi-watermark">
              <svg width="95" height="95" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div class="director-kpi-top">
              <div class="kpi-title-group">
                <span class="director-kpi-title">Active Projects</span>
                <span class="kpi-micro-pill">Live Cycle</span>
              </div>
              <div class="director-kpi-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
            </div>
            <div class="director-kpi-value">${activeProjects} <span class="kpi-value-denominator">/ ${totalProjects}</span></div>
            
            <div class="kpi-meter-container">
              <div class="kpi-meter-bar">
                <div class="kpi-meter-fill" style="width: ${projectPercent}%"></div>
              </div>
              <div class="kpi-meter-legend">
                <span>${projectPercent}% Active Load</span>
                <span>${remainingProjects} Inactive</span>
              </div>
            </div>

            <div class="director-kpi-subtext">
              <span>${remainingProjects} Completed or Pending</span>
            </div>
          </div>

          <!-- 2. Pending Proposals (Orange) -->
          <div class="director-kpi-card kpi-orange">
            <div class="kpi-watermark">
              <svg width="95" height="95" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 16 14"></polyline>
              </svg>
            </div>
            <div class="director-kpi-top">
              <div class="kpi-title-group">
                <span class="director-kpi-title">Pending Proposals</span>
                ${pendingCount > 0 
                  ? `<span class="kpi-micro-pill kpi-pill-pulse">⚡ Action Needed</span>` 
                  : `<span class="kpi-micro-pill">✓ Clear</span>`}
              </div>
              <div class="director-kpi-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 16 14"></polyline>
                </svg>
              </div>
            </div>
            <div class="director-kpi-value">${pendingCount}</div>
            
            <div class="kpi-callout-box">
              ${pendingCount > 0 
                ? `<span>⚠️ ${pendingCount} Proposal${pendingCount === 1 ? '' : 's'} Awaiting Approval</span>` 
                : `<span>✓ All proposals reviewed</span>`}
            </div>

            <div class="director-kpi-subtext">
              <span>Requires Director Approval</span>
            </div>
          </div>

          <!-- 3. Student Roster (Violet) -->
          <div class="director-kpi-card kpi-violet">
            <div class="kpi-watermark">
              <svg width="95" height="95" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div class="director-kpi-top">
              <div class="kpi-title-group">
                <span class="director-kpi-title">Student Roster</span>
                <span class="kpi-micro-pill">3 Tracks</span>
              </div>
              <div class="director-kpi-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
            </div>
            <div class="director-kpi-value">${totalStudents} <span class="kpi-value-denominator">Enrolled</span></div>
            
            <div class="kpi-meter-container">
              <div class="kpi-segmented-bar" title="Track Breakdown: Nova ${nova}, Orbit ${orbit}, Spark ${spark}">
                <div class="kpi-segment nova" style="width: ${novaPct}%;"></div>
                <div class="kpi-segment orbit" style="width: ${orbitPct}%;"></div>
                <div class="kpi-segment spark" style="width: ${sparkPct}%;"></div>
              </div>
              <div class="kpi-meter-legend">
                <span>Distribution</span>
                <span>Nova • Orbit • Spark</span>
              </div>
            </div>

            <div class="director-kpi-subtext kpi-track-row">
              <span class="track-badge-micro nova">Nova: ${nova}</span>
              <span class="track-badge-micro orbit">Orbit: ${orbit}</span>
              <span class="track-badge-micro spark">Spark: ${spark}</span>
            </div>
          </div>

          <!-- 4. Financial Budget (Blue) -->
          <div class="director-kpi-card kpi-blue">
            <div class="kpi-watermark">
              <svg width="95" height="95" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <div class="director-kpi-top">
              <div class="kpi-title-group">
                <span class="director-kpi-title">Financial Budget</span>
                <span class="kpi-micro-pill">FY 25-26</span>
              </div>
              <div class="director-kpi-icon">₹</div>
            </div>
            <div class="director-kpi-value">₹${(budget / 1000).toFixed(0)}k</div>
            
            <div class="kpi-meter-container">
              <div class="kpi-meter-bar">
                <div class="kpi-meter-fill" style="width: ${spentPct}%"></div>
              </div>
              <div class="kpi-meter-legend">
                <span>${spentPct}% Utilized</span>
                <span>Rem: ₹${(remainingBudget / 1000).toFixed(0)}k</span>
              </div>
            </div>

            <div class="director-kpi-subtext kpi-dual-chips">
              <span class="kpi-chip">Spent: <strong>₹${(spent / 1000).toFixed(0)}k</strong></span>
              <span class="kpi-chip">Disbursed: <strong>₹${(disbursed / 1000).toFixed(0)}k</strong></span>
            </div>
          </div>
        </div>
        `;
      })()}

      <!-- Quick Action proposals & health -->
      ${(() => {
        const activePendingList = stats.pendingProposalsList || pendingProposals;
        return `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1.25rem;">
          <div class="director-panel">
            <div class="director-panel-header">
              <h2>⚡ Proposals Needing Action (${activePendingList.length})</h2>
              <button class="btn-director btn-director-outline btn-goto-projects">Manage Proposals</button>
            </div>
            ${activePendingList.length === 0 ? `
              <p style="color:#6b7280; font-size:0.875rem; margin:0;">All project proposals are reviewed!</p>
            ` : `
              <div style="display:flex; flex-direction:column; gap:0.75rem;">
                ${activePendingList.map(p => `
                  <div style="display:flex; justify-content:space-between; align-items:center; padding:0.75rem; background:#f9fafb; border-radius:8px; border:1px solid #e5e7eb;">
                    <div>
                      <strong>${p.title}</strong><br>
                      <small style="color:#6b7280">${p.clientName || p.client_name || 'Internal Department'} • ₹${Number(p.estimatedBudget || p.budget || 0).toLocaleString('en-IN')}</small>
                    </div>
                    <button class="btn-director btn-director-primary btn-open-proposal-modal" data-id="${p.id}">
                      Review
                    </button>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        `;
      })()}

        <div class="director-panel">
          <div class="director-panel-header">
            <h2>📊 Active Project Health</h2>
          </div>
          <div class="director-table-responsive">
            <table class="director-table">
              <thead>
                <tr>
                  <th>Project Title</th>
                  <th>Faculty Lead</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                ${((stats.activeProjectHealth && stats.activeProjectHealth.length > 0) ? stats.activeProjectHealth : projects.slice(0, 3)).map(p => `
                  <tr>
                    <td><strong>${p.title}</strong></td>
                    <td>${p.facultyName || p.faculty_name || 'Faculty Member'}</td>
                    <td>
                      <div class="director-progress-bar-bg">
                        <div class="director-progress-bar-fill" style="width: ${p.progress ?? 0}%"></div>
                      </div>
                      <strong>${p.progress ?? 0}%</strong>
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
        const id = String(e.target.getAttribute('data-id'));
        const proposalList = stats.pendingProposalsList || DirectorService.getProposals();
        const proposal = proposalList.find(p => String(p.id) === id);
        if (proposal) showProposalModal(proposal, faculties);
      });
    });
  }

  function showFacultyProjectsPopup(parentHost, faculty) {
    const projectsList = faculty.activeProjects || [];
    const popupOverlay = document.createElement('div');
    popupOverlay.className = 'director-modal-overlay';
    popupOverlay.style.zIndex = '1050';
    popupOverlay.innerHTML = `
      <div class="director-modal" style="max-width: 440px; border-top: 4px solid #10b981;">
        <div class="director-modal-header">
          <h3 style="margin:0; font-size:1.1rem; color:#111827;">Active Projects — ${faculty.name}</h3>
          <button class="btn-director btn-director-outline btn-close-popup">✕</button>
        </div>
        <div class="director-modal-body" style="max-height:280px; overflow-y:auto; margin-bottom:1rem;">
          <div style="font-size:0.8rem; color:#6b7280; margin-bottom:0.75rem;">
            Email: <strong>${faculty.email || 'faculty@rajagiri.edu'}</strong> | Department: <strong>${faculty.department || 'Computer Applications'}</strong>
          </div>
          ${projectsList.length === 0 ? `
            <div style="text-align:center; padding:1.5rem; color:#9ca3af; background:#f9fafb; border-radius:8px;">
              No active projects currently assigned to this faculty member.
            </div>
          ` : `
            <div style="display:flex; flex-direction:column; gap:0.6rem;">
              ${projectsList.map((p, idx) => `
                <div style="padding:0.65rem 0.85rem; background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px;">
                  <div style="font-weight:700; color:#111827; font-size:0.875rem;">${idx + 1}. ${p.title}</div>
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.25rem;">
                    <span style="font-size:0.75rem; color:#6b7280;">Type: ${p.type || 'Web Application'}</span>
                    <span class="status-badge ${p.status === 'completed' ? 'completed' : 'in_progress'}" style="font-size:0.65rem; padding:1px 6px;">
                      ${(p.status || 'in_progress').replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
        <div class="director-modal-footer">
          <button class="btn-director btn-director-primary btn-close-popup">Close</button>
        </div>
      </div>
    `;

    popupOverlay.querySelectorAll('.btn-close-popup').forEach(b => b.addEventListener('click', () => popupOverlay.remove()));
    parentHost.appendChild(popupOverlay);
  }

  function showProposalModal(proposal, faculties) {
    const modalHost = container.querySelector('#director-modal-root');
    const defaultFacId = proposal.suggestedFaculty || (faculties[0] ? faculties[0].id : '');
    modalHost.innerHTML = `
      <div class="director-modal-overlay">
        <div class="director-modal" style="max-width:540px;">
          <div class="director-modal-header">
            <h3>Review Proposal: ${proposal.title}</h3>
            <button class="btn-director btn-director-outline btn-close-modal">✕</button>
          </div>
          <div class="director-modal-body">
            <p style="margin-bottom:0.5rem;"><strong>Description:</strong> ${proposal.description}</p>
            <p style="margin-bottom:1rem;"><strong>Client:</strong> ${proposal.clientName} | <strong>Est. Budget:</strong> ₹${proposal.estimatedBudget.toLocaleString()}</p>
            
            <label style="font-weight:600; font-size:0.875rem; margin-bottom:0.35rem; display:block;">Assign Lead Faculty:</label>
            <div class="faculty-selection-list" style="display:flex; flex-direction:column; gap:0.5rem; max-height:220px; overflow-y:auto; padding:0.25rem; border:1px solid #d1d5db; border-radius:8px; background:#f9fafb;">
              ${faculties.map(f => {
                const projectsList = f.activeProjects || [];
                const count = f.activeProjectsCount !== undefined ? f.activeProjectsCount : projectsList.length;
                const isSelected = String(f.id) === String(defaultFacId);
                return `
                  <div style="display:flex; justify-content:space-between; align-items:center; padding:0.6rem 0.75rem; background:#ffffff; border:1px solid ${isSelected ? '#10b981' : '#e5e7eb'}; border-radius:6px;">
                    <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer; flex:1; margin:0;">
                      <input type="radio" name="proposal_home_faculty_choice" value="${f.id}" ${isSelected ? 'checked' : ''} />
                      <div>
                        <div style="font-weight:600; color:#111827; font-size:0.85rem;">${f.name}</div>
                        <div style="font-size:0.75rem; color:#6b7280;">${f.department || 'Computer Applications'}</div>
                      </div>
                    </label>
                    <button type="button" class="btn-director btn-director-outline btn-view-faculty-projects" data-id="${f.id}" title="Click to view assigned project names" style="font-size:0.75rem; padding:0.25rem 0.6rem; color:#047857; border-color:#a7f3d0; background:#ecfdf5; border-radius:6px; cursor:pointer;">
                      📊 ${count} Active Project${count === 1 ? '' : 's'}
                    </button>
                  </div>
                `;
              }).join('')}
            </div>

            <label style="font-weight:600; font-size:0.875rem; margin-top:0.5rem; display:block;">Director Remarks:</label>
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
    modalHost.querySelectorAll('.btn-view-faculty-projects').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const facId = e.currentTarget.getAttribute('data-id');
        const faculty = faculties.find(f => String(f.id) === String(facId));
        if (faculty) showFacultyProjectsPopup(modalHost, faculty);
      });
    });

    modalHost.querySelector('.btn-accept-prop').addEventListener('click', async () => {
      const selectedRadio = modalHost.querySelector('input[name="proposal_home_faculty_choice"]:checked');
      const facId = selectedRadio ? selectedRadio.value : (faculties[0] ? faculties[0].id : null);
      const notes = modalHost.querySelector('#modal-review-notes').value;
      await DirectorService.updateProposalStatusAsync(proposal.id, 'accepted', notes, facId);
      modalHost.innerHTML = '';
      await render();
    });
    modalHost.querySelector('.btn-reject-prop').addEventListener('click', async () => {
      const notes = modalHost.querySelector('#modal-review-notes').value;
      await DirectorService.updateProposalStatusAsync(proposal.id, 'rejected', notes);
      modalHost.innerHTML = '';
      await render();
    });
  }

  const cachedStats = DirectorService.getCachedOverview();
  if (cachedStats) {
    render(cachedStats);
  } else {
    renderLoading();
  }

  DirectorService.getOverviewAsync().then(liveStats => {
    if (liveStats) render(liveStats);
  });
  return container;
}

export default DirectorHome;

