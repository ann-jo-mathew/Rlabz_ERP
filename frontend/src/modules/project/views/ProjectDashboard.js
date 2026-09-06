import { authStore } from '@/core/stores/auth.js';

export async function ProjectDashboard(route, router) {
  const container = document.createElement('div');
  container.className = 'project-dashboard animate-fade-in';

  const role = authStore.role;
  const permissions = authStore.permissions;

  container.innerHTML = `
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1>Project Management</h1>
        <p>View and manage all institutional projects.</p>
      </div>
      ${permissions.includes('project.create') ? '<button class="btn btn-primary shadow-hover" id="btn-create-project" style="width: auto; padding: 0.5rem 1.25rem; font-size: 0.9rem; font-family: var(--font-family);"><i class="fa fa-plus" style="margin-right: 0.5rem;"></i>Create Project</button>' : ''}
    </div>
    <div class="dashboard-content" id="project-list-container">
      <div class="spinner" style="border-top-color: var(--primary); margin: 40px auto; display: block; width: 32px; height: 32px;"></div>
    </div>
  `;

  async function render() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/projects', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await response.json();
      
      const listContainer = container.querySelector('#project-list-container');
      if (data.status === 'success') {
        const projects = data.data;
        if (projects.length === 0) {
          listContainer.innerHTML = '<div class="card-panel" style="text-align: center; padding: 3rem;"><p style="color: var(--text-muted); font-size: 1.1rem;">No projects found. Create one to get started!</p></div>';
          return;
        }

        let html = `
          <div class="project-table-container animate-fade-in">
            <table class="premium-table">
              <thead>
                <tr>
                  <th>Project Title</th>
                  <th>Type</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
        `;
        projects.forEach(p => {
          html += `
            <tr>
              <td style="font-weight: 600;">${p.title}</td>
              <td><span style="color: var(--text-muted);">${p.project_type || 'N/A'}</span></td>
              <td>${p.client_name || 'N/A'}</td>
              <td><span class="status-badge ${p.status}">${p.status || 'active'}</span></td>
              <td style="text-align: right;">
                <button class="btn btn-sm btn-outline btn-view-project" data-id="${p.id}">View Details</button>
              </td>
            </tr>
          `;
        });
        html += '</tbody></table></div>';
        listContainer.innerHTML = html;

        listContainer.querySelectorAll('.btn-view-project').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            const basePath = route.path.replace(/\/$/, '');
            router.push(basePath + '/' + id);
          });
        });
      } else {
        listContainer.innerHTML = '<p>Error loading projects: ' + (data.error || JSON.stringify(data)) + '</p>';
      }
    } catch (e) {
      console.error(e);
      container.querySelector('#project-list-container').innerHTML = '<p>Failed to load projects: ' + e.message + '</p>';
    }
  }

  const createBtn = container.querySelector('#btn-create-project');
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      const basePath = route.path.replace(/\/$/, '');
      router.push(basePath + '/create');
    });
  }

  await render();
  return container;
}

export default ProjectDashboard;
