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
    if (response.status === 401) {
      authStore.logout();
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || errorData.status || 'Unable to load project list.');
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

export async function CoordinatorProjects(route, router) {
  const container = document.createElement('div');
  container.className = 'coordinator-dashboard';

  try {
    const projects = await fetchProjects();

    const rows = projects.map((project) => {
      const progress = getProjectProgress(project);
      const status = String(project.status || 'in_progress');
      return `
        <tr data-status="${status}">
          <td>
            <strong>${project.title || 'Untitled project'}</strong>
          </td>
          <td>${project.client_name || '—'}</td>
          <td>${formatLabel(project.project_type || project.type || 'General')}</td>
          <td>${Array.isArray(project.students) ? project.students.length : 0}</td>
          <td>
            <div class="coordinator-progress">
              <div class="coordinator-progress-bg">
                <div class="coordinator-progress-fill" style="width:${progress.percent}%"></div>
              </div>
              <span>${progress.percent}%</span>
            </div>
          </td>
          <td>
            <span class="priority-badge ${String(project.priority || 'normal').toLowerCase()}">
              ${formatLabel(project.priority || 'Normal')}
            </span>
          </td>
          <td>
            <span class="project-status ${status.toLowerCase().replace(/_/g, '-')}">
              ${formatLabel(status)}
            </span>
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
          <h1>Projects</h1>
          <p>Monitor project progress, allocation, and delivery status across the coordinator workspace.</p>
        </div>
          <div>
            <button class="coord-btn coord-btn-primary" id="add-project-btn">+ Add New Project</button>
          </div>
        </div>

      <div class="coordinator-kpi-grid">
        <div class="coordinator-kpi-card">
          <span>Total Projects</span>
          <strong>${projects.length}</strong>
          <small>All tracked projects</small>
        </div>

        <div class="coordinator-kpi-card">
          <span>In Progress</span>
          <strong>${projects.filter((project) => String(project.status || '').toLowerCase() === 'in_progress').length}</strong>
          <small>Current active work</small>
        </div>

        <div class="coordinator-kpi-card">
          <span>Urgent</span>
          <strong>${projects.filter((project) => String(project.priority || '').toLowerCase() === 'urgent').length}</strong>
          <small>Require attention</small>
        </div>

        <div class="coordinator-kpi-card">
          <span>Average Progress</span>
          <strong>${projects.length ? Math.round(projects.reduce((sum, project) => sum + getProjectProgress(project).percent, 0) / projects.length) : 0}%</strong>
          <small>Portfolio completion</small>
        </div>
      </div>

      <div class="coordinator-panel">
        <div class="coordinator-panel-header">
          <div>
            <h2>Project overview</h2>
            <p>Track project status and view more detail for each record.</p>
          </div>

          <select id="project-filter">
            <option value="all">All projects</option>
            <option value="in_progress">In progress</option>
            <option value="accepted">Accepted</option>
            <option value="proposed">Proposed</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div class="coordinator-table-wrapper">
          <table class="coordinator-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Client</th>
                <th>Type</th>
                <th>Students</th>
                <th>Progress</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="projects-table-body">
              ${rows || '<tr><td colspan="8">No projects found.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
      <div id="project-modal-root"></div>
    `;

    container.querySelector('#project-filter')?.addEventListener('change', (event) => {
      const filterValue = event.target.value;
      container.querySelectorAll('#projects-table-body tr').forEach((row) => {
        const shouldShow = filterValue === 'all' || row.dataset.status === filterValue;
        row.style.display = shouldShow ? '' : 'none';
      });
    });

    container.querySelectorAll('[data-id]')?.forEach((button) => {
      button.addEventListener('click', () => {
        router.push(`/coordinator/projects/${button.dataset.id}`);
      });
    });

    // Add Project modal
    container.querySelector('#add-project-btn')?.addEventListener('click', showAddProjectModal);

    function showAddProjectModal() {
      const modalRoot = container.querySelector('#project-modal-root');

      modalRoot.innerHTML = `
        <div class="coordinator-modal-overlay">
          <div class="coordinator-modal">
            <div class="coordinator-modal-header">
              <div>
                <h2>Add New Project</h2>
                <p>Enter the initial project details.</p>
              </div>
              <button id="close-project-modal" class="coordinator-close-btn">×</button>
            </div>

            <form id="new-project-form">
              <div class="coordinator-form-grid">
                <div class="coordinator-form-group">
                  <label>Project Title *</label>
                  <input type="text" name="title" required />
                </div>

                <div class="coordinator-form-group">
                  <label>Project Type</label>
                  <input type="text" name="project_type" />
                </div>

                <div class="coordinator-form-group">
                  <label>Source Type</label>
                  <select name="source_type">
                    <option value="faculty">Faculty</option>
                    <option value="student">Student</option>
                    <option value="alumni">Alumni</option>
                    <option value="institution">Institution</option>
                    <option value="external">External</option>
                  </select>
                </div>

                <div class="coordinator-form-group">
                  <label>Brought By</label>
                  <input type="text" name="brought_by" />
                </div>

                <div class="coordinator-form-group">
                  <label>Client Name</label>
                  <input type="text" name="client_name" />
                </div>

                <div class="coordinator-form-group">
                  <label>Contact Email</label>
                  <input type="email" name="contact_email" />
                </div>

                <div class="coordinator-form-group">
                  <label>Contact Phone</label>
                  <input type="text" name="contact_phone" />
                </div>

                <div class="coordinator-form-group full-width">
                  <label>Initial Requirements</label>
                  <textarea name="requirements" rows="3"></textarea>
                </div>

                <div class="coordinator-form-group full-width">
                  <label>Deliverables</label>
                  <textarea name="deliverables" rows="2"></textarea>
                </div>

                <div class="coordinator-form-group">
                  <label>Expected Timeline</label>
                  <input type="date" name="expected_timeline" />
                </div>

                <div class="coordinator-form-group">
                  <label>Budget</label>
                  <input type="number" name="budget" />
                </div>

                <div class="coordinator-form-group">
                  <label>Priority</label>
                  <select name="priority">
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div class="coordinator-modal-footer">
                <button type="button" id="cancel-project" class="coordinator-secondary-btn">Cancel</button>
                <button type="submit" class="coordinator-primary-btn">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      `;

      modalRoot.querySelector('#close-project-modal')?.addEventListener('click', closeModal);
      modalRoot.querySelector('#cancel-project')?.addEventListener('click', closeModal);

      modalRoot.querySelector('#new-project-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());

        // normalize empty strings to null
        Object.keys(payload).forEach(k => { if (payload[k] === '') payload[k] = null; });

        const token = getAuthToken();
        if (!token) {
          alert('Authentication required. Please log in.');
          return;
        }

        try {
          const resp = await fetch('http://127.0.0.1:8000/api/coordinator/projects', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });

          const body = await resp.json().catch(() => ({}));
          if (!resp.ok) {
            const msg = body.error || (body.message || 'Failed to create project');
            alert(`Error: ${msg}`);
            return;
          }

          closeModal();
          // refresh list
          const fresh = await fetchProjects();
          const tbody = container.querySelector('#projects-table-body');
          if (tbody) {
            tbody.innerHTML = fresh.map(project => {
              const progress = getProjectProgress(project);
              const status = String(project.status || 'in_progress');
              return `
                <tr data-status="${status}">
                  <td><strong>${project.title || 'Untitled project'}</strong></td>
                  <td>${project.client_name || '—'}</td>
                  <td>${formatLabel(project.project_type || project.type || 'General')}</td>
                  <td>${Array.isArray(project.students) ? project.students.length : 0}</td>
                  <td>
                    <div class="coordinator-progress">
                      <div class="coordinator-progress-bg">
                        <div class="coordinator-progress-fill" style="width:${progress.percent}%"></div>
                      </div>
                      <span>${progress.percent}%</span>
                    </div>
                  </td>
                  <td><span class="priority-badge ${String(project.priority || 'normal').toLowerCase()}">${formatLabel(project.priority || 'Normal')}</span></td>
                  <td><span class="project-status ${status.toLowerCase().replace(/_/g, '-')}">${formatLabel(status)}</span></td>
                  <td><button class="coord-btn coord-btn-secondary" data-id="${project.id}">View details</button></td>
                </tr>
              `;
            }).join('');

            // rebind detail buttons
            tbody.querySelectorAll('[data-id]').forEach((button) => {
              button.addEventListener('click', () => router.push(`/coordinator/projects/${button.dataset.id}`));
            });
          }

        } catch (err) {
          console.error(err);
          alert('An unexpected error occurred while creating the project.');
        }
      });

      function closeModal() {
        const modalRoot = container.querySelector('#project-modal-root');
        if (modalRoot) modalRoot.innerHTML = '';
      }
    }

    return container;
  } catch (error) {
    container.innerHTML = `
      <div class="coordinator-panel coordinator-empty-state">
        <h2>Unable to load projects</h2>
        <p>${error.message || 'Something went wrong while loading the project list.'}</p>
        <div style="margin-top: 1rem;">
          <button class="coord-btn coord-btn-primary" id="login-redirect-btn">Go to Login</button>
        </div>
      </div>
    `;
    container.querySelector('#login-redirect-btn')?.addEventListener('click', () => {
      authStore.logout();
      router.push('/login');
    });
    return container;
  }
}

export default CoordinatorProjects;