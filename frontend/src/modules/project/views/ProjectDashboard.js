import { authStore } from '@/core/stores/auth.js';
import { API_BASE } from '@/core/config/api.js';

export async function ProjectDashboard(route, router) {
  const container = document.createElement('div');
  container.className = 'project-dashboard animate-fade-in';

  const role = authStore.role;
  const permissions = authStore.permissions || [];
  let allProjects = [];
  let searchQuery = '';

  const pageTitle = role === 'faculty' ? 'My Projects' : 'Project Management';
  const pageSubtitle = role === 'faculty' ? 'Projects assigned to your academic mentorship and supervision.' : 'View and manage all institutional projects.';

  container.innerHTML = `
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
      <div>
        <h1>${pageTitle}</h1>
        <p>${pageSubtitle}</p>
      </div>
      <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
        <div style="position: relative; width: 320px; max-width: 100%;">
          <input 
            type="text" 
            id="input-search-projects" 
            class="premium-input" 
            placeholder="Search project by name..." 
            value="${searchQuery}" 
            style="padding-left: 2.25rem; font-size: 0.88rem; height: 40px; border-radius: 8px;"
          />
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 12px; top: 13px; color: #94a3b8;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>
        ${permissions.includes('project.create') ? '<button class="btn btn-primary shadow-hover" id="btn-create-project" style="width: auto; padding: 0 1.25rem; height: 40px; font-size: 0.88rem; font-family: var(--font-family); display: inline-flex; align-items: center; gap: 0.4rem;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg><span>Create Project</span></button>' : ''}
      </div>
    </div>
    <div class="dashboard-content" id="project-list-container">
      <div class="spinner" style="border-top-color: var(--primary); margin: 40px auto; display: block; width: 32px; height: 32px;"></div>
    </div>
    <style>
      .project-row-clickable {
        cursor: pointer;
        transition: background 0.15s;
      }
      .project-row-clickable:hover {
        background: var(--bg-surface, #f8fafc);
      }
      .project-row-clickable td:first-child {
        color: var(--primary);
      }
    </style>
  `;

  function renderTable(projectsToRender) {
    const listContainer = container.querySelector('#project-list-container');
    if (!listContainer) return;

    if (projectsToRender.length === 0) {
      listContainer.innerHTML = `
        <div class="card-panel" style="text-align: center; padding: 3rem; background: #ffffff; border: 1px solid var(--border-color); border-radius: 12px;">
          <p style="color: var(--text-muted); font-size: 1.05rem; margin: 0;">
            ${searchQuery ? `No projects found matching "${searchQuery}".` : 'No projects found. Create one to get started!'}
          </p>
        </div>
      `;
      return;
    }

    let html = `
      <div class="project-table-container animate-fade-in" style="margin-top: 0; background: #ffffff; border-radius: 12px; border: 1px solid var(--border-color, #e2e8f0); overflow: hidden;">
        <table class="premium-table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: var(--bg-main, #f8fafc); border-bottom: 2px solid var(--border-color, #e2e8f0);">
              <th style="padding: 1rem 1.5rem; font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Project Title</th>
              <th style="padding: 1rem 1.5rem; font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Type</th>
              <th style="padding: 1rem 1.5rem; font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Client</th>
              <th style="padding: 1rem 1.5rem; font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Status</th>
              <th style="padding: 1rem 1.5rem; font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
    `;

    projectsToRender.forEach(p => {
      const pStatus = (p.status || 'active').toLowerCase();
      html += `
        <tr class="project-row-clickable" data-project-id="${p.id}" style="border-bottom: 1px solid var(--border-color, #e2e8f0); transition: background 0.15s ease;">
          <td style="padding: 1.15rem 1.5rem; font-weight: 700; color: var(--text-main); font-size: 0.95rem;">${p.title}</td>
          <td style="padding: 1.15rem 1.5rem;"><span style="color: var(--text-muted); font-size: 0.9rem;">${p.project_type || 'N/A'}</span></td>
          <td style="padding: 1.15rem 1.5rem; color: var(--text-main); font-size: 0.92rem;">${p.client_name || 'N/A'}</td>
          <td style="padding: 1.15rem 1.5rem;"><span class="status-badge ${pStatus.replace(' ', '_')}">${p.status || 'active'}</span></td>
          <td style="padding: 1.15rem 1.5rem; text-align: right;">
            <button class="btn btn-sm btn-outline btn-view-project" data-id="${p.id}">View Details</button>
          </td>
        </tr>
      `;
    });

    html += '</tbody></table></div>';
    listContainer.innerHTML = html;

    // Clicking anywhere on row opens details
    listContainer.querySelectorAll('.project-row-clickable').forEach(row => {
      row.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-view-project');
        const id = btn ? btn.getAttribute('data-id') : row.getAttribute('data-project-id');
        const basePath = route.path.replace(/\/$/, '');
        router.push(basePath + '/' + id);
      });
    });
  }

  function filterProjects() {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      renderTable(allProjects);
      return;
    }
    const filtered = allProjects.filter(p => 
      (p.title || '').toLowerCase().includes(q) ||
      (p.client_name || '').toLowerCase().includes(q) ||
      (p.project_type || '').toLowerCase().includes(q) ||
      (p.status || '').toLowerCase().includes(q)
    );
    renderTable(filtered);
  }

  async function loadData() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/projects`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await response.json();

      if (data.status === 'success') {
        allProjects = data.data || [];
        filterProjects();
      } else {
        container.querySelector('#project-list-container').innerHTML = '<p style="color:red; padding: 2rem;">Error loading projects: ' + (data.error || JSON.stringify(data)) + '</p>';
      }
    } catch (e) {
      console.error(e);
      container.querySelector('#project-list-container').innerHTML = '<p style="color:red; padding: 2rem;">Failed to load projects: ' + e.message + '</p>';
    }
  }

  const searchInput = container.querySelector('#input-search-projects');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      filterProjects();
    });
  }

  const createBtn = container.querySelector('#btn-create-project');
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      const basePath = route.path.replace(/\/$/, '');
      router.push(basePath + '/create');
    });
  }

  await loadData();
  return container;
}

export default ProjectDashboard;
