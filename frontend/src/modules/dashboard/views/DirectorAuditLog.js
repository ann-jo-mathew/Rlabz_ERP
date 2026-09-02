import { DirectorService } from '../services/DirectorService.js';

export function DirectorAuditLog(route, router) {
  const container = document.createElement('div');
  container.className = 'director-dashboard';

  let currentTypeFilter = 'all';
  let searchQuery = '';

  let activeLogs = DirectorService.getAuditLogs() || [];

  function render() {
    let filteredLogs = activeLogs;
    if (currentTypeFilter !== 'all') {
      filteredLogs = filteredLogs.filter(l => (l.type || 'info') === currentTypeFilter);
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      filteredLogs = filteredLogs.filter(l => 
        (l.event || '').toLowerCase().includes(q) ||
        (l.details || '').toLowerCase().includes(q) ||
        (l.user || '').toLowerCase().includes(q) ||
        (l.id || '').toLowerCase().includes(q)
      );
    }

    container.innerHTML = `
      <div class="director-header">
        <div>
          <h1>System Audit Log & Security Trail</h1>
          <p>Real-time governance trail tracking proposal decisions, faculty assignments, system logins, and executive actions.</p>
        </div>
        <div class="director-badge-role">
          ${activeLogs.length} Total Events Recorded
        </div>
      </div>

      <div class="director-panel">
        <div class="director-panel-header" style="display:flex; flex-wrap:wrap; justify-content:space-between; gap:1rem; align-items:center;">
          <div>
            <h2>Activity Audit Logs</h2>
            <span style="font-size:0.85rem; color:#6b7280;">Live activity stream from MySQL database</span>
          </div>

          <div style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center;">
            <input type="text" id="audit-search" placeholder="Search logs..." value="${searchQuery}" style="padding:0.4rem 0.8rem; border-radius:6px; border:1px solid #d1d5db; font-size:0.85rem;" />
            <button class="btn-director ${currentTypeFilter === 'all' ? 'btn-director-primary' : 'btn-director-outline'}" id="btn-filter-all">All</button>
            <button class="btn-director ${currentTypeFilter === 'success' ? 'btn-director-primary' : 'btn-director-outline'}" id="btn-filter-success">Success / Approvals</button>
            <button class="btn-director ${currentTypeFilter === 'warning' ? 'btn-director-primary' : 'btn-director-outline'}" id="btn-filter-warning">Warnings / Rejections</button>
            <button class="btn-director ${currentTypeFilter === 'info' ? 'btn-director-primary' : 'btn-director-outline'}" id="btn-filter-info">Info</button>
          </div>
        </div>

        <div class="director-table-responsive">
          <table class="director-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Timestamp</th>
                <th>User & Role</th>
                <th>Event Action</th>
                <th>Details & Remarks</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLogs.length === 0 ? `
                <tr>
                  <td colspan="6" style="text-align:center; padding:2rem; color:#9ca3af;">No audit records found.</td>
                </tr>
              ` : filteredLogs.map(log => `
                <tr>
                  <td><code>${log.id}</code></td>
                  <td style="white-space:nowrap; color:#6b7280; font-size:0.8rem;">${log.timestamp}</td>
                  <td><strong>${log.user}</strong><br><small style="color:#6b7280">${log.role}</small></td>
                  <td><strong>${log.event}</strong></td>
                  <td>${log.details}</td>
                  <td>
                    <span class="status-badge ${log.type === 'success' ? 'completed' : log.type === 'warning' ? 'rejected' : 'in_progress'}">
                      ${(log.type || 'info').toUpperCase()}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Event Listeners
    container.querySelector('#btn-filter-all')?.addEventListener('click', () => { currentTypeFilter = 'all'; render(); });
    container.querySelector('#btn-filter-success')?.addEventListener('click', () => { currentTypeFilter = 'success'; render(); });
    container.querySelector('#btn-filter-warning')?.addEventListener('click', () => { currentTypeFilter = 'warning'; render(); });
    container.querySelector('#btn-filter-info')?.addEventListener('click', () => { currentTypeFilter = 'info'; render(); });

    const searchInput = container.querySelector('#audit-search');
    if (searchInput) {
      searchInput.focus();
      searchInput.setSelectionRange(searchQuery.length, searchQuery.length);
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        render();
      });
    }
  }

  // Instant render (0ms)
  render();

  // Background sync from MySQL database
  DirectorService.getAuditLogsAsync().then(liveLogs => {
    if (liveLogs && liveLogs.length > 0) {
      activeLogs = liveLogs;
      render();
    }
  });

  return container;
}

export default DirectorAuditLog;
