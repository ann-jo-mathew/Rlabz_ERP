import { DirectorService } from '../services/DirectorService.js';

export function DirectorProjects(route, router) {
  const container = document.createElement('div');
  container.className = 'director-dashboard';

  let currentTab = 'proposals'; // 'proposals', 'active', 'all'
  let selectedProposal = null;

  function render() {
    const proposals = DirectorService.getProposals();
    const projects = DirectorService.getProjects();
    const faculties = DirectorService.getFaculties();

    const pendingProposals = proposals.filter(p => p.status === 'pending');
    const activeProjects = projects.filter(p => p.status === 'in_progress');

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
    container.querySelector('#tab-proposals')?.addEventListener('click', () => { currentTab = 'proposals'; render(); });
    container.querySelector('#tab-active')?.addEventListener('click', () => { currentTab = 'active'; render(); });
    container.querySelector('#tab-all')?.addEventListener('click', () => { currentTab = 'all'; render(); });

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
                      <strong>${p.title}</strong><br>
                      <small style="color:#6b7280">${p.type}</small>
                    </td>
                    <td>
                      ${p.clientName}<br>
                      <small style="color:#6b7280">${p.source} (${p.sourceName})</small>
                    </td>
                    <td>${p.submittedDate}</td>
                    <td>₹${p.estimatedBudget.toLocaleString()}</td>
                    <td>${p.expectedTimeline}</td>
                    <td>
                      <span class="status-badge ${p.priority === 'urgent' ? 'rejected' : 'in_progress'}">
                        ${p.priority.toUpperCase()}
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
                <th>Faculty Lead</th>
                <th>Assigned Students</th>
                <th>Progress</th>
                <th>Budget / Spent</th>
                <th>Faculty Assignment</th>
              </tr>
            </thead>
            <tbody>
              ${activeProjects.map(p => `
                <tr>
                  <td>
                    <strong>${p.title}</strong><br>
                    <small style="color:#6b7280">${p.id} • ${p.type}</small>
                  </td>
                  <td>${p.clientName}</td>
                  <td><strong>${p.facultyName}</strong></td>
                  <td>
                    ${p.assignedStudents.length === 0 ? '<small style="color:#9ca3af">None</small>' : 
                      p.assignedStudents.map(s => `<span class="track-badge ${s.track.toLowerCase()}" style="margin:2px;">${s.name} (${s.track})</span>`).join('')}
                  </td>
                  <td>
                    <div class="director-progress-bar-bg">
                      <div class="director-progress-bar-fill" style="width: ${p.progress}%"></div>
                    </div>
                    <strong>${p.progress}%</strong>
                  </td>
                  <td>
                    ₹${p.spent.toLocaleString()} / ₹${p.budget.toLocaleString()}
                  </td>
                  <td>
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
                  <td><strong>${p.title}</strong><br><small style="color:#6b7280">${p.id}</small></td>
                  <td><span class="status-badge ${p.status}">${p.status.replace('_', ' ')}</span></td>
                  <td>${p.clientName}</td>
                  <td>${p.facultyName}</td>
                  <td>${p.progress}%</td>
                  <td>₹${p.budget.toLocaleString()}</td>
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

    // Open Assign Faculty Modal
    container.querySelectorAll('.btn-assign-faculty').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const project = DirectorService.getProjects().find(p => p.id === id);
        if (project) showFacultyModal(project, faculties);
      });
    });
  }

  function showProposalModal(proposal, faculties) {
    const modalHost = container.querySelector('#proposal-modal-container');
    modalHost.innerHTML = `
      <div class="director-modal-overlay">
        <div class="director-modal">
          <div class="director-modal-header">
            <h3>Review Proposal: ${proposal.title}</h3>
            <button class="btn-director btn-director-outline btn-close-modal">✕</button>
          </div>
          <div class="director-modal-body">
            <p><strong>Description:</strong> ${proposal.description}</p>
            <p><strong>Source:</strong> ${proposal.source} (${proposal.sourceName}) | <strong>Client:</strong> ${proposal.clientName}</p>
            <p><strong>Est. Budget:</strong> ₹${proposal.estimatedBudget.toLocaleString()} | <strong>Timeline:</strong> ${proposal.expectedTimeline}</p>
            
            <label style="font-weight:600; font-size:0.875rem;">Assign Lead Faculty:</label>
            <select id="modal-select-faculty" style="padding:0.5rem; border-radius:6px; border:1px solid #d1d5db;">
              ${faculties.map(f => `<option value="${f.id}" ${f.id === proposal.suggestedFaculty ? 'selected' : ''}>${f.name} (${f.department})</option>`).join('')}
            </select>

            <label style="font-weight:600; font-size:0.875rem;">Director Review Notes / Remarks:</label>
            <textarea id="modal-review-notes" rows="3" placeholder="Enter optional notes for the client and team..." style="padding:0.5rem; border-radius:6px; border:1px solid #d1d5db; font-family:inherit;"></textarea>
          </div>
          <div class="director-modal-footer">
            <button class="btn-director btn-director-danger btn-reject-prop">Reject Proposal</button>
            <button class="btn-director btn-director-success btn-accept-prop">Accept & Approve</button>
          </div>
        </div>
      </div>
    `;

    modalHost.querySelector('.btn-close-modal').addEventListener('click', () => { modalHost.innerHTML = ''; });

    modalHost.querySelector('.btn-accept-prop').addEventListener('click', () => {
      const facId = modalHost.querySelector('#modal-select-faculty').value;
      const notes = modalHost.querySelector('#modal-review-notes').value;
      DirectorService.updateProposalStatus(proposal.id, 'accepted', notes, facId);
      modalHost.innerHTML = '';
      render();
    });

    modalHost.querySelector('.btn-reject-prop').addEventListener('click', () => {
      const notes = modalHost.querySelector('#modal-review-notes').value;
      DirectorService.updateProposalStatus(proposal.id, 'rejected', notes);
      modalHost.innerHTML = '';
      render();
    });
  }

  function showFacultyModal(project, faculties) {
    const modalHost = container.querySelector('#faculty-modal-container');
    modalHost.innerHTML = `
      <div class="director-modal-overlay">
        <div class="director-modal">
          <div class="director-modal-header">
            <h3>Assign Faculty to ${project.title}</h3>
            <button class="btn-director btn-director-outline btn-close-modal">✕</button>
          </div>
          <div class="director-modal-body">
            <p>Current Lead Faculty: <strong>${project.facultyName}</strong></p>
            <label style="font-weight:600; font-size:0.875rem;">Select New Lead Faculty:</label>
            <select id="modal-reassign-faculty" style="padding:0.5rem; border-radius:6px; border:1px solid #d1d5db;">
              ${faculties.map(f => `<option value="${f.id}" ${f.id === project.facultyId ? 'selected' : ''}>${f.name} (${f.department})</option>`).join('')}
            </select>
          </div>
          <div class="director-modal-footer">
            <button class="btn-director btn-director-outline btn-close-modal">Cancel</button>
            <button class="btn-director btn-director-primary btn-save-faculty">Save Assignment</button>
          </div>
        </div>
      </div>
    `;

    modalHost.querySelectorAll('.btn-close-modal').forEach(b => b.addEventListener('click', () => { modalHost.innerHTML = ''; }));

    modalHost.querySelector('.btn-save-faculty').addEventListener('click', () => {
      const facId = modalHost.querySelector('#modal-reassign-faculty').value;
      DirectorService.assignFaculty(project.id, facId);
      modalHost.innerHTML = '';
      render();
    });
  }

  render();
  return container;
}

export default DirectorProjects;
