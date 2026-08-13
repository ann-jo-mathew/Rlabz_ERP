import '../faculty.css';

export function FacultyMeetings() {
    const container = document.createElement('div');
    container.className = 'faculty-meetings';

    // Mock data for projects and assigned students
    const projects = [
        { name: 'RLabZ ERP', students: ['Sandra', 'Anju', 'Rahul'] },
        { name: 'Student Management System', students: ['Neha', 'Sam'] },
        { name: 'Hospital Management System', students: ['Arun', 'Megha'] }
    ];

    // Mock scheduled meetings
    const meetings = [
        { id: 1, title: 'RLabZ ERP Status Sync', date: '2026-08-15', time: '10:00 AM', project: 'RLabZ ERP', students: 'Sandra, Anju, Rahul' },
        { id: 2, title: 'SMS UI Discussion', date: '2026-08-18', time: '02:30 PM', project: 'Student Management System', students: 'Neha, Sam' }
    ];

    // Render page layout
    container.innerHTML = `
        <div class="page-header">
            <h1>Meetings</h1>
            <p>Schedule and manage meetings with your student teams.</p>
        </div>

        <div class="meeting-schedule-container">
            <div class="meeting-form-card">
                <h2 style="margin: 0 0 20px; font-size: 18px; color: #1e293b;">Schedule New Meeting</h2>
                <form id="schedule-meeting-form">
                    <div class="meeting-form-group">
                        <label for="meeting-title">Meeting Title</label>
                        <input type="text" id="meeting-title" class="meeting-form-input" placeholder="e.g. Sprint 1 Review" required>
                    </div>

                    <div class="meeting-form-group">
                        <label for="meeting-project">Project Name</label>
                        <select id="meeting-project" class="meeting-form-select" required>
                            <option value="">Select project...</option>
                            ${projects.map(p => `<option value="${p.name}">${p.name}</option>`).join('')}
                        </select>
                    </div>

                    <div class="meeting-form-group" id="team-preview-group" style="display: none;">
                        <label>Assigned Student Team</label>
                        <div id="team-preview-content" class="meeting-team-preview"></div>
                    </div>

                    <div style="display: flex; gap: 15px;">
                        <div class="meeting-form-group" style="flex: 1;">
                            <label for="meeting-date">Date</label>
                            <input type="date" id="meeting-date" class="meeting-form-input" min="2026-08-01" max="2026-08-31" required>
                        </div>
                        <div class="meeting-form-group" style="flex: 1;">
                            <label for="meeting-time">Time</label>
                            <input type="time" id="meeting-time" class="meeting-form-input" required>
                        </div>
                    </div>

                    <button type="submit" class="meeting-submit-btn">Schedule Meeting</button>
                </form>
                <div id="meeting-msg-container" style="margin-top: 15px;"></div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 20px;">
                <div class="calendar-wrapper">
                    <div class="calendar-header">
                        <h2 id="calendar-month-year" style="margin: 0; font-size: 16px; color: #1e293b; font-weight: 700;">August 2026</h2>
                        <span style="font-size: 12px; color: #64748b;">Active Academic Month</span>
                    </div>
                    <div class="calendar-grid">
                        <div class="calendar-day-label">Sun</div>
                        <div class="calendar-day-label">Mon</div>
                        <div class="calendar-day-label">Tue</div>
                        <div class="calendar-day-label">Wed</div>
                        <div class="calendar-day-label">Thu</div>
                        <div class="calendar-day-label">Fri</div>
                        <div class="calendar-day-label">Sat</div>
                        <!-- Days of August 2026 (Starts on a Saturday) -->
                        <div class="calendar-day empty" style="cursor: default;"></div>
                        <div class="calendar-day empty" style="cursor: default;"></div>
                        <div class="calendar-day empty" style="cursor: default;"></div>
                        <div class="calendar-day empty" style="cursor: default;"></div>
                        <div class="calendar-day empty" style="cursor: default;"></div>
                        <div class="calendar-day empty" style="cursor: default;"></div>
                        ${Array.from({ length: 31 }, (_, i) => {
                            const dayNum = i + 1;
                            const dayStr = dayNum.toString().padStart(2, '0');
                            const dateStr = `2026-08-${dayStr}`;
                            const isToday = dayNum === 13; // Set Aug 13, 2026 as current day
                            const hasMeeting = meetings.some(m => m.date === dateStr);
                            return `
                                <div class="calendar-day ${isToday ? 'selected' : ''} ${hasMeeting ? 'has-meeting' : ''}" data-date="${dateStr}">
                                    ${dayNum}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <div class="meetings-list-card">
                    <h2 style="margin: 0 0 15px; font-size: 16px; color: #1e293b;">Scheduled Meetings</h2>
                    <div id="scheduled-meetings-list" style="display: flex; flex-direction: column; gap: 5px;"></div>
                </div>
            </div>
        </div>
    `;

    // References to DOM
    const form = container.querySelector('#schedule-meeting-form');
    const projectSelect = container.querySelector('#meeting-project');
    const teamGroup = container.querySelector('#team-preview-group');
    const teamContent = container.querySelector('#team-preview-content');
    const meetingsList = container.querySelector('#scheduled-meetings-list');
    const msgContainer = container.querySelector('#meeting-msg-container');

    // Auto-fill students on project selection
    projectSelect.addEventListener('change', () => {
        const val = projectSelect.value;
        const matched = projects.find(p => p.name === val);
        if (matched) {
            teamContent.textContent = `Team Students: ${matched.students.join(', ')}`;
            teamGroup.style.display = 'block';
        } else {
            teamGroup.style.display = 'none';
        }
    });

    // Populate meetings list
    function displayMeetings() {
        if (meetings.length === 0) {
            meetingsList.innerHTML = `<p style="font-size: 13px; color: #64748b; margin: 0; text-align: center;">No meetings scheduled.</p>`;
            return;
        }
        
        // Sort meetings by date/time
        meetings.sort((a,b) => a.date.localeCompare(b.date));

        meetingsList.innerHTML = meetings.map(m => {
            const formattedDate = new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            return `
                <div class="meeting-item" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 10px;">
                    <div class="meeting-item-title">${m.title}</div>
                    <div style="font-size: 13px; color: #475569; margin-top: 4px;">
                        Project: <strong>${m.project}</strong>
                    </div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
                        Team: ${m.students}
                    </div>
                    <div class="meeting-item-meta">
                        <span>📅 ${formattedDate}</span>
                        <span>⏰ ${m.time}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Refresh Calendar dot highlights
    function updateCalendarHighlights() {
        container.querySelectorAll('.calendar-day[data-date]').forEach(dayEl => {
            const dateStr = dayEl.getAttribute('data-date');
            const hasMeeting = meetings.some(m => m.date === dateStr);
            if (hasMeeting) {
                dayEl.classList.add('has-meeting');
            } else {
                dayEl.classList.remove('has-meeting');
            }
        });
    }

    // Form submit listener
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = container.querySelector('#meeting-title').value;
        const project = projectSelect.value;
        const date = container.querySelector('#meeting-date').value;
        const timeVal = container.querySelector('#meeting-time').value;

        // Convert 24hr time to 12hr AM/PM format
        const [hours, minutes] = timeVal.split(':');
        const hr = parseInt(hours);
        const ampm = hr >= 12 ? 'PM' : 'AM';
        const formattedHours = hr % 12 || 12;
        const time = `${formattedHours}:${minutes} ${ampm}`;

        const matchedProj = projects.find(p => p.name === project);
        const students = matchedProj ? matchedProj.students.join(', ') : '';

        // Add to meetings list
        meetings.push({
            id: Date.now(),
            title,
            project,
            date,
            time,
            students
        });

        // Feedback message
        msgContainer.innerHTML = `
            <div class="assignment-success" style="padding: 10px; border-radius: 6px; font-size: 13px; font-weight: 600;">
                ✓ Meeting successfully scheduled and team notified!
            </div>
        `;

        // Clear form
        form.reset();
        teamGroup.style.display = 'none';

        // Refresh views
        displayMeetings();
        updateCalendarHighlights();

        // Clear success message after 3 seconds
        setTimeout(() => {
            msgContainer.innerHTML = '';
        }, 3000);
    });

    // Calendar day click listener
    container.querySelectorAll('.calendar-day[data-date]').forEach(dayEl => {
        dayEl.addEventListener('click', () => {
            container.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('selected'));
            dayEl.classList.add('selected');
            const dateStr = dayEl.getAttribute('data-date');
            container.querySelector('#meeting-date').value = dateStr;
        });
    });

    // Initial load
    displayMeetings();

    return container;
}

export default FacultyMeetings;
