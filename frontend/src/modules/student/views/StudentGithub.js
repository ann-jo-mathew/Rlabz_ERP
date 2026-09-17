import { renderStudentSidebar } from './StudentSidebar.js';
import { 
  getProjects, 
  getGithub, 
  getGithubProjects, 
  saveGithubUrl, 
  saveGithubBranch, 
  deleteGithubBranch, 
  getProjectTasks,
  updateTaskGithub,
  ensureDataLoaded 
} from './studentStore.js';
import { StudentSwal, showStudentWarning, showStudentError, showStudentSuccess } from '../studentAlerts.js';
import '../student.css';

export async function StudentGithub(route, router) {
  await ensureDataLoaded(true);
  renderStudentSidebar();

  const container = document.createElement('div');
  container.className = 'student-portal-container animate-fade-in';

  // Active state
  let selectedProjectId = null;
  let activeTab = 'main'; // 'main' | 'my-branches' | 'team-branches' | 'tasks'
  let currentProjectTasks = [];

  function getProjectList() {
    const gitProjects = getGithubProjects() || [];
    if (gitProjects.length > 0) return gitProjects;

    const baseProjects = getProjects() || [];
    const repos = getGithub() || [];
    return baseProjects.map(p => {
      const r = repos.find(item => item.project === p.title || item.projectId === p.id);
      return {
        projectId: p.id,
        projectTitle: p.title,
        isLead: r ? r.isLead : true,
        leadName: r ? r.leadName : 'You',
        supervisor: r ? r.faculty : (p.faculty || 'Unassigned'),
        mainRepo: r ? { url: r.url, status: r.status, is_verified: r.isVerified } : null,
        myBranches: r ? (r.myBranches || []) : [],
        teamBranches: r ? (r.teamBranches || []) : [],
      };
    });
  }

  async function loadTasksForProject(projectId) {
    if (!projectId) {
      currentProjectTasks = [];
      return;
    }
    try {
      currentProjectTasks = await getProjectTasks(projectId);
    } catch (e) {
      console.error('Error fetching tasks for github manager:', e);
      currentProjectTasks = [];
    }
  }

  async function render() {
    const projectList = getProjectList();

    if (projectList.length > 0 && !selectedProjectId) {
      selectedProjectId = projectList[0].projectId;
      await loadTasksForProject(selectedProjectId);
    }

    const currentProject = projectList.find(p => p.projectId === Number(selectedProjectId)) || projectList[0] || null;

    // KPI Summary
    const totalProjects = projectList.length;
    const verifiedRepos = projectList.filter(p => p.mainRepo && p.mainRepo.status === 'Verified').length;
    const totalMyBranches = projectList.reduce((acc, p) => acc + (p.myBranches ? p.myBranches.length : 0), 0);
    const totalTeamBranches = projectList.reduce((acc, p) => acc + (p.teamBranches ? p.teamBranches.length : 0), 0);

    // Project Dropdown Options
    const projectOptions = projectList.map(p => `
      <option value="${p.projectId}" ${currentProject && currentProject.projectId === p.projectId ? 'selected' : ''}>
        ${p.projectTitle} ${p.isLead ? '★ (Team Lead)' : ''}
      </option>
    `).join('');

    // Active project main repo
    const mainRepo = currentProject ? currentProject.mainRepo : null;
    const isLead = currentProject ? currentProject.isLead : false;
    const isVerified = mainRepo && (mainRepo.status === 'Verified' || mainRepo.is_verified);
    const myBranches = (currentProject && currentProject.myBranches) || [];
    const teamBranches = (currentProject && currentProject.teamBranches) || [];

    // Build Project Main Repo Card HTML
    let mainRepoHtml = '';
    if (!currentProject) {
      mainRepoHtml = `
        <div class="student-git-empty">
          <div class="student-git-empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
          </div>
          <div class="student-git-empty-title">No Assigned Projects Found</div>
          <div class="student-git-empty-desc">You have not been assigned to any academic projects yet.</div>
        </div>
      `;
    } else {
      mainRepoHtml = `
        <div class="student-git-main-card">
          <div class="student-git-main-top">
            <div>
              <div class="student-git-proj-title-row">
                <h3 class="student-git-proj-title">${currentProject.projectTitle}</h3>
                ${isLead ? `
                  <span class="student-git-lead-badge">
                    👑 Team Lead
                  </span>
                ` : `
                  <span class="student-git-member-badge">
                    👥 Team Member
                  </span>
                `}
              </div>
              <p class="student-git-proj-sub">
                Project Lead: <strong style="color: var(--text-primary);">${currentProject.leadName || 'Unassigned'}</strong> &bull; Supervisor: <strong style="color: var(--text-primary);">${currentProject.supervisor || 'Unassigned'}</strong>
              </p>
            </div>

            <div>
              ${mainRepo && mainRepo.url ? `
                <span class="student-git-status-badge ${isVerified ? 'verified' : 'pending'}">
                  <span class="student-git-pulse-dot"></span>
                  ${isVerified ? 'Faculty Verified' : 'Pending Faculty Verification'}
                </span>
              ` : `
                <span class="student-git-status-badge unlinked">
                  <span class="student-git-pulse-dot"></span>
                  No Repository Linked
                </span>
              `}
            </div>
          </div>

          <!-- Main Repository URL Display / Edit -->
          <div class="student-git-url-box">
            <div class="student-git-url-left">
              <div class="student-git-octo-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </div>
              <div class="student-git-url-text-group">
                <span class="student-git-url-caption">Project Main Repository URL (Root Codebase)</span>
                ${mainRepo && mainRepo.url ? `
                  <a href="${mainRepo.url}" target="_blank" rel="noopener noreferrer" class="student-git-url-link" title="Open in GitHub">
                    ${mainRepo.url}
                  </a>
                ` : `
                  <span class="student-git-url-empty-text">
                    No main repository configured yet. ${isLead ? 'Click "Set Repository URL" to add it.' : 'Contact your Team Lead.'}
                  </span>
                `}
              </div>
            </div>

            <div class="student-git-url-actions">
              ${mainRepo && mainRepo.url ? `
                <button type="button" class="student-git-btn-action btn-copy btn-copy-url" data-url="${mainRepo.url}" title="Copy Repository Link">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  <span>Copy Link</span>
                </button>
                <a href="${mainRepo.url}" target="_blank" rel="noopener noreferrer" class="student-git-btn-action btn-open" title="Open repository in GitHub">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                  <span>Open Repo ↗</span>
                </a>
              ` : ''}

              ${isLead ? `
                <button type="button" class="student-git-btn-action btn-edit btn-edit-main-repo">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                  <span>${mainRepo && mainRepo.url ? 'Edit URL' : 'Set Repository URL'}</span>
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Team Lead vs Member Notice -->
          <div class="student-git-notice-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--primary); flex-shrink: 0;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            ${isLead ? `
              <span><strong>Team Lead Permissions</strong>: You are designated as Project Lead. You can update the main repository link for institutional faculty verification.</span>
            ` : `
              <span><strong>Team Member Access</strong>: The root repository is managed by Team Lead (${currentProject.leadName}). You can register your feature branches and link PRs below.</span>
            `}
          </div>
        </div>
      `;
    }

    // Build My Branches Table Rows
    const myBranchRows = myBranches.map(b => `
      <tr>
        <td>
          <span class="student-git-branch-tag">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>
            <span>${b.branch_name}</span>
          </span>
        </td>
        <td>
          <a href="${b.branch_url}" target="_blank" rel="noopener noreferrer" class="student-git-url-chip" title="Open branch on GitHub">
            ${b.branch_url}
          </a>
        </td>
        <td>
          <span class="student-badge student-badge-info" style="font-size: 0.75rem;">
            ${b.linked_tasks_count || 0} ${(b.linked_tasks_count || 0) === 1 ? 'Task' : 'Tasks'} Linked
          </span>
        </td>
        <td style="text-align: right;">
          <div class="student-git-actions">
            <button type="button" class="student-git-icon-btn btn-copy-url" data-url="${b.branch_url}" title="Copy Branch URL">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            <a href="${b.branch_url}" target="_blank" rel="noopener noreferrer" class="student-git-icon-btn emerald" title="Open branch in GitHub">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
            <button type="button" class="student-git-icon-btn btn-edit-branch" data-id="${b.id}" data-name="${b.branch_name}" data-url="${b.branch_url}" title="Edit Branch">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            </button>
            <button type="button" class="student-git-icon-btn danger btn-delete-branch" data-id="${b.id}" data-name="${b.branch_name}" title="Delete Branch">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // Build Team Branches Table Rows
    const teamBranchRows = teamBranches.map(b => `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--text-primary);">${b.student_name || 'Team Member'}</div>
        </td>
        <td>
          <span class="student-git-branch-tag">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>
            <span>${b.branch_name}</span>
          </span>
        </td>
        <td>
          <a href="${b.branch_url}" target="_blank" rel="noopener noreferrer" class="student-git-url-chip" title="Open branch on GitHub">
            ${b.branch_url}
          </a>
        </td>
        <td>
          <span class="student-badge student-badge-info" style="font-size: 0.75rem;">
            ${b.linked_tasks_count || 0} ${(b.linked_tasks_count || 0) === 1 ? 'Task' : 'Tasks'}
          </span>
        </td>
        <td style="text-align: right;">
          <div class="student-git-actions">
            <button type="button" class="student-git-icon-btn btn-copy-url" data-url="${b.branch_url}" title="Copy Branch URL">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            <a href="${b.branch_url}" target="_blank" rel="noopener noreferrer" class="student-git-icon-btn emerald" title="Open branch in GitHub">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
          </div>
        </td>
      </tr>
    `).join('');

    // Build Assigned Tasks & GitHub Linkage Table Rows
    const taskRows = currentProjectTasks.map(t => {
      const isLinked = t.githubRepositoryId || t.branchName;
      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: var(--text-primary); font-size: 0.9rem;">${t.title}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
              Module: ${t.moduleName || 'General'} &bull; <span class="student-badge ${t.status === 'Completed' ? 'student-badge-success' : 'student-badge-info'}" style="font-size:0.7rem; padding:1px 6px;">${t.status}</span>
            </div>
          </td>
          <td>
            ${t.branchName ? `
              <span class="student-git-branch-tag">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>
                <span>${t.branchName}</span>
              </span>
            ` : `
              <span style="color: var(--text-muted); font-size: 0.82rem; font-style: italic;">No branch linked</span>
            `}
          </td>
          <td>
            ${t.githubPrUrl ? `
              <a href="${t.githubPrUrl}" target="_blank" rel="noopener noreferrer" class="student-git-pr-chip" title="Open Pull Request">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M13 6h3a2 2 0 0 1 2 2v7"></path><line x1="6" y1="9" x2="6" y2="21"></line></svg>
                <span>View PR ↗</span>
              </a>
            ` : `
              <span style="color: var(--text-muted); font-size: 0.82rem; font-style: italic;">No PR attached</span>
            `}
          </td>
          <td style="text-align: right;">
            <button type="button" class="student-btn student-btn-outline student-btn-sm btn-link-task-git" data-task-id="${t.id}" data-title="${t.title}" data-branch-id="${t.githubRepositoryId || ''}" data-pr-url="${t.githubPrUrl || ''}" style="font-size: 0.75rem; padding: 5px 12px; border-radius: 8px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              <span>${isLinked || t.githubPrUrl ? 'Edit Git Link' : 'Link Branch / PR'}</span>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="student-github-view">
        <!-- Header & Project Switcher -->
        <div class="student-git-header-wrapper">
          <div class="student-git-header-left">
            <div class="student-git-brand-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            </div>
            <div>
              <h1 class="student-git-title">GitHub & Version Control Manager</h1>
              <p class="student-git-subtitle">
                Manage project repositories, register your personal feature branches, and link pull requests to assigned sprint tasks.
              </p>
            </div>
          </div>

          <!-- Project Selector -->
          <div class="student-git-project-selector">
            <span class="student-git-select-label">Active Project:</span>
            <select id="project-switcher" class="student-git-select-input">
              ${projectOptions || '<option value="">No projects</option>'}
            </select>
          </div>
        </div>

        <!-- Quick KPI Row -->
        <div class="student-git-kpi-grid">
          <div class="student-git-kpi-card kpi-blue">
            <div class="student-git-kpi-icon kpi-blue">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <div class="student-git-kpi-meta">
              <span class="student-git-kpi-val">${totalProjects}</span>
              <span class="student-git-kpi-lbl">Assigned Projects</span>
            </div>
          </div>

          <div class="student-git-kpi-card kpi-emerald">
            <div class="student-git-kpi-icon kpi-emerald">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <div class="student-git-kpi-meta">
              <span class="student-git-kpi-val" style="color: #059669;">${verifiedRepos} / ${totalProjects}</span>
              <span class="student-git-kpi-lbl">Verified Repos</span>
            </div>
          </div>

          <div class="student-git-kpi-card kpi-indigo">
            <div class="student-git-kpi-icon kpi-indigo">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>
            </div>
            <div class="student-git-kpi-meta">
              <span class="student-git-kpi-val" style="color: #4f46e5;">${myBranches.length}</span>
              <span class="student-git-kpi-lbl">My Active Branches</span>
            </div>
          </div>

          <div class="student-git-kpi-card kpi-amber">
            <div class="student-git-kpi-icon kpi-amber">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <div class="student-git-kpi-meta">
              <span class="student-git-kpi-val" style="color: #d97706;">${teamBranches.length}</span>
              <span class="student-git-kpi-lbl">Team Branches</span>
            </div>
          </div>
        </div>

        <!-- Main Project Repository Card -->
        ${mainRepoHtml}

        <!-- Bottom Tabs Section (My Branches / Task Linkage / Team Directory) -->
        <div class="student-git-section-card">
          <!-- Tab Navigation Bar -->
          <div class="student-git-tabs-bar">
            <div class="student-git-tabs-left">
              <button type="button" class="student-git-tab-btn ${activeTab === 'main' ? 'active' : ''}" data-tab="main">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>
                <span>My Feature Branches</span>
                <span class="student-git-tab-count">${myBranches.length}</span>
              </button>
              <button type="button" class="student-git-tab-btn ${activeTab === 'tasks' ? 'active' : ''}" data-tab="tasks">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                <span>Task & PR Linkage</span>
                <span class="student-git-tab-count">${currentProjectTasks.length}</span>
              </button>
              <button type="button" class="student-git-tab-btn ${activeTab === 'team-branches' ? 'active' : ''}" data-tab="team-branches">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                <span>Team Branches Directory</span>
                <span class="student-git-tab-count">${teamBranches.length}</span>
              </button>
            </div>

            ${activeTab === 'main' ? `
              <button type="button" class="student-btn student-btn-primary student-btn-sm btn-open-add-branch" style="margin: 8px 0; display: inline-flex; align-items: center; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                <span>Register New Branch</span>
              </button>
            ` : ''}
          </div>

          <!-- Tab Body Panel -->
          <div class="student-git-tab-panel">
            ${activeTab === 'main' ? `
              <!-- MY BRANCHES TAB -->
              <div class="student-git-panel-header">
                <div>
                  <h4 class="student-git-panel-title">My Registered Feature Branches</h4>
                  <p class="student-git-panel-desc">
                    Feature branches you have registered for "${currentProject ? currentProject.projectTitle : ''}". Use these branches across your assigned sprint tasks.
                  </p>
                </div>
              </div>

              <div class="student-table-container">
                <table class="student-table">
                  <thead>
                    <tr>
                      <th style="width: 25%;">Branch Name</th>
                      <th style="width: 45%;">GitHub URL</th>
                      <th style="width: 15%;">Linked Tasks</th>
                      <th style="width: 15%; text-align: right;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${myBranchRows || `
                      <tr>
                        <td colspan="4">
                          <div class="student-git-empty">
                            <div class="student-git-empty-icon">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>
                            </div>
                            <div class="student-git-empty-title">No Feature Branches Registered</div>
                            <div class="student-git-empty-desc">You haven't registered any working branches for this project yet. Register your branch to attach to sprint tasks.</div>
                            <button type="button" class="student-btn student-btn-primary student-btn-sm btn-open-add-branch" style="margin: 0 auto;">
                              + Register Your First Branch
                            </button>
                          </div>
                        </td>
                      </tr>
                    `}
                  </tbody>
                </table>
              </div>
            ` : activeTab === 'tasks' ? `
              <!-- TASK & PR LINKAGE TAB -->
              <div class="student-git-panel-header">
                <div>
                  <h4 class="student-git-panel-title">Task Git Integration Matrix</h4>
                  <p class="student-git-panel-desc">
                    Attach your registered feature branch and Pull Request URL to each task. Faculty supervisors can inspect your code before verifying reports.
                  </p>
                </div>
              </div>

              <div class="student-table-container">
                <table class="student-table">
                  <thead>
                    <tr>
                      <th style="width: 35%;">Task & Module</th>
                      <th style="width: 30%;">Selected Branch</th>
                      <th style="width: 20%;">Pull Request</th>
                      <th style="width: 15%; text-align: right;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${taskRows || `
                      <tr>
                        <td colspan="4">
                          <div class="student-git-empty">
                            <div class="student-git-empty-icon">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                            </div>
                            <div class="student-git-empty-title">No Active Tasks Assigned</div>
                            <div class="student-git-empty-desc">You currently have no active sprint tasks assigned to you for this project.</div>
                          </div>
                        </td>
                      </tr>
                    `}
                  </tbody>
                </table>
              </div>
            ` : `
              <!-- TEAM BRANCHES TAB -->
              <div class="student-git-panel-header">
                <div>
                  <h4 class="student-git-panel-title">Team Branches Directory</h4>
                  <p class="student-git-panel-desc">
                    Overview of all branches currently being worked on by your team members in "${currentProject ? currentProject.projectTitle : ''}".
                  </p>
                </div>
              </div>

              <div class="student-table-container">
                <table class="student-table">
                  <thead>
                    <tr>
                      <th style="width: 25%;">Student / Member</th>
                      <th style="width: 25%;">Branch Name</th>
                      <th style="width: 35%;">Branch URL</th>
                      <th style="width: 15%;">Tasks</th>
                      <th style="width: 10%; text-align: right;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${teamBranchRows || `
                      <tr>
                        <td colspan="5">
                          <div class="student-git-empty">
                            <div class="student-git-empty-icon">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            </div>
                            <div class="student-git-empty-title">No Team Branches Recorded</div>
                            <div class="student-git-empty-desc">No other team members have registered branches for this project yet.</div>
                          </div>
                        </td>
                      </tr>
                    `}
                  </tbody>
                </table>
              </div>
            `}
          </div>
        </div>
      </div>
    `;

    // -------------------------------------------------------------
    // EVENT BINDINGS
    // -------------------------------------------------------------

    // 1. Project Switcher Change
    container.querySelector('#project-switcher')?.addEventListener('change', async (e) => {
      selectedProjectId = e.target.value;
      await loadTasksForProject(selectedProjectId);
      render();
    });

    // 2. Tab Navigation
    container.querySelectorAll('.student-git-tab-btn, .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.getAttribute('data-tab');
        render();
      });
    });

    // 3. Copy URL Buttons
    container.querySelectorAll('.btn-copy-url').forEach(btn => {
      btn.addEventListener('click', async () => {
        const url = btn.getAttribute('data-url');
        if (!url) return;
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(url);
          }
          StudentSwal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'URL Copied to Clipboard!',
            showConfirmButton: false,
            timer: 2000
          });
        } catch (e) {
          showStudentSuccess('Copied', url);
        }
      });
    });

    // 4. Edit / Set Main Repository URL (Team Lead Only)
    container.querySelector('.btn-edit-main-repo')?.addEventListener('click', async () => {
      if (!currentProject) return;

      const currentUrl = (currentProject.mainRepo && currentProject.mainRepo.url) || '';

      const { value: formValues } = await StudentSwal.fire({
        title: `Set Main GitHub Repository`,
        html: `
          <div style="text-align: left; font-size: 0.9rem;">
            <p style="color: var(--text-muted); margin-bottom: 12px;">
              As the <strong>Team Lead</strong>, enter the primary GitHub repository link for <strong>${currentProject.projectTitle}</strong>.
            </p>
            <label style="font-weight: 600; color: var(--text-primary); display: block; margin-bottom: 6px;">Main Repository URL:</label>
            <input type="url" id="swal-main-repo-url" class="student-input" value="${currentUrl}" placeholder="https://github.com/organization/project-name" style="width: 100%; box-sizing: border-box;" required>
            <span style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; display: block;">
              Must start with <code>https://</code>. This repository will be submitted for supervisor verification.
            </span>
          </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Save & Submit URL',
        confirmButtonColor: 'var(--primary, #3b82f6)',
        preConfirm: () => {
          const urlInput = document.getElementById('swal-main-repo-url').value.trim();
          if (!urlInput) {
            StudentSwal.showValidationMessage('Repository URL is required');
            return false;
          }
          if (!urlInput.startsWith('https://') && !urlInput.startsWith('http://')) {
            StudentSwal.showValidationMessage('URL must start with https://');
            return false;
          }
          return urlInput;
        }
      });

      if (formValues) {
        try {
          await saveGithubUrl(currentProject.projectTitle, formValues, currentProject.projectId);
          await ensureDataLoaded(true);
          await render();

          StudentSwal.fire({
            icon: 'success',
            title: 'Repository Updated!',
            text: `Main repository for "${currentProject.projectTitle}" saved successfully and submitted for faculty verification.`,
            confirmButtonColor: '#059669'
          });
        } catch (err) {
          showStudentError('Save Failed', err.message || 'Could not update main repository link.');
        }
      }
    });

    // 5. Add / Register New Branch
    const handleOpenAddBranch = async (editData = null) => {
      if (!currentProject) return;

      const mainRepoUrl = (currentProject.mainRepo && currentProject.mainRepo.url) || '';
      const isEditing = Boolean(editData);
      const defaultBranchName = editData ? editData.name : '';
      const defaultBranchUrl = editData ? editData.url : '';

      const { value: formValues } = await StudentSwal.fire({
        title: isEditing ? 'Edit Feature Branch' : 'Register Feature Branch',
        html: `
          <div style="text-align: left; font-size: 0.9rem;">
            <p style="color: var(--text-muted); margin-bottom: 14px;">
              Project: <strong>${currentProject.projectTitle}</strong>
            </p>
            
            <div style="margin-bottom: 12px;">
              <label style="font-weight: 600; color: var(--text-primary); display: block; margin-bottom: 4px;">Branch Name</label>
              <input type="text" id="swal-branch-name" class="student-input" value="${defaultBranchName}" placeholder="e.g. feature/student-login or sprint-1/api" style="width: 100%; box-sizing: border-box;" required>
              <span style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; display: block;">
                Use standard Git naming (e.g., <code>feature/login</code>, <code>fix/auth-bug</code>).
              </span>
            </div>

            <div style="margin-bottom: 12px;">
              <label style="font-weight: 600; color: var(--text-primary); display: block; margin-bottom: 4px;">Branch URL (Optional - Auto generated)</label>
              <input type="url" id="swal-branch-url" class="student-input" value="${defaultBranchUrl}" placeholder="${mainRepoUrl ? mainRepoUrl + '/tree/branch-name' : 'https://github.com/org/repo/tree/branch-name'}" style="width: 100%; box-sizing: border-box;">
              <span style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; display: block;">
                Leave empty to automatically construct from project main repository.
              </span>
            </div>
          </div>
        `,
        didOpen: () => {
          const nameInput = document.getElementById('swal-branch-name');
          const urlInput = document.getElementById('swal-branch-url');
          if (mainRepoUrl && !isEditing) {
            nameInput?.addEventListener('input', () => {
              const bName = nameInput.value.trim();
              if (bName && !urlInput.dataset.manuallyEdited) {
                urlInput.value = `${mainRepoUrl.replace(/\/+$/, '')}/tree/${bName}`;
              }
            });
            urlInput?.addEventListener('input', () => {
              urlInput.dataset.manuallyEdited = 'true';
            });
          }
        },
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: isEditing ? 'Save Changes' : 'Register Branch',
        confirmButtonColor: 'var(--primary, #4f46e5)',
        preConfirm: () => {
          const bName = document.getElementById('swal-branch-name').value.trim();
          let bUrl = document.getElementById('swal-branch-url').value.trim();

          if (!bName) {
            StudentSwal.showValidationMessage('Branch name is required');
            return false;
          }

          if (!bUrl && mainRepoUrl) {
            bUrl = `${mainRepoUrl.replace(/\/+$/, '')}/tree/${bName}`;
          }

          return { branchName: bName, branchUrl: bUrl };
        }
      });

      if (formValues) {
        try {
          await saveGithubBranch(currentProject.projectId, formValues.branchName, formValues.branchUrl, editData ? editData.id : null);
          await ensureDataLoaded(true);
          await render();

          StudentSwal.fire({
            icon: 'success',
            title: isEditing ? 'Branch Updated!' : 'Branch Registered!',
            text: `Branch "${formValues.branchName}" is now available to attach to your tasks.`,
            confirmButtonColor: '#059669'
          });
        } catch (err) {
          showStudentError('Action Failed', err.message || 'Could not save branch.');
        }
      }
    };

    container.querySelectorAll('.btn-open-add-branch').forEach(btn => {
      btn.addEventListener('click', () => handleOpenAddBranch());
    });

    // 6. Edit Branch
    container.querySelectorAll('.btn-edit-branch').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        const url = btn.getAttribute('data-url');
        handleOpenAddBranch({ id, name, url });
      });
    });

    // 7. Delete Branch
    container.querySelectorAll('.btn-delete-branch').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');

        const confirmResult = await StudentSwal.fire({
          title: `Delete Branch "${name}"?`,
          text: 'This will unbind this branch from any linked tasks. The actual code on GitHub will not be affected.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, Delete',
          confirmButtonColor: '#ef4444',
          cancelButtonText: 'Cancel'
        });

        if (confirmResult.isConfirmed) {
          try {
            await deleteGithubBranch(id);
            await ensureDataLoaded(true);
            await render();

            StudentSwal.fire({
              icon: 'success',
              title: 'Branch Removed',
              text: `Branch "${name}" was deleted.`,
              confirmButtonColor: '#059669'
            });
          } catch (err) {
            showStudentError('Delete Failed', err.message || 'Could not delete branch.');
          }
        }
      });
    });

    // 8. Link Task to Branch & PR Modal
    container.querySelectorAll('.btn-link-task-git').forEach(btn => {
      btn.addEventListener('click', async () => {
        const taskId = btn.getAttribute('data-task-id');
        const taskTitle = btn.getAttribute('data-title');
        const branchId = btn.getAttribute('data-branch-id');
        const prUrl = btn.getAttribute('data-pr-url') || '';

        // Generate branch options
        const branchOptionsHtml = myBranches.map(b => `
          <option value="${b.id}" ${String(b.id) === String(branchId) ? 'selected' : ''}>
            ${b.branch_name} (${b.branch_url})
          </option>
        `).join('');

        const { value: formValues } = await StudentSwal.fire({
          title: 'Link Task to GitHub Branch & PR',
          html: `
            <div style="text-align: left; font-size: 0.9rem;">
              <div style="background: var(--bg-main, #f1f5f9); border-radius: 6px; padding: 10px 12px; margin-bottom: 14px;">
                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Selected Task</div>
                <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">${taskTitle}</div>
              </div>

              <div style="margin-bottom: 14px;">
                <label style="font-weight: 600; color: var(--text-primary); display: block; margin-bottom: 4px;">Select Feature Branch</label>
                <select id="swal-task-branch-select" class="student-select" style="width: 100%; box-sizing: border-box;">
                  <option value="">-- No Branch Selected --</option>
                  ${branchOptionsHtml}
                </select>
                <span style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; display: block;">
                  Pick one of your registered feature branches for this project.
                </span>
              </div>

              <div style="margin-bottom: 10px;">
                <label style="font-weight: 600; color: var(--text-primary); display: block; margin-bottom: 4px;">Task Pull Request (PR) URL</label>
                <input type="url" id="swal-task-pr-url" class="student-input" value="${prUrl}" placeholder="https://github.com/org/repo/pull/15" style="width: 100%; box-sizing: border-box;">
                <span style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; display: block;">
                  Optional: Direct link to the Pull Request for this specific task.
                </span>
              </div>
            </div>
          `,
          focusConfirm: false,
          showCancelButton: true,
          confirmButtonText: 'Save Linkage',
          confirmButtonColor: 'var(--primary, #3b82f6)',
          preConfirm: () => {
            const selectedBranchId = document.getElementById('swal-task-branch-select').value;
            const inputPrUrl = document.getElementById('swal-task-pr-url').value.trim();

            if (inputPrUrl && !inputPrUrl.startsWith('https://') && !inputPrUrl.startsWith('http://')) {
              StudentSwal.showValidationMessage('PR URL must start with https://');
              return false;
            }

            return {
              githubRepositoryId: selectedBranchId ? Number(selectedBranchId) : null,
              githubPrUrl: inputPrUrl || null
            };
          }
        });

        if (formValues) {
          try {
            await updateTaskGithub(taskId, formValues.githubRepositoryId, formValues.githubPrUrl);
            await ensureDataLoaded(true);
            await loadTasksForProject(selectedProjectId);
            await render();

            StudentSwal.fire({
              icon: 'success',
              title: 'Task Linked!',
              text: `Task "${taskTitle}" is now linked to your branch and PR.`,
              confirmButtonColor: '#059669'
            });
          } catch (err) {
            showStudentError('Update Failed', err.message || 'Could not link task to GitHub.');
          }
        }
      });
    });
  }

  await render();
  return container;
}

export default StudentGithub;
