import { renderStudentSidebar } from './StudentSidebar.js';
import { getMeetings, getProjects, ensureDataLoaded } from './studentStore.js';
import { StudentSwal, showStudentSuccess, showStudentWarning } from '../studentAlerts.js';
import '../student.css';

export async function StudentMeetings(route, router) {
  await ensureDataLoaded();
  renderStudentSidebar();

  const container = document.createElement('div');
  container.className = 'student-portal-container animate-fade-in';

  const meetings = getMeetings() || [];
  const projects = getProjects() || [];
  let selectedMeetingId = meetings.length > 0 ? meetings[0].id : null;

  // Filter & Search State
  let searchQuery = '';
  let statusFilter = 'all'; // 'all' | 'Scheduled' | 'Completed'
  let projectFilter = 'all';
  let dateFilter = null; // 'YYYY-MM-DD' or null

  // Real-time date tracking for calendar
  const now = new Date();
  let currentYear = now.getFullYear();
  let currentMonth = now.getMonth(); // 0=Jan .. 11=Dec

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  function render() {
    // 1. Filter meetings
    const filteredMeetings = meetings.filter(m => {
      // Status filter
      if (statusFilter !== 'all' && (m.status || '').toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      // Project filter
      if (projectFilter !== 'all' && m.project !== projectFilter) {
        return false;
      }
      // Date filter from calendar click
      if (dateFilter && m.date !== dateFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const mTitle = (m.title || '').toLowerCase().includes(q);
        const mProj = (m.project || '').toLowerCase().includes(q);
        const mNotes = (m.notes || '').toLowerCase().includes(q);
        const mLoc = (m.location || '').toLowerCase().includes(q);
        if (!mTitle && !mProj && !mNotes && !mLoc) return false;
      }
      return true;
    });

    // Make sure selected meeting exists in filtered list, otherwise select first available
    if (!filteredMeetings.some(m => m.id === selectedMeetingId) && filteredMeetings.length > 0) {
      selectedMeetingId = filteredMeetings[0].id;
    }

    const selectedMeeting = meetings.find(m => m.id === selectedMeetingId);

    // 2. Calendar Grid Calculation
    const startDayOffset = new Date(currentYear, currentMonth, 1).getDay(); // 0=Sun .. 6=Sat
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysArray = [];

    for (let i = 0; i < startDayOffset; i++) {
      daysArray.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      daysArray.push(d);
    }

    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(h => `
      <div class="student-calendar-day-header">${h}</div>
    `).join('');

    const dayCells = daysArray.map(day => {
      if (day === null) {
        return `<div class="student-calendar-day empty-day"></div>`;
      }

      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayMeetings = meetings.filter(m => m.date === dateStr);
      const hasMeeting = dayMeetings.length > 0;

      const isToday = (
        currentYear === now.getFullYear() &&
        currentMonth === now.getMonth() &&
        day === now.getDate()
      );
      const isDateFiltered = dateFilter === dateStr;

      const cellClasses = ['student-calendar-day'];
      if (isToday) cellClasses.push('student-calendar-day-today');
      if (hasMeeting) cellClasses.push('has-meeting');
      if (isDateFiltered) cellClasses.push('active-selected');

      return `
        <div class="${cellClasses.join(' ')}" data-date="${dateStr}" data-day="${day}" title="${hasMeeting ? `${dayMeetings.length} session(s) on ${dateStr}` : (isToday ? 'Today' : '')}">
          <div class="student-calendar-day-num">${day}</div>
          ${hasMeeting ? `
            <div class="student-calendar-day-dot ${isToday ? 'today' : ''}"></div>
          ` : ''}
        </div>
      `;
    }).join('');

    // 3. Project Filter Options
    const projectFilterOptions = projects.map(p => `
      <option value="${p.title}" ${projectFilter === p.title ? 'selected' : ''}>${p.title}</option>
    `).join('');

    const isFiltersActive = searchQuery.trim() !== '' || statusFilter !== 'all' || projectFilter !== 'all' || dateFilter !== null;

    // 4. Meeting Cards List HTML
    const meetingCardsHtml = filteredMeetings.map(m => {
      const isSelected = m.id === selectedMeetingId;
      const isCompleted = (m.status || '').toLowerCase() === 'completed';
      const statusClass = isCompleted ? 'student-badge-success' : 'student-badge-warning';

      return `
        <div class="student-meeting-item ${isSelected ? 'active-selected' : ''}" data-id="${m.id}">
          <div class="student-meeting-info">
            <div style="font-size:0.75rem; color:#059669; font-weight:700; text-transform:uppercase; letter-spacing:0.03em;">
              ${m.project}
            </div>
            <div class="student-meeting-title" style="font-size:0.95rem; margin-top:2px;">
              ${m.title}
            </div>
            <div class="student-meeting-meta" style="margin-top:6px; font-size:0.78rem;">
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
            <span class="student-badge ${statusClass}" style="font-size:0.7rem;">${m.status}</span>
          </div>
        </div>
      `;
    }).join('');

    // 5. Selected Meeting Workspace Details
    let detailsHtml = '';
    if (selectedMeeting) {
      const isCompleted = (selectedMeeting.status || '').toLowerCase() === 'completed';
      const statusBadge = isCompleted ? 'student-badge-success' : 'student-badge-warning';
      const isGoogleMeet = selectedMeeting.location && selectedMeeting.location.toLowerCase().includes('google meet');
      const meetRawUrl = isGoogleMeet ? selectedMeeting.location.replace(/^Google Meet:\s*/i, '').trim() : '';
      const meetHref = meetRawUrl.startsWith('http') ? meetRawUrl : `https://${meetRawUrl}`;

      detailsHtml = `
        <!-- Main Details Card -->
        <div class="student-card" style="padding: 28px;">
          <!-- Top Row Badges -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="student-badge student-badge-info" style="font-size: 0.8rem; font-weight: 700;">
                ${selectedMeeting.project}
              </span>
              <span class="student-badge ${statusBadge}" style="font-size: 0.8rem; font-weight: 700;">
                ${selectedMeeting.status}
              </span>
            </div>
          </div>

          <!-- Meeting Title -->
          <h2 style="font-size: 1.45rem; font-weight: 800; color: #0f172a; margin-bottom: 14px; letter-spacing: -0.02em;">
            ${selectedMeeting.title}
          </h2>

          <!-- Meta Strip -->
          <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; padding-bottom: 18px; border-bottom: 1px solid #e2e8f0; font-size: 0.88rem; color: #475569;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>Date: <strong style="color: #0f172a;">${selectedMeeting.date}</strong></span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>Time: <strong style="color: #0f172a;">${selectedMeeting.time}</strong></span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>Supervisor: <strong style="color: #0f172a;">Faculty Supervisor</strong></span>
            </div>
          </div>

          <!-- Video Conference Action Banner (If Online Google Meet) -->
          ${isGoogleMeet ? `
            <div class="student-meet-banner">
              <div class="student-meet-banner-info">
                <div class="student-meet-banner-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M23 7l-7 5 7 5V7z"></path>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                  </svg>
                </div>
                <div>
                  <div style="font-weight: 800; font-size: 1.05rem;">Google Meet Video Conference</div>
                  <div style="font-size: 0.8rem; opacity: 0.9; margin-top: 2px;">
                    Online Standup &amp; Evaluation Link: <code>${meetRawUrl}</code>
                  </div>
                </div>
              </div>
              <div style="display: flex; gap: 10px; align-items: center;">
                <button type="button" class="student-meet-copy-btn btn-copy-meet-link" data-url="${meetHref}" title="Copy Google Meet Link">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  Copy Link
                </button>
                <a href="${meetHref}" target="_blank" rel="noopener noreferrer" class="student-meet-banner-btn student-meet-link" data-title="${selectedMeeting.title}">
                  <span>Join Video Call</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
              </div>
            </div>
          ` : `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <div>
                <div style="font-weight: 700; font-size: 0.925rem; color: #0f172a;">Location &amp; Venue</div>
                <div style="font-size: 0.825rem; color: #64748b; margin-top: 2px;">${selectedMeeting.location || 'In-Person Academy Conference Room'}</div>
              </div>
            </div>
          `}

          <!-- Notes & Minutes Section -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <div style="font-weight: 700; font-size: 1rem; color: #0f172a; display: flex; align-items: center; gap: 8px;">
                <span>📝</span> Meeting Minutes &amp; Discussion Notes
              </div>
              <span class="student-badge student-badge-info" style="font-size: 0.72rem;">Official Record</span>
            </div>
            
            <div class="student-meet-notes-content">
              ${selectedMeeting.notes || 'No minutes or discussion notes have been recorded for this session yet. Your faculty supervisor will document agenda points during the meeting.'}
            </div>
          </div>
        </div>
      `;
    } else {
      detailsHtml = `
        <div class="student-card" style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:380px; color:#64748b; text-align:center; padding:40px 20px;">
          <div style="font-size: 2.5rem; margin-bottom: 12px;">📅</div>
          <div style="font-weight: 700; font-size: 1.05rem; color: #1e293b; margin-bottom: 6px;">No Session Selected</div>
          <div style="font-size: 0.85rem; color: #94a3b8; max-width: 320px;">
            Choose a date from the calendar or click a scheduled meeting from the list to inspect its agenda, call link, and discussion minutes.
          </div>
        </div>
      `;
    }

    const formattedToday = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // 6. Build Master Container HTML
    container.innerHTML = `
      <div class="student-header">
        <h1>Meetings Calendar &amp; Notes</h1>
        <p>Coordinate meeting schedules, review academic standup reports, and access supervisor discussion minutes.</p>
      </div>

      <!-- Controls & Filter Bar -->
      <div class="student-filter-bar">
        <!-- Search -->
        <div class="student-search-wrapper">
          <svg class="student-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" id="meet-search-input" class="student-search-input" placeholder="Search meetings by topic, project, or notes..." value="${searchQuery}">
        </div>

        <!-- Status Filter Pills -->
        <div class="student-filter-pills">
          <button type="button" class="student-filter-pill ${statusFilter === 'all' ? 'active' : ''}" data-status="all">All Sessions</button>
          <button type="button" class="student-filter-pill ${statusFilter === 'Scheduled' ? 'active' : ''}" data-status="Scheduled">Upcoming</button>
          <button type="button" class="student-filter-pill ${statusFilter === 'Completed' ? 'active' : ''}" data-status="Completed">Completed</button>
        </div>

        <!-- Project Filter Dropdown -->
        <select id="meet-proj-filter" class="student-filter-select">
          <option value="all" ${projectFilter === 'all' ? 'selected' : ''}>All Projects</option>
          ${projectFilterOptions}
        </select>

        <!-- Date Filter Badge or Reset Button -->
        ${isFiltersActive ? `
          <button type="button" id="btn-clear-meet-filters" class="student-filter-btn-clear" title="Clear all filters">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            ${dateFilter ? `Reset Date (${dateFilter})` : 'Reset Filters'}
          </button>
        ` : ''}
      </div>

      <!-- Modern Responsive 2-Column Split Layout -->
      <div class="student-meetings-layout">
        <!-- Left Panel: Calendar & Meetings List -->
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <!-- Interactive Monthly Calendar Card -->
          <div class="student-card student-calendar-card" style="margin-bottom: 0; max-width: 100%;">
            <div class="student-calendar-header">
              <span class="student-calendar-title">${monthNames[currentMonth]} ${currentYear}</span>
              <div class="student-calendar-nav">
                <button type="button" class="student-btn-cal-nav" id="btn-prev-month" title="Previous Month">‹</button>
                <button type="button" class="student-btn-cal-nav" id="btn-today-month" title="Jump to Current Month">Today</button>
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
                <span>Session Scheduled</span>
              </div>
              <div style="display:flex; align-items:center; gap:6px;">
                <div style="width:10px; height:10px; border-radius:3px; background:#ecfdf5; border:1px solid #059669;"></div>
                <span>Today (${formattedToday})</span>
              </div>
            </div>
          </div>

          <!-- Scheduled Sessions List Card -->
          <div class="student-card" style="padding: 18px 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <div style="font-weight: 700; font-size: 0.95rem; color: #0f172a;">
                Scheduled Sessions
              </div>
              <span class="student-badge student-badge-info" style="font-size: 0.72rem;">
                ${filteredMeetings.length} found
              </span>
            </div>

            ${dateFilter ? `
              <div style="display: flex; justify-content: space-between; align-items: center; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 6px 12px; border-radius: 8px; margin-bottom: 12px; font-size: 0.8rem; color: #065f46;">
                <span>Filtered on: <strong>${dateFilter}</strong></span>
                <button type="button" id="btn-remove-date-filter" style="background: none; border: none; color: #047857; font-weight: 700; cursor: pointer; font-size: 0.75rem;">Show All</button>
              </div>
            ` : ''}

            <!-- Meeting Cards List -->
            <div style="max-height: 400px; overflow-y: auto; padding-right: 2px;">
              ${meetingCardsHtml || `
                <div class="student-empty-filter" style="padding: 24px 10px;">
                  <div class="student-empty-filter-icon" style="font-size: 1.5rem;">📅</div>
                  <div class="student-empty-filter-text" style="font-size: 0.875rem;">No sessions matching</div>
                  <div class="student-empty-filter-sub" style="font-size: 0.75rem; margin-bottom: 8px;">Try clearing filters.</div>
                  <button type="button" id="btn-empty-clear-meets" class="student-btn student-btn-outline student-btn-sm" style="font-size: 0.75rem; padding: 4px 10px; margin: 0 auto;">
                    Reset Filters
                  </button>
                </div>
              `}
            </div>
          </div>
        </div>

        <!-- Right Panel: Meeting Hub & Notes Workspace -->
        <div id="meeting-details-outlet">
          ${detailsHtml}
        </div>
      </div>
    `;

    // -------------------------------------------------------------
    // EVENT BINDINGS
    // -------------------------------------------------------------

    // Search input handler
    const searchInput = container.querySelector('#meet-search-input');
    searchInput?.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      render();
      const newInput = container.querySelector('#meet-search-input');
      if (newInput) {
        newInput.focus();
        newInput.setSelectionRange(newInput.value.length, newInput.value.length);
      }
    });

    // Status filter pills
    container.querySelectorAll('.student-filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        statusFilter = pill.getAttribute('data-status');
        render();
      });
    });

    // Project select filter
    container.querySelector('#meet-proj-filter')?.addEventListener('change', (e) => {
      projectFilter = e.target.value;
      render();
    });

    // Clear filters handler
    const handleClearAll = () => {
      searchQuery = '';
      statusFilter = 'all';
      projectFilter = 'all';
      dateFilter = null;
      render();
    };
    container.querySelector('#btn-clear-meet-filters')?.addEventListener('click', handleClearAll);
    container.querySelector('#btn-remove-date-filter')?.addEventListener('click', () => {
      dateFilter = null;
      render();
    });
    container.querySelector('#btn-empty-clear-meets')?.addEventListener('click', handleClearAll);

    // Month Navigation
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

    // Calendar Day click (filter by date or toggle date filter)
    container.querySelectorAll('.student-calendar-day[data-date]').forEach(el => {
      el.addEventListener('click', () => {
        const clickedDate = el.getAttribute('data-date');
        if (dateFilter === clickedDate) {
          dateFilter = null; // toggle off
        } else {
          dateFilter = clickedDate;
        }
        render();
      });
    });

    // Meeting Card click in list
    container.querySelectorAll('.student-meeting-item').forEach(el => {
      el.addEventListener('click', () => {
        selectedMeetingId = parseInt(el.getAttribute('data-id'), 10);
        render();
      });
    });

    // Copy Google Meet link button
    container.querySelectorAll('.btn-copy-meet-link').forEach(btn => {
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
            title: 'Meeting Link Copied!',
            text: 'Google Meet URL copied to clipboard.',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
          });
        } catch (err) {
          showStudentSuccess('Link Copied', url);
        }
      });
    });

    // Google Meet Call Link with SweetAlert Confirmation
    container.querySelectorAll('.student-meet-link').forEach(link => {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        const targetUrl = link.getAttribute('href');
        const meetTitle = link.getAttribute('data-title') || 'this meeting';

        const result = await StudentSwal.fire({
          title: 'Join Video Conference?',
          text: `You are about to launch Google Meet for "${meetTitle}".`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Join Call',
          cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed && targetUrl) {
          window.open(targetUrl, '_blank');
        }
      });
    });
  }

  render();
  return container;
}

export default StudentMeetings;
