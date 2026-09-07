import { authStore } from '@/core/stores/auth.js';

function getAuthToken() {
  return authStore?.token || localStorage.getItem('token') || localStorage.getItem('access_token') || null;
}

function formatLabel(value, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getProjectProgress(project) {
  const modules = Array.isArray(project?.modules) ? project.modules : [];
  const tasks = modules.flatMap((module) => Array.isArray(module.tasks) ? module.tasks : []);
  const total = tasks.length;
  const completed = tasks.filter((task) => String(task.status || '').toLowerCase() === 'completed').length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  return { total, completed, percent };
}

async function fetchProjects() {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required. Please log in again.');
  }

  const response = await fetch('http://127.0.0.1:8000/api/coordinator/projects', {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || errorData.status || 'Unable to load project data.');
  }

  const data = await response.json();
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data?.data)) {
    return data.data;
  }
  return [];
}

export async function CoordinatorHome(route, router) {
  const container = document.createElement('div');
  container.className = 'coordinator-dashboard';

  try {
    const projects = await fetchProjects();

    const activeProjects = projects.filter((project) => {
      const status = String(project.status || '').toLowerCase();
      return status === 'in_progress' || status === 'accepted' || status === 'proposed';
    }).length;

    const urgentProjects = projects.filter((project) => String(project.priority || '').toLowerCase() === 'urgent').length;
    const totalStudents = projects.reduce((sum, project) => sum + (Array.isArray(project.students) ? project.students.length : 0), 0);
    const avgProgress = projects.length
      ? Math.round(projects.reduce((sum, project) => sum + getProjectProgress(project).percent, 0) / projects.length)
      : 0;

    const rows = projects.slice(0, 4).map((project) => {
      const progress = getProjectProgress(project);
      return `
        <tr>
          <td>
            <strong>${project.title || 'Untitled project'}</strong>
          </td>
          <td>${project.client_name || '—'}</td>
          <td>${Array.isArray(project.students) ? project.students.length : 0}</td>
          <td><span class="designation-badge ${String(project.priority || 'normal').toLowerCase()}">${formatLabel(project.priority || 'Normal')}</span></td>
          <td>
            <div class="progress-container">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress.percent}%"></div>
              </div>
              <span>${progress.percent}%</span>
            </div>
          </td>
          <td>
            <span class="priority-badge ${String(project.priority || 'normal').toLowerCase()}">${formatLabel(project.priority || 'Normal')}</span>
          </td>
          <td>
            <button class="coord-btn coord-btn-secondary" data-id="${project.id}">View details</button>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="coordinator-header">
        <div>
          <h1>Coordinator Workspace</h1>
          <p>Overview of active project work, team allocation, and delivery progress.</p>
        </div>

        <span class="coordinator-role-badge">Co-ordinator</span>
      </div>

      <div class="coordinator-kpi-grid">
        <div class="coordinator-kpi-card">
          <span>Active Projects</span>
          <strong>${activeProjects}</strong>
          <small>Currently in progress</small>
        </div>

        <div class="coordinator-kpi-card">
          <span>Students Assigned</span>
          <strong>${totalStudents}</strong>
          <small>Across active projects</small>
        </div>

        <div class="coordinator-kpi-card">
          <span>Average Progress</span>
          <strong>${avgProgress}%</strong>
          <small>Portfolio completion rate</small>
        </div>

        <div class="coordinator-kpi-card">
          <span>Urgent Projects</span>
          <strong>${urgentProjects}</strong>
          <small>Require coordination</small>
        </div>
      </div>

      <div class="coordinator-panel">
        <div class="coordinator-panel-header">
          <div>
            <h2>Projects in progress</h2>
            <p>Recent record summary for the active coordinator workspace.</p>
          </div>

          <button class="coord-btn coord-btn-primary" data-action="view-all-projects">View all projects</button>
        </div>

        <div class="coordinator-table-wrapper">
          <table class="coordinator-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Client</th>
                <th>Students</th>
                <th>Priority</th>
                <th>Progress</th>
                <th>Type</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="7">No projects found.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.querySelector('[data-action="view-all-projects"]')?.addEventListener('click', () => {
      router.push('/coordinator/projects');
    });

    container.querySelectorAll('[data-id]').forEach((button) => {
      button.addEventListener('click', () => {
        router.push(`/coordinator/projects/${button.dataset.id}`);
      });
    });

    return container;
  } catch (error) {
    container.innerHTML = `
      <div class="coordinator-panel coordinator-empty-state">
        <h2>Unable to load coordinator workspace</h2>
        <p>${error.message || 'Something went wrong while loading the project list.'}</p>
      </div>
    `;
    return container;
  }
}

export default CoordinatorHome;