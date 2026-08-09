import { renderStudentSidebar } from './StudentSidebar.js';
import { getMeetings } from './mockStore.js';
import '../student.css';

export function StudentMeetings(route, router) {
  renderStudentSidebar();

  const container = document.createElement('div');
  container.className = 'student-portal-container animate-fade-in';

  const meetings = getMeetings();
  let selectedMeetingId = meetings.length > 0 ? meetings[0].id : null;

  function render() {
    const selectedMeeting = meetings.find(m => m.id === selectedMeetingId);

    // August 2026 Calendar calculations
    // Aug 1, 2026 is a Saturday. 31 days.
    const startDayOffset = 6; // 0=Sun, 1=Mon, ..., 6=Sat
    const totalDays = 31;
    const daysArray = [];

    // Empty spots before Aug 1
    for (let i = 0; i < startDayOffset; i++) {
      daysArray.push(null);
    }
    // Days of Aug
    for (let d = 1; d <= totalDays; d++) {
      daysArray.push(d);
    }

    // Build calendar grid HTML
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(h => `
      <div class="student-calendar-day-header">${h}</div>
    `).join('');

    const dayCells = daysArray.map((day, idx) => {
      if (day === null) {
        return `<div class="student-calendar-day" style="background:#fafafb; border-color:transparent;"></div>`;
      }

      // Check if day has meeting (e.g. 5th, 11th)
      const dateStr = `2026-08-${day.toString().padStart(2, '0')}`;
      const dayMeeting = meetings.find(m => m.date === dateStr);
      
      const isToday = day === 9; // Today mockup date
      const isSelected = dayMeeting && dayMeeting.id === selectedMeetingId;
      
      let cellStyle = '';
      if (isToday) cellStyle = 'student-calendar-day-today';
      if (isSelected) cellStyle += ' active-border';

      return `
        <div class="student-calendar-day ${cellStyle} ${dayMeeting ? 'has-meeting' : ''}" data-meet-id="${dayMeeting ? dayMeeting.id : ''}" style="${dayMeeting ? 'cursor:pointer;' : ''}">
          <div class="student-calendar-day-num">${day}</div>
          ${dayMeeting ? `
            <div class="student-calendar-day-dot ${isToday ? 'today' : ''}" title="${dayMeeting.title}"></div>
          ` : ''}
        </div>
      `;
    }).join('');

    // Build meeting list HTML
    const meetingCardsHtml = meetings.map(m => {
      let statusClass = 'student-badge-warning';
      if (m.status === 'Completed') statusClass = 'student-badge-success';
      if (m.status === 'Cancelled') statusClass = 'student-badge-danger';

      return `
        <div class="student-meeting-item ${m.id === selectedMeetingId ? 'active-border' : ''}" data-id="${m.id}">
          <div class="student-meeting-info">
            <div class="student-meeting-title">${m.title}</div>
            <div style="font-size:0.8rem; color:var(--primary); font-weight:600; margin-bottom:4px;">${m.project}</div>
            <div class="student-meeting-meta">
              <span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                ${m.date}
              </span>
              <span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                ${m.time}
              </span>
              <span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                ${m.type}
              </span>
            </div>
          </div>
          <div>
            <span class="student-badge ${statusClass}">${m.status}</span>
          </div>
        </div>
      `;
    }).join('');

    // Build details card HTML
    const detailsHtml = selectedMeeting ? `
      <div class="student-card student-drawer">
        <div class="student-detail-header">
          <h2 style="font-size:1.25rem; font-weight:700; color:var(--text-main); margin-bottom:4px;">${selectedMeeting.title}</h2>
          <span style="font-size:0.85rem; color:var(--primary); font-weight:600;">${selectedMeeting.project}</span>
        </div>

        <div class="student-detail-field">
          <div class="student-detail-label">Schedule Info</div>
          <div class="student-detail-value" style="font-weight:600; color:var(--text-main); margin-top:4px;">
            ${selectedMeeting.date} @ ${selectedMeeting.time} (${selectedMeeting.type})
          </div>
        </div>

        <div class="student-detail-field">
          <div class="student-detail-label">Meeting Type &amp; Status</div>
          <div style="display:flex; gap:8px; margin-top:4px;">
            <span class="student-badge student-badge-info">${selectedMeeting.type}</span>
            <span class="student-badge ${selectedMeeting.status === 'Completed' ? 'student-badge-success' : 'student-badge-warning'}">${selectedMeeting.status}</span>
          </div>
        </div>

        <div class="student-detail-field">
          <div class="student-detail-label">Location / Call Link</div>
          <div class="student-detail-value">
            ${selectedMeeting.location.startsWith('Google Meet:') 
              ? `<a href="https://${selectedMeeting.location.replace('Google Meet: ', '')}" target="_blank" style="color:var(--primary); font-weight:600; text-decoration:underline;">
                   ${selectedMeeting.location}
                 </a>` 
              : selectedMeeting.location
            }
          </div>
        </div>

        <div class="student-detail-field" style="margin-top:20px;">
          <div class="student-detail-label" style="border-bottom:1px solid var(--border-color); padding-bottom:6px; margin-bottom:10px;">
            Meeting Minutes &amp; Notes
          </div>
          <div class="student-detail-value" style="white-space:pre-line; line-height:1.6; font-size:0.9rem; color:var(--text-muted);">
            ${selectedMeeting.notes || 'No meeting notes uploaded.'}
          </div>
        </div>
      </div>
    ` : `
      <div class="student-card" style="display:flex; align-items:center; justify-content:center; min-height:300px; color:var(--text-muted);">
        Select a meeting to view its notes and agendas.
      </div>
    `;

    container.innerHTML = `
      <div class="student-header">
        <h1>Meetings Calendar &amp; Notes</h1>
        <p>Coordinate meeting schedules, review academic standup reports, and fetch meeting notes.</p>
      </div>

      <div class="student-split-pane" style="grid-template-columns: 1.3fr 1fr;">
        <!-- Calendar & List (Left) -->
        <div>
          <!-- Static Calendar Card -->
          <div class="student-card" style="margin-bottom:24px;">
            <div class="student-card-title" style="margin-bottom:12px;">August 2026</div>
            <div class="student-calendar-grid">
              ${dayHeaders}
              ${dayCells}
            </div>
            <div style="display:flex; gap:16px; font-size:0.75rem; color:var(--text-muted);">
              <div style="display:flex; align-items:center; gap:6px;">
                <div class="student-calendar-day-dot" style="align-self:auto;"></div>
                <span>Meeting Scheduled</span>
              </div>
              <div style="display:flex; align-items:center; gap:6px;">
                <div style="width:12px; height:12px; border-radius:3px; background:var(--primary-light); border:1px solid var(--primary-accent);"></div>
                <span>Today (Aug 9)</span>
              </div>
            </div>
          </div>

          <!-- Meeting Cards List -->
          <div>
            ${meetingCardsHtml || '<div class="student-card" style="text-align:center;color:var(--text-muted);">No meetings scheduled.</div>'}
          </div>
        </div>

        <!-- Meeting Details (Right) -->
        <div id="meeting-details-outlet">
          ${detailsHtml}
        </div>
      </div>
    `;

    // Bind list click handlers
    container.querySelectorAll('.student-meeting-item').forEach(el => {
      el.addEventListener('click', () => {
        selectedMeetingId = parseInt(el.getAttribute('data-id'), 10);
        render();
      });
    });

    // Bind calendar day click handlers
    container.querySelectorAll('.student-calendar-day.has-meeting').forEach(el => {
      el.addEventListener('click', () => {
        selectedMeetingId = parseInt(el.getAttribute('data-meet-id'), 10);
        render();
      });
    });
  }

  render();
  return container;
}

export default StudentMeetings;
