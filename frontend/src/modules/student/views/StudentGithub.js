import { renderStudentSidebar } from './StudentSidebar.js';
import { getProjects, getGithub, saveGithubUrl } from './mockStore.js';
import '../student.css';

export function StudentGithub(route, router) {
  renderStudentSidebar();

  const container = document.createElement('div');
  container.className = 'student-portal-container animate-fade-in';

  function render() {
    const projects = getProjects();
    const repos = getGithub();

    const projectOptions = projects.map(p => `<option value="${p.title}">${p.title}</option>`).join('');

    const repoRows = repos.map(r => {
      const isVerified = r.status === 'Verified';
      const badgeClass = isVerified ? 'student-badge-success' : 'student-badge-warning';

      return `
        <tr>
          <td><div style="font-weight:600;">${r.project}</div></td>
          <td>
            <a href="${r.url}" target="_blank" style="color:var(--primary); font-size:0.85rem; word-break:break-all; font-weight:600; text-decoration:underline;">
              ${r.url}
            </a>
          </td>
          <td><span class="student-badge ${badgeClass}">${r.status}</span></td>
          <td>
            <span style="font-size:0.85rem; color:var(--text-muted); font-weight:500;">
              ${isVerified ? r.faculty : '—'}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="student-header">
        <h1>GitHub Repositories</h1>
        <p>Manage code repositories for your assigned projects and check faculty verification status.</p>
      </div>

      <div class="student-split-pane" style="grid-template-columns: 1fr 1.5fr;">
        <!-- Github URL submission form -->
        <div class="student-card">
          <div class="student-card-title">Link Repository URL</div>
          <form id="github-form" class="student-form">
            <div class="student-form-group">
              <label for="git-project">Project</label>
              <select id="git-project" class="student-select" required>
                <option value="" disabled selected>Select project</option>
                ${projectOptions}
              </select>
            </div>

            <div class="student-form-group">
              <label for="git-url">GitHub Repository URL</label>
              <input type="url" id="git-url" class="student-input" placeholder="e.g. https://github.com/rosha/my-project" required>
            </div>

            <button type="submit" class="student-btn student-btn-primary" style="justify-content:center; margin-top:8px;">
              Link Repository
            </button>
          </form>
        </div>

        <!-- Repositories List Table -->
        <div class="student-card">
          <div class="student-card-title">Registered Repositories</div>
          <div class="student-table-container">
            <table class="student-table">
              <thead>
                <tr>
                  <th style="width: 30%;">Project</th>
                  <th style="width: 40%;">Repository Link</th>
                  <th style="width: 15%;">Status</th>
                  <th style="width: 15%;">Verified By</th>
                </tr>
              </thead>
              <tbody>
                ${repoRows || '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">No repository links registered yet.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Bind form submission event handler
    const form = container.querySelector('#github-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const project = container.querySelector('#git-project').value;
      const url = container.querySelector('#git-url').value.trim();

      if (!project || !url) return;

      saveGithubUrl(project, url);
      render();
    });
  }

  render();
  return container;
}

export default StudentGithub;
