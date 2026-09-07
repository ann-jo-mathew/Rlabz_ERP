import '../faculty.css';
import { showFacultySuccessPopup } from '../facultyPopup.js';

export function FacultyMeetings() {
    const container = document.createElement('div');
    container.className = 'faculty-meetings';

    let storedUser = null;
    try {
        storedUser = JSON.parse(localStorage.getItem('user'));
    } catch (e) {
        storedUser = null;
    }

    const token = localStorage.getItem('token');
    const apiBase = window.location.port === '8000' ? '/api' : 'http://127.0.0.1:8000/api';

    // State
    let activeTab = 'schedule'; // 'schedule' | 'past'
    let assignedProjects = [];
    let meetings = [];
    let isLoadingProjects = true;
    let isLoadingMeetings = true;

    // Track which meeting currently has the inline "Enter Minutes" form expanded
    let expandedMeetingId = null;

    const todayStr = new Date().toISOString().split('T')[0];

    function renderUI() {
        const now = new Date();

        // Filter past meetings whose scheduled_at date is past AND whose minutes & decisions are NOT entered
        const pastPendingMeetings = meetings.filter(m => {
            const dateStr = (m.scheduled_at || '').replace(' ', 'T');
            const dateObj = new Date(dateStr);
            const isDateOver = m.is_date_over || (!isNaN(dateObj) && dateObj <= now);
            const hasNoNotes = !m.notes || !m.notes.minutes || !m.notes.important_decisions;
            const isNotCancelled = m.status !== 'cancelled';
            return isDateOver && hasNoNotes && isNotCancelled;
        });

        // Filter completed meetings that have recorded notes
        const completedMeetings = meetings.filter(m => {
            return m.status === 'completed' && m.notes && m.notes.minutes && m.notes.important_decisions;
        });

        container.innerHTML = `
            <div class="page-header" style="margin-bottom: 1.5rem;">
                <h1>Faculty Meetings</h1>
                <p>Schedule upcoming meetings with student project teams and document minutes of meetings for past sessions.</p>
            </div>

            <!-- TABS AT THE TOP: Schedule Meeting | Past Meetings -->
            <div class="project-tabs" style="display: flex; gap: 1rem; border-bottom: 1px solid var(--border-color, #e2e8f0); margin-bottom: 1.5rem;">
                <button id="tab-btn-schedule" class="tab-btn ${activeTab === 'schedule' ? 'active' : ''}" style="background: none; border: none; padding: 0.6rem 1.25rem; font-weight: 700; font-size: 0.95rem; cursor: pointer; border-bottom: 2px solid ${activeTab === 'schedule' ? 'var(--primary, #059669)' : 'transparent'}; color: ${activeTab === 'schedule' ? 'var(--primary, #059669)' : 'var(--text-muted, #64748b)'}; display: inline-flex; align-items: center; gap: 0.5rem;">
                    📅 Schedule Meeting
                </button>
                <button id="tab-btn-past" class="tab-btn ${activeTab === 'past' ? 'active' : ''}" style="background: none; border: none; padding: 0.6rem 1.25rem; font-weight: 700; font-size: 0.95rem; cursor: pointer; border-bottom: 2px solid ${activeTab === 'past' ? 'var(--primary, #059669)' : 'transparent'}; color: ${activeTab === 'past' ? 'var(--primary, #059669)' : 'var(--text-muted, #64748b)'}; display: inline-flex; align-items: center; gap: 0.5rem;">
                    ⏳ Past Meetings
                    ${pastPendingMeetings.length > 0 ? `
                        <span class="status-badge todo" style="padding: 0.15rem 0.55rem; font-size: 0.72rem;">
                            ${pastPendingMeetings.length} Pending
                        </span>
                    ` : ''}
                </button>
            </div>

            <!-- Global Action Message Banner -->
            <div id="meeting-msg-container" style="margin-bottom: 1.25rem;"></div>

            <!-- TAB CONTENT -->
            <div id="tab-content-area">
                ${activeTab === 'schedule' ? renderScheduleMeetingTab() : renderPastMeetingsTab(pastPendingMeetings, completedMeetings)}
            </div>
        `;

        setupEventListeners(pastPendingMeetings);
    }

    // ==========================================
    // 1. TAB: SCHEDULE MEETING (SCHEDULED LIST REMOVED)
    // ==========================================
    function renderScheduleMeetingTab() {
        return `
            <div style="max-width: 720px; margin: 0 auto;">
                <div class="faculty-card-panel">
                    <h2 style="margin: 0 0 0.4rem; font-size: 1.15rem; font-weight: 700; color: var(--text-main, #0f172a);">Schedule New Meeting</h2>
                    <p style="margin: 0 0 1.25rem; font-size: 0.85rem; color: var(--text-muted, #64748b);">
                        Fill out the details below to schedule an official project meeting with students. Initial status will be set to <strong>scheduled</strong>.
                    </p>

                    <form id="schedule-meeting-form">
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-main, #0f172a); margin-bottom: 0.4rem;">
                                Meeting Title *
                            </label>
                            <input
                                type="text"
                                id="meeting-title"
                                class="premium-input"
                                placeholder="e.g. Sprint 2 Architectural Sync"
                                required
                            />
                        </div>

                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-main, #0f172a); margin-bottom: 0.4rem;">
                                Project Assigned to You *
                            </label>
                            <select id="meeting-project" class="premium-input" required>
                                <option value="">Select project...</option>
                                ${assignedProjects.map(p => `
                                    <option value="${p.id}">${p.title || p.name}</option>
                                `).join('')}
                            </select>
                        </div>

                        <div style="display: flex; gap: 0.85rem; margin-bottom: 1rem;">
                            <div style="flex: 1;">
                                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-main, #0f172a); margin-bottom: 0.4rem;">
                                    Date (Past dates deactivated) *
                                </label>
                                <input
                                    type="date"
                                    id="meeting-date"
                                    class="premium-input"
                                    min="${todayStr}"
                                    value="${todayStr}"
                                    required
                                />
                            </div>
                            <div style="flex: 1;">
                                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-main, #0f172a); margin-bottom: 0.4rem;">
                                    Time *
                                </label>
                                <input
                                    type="time"
                                    id="meeting-time"
                                    class="premium-input"
                                    value="14:00"
                                    required
                                />
                            </div>
                        </div>

                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-main, #0f172a); margin-bottom: 0.4rem;">
                                Location
                            </label>
                            <input
                                type="text"
                                id="meeting-location"
                                class="premium-input"
                                placeholder="e.g. Google Meet or CS Seminar Hall"
                                value="Google Meet"
                            />
                        </div>

                        <!-- MEETING LINK OPTION -->
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-main, #0f172a); margin-bottom: 0.4rem;">
                                Meeting Link (URL)
                            </label>
                            <input
                                type="url"
                                id="meeting-link"
                                class="premium-input"
                                placeholder="https://meet.google.com/abc-defg-hij"
                            />
                        </div>

                        <!-- AGENDA OPTION -->
                        <div class="form-group" style="margin-bottom: 1.5rem;">
                            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-main, #0f172a); margin-bottom: 0.4rem;">
                                Agenda / Notes
                            </label>
                            <textarea
                                id="meeting-agenda"
                                class="premium-input"
                                style="height: 75px; resize: vertical;"
                                placeholder="1. Discuss API integration&#10;2. Review task assignments..."
                            ></textarea>
                        </div>

                        <button type="submit" id="schedule-submit-btn" class="btn btn-primary shadow-hover" style="width: 100%;">
                            Schedule Meeting
                        </button>
                    </form>
                </div>
            </div>
        `;
    }

    // ==========================================
    // 2. TAB: PAST MEETINGS (PENDING NOTES & STATUS)
    // ==========================================
    function renderPastMeetingsTab(pendingMeetings, completedMeetings) {
        return `
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                
                <!-- Section 1: Past Meetings Whose Minutes & Decisions Are NOT Entered -->
                <div>
                    <div style="margin-bottom: 1rem;">
                        <h2 style="margin: 0 0 0.35rem; font-size: 1.15rem; font-weight: 700; color: var(--text-main, #0f172a);">
                            Past Meetings Awaiting Minutes & Outcome (${pendingMeetings.length})
                        </h2>
                        <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted, #64748b);">
                            The scheduled dates for these meetings have passed. Please update the meeting status to <strong>completed</strong> (with minutes and important decisions) or <strong>cancelled</strong>.
                        </p>
                    </div>

                    ${pendingMeetings.length === 0 ? `
                        <div class="faculty-card-panel" style="text-align: center; color: var(--text-muted, #64748b); padding: 2.5rem;">
                            <div style="font-size: 2.2rem; margin-bottom: 0.5rem; color: var(--primary, #059669);">✓</div>
                            <strong style="display: block; font-size: 1rem; color: var(--text-main, #0f172a); margin-bottom: 0.25rem;">All Caught Up!</strong>
                            <span>There are no past meetings with pending minutes or status updates.</span>
                        </div>
                    ` : `
                        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                            ${pendingMeetings.map(m => {
                                const dateStr = (m.scheduled_at || '').replace(' ', 'T');
                                const dateObj = new Date(dateStr);
                                const formattedDate = isNaN(dateObj) ? m.scheduled_at : dateObj.toLocaleString('en-US', {
                                    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
                                });

                                const isExpanded = expandedMeetingId === m.id;

                                return `
                                    <div class="faculty-card-panel" style="padding: 1.25rem; border-left: 4px solid var(--primary, #059669);">
                                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
                                            <div>
                                                <strong style="font-size: 1.05rem; color: var(--text-main, #0f172a); display: block;">${m.title}</strong>
                                                <span style="font-size: 0.85rem; color: var(--primary, #059669); font-weight: 600;">Project: ${m.project_name || m.project_title || 'Assigned Project'}</span>
                                            </div>
                                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                                <span class="status-badge todo" style="font-size: 0.75rem;">
                                                    MINUTES PENDING
                                                </span>
                                            </div>
                                        </div>

                                        <div style="margin-top: 0.75rem; font-size: 0.85rem; color: var(--text-muted, #475569); display: flex; flex-direction: column; gap: 0.35rem;">
                                            <div>📅 Scheduled Date: <strong style="color: var(--text-main, #0f172a);">${formattedDate}</strong> <span style="color: #dc2626; font-size: 0.78rem; font-weight: 600;">(Meeting Date Passed)</span></div>
                                            <div>📍 Location: <strong style="color: var(--text-main, #0f172a);">${m.location || 'Google Meet'}</strong></div>
                                            ${m.meeting_link ? `
                                                <div>🔗 Meeting Link: <a href="${m.meeting_link}" target="_blank" style="color: var(--primary, #059669); font-weight: 600; text-decoration: underline;">${m.meeting_link}</a></div>
                                            ` : ''}
                                            ${m.agenda ? `
                                                <div style="margin-top: 0.35rem; padding: 0.5rem 0.75rem; background: var(--bg-main, #f8fafc); border: 1px solid var(--border-color, #e2e8f0); border-radius: 6px; font-size: 0.82rem; color: var(--text-main, #334155);">
                                                    <strong>Agenda:</strong> ${m.agenda}
                                                </div>
                                            ` : ''}
                                        </div>

                                        <!-- ACTION CONTROLS TO UPDATE STATUS AND ENTER MINUTES -->
                                        <div style="margin-top: 1rem; padding-top: 0.85rem; border-top: 1px dashed var(--border-color, #e2e8f0);">
                                            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
                                                <span style="font-size: 0.85rem; font-weight: 600; color: #92400e;">
                                                    Update Status & Enter Minutes:
                                                </span>
                                                <div style="display: flex; gap: 0.6rem;">
                                                    <button class="btn btn-primary btn-sm shadow-hover btn-toggle-complete-form" data-id="${m.id}">
                                                        ${isExpanded ? '▲ Hide Form' : '✓ Mark Completed (Enter Minutes)'}
                                                    </button>
                                                    <button class="btn btn-outline btn-sm btn-action-cancel" data-id="${m.id}" style="color: #dc2626; border-color: #fca5a5;">
                                                        ✕ Mark Cancelled
                                                    </button>
                                                </div>
                                            </div>

                                            <!-- EXPANDABLE FORM TO ENTER MINUTES AND IMPORTANT DECISIONS -->
                                            ${isExpanded ? `
                                                <div style="margin-top: 1rem; padding: 1rem; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px;">
                                                    <h4 style="margin: 0 0 0.5rem; font-size: 0.95rem; font-weight: 700; color: #166534;">
                                                        Enter Meeting Minutes & Important Decisions (to meeting_notes table)
                                                    </h4>
                                                    <p style="margin: 0 0 0.85rem; font-size: 0.82rem; color: #15803d;">
                                                        Submitting this form updates the meeting status to <strong>completed</strong> in the meetings table and inserts notes into <strong>meeting_notes</strong>.
                                                    </p>

                                                    <form class="inline-complete-form" data-id="${m.id}">
                                                        <div class="form-group" style="margin-bottom: 0.75rem;">
                                                            <label style="display: block; font-size: 0.82rem; font-weight: 600; color: #1e293b; margin-bottom: 0.35rem;">
                                                                Minutes of Meeting *
                                                            </label>
                                                            <textarea
                                                                class="premium-input input-meeting-minutes"
                                                                style="height: 85px; resize: vertical; background: #ffffff;"
                                                                placeholder="Discussion summary, topics covered, student presentations reviewed..."
                                                                required
                                                            ></textarea>
                                                        </div>

                                                        <div class="form-group" style="margin-bottom: 1rem;">
                                                            <label style="display: block; font-size: 0.82rem; font-weight: 600; color: #1e293b; margin-bottom: 0.35rem;">
                                                                Important Decisions *
                                                            </label>
                                                            <textarea
                                                                class="premium-input input-meeting-decisions"
                                                                style="height: 75px; resize: vertical; background: #ffffff;"
                                                                placeholder="Agreed deliverables, task allocations, deadlines, architecture approvals..."
                                                                required
                                                            ></textarea>
                                                        </div>

                                                        <div style="display: flex; justify-content: flex-end; gap: 0.6rem;">
                                                            <button type="button" class="btn btn-outline btn-sm btn-cancel-expand" data-id="${m.id}">
                                                                Cancel
                                                            </button>
                                                            <button type="submit" class="btn btn-primary btn-sm shadow-hover">
                                                                Save Notes & Mark Completed
                                                            </button>
                                                        </div>
                                                    </form>
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </div>

                <!-- Section 2: Completed Past Meetings With Recorded Minutes -->
                ${completedMeetings.length > 0 ? `
                    <div style="margin-top: 1.5rem;">
                        <h3 style="margin: 0 0 0.85rem; font-size: 1.05rem; font-weight: 700; color: var(--text-main, #0f172a);">
                            Completed Meetings with Recorded Minutes (${completedMeetings.length})
                        </h3>
                        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                            ${completedMeetings.map(m => `
                                <div class="module-card" style="background: var(--bg-card, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 8px; padding: 1.15rem; margin-bottom: 0;">
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem;">
                                        <div>
                                            <strong style="font-size: 0.95rem; color: var(--text-main, #0f172a);">${m.title}</strong>
                                            <div style="font-size: 0.82rem; color: var(--text-muted, #64748b); margin-top: 2px;">
                                                Project: <strong style="color: var(--primary, #059669);">${m.project_name || m.project_title || 'Assigned Project'}</strong> &bull; 
                                                📅 ${m.scheduled_at}
                                            </div>
                                        </div>
                                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                                            <span class="status-badge completed">COMPLETED</span>
                                            <button class="btn btn-outline btn-sm btn-edit-existing-notes" data-id="${m.id}" data-title="${m.title}" data-minutes="${encodeURIComponent(m.notes.minutes)}" data-decisions="${encodeURIComponent(m.notes.important_decisions)}" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">
                                                ✏ Edit Notes
                                            </button>
                                        </div>
                                    </div>
                                    <div style="margin-top: 0.65rem; padding: 0.65rem 0.85rem; background: var(--bg-main, #f8fafc); border: 1px solid var(--border-color, #e2e8f0); border-radius: 6px; font-size: 0.82rem;">
                                        <div style="margin-bottom: 0.35rem; color: var(--text-main, #1e293b);">
                                            <strong>Minutes:</strong> ${m.notes.minutes}
                                        </div>
                                        <div style="color: var(--text-main, #1e293b);">
                                            <strong>Important Decisions:</strong> ${m.notes.important_decisions}
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

            </div>
        `;
    }

    // ==========================================
    // 3. LISTENERS & API HANDLERS
    // ==========================================
    function setupEventListeners(pendingMeetings) {
        const msgContainer = container.querySelector('#meeting-msg-container');

        // Tab navigation
        const tabSchedule = container.querySelector('#tab-btn-schedule');
        const tabPast = container.querySelector('#tab-btn-past');

        tabSchedule?.addEventListener('click', () => {
            activeTab = 'schedule';
            expandedMeetingId = null;
            renderUI();
        });

        tabPast?.addEventListener('click', () => {
            activeTab = 'past';
            renderUI();
        });

        // -------------------------------------------------------------
        // FORM: SCHEDULE MEETING
        // -------------------------------------------------------------
        const scheduleForm = container.querySelector('#schedule-meeting-form');
        if (scheduleForm) {
            const dateInput = container.querySelector('#meeting-date');
            const submitBtn = container.querySelector('#schedule-submit-btn');
            const projectSelect = container.querySelector('#meeting-project');

            scheduleForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const title = container.querySelector('#meeting-title').value.trim();
                const projectId = parseInt(projectSelect.value);
                const chosenDate = dateInput.value;
                const chosenTime = container.querySelector('#meeting-time').value;
                const location = container.querySelector('#meeting-location').value.trim();
                const meetingLink = container.querySelector('#meeting-link').value.trim();
                const agenda = container.querySelector('#meeting-agenda').value.trim();

                if (chosenDate < todayStr) {
                    if (msgContainer) {
                        msgContainer.innerHTML = `
                            <div style="background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600;">
                                ⚠ Past dates are deactivated. Please select today or a future date.
                            </div>
                        `;
                    }
                    return;
                }

                const scheduledAt = `${chosenDate} ${chosenTime}:00`;

                submitBtn.disabled = true;
                submitBtn.textContent = 'Scheduling Meeting...';

                try {
                    const headers = {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    };

                    const res = await fetch(`${apiBase}/faculty/meetings`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            project_id: projectId,
                            title: title,
                            scheduled_at: scheduledAt,
                            location: location || 'Google Meet',
                            meeting_link: meetingLink || null,
                            agenda: agenda || null
                        })
                    });

                    const data = await res.json();

                    if (res.ok) {
                        showFacultySuccessPopup(
                            'Meeting Scheduled',
                            `Meeting "${title}" was successfully scheduled. Initial status set to scheduled.`
                        );

                        if (msgContainer) {
                            msgContainer.innerHTML = `
                                <div style="background: #ecfdf5; border: 1px solid #86efac; color: #166534; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600;">
                                    ✓ Meeting scheduled successfully with status <strong>scheduled</strong>! Notifications sent to team students.
                                </div>
                            `;
                        }
                        scheduleForm.reset();
                        dateInput.value = todayStr;
                        container.querySelector('#meeting-time').value = '14:00';
                        await loadMeetings();
                    } else {
                        if (msgContainer) {
                            msgContainer.innerHTML = `
                                <div style="background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600;">
                                    ⚠ Error: ${data.error || 'Could not schedule meeting'}
                                </div>
                            `;
                        }
                    }
                } catch (err) {
                    console.error(err);
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Schedule Meeting';
                }
            });
        }

        // -------------------------------------------------------------
        // PAST MEETINGS: EXPAND/COLLAPSE COMPLETE FORM
        // -------------------------------------------------------------
        container.querySelectorAll('.btn-toggle-complete-form').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                expandedMeetingId = expandedMeetingId === id ? null : id;
                renderUI();
            });
        });

        container.querySelectorAll('.btn-cancel-expand').forEach(btn => {
            btn.addEventListener('click', () => {
                expandedMeetingId = null;
                renderUI();
            });
        });

        // -------------------------------------------------------------
        // PAST MEETINGS: SUBMIT COMPLETE FORM (ENTER MINUTES & DECISIONS)
        // -------------------------------------------------------------
        container.querySelectorAll('.inline-complete-form').forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const meetingId = parseInt(form.getAttribute('data-id'));
                const minutes = form.querySelector('.input-meeting-minutes').value.trim();
                const decisions = form.querySelector('.input-meeting-decisions').value.trim();
                const submitBtn = form.querySelector('button[type="submit"]');

                if (!minutes || !decisions) {
                    alert('Please provide both minutes of meeting and important decisions.');
                    return;
                }

                submitBtn.disabled = true;
                submitBtn.textContent = 'Saving...';

                try {
                    const headers = {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    };

                    const res = await fetch(`${apiBase}/faculty/meetings/${meetingId}/status`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            status: 'completed',
                            minutes: minutes,
                            important_decisions: decisions
                        })
                    });

                    const data = await res.json();

                    if (res.ok) {
                        expandedMeetingId = null;
                        showFacultySuccessPopup(
                            'Meeting Notes Saved',
                            'Meeting marked as completed and minutes saved to meeting notes.'
                        );
                        if (msgContainer) {
                            msgContainer.innerHTML = `
                                <div style="background: #ecfdf5; border: 1px solid #86efac; color: #166534; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600;">
                                    ✓ Meeting marked as completed and minutes saved to <strong>meeting_notes</strong> table!
                                </div>
                            `;
                        }
                        await loadMeetings();
                    } else {
                        alert('Error: ' + (data.error || 'Failed to complete meeting'));
                    }
                } catch (err) {
                    console.error(err);
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Save Notes & Mark Completed';
                }
            });
        });

        // -------------------------------------------------------------
        // PAST MEETINGS: MARK CANCELLED (DO NOT ENTER INTO MEETING_NOTES)
        // -------------------------------------------------------------
        container.querySelectorAll('.btn-action-cancel').forEach(btn => {
            btn.addEventListener('click', async () => {
                const meetingId = parseInt(btn.getAttribute('data-id'));
                if (!confirm('Are you sure you want to mark this meeting as Cancelled? Status will be updated to cancelled in the meetings table and NO entry will be made to meeting_notes.')) {
                    return;
                }

                try {
                    const headers = {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    };

                    const res = await fetch(`${apiBase}/faculty/meetings/${meetingId}/status`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            status: 'cancelled'
                        })
                    });

                    const data = await res.json();

                    if (res.ok) {
                        expandedMeetingId = null;
                        showFacultySuccessPopup(
                            'Meeting Cancelled',
                            'Meeting status has been updated to cancelled.'
                        );
                        if (msgContainer) {
                            msgContainer.innerHTML = `
                                <div style="background: #ecfdf5; border: 1px solid #86efac; color: #166534; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600;">
                                    ✓ Meeting status updated to cancelled in meetings table.
                                </div>
                            `;
                        }
                        await loadMeetings();
                    } else {
                        alert('Error: ' + (data.error || 'Failed to cancel meeting'));
                    }
                } catch (err) {
                    console.error(err);
                }
            });
        });

        // -------------------------------------------------------------
        // EDIT EXISTING COMPLETED NOTES
        // -------------------------------------------------------------
        container.querySelectorAll('.btn-edit-existing-notes').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                const curMinutes = decodeURIComponent(btn.getAttribute('data-minutes') || '');
                const curDecisions = decodeURIComponent(btn.getAttribute('data-decisions') || '');

                const newMinutes = prompt('Update Minutes of Meeting:', curMinutes);
                if (newMinutes === null) return;

                const newDecisions = prompt('Update Important Decisions:', curDecisions);
                if (newDecisions === null) return;

                updateExistingMeetingNotes(id, newMinutes, newDecisions);
            });
        });
    }

    async function updateExistingMeetingNotes(meetingId, minutes, decisions) {
        try {
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };
            const res = await fetch(`${apiBase}/faculty/meetings/${meetingId}/status`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    status: 'completed',
                    minutes: minutes,
                    important_decisions: decisions
                })
            });
            if (res.ok) {
                await loadMeetings();
            } else {
                alert('Failed to update notes');
            }
        } catch (err) {
            console.error(err);
        }
    }

    // ==========================================
    // 4. DATA FETCHING
    // ==========================================
    async function loadAssignedProjects() {
        try {
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };
            const queryParam = storedUser?.email ? `?email=${encodeURIComponent(storedUser.email)}` : '';
            const res = await fetch(`${apiBase}/faculty/projects${queryParam}`, { headers });

            if (res.ok) {
                const data = await res.json();
                assignedProjects = Array.isArray(data) ? data : [];
            } else {
                assignedProjects = [
                    { id: 1, title: 'RLabZ ERP - Student Portal' },
                    { id: 2, title: 'CMS Academic Module' }
                ];
            }
        } catch (err) {
            console.warn('Could not fetch projects for meetings dropdown:', err);
            assignedProjects = [
                { id: 1, title: 'RLabZ ERP - Student Portal' },
                { id: 2, title: 'CMS Academic Module' }
            ];
        } finally {
            isLoadingProjects = false;
            renderUI();
        }
    }

    async function loadMeetings() {
        try {
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };
            const res = await fetch(`${apiBase}/faculty/meetings`, { headers });

            if (res.ok) {
                const data = await res.json();
                meetings = Array.isArray(data) ? data : [];
            } else {
                meetings = [];
            }
        } catch (err) {
            console.warn('Could not fetch meetings:', err);
            meetings = [];
        } finally {
            isLoadingMeetings = false;
            renderUI();
        }
    }

    renderUI();
    loadAssignedProjects();
    loadMeetings();

    return container;
}

export default FacultyMeetings;
