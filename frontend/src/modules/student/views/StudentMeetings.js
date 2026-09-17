import { renderStudentSidebar } from './StudentSidebar.js';
import { getMeetings, getProjects, ensureDataLoaded } from './studentStore.js';
import { StudentSwal, showStudentSuccess, showStudentWarning } from '../studentAlerts.js';
import '../student.css';

export async function StudentMeetings(route, router) {
  await ensureDataLoaded();
  renderStudentSidebar();

  const container = document.createElement('div');
  container.className = 'student-portal-container animate-fade-in student-meetings-view';

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
    // 1. Calculate KPI Metrics
    const totalCount = meetings.length;
    const upcomingCount = meetings.filter(m => (m.status || '').toLowerCase() === 'scheduled').length;
    const completedCount = meetings.filter(m => (m.status || '').toLowerCase() === 'completed').length;
    
    // Find next upcoming meeting
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const futureUpcoming = meetings
      .filter(m => (m.status || '').toLowerCase() === 'scheduled' && (m.date || '') >= todayStr)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const nextMeetingDate = futureUpcoming.length > 0 ? futureUpcoming[0].date : (upcomingCount > 0 ? 'Upcoming' : 'None');

    // 2. Filter meetings
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

    // 3. Calendar Grid Calculation
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
      <div class="student-cal-day-header">${h}</div>
    `).join('');

    const dayCells = daysArray.map(day => {
      if (day === null) {
        return `<div class="student-cal-day-cell empty"></div>`;
      }

      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayMeetings = meetings.filter(m => m.date === dateStr);
      const hasMeeting = dayMeetings.length > 0;
      const hasScheduled = dayMeetings.some(m => (m.status || '').toLowerCase() === 'scheduled');
      const hasCompleted = dayMeetings.some(m => (m.status || '').toLowerCase() === 'completed');

      const isToday = (
        currentYear === now.getFullYear() &&
        currentMonth === now.getMonth() &&
        day === now.getDate()
      );
      const isDateFiltered = dateFilter === dateStr;

      const cellClasses = ['student-cal-day-cell'];
      if (isToday) cellClasses.push('today');
      if (isDateFiltered) cellClasses.push('active-selected');

      return `
        <div class="${cellClasses.join(' ')}" data-date="${dateStr}" data-day="${day}" title="${hasMeeting ? `${dayMeetings.length} session(s) on ${dateStr}` : (isToday ? 'Today' : '')}">
          <span>${day}</span>
          ${hasMeeting ? `
            <div class="student-cal-dots-wrap">
              ${hasScheduled ? '<div class="student-cal-dot" title="Upcoming session"></div>' : ''}
              ${hasCompleted ? '<div class="student-cal-dot completed" title="Completed session"></div>' : ''}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    // 4. Project Filter Options
    const projectFilterOptions = projects.map(p => `
      <option value="${p.title}" ${projectFilter === p.title ? 'selected' : ''}>${p.title}</option>
    `).join('');

    const isFiltersActive = searchQuery.trim() !== '' || statusFilter !== 'all' || projectFilter !== 'all' || dateFilter !== null;

    // 5. Meeting Cards List HTML
    const meetingCardsHtml = filteredMeetings.map(m => {
      const isSelected = m.id === selectedMeetingId;
      const isCompleted = (m.status || '').toLowerCase() === 'completed';
      const isGoogleMeet = m.location && m.location.toLowerCase().includes('google meet');
      const cardTypeClass = isCompleted ? 'completed' : 'upcoming';

      return `
        <div class="student-meet-item ${cardTypeClass} ${isSelected ? 'active-selected' : ''}" data-id="${m.id}">
          <div class="student-meet-item-body">
            <div class="student-meet-item-proj">
              ${m.project}
            </div>
            <div class="student-meet-item-title">
              ${m.title}
            </div>
            <div class="student-meet-item-meta">
              <span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                ${m.date}
              </span>
              <span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                ${m.time}
              </span>
              <span>
                ${isGoogleMeet ? `
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                  Meet Call
                ` : `
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  In-Person
                `}
              </span>
            </div>
          </div>
          <div>
            ${isCompleted ? `
              <span class="student-meet-status-badge completed">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Completed
              </span>
            ` : `
              <span class="student-meet-status-badge scheduled">
                <span class="student-meet-pulse-dot"></span>
                Scheduled
              </span>
            `}
          </div>
        </div>
      `;
    }).join('');

    // 6. Selected Meeting Workspace Details
    let detailsHtml = '';
    if (selectedMeeting) {
      const isCompleted = (selectedMeeting.status || '').toLowerCase() === 'completed';
      const isGoogleMeet = selectedMeeting.location && selectedMeeting.location.toLowerCase().includes('google meet');
      const meetRawUrl = isGoogleMeet ? selectedMeeting.location.replace(/^Google Meet:\s*/i, '').trim() : '';
      const meetHref = meetRawUrl.startsWith('http') ? meetRawUrl : `https://${meetRawUrl}`;

      // Format clean date string (e.g. "Thursday, Sep 17, 2026")
      let fullDateStr = selectedMeeting.date;
      try {
        const dObj = new Date(selectedMeeting.date + 'T00:00:00');
        if (!isNaN(dObj.getTime())) {
          fullDateStr = dObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
        }
      } catch (e) {}

      detailsHtml = `
        <div class="student-meet-detail-card">
          <!-- Top Row Badges & Title -->
          <div>
            <div class="student-meet-detail-header">
              <div class="student-meet-detail-badges">
                <span class="student-badge student-badge-info" style="font-weight: 800; font-size: 0.8rem;">
                  ${selectedMeeting.project}
                </span>
                ${isCompleted ? `
                  <span class="student-meet-status-badge completed">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Completed Review
                  </span>
                ` : `
                  <span class="student-meet-status-badge scheduled">
                    <span class="student-meet-pulse-dot"></span>
                    Scheduled Session
                  </span>
                `}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">
                ID: #${selectedMeeting.id}
              </div>
            </div>

            <h2 class="student-meet-detail-title">
              ${selectedMeeting.title}
            </h2>
          </div>

          <!-- 3-Column Meta Information Grid -->
          <div class="student-meet-meta-grid">
            <div class="student-meet-meta-box">
              <div class="student-meet-meta-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </div>
              <div class="student-meet-meta-info">
                <span class="student-meet-meta-label">Date</span>
                <span class="student-meet-meta-val">${fullDateStr}</span>
              </div>
            </div>

            <div class="student-meet-meta-box">
              <div class="student-meet-meta-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <div class="student-meet-meta-info">
                <span class="student-meet-meta-label">Time</span>
                <span class="student-meet-meta-val">${selectedMeeting.time} (IST)</span>
              </div>
            </div>

            <div class="student-meet-meta-box">
              <div class="student-meet-meta-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              <div class="student-meet-meta-info">
                <span class="student-meet-meta-label">Supervisor</span>
                <span class="student-meet-meta-val">Faculty Reviewer</span>
              </div>
            </div>
          </div>

          <!-- Video Conference Action Banner (If Online Google Meet) -->
          ${isGoogleMeet ? `
            <div class="student-meet-call-banner">
              <div class="student-meet-call-info">
                <div class="student-meet-call-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="23 7 16 12 23 17 23 7"></polygon>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                  </svg>
                </div>
                <div>
                  <h4 class="student-meet-call-title">Google Meet Video Conference</h4>
                  <div class="student-meet-call-sub">${meetRawUrl}</div>
                </div>
              </div>
              <div class="student-meet-call-actions">
                <button type="button" class="student-meet-btn-copy btn-copy-meet-link" data-url="${meetHref}" title="Copy Google Meet Link">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  Copy Link
                </button>
                <a href="${meetHref}" target="_blank" rel="noopener noreferrer" class="student-meet-btn-join student-meet-link" data-title="${selectedMeeting.title}">
                  <span>Join Video Call</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
              </div>
            </div>
          ` : `
            <div class="student-meet-venue-card">
              <div class="student-meet-venue-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
              <div>
                <div class="student-meet-venue-title">Location &amp; In-Person Venue</div>
                <div class="student-meet-venue-desc">${selectedMeeting.location || 'In-Person Academy Conference Room / Lab Facility'}</div>
              </div>
            </div>
          `}

          <!-- Notes & Minutes Section -->
          <div class="student-meet-notes-section">
            <div class="student-meet-notes-header">
              <div class="student-meet-notes-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                Meeting Minutes &amp; Discussion Notes
              </div>
              <div style="display: flex; gap: 8px; align-items: center;">
                ${selectedMeeting.notes ? `
                  <button type="button" class="student-btn student-btn-outline student-btn-sm btn-copy-notes" data-notes="${encodeURIComponent(selectedMeeting.notes)}" style="padding: 4px 10px; font-size: 0.75rem; display: flex; align-items: center; gap: 4px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    Copy Notes
                  </button>
                ` : ''}
                <span class="student-badge student-badge-info" style="font-size: 0.72rem;">Official Record</span>
              </div>
            </div>
            
            <div class="student-meet-notes-body ${!selectedMeeting.notes ? 'student-meet-notes-empty' : ''}">
              ${selectedMeeting.notes || 'No minutes or discussion notes have been recorded for this session yet. Your faculty supervisor will document agenda points, action items, and technical feedback during or after the meeting.'}
            </div>
          </div>
        </div>
      `;
    } else {
      detailsHtml = `
        <div class="student-meet-empty-detail">
          <div class="student-meet-empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <div class="student-meet-empty-title">No Session Selected</div>
          <div class="student-meet-empty-desc">
            Choose a date from the calendar or select a scheduled meeting from the sessions list to view its agenda, supervisor, call link, and discussion minutes.
          </div>
        </div>
      `;
    }

    const formattedToday = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // 7. Master Container Markup
    container.innerHTML = `
      <!-- Header Banner -->
      <div class="student-meet-header-wrapper">
        <div class="student-meet-header-left">
          <div class="student-meet-brand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div>
            <h1 class="student-meet-title">Meetings Calendar &amp; Notes</h1>
            <p class="student-meet-subtitle">Coordinate project standups, track scheduled reviews, and access supervisor discussion minutes.</p>
          </div>
        </div>
      </div>

      <!-- KPI Metrics Overview -->
      <div class="student-meet-kpi-grid">
        <div class="student-meet-kpi-card kpi-blue">
          <div class="student-meet-kpi-icon blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <div class="student-meet-kpi-info">
            <div class="student-meet-kpi-val">${totalCount}</div>
            <div class="student-meet-kpi-lbl">Total Sessions</div>
          </div>
        </div>

        <div class="student-meet-kpi-card kpi-indigo">
          <div class="student-meet-kpi-icon indigo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div class="student-meet-kpi-info">
            <div class="student-meet-kpi-val">${upcomingCount}</div>
            <div class="student-meet-kpi-lbl">Upcoming Sessions</div>
          </div>
        </div>

        <div class="student-meet-kpi-card kpi-emerald">
          <div class="student-meet-kpi-icon emerald">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div class="student-meet-kpi-info">
            <div class="student-meet-kpi-val">${completedCount}</div>
            <div class="student-meet-kpi-lbl">Completed Reviews</div>
          </div>
        </div>

        <div class="student-meet-kpi-card kpi-amber">
          <div class="student-meet-kpi-icon amber">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          </div>
          <div class="student-meet-kpi-info">
            <div class="student-meet-kpi-val" style="font-size: 1.15rem;">${nextMeetingDate}</div>
            <div class="student-meet-kpi-lbl">Next Agenda</div>
          </div>
        </div>
      </div>

      <!-- Controls & Comprehensive Filter Bar -->
      <div class="student-meet-filter-bar">
        <!-- Search Input -->
        <div class="student-meet-search-box">
          <svg class="student-meet-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" id="meet-search-input" class="student-meet-search-input" placeholder="Search by topic, project, location, or notes..." value="${searchQuery}">
        </div>

        <!-- Status Filter Pills -->
        <div class="student-meet-pills-group">
          <button type="button" class="student-meet-pill-btn ${statusFilter === 'all' ? 'active' : ''}" data-status="all">
            <span>All Sessions</span>
            <span class="student-meet-pill-badge">${totalCount}</span>
          </button>
          <button type="button" class="student-meet-pill-btn ${statusFilter === 'Scheduled' ? 'active' : ''}" data-status="Scheduled">
            <span>Upcoming</span>
            <span class="student-meet-pill-badge">${upcomingCount}</span>
          </button>
          <button type="button" class="student-meet-pill-btn ${statusFilter === 'Completed' ? 'active' : ''}" data-status="Completed">
            <span>Completed</span>
            <span class="student-meet-pill-badge">${completedCount}</span>
          </button>
        </div>

        <!-- Project Filter Dropdown -->
        <select id="meet-proj-filter" class="student-meet-select">
          <option value="all" ${projectFilter === 'all' ? 'selected' : ''}>All Projects</option>
          ${projectFilterOptions}
        </select>

        <!-- Date Filter Badge or Reset Button -->
        ${isFiltersActive ? `
          <button type="button" id="btn-clear-meet-filters" class="student-meet-btn-reset" title="Clear all filters">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            ${dateFilter ? `Reset Date (${dateFilter})` : 'Reset Filters'}
          </button>
        ` : ''}
      </div>

      <!-- Modern Responsive 2-Column Split Layout -->
      <div class="student-meet-grid-layout">
        <!-- Left Panel: Calendar & Meetings List -->
        <div class="student-meet-sidebar-col">
          <!-- Interactive Monthly Calendar Card -->
          <div class="student-cal-card">
            <div class="student-cal-header">
              <span class="student-cal-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                ${monthNames[currentMonth]} ${currentYear}
              </span>
              <div class="student-cal-nav">
                <button type="button" class="student-cal-btn-nav" id="btn-prev-month" title="Previous Month">‹</button>
                <button type="button" class="student-cal-btn-today" id="btn-today-month" title="Jump to Current Month">Today</button>
                <button type="button" class="student-cal-btn-nav" id="btn-next-month" title="Next Month">›</button>
              </div>
            </div>
            
            <div class="student-cal-grid">
              ${dayHeaders}
              ${dayCells}
            </div>

            <div class="student-cal-legend">
              <div class="student-cal-legend-item">
                <div class="student-cal-dot"></div>
                <span>Upcoming</span>
              </div>
              <div class="student-cal-legend-item">
                <div class="student-cal-dot completed"></div>
                <span>Completed</span>
              </div>
              <div class="student-cal-legend-item">
                <div style="width:9px; height:9px; border-radius:3px; background:#f0f9ff; border:1px solid #0284c7;"></div>
                <span>Today (${formattedToday})</span>
              </div>
            </div>
          </div>

          <!-- Scheduled Sessions List Card -->
          <div class="student-meet-list-card">
            <div class="student-meet-list-header">
              <div class="student-meet-list-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                Sessions Queue
              </div>
              <span class="student-badge student-badge-info" style="font-size: 0.72rem; font-weight: 800;">
                ${filteredMeetings.length} found
              </span>
            </div>

            ${dateFilter ? `
              <div class="student-meet-active-tag">
                <span>Date Filter: <strong>${dateFilter}</strong></span>
                <button type="button" id="btn-remove-date-filter" style="background: none; border: none; color: #0369a1; font-weight: 800; cursor: pointer; font-size: 0.75rem;">Clear</button>
              </div>
            ` : ''}

            <!-- Meeting Cards List -->
            <div class="student-meet-list-scroll">
              ${meetingCardsHtml || `
                <div style="text-align: center; padding: 32px 14px; background: var(--bg-canvas-light); border: 1px dashed var(--border-subtle); border-radius: 12px;">
                  <div style="font-size: 1.6rem; margin-bottom: 6px;">📅</div>
                  <div style="font-weight: 700; font-size: 0.9rem; color: var(--text-primary); margin-bottom: 4px;">No Sessions Found</div>
                  <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 10px;">Try adjusting or clearing your filters.</div>
                  <button type="button" id="btn-empty-clear-meets" class="student-btn student-btn-outline student-btn-sm" style="font-size: 0.75rem; padding: 4px 12px; margin: 0 auto;">
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
    container.querySelectorAll('.student-meet-pill-btn').forEach(pill => {
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
    container.querySelectorAll('.student-cal-day-cell[data-date]').forEach(el => {
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
    container.querySelectorAll('.student-meet-item').forEach(el => {
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

    // Copy Meeting Notes button
    container.querySelectorAll('.btn-copy-notes').forEach(btn => {
      btn.addEventListener('click', async () => {
        const rawNotes = decodeURIComponent(btn.getAttribute('data-notes') || '');
        if (!rawNotes) return;
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(rawNotes);
          }
          StudentSwal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Notes Copied!',
            text: 'Meeting minutes copied to clipboard.',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
          });
        } catch (err) {
          showStudentSuccess('Notes Copied', 'Meeting minutes copied to clipboard.');
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
