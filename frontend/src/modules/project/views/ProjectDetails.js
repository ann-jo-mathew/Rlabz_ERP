import { authStore } from '@/core/stores/auth.js';
import { showFacultySuccessPopup } from '@/modules/faculty/facultyPopup.js';

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
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        ${permissions.includes('project.close') ? '<button class="btn btn-warning shadow-hover" id="btn-close-project" style="display:none;"><i class="fa fa-times-circle" style="margin-right: 0.5rem;"></i>Close Project</button>' : ''}
        <button id="btn-back" class="btn-back-nav" title="Return to Projects">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Back to Projects</span>
        </button>
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
          <div class="project-form-grid" style="row-gap: 2rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
            <div>
              <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 0.25rem;">Type</span>
              <strong id="val-type" style="font-size: 1.1rem; color: var(--text-main);"></strong>
            </div>
            <div>
              <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 0.25rem;">Client</span>
              <strong id="val-client" style="font-size: 1.1rem; color: var(--text-main);"></strong>
            </div>
            <div>
              <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 0.5rem;">Status</span>
              <span id="val-status"></span>
            </div>
            <div>
              <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 0.25rem;">Budget</span>
              <strong style="font-size: 1.1rem; color: var(--text-main);">₹<span id="val-budget"></span></strong>
            </div>
            <div>
              <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 0.25rem;">Start Date</span>
              <strong id="val-start" style="font-size: 1.1rem; color: var(--text-main);"></strong>
            </div>
            <div>
              <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 0.25rem;">End Date</span>
              <strong id="val-end" style="font-size: 1.1rem; color: var(--text-main);"></strong>
            </div>
          </div>
          <div style="margin-top: 2rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
            <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 0.5rem;">Description</span>
            <p id="val-desc" style="font-size: 1rem; color: var(--text-main); line-height: 1.6;"></p>
          </div>
          <div style="margin-top: 2rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
            <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 0.75rem;">Students Working in Project</span>
            <div id="overview-students-list" style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
              <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0; font-style: italic;">Loading students...</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- REQUIREMENTS TAB -->
      <div id="tab-requirements" class="tab-content" style="display: none;">
        <div class="card-panel">
          <h3 style="margin: 0 0 0.5rem; font-size: 1.15rem; font-weight: 700; color: var(--text-main);">Project Requirements</h3>
          <p style="margin: 0 0 1rem; font-size: 0.85rem; color: var(--text-muted);">Requirements documented directly in the project table.</p>
          <div style="padding: 1.25rem; background: var(--bg-surface, #f8fafc); border: 1px solid var(--border-color, #e2e8f0); border-radius: 8px;">
            <p id="val-project-requirements" style="margin: 0; font-size: 0.95rem; color: var(--text-main, #0f172a); line-height: 1.6; white-space: pre-wrap;">Loading requirements...</p>
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
          </div>
          
          <div id="github-content-area">
            <div class="spinner" style="border-top-color: var(--primary); margin: 30px auto; display: block; width: 28px; height: 28px;"></div>
          </div>
        </div>
      </div>

    </div>

    <!-- ADD TASK MODAL -->
    <div id="modal-add-task" style="display: none; position: fixed; inset: 0; background: rgba(0, 0, 0, 0.55); z-index: 9999; align-items: center; justify-content: center; backdrop-filter: blur(2px);">
      <div style="background: var(--bg-surface, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; width: 92%; max-width: 500px; padding: 1.75rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15); animation: fadeIn 0.2s ease;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--text-main);">Add New Task</h3>
          <button type="button" id="btn-close-task-modal" style="background: none; border: none; font-size: 1.4rem; color: var(--text-muted); cursor: pointer; line-height: 1;">&times;</button>
        </div>
        <p id="task-modal-module-title" style="margin: 0 0 1.25rem; font-size: 0.88rem; color: var(--primary); font-weight: 600;"></p>
        
        <form id="form-create-task" style="display: flex; flex-direction: column; gap: 1rem;">
          <input type="hidden" id="task-modal-module-id" />
          <div>
            <label style="display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.35rem; color: var(--text-main);">Task Title <span style="color: #ef4444;">*</span></label>
            <input type="text" id="task-input-title" class="premium-input" placeholder="e.g. Implement user login form" required style="width: 100%; box-sizing: border-box;" />
          </div>

          <div>
            <label style="display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.35rem; color: var(--text-main);">Task Description</label>
            <textarea id="task-input-desc" class="premium-input" rows="3" placeholder="Provide detailed task instructions..." style="width: 100%; box-sizing: border-box; resize: vertical;"></textarea>
          </div>

          <div>
            <label style="display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.35rem; color: var(--text-main);">Weight (Story Points / Difficulty)</label>
            <input type="number" id="task-input-weight" class="premium-input" min="1" max="100" value="1" placeholder="1" style="width: 100%; box-sizing: border-box;" />
            <small style="color: var(--text-muted); font-size: 0.75rem; display: block; margin-top: 0.25rem;">Relative weight or difficulty score (default: 1)</small>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color);">
            <button type="button" id="btn-cancel-task-modal" class="btn btn-outline btn-sm">Cancel</button>
            <button type="submit" id="btn-submit-task" class="btn btn-primary btn-sm shadow-hover">Add Task</button>
          </div>
        </form>
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
      const pathParts = route.path.split('/').filter(Boolean);
      pathParts.pop(); 
      const basePath = '/' + pathParts.join('/');
      router.push(basePath || (authStore.role === 'faculty' ? '/faculty/projects' : '/dashboard/projects'));
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
        const rawTitle = p.title || 'Project Details';
        const cleanTitle = rawTitle.replace(/Student Portal/gi, 'Modules & Tasks').replace(/student portal/gi, 'Modules & Tasks');
        container.querySelector('#project-title').textContent = cleanTitle;
        container.querySelector('#val-type').textContent = p.project_type || 'N/A';
        container.querySelector('#val-client').textContent = p.client_name || 'N/A';
        const statusSpan = container.querySelector('#val-status');
        statusSpan.textContent = p.status || 'N/A';
        statusSpan.className = `status-badge ${p.status || 'active'}`;
        container.querySelector('#val-budget').textContent = p.budget || '0.00';
        container.querySelector('#val-start').textContent = p.start_date || 'N/A';
        container.querySelector('#val-end').textContent = p.end_date || 'N/A';
        container.querySelector('#val-desc').textContent = p.deliverables || p.description || 'No deliverables provided.';

        const projReqEl = container.querySelector('#val-project-requirements');
        if (projReqEl) {
          projReqEl.textContent = p.requirements || 'No requirements documented in project table.';
        }

        // Render Students Working in Project in Overview Tab
        const overviewStudentsContainer = container.querySelector('#overview-students-list');
        if (overviewStudentsContainer) {
          if (p.students && p.students.length > 0) {
            overviewStudentsContainer.innerHTML = p.students.map(s => {
              const des = s.student_profile?.designation || s.studentProfile?.designation || s.designation || 'Student';
              const formattedDes = String(des).charAt(0).toUpperCase() + String(des).slice(1);
              return `
                <div style="display: inline-flex; align-items: center; gap: 0.65rem; padding: 0.55rem 0.95rem; background: var(--bg-body, #f8fafc); border: 1px solid var(--border-color, #e2e8f0); border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.03);">
                  <div style="width: 32px; height: 32px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #475569; font-size: 0.85rem;">
                    ${(s.name || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <strong style="display: block; font-size: 0.92rem; color: var(--text-main, #0f172a);">${s.name}</strong>
                    <span style="font-size: 0.78rem; color: var(--text-muted, #64748b);">${s.email || ''}</span>
                  </div>
                  <span class="status-badge" style="font-size: 0.75rem; padding: 0.2rem 0.6rem; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; border-radius: 6px; font-weight: 700; margin-left: 0.25rem;">
                    ${formattedDes}
                  </span>
                </div>
              `;
            }).join('');
          } else {
            overviewStudentsContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem; margin: 0; font-style: italic;">No students currently assigned to this project.</p>';
          }
        }
        
        // Render GitHub repo if present
        if (p.github_repository) {
          renderGithub(p.github_repository);
        }
        
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
        const canBlock = (role === 'faculty' || role === 'coordinator' || role === 'director');

        if (modContainer) {
          if (p.modules && p.modules.length > 0) {
            modContainer.innerHTML = p.modules.map(m => {
              const moduleName = m.module_name || m.name || 'Module';
              const mStatus = (m.status || 'not_started').toLowerCase();
              const isModBlocked = mStatus === 'blocked';

              return `
                <div class="module-card" style="border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem; margin-bottom: 1rem; background: var(--bg-surface);">
                  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;">
                    <div>
                      <div style="display: flex; align-items: center; gap: 0.6rem;">
                        <h4 style="margin: 0; font-size: 1.1rem;">${moduleName}</h4>
                        <span class="status-badge ${mStatus.replace(' ', '_')}" style="font-size: 0.72rem; padding: 0.15rem 0.5rem;">${m.status || 'not started'}</span>
                      </div>
                      <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: var(--text-muted);">${m.description || ''}</p>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      ${canBlock ? `
                        <button class="btn btn-sm btn-outline btn-toggle-module-block" data-module-id="${m.id}" data-current-status="${mStatus}" style="font-size: 0.78rem; padding: 0.3rem 0.65rem; ${isModBlocked ? 'border-color: #10b981; color: #10b981;' : 'border-color: #ef4444; color: #ef4444;'}">
                          ${isModBlocked ? '<i class="fa fa-unlock" style="margin-right: 0.25rem;"></i> Unblock Module' : '<i class="fa fa-ban" style="margin-right: 0.25rem;"></i> Block Module'}
                        </button>
                      ` : ''}
                      ${permissions.includes('project.task.create') ? `<button class="btn btn-sm btn-outline btn-add-task" data-module-id="${m.id}"><i class="fa fa-plus"></i> Task</button>` : ''}
                    </div>
                  </div>
                  
                  <div class="tasks-list" style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${(m.tasks && m.tasks.length > 0) ? m.tasks.map(t => {
                      const tStatus = (t.status || 'todo').toLowerCase();
                      const isTaskBlocked = tStatus === 'blocked';

                      return `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.85rem 1rem; background: var(--bg-body); border-radius: 6px; border: 1px solid var(--border-color, #e2e8f0); flex-wrap: wrap; gap: 0.75rem;">
                          <div style="flex: 1; min-width: 220px; padding-right: 1rem;">
                            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                              <strong style="font-size: 0.95rem; color: var(--text-main);">${t.title}</strong>
                              <span style="font-size: 0.75rem; background: #e0f2fe; color: #0284c7; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 600;">Weight: ${t.weight || 1}</span>
                            </div>
                            ${t.description ? `<p style="margin: 0.35rem 0 0 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">${t.description}</p>` : ''}
                          </div>
                          <div style="display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0;">
                            <span class="status-badge ${tStatus.replace(' ', '-')}">${t.status || 'todo'}</span>
                            ${canBlock ? `
                              <button class="btn btn-sm btn-outline btn-toggle-task-block" data-task-id="${t.id}" data-current-status="${tStatus}" title="${isTaskBlocked ? 'Unblock Task' : 'Block Task'}" style="font-size: 0.75rem; padding: 0.25rem 0.55rem; ${isTaskBlocked ? 'border-color: #10b981; color: #10b981;' : 'border-color: #ef4444; color: #ef4444;'}">
                                ${isTaskBlocked ? '<i class="fa fa-unlock"></i> Unblock' : '<i class="fa fa-ban"></i> Block'}
                              </button>
                            ` : ''}
                          </div>
                        </div>
                      `;
                    }).join('') : '<p style="color:var(--text-muted); font-size: 0.9rem; margin: 0.25rem 0;">No tasks created for this module.</p>'}
                  </div>
                </div>
              `;
            }).join('');

            // Bind Module Block / Unblock buttons
            modContainer.querySelectorAll('.btn-toggle-module-block').forEach(btn => {
              btn.addEventListener('click', async (e) => {
                const buttonEl = e.target.closest('button');
                const moduleId = buttonEl.getAttribute('data-module-id');
                const currentStatus = buttonEl.getAttribute('data-current-status');
                const nextStatus = currentStatus === 'blocked' ? 'in_progress' : 'blocked';
                const actionLabel = currentStatus === 'blocked' ? 'unblock' : 'block';

                if (!confirm(`Are you sure you want to ${actionLabel} this module?`)) return;

                buttonEl.disabled = true;
                try {
                  const token = localStorage.getItem('token');
                  const res = await fetch(`http://127.0.0.1:8000/api/projects/modules/${moduleId}/status`, {
                    method: 'PATCH',
                    headers: {
                      'Authorization': 'Bearer ' + token,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: nextStatus })
                  });
                  const resData = await res.json();
                  if (res.ok) {
                    showFacultySuccessPopup(
                      currentStatus === 'blocked' ? 'Module Unblocked' : 'Module Blocked',
                      `Module status has been updated to ${nextStatus}.`
                    );
                    loadProject();
                  } else {
                    alert(resData.error || 'Failed to update module status.');
                    buttonEl.disabled = false;
                  }
                } catch (err) {
                  console.error(err);
                  alert('Error updating module status.');
                  buttonEl.disabled = false;
                }
              });
            });

            // Bind Task Block / Unblock buttons
            modContainer.querySelectorAll('.btn-toggle-task-block').forEach(btn => {
              btn.addEventListener('click', async (e) => {
                const buttonEl = e.target.closest('button');
                const taskId = buttonEl.getAttribute('data-task-id');
                const currentStatus = buttonEl.getAttribute('data-current-status');
                const nextStatus = currentStatus === 'blocked' ? 'todo' : 'blocked';
                const actionLabel = currentStatus === 'blocked' ? 'unblock' : 'block';

                if (!confirm(`Are you sure you want to ${actionLabel} this task?`)) return;

                buttonEl.disabled = true;
                try {
                  const token = localStorage.getItem('token');
                  const res = await fetch(`http://127.0.0.1:8000/api/projects/tasks/${taskId}/status`, {
                    method: 'PATCH',
                    headers: {
                      'Authorization': 'Bearer ' + token,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: nextStatus })
                  });
                  const resData = await res.json();
                  if (res.ok) {
                    showFacultySuccessPopup(
                      currentStatus === 'blocked' ? 'Task Unblocked' : 'Task Blocked',
                      `Task status has been updated to ${nextStatus}.`
                    );
                    loadProject();
                  } else {
                    alert(resData.error || 'Failed to update task status.');
                    buttonEl.disabled = false;
                  }
                } catch (err) {
                  console.error(err);
                  alert('Error updating task status.');
                  buttonEl.disabled = false;
                }
              });
            });
            
            // Bind Add Task buttons to open modal
            const taskModal = container.querySelector('#modal-add-task');
            const modalModuleId = container.querySelector('#task-modal-module-id');
            const modalModuleTitle = container.querySelector('#task-modal-module-title');
            const taskInputTitle = container.querySelector('#task-input-title');
            const taskInputDesc = container.querySelector('#task-input-desc');
            const taskInputWeight = container.querySelector('#task-input-weight');

            modContainer.querySelectorAll('.btn-add-task').forEach(btn => {
              btn.addEventListener('click', (e) => {
                const buttonEl = e.target.closest('button');
                const moduleId = buttonEl.getAttribute('data-module-id');
                const moduleCard = buttonEl.closest('.module-card');
                const modTitle = moduleCard ? (moduleCard.querySelector('h4')?.textContent || 'Module') : 'Module';

                if (taskModal) {
                  modalModuleId.value = moduleId;
                  modalModuleTitle.textContent = `Adding task for module: ${modTitle}`;
                  taskInputTitle.value = '';
                  taskInputDesc.value = '';
                  taskInputWeight.value = '1';
                  taskModal.style.display = 'flex';
                  setTimeout(() => taskInputTitle.focus(), 50);
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

  // GitHub Repository Logic
  const renderGithub = (repo) => {
    const ghContainer = container.querySelector('#github-content-area');
    if (!ghContainer) return;

    if (!repo) {
      ghContainer.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
          <div style="width: 54px; height: 54px; margin: 0 auto 1rem; border-radius: 12px; background: #0f172a; display: flex; align-items: center; justify-content: center; color: #fff;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </div>
          <h4 style="margin-bottom: 0.5rem; color: var(--text-main);">No GitHub Repository Linked</h4>
          <p style="font-size: 0.9rem; max-width: 400px; margin: 0 auto;">No repository details have been submitted for this project yet.</p>
        </div>
      `;
      return;
    }

    const repoUrl = repo.repository_url ? (repo.repository_url.startsWith('http') ? repo.repository_url : `https://${repo.repository_url}`) : '#';
    const submittedDate = repo.submitted_date ? new Date(repo.submitted_date).toLocaleDateString() : (repo.created_at ? new Date(repo.created_at).toLocaleDateString() : 'N/A');

    const isVerified = Boolean(repo.is_verified);
    const canVerify = (role === 'faculty' || role === 'coordinator' || role === 'director');

    ghContainer.innerHTML = `
      <div style="padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 12px; background: var(--bg-surface); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1.25rem;">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <div style="width: 48px; height: 48px; border-radius: 10px; background: #0f172a; display: flex; align-items: center; justify-content: center; color: #ffffff; flex-shrink: 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
                <h3 style="margin: 0; font-size: 1.2rem; font-weight: 700; color: var(--text-main);">${repo.repository_name || 'Project Repository'}</h3>
                ${isVerified 
                  ? '<span class="status-badge active" style="font-size: 0.75rem; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 0.25rem 0.65rem; border-radius: 6px; font-weight: 600;"><i class="fa fa-check-circle" style="margin-right: 0.35rem;"></i>Verified</span>' 
                  : '<span class="status-badge pending" style="font-size: 0.75rem; padding: 0.25rem 0.65rem; border-radius: 6px; font-weight: 600;">Pending Verification</span>'
                }
              </div>
              <a href="${repoUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 0.35rem; color: var(--primary); font-size: 0.88rem; font-weight: 500; text-decoration: none; margin-top: 0.3rem; word-break: break-all;">
                <span>${repo.repository_url || 'No URL specified'}</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 0.75rem;">
            ${(!isVerified && canVerify) ? `
              <button type="button" id="btn-verify-github" class="btn btn-sm btn-primary shadow-hover" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.45rem 1rem; font-size: 0.85rem; font-weight: 600;">
                <i class="fa fa-check"></i> Verify Repository
              </button>
            ` : ''}
            <a href="${repoUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.95rem; font-size: 0.85rem; font-weight: 600;">
              Visit Repository ↗
            </a>
          </div>
        </div>

        <div style="display: flex; gap: 2rem; flex-wrap: wrap; padding-top: 0.25rem;">
          <div>
            <span style="font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 0.25rem;">Submitted Date</span>
            <span style="font-size: 0.95rem; font-weight: 500; color: var(--text-main);">${submittedDate}</span>
          </div>
          <div>
            <span style="font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 0.25rem;">Verification Status</span>
            <span style="font-size: 0.95rem; font-weight: 600; color: ${isVerified ? '#059669' : '#b45309'};">${isVerified ? 'Verified by Faculty' : 'Awaiting Faculty Verification'}</span>
          </div>
        </div>
      </div>
    `;

    const btnVerify = ghContainer.querySelector('#btn-verify-github');
    if (btnVerify) {
      btnVerify.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to verify this GitHub repository?')) return;
        btnVerify.disabled = true;
        btnVerify.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Verifying...';

        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://127.0.0.1:8000/api/projects/${projectId}/github/verify`, {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + token,
              'Content-Type': 'application/json'
            }
          });
          const resData = await response.json();
          if (response.ok && resData.status === 'success') {
            showFacultySuccessPopup(
              'GitHub Repository Verified',
              `The repository "${repo.repository_name || 'Project Repository'}" has been successfully verified.`
            );
            renderGithub(resData.data);
          } else {
            alert(resData.error || 'Failed to verify repository.');
            btnVerify.disabled = false;
            btnVerify.innerHTML = '<i class="fa fa-check"></i> Verify Repository';
          }
        } catch (err) {
          console.error(err);
          alert('Error communicating with server.');
          btnVerify.disabled = false;
          btnVerify.innerHTML = '<i class="fa fa-check"></i> Verify Repository';
        }
      });
    }
  };

  const loadGithub = async () => {
    const ghContainer = container.querySelector('#github-content-area');
    if (!ghContainer) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/projects/${projectId}/github`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await response.json();
      if (data.status === 'success') {
        renderGithub(data.data);
      } else {
        renderGithub(null);
      }
    } catch (err) {
      console.error('Error loading GitHub info:', err);
      ghContainer.innerHTML = '<p style="color:red; font-size: 0.9rem;">Failed to fetch GitHub repository details.</p>';
    }
  };

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
          const modName = formData.get('name') || 'Module';
          formModule.reset();
          showFacultySuccessPopup(
            'Module Created',
            `Module "${modName}" was created successfully.`
          );
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

  // Task Modal Submit & Close Logic
  const taskModal = container.querySelector('#modal-add-task');
  const btnCloseTaskModal = container.querySelector('#btn-close-task-modal');
  const btnCancelTaskModal = container.querySelector('#btn-cancel-task-modal');
  const formCreateTask = container.querySelector('#form-create-task');

  const closeTaskModal = () => {
    if (taskModal) {
      taskModal.style.display = 'none';
      if (formCreateTask) formCreateTask.reset();
    }
  };

  if (btnCloseTaskModal) btnCloseTaskModal.addEventListener('click', closeTaskModal);
  if (btnCancelTaskModal) btnCancelTaskModal.addEventListener('click', closeTaskModal);
  if (taskModal) {
    taskModal.addEventListener('click', (e) => {
      if (e.target === taskModal) closeTaskModal();
    });
  }

  if (formCreateTask) {
    formCreateTask.addEventListener('submit', async (e) => {
      e.preventDefault();
      const moduleId = container.querySelector('#task-modal-module-id').value;
      const title = container.querySelector('#task-input-title').value.trim();
      const description = container.querySelector('#task-input-desc').value.trim();
      const weightVal = container.querySelector('#task-input-weight').value.trim();
      const weight = weightVal ? parseInt(weightVal, 10) : 1;

      if (!title) {
        alert('Please enter a task title.');
        return;
      }

      const submitBtn = container.querySelector('#btn-submit-task');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Adding...';
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://127.0.0.1:8000/api/projects/modules/${moduleId}/tasks`, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title,
            description,
            weight
          })
        });

        const resData = await response.json();
        if (response.ok && (resData.status === 'success' || resData.data)) {
          closeTaskModal();
          showFacultySuccessPopup(
            'Task Added',
            `Task "${title}" was created successfully with status To Do.`
          );
          loadProject();
        } else {
          alert(resData.error || resData.message || 'Failed to add task.');
        }
      } catch (err) {
        console.error('Error adding task:', err);
        alert('Error connecting to server. Please try again.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Add Task';
        }
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
        totalEl.textContent = `₹${data.total_amount || 0}`;
        recEl.textContent = `₹${data.payments_received || 0}`;
        remEl.textContent = `₹${data.amount_remaining || 0}`;
        
        if (data.payments && data.payments.length > 0) {
          list.innerHTML = data.payments.map(p => `
            <div style="padding: 1rem; border: 1px solid var(--border-color); border-radius: 6px; display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface);">
              <div>
                <strong>${p.description || 'Payment'}</strong>
                <span style="display: block; font-size: 0.85rem; color: var(--text-muted);">${p.date || ''}</span>
              </div>
              <div style="text-align: right;">
                <strong style="display: block; font-size: 1.1rem; color: ${p.status === 'Confirmed' ? '#10b981' : 'var(--text-main)'};">₹${p.amount}</strong>
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

  // Load finance on tab switch
  const tabFinBtn = container.querySelector('[data-tab="finance"]');
  if (tabFinBtn) {
    tabFinBtn.addEventListener('click', () => {
      loadFinance();
    });
  }

  // Load GitHub on tab switch
  const tabGhBtn = container.querySelector('[data-tab="github"]');
  if (tabGhBtn) {
    tabGhBtn.addEventListener('click', () => {
      loadGithub();
    });
  }

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
