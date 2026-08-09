import { useAuthStore } from '@/core/stores/auth.js';
import '../finance.css';

// ── Chart.js loader (CDN, cached) ───────────────────────────
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

  const authStore = useAuthStore();
  const token = authStore.token;

  // ── Mock / live data ────────────────────────────────────────
  let summary = null;
  let projects = [];

  try {
    const [sRes, pRes] = await Promise.all([
      fetch('http://localhost:8000/api/finance/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('http://localhost:8000/api/finance/projects',  { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    if (!sRes.ok || !pRes.ok) throw new Error('API error');
    summary  = await sRes.json();
    projects = await pRes.json();
  } catch {
    summary = {
      total_project_value:    250000,
      total_amount_received:  170950,
      amount_pending:          79050,
      total_student_payments:  17000,
      total_development_charges: 160000,
      total_hosting_charges:    7000,
    };
    projects = [
      { id: 101, name: 'RLabZ ERP Website',         status: 'In Progress', estimated_cost: 100000, total_amount:  82010, payments_received: 40000 },
      { id: 102, name: 'College Management System',  status: 'Completed',   estimated_cost: 150000, total_amount: 120950, payments_received: 120950 },
    ];
  }

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  // ── Receipt percent for progress bars ──────────────────────
  const recvPct = Math.round((summary.total_amount_received / summary.total_project_value) * 100);

  // ── Build project rows ──────────────────────────────────────
  const projectRows = projects.map(p => {
    const pct = Math.round((p.payments_received / p.total_amount) * 100);
    return `
      <tr>
        <td>
          <div style="font-weight:600">${p.name}</div>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px">PROJ-${p.id}</div>
        </td>
        <td><span class="fin-badge ${p.status === 'Completed' ? 'success' : 'info'}">${p.status}</span></td>
        <td>${fmt(p.estimated_cost)}</td>
        <td style="font-weight:700">${fmt(p.total_amount)}</td>
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

  // ── Render HTML skeleton ────────────────────────────────────
  container.innerHTML = `
    <div class="fin-page-header">
      <div>
        <h1>Finance Dashboard</h1>
        <p>Enterprise Financial Overview &amp; Project Billings</p>
      </div>
      <div style="display:flex;gap:0.75rem;flex-wrap:wrap">
        <a href="/finance/student-payments" class="fin-btn outline" data-link>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Student Payroll
        </a>
        <button class="fin-btn primary" id="export-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export Report
        </button>
      </div>
    </div>

    <!-- KPI Strip -->
    <div class="fin-kpi-strip">
      <div class="fin-kpi-card primary">
        <div class="kpi-label">Total Project Value</div>
        <div class="kpi-value">${fmt(summary.total_project_value)}</div>
        <div class="kpi-sub">Across all active projects</div>
      </div>
      <div class="fin-kpi-card teal">
        <div class="kpi-label">Amount Received</div>
        <div class="kpi-value">${fmt(summary.total_amount_received)}</div>
        <div class="kpi-sub">${recvPct}% of total project value</div>
      </div>
      <div class="fin-kpi-card warning">
        <div class="kpi-label">Amount Pending</div>
        <div class="kpi-value">${fmt(summary.amount_pending)}</div>
        <div class="kpi-sub">Action required</div>
      </div>
      <div class="fin-kpi-card indigo">
        <div class="kpi-label">Student Payroll</div>
        <div class="kpi-value">${fmt(summary.total_student_payments)}</div>
        <div class="kpi-sub">Total disbursed this period</div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="fin-grid-1-2">
      <!-- Donut: Cost Distribution -->
      <div class="fin-panel" style="margin-bottom:0">
        <div class="fin-panel-header">
          <div>
            <div class="fin-panel-title">Cost Distribution</div>
            <div class="fin-panel-subtitle">Breakdown of project expenditure</div>
          </div>
        </div>
        <div class="fin-chart-wrap" style="max-width:220px;margin:0 auto">
          <canvas id="donut-chart" height="220"></canvas>
        </div>
        <div class="fin-legend" style="margin-top:1.25rem">
          <div class="fin-legend-item">
            <span class="fin-legend-dot" style="background:#059669"></span>
            <span class="leg-label">Development</span>
            <span class="leg-pct">${fmt(summary.total_development_charges)}</span>
          </div>
          <div class="fin-legend-item">
            <span class="fin-legend-dot" style="background:#0891b2"></span>
            <span class="leg-label">Hosting</span>
            <span class="leg-pct">${fmt(summary.total_hosting_charges)}</span>
          </div>
          <div class="fin-legend-item">
            <span class="fin-legend-dot" style="background:#6366f1"></span>
            <span class="leg-label">Student Payroll</span>
            <span class="leg-pct">${fmt(summary.total_student_payments)}</span>
          </div>
        </div>
      </div>

      <!-- Bar: Collection Status by Project -->
      <div class="fin-panel" style="margin-bottom:0">
        <div class="fin-panel-header">
          <div>
            <div class="fin-panel-title">Collection Status by Project</div>
            <div class="fin-panel-subtitle">Received vs. pending per project</div>
          </div>
        </div>
        <div class="fin-chart-wrap">
          <canvas id="bar-chart" height="220"></canvas>
        </div>
      </div>
    </div>

    <!-- Cashflow Line + Summary -->
    <div class="fin-grid-2-1" style="margin-bottom:1.5rem">
      <!-- Monthly Cashflow -->
      <div class="fin-panel" style="margin-bottom:0">
        <div class="fin-panel-header">
          <div>
            <div class="fin-panel-title">Monthly Cashflow</div>
            <div class="fin-panel-subtitle">Inflows vs. outflows (last 6 months)</div>
          </div>
        </div>
        <div class="fin-chart-wrap">
          <canvas id="line-chart" height="190"></canvas>
        </div>
      </div>

      <!-- Financial Summary -->
      <div class="fin-panel" style="margin-bottom:0">
        <div class="fin-panel-header">
          <div class="fin-panel-title">Financial Summary</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:1.1rem">
          <div>
            <div style="font-size:0.78rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Collection Rate</div>
            <div style="font-size:1.4rem;font-weight:800;color:var(--primary)">${recvPct}%</div>
            <div class="fin-progress-bg"><div class="fin-progress-fill" style="width:${recvPct}%"></div></div>
          </div>
          <hr class="fin-divider">
          <div class="fin-breakdown-row">
            <span class="label">Development Charges</span>
            <span class="value" style="color:var(--primary)">${fmt(summary.total_development_charges)}</span>
          </div>
          <div class="fin-breakdown-row">
            <span class="label">Hosting Charges</span>
            <span class="value" style="color:#0891b2">${fmt(summary.total_hosting_charges)}</span>
          </div>
          <div class="fin-breakdown-row">
            <span class="label">Student Payroll</span>
            <span class="value" style="color:#6366f1">${fmt(summary.total_student_payments)}</span>
          </div>
          <div class="fin-breakdown-total">
            <span>Total Expenses</span>
            <span>${fmt(summary.total_development_charges + summary.total_hosting_charges + summary.total_student_payments)}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Projects Table -->
    <div class="fin-panel">
      <div class="fin-panel-header">
        <div>
          <div class="fin-panel-title">Projects Overview</div>
          <div class="fin-panel-subtitle">All active and completed projects</div>
        </div>
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

  container.querySelector('#export-btn').addEventListener('click', () => alert('Export functionality coming soon.'));

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

  // Donut chart
  new Chart(container.querySelector('#donut-chart'), {
    type: 'doughnut',
    data: {
      labels: ['Development', 'Hosting', 'Student Payroll'],
      datasets: [{
        data: [summary.total_development_charges, summary.total_hosting_charges, summary.total_student_payments],
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
              const pct = ((v / total) * 100).toFixed(1);
              return `  ${ctx.label}: ₹${v.toLocaleString('en-IN')} (${pct}%)`;
            },
          },
        },
      },
      animation: { animateRotate: true, duration: 800 },
    },
  });

  // Bar chart
  const projLabels   = projects.map(p => p.name.length > 18 ? p.name.slice(0, 18) + '…' : p.name);
  const projReceived = projects.map(p => p.payments_received);
  const projPending  = projects.map(p => p.total_amount - p.payments_received);

  new Chart(container.querySelector('#bar-chart'), {
    type: 'bar',
    data: {
      labels: projLabels,
      datasets: [
        { label: 'Received', data: projReceived, backgroundColor: COLORS.primary,  borderRadius: 6, borderSkipped: false },
        { label: 'Pending',  data: projPending,  backgroundColor: COLORS.warning,  borderRadius: 6, borderSkipped: false },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'top', labels: { color: COLORS.text, font: { family: 'Plus Jakarta Sans', size: 12 } } },
        tooltip: {
          ...tooltipDefaults,
          callbacks: { label: ctx => `  ${ctx.dataset.label}: ₹${ctx.raw.toLocaleString('en-IN')}` },
        },
      },
      scales: {
        x: { stacked: false, grid: { display: false }, ticks: { color: COLORS.text } },
        y: {
          stacked: false,
          grid: { color: COLORS.grid },
          ticks: { color: COLORS.text, callback: v => '₹' + (v / 1000) + 'K' },
        },
      },
      animation: { duration: 900 },
    },
  });

  // Line chart (monthly cashflow — simulated)
  const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  const inflows  = [20000, 35000, 28000, 52000, 38000, 45000];
  const outflows = [12000, 18000, 15000, 22000, 17000, 20000];

  new Chart(container.querySelector('#line-chart'), {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Inflows',
          data: inflows,
          borderColor: COLORS.primary,
          backgroundColor: 'rgba(5,150,105,0.08)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: COLORS.primary,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
        {
          label: 'Outflows',
          data: outflows,
          borderColor: COLORS.warning,
          backgroundColor: 'rgba(245,158,11,0.06)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: COLORS.warning,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top', labels: { color: COLORS.text, font: { family: 'Plus Jakarta Sans', size: 12 } } },
        tooltip: {
          ...tooltipDefaults,
          callbacks: { label: ctx => `  ${ctx.dataset.label}: ₹${ctx.raw.toLocaleString('en-IN')}` },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: COLORS.text } },
        y: { grid: { color: COLORS.grid }, ticks: { color: COLORS.text, callback: v => '₹' + (v / 1000) + 'K' } },
      },
      animation: { duration: 900 },
    },
  });

  return container;
}

export default FinanceDashboard;
