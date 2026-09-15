import { DirectorService } from '../services/DirectorService.js';

export function DirectorStudents(route, router) {
  const container = document.createElement('div');
  container.className = 'director-dashboard';

  const urlParams = new URLSearchParams(window.location.search);
  const trackParam = (route && route.query && route.query.track) || urlParams.get('track') || 'All';
  const trackMap = {
    'nova': 'Nova',
    'orbit': 'Orbit',
    'spark': 'Spark',
    'all': 'All'
  };
  let currentTrackFilter = trackMap[trackParam.toLowerCase()] || 'All';
  let activeStudentList = DirectorService.getStudents('All') || [];

  function render() {
    const students = currentTrackFilter === 'All' 
      ? activeStudentList 
      : activeStudentList.filter(s => s.track.toLowerCase() === currentTrackFilter.toLowerCase());

    const counts = {
      all: activeStudentList.length,
      nova: activeStudentList.filter(s => s.track === 'Nova').length,
      orbit: activeStudentList.filter(s => s.track === 'Orbit').length,
      spark: activeStudentList.filter(s => s.track === 'Spark').length
    };

    function renderProjectsCell(s) {
      const projects = Array.isArray(s.projects) && s.projects.length > 0 
        ? s.projects 
        : (s.project ? [s.project] : []);

      if (projects.length === 0) {
        return '<span style="color:#9ca3af; font-size:0.85rem;">Unassigned</span>';
      }

      if (projects.length <= 2) {
        return `
          <div class="student-projects-cell">
            ${projects.map(p => {
              const pTitle = typeof p === 'string' ? p : p.title;
              return `<span class="student-project-chip" title="${pTitle}">${pTitle}</span>`;
            }).join('')}
          </div>
        `;
      }

      // If student is having more than two projects:
      // Show first 2 projects + more button!
      const firstTwo = projects.slice(0, 2);
      const remainingCount = projects.length - 2;

      return `
        <div class="student-projects-cell">
          ${firstTwo.map(p => {
            const pTitle = typeof p === 'string' ? p : p.title;
            return `<span class="student-project-chip" title="${pTitle}">${pTitle}</span>`;
          }).join('')}
          <button class="student-project-more-btn" data-student-id="${s.id}" title="Click to view all ${projects.length} projects and tasks assigned to ${s.name}">
            +${remainingCount} more
          </button>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="director-header">
        <div>
          <h1>Student Track Roster & Designation Oversight</h1>
          <p>Filter, sort, and inspect student capability tracks: Nova (Leads), Orbit (Developers), and Spark (Learners). Click any student row to inspect assigned tasks and execution progress.</p>
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

        <div class="director-panel" style="border-top: 4px solid var(--primary); padding: 1rem;">
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
          <div>
            <h2>Student Roster (${students.length} Showing)</h2>
            <span style="font-size:0.82rem; color:#6b7280;">Click any row to open the complete student profile, assigned projects, and task execution progress.</span>
          </div>
          <span style="font-size:0.85rem; color:#6b7280;">Live records from MySQL database</span>
        </div>

        <div class="director-table-responsive">
          <table class="director-table">
            <thead>
              <tr>
                <th style="width: 20%;">Student ID & Name</th>
                <th style="width: 12%;">Designation Track</th>
                <th style="width: 28%;">Assigned Projects</th>
                <th style="width: 10%;">Status</th>
                <th style="width: 8%;">GPA</th>
                <th style="width: 12%;">GitHub Account</th>
                <th style="width: 10%;">Contact & Details</th>
              </tr>
            </thead>
            <tbody>
              ${students.length === 0 ? `
                <tr><td colspan="7" style="text-align:center; padding:2rem; color:#9ca3af;">No students found in this track.</td></tr>
              ` : students.map(s => {
                const initials = s.name.split(' ').map(n => n[0]).join('').slice(0, 2);
                const trackLower = (s.track || 'orbit').toLowerCase();
                return `
                  <tr class="student-row-clickable" data-id="${s.id}" title="Click to open ${s.name}'s detailed profile, projects, and tasks">
                    <td>
                      <div class="student-row-identity">
                        <div class="student-row-avatar ${trackLower}">${initials}</div>
                        <div>
                          <strong class="student-row-name">${s.name}</strong>
                          <span class="student-row-id">${s.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="track-badge ${trackLower}">${s.track}</span>
                    </td>
                    <td>
                      ${renderProjectsCell(s)}
                    </td>
                    <td>
                      <span class="status-badge ${s.status === 'Active' ? 'completed' : 'in_progress'}">
                        ${s.status}
                      </span>
                    </td>
                    <td><strong>${s.gpa}</strong></td>
                    <td>
                      <a href="https://github.com/${s.github}" target="_blank" class="student-github-link-table" style="color:#2563eb; text-decoration:none; font-weight:600;">
                        @${s.github}
                      </a>
                    </td>
                    <td>
                      <div class="student-row-action-cell">
                        <span class="student-view-action">Inspect</span>
                        <svg class="student-row-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Attach Click Event Listeners to rows and more buttons
    container.querySelectorAll('.student-row-clickable').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        const studentId = row.getAttribute('data-id');
        if (studentId) {
          router ? router.push(`/dashboard/students/${studentId}`) : (window.location.href = `/dashboard/students/${studentId}`);
        }
      });
    });

    container.querySelectorAll('.student-project-more-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const studentId = btn.getAttribute('data-student-id');
        if (studentId) {
          router ? router.push(`/dashboard/students/${studentId}`) : (window.location.href = `/dashboard/students/${studentId}`);
        }
      });
    });

    // Attach Filter Listeners
    container.querySelector('#filter-all')?.addEventListener('click', () => { 
      currentTrackFilter = 'All'; 
      window.history.replaceState({}, '', '/dashboard/students');
      render(); 
    });
    container.querySelector('#filter-nova')?.addEventListener('click', () => { 
      currentTrackFilter = 'Nova'; 
      window.history.replaceState({}, '', '/dashboard/students?track=Nova');
      render(); 
    });
    container.querySelector('#filter-orbit')?.addEventListener('click', () => { 
      currentTrackFilter = 'Orbit'; 
      window.history.replaceState({}, '', '/dashboard/students?track=Orbit');
      render(); 
    });
    container.querySelector('#filter-spark')?.addEventListener('click', () => { 
      currentTrackFilter = 'Spark'; 
      window.history.replaceState({}, '', '/dashboard/students?track=Spark');
      render(); 
    });
  }

  // Instant 0ms render
  render();

  // Async background fetch from MySQL
  DirectorService.getStudentsAsync('All').then(liveStudents => {
    if (liveStudents && liveStudents.length > 0) {
      activeStudentList = liveStudents;
      render();
    }
  });

  return container;
}

export default DirectorStudents;
