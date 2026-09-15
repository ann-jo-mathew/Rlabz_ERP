import { DirectorService } from '../services/DirectorService.js';
import { getChart } from '@/core/utils/chartLoader.js';

export function DirectorHome(route, router) {
  const container = document.createElement('div');
  container.className = 'director-dashboard';

  let chartInstances = {};

  function destroyCharts() {
    Object.values(chartInstances).forEach(c => {
      if (c && typeof c.destroy === 'function') {
        try { c.destroy(); } catch (e) {}
      }
    });
    chartInstances = {};
  }

  function formatMoney(amount) {
    if (amount === undefined || amount === null || isNaN(Number(amount))) return '0';
    const num = Number(amount);
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(1)}L`;
    }
    if (num >= 1000) {
      return `₹${(num / 1000).toFixed(0)}k`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
  }

  function renderLoading() {
    destroyCharts();
    container.innerHTML = `
      <div style="padding: 3.5rem; text-align: center; color: #6b7280; background: white; border-radius: 14px; border: 1px solid #e5e7eb; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        <div style="display:inline-block; width: 36px; height: 36px; border: 3px solid #e5e7eb; border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 0.85rem;"></div>
        <p style="margin: 0; font-weight: 600; font-size: 1rem; color: #111827;">Synchronizing Live Executive Analytics...</p>
        <small style="color: #9ca3af; display:block; margin-top: 0.25rem;">Fetching real-time project metrics, student talent rosters & financial balances</small>
      </div>
    `;
  }

  function render(stats = DirectorService.getOverview()) {
    destroyCharts();
    stats = stats || DirectorService.getOverview() || {};
    const studentCounts = stats.studentCounts || { nova: 0, orbit: 0, spark: 0, total: 0 };
    const proposals = Array.isArray(DirectorService.getProposals()) ? DirectorService.getProposals() : [];
    const pendingProposals = proposals.filter(p => p.status === 'pending' || p.status === 'proposed');
    const projects = Array.isArray(DirectorService.getProjects()) ? DirectorService.getProjects() : [];
    const auditLogs = (Array.isArray(DirectorService.getAuditLogs()) ? DirectorService.getAuditLogs() : []).slice(0, 5);
    const faculties = Array.isArray(DirectorService.getFaculties()) ? DirectorService.getFaculties() : [];

    // KPI Metrics calculation
    const activeProjects = stats.activeProjects || projects.filter(p => p.status === 'in_progress' || p.status === 'accepted' || p.status === 'active').length || 0;
    const totalProjects = stats.totalProjects || projects.length || 0;
    const remainingProjects = Math.max(0, totalProjects - activeProjects);
    const projectPercent = totalProjects > 0 ? Math.min(100, Math.round((activeProjects / totalProjects) * 100)) : 0;

    const pendingCount = stats.pendingProposals !== undefined ? stats.pendingProposals : pendingProposals.length;

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

    const activeFaculties = faculties.filter(f => (f.activeProjectsCount || (f.activeProjects && f.activeProjects.length) || 0) > 0).length;
    const totalFacultyCount = faculties.length || stats.facultyCount || 1;
    const facultyLoadPct = Math.min(100, Math.round((activeFaculties / totalFacultyCount) * 100));

    container.innerHTML = `
      <!-- Top Executive 5-KPI Strip -->
      <div class="director-kpi-grid">
        <!-- 1. Active Projects -->
        <div class="director-kpi-card kpi-sidebar-primary" id="kpi-card-projects" role="button" tabindex="0" title="Click to view Active Projects">
          <div class="director-kpi-top">
            <span class="director-kpi-title">Active Projects</span>
            <div class="director-kpi-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            </div>
          </div>
          <div class="director-kpi-value">${activeProjects} <span class="kpi-value-denominator">/ ${totalProjects}</span></div>
          <div class="kpi-meter-container">
            <div class="kpi-meter-bar">
              <div class="kpi-meter-fill" style="width: ${projectPercent}%"></div>
            </div>
            <div class="kpi-meter-legend">
              <span>${projectPercent}% Load Capacity</span>
              <span>${remainingProjects} Inactive</span>
            </div>
          </div>
        </div>

        <!-- 2. Pending Proposals -->
        <div class="director-kpi-card kpi-teal" id="kpi-card-proposals" role="button" tabindex="0" title="Click to view Project Proposals">
          <div class="director-kpi-top">
            <span class="director-kpi-title">Pending Proposals</span>
            <div class="director-kpi-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 16 14"></polyline></svg>
            </div>
          </div>
          <div class="director-kpi-value">${pendingCount}</div>
          <div class="kpi-callout-box">
            ${pendingCount > 0 ? `<span>⚠️ ${pendingCount} Proposal${pendingCount === 1 ? '' : 's'} Awaiting Approval</span>` : `<span>✓ All proposals reviewed</span>`}
          </div>
        </div>

        <!-- 3. Student Talent Pool -->
        <div class="director-kpi-card kpi-indigo" id="kpi-card-students" role="button" tabindex="0" title="Click to view Student Track Roster">
          <div class="director-kpi-top">
            <span class="director-kpi-title">Student Talent Pool</span>
            <div class="director-kpi-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
          </div>
          <div class="director-kpi-value">${totalStudents} <span class="kpi-value-denominator">Scholars</span></div>
          <div class="kpi-meter-container">
            <div class="kpi-segmented-bar" title="Nova: ${nova}, Orbit: ${orbit}, Spark: ${spark}">
              <div class="kpi-segment nova" style="width: ${novaPct}%;"></div>
              <div class="kpi-segment orbit" style="width: ${orbitPct}%;"></div>
              <div class="kpi-segment spark" style="width: ${sparkPct}%;"></div>
            </div>
          </div>
          <div class="director-kpi-subtext kpi-track-row">
            <span class="track-badge-micro nova">Nova: ${nova}</span>
            <span class="track-badge-micro orbit">Orbit: ${orbit}</span>
            <span class="track-badge-micro spark">Spark: ${spark}</span>
          </div>
        </div>

        <!-- 4. Capital & Financial Budget -->
        <div class="director-kpi-card kpi-amber" id="kpi-card-finance" role="button" tabindex="0" title="Click to view Financial Budget & Payroll">
          <div class="director-kpi-top">
            <span class="director-kpi-title">Sanctioned Capital</span>
            <div class="director-kpi-icon">₹</div>
          </div>
          <div class="director-kpi-value">${formatMoney(budget)}</div>
          <div class="kpi-meter-container">
            <div class="kpi-meter-bar">
              <div class="kpi-meter-fill" style="width: ${spentPct}%"></div>
            </div>
            <div class="kpi-meter-legend">
              <span>${spentPct}% Utilized</span>
              <span>Rem: ${formatMoney(remainingBudget)}</span>
            </div>
          </div>
          <div class="director-kpi-subtext kpi-dual-chips">
            <span class="kpi-chip">Spent: <strong>${formatMoney(spent)}</strong></span>
            <span class="kpi-chip">Stipends: <strong>${formatMoney(disbursed)}</strong></span>
          </div>
        </div>

        <!-- 5. Faculty Leadership Load -->
        <div class="director-kpi-card kpi-crimson" id="kpi-card-faculty" role="button" tabindex="0" title="Click to view Faculty Leadership & Mentorship">
          <div class="director-kpi-top">
            <span class="director-kpi-title">Faculty Mentorship</span>
            <div class="director-kpi-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
          </div>
          <div class="director-kpi-value">${activeFaculties} <span class="kpi-value-denominator">/ ${totalFacultyCount} Mentors</span></div>
          <div class="kpi-meter-container">
            <div class="kpi-meter-bar">
              <div class="kpi-meter-fill" style="width: ${facultyLoadPct}%"></div>
            </div>
            <div class="kpi-meter-legend">
              <span>Project Leadership</span>
              <span>${totalFacultyCount - activeFaculties} Available</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════ -->
      <!-- MULTI-TYPE VISUALIZATIONS & GRAPH ANALYTICS (4 CHARTS) -->
      <!-- ══════════════════════════════════════════════════════ -->
      <div class="director-charts-grid">
        <!-- Chart 1: Doughnut Chart (Talent Distribution) -->
        <div class="director-chart-card">
          <div class="director-chart-header">
            <div class="director-chart-title-group">
              <h3>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7e22ce" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 0 1 10 10h-10z"></path></svg>
                Talent Pool & Capability Tracks
              </h3>
              <div class="director-chart-subtitle">Distribution of scholars across leadership & developer tiers</div>
            </div>
            <span class="director-chart-badge purple">Doughnut Analysis</span>
          </div>

          <div class="director-chart-canvas-wrap">
            <canvas id="chart-student-distribution"></canvas>
            <div class="director-donut-center-metric" style="cursor: pointer;" title="Click to view all scholars">
              <div class="center-value">${totalStudents}</div>
              <div class="center-label">Scholars</div>
            </div>
          </div>

          <div class="director-chart-legend">
            <div class="chart-legend-item" style="cursor: pointer;" data-track="Nova" title="Click to view Nova Lead students">
              <span class="chart-legend-dot" style="background:#8b5cf6;"></span>
              <span>Nova Leads:</span>
              <span class="chart-legend-val">${nova} (${novaPct}%)</span>
            </div>
            <div class="chart-legend-item" style="cursor: pointer;" data-track="Orbit" title="Click to view Orbit Dev students">
              <span class="chart-legend-dot" style="background:#0284c7;"></span>
              <span>Orbit Devs:</span>
              <span class="chart-legend-val">${orbit} (${orbitPct}%)</span>
            </div>
            <div class="chart-legend-item" style="cursor: pointer;" data-track="Spark" title="Click to view Spark Learner students">
              <span class="chart-legend-dot" style="background:var(--primary-accent);"></span>
              <span>Spark Learners:</span>
              <span class="chart-legend-val">${spark} (${sparkPct}%)</span>
            </div>
          </div>
        </div>

        <!-- Chart 2: Grouped Bar Chart (Budget vs Actual Spend) -->
        <div class="director-chart-card">
          <div class="director-chart-header">
            <div class="director-chart-title-group">
              <h3>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                Capital Allocation: Budget vs Actual Spend
              </h3>
              <div class="director-chart-subtitle">Comparison of sanctioned budgets against incurred expenditures</div>
            </div>
            <span class="director-chart-badge emerald">Dual Bar Analysis</span>
          </div>

          <div class="director-chart-canvas-wrap">
            <canvas id="chart-budget-spend"></canvas>
          </div>

          <div class="director-chart-legend">
            <div class="chart-legend-item">
              <span class="chart-legend-dot" style="background:var(--primary-accent);"></span>
              <span>Sanctioned Budget</span>
            </div>
            <div class="chart-legend-item">
              <span class="chart-legend-dot" style="background:#6366f1;"></span>
              <span>Actual Expenditure</span>
            </div>
            <div class="chart-legend-item">
              <span style="color:#6b7280; font-weight:500;">Burn Rate:</span>
              <span class="chart-legend-val" style="color:var(--primary);">${spentPct}%</span>
            </div>
          </div>
        </div>

        <!-- Chart 3: Smooth Spline Area Chart (Velocity Trajectory) -->
        <div class="director-chart-card">
          <div class="director-chart-header">
            <div class="director-chart-title-group">
              <h3>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                Milestone Delivery & Department Velocity
              </h3>
              <div class="director-chart-subtitle">Trajectory of completed deliverables and proposal throughput</div>
            </div>
            <span class="director-chart-badge blue">Spline Velocity</span>
          </div>

          <div class="director-chart-canvas-wrap">
            <canvas id="chart-delivery-velocity"></canvas>
          </div>

          <div class="director-chart-legend">
            <div class="chart-legend-item">
              <span class="chart-legend-dot" style="background:#3b82f6;"></span>
              <span>Milestones Completed</span>
            </div>
            <div class="chart-legend-item">
              <span class="chart-legend-dot" style="background:var(--primary-accent);"></span>
              <span>Task Throughput</span>
            </div>
            <div class="chart-legend-item">
              <span class="chart-legend-dot" style="background:#f59e0b;"></span>
              <span>Proposals Pipeline</span>
            </div>
          </div>
        </div>

        <!-- Chart 4: Polar Area / Radar Chart (Portfolio Status Matrix) -->
        <div class="director-chart-card">
          <div class="director-chart-header">
            <div class="director-chart-title-group">
              <h3>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                Portfolio Status & Lifecycle Health
              </h3>
              <div class="director-chart-subtitle">Multidimensional status distribution across active and pipeline initiatives</div>
            </div>
            <span class="director-chart-badge amber">Polar Matrix</span>
          </div>

          <div class="director-chart-canvas-wrap">
            <canvas id="chart-portfolio-polar"></canvas>
          </div>

          <div class="director-chart-legend">
            <div class="chart-legend-item">
              <span class="chart-legend-dot" style="background:var(--primary-accent);"></span>
              <span>In Progress (${activeProjects})</span>
            </div>
            <div class="chart-legend-item">
              <span class="chart-legend-dot" style="background:#f59e0b;"></span>
              <span>Proposed (${pendingCount})</span>
            </div>
            <div class="chart-legend-item">
              <span class="chart-legend-dot" style="background:#3b82f6;"></span>
              <span>Completed (${remainingProjects})</span>
            </div>
            <div class="chart-legend-item">
              <span class="chart-legend-dot" style="background:#8b5cf6;"></span>
              <span>High Priority</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════ -->
      <!-- DETAIL SECTION 1: FACULTY LEADERSHIP & PROJECT HEALTH -->
      <!-- ══════════════════════════════════════════════════════ -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.25rem;">
        <!-- Faculty Leadership & Mentorship Load -->
        <div class="director-panel" id="director-faculty-section">
          <div class="director-panel-header">
            <h2>👥 Faculty Leadership & Project Assignments (${faculties.length})</h2>
            <span style="font-size:0.8rem; color:#6b7280;">Click to inspect active projects</span>
          </div>
          <div class="faculty-load-list">
            ${faculties.slice(0, 6).map(f => {
              const count = f.activeProjectsCount !== undefined ? f.activeProjectsCount : (f.activeProjects ? f.activeProjects.length : 0);
              const maxCap = 4;
              const loadPct = Math.min(100, Math.round((count / maxCap) * 100));
              const loadBadge = count === 0 ? 'Available' : (count >= 3 ? 'Heavy Load' : 'Active Lead');
              const badgeClass = count === 0 ? 'spark' : (count >= 3 ? 'nova' : 'orbit');

              return `
                <div class="faculty-load-card btn-view-faculty-card" data-id="${f.id}" style="cursor:pointer;">
                  <div class="faculty-load-header">
                    <div class="faculty-name-role">
                      <strong>${f.name}</strong>
                      <small>${f.department || 'Computer Applications'}</small>
                    </div>
                    <span class="track-badge-micro ${badgeClass}">${loadBadge} (${count})</span>
                  </div>
                  <div class="faculty-load-meter">
                    <div class="faculty-meter-bar">
                      <div class="faculty-meter-fill" style="width: ${loadPct}%; background:${count >= 3 ? '#e11d48' : 'var(--primary-accent)'};"></div>
                    </div>
                    <span style="font-size:0.75rem; font-weight:700; color:#4b5563;">${count} Proj</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Active Project Health & Progress -->
        <div class="director-panel">
          <div class="director-panel-header">
            <h2>📊 Active Project Execution Health</h2>
            <button class="btn-director btn-director-outline btn-goto-projects">View All (${totalProjects})</button>
          </div>
          <div class="director-table-responsive">
            <table class="director-table">
              <thead>
                <tr>
                  <th>Project Title</th>
                  <th>Faculty Lead</th>
                  <th>Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${((stats.activeProjectHealth && stats.activeProjectHealth.length > 0) ? stats.activeProjectHealth : projects.slice(0, 4)).map(p => `
                  <tr>
                    <td>
                      <strong>${p.title || 'Institutional Project'}</strong>
                      <div style="font-size:0.75rem; color:#6b7280;">ID: ${p.id}</div>
                    </td>
                    <td>${p.facultyName || p.faculty_name || 'Faculty Mentor'}</td>
                    <td>
                      <div class="director-progress-bar-bg">
                        <div class="director-progress-bar-fill" style="width: ${p.progress ?? 0}%"></div>
                      </div>
                      <strong>${p.progress ?? 0}%</strong>
                    </td>
                    <td>
                      <span class="status-badge ${(p.status === 'completed' || p.progress === 100) ? 'completed' : 'in_progress'}">
                        ${(p.status || 'in_progress').replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════ -->
      <!-- DETAIL SECTION 2: PROPOSALS QUEUE & AUDIT TIMELINE -->
      <!-- ══════════════════════════════════════════════════════ -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.25rem;">
        <!-- Proposals Needing Action -->
        <div class="director-panel">
          <div class="director-panel-header">
            <h2>⚡ Proposals Requiring Director Decision (${pendingProposals.length})</h2>
            <button class="btn-director btn-director-outline btn-goto-projects">Manage All</button>
          </div>
          ${pendingProposals.length === 0 ? `
            <div style="text-align:center; padding:2rem; color:#6b7280; background:#f9fafb; border-radius:10px; border:1px dashed #d1d5db;">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--primary-accent)" stroke-width="2" style="margin-bottom:0.5rem;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              <p style="margin:0; font-weight:700; color:#111827;">All Project Proposals Clear!</p>
              <small>No pending submissions requiring Director evaluation at this time.</small>
            </div>
          ` : `
            <div style="display:flex; flex-direction:column; gap:0.75rem;">
              ${pendingProposals.slice(0, 4).map(p => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:0.85rem 1rem; background:var(--surface-card); border-radius:10px; border:1px solid #e5e7eb; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
                  <div>
                    <strong style="color:#111827; font-size:0.92rem;">${p.title}</strong>
                    <div style="color:#6b7280; font-size:0.8rem; margin-top:3px;">
                      ${p.clientName || p.client_name || 'Internal Sponsor'} • <strong>₹${Number(p.estimatedBudget || p.budget || 0).toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                  <button class="btn-director btn-director-primary btn-open-proposal-modal" data-id="${p.id}" style="padding:0.4rem 0.9rem; font-size:0.825rem;">
                    Review & Assign
                  </button>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Recent Administrative Audit Activity -->
        <div class="director-panel">
          <div class="director-panel-header">
            <h2>🛡️ System Governance & Audit Activity</h2>
            <button class="btn-director btn-director-outline btn-goto-audit">Full Trail</button>
          </div>
          <div class="audit-timeline">
            ${auditLogs.map(log => {
              const isWarning = log.type === 'warning' || (log.event && log.event.toLowerCase().includes('reject'));
              const isSuccess = log.type === 'success' || (log.event && (log.event.toLowerCase().includes('accept') || log.event.toLowerCase().includes('assign')));
              const iconClass = isWarning ? 'warning' : (isSuccess ? 'success' : 'info');
              const iconSvg = isWarning 
                ? '⚠️' 
                : (isSuccess ? '✓' : 'ℹ️');

              return `
                <div class="audit-timeline-item">
                  <div class="audit-timeline-icon ${iconClass}">
                    ${iconSvg}
                  </div>
                  <div class="audit-timeline-content">
                    <div class="audit-timeline-title">
                      <span>${log.event}</span>
                      <span class="audit-timeline-time">${log.timestamp}</span>
                    </div>
                    <div class="audit-timeline-desc">${log.details || log.user}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Modal Root Container -->
      <div id="director-modal-root"></div>
    `;

    // ══════════════════════════════════════════════════════
    // INITIALIZE ALL 4 CHART INSTANCES WITH CHART.JS
    // ══════════════════════════════════════════════════════
    initAllCharts({
      studentCounts,
      projects,
      budget,
      spent,
      pendingCount,
      activeProjects,
      remainingProjects,
      deliveryVelocity: stats.deliveryVelocity || null
    });

    // ══════════════════════════════════════════════════════
    // ATTACH DOM EVENT LISTENERS
    // ══════════════════════════════════════════════════════
    container.querySelector('.btn-goto-projects')?.addEventListener('click', () => {
      if (router) router.push('/dashboard/projects');
      else window.location.href = '/dashboard/projects';
    });
    container.querySelector('.btn-goto-audit')?.addEventListener('click', () => {
      if (router) router.push('/dashboard/audit');
      else window.location.href = '/dashboard/audit';
    });

    // ── TOP 5 EXECUTIVE KPI CARDS CLICK & KEYBOARD NAVIGATION ──
    // 1. Active Projects -> /dashboard/projects?tab=active
    const kpiProjects = container.querySelector('#kpi-card-projects');
    const navigateToActiveProjects = () => {
      if (router) router.push('/dashboard/projects?tab=active');
      else window.location.href = '/dashboard/projects?tab=active';
    };
    kpiProjects?.addEventListener('click', navigateToActiveProjects);
    kpiProjects?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigateToActiveProjects();
      }
    });

    // 2. Pending Proposals -> /dashboard/projects?tab=proposals
    const kpiProposals = container.querySelector('#kpi-card-proposals');
    const navigateToProposals = () => {
      if (router) router.push('/dashboard/projects?tab=proposals');
      else window.location.href = '/dashboard/projects?tab=proposals';
    };
    kpiProposals?.addEventListener('click', navigateToProposals);
    kpiProposals?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigateToProposals();
      }
    });

    // 3. Student Talent Pool -> /dashboard/students
    const kpiStudents = container.querySelector('#kpi-card-students');
    const navigateToStudents = (e) => {
      if (e && e.target && e.target.closest('.track-badge-micro')) return;
      if (router) router.push('/dashboard/students');
      else window.location.href = '/dashboard/students';
    };
    kpiStudents?.addEventListener('click', navigateToStudents);
    kpiStudents?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigateToStudents();
      }
    });

    // 4. Sanctioned Capital -> /dashboard/finance
    const kpiFinance = container.querySelector('#kpi-card-finance');
    const navigateToFinance = () => {
      if (router) router.push('/dashboard/finance');
      else window.location.href = '/dashboard/finance';
    };
    kpiFinance?.addEventListener('click', navigateToFinance);
    kpiFinance?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigateToFinance();
      }
    });

    // 5. Faculty Mentorship -> Smooth scroll to Faculty Leadership section with pulse animation
    const kpiFaculty = container.querySelector('#kpi-card-faculty');
    const navigateToFaculty = () => {
      const facSection = container.querySelector('#director-faculty-section');
      if (facSection) {
        facSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        facSection.classList.remove('panel-highlight-pulse');
        // Force reflow for restart if clicked repeatedly
        void facSection.offsetWidth;
        facSection.classList.add('panel-highlight-pulse');
        setTimeout(() => {
          facSection.classList.remove('panel-highlight-pulse');
        }, 2300);
      }
    };
    kpiFaculty?.addEventListener('click', navigateToFaculty);
    kpiFaculty?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigateToFaculty();
      }
    });

    // Faculty Card click popup
    container.querySelectorAll('.btn-view-faculty-card').forEach(card => {
      card.addEventListener('click', () => {
        const facId = card.getAttribute('data-id');
        const faculty = faculties.find(f => String(f.id) === String(facId));
        if (faculty) showFacultyProjectsPopup(container.querySelector('#director-modal-root'), faculty);
      });
    });

    // Proposal review buttons
    container.querySelectorAll('.btn-open-proposal-modal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = String(e.target.getAttribute('data-id'));
        const proposalList = stats.pendingProposalsList || DirectorService.getProposals();
        const proposal = proposalList.find(p => String(p.id) === id);
        if (proposal) showProposalModal(proposal, faculties);
      });
    });

    // Doughnut chart legend items click navigation
    container.querySelectorAll('.chart-legend-item').forEach(item => {
      item.addEventListener('click', () => {
        const track = item.getAttribute('data-track');
        if (track) {
          if (router) router.push(`/dashboard/students?track=${track}`);
          else window.location.href = `/dashboard/students?track=${track}`;
        }
      });
    });

    // Doughnut chart center metric click navigation
    container.querySelector('.director-donut-center-metric')?.addEventListener('click', () => {
      if (router) router.push('/dashboard/students');
      else window.location.href = '/dashboard/students';
    });

    // KPI Card 3 track badges navigation
    container.querySelectorAll('.track-badge-micro').forEach(badge => {
      badge.style.cursor = 'pointer';
      badge.setAttribute('title', 'Click to view students in this track');
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        let track = 'All';
        if (badge.classList.contains('nova')) track = 'Nova';
        else if (badge.classList.contains('orbit')) track = 'Orbit';
        else if (badge.classList.contains('spark')) track = 'Spark';

        if (router) router.push(`/dashboard/students?track=${track}`);
        else window.location.href = `/dashboard/students?track=${track}`;
      });
    });
  }

  // ══════════════════════════════════════════════════════
  // CHART BUILDERS
  // ══════════════════════════════════════════════════════
  function initAllCharts(data) {
    const ChartClass = getChart();
    if (!ChartClass) return;

    const tooltipDefaults = {
      backgroundColor: '#0f172a',
      titleColor: '#f8fafc',
      bodyColor: '#cbd5e1',
      padding: 10,
      cornerRadius: 8,
      displayColors: true,
    };

    // 1. DOUGHNUT CHART: Student Talent Tracks
    const donutEl = container.querySelector('#chart-student-distribution');
    if (donutEl) {
      const nova = data.studentCounts.nova || 0;
      const orbit = data.studentCounts.orbit || 0;
      const spark = data.studentCounts.spark || 0;
      const total = data.studentCounts.total || (nova + orbit + spark) || 1;
      const trackKeys = ['Nova', 'Orbit', 'Spark'];

      chartInstances.studentDonut = new ChartClass(donutEl, {
        type: 'doughnut',
        data: {
          labels: ['Nova Leads', 'Orbit Developers', 'Spark Learners'],
          datasets: [{
            data: [nova || 1, orbit || 1, spark || 1],
            backgroundColor: ['#8b5cf6', '#0284c7', 'var(--primary-accent)'],
            borderColor: '#ffffff',
            borderWidth: 3,
            hoverOffset: 8,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '72%',
          onClick: (event, elements, chart) => {
            let activeEls = elements;
            if (!activeEls || activeEls.length === 0) {
              const chartInst = chart || chartInstances.studentDonut;
              if (chartInst && event && event.native) {
                activeEls = chartInst.getElementsAtEventForMode(event.native, 'nearest', { intersect: true }, false);
              }
            }
            if (activeEls && activeEls.length > 0) {
              const index = activeEls[0].index;
              const targetTrack = trackKeys[index] || 'All';
              if (router) {
                router.push(`/dashboard/students?track=${targetTrack}`);
              }
            }
          },
          onHover: (event, elements) => {
            if (event.native && event.native.target) {
              event.native.target.style.cursor = (elements && elements.length > 0) ? 'pointer' : 'default';
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              ...tooltipDefaults,
              callbacks: {
                label: ctx => {
                  const val = ctx.raw;
                  const pct = total > 0 ? ((val / total) * 100).toFixed(0) : 0;
                  return `  ${ctx.label}: ${val} Scholars (${pct}%) — Click to View`;
                }
              }
            }
          },
          animation: { animateRotate: true, duration: 350 }
        }
      });

      donutEl.style.cursor = 'pointer';
      donutEl.addEventListener('click', (e) => {
        if (chartInstances.studentDonut) {
          const activePoints = chartInstances.studentDonut.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false);
          if (activePoints && activePoints.length > 0) {
            const index = activePoints[0].index;
            const targetTrack = trackKeys[index] || 'All';
            if (router) {
              router.push(`/dashboard/students?track=${targetTrack}`);
            }
          }
        }
      });
    }

    // 2. GROUPED BAR CHART: Project Budget vs Actual Spent
    const barEl = container.querySelector('#chart-budget-spend');
    if (barEl) {
      const dbProjects = (data.projects && data.projects.length > 0)
        ? data.projects.slice(0, 5)
        : (Array.isArray(DirectorService.getProjects()) ? DirectorService.getProjects().slice(0, 5) : []);

      const labels = dbProjects.map(p => {
        const title = p.title || 'Project';
        return title.length > 14 ? title.slice(0, 14) + '…' : title;
      });
      const budgets = dbProjects.map(p => Number(p.budget || 0));
      const spents = dbProjects.map(p => Number(p.spent || 0));

      chartInstances.budgetBar = new ChartClass(barEl, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Sanctioned Budget',
              data: budgets,
              backgroundColor: 'var(--primary-accent)',
              borderRadius: 6,
              barPercentage: 0.6,
              categoryPercentage: 0.7
            },
            {
              label: 'Actual Spent',
              data: spents,
              backgroundColor: '#6366f1',
              borderRadius: 6,
              barPercentage: 0.6,
              categoryPercentage: 0.7
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              ...tooltipDefaults,
              callbacks: {
                label: ctx => `  ${ctx.dataset.label}: ₹${Number(ctx.raw).toLocaleString('en-IN')}`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#64748b', font: { size: 11, weight: 600 } }
            },
            y: {
              grid: { color: '#f1f5f9' },
              ticks: {
                color: '#64748b',
                font: { size: 11 },
                callback: val => `₹${(val / 1000).toFixed(0)}k`
              }
            }
          },
          animation: { duration: 350 }
        }
      });
    }

    // 3. SMOOTH SPLINE AREA CHART: Milestone Velocity Trajectory
    const lineEl = container.querySelector('#chart-delivery-velocity');
    if (lineEl) {
      const velocity = data.deliveryVelocity || {};
      const months = velocity.labels || ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
      const milestonesCompleted = velocity.milestones_completed || [0, 0, 0, 0, 0, 0];
      const taskThroughput = velocity.tasks_throughput || [0, 0, 0, 0, 0, 0];
      const proposalsIntake = velocity.proposals_intake || [0, 0, 0, 0, 0, 0];

      const ctx = lineEl.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 240);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.28)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.01)');

      chartInstances.velocityLine = new ChartClass(lineEl, {
        type: 'line',
        data: {
          labels: months,
          datasets: [
            {
              label: 'Tasks Throughput',
              data: taskThroughput,
              borderColor: '#3b82f6',
              backgroundColor: gradient,
              borderWidth: 2.5,
              tension: 0.38,
              fill: true,
              pointRadius: 4,
              pointHoverRadius: 6,
              pointBackgroundColor: '#3b82f6',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2
            },
            {
              label: 'Milestones Completed',
              data: milestonesCompleted,
              borderColor: 'var(--primary-accent)',
              backgroundColor: 'transparent',
              borderWidth: 2.5,
              borderDash: [5, 4],
              tension: 0.38,
              fill: false,
              pointRadius: 3,
              pointHoverRadius: 6,
              pointBackgroundColor: 'var(--primary-accent)'
            },
            {
              label: 'Proposals Received',
              data: proposalsIntake,
              borderColor: '#f59e0b',
              backgroundColor: 'transparent',
              borderWidth: 2,
              tension: 0.38,
              fill: false,
              pointRadius: 3,
              pointHoverRadius: 5,
              pointBackgroundColor: '#f59e0b'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              ...tooltipDefaults,
              callbacks: {
                label: ctx => `  ${ctx.dataset.label}: ${ctx.raw} units`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#64748b', font: { size: 11, weight: 600 } }
            },
            y: {
              grid: { color: '#f1f5f9' },
              ticks: { color: '#64748b', font: { size: 11 } }
            }
          },
          animation: { duration: 350 }
        }
      });
    }

    // 4. POLAR AREA CHART: Portfolio Status Matrix
    const polarEl = container.querySelector('#chart-portfolio-polar');
    if (polarEl) {
      const activeCount = data.activeProjects || 0;
      const proposedCount = data.pendingCount || 0;
      const completedCount = data.remainingProjects || 0;
      const highPriorityCount = Math.round(activeCount * 0.4);

      chartInstances.portfolioPolar = new ChartClass(polarEl, {
        type: 'polarArea',
        data: {
          labels: ['In Progress', 'Pending Proposed', 'Completed / Handover', 'High Priority Critical'],
          datasets: [{
            data: [activeCount, proposedCount, completedCount, highPriorityCount],
            backgroundColor: [
              'rgba(16, 185, 129, 0.75)',
              'rgba(245, 158, 11, 0.75)',
              'rgba(59, 130, 246, 0.75)',
              'rgba(139, 92, 246, 0.75)'
            ],
            borderColor: '#ffffff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              ...tooltipDefaults,
              callbacks: {
                label: ctx => `  ${ctx.label}: ${ctx.raw} Projects`
              }
            }
          },
          scales: {
            r: {
              grid: { color: '#f1f5f9' },
              ticks: { display: false }
            }
          },
          animation: { duration: 350 }
        }
      });
    }
  }

  // ══════════════════════════════════════════════════════
  // MODAL & POPUP HELPERS
  // ══════════════════════════════════════════════════════
  function showFacultyProjectsPopup(parentHost, faculty) {
    const projectsList = faculty.activeProjects || [];
    const popupOverlay = document.createElement('div');
    popupOverlay.className = 'director-modal-overlay';
    popupOverlay.style.zIndex = '1050';
    popupOverlay.innerHTML = `
      <div class="director-modal" style="max-width: 460px; border-top: 4px solid var(--primary-accent);">
        <div class="director-modal-header">
          <h3 style="margin:0; font-size:1.1rem; color:#111827;">Active Projects — ${faculty.name}</h3>
          <button class="btn-director btn-director-outline btn-close-popup">✕</button>
        </div>
        <div class="director-modal-body" style="max-height:280px; overflow-y:auto; margin-bottom:1rem;">
          <div style="font-size:0.8rem; color:#6b7280; margin-bottom:0.75rem;">
            Email: <strong>${faculty.email || 'faculty@rajagiri.edu'}</strong> | Department: <strong>${faculty.department || 'Computer Applications'}</strong>
          </div>
          ${projectsList.length === 0 ? `
            <div style="text-align:center; padding:1.75rem; color:#9ca3af; background:#f9fafb; border-radius:8px;">
              No active projects currently assigned to this faculty member. Available for new assignments.
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
            <p style="margin-bottom:0.5rem;"><strong>Description:</strong> ${proposal.description || 'Institutional proposal submission.'}</p>
            <p style="margin-bottom:1rem;"><strong>Client:</strong> ${proposal.clientName || 'Rajagiri Sponsor'} | <strong>Est. Budget:</strong> ₹${Number(proposal.estimatedBudget || 0).toLocaleString()}</p>
            
            <label style="font-weight:600; font-size:0.875rem; margin-bottom:0.35rem; display:block;">Assign Lead Faculty:</label>
            <div class="faculty-selection-list" style="display:flex; flex-direction:column; gap:0.5rem; max-height:220px; overflow-y:auto; padding:0.25rem; border:1px solid #d1d5db; border-radius:8px; background:#f9fafb;">
              ${faculties.map(f => {
                const projectsList = f.activeProjects || [];
                const count = f.activeProjectsCount !== undefined ? f.activeProjectsCount : projectsList.length;
                const isSelected = String(f.id) === String(defaultFacId);
                return `
                  <div style="display:flex; justify-content:space-between; align-items:center; padding:0.6rem 0.75rem; background:#ffffff; border:1px solid ${isSelected ? 'var(--primary-accent)' : '#e5e7eb'}; border-radius:6px;">
                    <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer; flex:1; margin:0;">
                      <input type="radio" name="proposal_home_faculty_choice" value="${f.id}" ${isSelected ? 'checked' : ''} />
                      <div>
                        <div style="font-weight:600; color:#111827; font-size:0.85rem;">${f.name}</div>
                        <div style="font-size:0.75rem; color:#6b7280;">${f.department || 'Computer Applications'}</div>
                      </div>
                    </label>
                    <button type="button" class="btn-director btn-director-outline btn-view-faculty-projects" data-id="${f.id}" title="Click to view assigned project names" style="font-size:0.75rem; padding:0.25rem 0.6rem; color:var(--primary-hover); border-color:var(--border-color); background:var(--primary-light); border-radius:6px; cursor:pointer;">
                      📊 ${count} Active Project${count === 1 ? '' : 's'}
                    </button>
                  </div>
                `;
              }).join('')}
            </div>

            <label style="font-weight:600; font-size:0.875rem; margin-top:0.5rem; display:block;">Director Remarks:</label>
            <textarea id="modal-review-notes" rows="2" placeholder="Optional review remarks and acceptance instructions..." style="padding:0.5rem; border-radius:6px; border:1px solid #d1d5db; font-family:inherit;"></textarea>
          </div>
          <div class="director-modal-footer">
            <button class="btn-director btn-director-danger btn-reject-prop">Reject Proposal</button>
            <button class="btn-director btn-director-success btn-accept-prop">Accept & Assign</button>
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

  // Initial render flow - Instant Zero-Latency Paint
  const initialStats = DirectorService.getCachedOverview() || DirectorService.getOverview();
  let lastSignature = '';

  function getStatsSignature(s) {
    if (!s) return '';
    const fin = s.finance || {};
    return [
      s.totalProjects,
      s.activeProjects,
      s.pendingProposals,
      s.facultyCount,
      s.studentCounts?.total,
      fin.totalBudget,
      fin.totalSpent
    ].join('|');
  }

  if (initialStats) {
    lastSignature = getStatsSignature(initialStats);
    render(initialStats);
  } else {
    renderLoading();
  }

  // Background silent revalidation (Stale-While-Revalidate)
  DirectorService.getOverviewAsync(true).then(liveStats => {
    if (liveStats) {
      const newSignature = getStatsSignature(liveStats);
      if (newSignature !== lastSignature) {
        lastSignature = newSignature;
        render(liveStats);
      }
    }
  });

  return container;
}

export default DirectorHome;
