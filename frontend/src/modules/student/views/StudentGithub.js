import { renderStudentSidebar } from './StudentSidebar.js';
import { getProjects, getGithub, saveGithubUrl, ensureDataLoaded } from './studentStore.js';
import { StudentSwal, showStudentWarning, showStudentError, showStudentSuccess } from '../studentAlerts.js';
import '../student.css';

export async function StudentGithub(route, router) {
  await ensureDataLoaded();
  renderStudentSidebar();

  const container = document.createElement('div');
  container.className = 'student-portal-container animate-fade-in';

  // Component Filter & Form State
  let searchQuery = '';
  let statusFilter = 'all'; // 'all' | 'Verified' | 'Pending'
  let projectFilter = 'all';
  let activeEditProject = null;

  function render() {
    const projects = getProjects() || [];
    const repos = getGithub() || [];

    // KPI counts
    const totalCount = repos.length;
    const verifiedCount = repos.filter(r => r.status === 'Verified').length;
    const pendingCount = repos.filter(r => r.status !== 'Verified').length;

    // Filter projects options for form
    const projectFormOptions = projects.map(p => {
      const isSelected = activeEditProject === p.title;
      return `<option value="${p.title}" ${isSelected ? 'selected' : ''}>${p.title}</option>`;
    }).join('');

    // Project options for filter dropdown
    const projectFilterOptions = projects.map(p => `
      <option value="${p.title}" ${projectFilter === p.title ? 'selected' : ''}>${p.title}</option>
    `).join('');

    // Filter Repositories List
    const filteredRepos = repos.filter(r => {
      // Status filter
      if (statusFilter === 'Verified' && r.status !== 'Verified') return false;
      if (statusFilter === 'Pending' && r.status === 'Verified') return false;

      // Project filter
      if (projectFilter !== 'all' && r.project !== projectFilter) return false;

      // Search query filter (Project title, URL, or Faculty)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const pMatch = (r.project || '').toLowerCase().includes(q);
        const uMatch = (r.url || '').toLowerCase().includes(q);
        const fMatch = (r.faculty || '').toLowerCase().includes(q);
        if (!pMatch && !uMatch && !fMatch) return false;
      }

      return true;
    });

    const isFiltersActive = searchQuery.trim() !== '' || statusFilter !== 'all' || projectFilter !== 'all';

    // Build Table Rows
    const repoRows = filteredRepos.map(r => {
      const isVerified = r.status === 'Verified';
      const badgeClass = isVerified ? 'student-badge-success' : 'student-badge-warning';

      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: #0f172a;">${r.project}</div>
            <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">Supervisor: ${r.faculty || 'Unassigned'}</div>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color: #334155; flex-shrink: 0;">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              <a href="${r.url}" target="_blank" rel="noopener noreferrer" style="color: #059669; font-size: 0.85rem; word-break: break-all; font-weight: 600; text-decoration: underline;" title="Open in GitHub">
                ${r.url}
              </a>
            </div>
          </td>
          <td>
            <span class="student-badge ${badgeClass}" style="display: inline-flex; align-items: center; gap: 4px;">
              ${isVerified ? '✓ Verified' : '⏳ Pending'}
            </span>
          </td>
          <td>
            <span style="font-size: 0.85rem; color: #64748b; font-weight: 500;">
              ${isVerified ? r.faculty : 'Under review'}
            </span>
          </td>
          <td style="text-align: right;">
            <div class="student-table-actions" style="justify-content: flex-end;">
              <!-- Copy URL Button -->
              <button type="button" class="student-action-icon-btn btn-copy-repo-url" data-url="${r.url}" title="Copy Repository URL">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>

              <!-- Open in New Tab Button -->
              <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="student-action-icon-btn emerald" title="Open repository in GitHub">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>

              <!-- Edit / Pre-fill Form Button -->
              <button type="button" class="student-action-icon-btn btn-edit-repo" data-project="${r.project}" data-url="${r.url}" title="Edit / Update URL">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="student-header">
        <h1>GitHub Repositories</h1>
        <p>Register version control repositories, inspect faculty verification, and manage project code links.</p>
      </div>

 

      <div class="student-split-pane" style="grid-template-columns: 1fr 1.6fr; gap: 24px; align-items: start;">
        <!-- Left: Github URL Submission Card -->
        <div class="student-card" id="card-repo-form">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
            <div class="student-card-title" style="margin-bottom:0;">
              ${activeEditProject ? 'Update Repository URL' : 'Link Repository URL'}
            </div>
            ${activeEditProject ? `
              <button type="button" id="btn-cancel-edit" class="student-btn student-btn-outline student-btn-sm" style="font-size:0.75rem; padding:4px 10px;">
                Cancel Edit
              </button>
            ` : ''}
          </div>

          <form id="github-form" class="student-form">
            <div class="student-form-group">
              <label for="git-project">Select Project</label>
              <select id="git-project" class="student-select" required>
                <option value="" disabled ${!activeEditProject ? 'selected' : ''}>Select project...</option>
                ${projectFormOptions}
              </select>
            </div>

            <div class="student-form-group">
              <label for="git-url">GitHub Repository URL</label>
              <input type="url" id="git-url" class="student-input" placeholder="https://github.com/organization/repo" required>
              <span style="font-size:0.75rem; color:#64748b; margin-top:4px; display:block;">
                Must start with <code>https://</code> (e.g. GitHub, GitLab, or Bitbucket).
              </span>
            </div>

            <button type="submit" id="btn-submit-repo" class="student-btn student-btn-primary" style="justify-content:center; margin-top:10px; width:100%;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              <span>${activeEditProject ? 'Save Updated URL' : 'Link Repository'}</span>
            </button>
          </form>
        </div>

        <!-- Right: Repositories List & Filters Card -->
        <div class="student-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <div class="student-card-title" style="margin-bottom:0;">
              Registered Repositories
            </div>
            <span class="student-badge student-badge-info" style="font-size:0.75rem;">
              Showing ${filteredRepos.length} of ${totalCount}
            </span>
          </div>

          <!-- Filter & Search Bar -->
          <div class="student-filter-bar">
            <!-- Search Bar -->
            <div class="student-search-wrapper">
              <svg class="student-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" id="repo-search-input" class="student-search-input" placeholder="Search by project, URL, or supervisor..." value="${searchQuery}">
            </div>

            <!-- Status Filter Pills -->
            <div class="student-filter-pills">
              <button type="button" class="student-filter-pill ${statusFilter === 'all' ? 'active' : ''}" data-status="all">All</button>
              <button type="button" class="student-filter-pill ${statusFilter === 'Verified' ? 'active' : ''}" data-status="Verified">Verified</button>
              <button type="button" class="student-filter-pill ${statusFilter === 'Pending' ? 'active' : ''}" data-status="Pending">Pending</button>
            </div>

            <!-- Project Select Filter -->
            <select id="repo-project-filter" class="student-filter-select">
              <option value="all" ${projectFilter === 'all' ? 'selected' : ''}>All Projects</option>
              ${projectFilterOptions}
            </select>

            <!-- Reset Filters Button -->
            ${isFiltersActive ? `
              <button type="button" id="btn-clear-repo-filters" class="student-filter-btn-clear" title="Clear all filters">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                Reset
              </button>
            ` : ''}
          </div>

          <!-- Table Container -->
          <div class="student-table-container">
            <table class="student-table">
              <thead>
                <tr>
                  <th style="width: 28%;">Project</th>
                  <th style="width: 38%;">Repository URL</th>
                  <th style="width: 14%;">Status</th>
                  <th style="width: 12%;">Supervisor</th>
                  <th style="width: 8%; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${repoRows || `
                  <tr>
                    <td colspan="5">
                      <div class="student-empty-filter">
                        <div class="student-empty-filter-icon">🔍</div>
                        <div class="student-empty-filter-text">No repositories match your filter criteria</div>
                        <div class="student-empty-filter-sub">Try changing your search query or filter selections.</div>
                        <button type="button" id="btn-empty-clear-filters" class="student-btn student-btn-outline student-btn-sm" style="margin: 0 auto;">
                          Clear All Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // -------------------------------------------------------------
    // EVENT BINDINGS
    // -------------------------------------------------------------

    // Search input handler
    const searchInput = container.querySelector('#repo-search-input');
    searchInput?.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      render();
      // Keep focus on search input after render
      const newInput = container.querySelector('#repo-search-input');
      if (newInput) {
        newInput.focus();
        newInput.setSelectionRange(newInput.value.length, newInput.value.length);
      }
    });

    // Status Filter Pills
    container.querySelectorAll('.student-filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        statusFilter = pill.getAttribute('data-status');
        render();
      });
    });

    // Project Select Filter
    container.querySelector('#repo-project-filter')?.addEventListener('change', (e) => {
      projectFilter = e.target.value;
      render();
    });

    // Clear filters button
    const handleClearFilters = () => {
      searchQuery = '';
      statusFilter = 'all';
      projectFilter = 'all';
      render();
    };
    container.querySelector('#btn-clear-repo-filters')?.addEventListener('click', handleClearFilters);
    container.querySelector('#btn-empty-clear-filters')?.addEventListener('click', handleClearFilters);

    // Cancel edit button
    container.querySelector('#btn-cancel-edit')?.addEventListener('click', () => {
      activeEditProject = null;
      render();
    });

    // Copy Repository URL Button
    container.querySelectorAll('.btn-copy-repo-url').forEach(btn => {
      btn.addEventListener('click', async () => {
        const url = btn.getAttribute('data-url');
        if (!url) return;

        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(url);
          } else {
            // Fallback for older browsers
            const ta = document.createElement('textarea');
            ta.value = url;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
          }

          StudentSwal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Repository URL Copied!',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
          });
        } catch (e) {
          showStudentSuccess('Copied', url);
        }
      });
    });

    // Edit Repository Button
    container.querySelectorAll('.btn-edit-repo').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = btn.getAttribute('data-project');
        const u = btn.getAttribute('data-url');
        activeEditProject = p;
        render();

        const formCard = container.querySelector('#card-repo-form');
        const gitUrlInput = container.querySelector('#git-url');
        if (gitUrlInput) {
          gitUrlInput.value = u;
          gitUrlInput.focus();
        }
        formCard?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });

    // Form submission handler
    const form = container.querySelector('#github-form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const project = container.querySelector('#git-project').value;
      const url = container.querySelector('#git-url').value.trim();

      if (!project || !url) {
        showStudentWarning('Missing Fields', 'Please select a project and enter the repository URL.');
        return;
      }

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        showStudentWarning('Invalid URL Format', 'Please enter a valid repository URL starting with https://');
        return;
      }

      // Check if project already has a linked repository
      const existing = repos.find(r => r.project === project);
      if (existing && existing.url !== url) {
        const confirmResult = await StudentSwal.fire({
          title: 'Update Repository URL?',
          text: `"${project}" already has a registered URL: "${existing.url}". Would you like to overwrite it with the new URL?`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Yes, Update URL',
          cancelButtonText: 'Cancel'
        });

        if (!confirmResult.isConfirmed) {
          return;
        }
      }

      const submitBtn = container.querySelector('#btn-submit-repo');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Saving...';
      }

      try {
        await saveGithubUrl(project, url);
        activeEditProject = null;
        render();

        StudentSwal.fire({
          icon: 'success',
          title: 'Repository Linked!',
          text: `GitHub repository for "${project}" has been saved and submitted for faculty supervisor verification.`,
          confirmButtonColor: '#059669'
        });
      } catch (err) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Link Repository';
        }
        showStudentError('Failed to Link Repository', err.message || 'Please check your connection and try again.');
      }
    });
  }

  render();
  return container;
}

export default StudentGithub;
