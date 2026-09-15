import { DirectorService } from '../services/DirectorService.js';

export function DirectorStudentDetail(route, router) {
  const container = document.createElement('div');
  container.className = 'director-dashboard student-detail-page';

  // Resolve Student ID from route params, path, or fallback
  const rawId = (route && route.params && route.params.id) 
    || window.location.pathname.split('/').filter(Boolean).pop() 
    || 'STU-005';

  let student = DirectorService.getStudentDetail(rawId);
  let activeTaskFilter = 'All';
  let searchQuery = '';

  function render() {
    if (!student) {
      container.innerHTML = `
        <div class="director-panel" style="text-align:center; padding:3rem;">
          <h2 style="color:#ef4444;">Student Not Found</h2>
          <p style="color:#6b7280; margin:1rem 0 1.5rem;">Could not locate student record with ID "${rawId}".</p>
          <button class="btn-director btn-director-primary" id="btn-back-notfound">
            ← Return to Student Roster
          </button>
        </div>
      `;
      container.querySelector('#btn-back-notfound')?.addEventListener('click', () => {
        router ? router.push('/dashboard/students') : (window.location.href = '/dashboard/students');
      });
      return;
    }

    const allTasks = student.tasks || [];
    const filteredTasks = allTasks.filter(t => {
      const matchesFilter = 
        activeTaskFilter === 'All' ? true :
        activeTaskFilter === 'Completed' ? t.status === 'Completed' :
        activeTaskFilter === 'In Progress' ? t.status === 'In Progress' :
        activeTaskFilter === 'Under Review' ? t.status === 'Under Review' : true;
      
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query || 
        t.title.toLowerCase().includes(query) || 
        t.project.toLowerCase().includes(query) || 
        t.id.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });

    const taskCounts = {
      all: allTasks.length,
      inProgress: allTasks.filter(t => t.status === 'In Progress').length,
      underReview: allTasks.filter(t => t.status === 'Under Review').length,
      completed: allTasks.filter(t => t.status === 'Completed').length
    };

    const trackClass = (student.track || 'orbit').toLowerCase();
    const trackColors = {
      nova: { border: '#9333ea', bg: '#faf5ff', text: '#7e22ce', gradient: 'linear-gradient(135deg, #9333ea, #6b21a8)' },
      orbit: { border: '#2563eb', bg: '#eff6ff', text: '#1d4ed8', gradient: 'linear-gradient(135deg, #2563eb, #1e40af)' },
      spark: { border: 'var(--primary)', bg: 'var(--primary-light)', text: 'var(--primary-hover)', gradient: 'linear-gradient(135deg, var(--primary), var(--primary))' }
    };
    const activeColor = trackColors[trackClass] || trackColors.orbit;

    container.innerHTML = `
      <!-- Top Action & Breadcrumb Bar -->
      <div class="student-detail-topbar">
        <button class="btn-director btn-director-outline" id="btn-back" style="display:inline-flex; align-items:center; gap:0.4rem;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Student Track Roster
        </button>
        <div class="student-breadcrumb">
          <span>Director Dashboard</span>
          <span class="sep">/</span>
          <a href="/dashboard/students" id="breadcrumb-roster">Student Roster</a>
          <span class="sep">/</span>
          <strong style="color:#111827">${student.name} (${student.id})</strong>
        </div>
      </div>

      <!-- Hero Profile Card -->
      <div class="director-panel student-hero-card" style="border-left: 5px solid ${activeColor.border}; margin-bottom: 1.5rem;">
        <div class="student-hero-content">
          <div class="student-avatar-wrap">
            <div class="student-avatar-circle" style="background:${activeColor.gradient};">
              ${student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
          </div>

          <div class="student-hero-main">
            <div class="student-hero-header-row">
              <h1 class="student-hero-name">${student.name}</h1>
              <div class="student-hero-badges">
                <span class="track-badge ${trackClass}">${student.track} Track</span>
                <span class="status-badge ${student.status === 'Active' ? 'completed' : 'in_progress'}">${student.status}</span>
                <span class="student-gpa-badge">GPA ${student.gpa} / 10.0</span>
              </div>
            </div>

            <div class="student-meta-grid">
              <div class="student-meta-item">
                <span class="meta-label">Student ID</span>
                <span class="meta-val"><code>${student.id}</code></span>
              </div>
              <div class="student-meta-item">
                <span class="meta-label">Contact Email</span>
                <span class="meta-val">
                  <a href="mailto:${student.email}" style="color:#2563eb; text-decoration:none;">${student.email}</a>
                </span>
              </div>
              <div class="student-meta-item">
                <span class="meta-label">Phone Contact</span>
                <span class="meta-val">${student.phone || '+91 98470 12345'}</span>
              </div>
              <div class="student-meta-item">
                <span class="meta-label">Department</span>
                <span class="meta-val">${student.department || 'Computer Applications'}</span>
              </div>
              <div class="student-meta-item">
                <span class="meta-label">GitHub Account</span>
                <span class="meta-val">
                  <a href="https://github.com/${student.github}" target="_blank" class="student-github-link">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    @${student.github}
                  </a>
                </span>
              </div>
              <div class="student-meta-item">
                <span class="meta-label">Faculty Mentor</span>
                <span class="meta-val"><strong>${student.mentor || 'Faculty Mentor'}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Executive KPI Strip -->
      <div class="director-kpi-grid student-metrics-grid" style="margin-bottom:1.5rem;">
        <div class="director-panel student-metric-card">
          <div class="metric-top">
            <span class="metric-title">Assigned Projects</span>
            <span class="metric-badge purple">${student.stats.totalProjects} Total</span>
          </div>
          <div class="metric-big-num">${student.stats.totalProjects}</div>
          <p class="metric-subtext">Active project assignments in ERP</p>
        </div>

        <div class="director-panel student-metric-card">
          <div class="metric-top">
            <span class="metric-title">Assigned Tasks</span>
            <span class="metric-badge blue">${student.stats.totalTasks} Tasks</span>
          </div>
          <div class="metric-big-num">${student.stats.totalTasks}</div>
          <p class="metric-subtext">${student.stats.inProgressTasks} In Progress • ${student.stats.underReviewTasks} In Review</p>
        </div>

        <div class="director-panel student-metric-card">
          <div class="metric-top">
            <span class="metric-title">Tasks Completed</span>
            <span class="metric-badge emerald">${student.stats.completedTasks} Done</span>
          </div>
          <div class="metric-big-num" style="color:var(--primary)">${student.stats.completedTasks}</div>
          <p class="metric-subtext">${Math.round((student.stats.completedTasks / (student.stats.totalTasks || 1)) * 100)}% Task completion rate</p>
        </div>

        <div class="director-panel student-metric-card">
          <div class="metric-top">
            <span class="metric-title">Execution Velocity</span>
            <span class="metric-badge emerald">${student.stats.overallProgress}%</span>
          </div>
          <div class="metric-big-num" style="color:var(--primary)">${student.stats.overallProgress}%</div>
          <div class="student-progress-bar-wrap" style="margin-top:0.35rem;">
            <div class="student-progress-bar-fill" style="width: ${student.stats.overallProgress}%; background: linear-gradient(90deg, var(--primary-accent), var(--primary));"></div>
          </div>
        </div>
      </div>

      <!-- Section 1: Assigned Projects Breakdown -->
      <div class="director-panel" style="margin-bottom: 1.5rem;">
        <div class="director-panel-header" style="flex-wrap:wrap; gap:0.5rem;">
          <div>
            <h2>Assigned Projects (${student.detailedProjects.length})</h2>
            <span style="font-size:0.85rem; color:#6b7280;">Institutional and external systems assigned to ${student.name}</span>
          </div>
          <span class="director-chart-badge purple">${student.track} Capability Tier</span>
        </div>

        <div class="student-projects-grid">
          ${student.detailedProjects.map((p, idx) => `
            <div class="student-project-card">
              <div class="student-project-card-header">
                <div>
                  <span class="student-project-code">${p.id}</span>
                  <h3 class="student-project-title">${p.title}</h3>
                </div>
                <span class="status-badge ${p.status === 'completed' ? 'completed' : 'in_progress'}">
                  ${p.status === 'completed' ? 'Completed' : 'Active'}
                </span>
              </div>

              <div class="student-project-card-body">
                <div class="student-project-meta-row">
                  <span>Role:</span>
                  <strong>${p.role}</strong>
                </div>
                <div class="student-project-meta-row">
                  <span>Mentor / Lead:</span>
                  <span>${p.facultyLead}</span>
                </div>
                <div class="student-project-meta-row">
                  <span>Linked Tasks:</span>
                  <span>${p.tasksCount} Tasks</span>
                </div>
              </div>

              <div class="student-project-card-footer">
                <div style="display:flex; justify-content:space-between; font-size:0.75rem; font-weight:600; margin-bottom:0.25rem;">
                  <span style="color:#6b7280;">Module Completion</span>
                  <span style="color:#111827;">${p.progress}%</span>
                </div>
                <div class="student-progress-bar-wrap">
                  <div class="student-progress-bar-fill" style="width: ${p.progress}%; background: linear-gradient(90deg, #3b82f6, #2563eb);"></div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Section 2: All Assigned Tasks & Execution Progress -->
      <div class="director-panel">
        <div class="director-panel-header" style="flex-wrap:wrap; gap:0.75rem; align-items:center;">
          <div>
            <h2>Assigned Tasks & Progress (${filteredTasks.length} Showing)</h2>
            <span style="font-size:0.85rem; color:#6b7280;">Granular task packages, deliverables, deadlines, and faculty review feedback</span>
          </div>

          <!-- Task Filters -->
          <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
            <button class="btn-director ${activeTaskFilter === 'All' ? 'btn-director-primary' : 'btn-director-outline'} filter-btn" data-filter="All">
              All Tasks (${taskCounts.all})
            </button>
            <button class="btn-director ${activeTaskFilter === 'In Progress' ? 'btn-director-primary' : 'btn-director-outline'} filter-btn" data-filter="In Progress">
              In Progress (${taskCounts.inProgress})
            </button>
            <button class="btn-director ${activeTaskFilter === 'Under Review' ? 'btn-director-primary' : 'btn-director-outline'} filter-btn" data-filter="Under Review">
              Under Review (${taskCounts.underReview})
            </button>
            <button class="btn-director ${activeTaskFilter === 'Completed' ? 'btn-director-primary' : 'btn-director-outline'} filter-btn" data-filter="Completed">
              Completed (${taskCounts.completed})
            </button>
          </div>
        </div>

        <!-- Task Search Bar -->
        <div style="padding: 0.75rem 1.25rem; background:#f9fafb; border-bottom:1px solid #f3f4f6; display:flex; align-items:center; gap:0.5rem;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            id="task-search-input" 
            placeholder="Search tasks by title, project, or task code..." 
            value="${searchQuery}" 
            style="border:none; background:transparent; outline:none; width:100%; font-size:0.875rem; color:#111827;"
          />
          ${searchQuery ? `<button id="clear-search" style="border:none; background:transparent; color:#9ca3af; cursor:pointer; font-weight:700;">✕</button>` : ''}
        </div>

        <!-- Tasks Table -->
        <div class="director-table-responsive">
          <table class="director-table student-tasks-table">
            <thead>
              <tr>
                <th style="width: 28%;">Task Code & Deliverable</th>
                <th style="width: 22%;">Associated Project</th>
                <th style="width: 10%;">Priority</th>
                <th style="width: 12%;">Status</th>
                <th style="width: 14%;">Execution Progress</th>
                <th style="width: 14%;">Due Date & Review</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTasks.length === 0 ? `
                <tr>
                  <td colspan="6" style="text-align:center; padding:2.5rem; color:#9ca3af;">
                    No tasks found matching "${searchQuery || activeTaskFilter}".
                  </td>
                </tr>
              ` : filteredTasks.map(t => {
                const priorityClass = t.priority.toLowerCase();
                const statusClass = t.status === 'Completed' ? 'completed' : 
                                    t.status === 'In Progress' ? 'in_progress' : 
                                    t.status === 'Under Review' ? 'pending' : 'in_progress';
                const progressColor = t.progress === 100 ? 'var(--primary-accent)' : 
                                     t.progress >= 60 ? '#3b82f6' : '#f59e0b';
                return `
                  <tr>
                    <td>
                      <div class="student-task-title-cell">
                        <span class="task-code-pill">${t.id}</span>
                        <strong>${t.title}</strong>
                        <p class="task-desc-text">${t.description}</p>
                      </div>
                    </td>
                    <td>
                      <span class="student-project-chip" title="${t.project}">${t.project}</span>
                    </td>
                    <td>
                      <span class="task-priority-pill ${priorityClass}">${t.priority}</span>
                    </td>
                    <td>
                      <span class="status-badge ${statusClass}">${t.status}</span>
                    </td>
                    <td>
                      <div class="task-progress-cell">
                        <div style="display:flex; justify-content:space-between; font-size:0.75rem; font-weight:700; color:#374151; margin-bottom:0.2rem;">
                          <span>Progress</span>
                          <span>${t.progress}%</span>
                        </div>
                        <div class="student-progress-bar-wrap">
                          <div class="student-progress-bar-fill" style="width: ${t.progress}%; background: ${progressColor};"></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="task-review-cell">
                        <div class="task-due-date">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                          ${t.dueDate}
                        </div>
                        <div class="task-reviewer-note" title="${t.reviewNotes}">
                          <small><strong>${t.reviewer.split(' ')[0]}:</strong> "${t.reviewNotes}"</small>
                        </div>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Attach Event Listeners
    container.querySelector('#btn-back')?.addEventListener('click', () => {
      router ? router.push('/dashboard/students') : (window.location.href = '/dashboard/students');
    });

    container.querySelector('#breadcrumb-roster')?.addEventListener('click', (e) => {
      e.preventDefault();
      router ? router.push('/dashboard/students') : (window.location.href = '/dashboard/students');
    });

    container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTaskFilter = btn.getAttribute('data-filter') || 'All';
        render();
      });
    });

    const searchInput = container.querySelector('#task-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        render();
        // Maintain focus after re-render
        const newInput = container.querySelector('#task-search-input');
        if (newInput) {
          newInput.focus();
          newInput.setSelectionRange(newInput.value.length, newInput.value.length);
        }
      });
    }

    container.querySelector('#clear-search')?.addEventListener('click', () => {
      searchQuery = '';
      render();
    });
  }

  // Initial immediate render
  render();

  // Background refresh
  DirectorService.getStudentDetailAsync(rawId).then(fresh => {
    if (fresh) {
      student = fresh;
      render();
    }
  });

  return container;
}

export default DirectorStudentDetail;
