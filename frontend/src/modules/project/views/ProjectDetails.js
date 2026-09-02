import { authStore } from '@/core/stores/auth.js';

export async function ProjectDetails(route, router) {
  const container = document.createElement('div');
  container.className = 'project-details animate-fade-in';
  
  const projectId = route.params.id;
  const permissions = authStore.permissions;

  container.innerHTML = `
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1 id="project-title" style="font-size: 2rem; margin-bottom: 0.5rem;">Loading Project...</h1>
        <p style="color: var(--text-muted);">View detailed project information and manage assignments.</p>
      </div>
      <div>
        ${permissions.includes('project.close') ? '<button class="btn btn-warning shadow-hover" id="btn-close-project" style="display:none; margin-right: 0.75rem;"><i class="fa fa-times-circle" style="margin-right: 0.5rem;"></i>Close Project</button>' : ''}
        <button class="btn btn-outline" id="btn-back"><i class="fa fa-arrow-left" style="margin-right: 0.5rem;"></i>Back to Projects</button>
      </div>
    </div>
    <div class="dashboard-content">
      <div id="project-info" class="card-panel" style="margin-bottom: 2rem; display: none;">
        <div class="project-form-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; row-gap: 2rem;">
          <div>
            <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 0.25rem;">Type</span>
            <strong id="val-type" style="font-size: 1.1rem; color: var(--text-main);"></strong>
          </div>
          <div>
            <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 0.25rem;">Client Name</span>
            <strong id="val-client" style="font-size: 1.1rem; color: var(--text-main);"></strong>
          </div>
          <div>
            <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 0.25rem;">Status & Priority</span>
            <span id="val-status"></span> <span id="val-priority"></span>
          </div>
          <div>
            <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 0.25rem;">Allocated Budget</span>
            <strong style="font-size: 1.1rem; color: var(--text-main);">₹<span id="val-budget"></span></strong>
          </div>
          <div>
            <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 0.25rem;">Brought By / Source</span>
            <strong id="val-source" style="font-size: 1.1rem; color: var(--text-main);"></strong>
          </div>
          <div>
            <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 0.25rem;">Target Timeline</span>
            <strong id="val-timeline" style="font-size: 1.1rem; color: var(--text-main);"></strong>
          </div>
          <div>
            <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 0.25rem;">Client Contact</span>
            <strong id="val-contact" style="font-size: 1.1rem; color: var(--text-main);"></strong>
          </div>
        </div>

        <div style="margin-top: 2rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem;">
          <div>
            <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 0.5rem;">Project Requirements</span>
            <p id="val-requirements" style="font-size: 1rem; color: var(--text-main); line-height: 1.6; background: rgba(0,0,0,0.02); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color);"></p>
          </div>
          <div>
            <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 0.5rem;">Expected Deliverables</span>
            <p id="val-deliverables" style="font-size: 1rem; color: var(--text-main); line-height: 1.6; background: rgba(0,0,0,0.02); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color);"></p>
          </div>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;" id="assignment-section">
        ${permissions.includes('project.assign_faculty') ? `
        <div class="card-panel">
          <h3 style="margin-bottom: 1.25rem; font-size: 1.2rem;">Assign Lead Faculty</h3>
          <form id="form-assign-faculty" style="display: flex; flex-direction: column; gap: 1rem;">
            <div class="autocomplete-container">
              <input type="text" id="faculty-search" placeholder="Type faculty name..." class="premium-input" autocomplete="off" />
              <input type="hidden" name="faculty_id" id="faculty-id" required />
              <div id="faculty-results" class="autocomplete-results"></div>
            </div>
            <button type="submit" class="btn btn-primary shadow-hover" style="align-self: flex-start; padding: 0.6rem 1.5rem;">Assign Faculty</button>
          </form>
          <p id="msg-faculty" style="margin-top: 1rem; font-size: 0.95rem; font-weight: 500;"></p>
        </div>
        ` : ''}
        
        ${permissions.includes('project.assign_students') ? `
        <div class="card-panel">
          <h3 style="margin-bottom: 1.25rem; font-size: 1.2rem;">Assign Student Track Member</h3>
          <form id="form-assign-student" style="display: flex; flex-direction: column; gap: 1rem;">
            <div class="autocomplete-container">
              <input type="text" id="student-search" placeholder="Type student name..." class="premium-input" autocomplete="off" />
              <input type="hidden" name="student_id" id="student-id" required />
              <div id="student-results" class="autocomplete-results"></div>
            </div>
            <input type="text" name="designation" placeholder="Designation (e.g. Nova Lead / Orbit Developer)" class="premium-input" />
            <button type="submit" class="btn btn-primary shadow-hover" style="align-self: flex-start; padding: 0.6rem 1.5rem;">Assign Student</button>
          </form>
          <p id="msg-student" style="margin-top: 1rem; font-size: 0.95rem; font-weight: 500;"></p>
        </div>
        ` : ''}
      </div>
    </div>
  `;

  const btnBack = container.querySelector('#btn-back');
  if (btnBack) {
    btnBack.addEventListener('click', () => {
      const pathParts = route.path.split('/');
      pathParts.pop(); 
      const basePath = pathParts.join('/');
      router.push(basePath || '/dashboard/projects');
    });
  }

  const loadProject = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/projects/${projectId}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await response.json();
      
      if (data.status === 'success' && data.data) {
        const p = data.data;
        container.querySelector('#project-title').textContent = p.title || 'Project Details';
        container.querySelector('#val-type').textContent = p.project_type || 'N/A';
        container.querySelector('#val-client').textContent = p.client_name || 'N/A';
        
        const statusSpan = container.querySelector('#val-status');
        statusSpan.textContent = (p.status || 'N/A').toUpperCase();
        statusSpan.className = `status-badge ${p.status || 'active'}`;
        
        const prioritySpan = container.querySelector('#val-priority');
        prioritySpan.textContent = p.priority ? p.priority.toUpperCase() + ' PRIORITY' : 'NORMAL PRIORITY';
        prioritySpan.className = `status-badge ${p.priority === 'urgent' ? 'rejected' : 'in_progress'}`;

        container.querySelector('#val-budget').textContent = p.budget ? Number(p.budget).toLocaleString('en-IN') : '0.00';
        container.querySelector('#val-source').textContent = (p.brought_by ? p.brought_by + ' (' + (p.source_type || 'External') + ')' : (p.source_type || 'N/A'));
        container.querySelector('#val-timeline').textContent = p.expected_timeline || 'N/A';
        container.querySelector('#val-contact').textContent = (p.contact_email || '') + (p.contact_phone ? ' • ' + p.contact_phone : '');
        container.querySelector('#val-requirements').textContent = p.requirements || 'No specific requirements listed.';
        container.querySelector('#val-deliverables').textContent = p.deliverables || 'No deliverables specified.';
        
        container.querySelector('#project-info').style.display = 'block';
        
        container.querySelector('#project-info').style.display = 'block';
        
        const btnClose = container.querySelector('#btn-close-project');
        if (btnClose) {
          if (p.status !== 'completed') {
            btnClose.style.display = 'inline-block';
            btnClose.addEventListener('click', async () => {
              if (confirm('Are you sure you want to close this project?')) {
                await closeProject();
              }
            });
          }
        }
      } else {
        container.querySelector('#project-title').textContent = 'Project Not Found';
      }
    } catch (err) {
      console.error(err);
      container.querySelector('#project-title').textContent = 'Error Loading Project';
    }
  };

  const closeProject = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/projects/${projectId}/close`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (response.ok) {
        alert('Project closed successfully');
        loadProject();
      } else {
        alert('Failed to close project');
      }
    } catch (err) {
      console.error(err);
      alert('Error communicating with server');
    }
  };

  // Assign Faculty
  const formFaculty = container.querySelector('#form-assign-faculty');
  if (formFaculty) {
    formFaculty.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = container.querySelector('#msg-faculty');
      msg.textContent = 'Assigning...';
      const formData = new FormData(formFaculty);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://127.0.0.1:8000/api/projects/${projectId}/faculty`, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(Object.fromEntries(formData.entries()))
        });
        const data = await response.json();
        if (response.ok) {
          msg.style.color = 'green';
          msg.textContent = data.message || 'Assigned successfully!';
          formFaculty.reset();
          container.querySelector('#faculty-search').value = '';
          container.querySelector('#faculty-id').value = '';
        } else {
          msg.style.color = 'red';
          msg.textContent = data.error || 'Failed to assign';
        }
      } catch (err) {
        msg.style.color = 'red';
        msg.textContent = 'Error assigning';
      }
    });
  }

  // Assign Student
  const formStudent = container.querySelector('#form-assign-student');
  if (formStudent) {
    formStudent.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = container.querySelector('#msg-student');
      msg.textContent = 'Assigning...';
      const formData = new FormData(formStudent);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://127.0.0.1:8000/api/projects/${projectId}/students`, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(Object.fromEntries(formData.entries()))
        });
        const data = await response.json();
        if (response.ok) {
          msg.style.color = 'green';
          msg.textContent = data.message || 'Assigned successfully!';
          formStudent.reset();
          container.querySelector('#student-search').value = '';
          container.querySelector('#student-id').value = '';
        } else {
          msg.style.color = 'red';
          msg.textContent = data.error || 'Failed to assign';
        }
      } catch (err) {
        msg.style.color = 'red';
        msg.textContent = 'Error assigning';
      }
    });
  }

  // Autocomplete Logic
  function setupAutocomplete(searchInputId, hiddenInputId, resultsId, role) {
    const searchInput = container.querySelector('#' + searchInputId);
    const hiddenInput = container.querySelector('#' + hiddenInputId);
    const resultsContainer = container.querySelector('#' + resultsId);
    
    if (!searchInput) return;

    let debounceTimer;
    
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const query = e.target.value.trim();
      
      if (query.length < 2) {
        resultsContainer.style.display = 'none';
        hiddenInput.value = '';
        return;
      }
      
      debounceTimer = setTimeout(async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://127.0.0.1:8000/api/auth/users?role=${role}&search=${encodeURIComponent(query)}`, {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          const data = await response.json();
          
          if (data.status === 'success' && data.data.length > 0) {
            resultsContainer.innerHTML = '';
            data.data.forEach(user => {
              const item = document.createElement('div');
              item.className = 'autocomplete-item';
              item.innerHTML = `<strong>${user.name}</strong><small>${user.email}</small>`;
              item.addEventListener('click', () => {
                searchInput.value = user.name;
                hiddenInput.value = user.id;
                resultsContainer.style.display = 'none';
              });
              resultsContainer.appendChild(item);
            });
            resultsContainer.style.display = 'block';
          } else {
            resultsContainer.innerHTML = '<div class="autocomplete-item"><small>No users found</small></div>';
            resultsContainer.style.display = 'block';
          }
        } catch (err) {
          console.error('Error fetching users:', err);
        }
      }, 300);
    });

    // Hide results on outside click
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
        resultsContainer.style.display = 'none';
      }
    });
  }

  setupAutocomplete('faculty-search', 'faculty-id', 'faculty-results', 'faculty');
  setupAutocomplete('student-search', 'student-id', 'student-results', 'student');

  await loadProject();
  return container;
}

export default ProjectDetails;
