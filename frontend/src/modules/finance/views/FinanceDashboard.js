import { financeService } from '../services/FinanceService.js';
import { updateFinanceSidebar } from '../layouts/FinanceLayout.js';
import '../finance.css';

// â”€â”€ Chart.js loader (Local if possible, otherwise we fallback to CDN for charts only, not PDFs. Wait, I should assume Chart is available globally from main app, or load it.)
// For this rewrite, we will load Chart.js via CDN as it's already how it was done, the user only complained about CDN for PDF.
// "The current implementation plan mentioned loading html2pdf.js through a CDN. Do NOT use a CDN for Finance PDF generation."
function loadChartJs() {
  return new Promise((resolve) => {
    if (window.Chart) return resolve(window.Chart);
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js';
    s.onload = () => resolve(window.Chart);
    document.head.appendChild(s);
  });
}

export async function FinanceDashboard(route, router) {
  const container = document.createElement('div');
  container.className = 'finance-module';

  // Highlight active sidebar link
  setTimeout(updateFinanceSidebar, 0);

  // Fetch from our centralized mock service
  const summary = await financeService.getDashboardSummary();
  const projects = await financeService.getProjectFinances();
  const invoices = await financeService.getInvoices();

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  const fmtDate = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // ── DYNAMIC ALERT CALCULATION LOGIC ─────────────────────────────
  const alerts = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // a & b) SSL Expiries and Domain Expiries (hosting_charges)
  (projects || []).forEach(p => {
    const pf = p.project_finance;
    if (!pf || !pf.hosting_charges) return;
    const projName = p.title || p.name || 'Unknown Project';

    pf.hosting_charges.forEach(hc => {
      if (!hc.expiry_date || !hc.charge_type) return;
      const type = hc.charge_type.toLowerCase();
      if (type !== 'ssl' && type !== 'domain') return;

      const targetDate = new Date(hc.expiry_date);
      targetDate.setHours(0, 0, 0, 0);
      const daysLeft = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));

      // Trigger if daysLeft <= 15 or overdue
      if (daysLeft <= 15) {
        const isOverdue = daysLeft < 0;
        const absDays = Math.abs(daysLeft);
        const dateStr = fmtDate(hc.expiry_date);

        if (type === 'ssl') {
          const message = isOverdue
            ? `SSL Certificate for project ${projName} expired ${absDays} ${absDays === 1 ? 'day' : 'days'} ago (${dateStr})`
            : `SSL Certificate for project ${projName} is expiring in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} (${dateStr})`;

          alerts.push({
            id: `ssl-${hc.id}`,
            category: 'SSL',
            type: 'ssl',
            projectId: p.id,
            projectName: projName,
            daysLeft,
            isOverdue,
            message,
            dateStr
          });
        } else if (type === 'domain') {
          const message = isOverdue
            ? `Domain Registration for project ${projName} expired ${absDays} ${absDays === 1 ? 'day' : 'days'} ago (${dateStr})`
            : `Domain Registration for project ${projName} is expiring in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} (${dateStr})`;

          alerts.push({
            id: `domain-${hc.id}`,
            category: 'DOMAIN',
            type: 'domain',
            projectId: p.id,
            projectName: projName,
            daysLeft,
            isOverdue,
            message,
            dateStr
          });
        }
      }
    });
  });

  // c) Incomplete Billing Alerts (invoices + client_payments)
  const invoiceList = (invoices && invoices.length > 0)
    ? invoices
    : (projects || []).flatMap(p => p.project_finance?.invoices || []);

  const processedInvIds = new Set();

  (invoiceList || []).forEach(inv => {
    if (!inv || !inv.id || processedInvIds.has(inv.id)) return;
    processedInvIds.add(inv.id);

    const amountBeforeGst = Number(inv.amount_before_gst || 0);
    const gstPct = Number(inv.gst_percentage || 0);
    const totalBilled = inv.grand_total !== undefined 
      ? Number(inv.grand_total) 
      : amountBeforeGst * (1 + gstPct / 100);

    const clientPayments = inv.client_payments || inv.clientPayments || [];
    const totalPaid = inv.total_paid !== undefined 
      ? Number(inv.total_paid) 
      : clientPayments.reduce((sum, cp) => sum + Number(cp.amount || 0), 0);

    const balanceDue = totalBilled - totalPaid;

    // EXCLUDE fully paid invoices where Balance Due <= 0
    if (Math.round(balanceDue) <= 0) return;

    if (!inv.due_date) return;

    const targetDate = new Date(inv.due_date);
    targetDate.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));

    // Trigger if daysLeft <= 7 or overdue
    if (daysLeft <= 7) {
      const isOverdue = daysLeft < 0;
      const absDays = Math.abs(daysLeft);
      const dateStr = fmtDate(inv.due_date);
      const formattedBalance = Number(balanceDue.toFixed(2)).toLocaleString('en-IN');

      let projName = 'Unknown Project';
      if (inv.project_finance?.project?.title) {
        projName = inv.project_finance.project.title;
      } else if (inv.project_finance?.project?.name) {
        projName = inv.project_finance.project.name;
      } else {
        const matchProj = (projects || []).find(p => p.project_finance?.id === inv.project_finance_id || p.id === inv.project_id);
        if (matchProj) projName = matchProj.title || matchProj.name;
      }

      const message = isOverdue
        ? `Incomplete bill of \u20B9${formattedBalance} Overdue by ${absDays} ${absDays === 1 ? 'day' : 'days'} for project ${projName} (Due: ${dateStr})`
        : `Incomplete bill of \u20B9${formattedBalance} due in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} for project ${projName} (Due: ${dateStr})`;

      alerts.push({
        id: `invoice-${inv.id}`,
        category: 'BILLING',
        type: 'billing',
        projectId: inv.project_finance?.project_id || inv.project_id,
        projectName: projName,
        daysLeft,
        isOverdue,
        message,
        balanceDue,
        dateStr
      });
    }
  });

  // Sort alerts by urgency: lowest daysLeft first (most urgent / overdue items first)
  alerts.sort((a, b) => a.daysLeft - b.daysLeft);

  // Build Native Notification Drawer HTML
  let drawerHtml = `
    <!-- Floating Bell -->
    <button class="fin-bell-trigger ${alerts.length > 0 ? 'fin-bell-shake' : ''}" id="fin-bell-btn" title="View Action Items">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
      ${alerts.length > 0 ? `<span class="fin-bell-badge">${alerts.length}</span>` : ''}
    </button>

    <!-- Drawer Backdrop -->
    <div class="fin-drawer-backdrop" id="fin-drawer-backdrop"></div>

    <!-- Notification Drawer -->
    <div class="fin-notification-drawer" id="fin-notification-drawer">
      <div class="fin-drawer-header">
        <div class="fin-drawer-title-wrap">
          <span class="fin-drawer-title">Action Items</span>
          ${alerts.length > 0 ? `<span class="fin-drawer-count">${alerts.length}</span>` : ''}
        </div>
        <button class="fin-drawer-close" id="fin-drawer-close" title="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="fin-drawer-body">
        ${alerts.length > 0 
          ? alerts.map(a => `
            <div class="fin-action-card ${a.daysLeft <= 0 ? 'card-overdue' : 'card-upcoming'}">
              <div class="fin-card-header-row">
                <span class="fin-cat-badge fin-cat-${a.type}">${a.category}</span>
                <span class="fin-countdown-tag ${a.daysLeft <= 0 ? 'tag-red' : 'tag-amber'}">
                  ${a.daysLeft < 0 ? `${Math.abs(a.daysLeft)}d Overdue` : (a.daysLeft === 0 ? 'Due Today' : `${a.daysLeft}d Remaining`)}
                </span>
              </div>
              <div class="fin-card-msg">${a.message}</div>
              <div class="fin-card-meta">
                <span class="fin-project-name">Project: ${a.projectName}</span>
              </div>
            </div>
          `).join('')
          : `<div style="text-align:center; padding: 2rem; color: var(--text-muted); font-size: 0.9rem;">No pending action items.</div>`
        }
      </div>
    </div>
  `;

  const recvPct = summary.totalBilling > 0
    ? Math.round((summary.totalCollected / summary.totalBilling) * 100)
    : 0;

  // Build project rows (Top 3 for dashboard)
  const projectRows = (projects || []).slice(0, 3).map(p => {
    const pf = p.project_finance || {};
    const totalBilling = pf.total_invoiced || 0;
    const collected = pf.total_collected || 0;
    const estCost = p.budget || pf.total_development_amount || 0;
    const pct = estCost > 0 ? Math.min(100, Math.round((collected / estCost) * 100)) : 0;

    return `
      <tr>
        <td>
          <div style="font-weight:600">${p.title || p.name}</div>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px">PROJ-${p.id}</div>
        </td>
        <td><span class="fin-badge ${p.status === 'completed' || p.status === 'closed' ? 'success' : 'info'}">${p.status || 'Active'}</span></td>
        <td>${fmt(p.budget || 0)}</td>
        <td style="font-weight:700">${fmt(totalBilling)}</td>
        <td>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:3px">${pct}% collected</div>
          <div class="fin-progress-bg" style="width:120px">
            <div class="fin-progress-fill" style="width:${pct}%"></div>
          </div>
        </td>
        <td>
          <button class="fin-btn outline sm view-proj-btn" data-id="${p.id}">View Details</button>
        </td>
      </tr>`;
  }).join('');

  container.innerHTML = `
    <!-- Native Notification Drawer & Bell -->
    ${drawerHtml}
    
    <div class="animate-fade-in">
      <div class="fin-page-header">
        <div>
          <h1>Finance Overview</h1>

          <p>Enterprise Financial Overview & Project Billings</p>
        </div>
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap">
          <a href="/finance/invoices" class="fin-btn outline" data-link>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            Client Invoices
          </a>
          <a href="/finance/reports" class="fin-btn primary" data-link>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
            Financial Reports
          </a>
        </div>
      </div>

    <!-- KPI Strip -->
    <div class="fin-kpi-strip">
      <div class="fin-kpi-card primary">
        <div class="kpi-label">Project Billing</div>
        <div class="kpi-value">${fmt(summary.totalBilling)}</div>
        <div class="kpi-sub">Total revenue billed across projects</div>
      </div>
      <div class="fin-kpi-card teal">
        <div class="kpi-label">Collected</div>
        <div class="kpi-value">${fmt(summary.totalCollected)}</div>
        <div class="kpi-sub">${recvPct}% collected</div>
      </div>
      <div class="fin-kpi-card warning">
        <div class="kpi-label">Pending from Client</div>
        <div class="kpi-value">${fmt(summary.pendingFromClient || 0)}</div>
        <div class="kpi-sub">Total Billing - Collected</div>
      </div>
      <div class="fin-kpi-card danger">
        <div class="kpi-label">Total Expenses</div>
        <div class="kpi-value">${fmt(summary.totalExpenses)}</div>
        <div class="kpi-sub">Actual expenses recorded</div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="fin-grid-1-2">
      <!-- Donut: Cost Distribution -->
      <div class="fin-panel" style="margin-bottom:0">
        <div class="fin-panel-header">
          <div>
            <div class="fin-panel-title">Expense Breakdown</div>
            <div class="fin-panel-subtitle">Distribution of project costs</div>
          </div>
        </div>
        <div class="fin-chart-wrap" style="max-width:220px; height:220px; margin:0 auto; position:relative;">
          <canvas id="donut-chart"></canvas>
        </div>
        <div class="fin-legend" style="margin-top:1.25rem">
          <div class="fin-legend-item">
            <span class="fin-legend-dot" style="background:#059669"></span>
            <span class="leg-label">Student Payroll</span>
            <span class="leg-pct">${fmt(summary.totalPayroll)}</span>
          </div>
          <div class="fin-legend-item">
            <span class="fin-legend-dot" style="background:#0891b2"></span>
            <span class="leg-label">Faculty Honorarium</span>
            <span class="leg-pct">${fmt(summary.totalFaculty)}</span>
          </div>
          <div class="fin-legend-item">
            <span class="fin-legend-dot" style="background:#6366f1"></span>
            <span class="leg-label">Hosting & Other Costs</span>
            <span class="leg-pct">${fmt(summary.totalOtherExpenses)}</span>
          </div>
          <div class="fin-legend-item">
            <span class="fin-legend-dot" style="background:#f59e0b"></span>
            <span class="leg-label">Maintenance &amp; Support</span>
            <span class="leg-pct">${fmt(summary.totalMaintenance || 0)}</span>
          </div>
        </div>
      </div>

      <!-- Bar: Collection Status by Project -->
      <div class="fin-panel" style="margin-bottom:0">
        <div class="fin-panel-header">
          <div>
            <div class="fin-panel-title">Financial Summary by Project</div>
            <div class="fin-panel-subtitle">Received vs Outstanding vs Unbilled</div>
          </div>
        </div>
        <div class="fin-chart-wrap" style="flex: 1;">
          <canvas id="bar-chart" height="220"></canvas>
        </div>
        <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size:0.85rem; color:var(--text-muted); font-weight: 600;">Overall Project Profit</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">Collected - Total Expenses</div>
            </div>
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--indigo, #4f46e5);">${fmt(summary.projectProfit || 0)}</div>
        </div>
      </div>
    </div>

    <!-- Projects Table Summary -->
    <div class="fin-panel">
      <div class="fin-panel-header">
        <div>
          <div class="fin-panel-title">Project Finance Overview</div>
          <div class="fin-panel-subtitle">Top active projects snapshot</div>
        </div>
        <a href="/finance/projects" class="fin-btn ghost sm" data-link>View All Projects &rarr;</a>
      </div>
      <div class="fin-table-wrap">
        <table class="fin-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Status</th>
      <th>Est. Cost</th>
              <th>Total Billing</th>
              <th>Collection</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${projectRows}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  `;

  // â”€â”€ Event Listeners â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  container.querySelectorAll('a[data-link]').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); router.push(a.getAttribute('href')); });
  });

  container.querySelectorAll('.view-proj-btn').forEach(btn => {
    btn.addEventListener('click', () => router.push(`/finance/projects/${btn.dataset.id}`));
  });

  // ── Action Items Drawer Interactive Controls ──────────────
  const bellBtn = container.querySelector('#fin-bell-btn');
  const drawer = container.querySelector('#fin-notification-drawer');
  const backdrop = container.querySelector('#fin-drawer-backdrop');
  const closeBtn = container.querySelector('#fin-drawer-close');

  const openDrawer = () => {
    if (drawer) drawer.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
    if (bellBtn) bellBtn.classList.add('drawer-open');
  };

  const closeDrawer = () => {
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    if (bellBtn) bellBtn.classList.remove('drawer-open');
  };

  if (bellBtn) bellBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

  // â”€â”€ Charts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const Chart = await loadChartJs();

  const COLORS = {
    primary: '#059669',
    teal: '#0891b2',
    indigo: '#6366f1',
    warning: '#f59e0b',
    danger: '#ef4444',
    grid: '#e2e8f0',
    text: '#64748b',
  };

  const tooltipDefaults = {
    backgroundColor: '#0f172a',
    titleColor: '#e2e8f0',
    bodyColor: '#94a3b8',
    padding: 12,
    cornerRadius: 8,
    displayColors: true,
  };

  // Donut chart (Expenses)
  new Chart(container.querySelector('#donut-chart'), {
    type: 'doughnut',
    data: {
      labels: ['Student Payroll', 'Faculty/Resource', 'Hosting & Other', 'Maintenance & Support'],
      datasets: [{
        data: [summary.totalPayroll, summary.totalFaculty, summary.totalOtherExpenses, summary.totalMaintenance || 0],
        backgroundColor: [COLORS.primary, COLORS.teal, COLORS.indigo, '#f59e0b'],
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipDefaults,
          callbacks: {
            label: ctx => {
              const v = ctx.raw;
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((v / total) * 100).toFixed(1) : 0;
              return `  ${ctx.label}: \u20B9${Number(v).toLocaleString('en-IN')} (${pct}%)`;
            },
          },
        },
      },
      animation: { animateRotate: true, duration: 800 },
    },
  });

  // Bar chart (Financial Summary by Project: Received vs Outstanding vs Unbilled)
  const projFullTitles = (projects || []).map(p => p.title || p.name || 'Project');
  const projLabels = (projects || []).map(p => {
    const name = p.title || p.name || 'Project';
    return name.length > 18 ? name.slice(0, 18) + '\u2026' : name;
  });

  const projReceived = (projects || []).map(p => {
    const pf = p.project_finance || {};
    return pf.total_collected || 0;
  });

  const projOutstanding = (projects || []).map(p => {
    const pf = p.project_finance || {};
    const invoiced = pf.total_invoiced || 0;
    const collected = pf.total_collected || 0;
    return Math.max(0, invoiced - collected);
  });

  const projUnbilled = (projects || []).map(p => {
    const pf = p.project_finance || {};
    const budget = p.budget || pf.total_development_amount || 0;
    const invoiced = pf.total_invoiced || 0;
    return Math.max(0, budget - invoiced);
  });

  new Chart(container.querySelector('#bar-chart'), {
    type: 'bar',
    data: {
      labels: projLabels,
      datasets: [
        { label: 'Received', data: projReceived, backgroundColor: COLORS.primary, borderRadius: 4, borderSkipped: false },
        { label: 'Outstanding', data: projOutstanding, backgroundColor: COLORS.warning, borderRadius: 4, borderSkipped: false },
        { label: 'Unbilled', data: projUnbilled, backgroundColor: '#c30707', borderRadius: 4, borderSkipped: false },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { color: COLORS.text, font: { family: 'Plus Jakarta Sans', size: 12 } } },
        tooltip: {
          ...tooltipDefaults,
          callbacks: {
            title: items => {
              const idx = items[0]?.dataIndex;
              return idx !== undefined ? projFullTitles[idx] : items[0]?.label;
            },
            label: ctx => `  ${ctx.dataset.label}: \u20B9${Number(ctx.raw).toLocaleString('en-IN')}`
          },
        },
      },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { color: COLORS.text } },
        y: {
          stacked: true,
          grid: { color: COLORS.grid },
          ticks: { color: COLORS.text, callback: v => '\u20B9' + (v / 1000) + 'K' },
        },
      },
      animation: { duration: 900 },
    },
  });

  return container;
}

export default FinanceDashboard;
