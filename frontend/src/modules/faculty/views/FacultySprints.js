import '../faculty.css';

export function FacultySprints() {
    const container = document.createElement('div');
    container.className = 'faculty-sprints';

    // Mock projects and sprint data
    const projectProgressMap = {
        'RLabZ ERP': 70,
        'Student Management System': 50,
        'Hospital Management System': 35
    };

    const sprints = [
        {
            id: 1,
            projectName: 'RLabZ ERP',
            name: 'Sprint 1: Authentication & Schema',
            status: 'Verified',
            startDate: '2026-08-01',
            endDate: '2026-08-07',
            deliverables: 'Database schema design and JWT auth endpoints.',
            message: 'Excellent database normalization and secure password hashing.'
        },
        {
            id: 2,
            projectName: 'RLabZ ERP',
            name: 'Sprint 2: Dashboard Layout',
            status: 'Pending Verification',
            startDate: '2026-08-08',
            endDate: '2026-08-14',
            deliverables: 'HTML layout, theme customization, and sidebar navigation.',
            message: ''
        },
        {
            id: 3,
            projectName: 'Student Management System',
            name: 'Sprint 1: Database Setup & CRUD APIs',
            status: 'Verified',
            startDate: '2026-08-03',
            endDate: '2026-08-09',
            deliverables: 'PostgreSQL schema setup and CRUD APIs for students.',
            message: 'All APIs are functioning correctly.'
        },
        {
            id: 4,
            projectName: 'Student Management System',
            name: 'Sprint 2: Attendance Tracking UI',
            status: 'In Progress',
            startDate: '2026-08-10',
            endDate: '2026-08-16',
            deliverables: 'Attendance grid and student registration forms.',
            message: ''
        },
        {
            id: 5,
            projectName: 'Hospital Management System',
            name: 'Sprint 1: UI Wireframes & Mockups',
            status: 'Pending Verification',
            startDate: '2026-08-05',
            endDate: '2026-08-11',
            deliverables: 'Figma wireframes for receptionist dashboard and doctor schedules.',
            message: ''
        }
    ];

    // State
    let selectedProject = 'All';

    // Main layout
    container.innerHTML = `
        <div class="page-header">
            <h1>Sprints</h1>
            <p>View, verify, edit, and provide feedback on student sprints.</p>
        </div>

        <div class="sprints-filter-section">
            <div>
                <label for="project-filter" style="font-weight: 600; color: #475569; margin-right: 10px;">Filter by Project:</label>
                <select id="project-filter" class="meeting-form-select" style="display: inline-block; width: auto;">
                    <option value="All">All Projects</option>
                    <option value="RLabZ ERP">RLabZ ERP</option>
                    <option value="Student Management System">Student Management System</option>
                    <option value="Hospital Management System">Hospital Management System</option>
                </select>
            </div>
        </div>

        <!-- Project Progress (only visible when a specific project is selected) -->
        <div id="project-progress-container" class="sprints-project-progress-card" style="display: none;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h3 id="progress-project-name" style="margin: 0; font-size: 16px; color: #1e293b;">Project Name</h3>
                <span id="progress-percentage-label" style="font-weight: 700; color: #087f5b; font-size: 16px;">70%</span>
            </div>
            <div class="progress-bar" style="height: 12px;">
                <div id="progress-bar-fill" class="progress-fill" style="width: 70%;"></div>
            </div>
        </div>

        <div id="sprints-list" class="sprints-grid"></div>
        <div id="modal-container"></div>
    `;

    // References
    const projectFilter = container.querySelector('#project-filter');
    const progressContainer = container.querySelector('#project-progress-container');
    const progressProjectName = container.querySelector('#progress-project-name');
    const progressPercentage = container.querySelector('#progress-percentage-label');
    const progressBarFill = container.querySelector('#progress-bar-fill');
    const sprintsList = container.querySelector('#sprints-list');
    const modalContainer = container.querySelector('#modal-container');

    // Update Project Progress section
    function updateProgressUI() {
        if (selectedProject === 'All') {
            progressContainer.style.display = 'none';
        } else {
            const progress = projectProgressMap[selectedProject] || 0;
            progressProjectName.textContent = `${selectedProject} Completion Progress`;
            progressPercentage.textContent = `${progress}%`;
            progressBarFill.style.width = `${progress}%`;
            progressContainer.style.display = 'block';
        }
    }

    // Render Sprints List
    function displaySprints() {
        const filtered = selectedProject === 'All'
            ? sprints
            : sprints.filter(s => s.projectName === selectedProject);

        if (filtered.length === 0) {
            sprintsList.innerHTML = `
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px; text-align: center;">
                    <h3 style="margin: 0; color: #64748b; font-size: 15px;">No sprints uploaded</h3>
                    <p style="margin: 5px 0 0; color: #94a3b8; font-size: 13px;">No sprint records match the selection.</p>
                </div>
            `;
            return;
        }

        sprintsList.innerHTML = filtered.map(s => {
            let badgeClass = 'in-progress';
            if (s.status === 'Verified') badgeClass = 'verified';
            if (s.status === 'Pending Verification') badgeClass = 'pending';

            const currentDate = new Date('2026-08-13');
            const sprintEndDate = new Date(s.endDate);
            const isOver = sprintEndDate < currentDate;

            return `
                <div class="sprint-card" data-id="${s.id}">
                    <div class="sprint-header">
                        <div>
                            <div class="sprint-title">${s.name}</div>
                            <span style="font-size: 12px; color: #64748b; font-weight: 600; display: block; margin-top: 4px;">
                                Project: ${s.projectName}
                            </span>
                        </div>
                        <span class="sprint-badge ${badgeClass}">${s.status}</span>
                    </div>

                    <div class="sprint-body">
                        <div class="sprint-info-row">
                            <span>📅 Schedule:</span> ${new Date(s.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to ${new Date(s.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div class="sprint-info-row">
                            <span>📦 Deliverables:</span> ${s.deliverables}
                        </div>
                        
                        <div class="sprint-feedback-box" id="feedback-display-${s.id}" style="${s.message ? '' : 'display: none;'}">
                            <span style="font-weight: 700; font-size: 12px; color: #087f5b; display: block; margin-bottom: 4px;">Faculty Feedback:</span>
                            <span id="feedback-text-${s.id}" style="font-size: 13px; color: #334155; font-style: italic;">${s.message}</span>
                        </div>

                        <div style="margin-top: 15px; border-top: 1px solid #f1f5f9; padding-top: 15px;">
                            <label style="font-size: 13px; font-weight: 600; color: #475569; display: block; margin-bottom: 6px;">Send Message / Feedback to Students:</label>
                            <div style="display: flex; gap: 10px;">
                                <textarea id="msg-input-${s.id}" placeholder="Type feedback message..." style="flex: 1; height: 38px; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; outline: none; resize: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='#087f5b'" onblur="this.style.borderColor='#cbd5e1'"></textarea>
                                <button class="btn-verify send-feedback-btn" data-id="${s.id}" style="padding: 0 15px; font-size: 13px;">Send</button>
                            </div>
                        </div>
                    </div>

                    <div class="sprint-actions">
                        ${isOver ? `
                            <button class="btn-edit edit-sprint-btn" disabled style="opacity: 0.6; cursor: not-allowed;" title="Sprint date is over. Editing disabled.">Edit Sprint (Ended)</button>
                        ` : `
                            <button class="btn-edit edit-sprint-btn" data-id="${s.id}">Edit Sprint Details</button>
                        `}
                        ${s.status === 'Pending Verification' ? `
                            <button class="btn-verify verify-sprint-btn" data-id="${s.id}">Verify Sprint</button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Bind verification buttons
        container.querySelectorAll('.verify-sprint-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const sprintId = parseInt(btn.getAttribute('data-id'));
                const sprint = sprints.find(s => s.id === sprintId);
                if (sprint) {
                    sprint.status = 'Verified';
                    
                    // Increment project progress on verification
                    const proj = sprint.projectName;
                    if (projectProgressMap[proj] !== undefined) {
                        projectProgressMap[proj] = Math.min(100, projectProgressMap[proj] + 15);
                    }

                    displaySprints();
                    updateProgressUI();
                }
            });
        });

        // Bind feedback messages
        container.querySelectorAll('.send-feedback-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const sprintId = parseInt(btn.getAttribute('data-id'));
                const sprint = sprints.find(s => s.id === sprintId);
                const input = container.querySelector(`#msg-input-${sprintId}`);
                if (sprint && input && input.value.trim()) {
                    sprint.message = input.value.trim();
                    input.value = '';
                    
                    // Update UI immediately
                    const displayBox = container.querySelector(`#feedback-display-${sprintId}`);
                    const textSpan = container.querySelector(`#feedback-text-${sprintId}`);
                    if (displayBox && textSpan) {
                        textSpan.textContent = sprint.message;
                        displayBox.style.display = 'block';
                    }
                }
            });
        });

        // Bind edit buttons
        container.querySelectorAll('.edit-sprint-btn:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
                const sprintId = parseInt(btn.getAttribute('data-id'));
                const sprint = sprints.find(s => s.id === sprintId);
                if (sprint) {
                    openEditModal(sprint);
                }
            });
        });
    }

    // Modal open logic
    function openEditModal(sprint) {
        modalContainer.innerHTML = `
            <div class="faculty-modal-overlay">
                <div class="faculty-modal-card">
                    <h3 style="margin: 0 0 15px; font-size: 18px; color: #1e293b;">Edit Sprint Details</h3>
                    <form id="edit-sprint-form">
                        <div class="meeting-form-group">
                            <label for="edit-title">Sprint Title</label>
                            <input type="text" id="edit-title" class="meeting-form-input" value="${sprint.name}" required>
                        </div>
                        <div class="meeting-form-group">
                            <label for="edit-deliverables">Deliverables</label>
                            <input type="text" id="edit-deliverables" class="meeting-form-input" value="${sprint.deliverables}" required>
                        </div>
                        <div style="display: flex; gap: 15px;">
                            <div class="meeting-form-group" style="flex: 1;">
                                <label for="edit-start">Start Date</label>
                                <input type="date" id="edit-start" class="meeting-form-input" value="${sprint.startDate}" required>
                            </div>
                            <div class="meeting-form-group" style="flex: 1;">
                                <label for="edit-end">End Date</label>
                                <input type="date" id="edit-end" class="meeting-form-input" value="${sprint.endDate}" required>
                            </div>
                        </div>
                        <div class="meeting-form-group">
                            <label for="edit-status">Sprint Status</label>
                            <select id="edit-status" class="meeting-form-select" required>
                                <option value="In Progress" ${sprint.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                                <option value="Pending Verification" ${sprint.status === 'Pending Verification' ? 'selected' : ''}>Pending Verification</option>
                                <option value="Verified" ${sprint.status === 'Verified' ? 'selected' : ''}>Verified</option>
                            </select>
                        </div>
                        <div class="meeting-form-group">
                            <label for="edit-progress">Project Progress (%)</label>
                            <input type="number" id="edit-progress" class="meeting-form-input" value="${projectProgressMap[sprint.projectName]}" min="0" max="100" required>
                        </div>
                        
                        <div style="display: flex; gap: 12px; margin-top: 20px; justify-content: flex-end;">
                            <button type="button" id="close-modal-btn" class="btn-edit">Cancel</button>
                            <button type="submit" class="btn-verify">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        const form = modalContainer.querySelector('#edit-sprint-form');
        const cancelBtn = modalContainer.querySelector('#close-modal-btn');

        // Cancel modal
        cancelBtn.addEventListener('click', () => {
            modalContainer.innerHTML = '';
        });

        // Submit form
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            sprint.name = modalContainer.querySelector('#edit-title').value;
            sprint.deliverables = modalContainer.querySelector('#edit-deliverables').value;
            sprint.startDate = modalContainer.querySelector('#edit-start').value;
            sprint.endDate = modalContainer.querySelector('#edit-end').value;
            
            const oldStatus = sprint.status;
            const newStatus = modalContainer.querySelector('#edit-status').value;
            sprint.status = newStatus;

            const progressVal = parseInt(modalContainer.querySelector('#edit-progress').value);
            projectProgressMap[sprint.projectName] = progressVal;

            modalContainer.innerHTML = '';
            displaySprints();
            updateProgressUI();
        });
    }

    // Filter change
    projectFilter.addEventListener('change', () => {
        selectedProject = projectFilter.value;
        displaySprints();
        updateProgressUI();
    });

    // Initial render
    displaySprints();
    updateProgressUI();

    return container;
}

export default FacultySprints;
