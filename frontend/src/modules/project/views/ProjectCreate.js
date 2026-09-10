import { API_BASE } from '@/core/config/api.js';

export async function ProjectCreate(route, router) {
  const container = document.createElement('div');
  container.className = 'project-create animate-fade-in';

  container.innerHTML = `
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1>Create New Project</h1>
        <p>Fill out the details below to initiate a new project.</p>
      </div>
      <button id="btn-back" class="btn-back-nav" title="Return to Projects">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>Back to Projects</span>
      </button>
    </div>
    
    <div class="dashboard-content">
      <div class="card-panel" style="max-width: 800px; margin: 0 auto;">
        <form id="form-create-project">
          <div class="project-form-grid">
            
            <div class="form-group form-full-width">
              <label>Project Title <span style="color: var(--danger);">*</span></label>
              <input type="text" name="title" class="premium-input" placeholder="Enter a descriptive title" required />
            </div>

            <div class="form-group">
              <label>Project Type</label>
              <input type="text" name="project_type" class="premium-input" placeholder="e.g. Software, Research" />
            </div>

            <div class="form-group">
              <label>Client Name</label>
              <input type="text" name="client_name" class="premium-input" placeholder="Client or Institution" />
            </div>

            <div class="form-group form-full-width">
              <label>Description</label>
              <textarea name="description" class="premium-input" rows="4" placeholder="Briefly describe the project's goals and scope..."></textarea>
            </div>

            <div class="form-group">
              <label>Budget (₹)</label>
              <input type="number" name="budget" step="0.01" class="premium-input" placeholder="0.00" />
            </div>

            <div class="form-group">
              <label>Status</label>
              <select name="status" class="premium-input">
                <option value="proposed">Proposed</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div class="form-group">
              <label>Start Date</label>
              <input type="date" name="start_date" class="premium-input" />
            </div>

            <div class="form-group">
              <label>End Date</label>
              <input type="date" name="end_date" class="premium-input" />
            </div>

            <div class="form-group form-full-width" style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem; display: flex; align-items: center; justify-content: flex-end; gap: 1rem;">
              <span id="form-error" style="color: var(--danger); font-weight: 500;"></span>
              <button type="submit" class="btn btn-primary shadow-hover" id="btn-submit" style="padding: 0.75rem 2rem; font-size: 1rem;">Create Project</button>
            </div>

          </div>
        </form>
      </div>
    </div>
  `;

  const backBtn = container.querySelector('#btn-back');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      const basePath = route.path.replace(/\/create$/, '');
      router.push(basePath || '/dashboard/projects');
    });
  }

  const form = container.querySelector('#form-create-project');
  const errorSpan = container.querySelector('#form-error');
  const btnSubmit = container.querySelector('#btn-submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorSpan.textContent = '';
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Creating...';

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (data.status === 'success' || response.ok) {
        const basePath = route.path.replace(/\/create$/, '');
        router.push(basePath || '/dashboard/projects');
      } else {
        errorSpan.textContent = data.message || data.error || 'Failed to create project.';
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Create Project';
      }
    } catch (err) {
      console.error(err);
      errorSpan.textContent = 'An error occurred while communicating with the server.';
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Create Project';
    }
  });

  return container;
}

export default ProjectCreate;
