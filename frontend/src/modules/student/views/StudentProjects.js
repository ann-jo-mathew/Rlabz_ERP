import { renderStudentSidebar } from './StudentSidebar.js';
import { getProjects, getSprints, getGithub, ensureDataLoaded } from './studentStore.js';
import { useAuthStore } from '@/core/stores/auth.js';
import '../student.css';

export async function StudentProjects(route, router) {
  await ensureDataLoaded();
  renderStudentSidebar();

  const container = document.createElement('div');
  container.className = 'student-portal-container animate-fade-in student-projects-view';

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
    const totalTasksCount = assignedProjects.reduce((acc, p) => {
      const modulesList = p.modulesList || p.modules || [];
      const count = p.totalTasksCount ?? modulesList.reduce((sum, m) => sum + (m.tasks ? m.tasks.length : 0), 0);
      return acc + count;
    }, 0);

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
            <div class="student-proj-member-chip ${isMe ? 'is-me' : ''}" title="${m.name} - ${m.roleDisplay || m.role || 'Member'}">
              <div class="student-proj-member-avatar ${avatarClass}">
                ${initial}
              </div>
              <span>${m.name}</span>
              ${isMe ? `<span class="member-tag-you" style="font-size:0.6rem; padding:1px 4px;">You</span>` : ''}
              ${m.isTeamLead ? `<span class="member-tag-lead" style="font-size:0.6rem; padding:1px 4px;">Lead</span>` : ''}
            </div>
          `;
        }).join('');

        // Modules & Tasks for this project
        const modulesList = p.modulesList || p.modules || [];
        const totalTasks = p.totalTasksCount ?? modulesList.reduce((acc, m) => acc + (m.tasks ? m.tasks.length : 0), 0);
        const completedTasks = p.completedTasksCount ?? modulesList.reduce((acc, m) => acc + (m.tasks ? m.tasks.filter(t => t.status === 'Completed').length : 0), 0);

        return `
        <div class="student-proj-card project-summary-card" data-id="${p.id}">
          <div class="student-proj-card-top">
            <div>
              <h3 class="student-proj-card-title">${p.title}</h3>
              <div class="student-proj-card-timeline">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span>Timeline: ${p.timeline || 'Active'}</span>
              </div>
            </div>
            <span class="student-badge ${p.status === 'Completed' ? 'student-badge-success' : 'student-badge-warning'}">${p.status}</span>
          </div>

          <div class="student-proj-meta-chips">
            <span class="student-badge student-badge-info" style="font-size: 0.72rem; font-weight: 700;">${p.designation}</span>
            <span class="student-proj-sup-chip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              Supervisor: <strong>${p.faculty}</strong>
            </span>
          </div>

          <!-- Progress -->
          <div class="student-proj-progress-box">
            <div class="student-proj-progress-head">
              <span>Progress (${completedTasks}/${totalTasks} Tasks)</span>
              <span class="student-proj-progress-pct">${p.progress}%</span>
            </div>
            <div class="student-proj-progress-bar-bg">
              <div class="student-proj-progress-bar-fill" style="width: ${p.progress}%;"></div>
            </div>
          </div>

          <!-- Development Team Section -->
          <div class="student-proj-team-section">
            <div class="student-proj-team-label-row">
              <span style="display: flex; align-items: center; gap: 5px;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #0284c7;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                Development Team
              </span>
              <span>${teamList.length} Member${teamList.length === 1 ? '' : 's'}</span>
            </div>
            <div class="student-proj-team-chips-wrap">
              ${teamChipsHtml || '<span style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">No team members assigned</span>'}
            </div>
          </div>

          <!-- Footer -->
          <div class="student-proj-card-footer">
            <span style="font-size: 0.74rem; font-weight: 700; color: var(--text-muted);">
              ${modulesList.length} ${modulesList.length === 1 ? 'Module' : 'Modules'} • ${totalTasks} ${totalTasks === 1 ? 'Task' : 'Tasks'}
            </span>
            <button type="button" class="student-proj-view-btn btn-view-details" data-id="${p.id}">
              <span>View Details</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
          </div>
        </div>
        `;
      }).join('');

      container.innerHTML = `
        <!-- Header Banner -->
        <div class="student-proj-header-wrapper">
          <div class="student-proj-header-left">
            <div class="student-proj-brand-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
            </div>
            <div>
              <h1 class="student-proj-title">My Projects</h1>
              <p class="student-proj-subtitle">Inspect development modules, milestones, team members, and task assignments.</p>
            </div>
          </div>
        </div>

        <!-- KPI Grid -->
        <div class="student-proj-kpi-grid">
          <div class="student-proj-kpi-card kpi-blue">
            <div class="student-proj-kpi-icon blue">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
            </div>
            <div class="student-proj-kpi-info">
              <div class="student-proj-kpi-val">${totalProjectsCount}</div>
              <div class="student-proj-kpi-lbl">Assigned Projects</div>
            </div>
          </div>

          <div class="student-proj-kpi-card kpi-amber">
            <div class="student-proj-kpi-icon amber">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <div class="student-proj-kpi-info">
              <div class="student-proj-kpi-val">${inProgressCount}</div>
              <div class="student-proj-kpi-lbl">In Progress</div>
            </div>
          </div>

          <div class="student-proj-kpi-card kpi-emerald">
            <div class="student-proj-kpi-icon emerald">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <div class="student-proj-kpi-info">
              <div class="student-proj-kpi-val">${completedCount}</div>
              <div class="student-proj-kpi-lbl">Completed</div>
            </div>
          </div>

          <div class="student-proj-kpi-card kpi-indigo">
            <div class="student-proj-kpi-icon indigo">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
            </div>
            <div class="student-proj-kpi-info">
              <div class="student-proj-kpi-val">${totalTasksCount}</div>
              <div class="student-proj-kpi-lbl">Total Tasks</div>
            </div>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="student-proj-filter-bar">
          <div class="student-proj-search-wrap">
            <svg class="student-proj-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" id="project-search-input" class="student-proj-search-input" placeholder="Search projects by title, supervisor, or track..." value="${projectSearch}">
          </div>

          <div class="student-proj-filter-pills">
            <button type="button" class="student-proj-filter-pill ${projectStatusFilter === 'all' ? 'active' : ''}" data-status="all">All</button>
            <button type="button" class="student-proj-filter-pill ${projectStatusFilter === 'In Progress' ? 'active' : ''}" data-status="In Progress">In Progress</button>
            <button type="button" class="student-proj-filter-pill ${projectStatusFilter === 'Completed' ? 'active' : ''}" data-status="Completed">Completed</button>
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
            <div class="student-empty-filter" style="padding: 48px 24px;">
              <div class="student-empty-filter-icon">🔍</div>
              <div class="student-empty-filter-text">No projects match your filter criteria</div>
              <div class="student-empty-filter-sub">Try adjusting your search query or status filter.</div>
              <button type="button" id="btn-empty-clear-proj" class="student-btn student-btn-outline student-btn-sm" style="margin: 0 auto;">
                Clear Filters
              </button>
            </div>
          </div>
        ` : `
          <div class="student-proj-grid">
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
              <div class="student-proj-overview-grid">
                <div class="student-proj-info-tile">
                  <div class="student-proj-info-icon emerald">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                  </div>
                  <div class="student-proj-info-text">
                    <span class="student-proj-info-label">Client / Sponsor</span>
                    <span class="student-proj-info-val">${selectedProject.clientInfo || 'RLabZ Academy'}</span>
                  </div>
                </div>

                <div class="student-proj-info-tile">
                  <div class="student-proj-info-icon blue">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  </div>
                  <div class="student-proj-info-text">
                    <span class="student-proj-info-label">Project Timeline</span>
                    <span class="student-proj-info-val">${selectedProject.timeline || 'Active'}</span>
                  </div>
                </div>

                <div class="student-proj-info-tile">
                  <div class="student-proj-info-icon amber">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </div>
                  <div class="student-proj-info-text">
                    <span class="student-proj-info-label">Supervisor</span>
                    <span class="student-proj-info-val" style="color: #0284c7;">${selectedProject.faculty}</span>
                  </div>
                </div>

                <div class="student-proj-info-tile">
                  <div class="student-proj-info-icon purple">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                  </div>
                  <div class="student-proj-info-text">
                    <span class="student-proj-info-label">Current Status</span>
                    <span class="student-proj-info-val">
                      <span class="student-badge ${selectedProject.status === 'Completed' ? 'student-badge-success' : 'student-badge-warning'}">${selectedProject.status}</span>
                    </span>
                  </div>
                </div>
              </div>

              <!-- Description Scope Card -->
              <div class="student-proj-desc-card">
                <div class="student-proj-desc-head">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  <span>Project Scope & Objectives</span>
                </div>
                <p class="student-proj-desc-text">${selectedProject.description || 'No description provided.'}</p>
              </div>

              <!-- Completion Gauge Card -->
              <div class="student-proj-gauge-card">
                <div class="student-proj-gauge-head">
                  <div>
                    <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">Overall Completion Progress</div>
                    <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">Calculated based on verified sprint task deliverables</div>
                  </div>
                  <span class="student-proj-gauge-pct">${selectedProject.progress}%</span>
                </div>
                <div class="student-proj-progress-bar-bg" style="height: 10px;">
                  <div class="student-proj-progress-bar-fill" style="width: ${selectedProject.progress}%; height: 10px;"></div>
                </div>
              </div>
            </div>
          `;
        } else if (activeTab === 'team') {
          const teamCards = teamMembers.map(m => {
            const isMe = m.isCurrentUser || (m.name && m.name.toLowerCase() === (currentUser?.name?.toLowerCase() || ''));
            let badgesHtml = '';
            if (m.isTeamLead) {
              badgesHtml += `<span class="student-proj-lead-badge">★ Team Lead</span>`;
            }
            if (isMe) {
              const rightOffset = m.isTeamLead ? '112px' : '14px';
              badgesHtml += `<span class="student-proj-you-badge" style="right: ${rightOffset};">You</span>`;
            }

            const initial = (m.name || 'U').charAt(0).toUpperCase();
            const roleName = m.roleDisplay || m.role || (m.isTeamLead ? 'Project Lead' : 'Developer');
            const avatarStyle = m.isTeamLead 
              ? 'background: linear-gradient(135deg, #d97706 0%, #b45309 100%);' 
              : (m.role?.toLowerCase()?.includes('designer') 
                ? 'background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);' 
                : '');

            return `
              <div class="student-proj-member-card ${isMe ? 'is-current-user' : ''}">
                ${badgesHtml}
                <div class="student-proj-avatar-lg" style="${avatarStyle}">
                  ${initial}
                </div>
                <div style="font-weight: 800; color: var(--text-primary); font-size: 1.05rem;">${m.name}</div>
                <div class="member-designation">${m.designation || 'Student'} Track</div>
                <div style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600; display: flex; align-items: center; gap: 5px; margin-top: 2px;">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  <span>${roleName}</span>
                </div>
              </div>
            `;
          }).join('');

          tabContentHtml = `
            <div class="project-tab-content">
              <div class="student-rep-project-header" style="margin-bottom: 18px;">
                <div>
                  <h3 class="student-rep-project-title" style="font-size: 1.1rem;">Development Team</h3>
                  <p style="font-size: 0.82rem; color: var(--text-muted); margin: 3px 0 0 0;">Assigned peer developers, track roles, and leadership.</p>
                </div>
                <span class="student-badge student-badge-info" style="font-size: 0.75rem; font-weight: 800;">${teamMembers.length} Members</span>
              </div>
              <div class="student-proj-team-grid">
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
                  <div class="student-proj-mod-item ${isActive ? 'active' : ''}" data-module-name="${m.name}">
                    <div class="student-proj-mod-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                      <div class="student-proj-mod-name">${m.name}</div>
                      <div style="display: flex; gap: 6px; margin-top: 4px; align-items: center;">
                        <span class="student-badge ${mStatusClass}" style="font-size: 0.65rem; padding: 1px 6px;">${mStatus}</span>
                        <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">${(m.tasks || []).length} Tasks</span>
                      </div>
                    </div>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--text-muted);"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </div>
                `;
              }).join('')
            : '<div style="color:var(--text-muted); padding: 16px;">No modules assigned to this project.</div>';

          const tasksRowsHtml = moduleTasks.length > 0 
            ? moduleTasks.map(t => {
                const isMyTask = t.isMyTask || (t.assignee && t.assignee.toLowerCase() === (currentUser?.name?.toLowerCase() || ''));
                const taskTitle = t.title || t.name;
                return `
                <div class="student-proj-task-row ${isMyTask ? 'is-my-task' : ''}">
                  <div style="display: flex; flex-direction: column; gap: 3px;">
                    <span style="font-weight: 700; font-size: 0.9rem; color: var(--text-primary);">${taskTitle}</span>
                    <span style="font-size: 0.76rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      Assignee: <strong style="color: #334155;">${t.assignee}</strong>
                      ${isMyTask ? `<span class="member-tag-you" style="margin-left: 4px;">You</span>` : ''}
                    </span>
                  </div>
                  <span class="student-badge ${t.status === 'Completed' ? 'student-badge-success' : t.status === 'In Progress' ? 'student-badge-warning' : 'student-badge-info'}">${t.status}</span>
                </div>
              `;
            }).join('')
            : '<div style="padding: 36px; text-align: center; color: var(--text-muted); font-size: 0.9rem;">No tasks found under this module.</div>';

          tabContentHtml = `
            <div class="project-tab-content">
              <div class="student-rep-project-header" style="margin-bottom: 18px;">
                <div>
                  <h3 class="student-rep-project-title" style="font-size: 1.1rem;">Assigned Modules</h3>
                  <p style="font-size: 0.82rem; color: var(--text-muted); margin: 3px 0 0 0;">Functionalities and components allocated to your development scope. Select a module to inspect its tasks.</p>
                </div>
              </div>
              
              <div class="student-proj-modules-pane">
                <!-- Left Panel: Modules list -->
                <div class="student-proj-mod-sidebar">
                  ${modulesLeftHtml}
                </div>
                
                <!-- Right Panel: Tasks under selected module -->
                <div class="student-proj-mod-tasks-card">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid var(--border-subtle);">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                      <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">Tasks for: <strong style="color: #0284c7;">${selectedModuleName || 'None'}</strong></span>
                    </div>
                    <span class="student-badge student-badge-info" style="font-size: 0.72rem; font-weight: 800;">${moduleTasks.length} Tasks</span>
                  </div>
                  <div style="max-height: 440px; overflow-y: auto; padding-right: 4px;">
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
            <tr style="${t.isMyTask ? 'background: #f0f9ff;' : ''}">
              <td>
                <div style="font-weight: 700; font-size: 0.9rem; color: var(--text-primary);">${t.name}</div>
                <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 3px; display: flex; align-items: center; flex-wrap: wrap; gap: 8px;">
                  <span style="display: flex; align-items: center; gap: 4px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    ${t.moduleName}
                  </span>
                  ${t.branchName ? `
                    <span style="color: #4f46e5; font-weight: 600; display: inline-flex; align-items: center; gap: 3px;">
                      🌿 <code style="background: #e0e7ff; color: #4338ca; padding: 1px 6px; border-radius: 4px;">${t.branchName}</code>
                    </span>
                  ` : ''}
                  ${t.githubPrUrl ? `
                    <a href="${t.githubPrUrl}" target="_blank" rel="noopener noreferrer" style="color: #0284c7; font-weight: 700; text-decoration: underline; display: inline-flex; align-items: center; gap: 2px;">
                      🔗 View PR
                    </a>
                  ` : ''}
                </div>
              </td>
              <td>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span class="student-badge student-badge-info" style="font-size: 0.78rem;">${t.assignee}</span>
                  ${t.isMyTask ? `<span class="member-tag-you">You</span>` : ''}
                </div>
              </td>
              <td style="text-align: center;"><span class="student-badge ${t.status === 'Completed' ? 'student-badge-success' : t.status === 'In Progress' ? 'student-badge-warning' : 'student-badge-danger'}">${t.status}</span></td>
            </tr>
          `).join('');

          tabContentHtml = `
            <div class="project-tab-content">
              <div class="student-rep-project-header" style="margin-bottom: 18px;">
                <div>
                  <h3 class="student-rep-project-title" style="font-size: 1.1rem;">Assigned Project Tasks</h3>
                  <p style="font-size: 0.82rem; color: var(--text-muted); margin: 3px 0 0 0;">Comprehensive list of sprint components, branch bindings, and responsibilities.</p>
                </div>
                <span class="student-badge student-badge-info" style="font-size: 0.75rem; font-weight: 800;">${allTasks.length} Total Tasks</span>
              </div>
              <div class="student-proj-table-wrap">
                <table class="student-proj-table">
                  <thead>
                    <tr>
                      <th style="width: 52%;">Task & Module</th>
                      <th style="width: 28%;">Assignee</th>
                      <th style="width: 20%; text-align: center;">Status</th>
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
              <div class="student-rep-project-header" style="margin-bottom: 18px;">
                <div>
                  <h3 class="student-rep-project-title" style="font-size: 1.1rem;">GitHub Integration</h3>
                  <p style="font-size: 0.82rem; color: var(--text-muted); margin: 3px 0 0 0;">Repository synchronization and branch tracking status.</p>
                </div>
              </div>
              
              <div class="student-proj-git-card">
                <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 14px; border-bottom: 1px solid var(--border-subtle);">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--text-primary);"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                    <span style="font-weight: 800; font-size: 1.05rem; color: var(--text-primary);">Repository Status</span>
                  </div>
                  ${projectGithub && projectGithub.url ? `
                    <span class="student-badge ${projectGithub.status === 'Verified' ? 'student-badge-success' : 'student-badge-warning'}" style="padding: 6px 14px; font-weight: 700; font-size: 0.8rem;">
                      ${projectGithub.status === 'Verified' ? '✓ Verified by Faculty' : '⏳ Pending Verification'}
                    </span>
                  ` : `
                    <span class="student-badge student-badge-warning" style="padding: 6px 14px; font-weight: 700; font-size: 0.8rem;">
                      No Repository Linked
                    </span>
                  `}
                </div>

                ${projectGithub && projectGithub.url ? `
                  <div class="student-proj-git-url-box">
                    <div style="font-size: 0.74rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted);">Connected Main Repository URL</div>
                    <div class="student-proj-git-url-row">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #38bdf8; flex-shrink: 0;"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>
                      <a href="${projectGithub.url}" target="_blank" rel="noopener noreferrer" class="student-proj-git-url-link">
                        ${projectGithub.url}
                      </a>
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px; font-size: 0.86rem;">
                    <span style="color: var(--text-muted);">Verifying Supervisor:</span>
                    <strong style="color: var(--text-primary);">${projectGithub.faculty || selectedProject.faculty || 'Unassigned'}</strong>
                  </div>
                ` : `
                  <div style="padding: 20px; background: var(--bg-canvas-light); border-radius: 12px; border: 1px dashed #cbd5e1;">
                    <p style="color: var(--text-muted); font-size: 0.88rem; margin: 0;">
                      No main GitHub repository has been configured yet. The designated Team Lead can set the repository link in the GitHub Manager.
                    </p>
                  </div>
                `}

                <button type="button" class="student-btn student-btn-outline student-btn-sm btn-manage-git" style="width: fit-content; border-radius: 10px; padding: 8px 18px; font-weight: 700; gap: 6px;">
                  <span>Open GitHub & Branch Manager</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
              </div>
            </div>
          `;
        }
      }

      // Main detail container HTML
      const detailsHtml = selectedProject ? `
        <div class="student-proj-detail-hero">
          <!-- Project Detail Header -->
          <div class="student-proj-hero-top">
            <div>
              <h2 class="student-proj-hero-title">${selectedProject.title}</h2>
              <div class="student-proj-hero-meta">
                <span class="student-badge student-badge-info" style="font-size: 0.76rem; font-weight: 700;">${selectedProject.designation || 'Student Track'}</span>
                <span class="student-proj-sup-chip">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  Supervisor: <strong>${selectedProject.faculty}</strong>
                </span>
                <span class="student-proj-card-timeline">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  Timeline: <strong>${selectedProject.timeline || 'Active'}</strong>
                </span>
              </div>
            </div>
            <div>
              <span class="student-badge ${selectedProject.status === 'Completed' ? 'student-badge-success' : 'student-badge-warning'}" style="font-size: 0.82rem; padding: 6px 14px; font-weight: 700;">
                ${selectedProject.status}
              </span>
            </div>
          </div>

          <!-- Project Tab Navigation -->
          <div class="student-proj-tabs-nav">
            <button type="button" class="student-proj-tab-btn project-tab-btn ${activeTab === 'overview' ? 'active' : ''}" data-tab="overview">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              <span>Overview</span>
            </button>
            <button type="button" class="student-proj-tab-btn project-tab-btn ${activeTab === 'team' ? 'active' : ''}" data-tab="team">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              <span>Team</span>
            </button>
            <button type="button" class="student-proj-tab-btn project-tab-btn ${activeTab === 'modules' ? 'active' : ''}" data-tab="modules">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
              <span>Modules</span>
            </button>
            <button type="button" class="student-proj-tab-btn project-tab-btn ${activeTab === 'tasks' ? 'active' : ''}" data-tab="tasks">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
              <span>Tasks</span>
            </button>
            <button type="button" class="student-proj-tab-btn project-tab-btn ${activeTab === 'github' ? 'active' : ''}" data-tab="github">
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
        <div style="display: flex; justify-content: flex-start; margin-bottom: 1.25rem;">
          <button type="button" class="student-proj-back-btn btn-back-to-cards">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
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
      container.querySelectorAll('.student-proj-filter-pill').forEach(pill => {
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
        container.querySelectorAll('.student-proj-mod-item').forEach(el => {
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
