import { authStore } from '@/core/stores/auth.js';
import { showFacultySuccessPopup } from '@/modules/faculty/facultyPopup.js';
import { API_BASE } from '@/core/config/api.js';

export async function ProjectDetails(route, router) {
  const container = document.createElement('div');
  container.className = 'project-details animate-fade-in';
  
  const projectId = route.params.id;
  const permissions = authStore.permissions || [];
  const role = authStore.role || 'student'; // default safely

  // Helper to determine if permissions allow actions
  const canViewAssignments = role === 'director' || role === 'coordinator';
  const canCreateTask = permissions.includes('project.task.create') || role === 'faculty' || role === 'coordinator' || role === 'director';
  const canCreateModule = permissions.includes('project.module.create') || role === 'faculty' || role === 'coordinator' || role === 'director';
  
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
    
    <div class="project-tabs">
      <button class="project-tab-btn active" data-tab="overview">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        <span>Overview</span>
      </button>
      <button class="project-tab-btn" data-tab="modules">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
        <span>Modules</span>
      </button>
      <button class="project-tab-btn" data-tab="tasks">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
        <span>Tasks</span>
      </button>
      ${canViewAssignments ? `
      <button class="project-tab-btn" data-tab="assignments">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        <span>Team</span>
      </button>` : ''}
      <button class="project-tab-btn" data-tab="finance">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 18V6"></path></svg>
        <span>Finance</span>
      </button>
      <button class="project-tab-btn" data-tab="github">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
        <span>GitHub</span>
      </button>
    </div>

    <div class="dashboard-content">
      
      <!-- OVERVIEW TAB -->
      <div id="tab-overview" class="tab-content" style="display: block;">
        <div id="project-info" style="display: none;">
          <!-- 6 Info Tiles -->
          <div class="project-info-grid">
            <div class="project-info-tile">
              <div class="project-info-icon-box emerald">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
              </div>
              <div class="project-info-text">
                <span class="project-info-label">Client / Sponsor Agency</span>
                <span class="project-info-val" id="val-client">-</span>
              </div>
            </div>

            <div class="project-info-tile">
              <div class="project-info-icon-box blue">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <div class="project-info-text">
                <span class="project-info-label">Project Timeline</span>
                <span class="project-info-val"><span id="val-start">-</span> to <span id="val-end">-</span></span>
              </div>
            </div>

            <div class="project-info-tile">
              <div class="project-info-icon-box purple">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              </div>
              <div class="project-info-text">
                <span class="project-info-label">Overall Status</span>
                <span class="project-info-val">
                  <span id="val-status"></span>
                </span>
              </div>
            </div>

            <div class="project-info-tile">
              <div class="project-info-icon-box teal">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 18V6"></path></svg>
              </div>
              <div class="project-info-text">
                <span class="project-info-label">Budget</span>
                <span class="project-info-val">₹<span id="val-budget">0.00</span></span>
              </div>
            </div>
          </div>

          <!-- Requirements Card -->
          <div class="project-section-card">
            <div class="project-section-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #2563eb;"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
              <span>Project Requirements</span>
            </div>
            <p id="val-project-requirements" class="project-section-text" style="white-space: pre-wrap;"></p>
          </div>

          <!-- Students Working in Project Card -->
          <div class="project-section-card">
            <div class="project-section-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #7c3aed;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              <span>Assigned Development Team</span>
            </div>
            <div id="overview-students-list" style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
              <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0; font-style: italic;">Loading students...</p>
            </div>
          </div>
        </div>
      </div>

      <!-- MODULES TAB (Organized like Image 1) -->
      <div id="tab-modules" class="tab-content" style="display: none;">
        <div class="assigned-modules-section">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
            <div class="section-title-box">
              <h3>Assigned Modules</h3>
              <p>Functionalities and components allocated to your development scope. Select a module to view its description.</p>
            </div>
            ${canCreateModule ? `
              <button id="btn-add-module" class="btn btn-sm btn-primary shadow-hover" style="display: inline-flex; align-items: center; gap: 0.4rem;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                <span>Add Module</span>
              </button>
            ` : ''}
          </div>
          
          <div id="module-form-container" style="display:none; margin-bottom: 1rem; padding: 1.25rem; border: 1px solid var(--border-color); border-radius: 12px; background: var(--bg-surface, #ffffff); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <form id="form-module" style="display: flex; flex-direction: column; gap: 1rem;">
              <input type="text" name="name" placeholder="Module Name (e.g. Sprint 1: Project Setup & Auth Flow)" class="premium-input" required />
              <textarea name="description" placeholder="Description of module deliverables..." class="premium-input" rows="2"></textarea>
              <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                <button type="button" id="btn-cancel-module" class="btn btn-outline btn-sm">Cancel</button>
                <button type="submit" class="btn btn-primary btn-sm">Save Module</button>
              </div>
            </form>
          </div>

          <!-- Two-column split pane matching Image 1 -->
          <div class="project-modules-pane">
            <div id="modules-list" class="modules-sidebar-list">
              <div class="spinner" style="border-top-color: var(--primary); margin: 20px auto; display: block; width: 24px; height: 24px;"></div>
            </div>
            <div id="module-tasks-pane-container">
              <!-- Rendered dynamically for selected module -->
            </div>
          </div>
        </div>
      </div>

      <!-- TASKS TAB (Organized like Image 2) -->
      <div id="tab-tasks" class="tab-content" style="display: none;">
        <div class="assigned-tasks-section">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
            <div class="section-title-box">
              <h3>Assigned Project Tasks</h3>
              <p>Comprehensive list of sprint components and responsibilities.</p>
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <span id="all-tasks-count-badge" class="student-badge student-badge-info" style="font-size: 0.8rem; padding: 0.35rem 0.85rem;">0 Total Tasks</span>
              ${canCreateTask ? `
                <button id="btn-add-task-tasks-tab" class="btn btn-sm btn-primary shadow-hover btn-add-task" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.95rem; font-size: 0.85rem;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  <span>Add Task</span>
                </button>
              ` : ''}
            </div>
          </div>

          <div class="project-table-container animate-fade-in" style="margin-top: 0; background: #ffffff; border-radius: 12px; border: 1px solid var(--border-color, #e2e8f0);">
            <table class="premium-table" style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="padding: 1rem 1.25rem; font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted);">TASK & MODULE</th>
                  <th style="padding: 1rem 1.25rem; font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted);">ASSIGNEE</th>
                  <th style="padding: 1rem 1.25rem; font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted);">STATUS</th>
                  ${canViewAssignments || role === 'faculty' || role === 'coordinator' || role === 'director' ? `<th style="padding: 1rem 1.25rem; font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); text-align: right;">ACTIONS</th>` : ''}
                </tr>
              </thead>
              <tbody id="all-tasks-table-body">
                <tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2rem;">Loading tasks...</td></tr>
              </tbody>
            </table>
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
    <div id="modal-add-task" style="display: none; position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); z-index: 999999; align-items: center; justify-content: center; backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);">
      <div style="background: var(--bg-surface, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; width: 92%; max-width: 520px; padding: 1.75rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2), 0 10px 10px -5px rgba(0,0,0,0.1); animation: fadeIn 0.2s ease;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--text-main, #0f172a);">Add New Task</h3>
          <button type="button" id="btn-close-task-modal" style="background: none; border: none; font-size: 1.4rem; color: var(--text-muted); cursor: pointer; line-height: 1;">&times;</button>
        </div>
        <p id="task-modal-module-title" style="margin: 0 0 1.25rem; font-size: 0.88rem; color: var(--primary, #059669); font-weight: 600;"></p>
        
        <form id="form-create-task" style="display: flex; flex-direction: column; gap: 1rem;">
          <input type="hidden" id="task-modal-module-id" />
          <div id="task-modal-module-select-group">
            <label style="display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.35rem; color: var(--text-main);">Assign to Module <span style="color: #ef4444;">*</span></label>
            <select id="task-modal-module-select" class="premium-input" style="width: 100%; box-sizing: border-box;" required></select>
          </div>
          <div>
            <label style="display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.35rem; color: var(--text-main);">Task Title <span style="color: #ef4444;">*</span></label>
            <input type="text" id="task-input-title" class="premium-input" placeholder="e.g. Implement authentication flow" required style="width: 100%; box-sizing: border-box;" />
          </div>

          <div>
            <label style="display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.35rem; color: var(--text-main);">Task Description</label>
            <textarea id="task-input-desc" class="premium-input" rows="3" placeholder="Provide detailed task instructions..." style="width: 100%; box-sizing: border-box; resize: vertical;"></textarea>
          </div>

          <div>
            <label style="display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.35rem; color: var(--text-main);">Time / Weight (Story Points or Hours)</label>
            <input type="number" id="task-input-weight" class="premium-input" min="1" max="1000" value="1" placeholder="1" style="width: 100%; box-sizing: border-box;" />
            <small style="color: var(--text-muted); font-size: 0.75rem; display: block; margin-top: 0.25rem;">Estimated time or difficulty weight score (default: 1)</small>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color);">
            <button type="button" id="btn-cancel-task-modal" class="btn btn-outline btn-sm">Cancel</button>
            <button type="submit" id="btn-submit-task" class="btn btn-primary btn-sm shadow-hover">Add Task</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Cleanup any previously mounted modal from document.body
  const oldModal = document.getElementById('modal-add-task');
  if (oldModal && oldModal.parentElement === document.body) {
    oldModal.remove();
  }

  // State
  let selectedModuleId = null;
  let projectModules = [];

  const getModalEl = () => {
    let modal = document.getElementById('modal-add-task');
    if (!modal) {
      modal = container.querySelector('#modal-add-task');
      if (modal) {
        document.body.appendChild(modal);
      }
    }
    return modal;
  };

  const closeTaskModal = () => {
    const taskModal = getModalEl();
    if (taskModal) {
      taskModal.style.display = 'none';
      const form = taskModal.querySelector('#form-create-task');
      if (form) form.reset();
    }
  };

  const openTaskModal = (targetModuleId) => {
    const taskModal = getModalEl();
    if (!taskModal) return;

    if (!projectModules || projectModules.length === 0) {
      alert('Please create at least one module first using "+ Add Module" before adding tasks.');
      return;
    }

    const modalModuleSelect = taskModal.querySelector('#task-modal-module-select');
    const modalModuleId = taskModal.querySelector('#task-modal-module-id');
    const modalModuleTitle = taskModal.querySelector('#task-modal-module-title');
    const taskInputTitle = taskModal.querySelector('#task-input-title');
    const taskInputDesc = taskModal.querySelector('#task-input-desc');
    const taskInputWeight = taskModal.querySelector('#task-input-weight');

    if (modalModuleSelect) {
      modalModuleSelect.innerHTML = projectModules.map(m => `
        <option value="${m.id}" ${String(m.id) === String(targetModuleId) ? 'selected' : ''}>${m.module_name || m.name || 'Module'}</option>
      `).join('');
    }

    const chosenId = targetModuleId || (modalModuleSelect ? modalModuleSelect.value : projectModules[0].id);
    if (modalModuleSelect) modalModuleSelect.value = chosenId;
    if (modalModuleId) modalModuleId.value = chosenId;

    const matchedMod = projectModules.find(m => String(m.id) === String(chosenId));
    if (modalModuleTitle) {
      modalModuleTitle.textContent = matchedMod ? `Assigning task to module: ${matchedMod.module_name || matchedMod.name}` : '';
    }

    if (taskInputTitle) taskInputTitle.value = '';
    if (taskInputDesc) taskInputDesc.value = '';
    if (taskInputWeight) taskInputWeight.value = '1';

    taskModal.style.display = 'flex';
    initTaskModalListeners();
    setTimeout(() => taskInputTitle && taskInputTitle.focus(), 50);
  };

  const initTaskModalListeners = () => {
    const taskModal = getModalEl();
    if (!taskModal) return;

    const btnClose = taskModal.querySelector('#btn-close-task-modal');
    if (btnClose && !btnClose._bound) {
      btnClose._bound = true;
      btnClose.addEventListener('click', closeTaskModal);
    }

    const btnCancel = taskModal.querySelector('#btn-cancel-task-modal');
    if (btnCancel && !btnCancel._bound) {
      btnCancel._bound = true;
      btnCancel.addEventListener('click', closeTaskModal);
    }

    if (!taskModal._backdropBound) {
      taskModal._backdropBound = true;
      taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) closeTaskModal();
      });
    }

    const selectEl = taskModal.querySelector('#task-modal-module-select');
    if (selectEl && !selectEl._bound) {
      selectEl._bound = true;
      selectEl.addEventListener('change', (e) => {
        const modalModuleId = taskModal.querySelector('#task-modal-module-id');
        if (modalModuleId) modalModuleId.value = e.target.value;
        const modalModuleTitle = taskModal.querySelector('#task-modal-module-title');
        const matchedMod = projectModules.find(m => String(m.id) === String(e.target.value));
        if (modalModuleTitle && matchedMod) {
          modalModuleTitle.textContent = `Assigning task to module: ${matchedMod.module_name || matchedMod.name}`;
        }
      });
    }

    const form = taskModal.querySelector('#form-create-task');
    if (form && !form._bound) {
      form._bound = true;
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const moduleId = taskModal.querySelector('#task-modal-module-select')?.value || taskModal.querySelector('#task-modal-module-id')?.value;
        const title = taskModal.querySelector('#task-input-title')?.value.trim();
        const description = taskModal.querySelector('#task-input-desc')?.value.trim();
        const weightVal = taskModal.querySelector('#task-input-weight')?.value.trim();
        const weight = weightVal ? parseInt(weightVal, 10) : 1;

        if (!moduleId) {
          alert('Please select a module to assign this task to.');
          return;
        }

        if (!title) {
          alert('Please enter a task title.');
          return;
        }

        const submitBtn = taskModal.querySelector('#btn-submit-task');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Adding...';
        }

        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_BASE}/projects/modules/${moduleId}/tasks`, {
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
              `Task "${title}" created successfully with status To Do.`
            );
            await loadProject();
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
  };

  // Global click delegation for all Add Task buttons in the container
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-add-task');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      const mId = btn.getAttribute('data-module-id') || selectedModuleId || (projectModules[0] ? projectModules[0].id : null);
      openTaskModal(mId);
    }
  });

  // Tab switching logic
  const tabBtns = container.querySelectorAll('.project-tab-btn');
  const tabContents = container.querySelectorAll('.tab-content');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
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

  const bindTaskEvents = (parentEl) => {
    if (!parentEl) return;
    
    parentEl.querySelectorAll('.btn-add-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const buttonEl = e.target.closest('button');
        const moduleId = buttonEl.getAttribute('data-module-id') || selectedModuleId || (projectModules[0] ? projectModules[0].id : null);
        openTaskModal(moduleId);
      });
    });

    parentEl.querySelectorAll('.btn-toggle-task-block').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const buttonEl = e.target.closest('button');
        const taskId = buttonEl.getAttribute('data-task-id');
        const currentStatus = buttonEl.getAttribute('data-current-status');
        const nextStatus = currentStatus === 'blocked' ? 'todo' : 'blocked';
        const actionLabel = currentStatus === 'blocked' ? 'unblock' : 'block';

        if (!confirm(`Are you sure you want to ${actionLabel} this task?`)) return;

        buttonEl.disabled = true;
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_BASE}/projects/tasks/${taskId}/status`, {
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
  };

  const loadProject = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/projects/${projectId}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await response.json();
      
      if (data.status === 'success' && data.data) {
        const p = data.data;
        projectModules = p.modules || [];
        const rawTitle = p.title || 'Project Details';
        const cleanTitle = rawTitle.replace(/Student Portal/gi, 'Modules & Tasks').replace(/student portal/gi, 'Modules & Tasks');
        container.querySelector('#project-title').textContent = cleanTitle;
        const typeEl = container.querySelector('#val-type');
        if (typeEl) typeEl.textContent = p.project_type || 'N/A';
        container.querySelector('#val-client').textContent = p.client_name || 'N/A';
        
        const statusSpan = container.querySelector('#val-status');
        statusSpan.textContent = p.status || 'N/A';
        statusSpan.className = `status-badge ${p.status || 'active'}`;
        
        container.querySelector('#val-budget').textContent = p.budget || '0.00';
        container.querySelector('#val-start').textContent = p.start_date || 'N/A';
        container.querySelector('#val-end').textContent = p.end_date || 'N/A';
        
        const descEl = container.querySelector('#val-desc');
        if (descEl) descEl.textContent = p.deliverables || p.description || 'No deliverables provided.';

        const facultyEl = container.querySelector('#val-faculty');
        if (facultyEl) {
          facultyEl.textContent = (p.faculty && p.faculty.length > 0) ? p.faculty.map(f => f.name).join(', ') : 'Unassigned';
        }

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
        
        // -------------------------------------------------------------
        // RENDER MODULES TAB (TWO-COLUMN SPLIT MATCHING IMAGE 1)
        // -------------------------------------------------------------
        const modContainer = container.querySelector('#modules-list');
        const tasksPaneContainer = container.querySelector('#module-tasks-pane-container');
        const canBlock = (role === 'faculty' || role === 'coordinator' || role === 'director');

        if (p.modules && p.modules.length > 0) {
          if (!selectedModuleId || !p.modules.some(m => m.id === selectedModuleId)) {
            selectedModuleId = p.modules[0].id;
          }

          // Function to render selected module's name and description in right column
          const renderSelectedModuleDetails = () => {
            const selectedModule = p.modules.find(m => m.id === selectedModuleId) || p.modules[0];
            if (!selectedModule || !tasksPaneContainer) return;

            const modTasks = selectedModule.tasks || [];
            const modTitle = selectedModule.module_name || selectedModule.name || 'Module';
            const modDesc = selectedModule.description || '';
            const mStatus = (selectedModule.status || 'not_started').toLowerCase();
            const isModBlocked = mStatus === 'blocked';
            const statusClass = mStatus === 'completed' ? 'student-badge-success' : (mStatus === 'in_progress' ? 'student-badge-warning' : (isModBlocked ? 'student-badge-danger' : 'student-badge-info'));
            const statusDisplay = selectedModule.status ? (selectedModule.status.charAt(0).toUpperCase() + selectedModule.status.slice(1).replace('_', ' ')) : 'Not Started';
            const completedCount = modTasks.filter(t => (t.status || '').toLowerCase() === 'completed').length;

            tasksPaneContainer.innerHTML = `
              <div class="module-details-card animate-fade-in" style="background: #ffffff; border-radius: 12px; border: 1px solid var(--border-color, #e2e8f0); padding: 1.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; border-bottom: 1px solid var(--border-color, #e2e8f0); padding-bottom: 1.25rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                  <div>
                    <div style="font-size: 0.78rem; font-weight: 700; text-transform: uppercase; color: var(--primary, #059669); letter-spacing: 0.05em; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.4rem;">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                      Module Details
                    </div>
                    <h2 style="margin: 0; font-size: 1.35rem; font-weight: 700; color: var(--text-main, #0f172a);">${modTitle}</h2>
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
                    <span class="student-badge ${statusClass}" style="font-size: 0.8rem; padding: 0.35rem 0.85rem;">${statusDisplay}</span>
                    ${canCreateTask ? `
                      <button class="btn btn-sm btn-primary btn-add-task shadow-hover" data-module-id="${selectedModule.id}" data-module-title="${modTitle}" style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.32rem 0.8rem; font-size: 0.8rem;">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        <span>Add Task</span>
                      </button>
                    ` : ''}
                    ${canBlock ? `
                      <button class="btn btn-sm btn-outline btn-toggle-module-block" data-module-id="${selectedModule.id}" data-current-status="${mStatus}" title="${isModBlocked ? 'Unblock Module' : 'Block Module'}" style="font-size: 0.75rem; padding: 0.3rem 0.75rem; ${isModBlocked ? 'border-color: #10b981; color: #10b981;' : 'border-color: #ef4444; color: #ef4444;'}">
                        ${isModBlocked ? 'Unblock' : 'Block'}
                      </button>
                    ` : ''}
                  </div>
                </div>

                <div style="margin-bottom: 1.5rem;">
                  <h3 style="font-size: 0.82rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted, #64748b); letter-spacing: 0.05em; margin: 0 0 0.6rem;">
                    Module Description
                  </h3>
                  <div style="background: var(--bg-main, #f8fafc); border: 1px solid var(--border-color, #e2e8f0); border-radius: 8px; padding: 1.25rem; font-size: 0.92rem; line-height: 1.6; color: var(--text-main, #334155); min-height: 100px; white-space: pre-line;">
                    ${modDesc ? modDesc : '<span style="color: var(--text-muted, #94a3b8); font-style: italic;">No description provided for this module.</span>'}
                  </div>
                </div>

                <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; padding-top: 1rem; border-top: 1px solid var(--border-color, #e2e8f0);">
                  <div style="font-size: 0.85rem; color: var(--text-muted, #64748b);">
                    Associated Tasks: <strong style="color: var(--text-main, #0f172a);">${modTasks.length} Tasks</strong>
                  </div>
                  <div style="font-size: 0.85rem; color: var(--text-muted, #64748b);">
                    Completed Tasks: <strong style="color: #059669;">${completedCount} Tasks</strong>
                  </div>
                </div>
              </div>
            `;
          };

          // Render left column modules list
          if (modContainer) {
            modContainer.innerHTML = p.modules.map(m => {
              const moduleName = m.module_name || m.name || 'Module';
              const mStatus = (m.status || 'not_started').toLowerCase();
              const isModBlocked = mStatus === 'blocked';
              const isSelected = m.id === selectedModuleId;
              const taskCount = (m.tasks || []).length;

              return `
                <div class="module-item-card ${isSelected ? 'active' : ''}" data-module-id="${m.id}">
                  <div class="module-icon-box">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                  </div>
                  <div class="module-item-info">
                    <span class="module-item-name">${moduleName}</span>
                    <div class="module-item-sub">
                      <span class="student-badge ${mStatus === 'completed' ? 'student-badge-success' : isModBlocked ? 'student-badge-danger' : 'student-badge-warning'}" style="font-size: 0.7rem; padding: 0.15rem 0.5rem;">
                        ${m.status || 'In Progress'}
                      </span>
                      <span>${taskCount} Tasks</span>
                    </div>
                  </div>
                  ${canBlock ? `
                    <button class="btn btn-sm btn-outline btn-toggle-module-block" data-module-id="${m.id}" data-current-status="${mStatus}" title="${isModBlocked ? 'Unblock Module' : 'Block Module'}" style="font-size: 0.72rem; padding: 0.2rem 0.5rem; ${isModBlocked ? 'border-color: #10b981; color: #10b981;' : 'border-color: #ef4444; color: #ef4444;'}">
                      ${isModBlocked ? 'Unblock' : 'Block'}
                    </button>
                  ` : ''}
                  <svg class="module-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
              `;
            }).join('');

            // Click listener to select module
            modContainer.querySelectorAll('.module-item-card').forEach(card => {
              card.addEventListener('click', (e) => {
                if (e.target.closest('.btn-toggle-module-block')) return;
                const mId = parseInt(card.getAttribute('data-module-id'), 10);
                selectedModuleId = mId;
                modContainer.querySelectorAll('.module-item-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                renderSelectedModuleDetails();
              });
            });

            // Bind module block/unblock (for list items and details pane)
            const bindModuleBlockButtons = (root) => {
              root.querySelectorAll('.btn-toggle-module-block').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                  e.stopPropagation();
                  const buttonEl = e.target.closest('button');
                  const moduleId = buttonEl.getAttribute('data-module-id');
                  const currentStatus = buttonEl.getAttribute('data-current-status');
                  const nextStatus = currentStatus === 'blocked' ? 'in_progress' : 'blocked';
                  const actionLabel = currentStatus === 'blocked' ? 'unblock' : 'block';

                  if (!confirm(`Are you sure you want to ${actionLabel} this module?`)) return;

                  buttonEl.disabled = true;
                  try {
                    const token = localStorage.getItem('token');
                    const res = await fetch(`${API_BASE}/projects/modules/${moduleId}/status`, {
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
            };
            bindModuleBlockButtons(modContainer);
            if (tasksPaneContainer) bindModuleBlockButtons(tasksPaneContainer);
          }

          // Initial render of details in right pane
          renderSelectedModuleDetails();
          if (tasksPaneContainer) {
            tasksPaneContainer.querySelectorAll('.btn-toggle-module-block').forEach(btn => {
              btn.addEventListener('click', () => {
                const leftBtn = modContainer.querySelector(`.btn-toggle-module-block[data-module-id="${btn.getAttribute('data-module-id')}"]`);
                if (leftBtn) leftBtn.click();
              });
            });
          }
        } else {
          if (modContainer) modContainer.innerHTML = '<div style="color:var(--text-muted); padding: 1.5rem;">No modules created yet. Click "+ Add Module" to start.</div>';
          if (tasksPaneContainer) tasksPaneContainer.innerHTML = '<div style="padding: 2.5rem; text-align: center; color: var(--text-muted); background: #ffffff; border: 1px solid var(--border-color); border-radius: 12px;">Select or create a module to view its name and description.</div>';
        }

        // -------------------------------------------------------------
        // RENDER TASKS TAB (ALL TASKS TABLE MATCHING IMAGE 2)
        // -------------------------------------------------------------
        const allTasks = [];
        (p.modules || []).forEach(m => {
          (m.tasks || []).forEach(t => {
            allTasks.push({
              ...t,
              moduleId: m.id,
              moduleName: m.module_name || m.name || 'Module'
            });
          });
        });

        const allTasksBadge = container.querySelector('#all-tasks-count-badge');
        if (allTasksBadge) allTasksBadge.textContent = `${allTasks.length} Total Tasks`;

        const allTasksTbody = container.querySelector('#all-tasks-table-body');
        if (allTasksTbody) {
          allTasksTbody.innerHTML = allTasks.length > 0 ? allTasks.map(t => {
            const tStatus = (t.status || 'todo').toLowerCase();
            const isTaskBlocked = tStatus === 'blocked';
            const statusClass = tStatus === 'completed' ? 'student-badge-success' : (tStatus === 'in_progress' ? 'student-badge-warning' : (isTaskBlocked ? 'student-badge-danger' : 'student-badge-info'));
            const statusDisplay = t.status ? (t.status.charAt(0).toUpperCase() + t.status.slice(1).replace('_', ' ')) : 'Todo';
            const assigneeName = t.assignee?.name || t.assigned_to_name || (typeof t.assignee === 'string' ? t.assignee : 'Unassigned');
            const isUnassigned = assigneeName === 'Unassigned';

            return `
              <tr style="border-bottom: 1px solid var(--border-color, #e2e8f0); transition: background 0.15s ease;">
                <td style="padding: 1.15rem 1.25rem;">
                  <div style="font-weight: 700; font-size: 0.92rem; color: #0f172a;">${t.title}</div>
                  <div style="font-size: 0.78rem; color: #64748b; margin-top: 4px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span style="display: flex; align-items: center; gap: 4px;">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                      <span>${t.moduleName}</span>
                    </span>
                    <span style="color: #cbd5e1;">&bull;</span>
                    <span style="display: inline-flex; align-items: center; gap: 3px; color: #475569; font-weight: 600;">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      Time/Weight: ${t.weight || 1}
                    </span>
                  </div>
                </td>
                <td style="padding: 1.15rem 1.25rem;">
                  <span class="student-badge ${isUnassigned ? 'student-badge-warning' : 'student-badge-info'}" style="font-size: 0.8rem; font-weight: 600; padding: 0.25rem 0.75rem;">
                    ${assigneeName}
                  </span>
                </td>
                <td style="padding: 1.15rem 1.25rem;">
                  <span class="student-badge ${statusClass}">
                    ${statusDisplay}
                  </span>
                </td>
                ${canBlock ? `
                  <td style="padding: 1.15rem 1.25rem; text-align: right;">
                    <button class="btn btn-sm btn-outline btn-toggle-task-block" data-task-id="${t.id}" data-current-status="${tStatus}" style="font-size: 0.75rem; padding: 0.25rem 0.6rem; ${isTaskBlocked ? 'border-color: #10b981; color: #10b981;' : 'border-color: #ef4444; color: #ef4444;'}">
                      ${isTaskBlocked ? 'Unblock' : 'Block'}
                    </button>
                  </td>
                ` : ''}
              </tr>
            `;
          }).join('') : `
            <tr><td colspan="${canBlock ? 4 : 3}" style="text-align: center; color: var(--text-muted); padding: 3rem;">No tasks found across project modules.</td></tr>
          `;

          bindTaskEvents(container.querySelector('#tab-tasks'));
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
      const response = await fetch(`${API_BASE}/projects/${projectId}/close`, {
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
          const response = await fetch(`${API_BASE}/projects/${projectId}/github/verify`, {
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
      const response = await fetch(`${API_BASE}/projects/${projectId}/github`, {
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
        const response = await fetch(`${API_BASE}/projects/${projectId}/modules`, {
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


  // Finance Logic
  const loadFinance = async () => {
    const totalEl = container.querySelector('#fin-total');
    const recEl = container.querySelector('#fin-received');
    const remEl = container.querySelector('#fin-remaining');
    const list = container.querySelector('#finance-payments-list');
    if (!list) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/finance/projects/${projectId}`, {
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
        const response = await fetch(`${API_BASE}/projects/${projectId}/faculty`, {
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
        const response = await fetch(`${API_BASE}/projects/${projectId}/students`, {
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
          const response = await fetch(`${API_BASE}/auth/users?role=${role}&search=${encodeURIComponent(query)}`, {
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
