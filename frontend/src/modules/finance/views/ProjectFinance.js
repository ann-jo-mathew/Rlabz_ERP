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

export async function ProjectFinance(route, router) {
  const container = document.createElement('div');
  container.className = 'finance-module animate-fade-in';

  const authStore = useAuthStore();
  const token = authStore.token;
  const projectId = route.params?.id;

  // ── Fetch / Mock data ────────────────────────────────────────
  let project = null;

  try {
    const res = await fetch(`http://localhost:8000/api/finance/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('API error');
    project = await res.json();
  } catch {
    const isCMS = String(projectId) === '102';
    project = {
      id: projectId,
      name: isCMS ? 'College Management System' : 'RLabZ ERP Website',
      client: isCMS ? 'Rajagiri College' : 'RLabZ Technologies',
      status: isCMS ? 'Completed' : 'In Progress',
      start_date: isCMS ? '2023-01-10' : '2024-03-01',
      estimated_cost: isCMS ? 150000 : 100000,
      development_charges: {
        student: isCMS ? 20000 : 15000,
        faculty: isCMS ? 10000 : 5000,
        rlabz:   isCMS ? 90000 : 60000,
        total:   isCMS ? 120000 : 80000,
      },
      hosting_charges: { ssl: 2000, domain_name: isCMS ? 'cms.rajagiri.edu' : 'rlabz.com', domain: 1000, api: 0, total: 3000 },
      maintenance_support: { status: 'Included (1st Year)', included: true, amount: 0 },
      subtotal:           isCMS ? 123000 : 83000,
      gst_amount:         0,
      total_amount:       isCMS ? 123000 : 83000,
      payments_received:  isCMS ? 123000 : 40000,
      amount_remaining:   isCMS ? 0 : 43000,
      payments: [
        { date: '2023-01-15', payment_type: 'Advance',     amount: isCMS ? 60000 : 20000, payment_method: 'Bank Transfer', reference: 'REF-001', status: 'Completed' },
        { date: '2023-06-01', payment_type: 'Milestone 1', amount: isCMS ? 40000 : 20000, payment_method: 'UPI',           reference: 'REF-002', status: 'Completed' },
        ...(isCMS ? [{ date: '2023-12-20', payment_type: 'Final', amount: 23000, payment_method: 'Bank Transfer', reference: 'REF-003', status: 'Completed' }] : []),
      ],
    };
  }

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  const recvPct = Math.min(100, Math.round((project.payments_received / project.total_amount) * 100));

  // ── Payment rows ─────────────────────────────────────────────
  const paymentRows = project.payments.length
    ? project.payments.map(p => `
        <tr>
          <td>${p.date}</td>
          <td><span class="fin-badge neutral">${p.payment_type}</span></td>
          <td style="font-weight:700">${fmt(p.amount)}</td>
          <td>${p.payment_method}</td>
          <td style="font-family:monospace;font-size:0.82rem">${p.reference}</td>
          <td><span class="fin-badge success">${p.status}</span></td>
        </tr>`).join('')
    : `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem">No payment records yet.</td></tr>`;

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
        <h1>${project.name}</h1>
        <p>${project.client} &bull; Started ${project.start_date}</p>
      </div>
      <div style="display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap">
        <span class="fin-badge ${project.status === 'Completed' ? 'success' : 'info'}" style="font-size:0.85rem;padding:0.4rem 0.9rem">
          ${project.status}
        </span>
        <button class="fin-btn primary" id="record-payment-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Record Payment
        </button>
      </div>
    </div>

    <!-- KPI Strip -->
    <div class="fin-kpi-strip">
      <div class="fin-kpi-card primary">
        <div class="kpi-label">Total Project Value</div>
        <div class="kpi-value">${fmt(project.total_amount)}</div>
        <div class="kpi-sub">Est. ${fmt(project.estimated_cost)}</div>
      </div>
      <div class="fin-kpi-card teal">
        <div class="kpi-label">Amount Received</div>
        <div class="kpi-value">${fmt(project.payments_received)}</div>
        <div class="kpi-sub">${recvPct}% collected</div>
      </div>
      <div class="fin-kpi-card ${project.amount_remaining > 0 ? 'warning' : 'primary'}">
        <div class="kpi-label">Amount Remaining</div>
        <div class="kpi-value">${fmt(project.amount_remaining)}</div>
        <div class="kpi-sub">${project.amount_remaining > 0 ? 'Pending from client' : 'Fully collected ✓'}</div>
      </div>
      <div class="fin-kpi-card indigo">
        <div class="kpi-label">Payments Made</div>
        <div class="kpi-value">${project.payments.length}</div>
        <div class="kpi-sub">Total transactions</div>
      </div>
    </div>

    <!-- Charts + Cost Breakdown -->
    <div class="fin-grid-1-2">
      <!-- Cost Breakdown Panel -->
      <div class="fin-panel" style="margin-bottom:0">
        <div class="fin-panel-header">
          <div>
            <div class="fin-panel-title">Cost Breakdown</div>
            <div class="fin-panel-subtitle">Full project expenditure detail</div>
          </div>
        </div>

        <div style="font-size:0.8rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.5rem">Development</div>
        <div class="fin-breakdown-row"><span class="label">Student</span><span class="value">${fmt(project.development_charges.student)}</span></div>
        <div class="fin-breakdown-row"><span class="label">Faculty</span><span class="value">${fmt(project.development_charges.faculty)}</span></div>
        <div class="fin-breakdown-row"><span class="label">RLabZ</span><span class="value">${fmt(project.development_charges.rlabz)}</span></div>
        <div class="fin-breakdown-total"><span>Total Dev</span><span style="color:var(--primary)">${fmt(project.development_charges.total)}</span></div>

        <div style="font-size:0.8rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin:1rem 0 0.5rem">Hosting</div>
        <div class="fin-breakdown-row"><span class="label">SSL Certificate</span><span class="value">${fmt(project.hosting_charges.ssl)}</span></div>
        <div class="fin-breakdown-row"><span class="label">Domain (${project.hosting_charges.domain_name})</span><span class="value">${fmt(project.hosting_charges.domain)}</span></div>
        <div class="fin-breakdown-row"><span class="label">API</span><span class="value">${project.hosting_charges.api ? fmt(project.hosting_charges.api) : 'N/A'}</span></div>
        <div class="fin-breakdown-total"><span>Total Hosting</span><span style="color:#0891b2">${fmt(project.hosting_charges.total)}</span></div>

        <div style="font-size:0.8rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin:1rem 0 0.5rem">Maintenance</div>
        <div class="fin-breakdown-row"><span class="label">Status</span><span class="value">${project.maintenance_support.status}</span></div>
        <div class="fin-breakdown-row"><span class="label">Amount</span><span class="value">${fmt(project.maintenance_support.amount)}</span></div>

        <div style="margin-top:1.5rem;padding-top:1rem;border-top:2px solid var(--border-color)">
          <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem">
            <span style="font-size:0.875rem;color:var(--text-muted)">Subtotal</span>
            <span style="font-weight:600">${fmt(project.subtotal)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:0.75rem">
            <span style="font-size:0.875rem;color:var(--text-muted)">GST</span>
            <span style="font-weight:600">${fmt(project.gst_amount)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:1rem;font-weight:700">Grand Total</span>
            <span style="font-size:1.3rem;font-weight:800;color:var(--primary)">${fmt(project.total_amount)}</span>
          </div>
        </div>
      </div>

      <!-- Right column: Chart + Collection progress -->
      <div style="display:flex;flex-direction:column;gap:1.5rem">
        <!-- Collection Chart -->
        <div class="fin-panel" style="margin-bottom:0">
          <div class="fin-panel-header">
            <div>
              <div class="fin-panel-title">Payment Collection</div>
              <div class="fin-panel-subtitle">Received vs. remaining amount</div>
            </div>
          </div>
          <div style="display:flex;gap:1.5rem;align-items:center;flex-wrap:wrap">
            <div class="fin-chart-wrap" style="max-width:180px">
              <canvas id="proj-donut" height="180"></canvas>
            </div>
            <div style="flex:1;min-width:150px">
              <div style="margin-bottom:1rem">
                <div style="font-size:0.78rem;font-weight:600;color:var(--text-muted);margin-bottom:4px">Collected</div>
                <div style="font-size:1.4rem;font-weight:800;color:var(--primary)">${fmt(project.payments_received)}</div>
                <div class="fin-progress-bg"><div class="fin-progress-fill" style="width:${recvPct}%"></div></div>
                <div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px">${recvPct}% of total</div>
              </div>
              <div>
                <div style="font-size:0.78rem;font-weight:600;color:var(--text-muted);margin-bottom:4px">Remaining</div>
                <div style="font-size:1.4rem;font-weight:800;color:${project.amount_remaining > 0 ? 'var(--warning)' : 'var(--success)'}">${fmt(project.amount_remaining)}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Cumulative Payments Chart -->
        <div class="fin-panel" style="margin-bottom:0;flex:1">
          <div class="fin-panel-header">
            <div>
              <div class="fin-panel-title">Payment Timeline</div>
              <div class="fin-panel-subtitle">Cumulative collections over time</div>
            </div>
          </div>
          <div class="fin-chart-wrap">
            <canvas id="timeline-chart" height="190"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment History Table -->
    <div class="fin-panel">
      <div class="fin-panel-header">
        <div>
          <div class="fin-panel-title">Client Payment History</div>
          <div class="fin-panel-subtitle">${project.payments.length} transaction(s) recorded</div>
        </div>
        <button class="fin-btn outline sm" id="add-payment-btn">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Payment
        </button>
      </div>
      <div class="fin-table-wrap">
        <table class="fin-table">
          <thead>
            <tr>
              <th>Date</th><th>Type</th><th>Amount</th><th>Method</th><th>Reference</th><th>Status</th>
            </tr>
          </thead>
          <tbody>${paymentRows}</tbody>
        </table>
      </div>
    </div>
  `;

  // ── Events ───────────────────────────────────────────────────
  container.querySelector('#back-btn').addEventListener('click', () => router.push('/finance'));

  const handleRecord = () => alert(`Recording payment for: ${project.name}\n(Backend integration pending)`);
  container.querySelector('#record-payment-btn').addEventListener('click', handleRecord);
  container.querySelector('#add-payment-btn').addEventListener('click', handleRecord);

  // ── Charts ───────────────────────────────────────────────────
  const Chart = await loadChartJs();

  const tooltipDefaults = {
    backgroundColor: '#0f172a',
    titleColor: '#e2e8f0',
    bodyColor: '#94a3b8',
    padding: 12,
    cornerRadius: 8,
  };

  // Donut: received vs remaining
  new Chart(container.querySelector('#proj-donut'), {
    type: 'doughnut',
    data: {
      labels: ['Received', 'Remaining'],
      datasets: [{
        data: [project.payments_received, Math.max(0, project.amount_remaining)],
        backgroundColor: ['#059669', '#f59e0b'],
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 6,
      }],
    },
    options: {
      cutout: '70%',
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipDefaults,
          callbacks: { label: ctx => `  ${ctx.label}: ₹${ctx.raw.toLocaleString('en-IN')}` },
        },
      },
    },
  });

  // Timeline: cumulative payments
  const sortedPayments = [...project.payments].sort((a, b) => new Date(a.date) - new Date(b.date));
  let cumulative = 0;
  const timeLabels = sortedPayments.map(p => p.date);
  const cumulativeData = sortedPayments.map(p => { cumulative += p.amount; return cumulative; });

  new Chart(container.querySelector('#timeline-chart'), {
    type: 'line',
    data: {
      labels: timeLabels,
      datasets: [{
        label: 'Cumulative Received',
        data: cumulativeData,
        borderColor: '#059669',
        backgroundColor: 'rgba(5,150,105,0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#059669',
        pointRadius: 6,
        pointHoverRadius: 9,
      }, {
        label: 'Total Due',
        data: timeLabels.map(() => project.total_amount),
        borderColor: '#e2e8f0',
        borderDash: [6, 3],
        pointRadius: 0,
        fill: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top', labels: { color: '#64748b', font: { family: 'Plus Jakarta Sans', size: 11 } } },
        tooltip: {
          ...tooltipDefaults,
          callbacks: { label: ctx => `  ${ctx.dataset.label}: ₹${ctx.raw.toLocaleString('en-IN')}` },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#64748b' } },
        y: { grid: { color: '#e2e8f0' }, ticks: { color: '#64748b', callback: v => '₹' + (v / 1000) + 'K' } },
      },
    },
  });

  return container;
}

export default ProjectFinance;
