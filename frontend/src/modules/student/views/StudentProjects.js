import { renderStudentSidebar } from './StudentSidebar.js';
import { getProjects, getSprints, getGithub, ensureDataLoaded } from './studentStore.js';
import { useAuthStore } from '@/core/stores/auth.js';
import '../student.css';

export async function StudentProjects(route, router) {
  await ensureDataLoaded();
  renderStudentSidebar();

  const container = document.createElement('div');
  container.className = 'student-portal-container animate-fade-in';

  const authStore = useAuthStore();
  const currentUser = authStore.user;

  // 1. Fetch mock projects assigned to the student
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
  let activeTab = 'overview'; // 'overview', 'team', 'modules', 'tasks', 'github'
  let selectedModuleName = null;
  let projectSearch = '';
  let projectStatusFilter = 'all'; // 'all' | 'In Progress' | 'Completed'

  function render() {
    const selectedProject = assignedProjects.find(p => p.id === selectedProjectId);
    const modulesData = getSprints() || [];
    const githubData = getGithub() || [];

    // KPI counts
    const totalProjectsCount = assignedProjects.length;
    const inProgressCount = assignedProjects.filter(p => p.status === 'In Progress').length;
    const completedCount = assignedProjects.filter(p => p.status === 'Completed').length;

    // Filter projects for overview list
    const filteredProjects = assignedProjects.filter(p => {
      if (projectStatusFilter !== 'all' && p.status !== projectStatusFilter) return false;
      if (projectSearch.trim()) {
        const q = projectSearch.toLowerCase().trim();
        const mTitle = (p.title || '').toLowerCase().includes(q);
        const mFaculty = (p.faculty || '').toLowerCase().includes(q);
        const mDesig = (p.designation || '').toLowerCase().includes(q);
        if (!mTitle && !mFaculty && !mDesig) return false;
      }
      return true;
    });
    const isProjectFilterActive = projectSearch.trim() !== '' || projectStatusFilter !== 'all';

    // Filter module data and github for selected project
    const projectModules = selectedProject ? modulesData.filter(s => s.projectId === selectedProject.id) : [];
    const projectGithub = selectedProject ? githubData.find(g => g.project === selectedProject.title) : null;

    if (!isDetailView) {
      // Build project cards HTML (Initial View)
      const projectCardsHtml = filteredProjects.map(p => {
        const teamList = p.membersList || p.team || [];
        const teamChipsHtml = teamList.map(m => {
          const isMe = m.isCurrentUser || (m.name && m.name.toLowerCase() === (currentUser?.name?.toLowerCase() || ''));
          const initial = (m.name || 'U').charAt(0).toUpperCase();
          let avatarClass = '';
          if (m.isTeamLead) {
            avatarClass = 'is-lead';
          } else if (m.role?.toLowerCase()?.includes('designer')) {
            avatarClass = 'is-designer';
          }

          return `
            <div class="team-member-mini-card ${isMe ? 'is-me' : ''}" title="${m.name} - ${m.roleDisplay || m.role || 'Member'}">
              <div class="member-mini-avatar ${avatarClass}">
                ${initial}
              </div>
              <div class="member-mini-info">
                <div class="member-mini-name-row">
                  <span class="member-mini-name">${m.name}</span>
                  ${isMe ? `<span class="member-tag-you">You</span>` : ''}
                  ${m.isTeamLead ? `<span class="member-tag-lead">Lead</span>` : ''}
                </div>
                <span class="member-mini-role ${m.isTeamLead ? 'role-lead' : ''}">
                  ${m.roleDisplay || m.role || 'Member'}
                </span>
              </div>
            </div>
          `;
        }).join('');

        // Modules & Tasks for this project
        const modulesList = p.modulesList || p.modules || [];
        const totalTasks = p.totalTasksCount ?? modulesList.reduce((acc, m) => acc + (m.tasks ? m.tasks.length : 0), 0);
        const completedTasks = p.completedTasksCount ?? modulesList.reduce((acc, m) => acc + (m.tasks ? m.tasks.filter(t => t.status === 'Completed').length : 0), 0);

        const modulesHtml = modulesList.length > 0 ? modulesList.map(mod => {
          const mStatus = mod.status || 'Todo';
          const mStatusClass = mStatus === 'Completed' ? 'student-badge-success' : (mStatus === 'In Progress' ? 'student-badge-warning' : 'student-badge-neutral');
          const modTasks = mod.tasks || [];
          const modDone = modTasks.filter(t => t.status === 'Completed').length;

          const tasksHtml = modTasks.length > 0 ? modTasks.map(t => {
            const isMyTask = t.isMyTask || (t.assignee && t.assignee.toLowerCase() === (currentUser?.name?.toLowerCase() || ''));
            const tStatusClass = t.status === 'Completed' ? 'status-completed' : (t.status === 'In Progress' ? 'status-progress' : 'status-todo');
            return `
              <div class="project-card-task-row ${isMyTask ? 'is-my-task' : ''}">
                <div class="task-row-left">
                  <span class="task-status-bullet ${tStatusClass}"></span>
                  <span class="task-row-title" title="${t.title}">${t.title}</span>
                </div>
                <div class="task-row-right">
                  <span class="task-row-assignee">
                    ${t.assignee}
                    ${isMyTask ? `<span class="member-tag-you" style="margin-left: 4px; font-size: 0.58rem; padding: 0 4px;">You</span>` : ''}
                  </span>
                  <span class="task-row-status-pill ${tStatusClass}">${t.status}</span>
                </div>
              </div>
            `;
          }).join('') : `<div class="project-module-tasks-empty">No individual tasks defined in this module</div>`;

          return `
            <div class="project-module-card">
              <div class="project-module-card-header">
                <div class="project-module-name-box">
                  <span class="module-folder-icon">📦</span>
                  <span class="project-module-name" title="${mod.name}">${mod.name}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span class="student-badge ${mStatusClass}" style="font-size: 0.65rem; padding: 2px 7px;">${mStatus}</span>
                  <span class="module-tasks-counter-pill">${modDone}/${modTasks.length} Tasks</span>
                </div>
              </div>
              <div class="project-module-tasks-container">
                ${tasksHtml}
              </div>
            </div>
          `;
        }).join('') : `<div style="font-size: 0.75rem; color: #94a3b8; font-style: italic; padding: 4px 0;">No modules assigned yet</div>`;

        return `
        <div class="student-card project-summary-card" 
             style="margin-bottom: 16px; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column;" 
             data-id="${p.id}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <div>
              <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">${p.title}</h3>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Timeline: ${p.timeline || 'Active'}</div>
            </div>
            <span class="student-badge ${p.status === 'Completed' ? 'student-badge-success' : 'student-badge-warning'}">${p.status}</span>
          </div>
          
          <div style="display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; align-items: center;">
            <span class="student-badge student-badge-info" style="font-size: 0.7rem;">${p.designation}</span>
            <span style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500;">Supervisor: <strong style="color: #334155;">${p.faculty}</strong></span>
          </div>

          <div style="margin-bottom: 14px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">
              <span>Progress (${completedTasks}/${totalTasks} Tasks)</span>
              <span style="font-weight: 600;">${p.progress}%</span>
            </div>
            <div class="student-progress-bar-bg">
              <div class="student-progress-bar-fill" style="width: ${p.progress}%;"></div>
            </div>
          </div>

          <!-- Development Team Section -->
          <div class="project-team-section">
            <div class="project-team-header">
              <span class="project-team-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #059669;">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                Development Team
              </span>
              <span class="project-team-count">${teamList.length} Member${teamList.length === 1 ? '' : 's'}</span>
            </div>

            <div class="project-team-cards-grid">
              ${teamChipsHtml || '<div style="font-size: 0.75rem; color: #94a3b8; font-style: italic;">No team members assigned yet</div>'}
            </div>
          </div>

          <!-- Project Modules & Tasks Section -->
          <div class="project-modules-section">
            <div class="project-modules-header">
              <span class="project-modules-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #0284c7;">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                  <polyline points="2 17 12 22 22 17"></polyline>
                  <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
                Modules & Tasks
              </span>
              <span class="project-modules-count">${modulesList.length} Modules • ${totalTasks} Tasks</span>
            </div>

  
          </div>

          <div style="margin-top: auto; padding-top: 14px; display: flex; justify-content: flex-end;">
            <button class="student-btn student-btn-primary btn-view-details" data-id="${p.id}" style="width: auto; padding: 0.4rem 1.25rem; font-size: 0.8rem;">
              View Details →
            </button>
          </div>
        </div>
        `;
      }).join('');

      container.innerHTML = `
        <div class="student-header">
          <h1>My Projects</h1>
          <p>Inspect development modules, milestones, and task assignments in your team.</p>
        </div>

        <!-- KPI Strip -->
        <div class="student-stats-strip">
          <div class="student-stat-chip">
            <span class="student-stat-chip-count">${totalProjectsCount}</span>
            <span class="student-stat-chip-label">Total Assigned</span>
          </div>
          <div class="student-stat-chip amber">
            <span class="student-stat-chip-count">${inProgressCount}</span>
            <span class="student-stat-chip-label">In Progress</span>
          </div>
          <div class="student-stat-chip emerald">
            <span class="student-stat-chip-count">${completedCount}</span>
            <span class="student-stat-chip-label">Completed</span>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="student-filter-bar">
          <div class="student-search-wrapper">
            <svg class="student-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" id="project-search-input" class="student-search-input" placeholder="Search projects by title, supervisor, or track..." value="${projectSearch}">
          </div>

          <div class="student-filter-pills">
            <button type="button" class="student-filter-pill ${projectStatusFilter === 'all' ? 'active' : ''}" data-status="all">All</button>
            <button type="button" class="student-filter-pill ${projectStatusFilter === 'In Progress' ? 'active' : ''}" data-status="In Progress">In Progress</button>
            <button type="button" class="student-filter-pill ${projectStatusFilter === 'Completed' ? 'active' : ''}" data-status="Completed">Completed</button>
          </div>

          ${isProjectFilterActive ? `
            <button type="button" id="btn-clear-proj-filters" class="student-filter-btn-clear" title="Reset filters">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              Reset
            </button>
          ` : ''}
        </div>

        ${filteredProjects.length === 0 ? `
          <div class="student-card">
            <div class="student-empty-filter">
              <div class="student-empty-filter-icon">🔍</div>
              <div class="student-empty-filter-text">No projects match your filter criteria</div>
              <div class="student-empty-filter-sub">Try adjusting your search query or status filter.</div>
              <button type="button" id="btn-empty-clear-proj" class="student-btn student-btn-outline student-btn-sm" style="margin: 0 auto;">
                Clear Filters
              </button>
            </div>
          </div>
        ` : `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px;">
            ${projectCardsHtml}
          </div>
        `}
      `;
    } else {
      // Dynamic Team members list for Project Team tab
      let teamMembers = [];
      if (selectedProject) {
        teamMembers = selectedProject.membersList || [];
      }

      // Build Tab Content HTML
      let tabContentHtml = "";
      if (selectedProject) {
        if (activeTab === 'overview') {
          tabContentHtml = `
            <div class="project-tab-content">
              <h3 class="project-section-title">Project Overview</h3>
              <div class="project-info-grid">
                <div class="project-info-tile">
                  <div class="project-info-icon-box emerald">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                  </div>
                  <div class="project-info-text">
                    <span class="project-info-label">Client / Sponsor Agency</span>
                    <span class="project-info-val">${selectedProject.clientInfo || 'RLabZ Academy'}</span>
                  </div>
                </div>

                <div class="project-info-tile">
                  <div class="project-info-icon-box blue">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  </div>
                  <div class="project-info-text">
                    <span class="project-info-label">Project Timeline</span>
                    <span class="project-info-val">${selectedProject.timeline}</span>
                  </div>
                </div>

                <div class="project-info-tile">
                  <div class="project-info-icon-box amber">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </div>
                  <div class="project-info-text">
                    <span class="project-info-label">Faculty Supervisor</span>
                    <span class="project-info-val" style="color: #059669;">${selectedProject.faculty}</span>
                  </div>
                </div>

                <div class="project-info-tile">
                  <div class="project-info-icon-box purple">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                  </div>
                  <div class="project-info-text">
                    <span class="project-info-label">Overall Status</span>
                    <span class="project-info-val">
                      <span class="student-badge ${selectedProject.status === 'Completed' ? 'student-badge-success' : 'student-badge-warning'}">${selectedProject.status}</span>
                    </span>
                  </div>
                </div>
              </div>

              <!-- Description Tile -->
              <div class="project-description-card">
                <div class="project-description-header">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #059669;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  <span>Project Scope & Objectives</span>
                </div>
                <p class="project-description-text">${selectedProject.description}</p>
              </div>

              <!-- Completion Progress Card -->
              <div class="project-progress-card">
                <div class="project-progress-header">
                  <div>
                    <span class="project-progress-label">Overall Completion Progress</span>
                    <span class="project-progress-sub">Calculated based on verified module deliverables</span>
                  </div>
                  <span class="project-progress-percentage">${selectedProject.progress}%</span>
                </div>
                <div class="student-progress-bar-bg" style="height: 12px;">
                  <div class="student-progress-bar-fill" style="width: ${selectedProject.progress}%; height: 12px;"></div>
                </div>
              </div>
            </div>
          `;
        } else if (activeTab === 'team') {
          const teamCards = teamMembers.map(m => {
            const isMe = m.isCurrentUser || (m.name && m.name.toLowerCase() === (currentUser?.name?.toLowerCase() || ''));
            let badgesHtml = '';
            if (m.isTeamLead) {
              badgesHtml += `<span class="team-lead-badge">★ Team Lead</span>`;
            }
            if (isMe) {
              const rightOffset = m.isTeamLead ? '112px' : '14px';
              badgesHtml += `<span class="team-me-badge" style="right: ${rightOffset};">You</span>`;
            }

            const initial = (m.name || 'U').charAt(0).toUpperCase();
            const roleName = m.roleDisplay || m.role || (m.isTeamLead ? 'Project Lead' : 'Developer');
            const avatarStyle = m.isTeamLead 
              ? 'background: linear-gradient(135deg, #d97706 0%, #b45309 100%);' 
              : (m.role?.toLowerCase()?.includes('designer') 
                ? 'background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);' 
                : '');

            return `
              <div class="team-member-card ${isMe ? 'is-current-user' : ''}">
                ${badgesHtml}
                <div class="member-avatar" style="${avatarStyle}">
                  ${initial}
                </div>
                <div class="member-name">${m.name}</div>
                <div class="member-designation">${m.designation || 'Student'} Track</div>
                <div class="member-role">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  <span>${roleName}</span>
                </div>
              </div>
            `;
          }).join('');

          tabContentHtml = `
            <div class="project-tab-content">
              <div class="project-section-header">
                <div>
                  <h3 class="project-section-title">Development Team</h3>
                  <p class="project-section-sub">Assigned peer developers, track roles, and leadership.</p>
                </div>
                <span class="student-badge student-badge-info" style="font-size: 0.75rem;">${teamMembers.length} Members</span>
              </div>
              <div class="project-members-grid">
                ${teamCards}
              </div>
            </div>
          `;
        } else if (activeTab === 'modules') {
          const currentProjectModules = (selectedProject.modulesList && selectedProject.modulesList.length > 0)
            ? selectedProject.modulesList
            : projectModules;

          if (!selectedModuleName && currentProjectModules.length > 0) {
            selectedModuleName = currentProjectModules[0].name;
          }

          const foundModule = currentProjectModules.find(s => s.name === selectedModuleName);
          const moduleTasks = foundModule ? (foundModule.tasks || []) : [];

          const modulesLeftHtml = currentProjectModules.length > 0
            ? currentProjectModules.map(m => {
                const isActive = m.name === selectedModuleName;
                const mStatus = m.status || 'Todo';
                const mStatusClass = mStatus === 'Completed' ? 'student-badge-success' : (mStatus === 'In Progress' ? 'student-badge-warning' : 'student-badge-info');
                return `
                  <div class="module-item-card ${isActive ? 'active' : ''}" data-module-name="${m.name}">
                    <div class="module-icon-box">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                      <div class="module-item-name">${m.name}</div>
                      <div style="display: flex; gap: 6px; margin-top: 4px; align-items: center;">
                        <span class="student-badge ${mStatusClass}" style="font-size: 0.62rem; padding: 1px 6px;">${mStatus}</span>
                        <span style="font-size: 0.68rem; color: var(--text-muted);">${(m.tasks || []).length} Tasks</span>
                      </div>
                    </div>
                    <svg class="module-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </div>
                `;
              }).join('')
            : '<div style="color:var(--text-muted); padding: 16px;">No modules assigned to this project.</div>';

          const tasksRowsHtml = moduleTasks.length > 0 
            ? moduleTasks.map(t => {
                const isMyTask = t.isMyTask || (t.assignee && t.assignee.toLowerCase() === (currentUser?.name?.toLowerCase() || ''));
                const taskTitle = t.title || t.name;
                return `
                <div class="student-task-item ${isMyTask ? 'is-my-task' : ''}" style="${isMyTask ? 'border-left: 3px solid #059669; background: #f0fdf4;' : ''}">
                  <div class="student-task-main">
                    <span class="student-task-title">${taskTitle}</span>
                    <span class="student-task-assignee">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      Assignee: <strong>${t.assignee}</strong>
                      ${isMyTask ? `<span class="member-tag-you" style="margin-left: 6px;">You</span>` : ''}
                    </span>
                  </div>
                  <span class="student-badge ${t.status === 'Completed' ? 'student-badge-success' : t.status === 'In Progress' ? 'student-badge-warning' : 'student-badge-info'}">${t.status}</span>
                </div>
              `;
            }).join('')
            : '<div style="padding: 36px; text-align: center; color: var(--text-muted); font-size: 0.9rem;">No tasks found under this module.</div>';

          tabContentHtml = `
            <div class="project-tab-content">
              <div class="project-section-header">
                <div>
                  <h3 class="project-section-title">Assigned Modules</h3>
                  <p class="project-section-sub">Functionalities and components allocated to your development scope. Select a module to inspect its tasks.</p>
                </div>
              </div>
              
              <div class="project-modules-pane">
                <!-- Left Panel: Modules list -->
                <div class="modules-sidebar-list">
                  ${modulesLeftHtml}
                </div>
                
                <!-- Right Panel: Tasks under selected module -->
                <div class="module-tasks-card">
                  <div class="module-tasks-header">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #059669;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                      <span>Tasks for: <strong style="color: #059669;">${selectedModuleName || 'None'}</strong></span>
                    </div>
                    <span class="student-badge student-badge-info" style="font-size: 0.72rem;">${moduleTasks.length} Tasks</span>
                  </div>
                  <div class="module-tasks-scroll">
                    ${tasksRowsHtml}
                  </div>
                </div>
              </div>
            </div>
          `;
        } else if (activeTab === 'tasks') {
          // Collect all tasks across modules
          const allTasks = [];
          const currentProjectModules = (selectedProject.modulesList && selectedProject.modulesList.length > 0)
            ? selectedProject.modulesList
            : projectModules;

          currentProjectModules.forEach(s => {
            (s.tasks || []).forEach(t => {
              allTasks.push({
                ...t,
                name: t.title || t.name,
                assignee: t.assignee || 'Unassigned',
                status: t.status || 'Todo',
                moduleName: s.name,
                isMyTask: t.isMyTask || (t.assignee && t.assignee.toLowerCase() === (currentUser?.name?.toLowerCase() || ''))
              });
            });
          });

          const taskRowsHtml = allTasks.map(t => `
            <tr style="${t.isMyTask ? 'background: #f0fdf4;' : ''}">
              <td>
                <div style="font-weight: 600; font-size: 0.9rem; color: #0f172a;">${t.name}</div>
                <div style="font-size: 0.75rem; color: #64748b; margin-top: 3px; display: flex; align-items: center; gap: 4px;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                  ${t.moduleName}
                </div>
              </td>
              <td>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span class="student-badge student-badge-info" style="font-size: 0.78rem;">${t.assignee}</span>
                  ${t.isMyTask ? `<span class="member-tag-you">You</span>` : ''}
                </div>
              </td>
              <td><span class="student-badge ${t.status === 'Completed' ? 'student-badge-success' : t.status === 'In Progress' ? 'student-badge-warning' : 'student-badge-danger'}">${t.status}</span></td>
            </tr>
          `).join('');

          tabContentHtml = `
            <div class="project-tab-content">
              <div class="project-section-header">
                <div>
                  <h3 class="project-section-title">Assigned Project Tasks</h3>
                  <p class="project-section-sub">Comprehensive list of sprint components and responsibilities.</p>
                </div>
                <span class="student-badge student-badge-info" style="font-size: 0.75rem;">${allTasks.length} Total Tasks</span>
              </div>
              <div class="student-table-container">
                <table class="student-table">
                  <thead>
                    <tr>
                      <th>Task & Module</th>
                      <th>Assignee</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${taskRowsHtml || '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);padding:32px;">No tasks found.</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
          `;
        } else if (activeTab === 'github') {
          tabContentHtml = `
            <div class="project-tab-content">
              <h3 class="project-section-title">GitHub Integration</h3>
              
              <div class="github-integration-card">
                <div class="github-card-header">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #0f172a;"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                    <span style="font-weight: 700; font-size: 1rem; color: #0f172a;">Repository Status</span>
                  </div>
                  ${projectGithub ? `
                    <span class="student-badge student-badge-success" style="padding: 6px 14px; font-weight: 700; font-size: 0.8rem;">
                      ✓ Verified by Faculty
                    </span>
                  ` : `
                    <span class="student-badge student-badge-warning" style="padding: 6px 14px; font-weight: 700; font-size: 0.8rem;">
                      No Repository Linked
                    </span>
                  `}
                </div>

                ${projectGithub ? `
                  <div class="github-url-box">
                    <div class="github-url-label">Connected Repository URL</div>
                    <div class="github-url-row">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #38bdf8; flex-shrink: 0;"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>
                      <a href="${projectGithub.url}" target="_blank" rel="noopener noreferrer" class="github-url-link">
                        ${projectGithub.url}
                      </a>
                    </div>
                  </div>
                  <div class="github-meta-row">
                    <span class="github-meta-label">Verifying Supervisor:</span>
                    <span class="github-meta-val">${projectGithub.faculty || selectedProject.faculty}</span>
                  </div>
                ` : `
                  <div class="github-empty-state">
                    <p style="color: #64748b; font-size: 0.9rem; margin: 0;">
                      No GitHub repository link has been set for this project yet. Please coordinate with your faculty supervisor to bind the repository.
                    </p>
                  </div>
                `}

                <button class="student-btn student-btn-outline student-btn-sm btn-manage-git" style="width: fit-content; border-radius: 20px; padding: 7px 18px; font-weight: 600;">
                  Go to GitHub Manager &rarr;
                </button>
              </div>
            </div>
          `;
        }
      }

      // Main detail container HTML
      const detailsHtml = selectedProject ? `
        <div class="project-detail-card">
          <!-- Project Detail Header -->
          <div class="project-detail-header">
            <div class="project-detail-title-col">
              <div class="project-detail-meta-row">
                
              </div>
              <h2 class="project-detail-title">${selectedProject.title}</h2>
            </div>
            <div class="project-detail-status-col">
              <span class="student-badge ${selectedProject.status === 'Completed' ? 'student-badge-success' : 'student-badge-warning'} project-detail-status-badge">
                ${selectedProject.status}
              </span>
            </div>
          </div>

          <!-- Project Tab Navigation -->
          <div class="project-tabs-nav">
            <button class="project-tab-btn ${activeTab === 'overview' ? 'active' : ''}" data-tab="overview">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              <span>Overview</span>
            </button>
            <button class="project-tab-btn ${activeTab === 'team' ? 'active' : ''}" data-tab="team">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              <span>Team</span>
            </button>
            <button class="project-tab-btn ${activeTab === 'modules' ? 'active' : ''}" data-tab="modules">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
              <span>Modules</span>
            </button>
            <button class="project-tab-btn ${activeTab === 'tasks' ? 'active' : ''}" data-tab="tasks">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
              <span>Tasks</span>
            </button>
            <button class="project-tab-btn ${activeTab === 'github' ? 'active' : ''}" data-tab="github">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
              <span>GitHub</span>
            </button>
          </div>

          <!-- Dynamic Content Outlet -->
          <div id="project-tab-outlet">
            ${tabContentHtml}
          </div>
        </div>
      ` : `
        <div class="student-card" style="display: flex; align-items: center; justify-content: center; min-height: 400px; color: var(--text-muted);">
          Select a project from the left panel to inspect details.
        </div>
      `;

      container.innerHTML = `
        <div class="student-header">
          <button class="btn-back-to-cards">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
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
      // Search input handler
      const projSearchInput = container.querySelector('#project-search-input');
      projSearchInput?.addEventListener('input', (e) => {
        projectSearch = e.target.value;
        render();
        const newInput = container.querySelector('#project-search-input');
        if (newInput) {
          newInput.focus();
          newInput.setSelectionRange(newInput.value.length, newInput.value.length);
        }
      });

      // Status filter pills
      container.querySelectorAll('.student-filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          projectStatusFilter = pill.getAttribute('data-status');
          render();
        });
      });

      // Clear filters
      const clearProjFilters = () => {
        projectSearch = '';
        projectStatusFilter = 'all';
        render();
      };
      container.querySelector('#btn-clear-proj-filters')?.addEventListener('click', clearProjFilters);
      container.querySelector('#btn-empty-clear-proj')?.addEventListener('click', clearProjFilters);

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
    }
  }

  render();
  return container;
}

export default StudentProjects;
