import '../faculty.css';
import { showFacultyErrorPopup } from '../facultyPopup.js';

export function FacultyVerifyTasks() {
    const container = document.createElement('div');
    container.className = 'faculty-verify-tasks';

    let storedUser = null;
    try {
        storedUser = JSON.parse(localStorage.getItem('user'));
    } catch (e) {
        storedUser = null;
    }

    const token = localStorage.getItem('token');
    const apiBase = window.location.port === '8000' ? '/api' : 'http://127.0.0.1:8000/api';

    // State management
    let currentView = 'project-list'; // 'project-list' | 'work-logs-view'
    let assignedProjects = [];
    let selectedProjectId = null;
    let projectDetail = null; // { project, work_logs }
    let logFilter = 'all'; // 'all' | 'pending' | 'approved' | 'rejected'
    let isLoadingProjects = true;
    let isLoadingWorkLogs = false;
    let actionMessage = null;
    let searchQuery = '';

    // Standard Monochromatic Stroke SVG Icons
    const iconCheck = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px;"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    const iconCheckCircle = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -3px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    const iconAlert = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    const iconUser = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
    const iconFolder = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`;
    const iconCalendar = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
    const iconClock = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
    const iconFile = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;
    const iconDownload = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;

    function render() {
        if (currentView === 'project-list') {
            renderProjectListView();
        } else {
            renderWorkLogsView();
        }
    }

    // ==========================================
    // 1. PROJECT LIST VIEW (ASSIGNED TO LOGGED-IN FACULTY)
    // ==========================================
    function renderProjectListView() {
        container.innerHTML = `
            <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.75rem;">
                <div>
                    <h1>Verify Task</h1>
                    <p>Select an assigned project to review student work logs and verify task completions.</p>
                </div>
                <div style="position: relative; width: 320px; max-width: 100%;">
                    <input 
                        type="text" 
                        id="input-search-verify-project" 
                        class="premium-input" 
                        placeholder="Search project by name..." 
                        value="${searchQuery}" 
                        style="padding-left: 2.25rem; font-size: 0.88rem; height: 40px; border-radius: 8px;"
                    />
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 12px; top: 13px; color: #94a3b8;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
            </div>

            ${actionMessage ? `
                <div style="background: #ecfdf5; border: 1px solid #86efac; color: #166534; padding: 0.85rem 1.25rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.9rem; font-weight: 500; display: flex; align-items: center; justify-content: space-between;">
                    <span>${actionMessage}</span>
                    <button class="btn-close-msg" style="background:none; border:none; color: #166534; cursor: pointer; font-size: 1.1rem; line-height: 1;">&times;</button>
                </div>
            ` : ''}

            <div class="faculty-card-panel" style="padding: 0; overflow: hidden; border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <table class="premium-table" style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="background: var(--bg-main, #f8fafc); border-bottom: 2px solid var(--border-color, #e2e8f0);">
                            <th style="padding: 1rem 1.5rem; font-size: 0.82rem; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em;">Project Title</th>
                            <th style="padding: 1rem 1.5rem; font-size: 0.82rem; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em;">Client</th>
                            <th style="padding: 1rem 1.5rem; font-size: 0.82rem; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em;">Type</th>
                            <th style="padding: 1rem 1.5rem; font-size: 0.82rem; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em;">Status</th>
                            <th style="padding: 1rem 1.5rem; font-size: 0.82rem; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em; text-align: right;">Action</th>
                        </tr>
                    </thead>
                    <tbody id="verify-projects-table-body">
                        ${renderProjectRows()}
                    </tbody>
                </table>
            </div>
            <style>
                .faculty-verify-tasks .project-row-clickable:hover {
                    background: var(--bg-surface, #f8fafc) !important;
                }
                .faculty-verify-tasks .project-row-clickable:hover td:first-child > div:first-child {
                    color: var(--primary, #059669) !important;
                }
            </style>
        `;

        setupProjectListListeners();
    }

    function renderProjectRows() {
        if (isLoadingProjects) {
            return `<tr><td colspan="5" style="text-align: center; color: var(--text-muted, #64748b); padding: 3rem; font-size: 0.95rem;">Loading assigned projects...</td></tr>`;
        }

        const query = searchQuery.trim().toLowerCase();
        const filteredProjects = query
            ? assignedProjects.filter(p => (p.title || '').toLowerCase().includes(query) || (p.client_name || '').toLowerCase().includes(query))
            : assignedProjects;

        if (!filteredProjects || filteredProjects.length === 0) {
            return `<tr><td colspan="5" style="text-align: center; color: var(--text-muted, #94a3b8); padding: 3rem; font-size: 0.95rem;">${query ? `No projects found matching "${searchQuery}".` : 'No projects currently assigned to you.'}</td></tr>`;
        }

        return filteredProjects.map(project => {
            const rawTitle = project.title || 'Untitled Project';
            const projectTitle = rawTitle.replace(/\s*[-–—]\s*Student Portal/gi, '').replace(/Student Portal/gi, '').trim() || 'Untitled Project';
            const clientName = project.client_name || 'Rajagiri College';
            const projectType = project.project_type || 'Web Application';
            const status = (project.status || 'in_progress').toLowerCase();

            return `
                <tr class="project-row-clickable" data-project-id="${project.id}" style="border-bottom: 1px solid var(--border-color, #e2e8f0); transition: background 0.15s ease; cursor: pointer;">
                    <td style="padding: 1.15rem 1.5rem;">
                        <div style="font-weight: 600; color: var(--text-main, #0f172a); font-size: 0.95rem;">
                            ${projectTitle}
                        </div>
                    </td>
                    <td style="padding: 1.15rem 1.5rem; font-size: 0.9rem; color: var(--text-main, #334155);">
                        ${clientName}
                    </td>
                    <td style="padding: 1.15rem 1.5rem; font-size: 0.9rem; color: var(--text-muted, #64748b);">
                        ${projectType}
                    </td>
                    <td style="padding: 1.15rem 1.5rem;">
                        <span class="status-badge ${status.replace(' ', '_')}">
                            ${status.replace('_', ' ').toUpperCase()}
                        </span>
                    </td>
                    <td style="padding: 1.15rem 1.5rem; text-align: right;">
                        <button class="btn btn-sm btn-primary shadow-hover btn-open-project-logs" data-id="${project.id}" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.95rem;">
                            <span>Verify & Review</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function setupProjectListListeners() {
        const closeMsgBtn = container.querySelector('.btn-close-msg');
        if (closeMsgBtn) {
            closeMsgBtn.addEventListener('click', () => {
                actionMessage = null;
                render();
            });
        }

        const searchInput = container.querySelector('#input-search-verify-project');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value;
                const tbody = container.querySelector('#verify-projects-table-body');
                if (tbody) {
                    tbody.innerHTML = renderProjectRows();
                    setupRowButtons();
                }
            });
        }

        setupRowButtons();
    }

    function setupRowButtons() {
        container.querySelectorAll('#verify-projects-table-body tr.project-row-clickable').forEach(row => {
            row.addEventListener('click', (e) => {
                const btn = e.target.closest('.btn-open-project-logs');
                const pId = parseInt(btn ? btn.getAttribute('data-id') : row.getAttribute('data-project-id'));
                if (pId) {
                    selectedProjectId = pId;
                    loadProjectWorkLogs(pId);
                }
            });
        });
    }

    // ==========================================
    // 2. PROJECT VERIFICATION VIEW (WORK LOGS & PROGRESS REPORTS)
    // ==========================================
    function renderWorkLogsView() {
        if (isLoadingWorkLogs || !projectDetail) {
            container.innerHTML = `
                <div style="padding: 4rem; text-align: center; color: var(--text-muted, #64748b);">
                    <div class="spinner" style="border-top-color: var(--primary, #059669); margin: 0 auto 1rem; width: 32px; height: 32px;"></div>
                    <p style="font-size: 0.95rem;">Loading student submissions for project...</p>
                </div>
            `;
            return;
        }

        const project = projectDetail.project || {};
        const workLogs = projectDetail.work_logs || [];
        const rawTitle = project.title || 'Project Details';
        const projectTitle = rawTitle.replace(/\s*[-–—]\s*Student Portal/gi, '').replace(/Student Portal/gi, '').trim() || 'Project Details';
        const clientName = project.client_name || 'Rajagiri College';
        const projectType = project.project_type || 'Web App';
        const status = (project.status || 'in_progress').toLowerCase();

        // Summary metrics for work logs
        const totalLogs = workLogs.length;
        const totalHours = workLogs.reduce((acc, l) => acc + parseFloat(l.hours_worked || 0), 0).toFixed(1);
        const approvedLogsCount = workLogs.filter(l => (l.approval_status || '').toLowerCase() === 'approved').length;
        const pendingLogsCount = workLogs.filter(l => (l.approval_status || '').toLowerCase() === 'pending').length;
        const rejectedLogsCount = workLogs.filter(l => (l.approval_status || '').toLowerCase() === 'rejected').length;

        // Filter work logs
        let filteredLogs = workLogs;
        if (logFilter === 'pending') {
            filteredLogs = workLogs.filter(l => (l.approval_status || '').toLowerCase() === 'pending');
        } else if (logFilter === 'approved') {
            filteredLogs = workLogs.filter(l => (l.approval_status || '').toLowerCase() === 'approved');
        } else if (logFilter === 'rejected') {
            filteredLogs = workLogs.filter(l => (l.approval_status || '').toLowerCase() === 'rejected');
        }

        container.innerHTML = `
            ${actionMessage ? `
                <div style="background: #ecfdf5; border: 1px solid #86efac; color: #166534; padding: 0.85rem 1.25rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.9rem; font-weight: 500; display: flex; align-items: center; justify-content: space-between;">
                    <span>${actionMessage}</span>
                    <button class="btn-close-msg" style="background:none; border:none; color: #166534; cursor: pointer; font-size: 1.1rem; line-height: 1;">&times;</button>
                </div>
            ` : ''}

            <!-- Project Summary Banner with Back button on top right -->
            <div class="faculty-card-panel" style="padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.35rem;">
                            <h1 style="margin: 0; font-size: 1.35rem; font-weight: 700; color: var(--text-main, #0f172a);">${projectTitle}</h1>
                            <span class="status-badge ${status.replace(' ', '_')}">
                                ${status.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>
                        <p style="margin: 0; font-size: 0.88rem; color: var(--text-muted, #64748b);">
                            Client: <strong style="color: var(--text-main, #334155);">${clientName}</strong> &bull; Type: ${projectType} &bull; Total Work Logs: <strong style="color: var(--primary, #059669);">${totalLogs}</strong>
                        </p>
                    </div>
                    <div>
                        <button id="btn-back-to-projects" class="btn-back-nav" title="Return to Projects">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            <span>Back to Projects</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- WORK LOGS SECTION -->
            <div style="margin-bottom: 1.5rem;">
                    <!-- Metrics Strip -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; margin-bottom: 1.25rem;">
                        <div style="background: #ffffff; padding: 0.85rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0;">
                            <span style="font-size: 0.76rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Total Logs</span>
                            <div style="font-size: 1.3rem; font-weight: 700; color: #0f172a; margin-top: 2px;">${totalLogs}</div>
                        </div>
                        <div style="background: #ffffff; padding: 0.85rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0;">
                            <span style="font-size: 0.76rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Total Hours</span>
                            <div style="font-size: 1.3rem; font-weight: 700; color: #059669; margin-top: 2px;">${totalHours} hrs</div>
                        </div>
                        <div style="background: #ffffff; padding: 0.85rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0;">
                            <span style="font-size: 0.76rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Approved</span>
                            <div style="font-size: 1.3rem; font-weight: 700; color: #16a34a; margin-top: 2px;">${approvedLogsCount}</div>
                        </div>
                        <div style="background: #ffffff; padding: 0.85rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0;">
                            <span style="font-size: 0.76rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Pending</span>
                            <div style="font-size: 1.3rem; font-weight: 700; color: #d97706; margin-top: 2px;">${pendingLogsCount}</div>
                        </div>
                    </div>

                    <!-- Filter Tabs -->
                    <div style="display: flex; gap: 0.75rem; margin-bottom: 1.25rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; flex-wrap: wrap;">
                        <button class="log-tab-btn ${logFilter === 'all' ? 'active-tab' : ''}" data-filter="all" style="background: none; border: none; padding: 0.5rem 0.85rem; font-size: 0.88rem; font-weight: 600; cursor: pointer; color: ${logFilter === 'all' ? 'var(--primary, #059669)' : '#64748b'}; border-bottom: ${logFilter === 'all' ? '2px solid var(--primary, #059669)' : 'none'};">
                            All Work Logs (${totalLogs})
                        </button>
                        <button class="log-tab-btn ${logFilter === 'pending' ? 'active-tab' : ''}" data-filter="pending" style="background: none; border: none; padding: 0.5rem 0.85rem; font-size: 0.88rem; font-weight: 600; cursor: pointer; color: ${logFilter === 'pending' ? 'var(--primary, #059669)' : '#64748b'}; border-bottom: ${logFilter === 'pending' ? '2px solid var(--primary, #059669)' : 'none'};">
                            Pending Approval (${pendingLogsCount})
                        </button>
                        <button class="log-tab-btn ${logFilter === 'approved' ? 'active-tab' : ''}" data-filter="approved" style="background: none; border: none; padding: 0.5rem 0.85rem; font-size: 0.88rem; font-weight: 600; cursor: pointer; color: ${logFilter === 'approved' ? 'var(--primary, #059669)' : '#64748b'}; border-bottom: ${logFilter === 'approved' ? '2px solid var(--primary, #059669)' : 'none'};">
                            Approved Logs (${approvedLogsCount})
                        </button>
                        ${rejectedLogsCount > 0 ? `
                            <button class="log-tab-btn ${logFilter === 'rejected' ? 'active-tab' : ''}" data-filter="rejected" style="background: none; border: none; padding: 0.5rem 0.85rem; font-size: 0.88rem; font-weight: 600; cursor: pointer; color: ${logFilter === 'rejected' ? '#dc2626' : '#64748b'}; border-bottom: ${logFilter === 'rejected' ? '2px solid #dc2626' : 'none'};">
                                Rejected Logs (${rejectedLogsCount})
                            </button>
                        ` : ''}
                    </div>

                    <!-- Work Logs Table -->
                    <div class="faculty-card-panel" style="padding: 0; overflow: hidden; border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                        ${filteredLogs.length === 0 ? `
                            <div style="padding: 3.5rem 2rem; text-align: center; color: var(--text-muted, #64748b);">
                                <p style="margin: 0; font-size: 0.95rem;">No student work logs found for this filter.</p>
                            </div>
                        ` : `
                            <table class="premium-table" style="width: 100%; border-collapse: collapse; text-align: left;">
                                <thead>
                                    <tr style="background: var(--bg-main, #f8fafc); border-bottom: 2px solid var(--border-color, #e2e8f0);">
                                        <th style="padding: 1rem 1.25rem; font-size: 0.82rem; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em; width: 18%;">Student</th>
                                        <th style="padding: 1rem 1.25rem; font-size: 0.82rem; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em; width: 14%;">Date & Hours</th>
                                        <th style="padding: 1rem 1.25rem; font-size: 0.82rem; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em; width: 22%;">Task & Module</th>
                                        <th style="padding: 1rem 1.25rem; font-size: 0.82rem; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em; width: 22%;">Work Description</th>
                                        <th style="padding: 1rem 1.25rem; font-size: 0.82rem; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em; width: 12%;">Approval</th>
                                        <th style="padding: 1rem 1.25rem; font-size: 0.82rem; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em; width: 12%; text-align: right;">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${filteredLogs.map(l => {
                                        const isApproved = (l.approval_status || '').toLowerCase() === 'approved';
                                        const isRejected = (l.approval_status || '').toLowerCase() === 'rejected';
                                        const taskStatus = (l.task_status || 'todo').toLowerCase();
                                        const studentName = l.student_name || 'Student';
                                        const taskTitle = l.task_title || 'General Task';
                                        const moduleName = l.module_name || 'General';

                                        return `
                                            <tr style="border-bottom: 1px solid var(--border-color, #e2e8f0); transition: background 0.15s ease;">
                                                <!-- Student -->
                                                <td style="padding: 1.1rem 1.25rem; vertical-align: top;">
                                                    <div style="font-weight: 600; color: var(--text-main, #0f172a); font-size: 0.92rem; display: flex; align-items: center; gap: 0.35rem;">
                                                        ${iconUser} ${studentName}
                                                    </div>
                                                    <div style="font-size: 0.78rem; color: var(--text-muted, #64748b); margin-top: 2px;">
                                                        ${l.student_email || ''}
                                                    </div>
                                                </td>

                                                <!-- Date & Hours -->
                                                <td style="padding: 1.1rem 1.25rem; vertical-align: top;">
                                                    <div style="font-weight: 600; color: var(--text-main, #1e293b); font-size: 0.88rem; display: flex; align-items: center; gap: 0.35rem;">
                                                        ${iconCalendar} ${l.work_date}
                                                    </div>
                                                    <div style="display: inline-flex; align-items: center; gap: 0.3rem; margin-top: 4px; padding: 2px 7px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; background: #f1f5f9; color: var(--primary, #059669); border: 1px solid #e2e8f0;">
                                                        ${iconClock} ${parseFloat(l.hours_worked || 0).toFixed(1)} hrs
                                                    </div>
                                                </td>

                                                <!-- Task & Module -->
                                                <td style="padding: 1.1rem 1.25rem; vertical-align: top;">
                                                    <div style="font-weight: 600; color: var(--text-main, #0f172a); font-size: 0.9rem; margin-bottom: 0.2rem;">
                                                        ${taskTitle}
                                                    </div>
                                                    <div style="font-size: 0.8rem; color: var(--text-muted, #64748b); display: flex; align-items: center; gap: 0.3rem; margin-bottom: 0.35rem;">
                                                        ${iconFolder} ${moduleName}
                                                    </div>
                                                    <div>
                                                        <span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; background: ${taskStatus === 'completed' ? '#ecfdf5' : '#f1f5f9'}; color: ${taskStatus === 'completed' ? '#059669' : '#475569'}; border: 1px solid ${taskStatus === 'completed' ? '#a7f3d0' : '#e2e8f0'};">
                                                            TASK: ${taskStatus.replace('_', ' ').toUpperCase()}
                                                        </span>
                                                    </div>
                                                </td>

                                                <!-- Work Description -->
                                                <td style="padding: 1.1rem 1.25rem; vertical-align: top;">
                                                    <div style="font-size: 0.84rem; color: var(--text-main, #334155); line-height: 1.45; background: #f8fafc; padding: 0.6rem 0.75rem; border-radius: 6px; border: 1px solid #f1f5f9;">
                                                        ${l.description || 'No work description provided.'}
                                                    </div>
                                                </td>

                                                <!-- Approval Status -->
                                                <td style="padding: 1.1rem 1.25rem; vertical-align: top;">
                                                    ${isApproved ? `
                                                        <span style="display: inline-flex; align-items: center; gap: 0.3rem; padding: 4px 9px; border-radius: 9999px; font-size: 0.76rem; font-weight: 600; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0;">
                                                            ${iconCheckCircle} Approved
                                                        </span>
                                                    ` : isRejected ? `
                                                        <span style="display: inline-flex; align-items: center; gap: 0.3rem; padding: 4px 9px; border-radius: 9999px; font-size: 0.76rem; font-weight: 600; background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5;">
                                                            ${iconAlert} Rejected
                                                        </span>
                                                    ` : `
                                                        <span style="display: inline-flex; align-items: center; gap: 0.3rem; padding: 4px 9px; border-radius: 9999px; font-size: 0.76rem; font-weight: 600; background: #fef3c7; color: #d97706; border: 1px solid #fde68a;">
                                                            Pending Approval
                                                        </span>
                                                    `}
                                                </td>

                                                <!-- Action Buttons -->
                                                <td style="padding: 1.1rem 1.25rem; vertical-align: top; text-align: right;">
                                                    <div style="display: flex; justify-content: flex-end; gap: 0.4rem; flex-wrap: wrap; align-items: center;">
                                                        ${isApproved ? `
                                                            <span style="display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.8rem; color: #059669; font-weight: 600; padding: 0.25rem 0.5rem; background: #ecfdf5; border-radius: 6px; border: 1px solid #a7f3d0;">
                                                                ${iconCheckCircle} Verified
                                                            </span>
                                                            <button class="btn btn-sm btn-outline btn-open-feedback-modal" data-task-id="${l.task_id || ''}" data-task-title="${(taskTitle || '').replace(/"/g, '&quot;')}" data-student-id="${l.student_id || ''}" data-student-name="${(studentName || '').replace(/"/g, '&quot;')}" title="Add Feedback for Student" style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.7rem; font-size: 0.8rem; color: #2563eb; border-color: #93c5fd;">
                                                                Feedback
                                                            </button>
                                                        ` : `
                                                            <button class="btn btn-sm btn-primary shadow-hover btn-approve-log" data-id="${l.id}" data-status="approved" title="Approve Work Log & Complete Task" style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.4rem 0.8rem; font-size: 0.82rem;">
                                                                ${iconCheck} Approve
                                                            </button>
                                                            <button class="btn btn-sm btn-outline btn-approve-log" data-id="${l.id}" data-status="rejected" title="Reject Log" style="padding: 0.4rem 0.65rem; font-size: 0.8rem; color: #dc2626; border-color: #fca5a5;">
                                                                Reject
                                                            </button>
                                                            <button class="btn btn-sm btn-outline btn-open-feedback-modal" data-task-id="${l.task_id || ''}" data-task-title="${(taskTitle || '').replace(/"/g, '&quot;')}" data-student-id="${l.student_id || ''}" data-student-name="${(studentName || '').replace(/"/g, '&quot;')}" title="Add Feedback for Student" style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.4rem 0.7rem; font-size: 0.8rem; color: #2563eb; border-color: #93c5fd;">
                                                                Feedback
                                                            </button>
                                                        `}
                                                    </div>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        `}
                    </div>
                </div>
            </div>
        `;

        setupWorkLogsViewListeners();
    }

    function setupWorkLogsViewListeners() {
        const backBtn = container.querySelector('#btn-back-to-projects');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                currentView = 'project-list';
                render();
            });
        }

        const closeMsgBtn = container.querySelector('.btn-close-msg');
        if (closeMsgBtn) {
            closeMsgBtn.addEventListener('click', () => {
                actionMessage = null;
                render();
            });
        }

        // Log Filter tab buttons
        container.querySelectorAll('.log-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                logFilter = btn.getAttribute('data-filter');
                render();
            });
        });

        // Approve / Reject Work Log actions
        container.querySelectorAll('.btn-approve-log').forEach(btn => {
            btn.addEventListener('click', async () => {
                const logId = btn.getAttribute('data-id');
                const targetStatus = btn.getAttribute('data-status');
                await handleApproveWorkLog(logId, targetStatus, btn);
            });
        });

        // Work log Feedback modal actions
        container.querySelectorAll('.btn-open-feedback-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                const sId = parseInt(btn.getAttribute('data-student-id'));
                const sName = btn.getAttribute('data-student-name') || 'Student';
                const tId = btn.getAttribute('data-task-id') ? parseInt(btn.getAttribute('data-task-id')) : null;
                const tTitle = btn.getAttribute('data-task-title') || 'Task';
                openFeedbackModal(sId, sName, tId, tTitle);
            });
        });
    }

    // ==========================================
    // 3. TASK FEEDBACK MODAL (FOR WORK LOGS)
    // ==========================================
    function openFeedbackModal(studentId, studentName, taskId, taskTitle) {
        const existing = document.getElementById('task-feedback-modal-overlay');
        if (existing) existing.remove();

        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'task-feedback-modal-overlay';
        modalOverlay.style.position = 'fixed';
        modalOverlay.style.top = '0';
        modalOverlay.style.left = '0';
        modalOverlay.style.width = '100vw';
        modalOverlay.style.height = '100vh';
        modalOverlay.style.background = 'rgba(15, 23, 42, 0.55)';
        modalOverlay.style.backdropFilter = 'blur(2px)';
        modalOverlay.style.display = 'flex';
        modalOverlay.style.alignItems = 'center';
        modalOverlay.style.justifyContent = 'center';
        modalOverlay.style.zIndex = '10000';

        modalOverlay.innerHTML = `
            <div style="background: #ffffff; border-radius: 12px; width: 480px; max-width: 92%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border: 1px solid #e2e8f0; overflow: hidden;">
                <div style="padding: 1.15rem 1.5rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; background: #f8fafc;">
                    <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 0.5rem;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #2563eb;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        Add Task Feedback
                    </h3>
                    <button id="btn-close-task-feedback-modal" style="background: none; border: none; font-size: 1.3rem; color: #64748b; cursor: pointer; line-height: 1;">&times;</button>
                </div>
                <form id="form-task-feedback" style="padding: 1.5rem;">
                    <div style="margin-bottom: 1rem; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 0.75rem 1rem;">
                        <div style="font-size: 0.85rem; color: #1e40af;"><strong>Student:</strong> ${studentName}</div>
                        <div style="font-size: 0.85rem; color: #1e40af; margin-top: 3px;"><strong>Task:</strong> ${taskTitle}</div>
                    </div>
                    <div style="margin-bottom: 1.25rem;">
                        <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #334155; margin-bottom: 0.4rem;">Feedback / Comments <span style="color: #ef4444;">*</span></label>
                        <textarea id="feedback-comments-input" rows="4" class="premium-input" placeholder="Enter constructive feedback, corrections, or notes for this task..." style="width: 100%; box-sizing: border-box; resize: vertical; font-family: inherit; font-size: 0.9rem;" required></textarea>
                    </div>
                    <div id="feedback-modal-msg" style="margin-bottom: 1rem;"></div>
                    <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
                        <button type="button" id="btn-cancel-task-feedback" class="btn btn-outline btn-sm" style="padding: 0.45rem 1rem;">Cancel</button>
                        <button type="submit" id="btn-submit-task-feedback" class="btn btn-primary btn-sm" style="padding: 0.45rem 1.25rem; display: inline-flex; align-items: center; gap: 0.35rem;">
                            Submit Feedback
                        </button>
                    </div>
                </form>
            </div>
        `;

        modalOverlay.querySelector('#btn-close-task-feedback-modal').addEventListener('click', () => modalOverlay.remove());
        modalOverlay.querySelector('#btn-cancel-task-feedback').addEventListener('click', () => modalOverlay.remove());

        modalOverlay.querySelector('#form-task-feedback').addEventListener('submit', async (e) => {
            e.preventDefault();
            const comments = modalOverlay.querySelector('#feedback-comments-input').value.trim();
            if (!comments) return;

            const submitBtn = modalOverlay.querySelector('#btn-submit-task-feedback');
            const msgEl = modalOverlay.querySelector('#feedback-modal-msg');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';

            try {
                const headers = {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                };
                const res = await fetch(`${apiBase}/faculty/feedback`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        project_id: selectedProjectId,
                        student_id: studentId,
                        task_id: taskId || null,
                        comments: comments
                    })
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    modalOverlay.remove();
                    actionMessage = `✓ Feedback submitted successfully for ${studentName}.`;
                    render();
                } else {
                    msgEl.innerHTML = `<div style="color: #b91c1c; font-size: 0.85rem; font-weight: 600;">${data.error || 'Failed to submit feedback.'}</div>`;
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit Feedback';
                }
            } catch (err) {
                console.error('Error submitting feedback:', err);
                msgEl.innerHTML = `<div style="color: #b91c1c; font-size: 0.85rem; font-weight: 600;">Error submitting feedback. Please try again.</div>`;
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Feedback';
            }
        });

        document.body.appendChild(modalOverlay);
    }

    // ==========================================
    // 5. WORK LOG APPROVAL ACTION
    // ==========================================
    async function handleApproveWorkLog(logId, statusValue, buttonElement) {
        const originalText = buttonElement.innerHTML;
        buttonElement.disabled = true;
        buttonElement.textContent = statusValue === 'approved' ? 'Approving...' : 'Rejecting...';

        try {
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };

            const res = await fetch(`${apiBase}/faculty/work-logs/${logId}/approve`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ approval_status: statusValue })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                if (statusValue === 'approved') {
                    const taskName = data.task?.title || 'the linked task';
                    actionMessage = `✓ Work log approved successfully, and ${taskName} status has been updated to COMPLETED.`;
                } else {
                    actionMessage = `Work log has been marked as rejected.`;
                }

                // Update in-memory log list
                if (projectDetail && projectDetail.work_logs) {
                    const logIndex = projectDetail.work_logs.findIndex(l => l.id == logId);
                    if (logIndex !== -1 && data.work_log) {
                        projectDetail.work_logs[logIndex] = {
                            ...projectDetail.work_logs[logIndex],
                            ...data.work_log,
                            task_status: data.task?.status || projectDetail.work_logs[logIndex].task_status
                        };
                    }
                }
                render();
            } else {
                showFacultyErrorPopup('Action Failed', data.error || 'Failed to update work log approval status.');
                buttonElement.disabled = false;
                buttonElement.innerHTML = originalText;
            }
        } catch (err) {
            console.error('Error approving work log:', err);
            showFacultyErrorPopup('Network Error', 'A network error occurred while approving the work log.');
            buttonElement.disabled = false;
            buttonElement.innerHTML = originalText;
        }
    }

    // ==========================================
    // 5. DATA FETCHING HELPERS
    // ==========================================
    async function loadAssignedProjects() {
        isLoadingProjects = true;
        render();

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
                assignedProjects = [];
            }
        } catch (err) {
            console.error('Failed to load assigned projects:', err);
            assignedProjects = [];
        } finally {
            isLoadingProjects = false;
            if (currentView === 'project-list') {
                render();
            }
        }
    }

    async function loadProjectWorkLogs(projectId) {
        isLoadingWorkLogs = true;
        currentView = 'work-logs-view';
        render();

        try {
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };

            const res = await fetch(`${apiBase}/faculty/projects/${projectId}/work-logs`, { headers });

            if (res.ok) {
                projectDetail = await res.json();
            } else {
                throw new Error('Failed to load project work logs');
            }
        } catch (err) {
            console.error('Error loading project details:', err);
            showFacultyErrorPopup('Load Error', 'Could not load student work logs. Please try again.');
            currentView = 'project-list';
        } finally {
            isLoadingWorkLogs = false;
            render();
        }
    }

    render();
    loadAssignedProjects();

    return container;
}

export default FacultyVerifyTasks;
