export function CoordinatorFinances(route, router) {
  const container = document.createElement('div');
  container.className = 'coordinator-finances';

  const projects = [
    {
      name: 'Smart Campus Management',
      client: 'Rajagiri College',
      budget: 45000,
      spent: 31800,
      lastUpdated: '2026-08-10',
      status: 'On Track'
    },
    {
      name: 'Online Food Ordering',
      client: 'Campus Cafeteria',
      budget: 22000,
      spent: 18550,
      lastUpdated: '2026-08-12',
      status: 'At Risk'
    },
    {
      name: 'Library Management System',
      client: 'College Library',
      budget: 15000,
      spent: 13820,
      lastUpdated: '2026-08-05',
      status: 'On Track'
    },
    {
      name: 'Event Scheduling App',
      client: 'Student Council',
      budget: 8000,
      spent: 4200,
      lastUpdated: '2026-08-14',
      status: 'Under Review'
    }
  ];

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  container.innerHTML = `
    <div class="coordinator-header">
      <div>
        <h1>Coordinator — Finances</h1>
        <p>Overview of project budgets and expenditure.</p>
      </div>
    </div>

    <div class="coordinator-kpi-grid">
      <div class="coordinator-kpi-card">
        <span>Total Budget</span>
        <strong>₹${totalBudget.toLocaleString()}</strong>
        <small>Allocated across projects</small>
      </div>

      <div class="coordinator-kpi-card">
        <span>Total Spent</span>
        <strong>₹${totalSpent.toLocaleString()}</strong>
        <small>Expenditure to date</small>
      </div>

      <div class="coordinator-kpi-card">
        <span>Remaining</span>
        <strong>₹${totalRemaining.toLocaleString()}</strong>
        <small>Budget left</small>
      </div>

      <div class="coordinator-kpi-card">
        <span>Projects</span>
        <strong>${projects.length}</strong>
        <small>Tracked projects</small>
      </div>
    </div>

    <div class="coordinator-panel">
      <div class="coordinator-panel-header">
        <div>
          <h2>Project Finances</h2>
          <p>Detailed budget vs spent for each project.</p>
        </div>
      </div>

      <div class="coordinator-table-wrapper">
        <table class="coordinator-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Client</th>
              <th>Budget</th>
              <th>Spent</th>
              <th>Remaining</th>
              <th>Status</th>
              <th>Last Updated</th>
            </tr>
          </thead>

          <tbody>
            ${projects.map(p => `
              <tr>
                <td><strong>${p.name}</strong></td>
                <td>${p.client}</td>
                <td>₹${p.budget.toLocaleString()}</td>
                <td>₹${p.spent.toLocaleString()}</td>
                <td>₹${(p.budget - p.spent).toLocaleString()}</td>
                <td><span class="priority-badge ${p.status.toLowerCase().replace(/\s+/g,'-')}">${p.status}</span></td>
                <td>${p.lastUpdated}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  return container;
}

export default CoordinatorFinances;
