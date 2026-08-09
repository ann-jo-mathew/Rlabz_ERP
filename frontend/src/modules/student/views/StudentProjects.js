import { renderStudentSidebar } from './StudentSidebar.js';
import { getProjects } from './mockStore.js';
import '../student.css';

export function StudentProjects(route, router) {
  renderStudentSidebar();

  const container = document.createElement('div');
  container.className = 'student-portal-container animate-fade-in';

  const projects = getProjects();
  
  // Set default selected project
  let selectedProjectId = projects.length > 0 ? projects[0].id : null;

  function render() {
    const selectedProject = projects.find(p => p.id === selectedProjectId);

    // Build project cards HTML
    const projectCardsHtml = projects.map(p => `
      <div class="student-card project-summary-card ${p.id === selectedProjectId ? 'active-border' : ''}" style="margin-bottom:16px; cursor:pointer;" data-id="${p.id}">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
          <h3 style="font-size:1.05rem; font-weight:700; color:var(--text-main);">${p.title}</h3>
          <span class="student-badge ${p.status === 'Completed' ? 'student-badge-success' : 'student-badge-warning'}">${p.status}</span>
        </div>
        
        <div style="display:flex; gap:12px; margin-bottom:12px;">
          <span class="student-badge student-badge-info" style="font-size:0.7rem;">${p.designation}</span>
          <span style="font-size:0.8rem; color:var(--text-muted); font-weight:500;">Supervisor: ${p.faculty}</span>
        </div>

        <div style="margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">
            <span>Timeline: ${p.timeline}</span>
            <span style="font-weight:600;">${p.progress}% Completed</span>
          </div>
          <div class="student-progress-bar-bg">
            <div class="student-progress-bar-fill" style="width: ${p.progress}%;"></div>
          </div>
        </div>

        <button class="student-btn student-btn-outline student-btn-sm select-proj-btn" style="width:100%; justify-content:center;" data-id="${p.id}">
          View Project Details
        </button>
      </div>
    `).join('');

    // Build details card HTML
    const detailsHtml = selectedProject ? `
      <div class="student-card student-drawer">
        <div class="student-detail-header">
          <h2 style="font-size:1.3rem; font-weight:700; color:var(--text-main); margin-bottom:6px;">${selectedProject.title}</h2>
          <div style="display:flex; gap:8px;">
            <span class="student-badge ${selectedProject.status === 'Completed' ? 'student-badge-success' : 'student-badge-warning'}">${selectedProject.status}</span>
            <span class="student-badge student-badge-info">${selectedProject.designation}</span>
          </div>
        </div>

        <div class="student-detail-field">
          <div class="student-detail-label">Description</div>
          <div class="student-detail-value" style="line-height:1.6;">${selectedProject.description}</div>
        </div>

        <div class="student-detail-field">
          <div class="student-detail-label">Technologies Used</div>
          <div class="student-detail-value" style="display:flex; gap:6px; flex-wrap:wrap; margin-top:6px;">
            ${selectedProject.tech.split(',').map(t => `<span class="student-badge" style="background:#f1f5f9; color:var(--text-muted); border:1px solid var(--border-color); font-weight:500;">${t.trim()}</span>`).join('')}
          </div>
        </div>

        <div class="student-detail-field">
          <div class="student-detail-label">Assigned Faculty Supervisor</div>
          <div class="student-detail-value" style="font-weight:600;">${selectedProject.faculty}</div>
        </div>

        <div class="student-detail-field">
          <div class="student-detail-label">Team Members</div>
          <div class="student-detail-value">${selectedProject.members}</div>
        </div>

        <div class="student-detail-field">
          <div class="student-detail-label">Repository Setup</div>
          <div class="student-detail-value">
            <button class="student-btn student-btn-outline student-btn-sm go-github-btn" style="margin-top:4px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
              Manage Repository Link
            </button>
          </div>
        </div>
      </div>
    ` : `
      <div class="student-card" style="display:flex; align-items:center; justify-content:center; min-height:300px; color:var(--text-muted);">
        Select a project to view its full details.
      </div>
    `;

    container.innerHTML = `
      <div class="student-header">
        <h1>My Projects</h1>
        <p>View your active academic development projects and role assignments.</p>
      </div>

      <div class="student-split-pane">
        <!-- Projects List (Left) -->
        <div>
          ${projectCardsHtml || '<div class="student-card" style="text-align:center;color:var(--text-muted);">No projects assigned.</div>'}
        </div>

        <!-- Selected Project Details (Right) -->
        <div id="project-details-outlet">
          ${detailsHtml}
        </div>
      </div>
    `;

    // Rebind Event Listeners
    container.querySelectorAll('.project-summary-card, .select-proj-btn').forEach(el => {
      el.addEventListener('click', (e) => {
        const id = parseInt(el.getAttribute('data-id'), 10);
        selectedProjectId = id;
        render();
      });
    });

    const githubBtn = container.querySelector('.go-github-btn');
    githubBtn?.addEventListener('click', () => {
      router.push('/student/github');
    });
  }

  render();
  return container;
}

export default StudentProjects;
