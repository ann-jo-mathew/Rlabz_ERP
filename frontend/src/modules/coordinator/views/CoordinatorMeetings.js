import { authStore } from '@/core/stores/auth.js';
import { API_BASE } from '@/core/config/api.js';

function getAuthToken() {
  return authStore?.token || localStorage.getItem('token') || localStorage.getItem('access_token') || null;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}

const MONTH_INDEX = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

// The coordinator meetings endpoint formats dates as "d M Y" (e.g. "07 Sep 2026").
// Parsed explicitly here (rather than via `new Date(dateStr)`) so the past-meeting
// check doesn't depend on the browser's locale-specific date-string parsing.
function parseMeetingDateOnly(dateStr) {
  if (!dateStr) return null;
  const parts = String(dateStr).trim().split(/\s+/);
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = MONTH_INDEX[parts[1]];
  const year = parseInt(parts[2], 10);
  if (Number.isNaN(day) || month === undefined || Number.isNaN(year)) return null;
  return new Date(year, month, day);
}

function isPastScheduledMeeting(meeting) {
  if (String(meeting.status || '').toLowerCase() !== 'scheduled') return false;
  const meetingDate = parseMeetingDateOnly(meeting.date);
  if (!meetingDate) return false;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return meetingDate < todayStart;
}

async function apiRequest(path, options = {}) {
  const token = getAuthToken();
  if (!token) return { ok: false, status: 401, body: { error: 'Authentication required' } };

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  const resp = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const body = await resp.json().catch(() => ({}));
  return { ok: resp.ok, status: resp.status, body };
}

async function fetchMeetings() {
  const { ok, body } = await apiRequest('/coordinator/meetings');
  if (!ok) return [];
  return Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []);
}

async function fetchProjects() {
  const token = getAuthToken();
  if (!token) return [];

  const resp = await fetch(`${API_BASE}/coordinator/projects`, {
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

  const todayStr = new Date().toISOString().split('T')[0];

  let meetings = [];
  let projects = [];
  let loadError = null;

  try {
    [meetings, projects] = await Promise.all([fetchMeetings(), fetchProjects()]);
  } catch (err) {
    loadError = err;
  }

  if (loadError) {
    container.innerHTML = `
      <div class="coordinator-panel coordinator-empty-state">
        <h2>Unable to load meetings</h2>
        <p>${escapeHtml(loadError.message || 'Something went wrong while loading meetings.')}</p>
      </div>
    `;
    return container;
  }

  // ---- UI state ----
  let activeTab = 'schedule'; // 'schedule' | 'past'
  let expandedPendingId = null; // meeting id whose "Add Minutes & Outcome" form is open
  let expandedEditId = null; // meeting id whose "Edit Minutes & Outcome" form is open
  let banner = null; // { type: 'success' | 'error', message }

  function renderBanner() {
    if (!banner) return '';
    const isSuccess = banner.type === 'success';
    return `
      <div style="background: ${isSuccess ? '#ecfdf5' : '#fef2f2'}; border: 1px solid ${isSuccess ? '#86efac' : '#fca5a5'}; color: ${isSuccess ? '#166534' : '#b91c1c'}; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; margin-bottom: 1.25rem;">
        ${isSuccess ? '✓' : '⚠'} ${escapeHtml(banner.message)}
      </div>
    `;
  }

  function renderTabs(pendingCount) {
    return `
      <div style="display:flex; gap:1rem; border-bottom:1px solid #e5e7eb; margin-bottom:1.5rem;">
        <button type="button" class="coordinator-meeting-tab" data-tab="schedule" style="background:none; border:none; padding:0.6rem 1.1rem; font-weight:700; font-size:0.9rem; cursor:pointer; border-bottom:2px solid ${activeTab === 'schedule' ? '#2563eb' : 'transparent'}; color:${activeTab === 'schedule' ? '#2563eb' : '#6b7280'};">
          Schedule Meeting
        </button>
        <button type="button" class="coordinator-meeting-tab" data-tab="past" style="background:none; border:none; padding:0.6rem 1.1rem; font-weight:700; font-size:0.9rem; cursor:pointer; border-bottom:2px solid ${activeTab === 'past' ? '#2563eb' : 'transparent'}; color:${activeTab === 'past' ? '#2563eb' : '#6b7280'}; display:inline-flex; align-items:center; gap:0.5rem;">
          Past Meetings
          ${pendingCount > 0 ? `<span style="background:#fef2f2; color:#dc2626; border-radius:12px; padding:0.15rem 0.55rem; font-size:0.72rem; font-weight:700;">${pendingCount} Pending</span>` : ''}
        </button>
      </div>
    `;
  }

  function renderScheduleTab() {
    const projectOptions = projects.length
      ? projects.map((p) => `<option value="${escapeHtml(p.title)}">${escapeHtml(p.title)}</option>`).join('')
      : '<option value="">No projects found</option>';

    return `
      <div class="coordinator-panel" style="max-width: 760px;">
        <div class="coordinator-panel-header">
          <div>
            <h2>Schedule New Meeting</h2>
            <p>Initial status will be set to <strong>scheduled</strong>.</p>
          </div>
        </div>

        <form id="schedule-meeting-form" class="coordinator-form-grid">
          <div class="coordinator-form-group full-width">
            <label>Meeting Title *</label>
            <input type="text" id="meeting-title" placeholder="e.g. Client Requirement Discussion" required>
          </div>

          <div class="coordinator-form-group full-width">
            <label>Project *</label>
            <select id="meeting-project" required>
              <option value="">Select project</option>
              ${projectOptions}
            </select>
          </div>

          <div class="coordinator-form-group">
            <label>Date *</label>
            <input type="date" id="meeting-date" min="${todayStr}" value="${todayStr}" required>
          </div>

          <div class="coordinator-form-group">
            <label>Time *</label>
            <input type="time" id="meeting-time" value="10:00" required>
          </div>

          <div class="coordinator-form-group">
            <label>Location</label>
            <input type="text" id="meeting-location" placeholder="e.g. Google Meet">
          </div>

          <div class="coordinator-form-group">
            <label>Meeting Link</label>
            <input type="url" id="meeting-link" placeholder="https://meet.google.com/xyz-abc-def">
          </div>

          <div class="coordinator-form-group full-width">
            <label>Agenda / Notes</label>
            <textarea id="meeting-agenda" rows="4" placeholder="Add meeting agenda or notes..."></textarea>
          </div>

          <div class="coordinator-form-group full-width" style="align-items: flex-start;">
            <button type="submit" id="schedule-submit-btn" class="coordinator-primary-btn">Schedule Meeting</button>
          </div>
        </form>
      </div>
    `;
  }

  function renderMinutesForm(meetingId, { withCancel = true } = {}) {
    return `
      <form class="minutes-form" data-id="${meetingId}" style="margin-top: 1rem; padding: 1rem; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div class="coordinator-form-group" style="margin-bottom: 0.75rem;">
          <label>Minutes of Meeting *</label>
          <textarea class="minutes-input" rows="3" placeholder="Discussion summary, topics covered..." required></textarea>
        </div>
        <div class="coordinator-form-group" style="margin-bottom: 0.75rem;">
          <label>Important Decisions *</label>
          <textarea class="decisions-input" rows="3" placeholder="Agreed deliverables, deadlines, approvals..." required></textarea>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:0.6rem;">
          ${withCancel ? `<button type="button" class="coordinator-secondary-btn minutes-form-cancel" data-id="${meetingId}">Cancel</button>` : ''}
          <button type="submit" class="coordinator-primary-btn">Save Notes &amp; Mark Completed</button>
        </div>
      </form>
    `;
  }

  function renderPendingCard(meeting) {
    const isExpanded = expandedPendingId === meeting.id;
    return `
      <div class="coordinator-panel" style="border-left: 4px solid #dc2626; margin-bottom: 1.1rem;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; flex-wrap:wrap;">
          <div>
            <strong style="font-size:1.02rem; color:#111827; display:block;">${escapeHtml(meeting.title)}</strong>
            <span style="font-size:0.85rem; color:#2563eb; font-weight:600;">Project: ${escapeHtml(meeting.project)}</span>
          </div>
          <span class="project-status" style="background:#fef2f2; color:#dc2626;">Minutes Pending</span>
        </div>

        <div style="margin-top:0.75rem; font-size:0.85rem; color:#4b5563; display:flex; flex-direction:column; gap:0.35rem;">
          <div>Scheduled: <strong style="color:#111827;">${escapeHtml(meeting.date)} at ${escapeHtml(meeting.time)}</strong> <span style="color:#dc2626; font-weight:600;">(date passed)</span></div>
          ${meeting.location ? `<div>Location: <strong style="color:#111827;">${escapeHtml(meeting.location)}</strong></div>` : ''}
          ${meeting.meeting_link ? `<div>Meeting Link: <a href="${escapeHtml(meeting.meeting_link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(meeting.meeting_link)}</a></div>` : ''}
          ${meeting.agenda ? `<div style="margin-top:0.25rem; padding:0.5rem 0.75rem; background:#f8fafc; border:1px solid #e5e7eb; border-radius:6px;"><strong>Agenda:</strong> ${escapeHtml(meeting.agenda)}</div>` : ''}
        </div>

        <div style="margin-top:1rem; padding-top:0.85rem; border-top:1px dashed #e5e7eb; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
          <span style="font-size:0.85rem; font-weight:600; color:#92400e;">Update Status:</span>
          <div style="display:flex; gap:0.6rem;">
            <button type="button" class="coordinator-primary-btn btn-toggle-pending-form" data-id="${meeting.id}">
              ${isExpanded ? 'Hide Form' : 'Add Minutes & Outcome'}
            </button>
            <button type="button" class="coordinator-secondary-btn btn-mark-cancelled" data-id="${meeting.id}" style="color:#dc2626;">
              Mark Cancelled
            </button>
          </div>
        </div>

        ${isExpanded ? renderMinutesForm(meeting.id) : ''}
      </div>
    `;
  }

  function renderCompletedRow(meeting) {
    const isEditing = expandedEditId === meeting.id;
    return `
      <tr>
        <td>
          <strong>${escapeHtml(meeting.title)}</strong>
          ${meeting.agenda ? `<br><small style="color:#6b7280;">${escapeHtml(meeting.agenda)}</small>` : ''}
        </td>
        <td>${escapeHtml(meeting.project)}</td>
        <td>${escapeHtml(meeting.date)}<br><small>${escapeHtml(meeting.time)}</small></td>
        <td><span class="project-status completed">Completed</span></td>
        <td>
          <button type="button" class="coord-btn coord-btn-secondary btn-toggle-edit-form" data-id="${meeting.id}">
            ${isEditing ? 'Hide' : 'Edit Minutes & Outcome'}
          </button>
        </td>
      </tr>
      ${isEditing ? `
        <tr>
          <td colspan="5" style="background:#f8fafc;">
            <div style="font-size:0.8rem; color:#6b7280; margin-bottom:0.5rem;">
              Note: the current meetings list does not return previously saved minutes, so this form starts blank. Submitting will overwrite the saved minutes and important decisions for this meeting.
            </div>
            ${renderMinutesForm(meeting.id, { withCancel: true })}
          </td>
        </tr>
      ` : ''}
    `;
  }

  function renderPastTab(pendingMeetings, completedMeetings) {
    return `
      <div>
        <h2 style="margin:0 0 0.35rem; font-size:1.1rem; color:#111827;">Past Meetings Awaiting Minutes &amp; Outcome (${pendingMeetings.length})</h2>
        <p style="margin:0 0 1rem; font-size:0.85rem; color:#6b7280;">
          These meetings' scheduled dates have passed while still marked <strong>scheduled</strong>. Mark them completed (with minutes and decisions) or cancelled.
        </p>

        ${pendingMeetings.length === 0 ? `
          <div class="coordinator-panel" style="text-align:center; color:#6b7280; padding:2rem;">
            No past meetings are awaiting minutes or a status update.
          </div>
        ` : pendingMeetings.map(renderPendingCard).join('')}

        <div style="margin-top:2rem;">
          <h2 style="margin:0 0 0.35rem; font-size:1.1rem; color:#111827;">Completed Meetings (${completedMeetings.length})</h2>
          <p style="margin:0 0 1rem; font-size:0.85rem; color:#6b7280;">Meetings marked completed, with recorded minutes and decisions.</p>

          ${completedMeetings.length === 0 ? `
            <div class="coordinator-panel" style="text-align:center; color:#6b7280; padding:2rem;">
              No completed meetings yet.
            </div>
          ` : `
            <div class="coordinator-panel">
              <div class="coordinator-table-wrapper">
                <table class="coordinator-table">
                  <thead>
                    <tr>
                      <th>Meeting</th>
                      <th>Project</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${completedMeetings.map(renderCompletedRow).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          `}
        </div>
      </div>
    `;
  }

  function render() {
    const pendingMeetings = meetings.filter(isPastScheduledMeeting);
    const completedMeetings = meetings.filter((m) => String(m.status || '').toLowerCase() === 'completed');

    container.innerHTML = `
      <div class="coordinator-header">
        <div>
          <h1>Meetings</h1>
          <p>Arrange and document meetings between students, clients and RLabZ members.</p>
        </div>
        <span class="coordinator-role-badge">Co-ordinator</span>
      </div>

      ${renderTabs(pendingMeetings.length)}
      ${renderBanner()}

      <div id="meetings-tab-content">
        ${activeTab === 'schedule' ? renderScheduleTab() : renderPastTab(pendingMeetings, completedMeetings)}
      </div>
    `;

    bindEvents(pendingMeetings);
  }

  function setBanner(type, message) {
    banner = { type, message };
  }

  async function refreshMeetings() {
    meetings = await fetchMeetings();
  }

  function bindEvents() {
    container.querySelectorAll('.coordinator-meeting-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        expandedPendingId = null;
        expandedEditId = null;
        banner = null;
        render();
      });
    });

    // Schedule form
    const scheduleForm = container.querySelector('#schedule-meeting-form');
    scheduleForm?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const title = container.querySelector('#meeting-title').value.trim();
      const project = container.querySelector('#meeting-project').value;
      const date = container.querySelector('#meeting-date').value;
      const time = container.querySelector('#meeting-time').value;
      const location = container.querySelector('#meeting-location').value.trim();
      const meetingLink = container.querySelector('#meeting-link').value.trim();
      const agenda = container.querySelector('#meeting-agenda').value.trim();

      if (date < todayStr) {
        setBanner('error', 'Past dates are not allowed. Please select today or a future date.');
        render();
        return;
      }

      const submitBtn = container.querySelector('#schedule-submit-btn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Scheduling...';

      try {
        const { ok, body } = await apiRequest('/coordinator/meetings', {
          method: 'POST',
          body: JSON.stringify({
            title,
            project,
            date,
            time,
            location: location || null,
            meeting_link: meetingLink || null,
            agenda: agenda || null,
          }),
        });

        if (ok) {
          await refreshMeetings();
          setBanner('success', `Meeting "${title}" scheduled successfully.`);
        } else {
          setBanner('error', body.error || body.message || 'Failed to schedule meeting.');
        }
      } catch (err) {
        setBanner('error', err.message || 'Failed to schedule meeting.');
      } finally {
        render();
      }
    });

    // Pending: toggle "Add Minutes & Outcome"
    container.querySelectorAll('.btn-toggle-pending-form').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10);
        expandedPendingId = expandedPendingId === id ? null : id;
        render();
      });
    });

    // Pending: mark cancelled
    container.querySelectorAll('.btn-mark-cancelled').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id, 10);
        if (!confirm('Mark this meeting as cancelled? No minutes will be recorded.')) return;

        try {
          const { ok, body } = await apiRequest(`/coordinator/meetings/${id}/status`, {
            method: 'POST',
            body: JSON.stringify({ status: 'cancelled' }),
          });

          if (ok) {
            await refreshMeetings();
            setBanner('success', 'Meeting marked as cancelled.');
          } else {
            setBanner('error', body.error || body.message || 'Failed to cancel meeting.');
          }
        } catch (err) {
          setBanner('error', err.message || 'Failed to cancel meeting.');
        } finally {
          expandedPendingId = null;
          render();
        }
      });
    });

    // Completed: toggle edit form
    container.querySelectorAll('.btn-toggle-edit-form').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10);
        expandedEditId = expandedEditId === id ? null : id;
        render();
      });
    });

    // Minutes forms (both "Add Minutes & Outcome" and "Edit Minutes & Outcome")
    container.querySelectorAll('.minutes-form').forEach((form) => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = parseInt(form.dataset.id, 10);
        const minutes = form.querySelector('.minutes-input').value.trim();
        const important_decisions = form.querySelector('.decisions-input').value.trim();

        if (!minutes || !important_decisions) {
          setBanner('error', 'Please provide both minutes of meeting and important decisions.');
          render();
          return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        try {
          const { ok, body } = await apiRequest(`/coordinator/meetings/${id}/status`, {
            method: 'POST',
            body: JSON.stringify({ status: 'completed', minutes, important_decisions }),
          });

          if (ok) {
            await refreshMeetings();
            setBanner('success', 'Meeting marked as completed and notes saved.');
          } else {
            setBanner('error', body.error || body.message || 'Failed to save meeting notes.');
          }
        } catch (err) {
          setBanner('error', err.message || 'Failed to save meeting notes.');
        } finally {
          expandedPendingId = null;
          expandedEditId = null;
          render();
        }
      });
    });

    container.querySelectorAll('.minutes-form-cancel').forEach((btn) => {
      btn.addEventListener('click', () => {
        expandedPendingId = null;
        expandedEditId = null;
        render();
      });
    });
  }

  render();

  return container;
}

export default CoordinatorMeetings;
