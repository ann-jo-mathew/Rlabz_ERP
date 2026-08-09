import { useAuthStore } from '@/core/stores/auth.js';
import '../finance.css';

function loadChartJs() {
  return new Promise((resolve) => {
    if (window.Chart) return resolve(window.Chart);
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js';
    s.onload = () => resolve(window.Chart);
    document.head.appendChild(s);
  });
}

export async function StudentPayroll(route, router) {
  const container = document.createElement('div');
  container.className = 'finance-module animate-fade-in';

  const authStore = useAuthStore();
  const token = authStore.token;

  // ── Fetch / Mock ─────────────────────────────────────────────
  let payments = [];

  try {
    const res = await fetch('http://localhost:8000/api/finance/student-payments', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('API error');
    payments = await res.json();
  } catch {
    payments = [
      { id: 1, student_name: 'Aarav Menon',    designation: 'Frontend Developer',  project_name: 'RLabZ ERP',              module: 'Finance',   approved_hours: 40, hourly_rate: 150, amount: 6000,  payment_period: 'July 2026',   status: 'Pending',    payment_date: null,         payment_reference: null },
      { id: 2, student_name: 'Sneha Thomas',   designation: 'Backend Developer',   project_name: 'CMS System',             module: 'Auth',      approved_hours: 35, hourly_rate: 180, amount: 6300,  payment_period: 'July 2026',   status: 'Paid',       payment_date: '2026-08-01', payment_reference: 'TRX-98765' },
      { id: 3, student_name: 'Rohan Krishnan', designation: 'UI/UX Designer',      project_name: 'RLabZ ERP',              module: 'UI Design', approved_hours: 28, hourly_rate: 160, amount: 4480,  payment_period: 'July 2026',   status: 'Processing', payment_date: null,         payment_reference: null },
      { id: 4, student_name: 'Divya Nair',     designation: 'Full Stack Developer',project_name: 'College Management',     module: 'Billing',   approved_hours: 50, hourly_rate: 175, amount: 8750,  payment_period: 'June 2026',   status: 'Paid',       payment_date: '2026-07-05', payment_reference: 'TRX-87654' },
      { id: 5, student_name: 'Arun Pillai',    designation: 'QA Engineer',         project_name: 'RLabZ ERP',              module: 'Testing',   approved_hours: 22, hourly_rate: 130, amount: 2860,  payment_period: 'July 2026',   status: 'Pending',    payment_date: null,         payment_reference: null },
    ];
  }

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  // ── Aggregate stats ──────────────────────────────────────────
  const totalPayroll = payments.reduce((s, p) => s + p.amount, 0);
  const paidTotal    = payments.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
  const pendingTotal = payments.filter(p => p.status !== 'Paid').reduce((s, p) => s + p.amount, 0);
  const paidCount    = payments.filter(p => p.status === 'Paid').length;
  const pendingCount = payments.filter(p => p.status === 'Pending').length;
  const processingCount = payments.filter(p => p.status === 'Processing').length;

  // ── Rows ─────────────────────────────────────────────────────
  const rows = payments.map(p => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#059669,#047857);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.82rem;flex-shrink:0">
            ${p.student_name.split(' ').map(w => w[0]).join('')}
          </div>
          <div>
            <div style="font-weight:600">${p.student_name}</div>
            <div style="font-size:0.78rem;color:var(--text-muted)">${p.designation}</div>
          </div>
        </div>
      </td>
      <td>
        <div style="font-weight:500">${p.project_name}</div>
        <div style="font-size:0.78rem;color:var(--text-muted)">${p.module}</div>
      </td>
      <td>
        <div style="font-weight:600">${p.approved_hours} hrs</div>
        <div style="font-size:0.78rem;color:var(--text-muted)">@ ${fmt(p.hourly_rate)}/hr</div>
      </td>
      <td style="font-weight:700;font-size:1.05rem">${fmt(p.amount)}</td>
      <td><span class="fin-badge neutral">${p.payment_period}</span></td>
      <td>
        <span class="fin-badge ${p.status === 'Paid' ? 'success' : p.status === 'Processing' ? 'warning' : 'info'}">
          ${p.status === 'Paid' ? '✓ ' : ''}${p.status}
        </span>
        ${p.payment_date ? `<div style="font-size:0.75rem;color:var(--text-muted);margin-top:3px">${p.payment_date}</div>` : ''}
      </td>
      <td>
        ${p.status !== 'Paid'
          ? `<button class="fin-btn primary sm process-btn" data-id="${p.id}" data-name="${p.student_name}">
               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
               Process
             </button>`
          : `<span style="font-size:0.78rem;color:var(--text-muted);font-family:monospace">${p.payment_reference}</span>`
        }
      </td>
    </tr>`).join('');

  // ── Render ───────────────────────────────────────────────────
  container.innerHTML = `
    <div>
      <a class="fin-back-link" id="back-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/></svg>
        Back to Dashboard
      </a>
    </div>

    <div class="fin-page-header">
      <div>
        <h1>Student Payroll</h1>
        <p>Manage student designations, approved hours, and payment disbursement</p>
      </div>
      <div style="display:flex;gap:0.75rem;flex-wrap:wrap">
        <button class="fin-btn outline" id="filter-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          Filter
        </button>
        <button class="fin-btn primary" id="report-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Generate Report
        </button>
      </div>
    </div>

    <!-- KPI Strip -->
    <div class="fin-kpi-strip">
      <div class="fin-kpi-card primary">
        <div class="kpi-label">Total Payroll</div>
        <div class="kpi-value">${fmt(totalPayroll)}</div>
        <div class="kpi-sub">${payments.length} student records</div>
      </div>
      <div class="fin-kpi-card teal">
        <div class="kpi-label">Amount Disbursed</div>
        <div class="kpi-value">${fmt(paidTotal)}</div>
        <div class="kpi-sub">${paidCount} payment(s) completed</div>
      </div>
      <div class="fin-kpi-card warning">
        <div class="kpi-label">Amount Pending</div>
        <div class="kpi-value">${fmt(pendingTotal)}</div>
        <div class="kpi-sub">${pendingCount} pending · ${processingCount} processing</div>
      </div>
      <div class="fin-kpi-card indigo">
        <div class="kpi-label">Avg. Hours/Student</div>
        <div class="kpi-value">${Math.round(payments.reduce((s, p) => s + p.approved_hours, 0) / payments.length)} hrs</div>
        <div class="kpi-sub">This period</div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="fin-grid-1-2">
      <!-- Donut: status distribution -->
      <div class="fin-panel" style="margin-bottom:0">
        <div class="fin-panel-header">
          <div>
            <div class="fin-panel-title">Payment Status</div>
            <div class="fin-panel-subtitle">Distribution by status</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap">
          <div class="fin-chart-wrap" style="max-width:180px">
            <canvas id="status-donut" height="180"></canvas>
          </div>
          <div class="fin-legend" style="flex:1;min-width:140px">
            <div class="fin-legend-item">
              <span class="fin-legend-dot" style="background:#059669"></span>
              <span class="leg-label">Paid</span>
              <span class="leg-pct">${paidCount}</span>
            </div>
            <div class="fin-legend-item">
              <span class="fin-legend-dot" style="background:#f59e0b"></span>
              <span class="leg-label">Processing</span>
              <span class="leg-pct">${processingCount}</span>
            </div>
            <div class="fin-legend-item">
              <span class="fin-legend-dot" style="background:#6366f1"></span>
              <span class="leg-label">Pending</span>
              <span class="leg-pct">${pendingCount}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bar: Amount per student -->
      <div class="fin-panel" style="margin-bottom:0">
        <div class="fin-panel-header">
          <div>
            <div class="fin-panel-title">Payroll by Student</div>
            <div class="fin-panel-subtitle">Total amount per student this period</div>
          </div>
        </div>
        <div class="fin-chart-wrap">
          <canvas id="payroll-bar" height="190"></canvas>
        </div>
      </div>
    </div>

    <!-- Payroll Table -->
    <div class="fin-panel">
      <div class="fin-panel-header">
        <div>
          <div class="fin-panel-title">Payroll Records</div>
          <div class="fin-panel-subtitle">${payments.length} students · Current period</div>
        </div>
      </div>
      <div class="fin-table-wrap">
        <table class="fin-table">
          <thead>
            <tr>
              <th>Student &amp; Role</th>
              <th>Project</th>
              <th>Hours &amp; Rate</th>
              <th>Amount</th>
              <th>Period</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;

  // ── Events ───────────────────────────────────────────────────
  container.querySelector('#back-btn').addEventListener('click', () => router.push('/finance'));
  container.querySelector('#filter-btn').addEventListener('click',  () => alert('Filter panel coming soon.'));
  container.querySelector('#report-btn').addEventListener('click',  () => alert('Payroll report export coming soon.'));

  container.querySelectorAll('.process-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id   = btn.dataset.id;
      const name = btn.dataset.name;
      if (!confirm(`Process payment for ${name}?`)) return;
      btn.disabled = true;
      btn.textContent = 'Processing…';
      try {
        await fetch('http://localhost:8000/api/finance/student-payments', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, action: 'process' }),
        });
      } catch { /* backend offline */ }
      const row = btn.closest('tr');
      const statusCell = row.querySelector('td:nth-child(6)');
      statusCell.innerHTML = '<span class="fin-badge warning">⏳ Processing</span>';
      btn.textContent = 'Sent';
    });
  });

  // ── Charts ───────────────────────────────────────────────────
  const Chart = await loadChartJs();

  const tooltipDefaults = {
    backgroundColor: '#0f172a',
    titleColor: '#e2e8f0',
    bodyColor: '#94a3b8',
    padding: 12,
    cornerRadius: 8,
  };

  // Status donut
  new Chart(container.querySelector('#status-donut'), {
    type: 'doughnut',
    data: {
      labels: ['Paid', 'Processing', 'Pending'],
      datasets: [{
        data: [paidCount, processingCount, pendingCount],
        backgroundColor: ['#059669', '#f59e0b', '#6366f1'],
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 7,
      }],
    },
    options: {
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipDefaults,
          callbacks: { label: ctx => `  ${ctx.label}: ${ctx.raw} student(s)` },
        },
      },
    },
  });

  // Payroll bar chart
  const studentLabels = payments.map(p => p.student_name.split(' ')[0]);
  const studentAmounts = payments.map(p => p.amount);
  const barColors = payments.map(p =>
    p.status === 'Paid' ? '#059669' : p.status === 'Processing' ? '#f59e0b' : '#6366f1'
  );

  new Chart(container.querySelector('#payroll-bar'), {
    type: 'bar',
    data: {
      labels: studentLabels,
      datasets: [{
        label: 'Payroll Amount',
        data: studentAmounts,
        backgroundColor: barColors,
        borderRadius: 8,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipDefaults,
          callbacks: {
            title: ctx => payments[ctx[0].dataIndex].student_name,
            label: ctx => `  Amount: ₹${ctx.raw.toLocaleString('en-IN')}`,
            afterLabel: ctx => `  Status: ${payments[ctx.dataIndex].status}`,
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#64748b' } },
        y: { grid: { color: '#e2e8f0' }, ticks: { color: '#64748b', callback: v => '₹' + (v / 1000) + 'K' } },
      },
      animation: { duration: 900 },
    },
  });

  return container;
}

export default StudentPayroll;
