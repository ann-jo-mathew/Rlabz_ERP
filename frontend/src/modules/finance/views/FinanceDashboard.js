import { financeService } from '../services/FinanceService.js';
import { updateFinanceSidebar } from '../layouts/FinanceLayout.js';
import '../finance.css';

// ── Chart.js loader (Local if possible, otherwise we fallback to CDN for charts only, not PDFs. Wait, I should assume Chart is available globally from main app, or load it.)
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
  container.className = 'finance-module animate-fade-in';

  // Highlight active sidebar link
  setTimeout(updateFinanceSidebar, 0);

  // Fetch from our centralized mock service
  const summary = await financeService.getDashboardSummary();
  const projects = await financeService.getProjectFinances();

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const recvPct = summary.totalBilling > 0 
    ? Math.round((summary.totalCollected / summary.totalBilling) * 100) 
    : 0;

  // Build project rows (Top 3 for dashboard)
  const projectRows = projects.slice(0, 3).map(p => {
    const pct = p.totalBilling > 0 ? Math.round((p.collected / p.totalBilling) * 100) : 0;
    return `
      <tr>
        <td>
          <div style="font-weight:600">${p.name}</div>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px">PROJ-${p.id}</div>
        </td>
        <td><span class="fin-badge ${p.status === 'Completed' ? 'success' : 'info'}">${p.status}</span></td>
        <td>${fmt(p.estimated_cost)}</td>
        <td style="font-weight:700">${fmt(p.totalBilling)}</td>
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
        <div class="kpi-label">Total Project Billing</div>
        <div class="kpi-value">${fmt(summary.totalBilling)}</div>
        <div class="kpi-sub">Total revenue billed</div>
      </div>
      <div class="fin-kpi-card teal">
        <div class="kpi-label">Amount Collected</div>
        <div class="kpi-value">${fmt(summary.totalCollected)}</div>
        <div class="kpi-sub">${recvPct}% of billed amount</div>
      </div>
      <div class="fin-kpi-card warning">
        <div class="kpi-label">Outstanding Receivables</div>
        <div class="kpi-value">${fmt(summary.outstanding)}</div>
        <div class="kpi-sub">Pending collection</div>
      </div>
      <div class="fin-kpi-card indigo">
        <div class="kpi-label">Total Project Expenses</div>
        <div class="kpi-value">${fmt(summary.totalExpenses)}</div>
        <div class="kpi-sub">Across all projects</div>
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
        <div class="fin-chart-wrap" style="max-width:220px;margin:0 auto">
          <canvas id="donut-chart" height="220"></canvas>
        </div>
        <div class="fin-legend" style="margin-top:1.25rem">
          <div class="fin-legend-item">
            <span class="fin-legend-dot" style="background:#059669"></span>
            <span class="leg-label">Student Payroll</span>
            <span class="leg-pct">${fmt(summary.totalPayroll)}</span>
          </div>
          <div class="fin-legend-item">
            <span class="fin-legend-dot" style="background:#0891b2"></span>
            <span class="leg-label">Faculty/Resource</span>
            <span class="leg-pct">${fmt(summary.totalFaculty)}</span>
          </div>
          <div class="fin-legend-item">
            <span class="fin-legend-dot" style="background:#6366f1"></span>
            <span class="leg-label">Hosting & Other</span>
            <span class="leg-pct">${fmt(summary.totalOtherExpenses)}</span>
          </div>
        </div>
      </div>

      <!-- Bar: Collection Status by Project -->
      <div class="fin-panel" style="margin-bottom:0">
        <div class="fin-panel-header">
          <div>
            <div class="fin-panel-title">Receivables / Collection Status</div>
            <div class="fin-panel-subtitle">Received vs. pending per project</div>
          </div>
        </div>
        <div class="fin-chart-wrap">
          <canvas id="bar-chart" height="220"></canvas>
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
  `;

  // ── Event Listeners ─────────────────────────────────────────
  container.querySelectorAll('a[data-link]').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); router.push(a.getAttribute('href')); });
  });

  container.querySelectorAll('.view-proj-btn').forEach(btn => {
    btn.addEventListener('click', () => router.push(`/finance/projects/${btn.dataset.id}`));
  });

  // ── Charts ─────────────────────────────────────────────────
  const Chart = await loadChartJs();

  const COLORS = {
    primary:  '#059669',
    teal:     '#0891b2',
    indigo:   '#6366f1',
    warning:  '#f59e0b',
    danger:   '#ef4444',
    grid:     '#e2e8f0',
    text:     '#64748b',
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
      labels: ['Student Payroll', 'Faculty/Resource', 'Hosting & Other'],
      datasets: [{
        data: [summary.totalPayroll, summary.totalFaculty, summary.totalOtherExpenses],
        backgroundColor: [COLORS.primary, COLORS.teal, COLORS.indigo],
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 8,
      }],
    },
    options: {
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
              return `  ${ctx.label}: ₹${v.toLocaleString('en-IN')} (${pct}%)`;
            },
          },
        },
      },
      animation: { animateRotate: true, duration: 800 },
    },
  });

  // Bar chart (Collections)
  const projLabels   = projects.map(p => p.name.length > 18 ? p.name.slice(0, 18) + '…' : p.name);
  const projReceived = projects.map(p => p.collected);
  const projPending  = projects.map(p => p.outstanding);

  new Chart(container.querySelector('#bar-chart'), {
    type: 'bar',
    data: {
      labels: projLabels,
      datasets: [
        { label: 'Received', data: projReceived, backgroundColor: COLORS.primary,  borderRadius: 6, borderSkipped: false },
        { label: 'Outstanding',  data: projPending,  backgroundColor: COLORS.warning,  borderRadius: 6, borderSkipped: false },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { color: COLORS.text, font: { family: 'Plus Jakarta Sans', size: 12 } } },
        tooltip: {
          ...tooltipDefaults,
          callbacks: { label: ctx => `  ${ctx.dataset.label}: ₹${ctx.raw.toLocaleString('en-IN')}` },
        },
      },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { color: COLORS.text } },
        y: {
          stacked: true,
          grid: { color: COLORS.grid },
          ticks: { color: COLORS.text, callback: v => '₹' + (v / 1000) + 'K' },
        },
      },
      animation: { duration: 900 },
    },
  });

  return container;
}

export default FinanceDashboard;
