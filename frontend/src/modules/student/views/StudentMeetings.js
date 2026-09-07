import { renderStudentSidebar } from './StudentSidebar.js';
import { getMeetings, ensureDataLoaded } from './studentStore.js';
import '../student.css';

export async function StudentMeetings(route, router) {
  await ensureDataLoaded();
  renderStudentSidebar();

  const container = document.createElement('div');
  container.className = 'student-portal-container animate-fade-in';

  const meetings = getMeetings() || [];
  let selectedMeetingId = meetings.length > 0 ? meetings[0].id : null;

  // Real-time up-to-date date tracking
  const now = new Date();
  let currentYear = now.getFullYear();
  let currentMonth = now.getMonth(); // 0=Jan .. 11=Dec

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  function render() {
    const selectedMeeting = meetings.find(m => m.id === selectedMeetingId);

    // Accurate calculation for currentMonth & currentYear
    const startDayOffset = new Date(currentYear, currentMonth, 1).getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysArray = [];

    // Empty spots before the 1st day of month
    for (let i = 0; i < startDayOffset; i++) {
      daysArray.push(null);
    }
    // Days of the month
    for (let d = 1; d <= totalDays; d++) {
      daysArray.push(d);
    }

    // Build calendar grid headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(h => `
      <div class="student-calendar-day-header">${h}</div>
    `).join('');

    // Build calendar cells
    const dayCells = daysArray.map(day => {
      if (day === null) {
        return `<div class="student-calendar-day empty-day"></div>`;
      }

      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayMeeting = meetings.find(m => m.date === dateStr);

      const isToday = (
        currentYear === now.getFullYear() &&
        currentMonth === now.getMonth() &&
        day === now.getDate()
      );
      const isSelected = dayMeeting && dayMeeting.id === selectedMeetingId;

      const cellClasses = ['student-calendar-day'];
      if (isToday) cellClasses.push('student-calendar-day-today');
      if (dayMeeting) cellClasses.push('has-meeting');
      if (isSelected) cellClasses.push('active-selected');

      return `
        <div class="${cellClasses.join(' ')}" data-meet-id="${dayMeeting ? dayMeeting.id : ''}" data-day="${day}" title="${dayMeeting ? dayMeeting.title : (isToday ? 'Today' : '')}">
          <div class="student-calendar-day-num">${day}</div>
          ${dayMeeting ? `
            <div class="student-calendar-day-dot ${isToday ? 'today' : ''}"></div>
          ` : ''}
        </div>
      `;
    }).join('');

    // Build meeting cards list
    const meetingCardsHtml = meetings.map(m => {
      let statusClass = 'student-badge-warning';
      if (m.status === 'Completed') statusClass = 'student-badge-success';
      if (m.status === 'Cancelled') statusClass = 'student-badge-danger';

      return `
        <div class="student-meeting-item ${m.id === selectedMeetingId ? 'active-selected' : ''}" data-id="${m.id}">
          <div class="student-meeting-info">
            <div class="student-meeting-title">${m.title}</div>
            <div style="font-size:0.8rem; color:#059669; font-weight:600; margin-bottom:4px;">${m.project}</div>
            <div class="student-meeting-meta">
              <span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                ${m.date}
              </span>
              <span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                ${m.time}
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
          <h2 style="font-size:1.3rem; font-weight:800; color:#0f172a; margin-bottom:4px; letter-spacing:-0.01em;">${selectedMeeting.title}</h2>
          <span style="font-size:0.85rem; color:#059669; font-weight:700;">${selectedMeeting.project}</span>
        </div>

        <div class="student-detail-field">
          <div class="student-detail-label">Schedule Info</div>
          <div class="student-detail-value" style="font-weight:600; color:#0f172a; margin-top:4px;">
            ${selectedMeeting.date} @ ${selectedMeeting.time}
          </div>
        </div>

        <div class="student-detail-field">
          <div class="student-detail-label">Meeting Status</div>
          <div style="display:flex; gap:8px; margin-top:6px;">
            <span class="student-badge ${selectedMeeting.status === 'Completed' ? 'student-badge-success' : 'student-badge-warning'}">${selectedMeeting.status}</span>
          </div>
        </div>

        <div class="student-detail-field">
          <div class="student-detail-label">Location / Call Link</div>
          <div class="student-detail-value">
            ${selectedMeeting.location.startsWith('Google Meet:') 
              ? `<a href="https://${selectedMeeting.location.replace('Google Meet: ', '')}" target="_blank" style="color:#059669; font-weight:600; text-decoration:underline;">
                   ${selectedMeeting.location}
                 </a>` 
              : selectedMeeting.location
            }
          </div>
        </div>

        <div class="student-detail-field" style="margin-top:20px;">
          <div class="student-detail-label" style="border-bottom:1px solid #e2e8f0; padding-bottom:6px; margin-bottom:10px;">
            Meeting Minutes &amp; Notes
          </div>
          <div class="student-detail-value" style="white-space:pre-line; line-height:1.6; font-size:0.925rem; color:#475569;">
            ${selectedMeeting.notes || 'No meeting notes uploaded.'}
          </div>
        </div>
      </div>
    ` : `
      <div class="student-card" style="display:flex; align-items:center; justify-content:center; min-height:300px; color:#64748b;">
        Select a meeting to view its notes and agendas.
      </div>
    `;

    const formattedToday = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    container.innerHTML = `
      <div class="student-header">
        <h1>Meetings Calendar &amp; Notes</h1>
        <p>Coordinate meeting schedules, review academic standup reports, and fetch meeting notes.</p>
      </div>

      <div class="student-split-pane" style="grid-template-columns: 1.15fr 1fr; gap: 24px;">
        <!-- Calendar & List (Left) -->
        <div>
          <!-- Compact Modern Calendar Card -->
          <div class="student-card student-calendar-card">
            <div class="student-calendar-header">
              <span class="student-calendar-title">${monthNames[currentMonth]} ${currentYear}</span>
              <div class="student-calendar-nav">
                <button type="button" class="student-btn-cal-nav" id="btn-prev-month" title="Previous Month">‹</button>
                <button type="button" class="student-btn-cal-nav" id="btn-today-month" title="Go to Current Month">Today</button>
                <button type="button" class="student-btn-cal-nav" id="btn-next-month" title="Next Month">›</button>
              </div>
            </div>
            
            <div class="student-calendar-grid">
              ${dayHeaders}
              ${dayCells}
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:#64748b; margin-top:8px; border-top:1px solid #f1f5f9; padding-top:8px;">
              <div style="display:flex; align-items:center; gap:6px;">
                <div class="student-calendar-day-dot" style="margin:0;"></div>
                <span>Meeting Scheduled</span>
              </div>
              <div style="display:flex; align-items:center; gap:6px;">
                <div style="width:10px; height:10px; border-radius:3px; background:#ecfdf5; border:1px solid #059669;"></div>
                <span>Today (${formattedToday})</span>
              </div>
            </div>
          </div>

          <!-- Meeting Cards List -->
          <div>
            ${meetingCardsHtml || '<div class="student-card" style="text-align:center;color:#64748b;">No meetings scheduled.</div>'}
          </div>
        </div>

        <!-- Meeting Details (Right) -->
        <div id="meeting-details-outlet">
          ${detailsHtml}
        </div>
      </div>
    `;

    // Bind month navigation
    container.querySelector('#btn-prev-month')?.addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      render();
    });

    container.querySelector('#btn-next-month')?.addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      render();
    });

    container.querySelector('#btn-today-month')?.addEventListener('click', () => {
      currentYear = now.getFullYear();
      currentMonth = now.getMonth();
      render();
    });

    // Bind meeting card clicks
    container.querySelectorAll('.student-meeting-item').forEach(el => {
      el.addEventListener('click', () => {
        selectedMeetingId = parseInt(el.getAttribute('data-id'), 10);
        const m = meetings.find(item => item.id === selectedMeetingId);
        if (m && m.date) {
          const parts = m.date.split('-');
          if (parts.length === 3) {
            currentYear = parseInt(parts[0], 10);
            currentMonth = parseInt(parts[1], 10) - 1;
          }
        }
        render();
      });
    });

    // Bind calendar day click
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
