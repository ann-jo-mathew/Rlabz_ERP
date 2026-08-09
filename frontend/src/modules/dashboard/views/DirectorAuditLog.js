import { DirectorService } from '../services/DirectorService.js';

export function DirectorAuditLog(route, router) {
  const container = document.createElement('div');
  container.className = 'director-dashboard';

  const logs = DirectorService.getAuditLogs();

  container.innerHTML = `
    <div class="director-header">
      <div>
        <h1>System Audit Log & Event Security Trail</h1>
        <p>Comprehensive audit log tracking user logins, role modifications, project proposal decisions, and access events.</p>
      </div>
      <div class="director-badge-role">
        ${logs.length} Security Events Recorded
      </div>
    </div>

    <div class="director-panel">
      <div class="director-panel-header">
        <h2>Activity Audit Logs</h2>
        <span style="font-size:0.85rem; color:#6b7280;">Real-time governance trail</span>
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
            ${logs.map(log => `
              <tr>
                <td><code>${log.id}</code></td>
                <td style="white-space:nowrap; color:#6b7280; font-size:0.8rem;">${log.timestamp}</td>
                <td><strong>${log.user}</strong><br><small style="color:#6b7280">${log.role}</small></td>
                <td><strong>${log.event}</strong></td>
                <td>${log.details}</td>
                <td>
                  <span class="status-badge ${log.type === 'success' ? 'completed' : log.type === 'warning' ? 'rejected' : 'in_progress'}">
                    ${log.type.toUpperCase()}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  return container;
}

export default DirectorAuditLog;
