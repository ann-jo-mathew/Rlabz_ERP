import { DirectorService } from '../services/DirectorService.js';

export function DirectorStudents(route, router) {
  const container = document.createElement('div');
  container.className = 'director-dashboard';

  let currentTrackFilter = 'All';

  function render() {
    const students = DirectorService.getStudents(currentTrackFilter);
    const allStudents = DirectorService.getStudents('All');

    const counts = {
      all: allStudents.length,
      nova: allStudents.filter(s => s.track === 'Nova').length,
      orbit: allStudents.filter(s => s.track === 'Orbit').length,
      spark: allStudents.filter(s => s.track === 'Spark').length
    };

    container.innerHTML = `
      <div class="director-header">
        <div>
          <h1>Student Track Roster & Designation Oversight</h1>
          <p>Filter, sort, and inspect student capability tracks: Nova (Leads), Orbit (Developers), and Spark (Learners).</p>
        </div>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button class="btn-director ${currentTrackFilter === 'All' ? 'btn-director-primary' : 'btn-director-outline'}" id="filter-all">
            All Students (${counts.all})
          </button>
          <button class="btn-director ${currentTrackFilter === 'Nova' ? 'btn-director-primary' : 'btn-director-outline'}" id="filter-nova">
            Nova Lead Track (${counts.nova})
          </button>
          <button class="btn-director ${currentTrackFilter === 'Orbit' ? 'btn-director-primary' : 'btn-director-outline'}" id="filter-orbit">
            Orbit Dev Track (${counts.orbit})
          </button>
          <button class="btn-director ${currentTrackFilter === 'Spark' ? 'btn-director-primary' : 'btn-director-outline'}" id="filter-spark">
            Spark Learner Track (${counts.spark})
          </button>
        </div>
      </div>

      <!-- Designation Track Explanation Banner -->
      <div class="director-kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));">
        <div class="director-panel" style="border-top: 4px solid #9333ea; padding: 1rem;">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <span class="track-badge nova">Nova Track</span>
            <strong>${counts.nova} Students</strong>
          </div>
          <p style="font-size:0.8rem; color:#6b7280; margin:0.5rem 0 0 0;">
            Independent full-stack leads who own complex or cross-cutting modules and mentor team members.
          </p>
        </div>

        <div class="director-panel" style="border-top: 4px solid #2563eb; padding: 1rem;">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <span class="track-badge orbit">Orbit Track</span>
            <strong>${counts.orbit} Students</strong>
          </div>
          <p style="font-size:0.8rem; color:#6b7280; margin:0.5rem 0 0 0;">
            Solid developers who deliver well-scoped feature modules with light supervision.
          </p>
        </div>

        <div class="director-panel" style="border-top: 4px solid #059669; padding: 1rem;">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <span class="track-badge spark">Spark Track</span>
            <strong>${counts.spark} Students</strong>
          </div>
          <p style="font-size:0.8rem; color:#6b7280; margin:0.5rem 0 0 0;">
            Learner interns building foundational skills on CRUD/UI modules with documentation works.
          </p>
        </div>
      </div>

      <!-- Student Table -->
      <div class="director-panel">
        <div class="director-panel-header">
          <h2>Student Roster (${students.length} Showing)</h2>
        </div>

        <div class="director-table-responsive">
          <table class="director-table">
            <thead>
              <tr>
                <th>Student ID & Name</th>
                <th>Designation Track</th>
                <th>Assigned Project</th>
                <th>Status</th>
                <th>GPA</th>
                <th>GitHub Account</th>
                <th>Contact Email</th>
              </tr>
            </thead>
            <tbody>
              ${students.map(s => `
                <tr>
                  <td>
                    <strong>${s.name}</strong><br>
                    <small style="color:#6b7280">${s.id}</small>
                  </td>
                  <td>
                    <span class="track-badge ${s.track.toLowerCase()}">${s.track}</span>
                  </td>
                  <td>${s.project}</td>
                  <td>
                    <span class="status-badge ${s.status === 'Active' ? 'completed' : 'in_progress'}">
                      ${s.status}
                    </span>
                  </td>
                  <td><strong>${s.gpa}</strong></td>
                  <td>
                    <a href="https://github.com/${s.github}" target="_blank" style="color:#2563eb; text-decoration:none; font-weight:600;">
                      @${s.github}
                    </a>
                  </td>
                  <td>${s.email}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Attach Event Listeners
    container.querySelector('#filter-all')?.addEventListener('click', () => { currentTrackFilter = 'All'; render(); });
    container.querySelector('#filter-nova')?.addEventListener('click', () => { currentTrackFilter = 'Nova'; render(); });
    container.querySelector('#filter-orbit')?.addEventListener('click', () => { currentTrackFilter = 'Orbit'; render(); });
    container.querySelector('#filter-spark')?.addEventListener('click', () => { currentTrackFilter = 'Spark'; render(); });
  }

  render();
  return container;
}

export default DirectorStudents;
