import { renderStudentSidebar } from './StudentSidebar.js';
import { getProposals, saveProposal } from './mockStore.js';
import '../student.css';

export function StudentProposals(route, router) {
  renderStudentSidebar();

  const container = document.createElement('div');
  container.className = 'student-portal-container animate-fade-in';

  function render() {
    const proposals = getProposals();

    // Render proposals table rows
    const proposalRows = proposals.map(p => {
      let statusClass = 'student-badge-warning';
      if (p.status === 'Approved') statusClass = 'student-badge-success';
      if (p.status === 'Rejected') statusClass = 'student-badge-danger';

      return `
        <tr style="vertical-align: top;">
          <td>
            <div style="font-weight:600; margin-bottom:4px;">${p.title}</div>
            <div style="font-size:0.8rem; color:var(--text-muted); line-height:1.4;">${p.description}</div>
            ${p.status === 'Rejected' && p.feedback ? `
              <div class="student-alert-danger" style="margin-top:8px; padding:8px 12px; font-size:0.78rem;">
                <strong>Rejection Feedback:</strong> ${p.feedback}
              </div>
            ` : ''}
          </td>
          <td><span style="font-size:0.8rem; color:var(--text-muted); font-weight:500;">${p.tech}</span></td>
          <td><span style="font-size:0.8rem; color:var(--text-muted);">${p.duration}</span></td>
          <td><span class="student-badge ${statusClass}">${p.status}</span></td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="student-header">
        <h1>Project Proposals</h1>
        <p>Submit new project ideas for department review and track status approvals.</p>
      </div>

      <div class="student-split-pane" style="grid-template-columns: 1fr 1.5fr;">
        <!-- Proposal Submission Form -->
        <div class="student-card">
          <div class="student-card-title">Submit New Proposal</div>
          <form id="proposal-form" class="student-form">
            <div class="student-form-group">
              <label for="title">Project Title</label>
              <input type="text" id="title" class="student-input" placeholder="e.g. Smart Campus Navigation" required>
            </div>
            
            <div class="student-form-group">
              <label for="description">Detailed Description</label>
              <textarea id="description" class="student-textarea" placeholder="Explain the objective and architecture..." required></textarea>
            </div>

            <div class="student-form-group">
              <label for="tech">Technologies / Frameworks</label>
              <input type="text" id="tech" class="student-input" placeholder="e.g. Flutter, Firebase, Node.js" required>
            </div>

            <div class="student-form-group">
              <label for="duration">Expected Duration</label>
              <select id="duration" class="student-select" required>
                <option value="" disabled selected>Select expected duration</option>
                <option value="2 Months">2 Months</option>
                <option value="3 Months">3 Months</option>
                <option value="4 Months">4 Months</option>
                <option value="6 Months">6 Months</option>
              </select>
            </div>

            <button type="submit" class="student-btn student-btn-primary" style="justify-content:center; margin-top:8px;">
              Submit Proposal
            </button>
          </form>
        </div>

        <!-- Proposals List Table -->
        <div class="student-card">
          <div class="student-card-title">Submitted Proposals</div>
          <div class="student-table-container">
            <table class="student-table">
              <thead>
                <tr>
                  <th style="width: 50%;">Project Idea & Details</th>
                  <th style="width: 25%;">Technologies</th>
                  <th style="width: 15%;">Duration</th>
                  <th style="width: 10%;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${proposalRows || '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">No proposals submitted yet.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Bind submit event handler
    const form = container.querySelector('#proposal-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const title = container.querySelector('#title').value.trim();
      const description = container.querySelector('#description').value.trim();
      const tech = container.querySelector('#tech').value.trim();
      const duration = container.querySelector('#duration').value;

      if (!title || !description || !tech || !duration) return;

      saveProposal({ title, description, tech, duration });
      
      // Re-render and notify
      render();
    });
  }

  render();
  return container;
}

export default StudentProposals;
