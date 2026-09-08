import { renderStudentSidebar } from './StudentSidebar.js';
import { getProjects, getSprints, getGithub, saveSprint, ensureDataLoaded } from './studentStore.js';
import { useAuthStore } from '@/core/stores/auth.js';
import '../student.css';

export async function StudentProjects(route, router) {
  await ensureDataLoaded();
  renderStudentSidebar();

  const container = document.createElement('div');
  container.className = 'student-portal-container animate-fade-in';

  const authStore = useAuthStore();
  const currentUser = authStore.user;

  // 1. Fetch mock projects assigned to the mock student
  const projects = getProjects() || [];
  let assignedProjects = projects.filter(p => 
    p.members && p.members.toLowerCase().includes(currentUser?.name?.toLowerCase() || 'student nova')
  );
  if (assignedProjects.length === 0 && projects.length > 0) {
    assignedProjects = projects;
  }

  assignedProjects.forEach(p => {
    p.designation = currentUser?.designation || p.designation;
  });

  // State
  let selectedProjectId = route?.params?.id ? parseInt(route.params.id, 10) : null;
  let isDetailView = Boolean(selectedProjectId);
  let activeTab = 'overview'; // 'overview', 'team', 'sprints', 'tasks', 'modules', 'github'
  let selectedModuleName = null;

  function openSprintModal(selectedProject, sprintToEdit = null) {
    const modal = document.createElement('div');
    modal.className = 'cert-modal';
    modal.id = 'sprint-modal';
    
    modal.innerHTML = `
      <div class="cert-modal-overlay"></div>
      <div class="cert-modal-content" style="max-width: 600px; width: 90%; background: #ffffff; padding: 24px; border-radius: var(--radius-lg); max-height: 90vh; display: flex; flex-direction: column;">
        <button class="cert-modal-close" id="close-sprint-modal" style="position: absolute; top: 12px; right: 16px; background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
        <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-main); margin-bottom: 16px;">
          ${sprintToEdit ? 'Edit Sprint' : 'Create New Sprint'}
        </h3>
        <form id="sprint-form" class="student-form" style="display: flex; flex-direction: column; gap: 16px; overflow-y: auto; flex: 1; padding-right: 4px;">
          <div class="student-form-group">
            <label for="sprint-name" style="font-weight: 600; font-size: 0.85rem;">Sprint Name</label>
            <input type="text" id="sprint-name" class="student-input" placeholder="e.g. Sprint 3: Core Integration" required value="${sprintToEdit ? sprintToEdit.name : ''}" style="padding: 10px; border: 1px solid var(--border-color); border-radius: 4px;">
          </div>
          <div class="student-form-group">
            <label for="sprint-objective" style="font-weight: 600; font-size: 0.85rem;">Objective / Goal</label>
            <textarea id="sprint-objective" class="student-textarea" placeholder="Describe the objectives of this sprint..." required style="padding: 10px; border: 1px solid var(--border-color); border-radius: 4px; min-height: 80px;">${sprintToEdit ? sprintToEdit.objective : ''}</textarea>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="student-form-group">
              <label for="sprint-start" style="font-weight: 600; font-size: 0.85rem;">Start Date</label>
              <input type="date" id="sprint-start" class="student-input" value="${sprintToEdit && sprintToEdit.startDate ? sprintToEdit.startDate : ''}" style="padding: 10px; border: 1px solid var(--border-color); border-radius: 4px;">
            </div>
            <div class="student-form-group">
              <label for="sprint-end" style="font-weight: 600; font-size: 0.85rem;">End Date</label>
              <input type="date" id="sprint-end" class="student-input" value="${sprintToEdit && sprintToEdit.endDate ? sprintToEdit.endDate : ''}" style="padding: 10px; border: 1px solid var(--border-color); border-radius: 4px;">
            </div>
          </div>

          <div class="student-form-group">
            <label style="font-weight: 600; font-size: 0.85rem;">Selected Modules</label>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 4px; max-height: 120px; overflow-y: auto; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px;">
              ${(selectedProject.assignedModules || []).map(m => {
                const isChecked = sprintToEdit && sprintToEdit.modules && sprintToEdit.modules.includes(m);
                return `
                  <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: normal; cursor: pointer; color: var(--text-main);">
                    <input type="checkbox" name="sprint-modules" value="${m}" ${isChecked ? 'checked' : ''}>
                    <span>${m}</span>
                  </label>
                `;
              }).join('')}
            </div>
          </div>

          <div class="student-form-group">
            <label style="display: flex; justify-content: space-between; align-items: center; font-weight: 600; font-size: 0.85rem;">
              <span>Sprint Tasks</span>
              <button type="button" class="student-btn student-btn-outline student-btn-sm" id="btn-add-task-row" style="padding: 4px 8px; font-size: 0.75rem;">
                + Add Task
              </button>
            </label>
            <div id="sprint-tasks-container" style="display: flex; flex-direction: column; gap: 12px; margin-top: 8px;">
              <!-- Dynamic task rows go here -->
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; border-top: 1px solid var(--border-color); padding-top: 16px;">
            <button type="button" class="student-btn student-btn-outline" id="btn-cancel-sprint" style="padding: 8px 16px;">Cancel</button>
            <button type="submit" class="student-btn student-btn-primary" style="padding: 8px 16px;">Save Sprint</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const tasksContainer = modal.querySelector('#sprint-tasks-container');

    function createTaskRow(task = null) {
      const row = document.createElement('div');
      row.className = 'sprint-task-form-row';
      row.style.cssText = 'display: grid; grid-template-columns: 2fr 1.5fr 1.2fr auto; gap: 8px; align-items: center; background: #f8fafc; padding: 8px; border: 1px dashed var(--border-color); border-radius: 4px;';
      row.innerHTML = `
        <input type="text" class="student-input task-name-input" placeholder="Task description" required value="${task ? task.name : ''}" style="padding: 6px; font-size: 0.85rem; border: 1px solid var(--border-color); border-radius: 4px;">
        <select class="student-select task-assignee-select" required style="padding: 6px; font-size: 0.85rem; border: 1px solid var(--border-color); border-radius: 4px; background: white;">
          <option value="" disabled ${!task ? 'selected' : ''}>Assignee</option>
          ${selectedProject.membersList.map(m => `
            <option value="${m.name}" ${task && task.assignee === m.name ? 'selected' : ''}>${m.name}</option>
          `).join('')}
        </select>
        <select class="student-select task-status-select" required style="padding: 6px; font-size: 0.85rem; border: 1px solid var(--border-color); border-radius: 4px; background: white;">
          <option value="Todo" ${task && task.status === 'Todo' ? 'selected' : ''}>Todo</option>
          <option value="In Progress" ${task && task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
          <option value="Completed" ${task && task.status === 'Completed' ? 'selected' : ''}>Completed</option>
          <option value="Blocked" ${task && task.status === 'Blocked' ? 'selected' : ''}>Blocked</option>
        </select>
        <button type="button" class="student-btn student-btn-outline btn-remove-task-row" style="padding: 6px; line-height: 1; color: var(--danger); border-color: #fca5a5; font-size: 1.1rem; justify-content: center; height: 32px; width: 32px;">
          &times;
        </button>
      `;

      row.querySelector('.btn-remove-task-row').addEventListener('click', () => {
        row.remove();
      });

      return row;
    }

    // Prefill existing tasks if editing
    if (sprintToEdit && sprintToEdit.tasks) {
      sprintToEdit.tasks.forEach(t => {
        tasksContainer.appendChild(createTaskRow(t));
      });
    } else {
      // Add one empty task row by default
      tasksContainer.appendChild(createTaskRow());
    }

    // Add Task Row handler
    modal.querySelector('#btn-add-task-row').addEventListener('click', () => {
      tasksContainer.appendChild(createTaskRow());
    });

    // Close Modal handler
    function closeModal() {
      modal.remove();
    }

    modal.querySelector('#close-sprint-modal').addEventListener('click', closeModal);
    modal.querySelector('#btn-cancel-sprint').addEventListener('click', closeModal);
    modal.querySelector('.cert-modal-overlay').addEventListener('click', closeModal);

    // Form Submit handler
    modal.querySelector('#sprint-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const taskRows = modal.querySelectorAll('.sprint-task-form-row');
      const tasks = Array.from(taskRows).map(row => ({
        name: row.querySelector('.task-name-input').value.trim(),
        assignee: row.querySelector('.task-assignee-select').value,
        status: row.querySelector('.task-status-select').value
      }));

      const completedTasks = tasks.filter(t => t.status === 'Completed').length;
      const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
      
      const savedSprintObj = {
        id: sprintToEdit ? sprintToEdit.id : Date.now(),
        projectId: selectedProject.id,
        name: modal.querySelector('#sprint-name').value.trim(),
        objective: modal.querySelector('#sprint-objective').value.trim(),
        startDate: modal.querySelector('#sprint-start').value,
        endDate: modal.querySelector('#sprint-end').value,
        status: sprintToEdit ? sprintToEdit.status : 'DRAFT',
        approvalStatus: sprintToEdit ? sprintToEdit.approvalStatus : 'Pending',
        progress: progress,
        tasks: tasks,
        modules: Array.from(modal.querySelectorAll('input[name="sprint-modules"]:checked')).map(el => el.value)
      };

      await saveSprint(savedSprintObj);
      closeModal();
      render();
    });
  }

  function render() {
    const selectedProject = assignedProjects.find(p => p.id === selectedProjectId);
    const sprints = getSprints() || [];
    const githubData = getGithub() || [];

    // Filter sprints and github for selected project
    const projectSprints = selectedProject ? sprints.filter(s => s.projectId === selectedProject.id) : [];
    const projectGithub = selectedProject ? githubData.find(g => g.project === selectedProject.title) : null;

    if (!isDetailView) {
      // Build project cards HTML (Initial View)
      const projectCardsHtml = assignedProjects.map(p => `
        <div class="student-card project-summary-card" 
             style="margin-bottom: 16px; cursor: pointer; transition: all 0.2s;" 
             data-id="${p.id}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-main);">${p.title}</h3>
            <span class="student-badge ${p.status === 'Completed' ? 'student-badge-success' : 'student-badge-warning'}">${p.status}</span>
          </div>
          
          <div style="display: flex; gap: 12px; margin-bottom: 12px;">
            <span class="student-badge student-badge-info" style="font-size: 0.7rem;">${p.designation}</span>
            <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">Supervisor: ${p.faculty}</span>
          </div>

          <div style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">
              <span>Progress</span>
              <span style="font-weight: 600;">${p.progress}%</span>
            </div>
            <div class="student-progress-bar-bg">
              <div class="student-progress-bar-fill" style="width: ${p.progress}%;"></div>
            </div>
          </div>

          <button class="student-btn student-btn-primary btn-view-details" data-id="${p.id}" style="width: auto; padding: 0.4rem 1.25rem; align-self: flex-start; margin-top: 8px;">
            View Details
          </button>
        </div>
      `).join('');

      container.innerHTML = `
        <div class="student-header">
          <h1>My Projects</h1>
          <p>Inspect development modules, milestones, sprints, and task assignments in your team.</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px;">
          ${projectCardsHtml || '<div class="student-card" style="text-align:center;color:var(--text-muted);">No assigned projects.</div>'}
        </div>
      `;
    } else {
      // Dynamic Team members list for Project Team tab
      let teamMembers = [];
      if (selectedProject) {
        teamMembers = selectedProject.membersList || [];
      }

      // Helper to generate visual workflow SVG or HTML nodes
      function renderWorkflow(sprint) {
        const states = ["DRAFT", "SUBMITTED", "FACULTY REVIEW", "APPROVED", "IN PROGRESS", "COMPLETED"];
        
        // Determine active index
        let activeIndex = 0;
        if (sprint.status === "COMPLETED") activeIndex = 5;
        else if (sprint.status === "IN PROGRESS") activeIndex = 4;
        else if (sprint.approvalStatus === "Approved") activeIndex = 3;
        else if (sprint.approvalStatus === "Faculty Review") activeIndex = 2;
        else if (sprint.status === "SUBMITTED") activeIndex = 1;
        else if (sprint.status === "DRAFT") activeIndex = 0;

        const stepsHtml = states.map((state, idx) => {
          let nodeClass = "";
          if (idx < activeIndex) nodeClass = "completed";
          else if (idx === activeIndex) {
            nodeClass = sprint.approvalStatus === "Changes Requested" ? "requested" : "active";
          }

          const circleContent = idx < activeIndex ? "✓" : (idx + 1);

          const connector = idx < states.length - 1 
            ? `<div class="workflow-connector-line ${idx < activeIndex ? 'passed' : ''}"></div>` 
            : "";

          return `
            <div class="workflow-step-node ${nodeClass}">
              <div class="workflow-node-circle">${circleContent}</div>
              <span class="workflow-node-lbl">${state}</span>
            </div>
            ${connector}
          `;
        }).join('');

        // If changes requested, show the alternate workflow visual callout too
        const changesRequestedCallout = sprint.approvalStatus === "Changes Requested" ? `
          <div class="student-alert-danger" style="margin-top: 12px; display: flex; flex-direction: column; gap: 4px;">
            <div style="font-weight: 700; color: #b91c1c;">⚠️ CHANGES REQUESTED BY SUPERVISOR</div>
            <div style="color: #7f1d1d;">${sprint.feedback || 'Please review sprint objectives and submit updates.'}</div>
            <div style="margin-top: 8px; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 8px;">
              <span style="text-decoration: line-through; opacity: 0.6;">SUBMITTED</span>
              <span>➔</span>
              <span style="color: #b91c1c; font-weight: bold; background: #fee2e2; padding: 2px 6px; border-radius: 4px; border: 1px solid #fca5a5;">CHANGES REQUESTED</span>
              <span>➔</span>
              <span style="opacity: 0.6;">RESUBMITTED</span>
            </div>
          </div>
        ` : '';

        return `
          <div class="workflow-strip-outer">
            <div class="workflow-title-lbl">Sprint Lifecycle Workflow</div>
            <div class="workflow-steps-flex">
              ${stepsHtml}
            </div>
            ${changesRequestedCallout}
          </div>
        `;
      }

      // Build Tab Content HTML
      let tabContentHtml = "";
      if (selectedProject) {
        if (activeTab === 'overview') {
          tabContentHtml = `
            <div class="project-tab-content">
              <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 16px;">Project Overview</h3>
              <div class="student-grid-2">
                <div class="student-detail-field">
                  <div class="student-detail-label">Client / Sponsor Agency</div>
                  <div class="student-detail-value">${selectedProject.clientInfo || 'RLabZ Academy'}</div>
                </div>
                <div class="student-detail-field">
                  <div class="student-detail-label">Project Timeline</div>
                  <div class="student-detail-value">${selectedProject.timeline}</div>
                </div>
                <div class="student-detail-field">
                  <div class="student-detail-label font-bold">Faculty Supervisor</div>
                  <div class="student-detail-value" style="font-weight: 600; color: var(--primary);">${selectedProject.faculty}</div>
                </div>
                <div class="student-detail-field">
                  <div class="student-detail-label">Current Sprint</div>
                  <div class="student-detail-value">
                    <span class="student-badge student-badge-info" style="font-weight: 600;">${selectedProject.currentSprint}</span>
                  </div>
                </div>
              </div>

              <div class="student-detail-field" style="margin-top: 16px;">
                <div class="student-detail-label">Description</div>
                <div class="student-detail-value" style="line-height: 1.6; margin-top: 6px;">${selectedProject.description}</div>
              </div>

              <div class="student-detail-field" style="margin-top: 20px;">
                <div class="student-detail-label">Overall Completion Progress</div>
                <div style="display: flex; align-items: center; gap: 16px; margin-top: 8px;">
                  <div class="student-progress-bar-bg" style="flex: 1; height: 12px;">
                    <div class="student-progress-bar-fill" style="width: ${selectedProject.progress}%; height: 12px;"></div>
                  </div>
                  <span style="font-size: 1.1rem; font-weight: 700; color: var(--primary); min-width: 48px; text-align: right;">${selectedProject.progress}%</span>
                </div>
              </div>
            </div>
          `;
        } else if (activeTab === 'team') {
          const teamCards = teamMembers.map(m => {
            const isMe = m.name.toLowerCase() === (currentUser?.name?.toLowerCase() || 'student nova');
            let badgesHtml = '';
            if (m.isTeamLead) {
              badgesHtml += `<span class="team-lead-badge">Team Lead</span>`;
            }
            if (isMe) {
              const rightOffset = m.isTeamLead ? '105px' : '12px';
              badgesHtml += `<span class="team-lead-badge" style="background: var(--success); right: ${rightOffset};">You</span>`;
            }
            return `
              <div class="team-member-card" style="${isMe ? 'border: 2px solid var(--primary); background: var(--primary-light);' : ''}">
                ${badgesHtml}
                <div class="member-name" style="${isMe ? 'font-weight: 700; color: var(--primary);' : ''}">${m.name}</div>
                <div class="member-designation">${m.designation} Track</div>
                <div class="member-role">${m.isTeamLead ? 'Team Lead' : 'Member'}</div>
              </div>
            `;
          }).join('');

        tabContentHtml = `
          <div class="project-tab-content">
            <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 6px;">Development Team</h3>
            <p style="font-size: 0.825rem; color: var(--text-muted); margin-bottom: 16px;">Assigned team members and designations.</p>
            <div class="project-members-grid">
              ${teamCards}
            </div>
          </div>
        `;
        } else if (activeTab === 'sprints') {
          const userInProject = selectedProject?.membersList?.find(m => m.name.toLowerCase() === (currentUser?.name?.toLowerCase() || 'student nova'));
          const isTeamLead = currentUser?.designation === 'Nova' && userInProject?.isTeamLead === true;

          const sprintsHtml = projectSprints.map(s => {
            const tasksListHtml = s.tasks.map(t => `
              <div class="sprint-task-item">
                <div class="sprint-task-details">
                  <span class="sprint-task-title">${t.name}</span>
                  <span class="sprint-task-assignee">Assignee: ${t.assignee}</span>
                </div>
                <span class="student-badge ${t.status === 'Completed' ? 'student-badge-success' : t.status === 'In Progress' ? 'student-badge-warning' : 'student-badge-info'}">${t.status}</span>
              </div>
            `).join('');

            let actionButtons = '';
            if (isTeamLead) {
              const showSubmit = s.status === 'DRAFT' || s.approvalStatus === 'Changes Requested';
              actionButtons = `
                <div style="display: flex; gap: 8px; margin-top: 12px; border-top: 1px solid var(--border-color); padding-top: 12px;">
                  <button class="student-btn student-btn-outline student-btn-sm btn-edit-sprint" data-sprint-id="${s.id}">
                    Edit Sprint
                  </button>
                  ${showSubmit ? `
                    <button class="student-btn student-btn-primary student-btn-sm btn-submit-sprint" data-sprint-id="${s.id}">
                      Submit Sprint
                    </button>
                  ` : ''}
                </div>
              `;
            }

            return `
              <div class="sprint-block-card">
                <div class="sprint-block-card-header">
                  <div>
                    <h4 class="sprint-block-title">${s.name}</h4>
                    <span class="sprint-date-span">${s.startDate && s.endDate ? `Duration: ${s.startDate} to ${s.endDate}` : (s.startDate ? `Started: ${s.startDate}` : (s.endDate ? `Due: ${s.endDate}` : 'Dates: Not scheduled'))}</span>
                  </div>
                  <div style="display: flex; gap: 8px;">
                    <span class="student-badge ${s.status === 'COMPLETED' ? 'student-badge-success' : s.status === 'IN PROGRESS' ? 'student-badge-warning' : 'student-badge-info'}">${s.status}</span>
                    <span class="student-badge student-badge-info">Approval: ${s.approvalStatus}</span>
                  </div>
                </div>

                <div class="student-detail-field">
                  <div class="student-detail-label">Objective</div>
                  <div class="student-detail-value" style="font-size: 0.9rem; line-height: 1.5; margin-top: 4px;">${s.objective}</div>
                </div>

                <!-- Visual Workflow Node rendering -->
                ${renderWorkflow(s)}

                <div style="margin-top: 8px;">
                  <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 6px;">
                    <span>Sprint Progress</span>
                    <span>${s.progress}%</span>
                  </div>
                  <div class="student-progress-bar-bg" style="height: 6px;">
                    <div class="student-progress-bar-fill" style="width: ${s.progress}%; height: 6px;"></div>
                  </div>
                </div>

                <div style="margin-top: 12px;">
                  <div class="student-detail-label" style="margin-bottom: 8px;">Sprint Tasks</div>
                  <div class="sprint-tasks-list">
                    ${tasksListHtml || '<div style="font-size:0.85rem;color:var(--text-muted);text-align:center;">No tasks registered in this sprint.</div>'}
                  </div>
                </div>

                ${actionButtons}
              </div>
            `;
          }).join('');

          tabContentHtml = `
            <div class="project-tab-content">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div>
                  <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 4px;">Project Sprints</h3>
                  <p style="font-size: 0.825rem; color: var(--text-muted); margin: 0;">Sprints planning workflow.</p>
                </div>
                ${isTeamLead ? `
                  <button class="student-btn student-btn-primary btn-add-sprint" style="padding: 8px 14px; font-size: 0.85rem;">
                    + Add Sprint
                  </button>
                ` : ''}
              </div>
              <div class="sprint-list-container">
                ${sprintsHtml || '<div class="student-card" style="text-align:center;color:var(--text-muted);">No sprints configured for this project.</div>'}
              </div>
            </div>
          `;
        } else if (activeTab === 'tasks') {
          // Collect all tasks across sprints
          const allTasks = [];
          projectSprints.forEach(s => {
            s.tasks.forEach(t => {
              allTasks.push({
                ...t,
                sprintName: s.name
              });
            });
          });

          const taskRowsHtml = allTasks.map(t => `
            <tr>
              <td>
                <div style="font-weight: 600; font-size: 0.9rem;">${t.name}</div>
                <div style="font-size: 0.75rem; color: var(--text-light); margin-top: 2px;">${t.sprintName}</div>
              </td>
              <td><span class="student-badge student-badge-info" style="font-size: 0.8rem;">${t.assignee}</span></td>
              <td><span class="student-badge ${t.status === 'Completed' ? 'student-badge-success' : t.status === 'In Progress' ? 'student-badge-warning' : 'student-badge-danger'}">${t.status}</span></td>
            </tr>
          `).join('');

          tabContentHtml = `
            <div class="project-tab-content">
              <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 16px;">Assigned Project Tasks</h3>
              <div class="student-table-container">
                <table class="student-table">
                  <thead>
                    <tr>
                      <th>Task & Sprint</th>
                      <th>Assignee</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${taskRowsHtml || '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);">No tasks found.</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
          `;
      } else if (activeTab === 'modules') {
        if (!selectedModuleName && selectedProject.assignedModules && selectedProject.assignedModules.length > 0) {
          selectedModuleName = selectedProject.assignedModules[0];
        }

        const foundSprint = projectSprints.find(s => s.name === selectedModuleName);
        const sprintTasks = foundSprint ? foundSprint.tasks : [];

        const modulesLeftHtml = selectedProject.assignedModules && selectedProject.assignedModules.length > 0
          ? selectedProject.assignedModules.map(m => {
              const isActive = m === selectedModuleName;
              return `
                <div class="module-item-card ${isActive ? 'active' : ''}" data-module-name="${m}" style="background: ${isActive ? 'var(--primary-light)' : '#f8fafc'}; border: 1px solid ${isActive ? 'var(--primary)' : 'var(--border-color)'}; padding: 14px; border-radius: var(--radius-sm); font-weight: 600; color: var(--text-main); display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all 0.2s;">
                  <span style="color: var(--primary); font-size: 1.2rem;">📁</span>
                  <span style="flex:1; font-size: 0.9rem;">${m}</span>
                </div>
              `;
            }).join('')
          : '<div style="color:var(--text-muted);">No modules assigned to this project.</div>';

        const tasksRowsHtml = sprintTasks.length > 0 
          ? sprintTasks.map(t => `
              <div class="sprint-task-item" style="border: 1px solid var(--border-color); padding: 10px 14px; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center; background: white; margin-bottom: 8px;">
                <div style="display:flex; flex-direction:column; gap:2px;">
                  <span style="font-weight:600; font-size:0.9rem; color:var(--text-main);">${t.name}</span>
                  <span style="font-size:0.75rem; color:var(--text-muted);">Assignee: ${t.assignee}</span>
                </div>
                <span class="student-badge ${t.status === 'Completed' ? 'student-badge-success' : t.status === 'In Progress' ? 'student-badge-warning' : 'student-badge-info'}">${t.status}</span>
              </div>
            `).join('')
          : '<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.9rem;">No tasks found under this module.</div>';

        tabContentHtml = `
          <div class="project-tab-content">
            <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 6px;">Assigned Modules</h3>
            <p style="font-size: 0.825rem; color: var(--text-muted); margin-bottom: 16px;">Functionalities and components allocated to your development scope. Select a module to inspect its tasks.</p>
            
            <div class="student-split-pane" style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 20px;">
              <!-- Left Panel: Modules list -->
              <div style="display: flex; flex-direction: column; gap: 10px;">
                ${modulesLeftHtml}
              </div>
              
              <!-- Right Panel: Tasks under selected module -->
               <div class="student-card" style="margin: 0; background: #fafafb; border: 1px solid var(--border-color); padding: 16px;">
                <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-main); margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                  <span>📋</span> Tasks for: <span style="color: var(--primary); font-weight: 800;">${selectedModuleName || 'None'}</span>
                </div>
                <div style="max-height: 350px; overflow-y: auto; padding-right: 4px;">
                  ${tasksRowsHtml}
                </div>
              </div>
            </div>
          </div>
        `;
        } else if (activeTab === 'github') {
          tabContentHtml = `
            <div class="project-tab-content">
              <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 16px;">GitHub Integration</h3>
              
              <div class="student-card" style="background:#f8fafc; border-color:var(--border-color); display:flex; flex-direction:column; gap:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-weight:700; font-size:0.95rem; color:var(--text-main);">Repository Status</span>
                  ${projectGithub ? `
                    <span class="student-badge student-badge-success" style="padding: 6px 12px; font-weight:700;">
                      ✓ Verified by Faculty
                    </span>
                  ` : `
                    <span class="student-badge student-badge-warning" style="padding: 6px 12px; font-weight:700;">
                      No Repository Linked
                    </span>
                  `}
                </div>

                ${projectGithub ? `
                  <div class="student-detail-field" style="margin: 0;">
                    <div class="student-detail-label">Connected Repository URL</div>
                    <div class="student-detail-value" style="font-family: monospace; font-size: 0.9rem; background: white; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px; margin-top: 6px;">
                      <a href="${projectGithub.url}" target="_blank" style="color: var(--primary); text-decoration: none; word-break: break-all;">
                        ${projectGithub.url}
                      </a>
                    </div>
                  </div>
                  <div class="student-detail-field" style="margin: 0;">
                    <div class="student-detail-label">Verifying Supervisor</div>
                    <div class="student-detail-value" style="font-weight:600; margin-top:4px;">${projectGithub.faculty || selectedProject.faculty}</div>
                  </div>
                ` : `
                  <p style="color:var(--text-muted); font-size:0.875rem; margin:0;">
                    No Github repository link has been set for this project yet. Please coordinate with your faculty supervisor to bind the repository.
                  </p>
                `}

                <button class="student-btn student-btn-outline student-btn-sm btn-manage-git" style="width:fit-content;">
                  Go to GitHub Manager
                </button>
              </div>
            </div>
          `;
        }
      }

      // Main detail container HTML
      const detailsHtml = selectedProject ? `
        <div class="student-card">
          <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 16px; margin-bottom: 20px;">
            <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--text-main); margin-bottom: 4px;">${selectedProject.title}</h2>
            <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">
              Assigned Track: <strong style="color: var(--primary);">${selectedProject.designation}</strong>
            </span>
          </div>

          <!-- Project Tab Navigation -->
          <div class="project-tabs-nav">
            <button class="project-tab-btn ${activeTab === 'overview' ? 'active' : ''}" data-tab="overview">Overview</button>
            <button class="project-tab-btn ${activeTab === 'team' ? 'active' : ''}" data-tab="team">Team</button>
            <button class="project-tab-btn ${activeTab === 'modules' ? 'active' : ''}" data-tab="modules">Modules</button>
            <button class="project-tab-btn ${activeTab === 'tasks' ? 'active' : ''}" data-tab="tasks">Tasks</button>
            <button class="project-tab-btn ${activeTab === 'sprints' ? 'active' : ''}" data-tab="sprints">Sprint</button>
            <button class="project-tab-btn ${activeTab === 'github' ? 'active' : ''}" data-tab="github">GitHub</button>
          </div>

          <!-- Dynamic Content Outlet -->
          <div id="project-tab-outlet">
            ${tabContentHtml}
          </div>
        </div>
      ` : `
        <div class="student-card" style="display: flex; align-items: center; justify-content: center; min-height: 400px; color: var(--text-muted);">
          Select a project from the cards to inspect development details.
        </div>
      `;

      container.innerHTML = `
        <div style="margin-bottom: 20px; display: flex; justify-content: flex-start;">
          <button class="student-btn student-btn-outline btn-back-to-cards" style="display: inline-flex; align-items: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Back to Projects</span>
          </button>
        </div>

        <div id="project-details-outlet">
          ${detailsHtml}
        </div>
      `;
    }

    // Attach Event Listeners
    if (!isDetailView) {
      container.querySelectorAll('.btn-view-details').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          selectedProjectId = parseInt(btn.dataset.id, 10);
          activeTab = 'overview';
          isDetailView = true;
          selectedModuleName = null;
          render();
        });
      });
      container.querySelectorAll('.project-summary-card').forEach(card => {
        card.addEventListener('click', () => {
          selectedProjectId = parseInt(card.dataset.id, 10);
          activeTab = 'overview';
          isDetailView = true;
          selectedModuleName = null;
          render();
        });
      });
    } else {
      container.querySelector('.btn-back-to-cards')?.addEventListener('click', () => {
        if (route?.params?.id && router) {
          router.push('/student/projects');
        } else {
          isDetailView = false;
          selectedProjectId = null;
          render();
        }
      });

      container.querySelectorAll('.project-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          activeTab = btn.dataset.tab;
          render();
        });
      });

      container.querySelector('.btn-manage-git')?.addEventListener('click', () => {
        router.push('/student/github');
      });

      if (activeTab === 'modules') {
        container.querySelectorAll('.module-item-card').forEach(el => {
          el.addEventListener('click', () => {
            selectedModuleName = el.getAttribute('data-module-name');
            render();
          });
        });
      }

      // Bind Team Lead Sprint Management triggers
      if (activeTab === 'sprints') {
        container.querySelector('.btn-add-sprint')?.addEventListener('click', () => {
          openSprintModal(selectedProject);
        });

        container.querySelectorAll('.btn-edit-sprint').forEach(btn => {
          btn.addEventListener('click', () => {
            const sprintId = parseInt(btn.dataset.sprintId, 10);
            const sprintsList = getSprints() || [];
            const sprintToEdit = sprintsList.find(s => s.id === sprintId);
            if (sprintToEdit) {
              openSprintModal(selectedProject, sprintToEdit);
            }
          });
        });

        container.querySelectorAll('.btn-submit-sprint').forEach(btn => {
          btn.addEventListener('click', async () => {
            const sprintId = parseInt(btn.dataset.sprintId, 10);
            const sprintsList = getSprints() || [];
            const sprint = sprintsList.find(s => s.id === sprintId);
            if (sprint) {
              sprint.status = 'SUBMITTED';
              sprint.approvalStatus = 'Faculty Review';
              await saveSprint(sprint);
              render();
            }
          });
        });
      }
    }
  }

  render();
  return container;
}

export default StudentProjects;
