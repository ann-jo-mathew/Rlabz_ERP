import { authStore } from '@/core/stores/auth.js';

function getAuthToken() {
  return authStore?.token || localStorage.getItem('token') || localStorage.getItem('access_token') || null;
}

async function fetchMeetings() {
  const token = getAuthToken();
  if (!token) return [];

  const resp = await fetch('http://127.0.0.1:8000/api/coordinator/meetings', {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.ok) return [];
  const body = await resp.json().catch(() => ({}));
  return Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []);
}

async function fetchProjects() {
  const token = getAuthToken();
  if (!token) return [];

  const resp = await fetch('http://127.0.0.1:8000/api/coordinator/projects', {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.ok) return [];
  const body = await resp.json().catch(() => ({}));
  return Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []);
}

export async function CoordinatorMeetings(route, router) {
  const container = document.createElement('div');
  container.className = 'coordinator-dashboard';

  let meetings = [];
  try {
    meetings = await fetchMeetings();
  } catch (err) {
    console.error('Failed to load meetings:', err);
  }

  function renderTableRows(data) {
    if (!data.length) {
      return `<tr><td colspan="6" style="text-align:center; padding:2rem;">No meetings scheduled yet.</td></tr>`;
    }
    return data.map(meeting => `
      <tr>
        <td>
          <strong>${meeting.date}</strong><br>
          <small>${meeting.time}</small>
        </td>
        <td>${meeting.title}</td>
        <td>${meeting.project}</td>
        <td>${meeting.participants || 'Coordinator, Students'}</td>
        <td>
          <span class="project-status ${String(meeting.status).toLowerCase()}">
            ${meeting.status}
          </span>
        </td>
        <td>
          ${meeting.meeting_link
            ? `<a href="${meeting.meeting_link}" target="_blank" rel="noopener noreferrer">Join</a>`
            : '—'}
        </td>
      </tr>
    `).join('');
  }

  function render() {
    container.innerHTML = `
      <div class="coordinator-header">
        <div>
          <h1>Meetings</h1>
          <p>Arrange and document meetings between students, clients and RLabZ members.</p>
        </div>

        <button class="coordinator-primary-btn" id="add-meeting-btn">
          + Arrange Meeting
        </button>
      </div>

      <div class="coordinator-panel">
        <div class="coordinator-panel-header">
          <div>
            <h2>Project Meetings</h2>
            <p>Upcoming and completed project meetings.</p>
          </div>
        </div>

        <div class="coordinator-table-wrapper">
          <table class="coordinator-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Meeting</th>
                <th>Project</th>
                <th>Participants</th>
                <th>Status</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody id="meetings-table-body">
              ${renderTableRows(meetings)}
            </tbody>
          </table>
        </div>
      </div>

      <div id="meeting-modal-root"></div>
    `;

    container.querySelector('#add-meeting-btn')?.addEventListener('click', showMeetingForm);
  }

  async function showMeetingForm() {
    const root = container.querySelector('#meeting-modal-root');
    const projects = await fetchProjects();

    const projectOptionsHtml = projects.length
      ? projects.map(p => `<option value="${p.title}">${p.title}</option>`).join('')
      : '<option value="">No active projects</option>';

    root.innerHTML = `
      <div class="coordinator-modal-overlay">
        <div class="coordinator-modal">
          <div class="coordinator-modal-header">
            <div>
              <h2>Arrange Meeting</h2>
              <p>Schedule a project-related meeting.</p>
            </div>
            <button id="close-meeting" class="coordinator-close-btn">×</button>
          </div>

          <form id="meeting-form">
            <div class="coordinator-form-grid">
              <div class="coordinator-form-group">
                <label>Meeting Title *</label>
                <input name="title" placeholder="e.g. Client Requirement Discussion" required>
              </div>

              <div class="coordinator-form-group">
                <label>Project *</label>
                <select name="project" required>
                  <option value="">Select project</option>
                  ${projectOptionsHtml}
                </select>
              </div>

              <div class="coordinator-form-group">
                <label>Date *</label>
                <input type="date" name="date" required>
              </div>

              <div class="coordinator-form-group">
                <label>Time *</label>
                <input type="time" name="time" required>
              </div>

              <div class="coordinator-form-group full-width">
                <label>Participants</label>
                <input name="participants" placeholder="Students / Faculty / Client">
              </div>

              <div class="coordinator-form-group full-width">
                <label>Meeting Link</label>
                <input type="url" name="meeting_link" placeholder="e.g. https://meet.google.com/xyz-abc-def">
              </div>

              <div class="coordinator-form-group full-width">
                <label>Meeting Notes</label>
                <textarea name="agenda" rows="4" placeholder="Add meeting agenda or notes..."></textarea>
              </div>
            </div>

            <div class="coordinator-modal-footer">
              <button type="button" id="cancel-meeting" class="coordinator-secondary-btn">Cancel</button>
              <button type="submit" class="coordinator-primary-btn">Schedule Meeting</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const close = () => { root.innerHTML = ''; };

    root.querySelector('#close-meeting')?.addEventListener('click', close);
    root.querySelector('#cancel-meeting')?.addEventListener('click', close);

    root.querySelector('#meeting-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      const token = getAuthToken();
      if (!token) return alert('Authentication required');

      try {
        const resp = await fetch('http://127.0.0.1:8000/api/coordinator/meetings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const body = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(body.error || body.message || 'Failed to schedule meeting');

        alert('Meeting scheduled successfully!');
        close();

        // Refresh meeting list
        meetings = await fetchMeetings();
        const tbody = container.querySelector('#meetings-table-body');
        if (tbody) tbody.innerHTML = renderTableRows(meetings);

      } catch (err) {
        console.error(err);
        alert(`Error: ${err.message}`);
      }
    });
  }

  render();

  return container;
}

export default CoordinatorMeetings;