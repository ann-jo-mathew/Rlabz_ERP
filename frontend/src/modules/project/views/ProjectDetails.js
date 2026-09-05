import { authStore } from '@/core/stores/auth.js';

export async function ProjectDetails(route, router) {
  const container = document.createElement('div');
  container.className = 'project-details animate-fade-in';

  const projectId = route.params.id;
  const permissions = authStore.permissions || [];
  const role = authStore.role || 'student'; // default safely

  // Helper to determine if a tab should be shown
  const canViewAssignments = role === 'director' || role === 'coordinator';

  container.innerHTML = `
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <div>
        <h1 id="project-title" style="font-size: 2rem; margin-bottom: 0.5rem;">Loading Project...</h1>
        <p style="color: var(--text-muted);">View detailed project information and manage assignments.</p>
      </div>
      <div>
        ${permissions.includes('project.close') ? '<button class="btn btn-warning shadow-hover" id="btn-close-project" style="display:none; margin-right: 0.75rem;"><i class="fa fa-times-circle" style="margin-right: 0.5rem;"></i>Close Project</button>' : ''}
        <button class="btn btn-outline" id="btn-back"><i class="fa fa-arrow-left" style="margin-right: 0.5rem;"></i>Back</button>
      </div>
    </div>
    
    <div class="project-tabs" style="display: flex; gap: 1rem; border-bottom: 1px solid var(--border-color); margin-bottom: 2rem; overflow-x: auto; padding-bottom: 0.5rem;">
      <button class="tab-btn active" data-tab="overview" style="background:none; border:none; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; border-bottom: 2px solid var(--primary); color: var(--primary);">Overview</button>
      <button class="tab-btn" data-tab="requirements" style="background:none; border:none; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; color: var(--text-muted);">Requirements</button>
      <button class="tab-btn" data-tab="modules" style="background:none; border:none; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; color: var(--text-muted);">Modules & Tasks</button>
      ${canViewAssignments ? `<button class="tab-btn" data-tab="assignments" style="background:none; border:none; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; color: var(--text-muted);">Assignments</button>` : ''}
      <button class="tab-btn" data-tab="finance" style="background:none; border:none; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; color: var(--text-muted);">Finance</button>
      <button class="tab-btn" data-tab="github" style="background:none; border:none; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; color: var(--text-muted);">GitHub</button>
    </div>

    <div class="dashboard-content">
      
      <!-- OVERVIEW TAB -->
      <div id="tab-overview" class="tab-content" style="display: block;">
        <div id="project-info" class="card-panel" style="margin-bottom: 2rem; display: none;">
          <div class="project-form-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; row-gap: 2rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
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
      </div>
      
      <!-- REQUIREMENTS TAB -->
      <div id="tab-requirements" class="tab-content" style="display: none;">
        <div class="card-panel">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h3 style="margin-bottom: 0;">Client Requirements</h3>
            ${permissions.includes('project.client_requirements.create') ? `
              <button id="btn-add-requirement" class="btn btn-sm btn-primary shadow-hover"><i class="fa fa-plus"></i> Add</button>
            ` : ''}
          </div>
          
          <div id="requirements-form-container" style="display:none; margin-bottom: 1.5rem; padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px;">
            <form id="form-requirement" style="display: flex; flex-direction: column; gap: 1rem;">
              <input type="text" name="title" placeholder="Requirement Title" class="premium-input" required />
              <textarea name="description" placeholder="Description..." class="premium-input" rows="3" required></textarea>
              <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                <button type="button" id="btn-cancel-req" class="btn btn-outline btn-sm">Cancel</button>
                <button type="submit" class="btn btn-primary btn-sm">Save</button>
              </div>
            </form>
          </div>

          <div id="requirements-list" style="display: flex; flex-direction: column; gap: 1rem;">
            <div class="spinner" style="border-top-color: var(--primary); margin: 20px auto; display: block; width: 24px; height: 24px;"></div>
          </div>
        </div>
      </div>

      <!-- MODULES & TASKS TAB -->
      <div id="tab-modules" class="tab-content" style="display: none;">
        <div class="card-panel">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h3 style="margin-bottom: 0;">Modules & Tasks</h3>
            ${permissions.includes('project.module.create') ? `
              <button id="btn-add-module" class="btn btn-sm btn-primary shadow-hover"><i class="fa fa-plus"></i> Add Module</button>
            ` : ''}
          </div>
          
          <div id="module-form-container" style="display:none; margin-bottom: 1.5rem; padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px;">
            <form id="form-module" style="display: flex; flex-direction: column; gap: 1rem;">
              <input type="text" name="name" placeholder="Module Name" class="premium-input" required />
              <textarea name="description" placeholder="Description..." class="premium-input" rows="2"></textarea>
              <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                <button type="button" id="btn-cancel-module" class="btn btn-outline btn-sm">Cancel</button>
                <button type="submit" class="btn btn-primary btn-sm">Save Module</button>
              </div>
            </form>
          </div>

          <div id="modules-list" style="display: flex; flex-direction: column; gap: 1rem;">
            <div class="spinner" style="border-top-color: var(--primary); margin: 20px auto; display: block; width: 24px; height: 24px;"></div>
          </div>
        </div>
      </div>

      <!-- ASSIGNMENTS TAB -->
      <div id="tab-assignments" class="tab-content" style="display: none;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
          ${permissions.includes('project.assign_faculty') ? `
          <div class="card-panel">
            <h3 style="margin-bottom: 1.25rem; font-size: 1.2rem;">Assign Faculty</h3>
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
            <h3 style="margin-bottom: 1.25rem; font-size: 1.2rem;">Assign Student</h3>
            <form id="form-assign-student" style="display: flex; flex-direction: column; gap: 1rem;">
              <div class="autocomplete-container">
                <input type="text" id="student-search" placeholder="Type student name..." class="premium-input" autocomplete="off" />
                <input type="hidden" name="student_id" id="student-id" required />
                <div id="student-results" class="autocomplete-results"></div>
              </div>
              <input type="text" name="designation" placeholder="Designation (optional)" class="premium-input" />
              <button type="submit" class="btn btn-primary shadow-hover" style="align-self: flex-start; padding: 0.6rem 1.5rem;">Assign Student</button>
            </form>
            <p id="msg-student" style="margin-top: 1rem; font-size: 0.95rem; font-weight: 500;"></p>
          </div>
          ` : ''}
        </div>
      </div>

      <!-- FINANCE TAB -->
      <div id="tab-finance" class="tab-content" style="display: none;">
        <div class="card-panel">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h3 style="margin-bottom: 0;">Finance Summary</h3>
          </div>
          
          <div id="finance-summary-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
            <div style="padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; text-align: center; background: var(--bg-surface);">
              <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase;">Total Budget</span>
              <strong id="fin-total" style="display: block; font-size: 1.5rem; margin-top: 0.5rem;">-</strong>
            </div>
            <div style="padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; text-align: center; background: var(--bg-surface);">
              <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase;">Amount Received</span>
              <strong id="fin-received" style="display: block; font-size: 1.5rem; margin-top: 0.5rem; color: #10b981;">-</strong>
            </div>
            <div style="padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; text-align: center; background: var(--bg-surface);">
              <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase;">Amount Remaining</span>
              <strong id="fin-remaining" style="display: block; font-size: 1.5rem; margin-top: 0.5rem; color: #ef4444;">-</strong>
            </div>
          </div>

          <h4 style="margin-bottom: 1rem;">Payment History</h4>
          <div id="finance-payments-list" style="display: flex; flex-direction: column; gap: 1rem;">
            <div class="spinner" style="border-top-color: var(--primary); margin: 20px auto; display: block; width: 24px; height: 24px;"></div>
          </div>
        </div>
      </div>

      <!-- GITHUB TAB -->
      <div id="tab-github" class="tab-content" style="display: none;">
        <div class="card-panel">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h3 style="margin-bottom: 0;">GitHub Integration</h3>
            ${permissions.includes('project.github.link') ? `
              <button class="btn btn-sm btn-primary shadow-hover" id="btn-link-github"><i class="fa fa-github"></i> Link Repository</button>
            ` : ''}
          </div>
          
          <div style="padding: 1.5rem; border: 1px dashed var(--border-color); border-radius: 8px; text-align: center; background: var(--bg-surface); margin-bottom: 2rem;">
            <i class="fa fa-github" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
            <h4 style="margin-bottom: 0.5rem;">No Repository Linked</h4>
            <p style="color: var(--text-muted); font-size: 0.95rem;">Connect a GitHub repository to track commits, pull requests, and code progress directly from the ERP.</p>
          </div>
        </div>
      </div>

    </div>
  `;

  // Tab switching logic
  const tabBtns = container.querySelectorAll('.tab-btn');
  const tabContents = container.querySelectorAll('.tab-content');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');

      // Update buttons
      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.style.borderBottom = 'none';
        b.style.color = 'var(--text-muted)';
      });
      btn.classList.add('active');
      btn.style.borderBottom = '2px solid var(--primary)';
      btn.style.color = 'var(--primary)';

      // Update contents
      tabContents.forEach(content => {
        content.style.display = 'none';
      });
      const targetContent = container.querySelector('#tab-' + targetId);
      if (targetContent) targetContent.style.display = 'block';
    });
  });

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

        // Render current assignments
        if (canViewAssignments) {
          const tabAssignments = container.querySelector('#tab-assignments > div');
          if (tabAssignments) {
            // Check if lists exist
            let facultyList = container.querySelector('#current-faculty-list');
            if (!facultyList) {
              facultyList = document.createElement('div');
              facultyList.id = 'current-faculty-list';
              facultyList.className = 'card-panel';
              facultyList.innerHTML = '<h3 style="margin-bottom: 1.25rem; font-size: 1.2rem;">Current Faculty</h3><div class="list-container" style="display:flex; flex-direction:column; gap:0.5rem;"></div>';
              tabAssignments.appendChild(facultyList);
            }
            const fListContainer = facultyList.querySelector('.list-container');
            fListContainer.innerHTML = (p.faculty && p.faculty.length > 0) ? p.faculty.map(f => `
              <div style="display:flex; justify-content:space-between; align-items:center; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 6px;">
                <div><strong>${f.name}</strong> <span style="color:var(--text-muted); font-size: 0.85rem;">(${f.email})</span></div>
                <span style="font-size: 0.85rem; color: var(--text-muted);">Assigned: ${f.pivot.assigned_date || 'N/A'}</span>
              </div>
            `).join('') : '<p style="color:var(--text-muted);">No faculty assigned yet.</p>';

            let studentList = container.querySelector('#current-student-list');
            if (!studentList) {
              studentList = document.createElement('div');
              studentList.id = 'current-student-list';
              studentList.className = 'card-panel';
              studentList.innerHTML = '<h3 style="margin-bottom: 1.25rem; font-size: 1.2rem;">Current Students</h3><div class="list-container" style="display:flex; flex-direction:column; gap:0.5rem;"></div>';
              tabAssignments.appendChild(studentList);
            }
            const sListContainer = studentList.querySelector('.list-container');
            sListContainer.innerHTML = (p.students && p.students.length > 0) ? p.students.map(s => `
              <div style="display:flex; justify-content:space-between; align-items:center; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 6px;">
                <div>
                  <strong>${s.name}</strong> 
                  <span class="status-badge" style="margin-left: 0.5rem; font-size: 0.75rem;">${(s.pivot.role || 'Member').replace('_', ' ')}</span>
                </div>
                <span style="font-size: 0.85rem; color: var(--text-muted);">Assigned: ${s.pivot.assigned_date || 'N/A'}</span>
              </div>
            `).join('') : '<p style="color:var(--text-muted);">No students assigned yet.</p>';
          }
        }

        // Render Modules & Tasks
        const modContainer = container.querySelector('#modules-list');
        if (modContainer) {
          if (p.modules && p.modules.length > 0) {
            modContainer.innerHTML = p.modules.map(m => `
              <div class="module-card" style="border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem; margin-bottom: 1rem; background: var(--bg-surface);">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem; margin-bottom: 1rem;">
                  <div>
                    <h4 style="margin: 0; font-size: 1.1rem;">${m.name}</h4>
                    <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: var(--text-muted);">${m.description || ''}</p>
                  </div>
                  ${permissions.includes('project.task.create') ? `<button class="btn btn-sm btn-outline btn-add-task" data-module-id="${m.id}"><i class="fa fa-plus"></i> Task</button>` : ''}
                </div>
                
                <div class="tasks-list" style="display: flex; flex-direction: column; gap: 0.5rem;">
                  ${(m.tasks && m.tasks.length > 0) ? m.tasks.map(t => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--bg-body); border-radius: 6px;">
                      <div>
                        <strong style="display: block;">${t.title}</strong>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">Priority: ${t.priority || 'medium'}</span>
                      </div>
                      <div style="display: flex; align-items: center; gap: 1rem;">
                        <span class="status-badge ${t.status.toLowerCase().replace(' ', '-')}">${t.status}</span>
                        ${permissions.includes('project.task.update') ? `
                          <select class="premium-input task-status-select" data-task-id="${t.id}" style="padding: 0.25rem 0.5rem; width: auto;">
                            <option value="To Do" ${t.status === 'To Do' ? 'selected' : ''}>To Do</option>
                            <option value="In Progress" ${t.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="Completed" ${t.status === 'Completed' ? 'selected' : ''}>Completed</option>
                            <option value="Blocked" ${t.status === 'Blocked' ? 'selected' : ''}>Blocked</option>
                          </select>
                        ` : ''}
                      </div>
                    </div>
                  `).join('') : '<p style="color:var(--text-muted); font-size: 0.9rem;">No tasks created for this module.</p>'}
                </div>
              </div>
            `).join('');

            // Bind Task Status updates
            modContainer.querySelectorAll('.task-status-select').forEach(select => {
              select.addEventListener('change', async (e) => {
                const taskId = e.target.getAttribute('data-task-id');
                const newStatus = e.target.value;
                try {
                  const t = localStorage.getItem('token');
                  await fetch(`http://127.0.0.1:8000/api/projects/tasks/${taskId}/status`, {
                    method: 'PATCH',
                    headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                  });
                  loadProject();
                } catch (err) { }
              });
            });

            // Bind Add Task buttons
            modContainer.querySelectorAll('.btn-add-task').forEach(btn => {
              btn.addEventListener('click', async (e) => {
                const moduleId = e.target.closest('button').getAttribute('data-module-id');
                const title = prompt('Enter Task Title:');
                if (title) {
                  try {
                    const t = localStorage.getItem('token');
                    await fetch(`http://127.0.0.1:8000/api/projects/modules/${moduleId}/tasks`, {
                      method: 'POST',
                      headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' },
                      body: JSON.stringify({ title, priority: 'medium' })
                    });
                    loadProject();
                  } catch (err) { }
                }
              });
            });
          } else {
            modContainer.innerHTML = '<p style="color:var(--text-muted);">No modules created yet.</p>';
          }
        }

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

  // Requirements Logic
  const loadRequirements = async () => {
    const list = container.querySelector('#requirements-list');
    if (!list) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/projects/${projectId}/requirements`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await response.json();

      if (data.status === 'success') {
        const reqs = data.data;
        if (reqs.length === 0) {
          list.innerHTML = '<p style="color:var(--text-muted);">No requirements documented yet.</p>';
        } else {
          list.innerHTML = reqs.map(r => `
            <div style="padding: 1rem; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-surface);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                <h4 style="margin: 0;">${r.title}</h4>
                <span class="status-badge ${r.status}">${r.status || 'new'}</span>
              </div>
              <p style="margin: 0; color: var(--text-muted); font-size: 0.95rem; line-height: 1.5;">${r.description}</p>
              <div style="margin-top: 0.75rem; font-size: 0.8rem; color: var(--text-muted);">
                Added: ${new Date(r.created_at).toLocaleDateString()}
              </div>
            </div>
          `).join('');
        }
      }
    } catch (err) {
      console.error(err);
      list.innerHTML = '<p style="color:red;">Error loading requirements</p>';
    }
  };

  const btnAddReq = container.querySelector('#btn-add-requirement');
  const reqFormContainer = container.querySelector('#requirements-form-container');
  const btnCancelReq = container.querySelector('#btn-cancel-req');
  const formReq = container.querySelector('#form-requirement');

  if (btnAddReq && reqFormContainer) {
    btnAddReq.addEventListener('click', () => {
      reqFormContainer.style.display = 'block';
      btnAddReq.style.display = 'none';
    });
    btnCancelReq.addEventListener('click', () => {
      reqFormContainer.style.display = 'none';
      btnAddReq.style.display = 'inline-block';
      formReq.reset();
    });
    formReq.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const token = localStorage.getItem('token');
        const formData = new FormData(formReq);
        const response = await fetch(`http://127.0.0.1:8000/api/projects/${projectId}/requirements`, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(Object.fromEntries(formData.entries()))
        });
        if (response.ok) {
          reqFormContainer.style.display = 'none';
          btnAddReq.style.display = 'inline-block';
          formReq.reset();
          loadRequirements();
        } else {
          alert('Failed to save requirement');
        }
      } catch (err) {
        console.error(err);
        alert('Error saving requirement');
      }
    });
  }

  // Module Logic
  const btnAddModule = container.querySelector('#btn-add-module');
  const modFormContainer = container.querySelector('#module-form-container');
  const btnCancelModule = container.querySelector('#btn-cancel-module');
  const formModule = container.querySelector('#form-module');

  if (btnAddModule && modFormContainer) {
    btnAddModule.addEventListener('click', () => {
      modFormContainer.style.display = 'block';
      btnAddModule.style.display = 'none';
    });
    btnCancelModule.addEventListener('click', () => {
      modFormContainer.style.display = 'none';
      btnAddModule.style.display = 'inline-block';
      formModule.reset();
    });
    formModule.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const token = localStorage.getItem('token');
        const formData = new FormData(formModule);
        const response = await fetch(`http://127.0.0.1:8000/api/projects/${projectId}/modules`, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(Object.fromEntries(formData.entries()))
        });
        if (response.ok) {
          modFormContainer.style.display = 'none';
          btnAddModule.style.display = 'inline-block';
          formModule.reset();
          loadProject();
        } else {
          alert('Failed to save module');
        }
      } catch (err) {
        console.error(err);
        alert('Error saving module');
      }
    });
  }

  // Finance Logic
  const loadFinance = async () => {
    const totalEl = container.querySelector('#fin-total');
    const recEl = container.querySelector('#fin-received');
    const remEl = container.querySelector('#fin-remaining');
    const list = container.querySelector('#finance-payments-list');
    if (!list) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/finance/projects/${projectId}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await response.json();

      if (response.ok && data && !data.error) {
        totalEl.textContent = `$${data.total_amount || 0}`;
        recEl.textContent = `$${data.payments_received || 0}`;
        remEl.textContent = `$${data.amount_remaining || 0}`;

        if (data.payments && data.payments.length > 0) {
          list.innerHTML = data.payments.map(p => `
            <div style="padding: 1rem; border: 1px solid var(--border-color); border-radius: 6px; display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface);">
              <div>
                <strong>${p.description || 'Payment'}</strong>
                <span style="display: block; font-size: 0.85rem; color: var(--text-muted);">${p.date || ''}</span>
              </div>
              <div style="text-align: right;">
                <strong style="display: block; font-size: 1.1rem; color: ${p.status === 'Confirmed' ? '#10b981' : 'var(--text-main)'};">$${p.amount}</strong>
                <span class="status-badge ${p.status ? p.status.toLowerCase() : 'pending'}" style="font-size: 0.75rem;">${p.status || 'Pending'}</span>
              </div>
            </div>
          `).join('');
        } else {
          list.innerHTML = '<p style="color:var(--text-muted);">No payment history found.</p>';
        }
      } else {
        list.innerHTML = '<p style="color:var(--text-muted);">No finance tracking records found for this project.</p>';
        totalEl.textContent = '-';
        recEl.textContent = '-';
        remEl.textContent = '-';
      }
    } catch (err) {
      console.error(err);
      list.innerHTML = '<p style="color:red;">Error loading finance records.</p>';
    }
  };

  // Load requirements on tab switch
  container.querySelector('[data-tab="requirements"]').addEventListener('click', () => {
    loadRequirements();
  });

  // Load finance on tab switch
  container.querySelector('[data-tab="finance"]').addEventListener('click', () => {
    loadFinance();
  });

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
          loadProject();
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
          loadProject();
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
