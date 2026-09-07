import { DirectorService } from '../services/DirectorService.js';

function formatMoney(amount) {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '0';
  return Number(amount).toLocaleString();
}

export function DirectorProjects(route, router) {
  const container = document.createElement('div');
  container.className = 'director-dashboard';

  let currentTab = 'proposals'; // 'proposals', 'active', 'all'
  let selectedProposal = null;

  // proposals/projects can be passed in directly (fresh from a just-completed API fetch)
  // to avoid re-reading DirectorService's shared localStorage cache, which is written by
  // three independent, concurrently-running fetches (see loadAllData below) and can briefly
  // reflect a stale snapshot for whichever of the three loses that race.
  function render(faculties = DirectorService.getFaculties(), proposals = DirectorService.getProposals() || [], projects = DirectorService.getProjects() || []) {
    // The real database status is 'proposed', never the literal string 'pending' —
    // 'pending' only ever appeared as a query-filter fallback value, not real data.
    const pendingProposals = proposals.filter(p => p.status === 'proposed' || p.status === 'pending');
    // Include 'accepted' alongside 'in_progress' — an accepted proposal is now its own
    // workflow step (not yet started) rather than jumping straight to in_progress.
    const activeProjects = projects.filter(p => p.status === 'in_progress' || p.status === 'accepted');

    container.innerHTML = `
      <div class="director-header">
        <div>
          <h1>Project Oversight & Proposal Reviews</h1>
          <p>Review project proposals, accept/reject submissions, monitor project progress, and assign faculty leads.</p>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn-director ${currentTab === 'proposals' ? 'btn-director-primary' : 'btn-director-outline'}" id="tab-proposals">
            Pending Proposals (${pendingProposals.length})
          </button>
          <button class="btn-director ${currentTab === 'active' ? 'btn-director-primary' : 'btn-director-outline'}" id="tab-active">
            Active Projects (${activeProjects.length})
          </button>
          <button class="btn-director ${currentTab === 'all' ? 'btn-director-primary' : 'btn-director-outline'}" id="tab-all">
            All Projects (${projects.length})
          </button>
        </div>
      </div>

      ${currentTab === 'proposals' ? renderProposalsTab(pendingProposals, proposals) : ''}
      ${currentTab === 'active' ? renderActiveProjectsTab(activeProjects, faculties) : ''}
      ${currentTab === 'all' ? renderAllProjectsTab(projects, faculties) : ''}

      <!-- Proposal Review Modal -->
      <div id="proposal-modal-container"></div>
      <!-- Assign Faculty Modal -->
      <div id="faculty-modal-container"></div>
    `;

    // Attach Tab Events
    container.querySelector('#tab-proposals')?.addEventListener('click', async () => { currentTab = 'proposals'; await render(); });
    container.querySelector('#tab-active')?.addEventListener('click', async () => { currentTab = 'active'; await render(); });
    container.querySelector('#tab-all')?.addEventListener('click', async () => { currentTab = 'all'; await render(); });

    attachActionEvents(faculties);
  }

  function renderProposalsTab(pendingProposals, allProposals) {
    return `
      <div class="director-panel">
        <div class="director-panel-header">
          <h2>Pending Project Proposals</h2>
          <span style="font-size:0.85rem; color:#6b7280;">Only Director can Accept or Reject proposals</span>
        </div>

        ${pendingProposals.length === 0 ? `
          <div style="text-align:center; padding:2.5rem; color:#6b7280;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:0.5rem;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <p style="margin:0; font-weight:600;">No pending proposals!</p>
            <small>All project proposals have been reviewed.</small>
          </div>
        ` : `
          <div class="director-table-responsive">
            <table class="director-table">
              <thead>
                <tr>
                  <th>Proposal Title</th>
                  <th>Source / Client</th>
                  <th>Submitted</th>
                  <th>Est. Budget</th>
                  <th>Timeline</th>
                  <th>Priority</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${pendingProposals.map(p => `
                  <tr>
                    <td>
                      <strong>${p.title || 'Untitled Proposal'}</strong><br>
                      <small style="color:#6b7280">${p.type || 'General'}</small>
                    </td>
                    <td>
                      ${p.clientName || 'Client'}<br>
                      <small style="color:#6b7280">${p.source || 'Direct'} (${p.sourceName || 'Submission'})</small>
                    </td>
                    <td>${p.submittedDate || 'Recent'}</td>
                    <td>₹${formatMoney(p.estimatedBudget)}</td>
                    <td>${p.expectedTimeline || 'Flexible'}</td>
                    <td>
                      <span class="status-badge ${p.priority === 'urgent' ? 'rejected' : 'in_progress'}">
                        ${(p.priority || 'NORMAL').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <button class="btn-director btn-director-primary btn-open-review" data-id="${p.id}">
                        Review & Decide
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  }

  function renderActiveProjectsTab(activeProjects, faculties) {
    return `
      <div class="director-panel">
        <div class="director-panel-header">
          <h2>Active Projects (${activeProjects.length})</h2>
          <span style="font-size:0.85rem; color:#6b7280;">Monitor progress & manage lead faculty</span>
        </div>

        <div class="director-table-responsive">
          <table class="director-table">
            <thead>
              <tr>
                <th>Project ID & Title</th>
                <th>Client</th>
                <th>Status</th>
                <th>Faculty Lead</th>
                <th>Assigned Students</th>
                <th>Progress</th>
                <th>Budget / Spent</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${activeProjects.map(p => `
                <tr>
                  <td>
                    <strong>${p.title || 'Untitled Project'}</strong><br>
                    <small style="color:#6b7280">${p.id} • ${p.type || 'Web'}</small>
                  </td>
                  <td>${p.clientName || 'N/A'}</td>
                  <td>
                    <span class="status-badge ${p.status === 'accepted' ? 'accepted' : 'in_progress'}">
                      ${p.status === 'accepted' ? 'Accepted' : 'In Progress'}
                    </span>
                  </td>
                  <td><strong>${p.facultyName || 'Unassigned'}</strong></td>
                  <td>
                    ${(!p.assignedStudents || p.assignedStudents.length === 0) ? '<small style="color:#9ca3af">None</small>' :
                      p.assignedStudents.map(s => `<span class="track-badge ${(s.track || 'nova').toLowerCase()}" style="margin:2px;">${s.name} (${s.track || 'Nova'})</span>`).join('')}
                  </td>
                  <td>
                    <div class="director-progress-bar-bg">
                      <div class="director-progress-bar-fill" style="width: ${p.progress || 0}%"></div>
                    </div>
                    <strong>${p.progress || 0}%</strong>
                  </td>
                  <td>
                    ₹${formatMoney(p.spent)} / ₹${formatMoney(p.budget)}
                  </td>
                  <td style="display:flex; flex-direction:column; gap:0.35rem;">
                    ${p.status === 'accepted' ? `
                      <button class="btn-director btn-director-success btn-start-project" data-id="${p.id}">
                        Start Project
                      </button>
                    ` : ''}
                    <button class="btn-director btn-director-outline btn-assign-faculty" data-id="${p.id}">
                      Reassign Faculty
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderAllProjectsTab(projects, faculties) {
    return `
      <div class="director-panel">
        <div class="director-panel-header">
          <h2>All System Projects (${projects.length})</h2>
        </div>
        <div class="director-table-responsive">
          <table class="director-table">
            <thead>
              <tr>
                <th>ID & Title</th>
                <th>Status</th>
                <th>Client</th>
                <th>Faculty Lead</th>
                <th>Progress</th>
                <th>Budget</th>
              </tr>
            </thead>
            <tbody>
              ${projects.map(p => `
                <tr>
                  <td><strong>${p.title || 'Untitled'}</strong><br><small style="color:#6b7280">${p.id}</small></td>
                  <td><span class="status-badge ${p.status || 'pending'}">${(p.status || 'pending').replace('_', ' ')}</span></td>
                  <td>${p.clientName || 'N/A'}</td>
                  <td>${p.facultyName || 'Unassigned'}</td>
                  <td>${p.progress || 0}%</td>
                  <td>₹${formatMoney(p.budget)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function attachActionEvents(faculties) {
    // Open Proposal Review Modal
    container.querySelectorAll('.btn-open-review').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const proposal = DirectorService.getProposals().find(p => p.id === id);
        if (proposal) showProposalModal(proposal, faculties);
      });
    });

    // Start Project (accepted -> in_progress)
    container.querySelectorAll('.btn-start-project').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        const project = DirectorService.getProjects().find(p => p.id === id);
        if (!project) return;
        if (!confirm(`Start "${project.title}"? This will move it from Accepted to In Progress.`)) return;
        try {
          await DirectorService.startProjectAsync(project.raw_id);
          await render();
        } catch (err) {
          alert(err.message || 'Failed to start project');
        }
      });
    });

    // Open Assign Faculty Modal
    container.querySelectorAll('.btn-assign-faculty').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const project = DirectorService.getProjects().find(p => p.id === id);
        if (project) showFacultyModal(project, faculties);
      });
    });
  }

  function showFacultyProjectsPopup(parentHost, faculty) {
    const projectsList = faculty.activeProjects || [];
    const popupOverlay = document.createElement('div');
    popupOverlay.className = 'director-modal-overlay';
    popupOverlay.style.zIndex = '1050';
    popupOverlay.innerHTML = `
      <div class="director-modal" style="max-width: 440px; border-top: 4px solid #10b981;">
        <div class="director-modal-header">
          <h3 style="margin:0; font-size:1.1rem; color:#111827;">Active Projects — ${faculty.name}</h3>
          <button class="btn-director btn-director-outline btn-close-popup">✕</button>
        </div>
        <div class="director-modal-body" style="max-height:280px; overflow-y:auto; margin-bottom:1rem;">
          <div style="font-size:0.8rem; color:#6b7280; margin-bottom:0.75rem;">
            Email: <strong>${faculty.email || 'faculty@rajagiri.edu'}</strong> | Department: <strong>${faculty.department || 'Computer Applications'}</strong>
          </div>
          ${projectsList.length === 0 ? `
            <div style="text-align:center; padding:1.5rem; color:#9ca3af; background:#f9fafb; border-radius:8px;">
              No active projects currently assigned to this faculty member.
            </div>
          ` : `
            <div style="display:flex; flex-direction:column; gap:0.6rem;">
              ${projectsList.map((p, idx) => `
                <div style="padding:0.65rem 0.85rem; background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px;">
                  <div style="font-weight:700; color:#111827; font-size:0.875rem;">${idx + 1}. ${p.title}</div>
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.25rem;">
                    <span style="font-size:0.75rem; color:#6b7280;">Type: ${p.type || 'Web Application'}</span>
                    <span class="status-badge ${p.status === 'completed' ? 'completed' : 'in_progress'}" style="font-size:0.65rem; padding:1px 6px;">
                      ${(p.status || 'in_progress').replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
        <div class="director-modal-footer">
          <button class="btn-director btn-director-primary btn-close-popup">Close</button>
        </div>
      </div>
    `;

    popupOverlay.querySelectorAll('.btn-close-popup').forEach(b => b.addEventListener('click', () => popupOverlay.remove()));
    parentHost.appendChild(popupOverlay);
  }

  function showProposalModal(proposal, faculties) {
    const modalHost = container.querySelector('#proposal-modal-container');
    const defaultFacId = proposal.suggestedFaculty || (faculties[0] ? faculties[0].id : '');
    modalHost.innerHTML = `
      <div class="director-modal-overlay">
        <div class="director-modal" style="max-width:540px;">
          <div class="director-modal-header">
            <h3>Review Proposal: ${proposal.title}</h3>
            <button class="btn-director btn-director-outline btn-close-modal">✕</button>
          </div>
          <div class="director-modal-body">
            <p style="margin-bottom:0.5rem;"><strong>Description:</strong> ${proposal.description}</p>
            <p style="margin-bottom:1rem;"><strong>Source:</strong> ${proposal.source} (${proposal.sourceName}) | <strong>Client:</strong> ${proposal.clientName} | <strong>Est. Budget:</strong> ₹${proposal.estimatedBudget.toLocaleString()}</p>
            
            <label style="font-weight:600; font-size:0.875rem; margin-bottom:0.35rem; display:block;">Assign Lead Faculty:</label>
            <div class="faculty-selection-list" style="display:flex; flex-direction:column; gap:0.5rem; max-height:220px; overflow-y:auto; padding:0.25rem; border:1px solid #d1d5db; border-radius:8px; background:#f9fafb;">
              ${faculties.map(f => {
                const projectsList = f.activeProjects || [];
                const count = f.activeProjectsCount !== undefined ? f.activeProjectsCount : projectsList.length;
                const isSelected = String(f.id) === String(defaultFacId);
                return `
                  <div style="display:flex; justify-content:space-between; align-items:center; padding:0.6rem 0.75rem; background:#ffffff; border:1px solid ${isSelected ? '#10b981' : '#e5e7eb'}; border-radius:6px;">
                    <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer; flex:1; margin:0;">
                      <input type="radio" name="proposal_faculty_choice" value="${f.id}" ${isSelected ? 'checked' : ''} />
                      <div>
                        <div style="font-weight:600; color:#111827; font-size:0.85rem;">${f.name}</div>
                        <div style="font-size:0.75rem; color:#6b7280;">${f.department || 'Computer Applications'}</div>
                      </div>
                    </label>
                    <button type="button" class="btn-director btn-director-outline btn-view-faculty-projects" data-id="${f.id}" title="Click to view assigned project names" style="font-size:0.75rem; padding:0.25rem 0.6rem; color:#047857; border-color:#a7f3d0; background:#ecfdf5; border-radius:6px; cursor:pointer;">
                      📊 ${count} Active Project${count === 1 ? '' : 's'}
                    </button>
                  </div>
                `;
              }).join('')}
            </div>

            <label style="font-weight:600; font-size:0.875rem; margin-top:0.5rem; display:block;">Director Review Notes / Remarks:</label>
            <textarea id="modal-review-notes" rows="2" placeholder="Enter optional notes for the client and team..." style="padding:0.5rem; border-radius:6px; border:1px solid #d1d5db; font-family:inherit;"></textarea>
          </div>
          <div class="director-modal-footer">
            <button class="btn-director btn-director-danger btn-reject-prop">Reject Proposal</button>
            <button class="btn-director btn-director-success btn-accept-prop">Accept & Approve</button>
          </div>
        </div>
      </div>
    `;

    modalHost.querySelector('.btn-close-modal').addEventListener('click', () => { modalHost.innerHTML = ''; });
    modalHost.querySelectorAll('.btn-view-faculty-projects').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const facId = e.currentTarget.getAttribute('data-id');
        const faculty = faculties.find(f => String(f.id) === String(facId));
        if (faculty) showFacultyProjectsPopup(modalHost, faculty);
      });
    });

    modalHost.querySelector('.btn-accept-prop').addEventListener('click', async () => {
      const selectedRadio = modalHost.querySelector('input[name="proposal_faculty_choice"]:checked');
      const facId = selectedRadio ? selectedRadio.value : (faculties[0] ? faculties[0].id : null);
      const notes = modalHost.querySelector('#modal-review-notes').value;
      try {
        await DirectorService.updateProposalStatusAsync(proposal.raw_id, 'accepted', notes, facId);
        modalHost.innerHTML = '';
        await render();
      } catch (err) {
        alert(err.message || 'Failed to accept proposal');
      }
    });

    modalHost.querySelector('.btn-reject-prop').addEventListener('click', async () => {
      const notes = modalHost.querySelector('#modal-review-notes').value;
      try {
        await DirectorService.updateProposalStatusAsync(proposal.raw_id, 'rejected', notes);
        modalHost.innerHTML = '';
        await render();
      } catch (err) {
        alert(err.message || 'Failed to reject proposal');
      }
    });
  }

  function showFacultyModal(project, faculties) {
    const modalHost = container.querySelector('#faculty-modal-container');
    const defaultFacId = project.facultyId || (faculties[0] ? faculties[0].id : '');
    modalHost.innerHTML = `
      <div class="director-modal-overlay">
        <div class="director-modal" style="max-width:520px;">
          <div class="director-modal-header">
            <h3>Assign Faculty to ${project.title}</h3>
            <button class="btn-director btn-director-outline btn-close-modal">✕</button>
          </div>
          <div class="director-modal-body">
            <p style="margin-bottom:0.75rem;">Current Lead Faculty: <strong>${project.facultyName || 'Unassigned'}</strong></p>
            <label style="font-weight:600; font-size:0.875rem; margin-bottom:0.35rem; display:block;">Select New Lead Faculty:</label>
            
            <div class="faculty-selection-list" style="display:flex; flex-direction:column; gap:0.5rem; max-height:220px; overflow-y:auto; padding:0.25rem; border:1px solid #d1d5db; border-radius:8px; background:#f9fafb;">
              ${faculties.map(f => {
                const projectsList = f.activeProjects || [];
                const count = f.activeProjectsCount !== undefined ? f.activeProjectsCount : projectsList.length;
                const isSelected = String(f.id) === String(defaultFacId);
                return `
                  <div style="display:flex; justify-content:space-between; align-items:center; padding:0.6rem 0.75rem; background:#ffffff; border:1px solid ${isSelected ? '#10b981' : '#e5e7eb'}; border-radius:6px;">
                    <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer; flex:1; margin:0;">
                      <input type="radio" name="project_faculty_choice" value="${f.id}" ${isSelected ? 'checked' : ''} />
                      <div>
                        <div style="font-weight:600; color:#111827; font-size:0.85rem;">${f.name}</div>
                        <div style="font-size:0.75rem; color:#6b7280;">${f.department || 'Computer Applications'}</div>
                      </div>
                    </label>
                    <button type="button" class="btn-director btn-director-outline btn-view-faculty-projects" data-id="${f.id}" title="Click to view assigned project names" style="font-size:0.75rem; padding:0.25rem 0.6rem; color:#047857; border-color:#a7f3d0; background:#ecfdf5; border-radius:6px; cursor:pointer;">
                      📊 ${count} Active Project${count === 1 ? '' : 's'}
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          <div class="director-modal-footer">
            <button class="btn-director btn-director-outline btn-close-modal">Cancel</button>
            <button class="btn-director btn-director-primary btn-save-faculty">Save Assignment</button>
          </div>
        </div>
      </div>
    `;

    modalHost.querySelectorAll('.btn-close-modal').forEach(b => b.addEventListener('click', () => { modalHost.innerHTML = ''; }));
    modalHost.querySelectorAll('.btn-view-faculty-projects').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const facId = e.currentTarget.getAttribute('data-id');
        const faculty = faculties.find(f => String(f.id) === String(facId));
        if (faculty) showFacultyProjectsPopup(modalHost, faculty);
      });
    });

    modalHost.querySelector('.btn-save-faculty').addEventListener('click', async () => {
      const selectedRadio = modalHost.querySelector('input[name="project_faculty_choice"]:checked');
      const facId = selectedRadio ? selectedRadio.value : (faculties[0] ? faculties[0].id : null);
      try {
        await DirectorService.assignFacultyAsync(project.raw_id, facId);
        modalHost.innerHTML = '';
        await render();
      } catch (err) {
        alert(err.message || 'Failed to assign faculty');
      }
    });
  }

  const loadAllData = async () => {
    // Sequential, not Promise.all: DirectorService caches each of these in the same
    // shared localStorage blob via an independent load/modify/save cycle, so running
    // them concurrently would let whichever finishes last discard the others' writes.
    // Click handlers below (Reassign Faculty, Start Project) read that cache directly
    // at click time, so it must end up fully consistent, not just this render() call.
    const projects = await DirectorService.getProjectsAsync();
    const proposals = await DirectorService.getProposalsAsync();
    const faculties = await DirectorService.getFacultiesAsync();
    render(faculties || [], proposals || [], projects || []);
  };

  render();
  loadAllData();
  return container;
}

export default DirectorProjects;
