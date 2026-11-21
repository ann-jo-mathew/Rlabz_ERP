import '../faculty.css';
import html2pdf from 'html2pdf.js';
import { showFacultyErrorPopup } from '../facultyPopup.js';
import { API_BASE } from '@/core/config/api.js';

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
    const apiBase = API_BASE;

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
    const workLogsCache = new Map(); // projectId -> cached detail for instant loading

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
                <div style="width: 320px; max-width: 100%;">
                    <input
                        type="text"
                        id="input-search-verify-project"
                        class="app-search-input"
                        placeholder="Search project by name..."
                        value="${searchQuery}"
                    />
                </div>
            </div>

            ${actionMessage ? `
                <div style="background: var(--primary-light); border: 1px solid #86efac; color: #166534; padding: 0.85rem 1.25rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.9rem; font-weight: 500; display: flex; align-items: center; justify-content: space-between;">
                    <span>${actionMessage}</span>
                    <button class="btn-close-msg" style="background:none; border:none; color: #166534; cursor: pointer; font-size: 1.1rem; line-height: 1;">&times;</button>
                </div>
            ` : ''}

            <div class="faculty-card-panel" style="padding: 0; overflow: hidden; border: 1px solid var(--border-color, var(--border-subtle)); border-radius: 12px; background: var(--surface-card); box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <table class="premium-table" style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="background: var(--bg-main, var(--bg-canvas-light)); border-bottom: 2px solid var(--border-color, var(--border-subtle));">
                            <th style="padding: 1rem 1.5rem; font-size: 0.85rem; font-weight: 700; color: var(--text-muted, var(--text-muted)); text-transform: uppercase; letter-spacing: 0.05em;">Project Title</th>
                            <th style="padding: 1rem 1.5rem; font-size: 0.85rem; font-weight: 700; color: var(--text-muted, var(--text-muted)); text-transform: uppercase; letter-spacing: 0.05em;">Client Name</th>
                            <th style="padding: 1rem 1.5rem; font-size: 0.85rem; font-weight: 700; color: var(--text-muted, var(--text-muted)); text-transform: uppercase; letter-spacing: 0.05em;">Type</th>
                            <th style="padding: 1rem 1.5rem; font-size: 0.85rem; font-weight: 700; color: var(--text-muted, var(--text-muted)); text-transform: uppercase; letter-spacing: 0.05em;">Status</th>
                            <th style="padding: 1rem 1.5rem; font-size: 0.85rem; font-weight: 700; color: var(--text-muted, var(--text-muted)); text-transform: uppercase; letter-spacing: 0.05em; text-align: right;">Action</th>
                        </tr>
                    </thead>
                    <tbody id="verify-projects-table-body">
                        ${renderProjectRows()}
                    </tbody>
                </table>
            </div>
            <style>
                .faculty-verify-tasks .project-row-clickable:hover {
                    background: var(--bg-surface, var(--bg-canvas-light)) !important;
                }
                .faculty-verify-tasks .project-row-clickable:hover td:first-child > div:first-child {
                    color: var(--primary, var(--primary)) !important;
                }
            </style>
        `;

        setupProjectListListeners();
    }

    function renderProjectRows() {
        if (isLoadingProjects) {
            return `<tr><td colspan="5" style="text-align: center; color: var(--text-muted, var(--text-muted)); padding: 3rem; font-size: 0.95rem;">Loading assigned projects...</td></tr>`;
        }

        const query = searchQuery.trim().toLowerCase();
        const filteredProjects = query
            ? assignedProjects.filter(p => (p.title || '').toLowerCase().includes(query) || (p.client_name || '').toLowerCase().includes(query))
            : assignedProjects;

        if (!filteredProjects || filteredProjects.length === 0) {
            return `<tr><td colspan="5" style="text-align: center; color: var(--text-muted, var(--text-secondary)); padding: 3rem; font-size: 0.95rem;">${query ? `No projects found matching "${searchQuery}".` : 'No projects currently assigned to you.'}</td></tr>`;
        }

        return filteredProjects.map(project => {
            const rawTitle = project.title || 'Untitled Project';
            const projectTitle = rawTitle.replace(/\s*[-–—]\s*Student Portal/gi, '').replace(/Student Portal/gi, '').trim() || 'Untitled Project';
            const clientName = project.client_name || 'Rajagiri College';
            const projectType = project.project_type || 'Web Application';
            const status = (project.status || 'in_progress').toLowerCase();

            return `
                <tr class="project-row-clickable" data-project-id="${project.id}" style="border-bottom: 1px solid var(--border-color, var(--border-subtle)); transition: background 0.15s ease; cursor: pointer;">
                    <td style="padding: 1.15rem 1.5rem;">
                        <div style="font-weight: 600; color: var(--text-main, var(--text-primary)); font-size: 0.95rem;">
                            ${projectTitle}
                        </div>
                    </td>
                    <td style="padding: 1.15rem 1.5rem; font-size: 0.9rem; color: var(--text-main, #334155);">
                        ${clientName}
                    </td>
                    <td style="padding: 1.15rem 1.5rem; font-size: 0.9rem; color: var(--text-muted, var(--text-muted));">
                        ${projectType}
                    </td>
                    <td style="padding: 1.15rem 1.5rem;">
                        <span class="status-badge ${status.replace(' ', '_')}">${project.status || 'active'}</span>
                    </td>
                    <td style="padding: 1.15rem 1.5rem; text-align: right; white-space: nowrap;">
                        <button class="btn btn-sm btn-outline btn-download-project-weekly-pdf" data-id="${project.id}" data-title="${(projectTitle || '').replace(/"/g, '&quot;')}" title="Download Weekly Consolidated Report PDF (student_reports)" style="margin-right: 0.5rem; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.42rem 0.8rem; font-size: 0.8rem; font-weight: 600; color: #15803d; background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; cursor: pointer; transition: all 0.15s ease;">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            <span>Weekly PDF</span>
                        </button>
                        <button class="btn btn-sm btn-primary shadow-hover btn-open-project-logs" data-id="${project.id}">
                            Verify
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
                const downloadWeeklyBtn = e.target.closest('.btn-download-project-weekly-pdf') || e.target.closest('.btn-download-project-reports');
                if (downloadWeeklyBtn) {
                    e.stopPropagation();
                    const pId = parseInt(downloadWeeklyBtn.getAttribute('data-id'));
                    const pTitle = downloadWeeklyBtn.getAttribute('data-title') || 'Project';
                    handleDownloadProjectWeeklyPDF(pId, pTitle, downloadWeeklyBtn);
                    return;
                }
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
                <div style="padding: 4rem; text-align: center; color: var(--text-muted, var(--text-muted));">
                    <div class="spinner" style="border-top-color: var(--primary, var(--primary)); margin: 0 auto 1rem; width: 32px; height: 32px;"></div>
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

        const behindScheduleModules = projectDetail.behind_schedule_modules || [];
        const overrunLogs = workLogs.filter(l => (parseFloat(l.hours_worked || 0) > parseFloat(l.task_weight || 0)) || l.is_time_exceeded);

        container.innerHTML = `
            ${actionMessage ? `
                <div style="background: var(--primary-light); border: 1px solid #86efac; color: #166534; padding: 0.85rem 1.25rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.9rem; font-weight: 500; display: flex; align-items: center; justify-content: space-between;">
                    <span>${actionMessage}</span>
                    <button class="btn-close-msg" style="background:none; border:none; color: #166534; cursor: pointer; font-size: 1.1rem; line-height: 1;">&times;</button>
                </div>
            ` : ''}

            ${overrunLogs.length > 0 ? `
                <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 1.1rem 1.35rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 36px; height: 36px; border-radius: 50%; background: #ffedd5; color: #ea580c; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;">⚠️</div>
                            <div>
                                <div style="font-weight: 700; color: #9a3412; font-size: 0.92rem;">Task Time Overrun Detected</div>
                                <p style="margin: 2px 0 0; font-size: 0.84rem; color: #c2410c; line-height: 1.4;">
                                    ${overrunLogs.length} student log${overrunLogs.length > 1 ? 's have' : ' has'} exceeded planned task hours. You can click <strong>"Notify Coordinator"</strong> on the respective task in the table below to alert the coordinator.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ` : ''}

            ${behindScheduleModules.length > 0 ? `
                <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 12px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                    <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 700; color: #92400e; font-size: 0.95rem; margin-bottom: 0.5rem;">
                        <span style="font-size: 1.1rem;">⚠️</span>
                        <span>Schedule Alert: Some Module(s) Are Behind Schedule</span>
                    </div>
                    <p style="margin: 0 0 0.75rem; font-size: 0.86rem; color: #78350f; line-height: 1.45;">
                        The student hours logged on these modules exceed the planned task weights set by faculty:
                    </p>
                    <div style="display: flex; flex-direction: column; gap: 0.45rem;">
                        ${behindScheduleModules.map(bm => `
                            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; background: var(--surface-card); padding: 0.65rem 1rem; border-radius: 8px; border: 1px solid #fef3c7; font-size: 0.86rem;">
                                <div>
                                    <strong style="color: var(--text-primary);">${bm.module_name || 'Module'}</strong>
                                    <span style="color: var(--text-muted); font-size: 0.82rem; margin-left: 0.5rem;">(${bm.reason || 'Actual hours exceed planned weight'})</span>
                                </div>
                                <div style="display: flex; gap: 0.75rem; font-size: 0.82rem;">
                                    <span style="color: #0284c7; font-weight: 600;">Planned: ${bm.completed_weight || 0}/${bm.total_weight || 0} hrs</span>
                                    <span style="color: #dc2626; font-weight: 700;">Logged: ${bm.total_hours || 0} hrs</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Project Summary Banner with Back button on top right -->
            <div class="faculty-card-panel" style="padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid var(--border-color, var(--border-subtle)); border-radius: 12px; background: var(--surface-card); box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.35rem;">
                            <h1 style="margin: 0; font-size: 1.35rem; font-weight: 700; color: var(--text-main, var(--text-primary));">${projectTitle}</h1>
                            <span class="status-badge ${status.replace(' ', '_')}">
                                ${status.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>
                        <p style="margin: 0; font-size: 0.88rem; color: var(--text-muted, var(--text-muted));">
                            Client: <strong style="color: var(--text-main, #334155);">${clientName}</strong> &bull; Type: ${projectType} &bull; Total Work Logs: <strong style="color: var(--primary, var(--primary));">${totalLogs}</strong>
                        </p>
                    </div>
                    <div style="display: flex; gap: 0.65rem; align-items: center; flex-wrap: wrap;">
                        <button id="btn-download-project-weekly-pdf" class="btn btn-outline" data-id="${project.id || selectedProjectId}" data-title="${(projectTitle || '').replace(/"/g, '&quot;')}" title="Download Weekly Report PDF (from student_reports)" style="display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.48rem 0.95rem; font-size: 0.85rem; font-weight: 600; border-radius: 8px; border: 1px solid #86efac; background: #f0fdf4; color: #15803d; cursor: pointer; transition: all 0.15s ease;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            <span>Download Weekly Report (PDF)</span>
                        </button>
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
            <div style="margin-bottom: 2rem;">
                    <!-- Metrics Cards (Polished Modern ERP Cards) -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
                        <div class="faculty-stat-card-interactive" style="background: var(--surface-card); padding: 1.25rem 1.5rem; border-radius: 12px; border: 1px solid var(--border-color, var(--border-subtle)); box-shadow: 0 1px 3px rgba(0,0,0,0.04); display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <span style="font-size: 0.76rem; color: var(--text-muted, var(--text-muted)); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 0.35rem;">Total Logs</span>
                                <div style="font-size: 1.6rem; font-weight: 700; color: var(--text-primary); line-height: 1.1;">${totalLogs}</div>
                            </div>
                            <div style="width: 44px; height: 44px; border-radius: 10px; background: #f1f5f9; color: #475569; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                                ${iconFile}
                            </div>
                        </div>

                        <div class="faculty-stat-card-interactive" style="background: var(--surface-card); padding: 1.25rem 1.5rem; border-radius: 12px; border: 1px solid var(--border-color, var(--border-subtle)); box-shadow: 0 1px 3px rgba(0,0,0,0.04); display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <span style="font-size: 0.76rem; color: var(--text-muted, var(--text-muted)); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 0.35rem;">Total Hours</span>
                                <div style="font-size: 1.6rem; font-weight: 700; color: var(--primary); line-height: 1.1;">${totalHours} <span style="font-size: 0.95rem; font-weight: 600; color: var(--text-muted);">hrs</span></div>
                            </div>
                            <div style="width: 44px; height: 44px; border-radius: 10px; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                                ${iconClock}
                            </div>
                        </div>

                        <div class="faculty-stat-card-interactive" style="background: var(--surface-card); padding: 1.25rem 1.5rem; border-radius: 12px; border: 1px solid var(--border-color, var(--border-subtle)); box-shadow: 0 1px 3px rgba(0,0,0,0.04); display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <span style="font-size: 0.76rem; color: var(--text-muted, var(--text-muted)); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 0.35rem;">Approved</span>
                                <div style="font-size: 1.6rem; font-weight: 700; color: #16a34a; line-height: 1.1;">${approvedLogsCount}</div>
                            </div>
                            <div style="width: 44px; height: 44px; border-radius: 10px; background: var(--bg-main); color: #16a34a; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                                ${iconCheckCircle}
                            </div>
                        </div>

                        <div class="faculty-stat-card-interactive" style="background: var(--surface-card); padding: 1.25rem 1.5rem; border-radius: 12px; border: 1px solid var(--border-color, var(--border-subtle)); box-shadow: 0 1px 3px rgba(0,0,0,0.04); display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <span style="font-size: 0.76rem; color: var(--text-muted, var(--text-muted)); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 0.35rem;">Pending Approval</span>
                                <div style="font-size: 1.6rem; font-weight: 700; color: #d97706; line-height: 1.1;">${pendingLogsCount}</div>
                            </div>
                            <div style="width: 44px; height: 44px; border-radius: 10px; background: #fffbeb; color: #d97706; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                                ${iconAlert}
                            </div>
                        </div>
                    </div>

                    <!-- Filter Tabs -->
                    <div style="display: flex; gap: 0.5rem; margin-bottom: 1.25rem; border-bottom: 2px solid var(--border-subtle); padding-bottom: 0; flex-wrap: wrap;">
                        <button class="log-tab-btn ${logFilter === 'all' ? 'active-tab' : ''}" data-filter="all" style="background: none; border: none; padding: 0.65rem 1.1rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; color: ${logFilter === 'all' ? 'var(--primary, var(--primary))' : 'var(--text-muted)'}; border-bottom: 2px solid ${logFilter === 'all' ? 'var(--primary, var(--primary))' : 'transparent'}; margin-bottom: -2px; transition: all 0.15s ease;">
                            All Work Logs (${totalLogs})
                        </button>
                        <button class="log-tab-btn ${logFilter === 'pending' ? 'active-tab' : ''}" data-filter="pending" style="background: none; border: none; padding: 0.65rem 1.1rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; color: ${logFilter === 'pending' ? 'var(--primary, var(--primary))' : 'var(--text-muted)'}; border-bottom: 2px solid ${logFilter === 'pending' ? 'var(--primary, var(--primary))' : 'transparent'}; margin-bottom: -2px; transition: all 0.15s ease;">
                            Pending Approval (${pendingLogsCount})
                        </button>
                        <button class="log-tab-btn ${logFilter === 'approved' ? 'active-tab' : ''}" data-filter="approved" style="background: none; border: none; padding: 0.65rem 1.1rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; color: ${logFilter === 'approved' ? 'var(--primary, var(--primary))' : 'var(--text-muted)'}; border-bottom: 2px solid ${logFilter === 'approved' ? 'var(--primary, var(--primary))' : 'transparent'}; margin-bottom: -2px; transition: all 0.15s ease;">
                            Approved Logs (${approvedLogsCount})
                        </button>
                        ${rejectedLogsCount > 0 ? `
                            <button class="log-tab-btn ${logFilter === 'rejected' ? 'active-tab' : ''}" data-filter="rejected" style="background: none; border: none; padding: 0.65rem 1.1rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; color: ${logFilter === 'rejected' ? '#dc2626' : 'var(--text-muted)'}; border-bottom: 2px solid ${logFilter === 'rejected' ? '#dc2626' : 'transparent'}; margin-bottom: -2px; transition: all 0.15s ease;">
                                Rejected Logs (${rejectedLogsCount})
                            </button>
                        ` : ''}
                    </div>

                    <!-- Work Logs Table Panel -->
                    <div class="faculty-card-panel" style="padding: 0; overflow-x: auto; border: 1px solid var(--border-color, var(--border-subtle)); border-radius: 12px; background: var(--surface-card); box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                        ${filteredLogs.length === 0 ? `
                            <div style="padding: 3.5rem 2rem; text-align: center; color: var(--text-muted, var(--text-muted));">
                                <p style="margin: 0; font-size: 0.95rem;">No student work logs found for this filter.</p>
                            </div>
                        ` : `
                            <table class="premium-table" style="width: 100%; border-collapse: collapse; text-align: left;">
                                <thead>
                                    <tr style="background: var(--bg-main, var(--bg-canvas-light)); border-bottom: 2px solid var(--border-color, var(--border-subtle));">
                                        <th style="padding: 0.75rem 0.95rem; font-size: 0.76rem; font-weight: 700; color: var(--text-muted, var(--text-muted)); text-transform: uppercase; letter-spacing: 0.05em; width: 18%;">Student</th>
                                        <th style="padding: 0.75rem 0.95rem; font-size: 0.76rem; font-weight: 700; color: var(--text-muted, var(--text-muted)); text-transform: uppercase; letter-spacing: 0.05em; width: 13%;">Date & Hours</th>
                                        <th style="padding: 0.75rem 0.95rem; font-size: 0.76rem; font-weight: 700; color: var(--text-muted, var(--text-muted)); text-transform: uppercase; letter-spacing: 0.05em; width: 29%;">Task & Module</th>
                                        <th style="padding: 0.75rem 0.95rem; font-size: 0.76rem; font-weight: 700; color: var(--text-muted, var(--text-muted)); text-transform: uppercase; letter-spacing: 0.05em; width: 12%;">Rating</th>
                                        <th style="padding: 0.75rem 0.95rem; font-size: 0.76rem; font-weight: 700; color: var(--text-muted, var(--text-muted)); text-transform: uppercase; letter-spacing: 0.05em; width: 10%; text-align: center;">Status</th>
                                        <th style="padding: 0.75rem 0.95rem; font-size: 0.76rem; font-weight: 700; color: var(--text-muted, var(--text-muted)); text-transform: uppercase; letter-spacing: 0.05em; width: 18%; text-align: right;">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${(() => {
                                        // Pre-calculate distinct report dates for each student strictly from student_reports table
                                        const reportDatesMap = new Map();
                                        if (projectDetail && projectDetail.student_report_dates) {
                                            Object.keys(projectDetail.student_report_dates).forEach(sId => {
                                                const repList = projectDetail.student_report_dates[sId] || [];
                                                const seen = new Set();
                                                const uniqueReports = [];
                                                repList.forEach(r => {
                                                    if (r.report_date && !seen.has(r.report_date)) {
                                                        seen.add(r.report_date);
                                                        uniqueReports.push(r);
                                                    }
                                                });
                                                uniqueReports.sort((a, b) => b.report_date.localeCompare(a.report_date));
                                                reportDatesMap.set(String(sId), uniqueReports);
                                            });
                                        }

                                        return filteredLogs.map(l => {
                                        const isApproved = (l.approval_status || '').toLowerCase() === 'approved';
                                        const isRejected = (l.approval_status || '').toLowerCase() === 'rejected';
                                        const taskStatus = (l.task_status || 'todo').toLowerCase();
                                        const studentName = l.student_name || 'Student';
                                        const taskTitle = l.task_title || 'General Task';
                                        const moduleName = l.module_name || 'General';

                                        const sIdStr = String(l.student_id || '');
                                        const studentReports = reportDatesMap.get(sIdStr) || [];

                                        // Deadline Compliance Calculation
                                        const dueDate = l.task_due_date || null;
                                        let isLate = l.is_late || false;
                                        let daysLate = l.days_late || 0;
                                        if (dueDate) {
                                            const subDateStr = l.created_at ? l.created_at.substring(0, 10) : l.work_date;
                                            if (subDateStr && subDateStr > dueDate) {
                                                isLate = true;
                                                const diffMs = new Date(subDateStr).getTime() - new Date(dueDate).getTime();
                                                daysLate = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
                                            }
                                        }

                                        // Star Rating (supports rating column from student_work_logs)
                                        const currentRating = parseInt(l.rating || l.ratings, 10) || 0;

                                        return `
                                            <tr style="border-bottom: 1px solid var(--border-color, var(--border-subtle)); transition: background 0.15s ease;">
                                                <!-- Student -->
                                                <td style="padding: 0.75rem 0.95rem; vertical-align: middle;">
                                                    <div style="font-weight: 700; color: var(--text-main, var(--text-primary)); font-size: 0.88rem; display: flex; align-items: center; gap: 0.35rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                                        ${iconUser} <span>${studentName}</span>
                                                    </div>
                                                    <div style="font-size: 0.75rem; color: var(--text-muted, var(--text-muted)); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                                        ${l.student_email || ''}
                                                    </div>
                                                </td>

                                                <!-- Date & Hours -->
                                                <td style="padding: 0.75rem 0.95rem; vertical-align: middle;">
                                                    <div style="font-weight: 600; color: var(--text-main, #1e293b); font-size: 0.84rem; display: flex; align-items: center; gap: 0.35rem; white-space: nowrap;">
                                                        ${iconCalendar} <span>${l.work_date}</span>
                                                    </div>
                                                    <div style="margin-top: 4px;">
                                                        <span style="display: inline-flex; align-items: center; gap: 0.25rem; padding: 2px 6px; border-radius: 4px; font-size: 0.73rem; font-weight: 700; background: var(--primary-light); color: var(--primary); border: 1px solid var(--border-color); white-space: nowrap;">
                                                            ${iconClock} ${parseFloat(l.hours_worked || 0).toFixed(1)} hrs
                                                        </span>
                                                    </div>
                                                </td>

                                                <!-- Task, Module & Deadline -->
                                                <td style="padding: 0.75rem 0.95rem; vertical-align: middle;">
                                                    <div style="font-weight: 700; color: var(--text-main, var(--text-primary)); font-size: 0.86rem; margin-bottom: 0.15rem; line-height: 1.3; word-break: break-word;">
                                                        ${taskTitle}
                                                    </div>
                                                    <div style="font-size: 0.76rem; color: var(--text-muted, var(--text-muted)); display: flex; align-items: center; gap: 0.3rem; margin-bottom: 0.25rem; word-break: break-word;">
                                                        ${iconFolder} <span>${moduleName}</span>
                                                    </div>
                                                    <div style="display: flex; flex-wrap: wrap; gap: 0.25rem; align-items: center;">
                                                        <span style="display: inline-block; padding: 1px 5px; border-radius: 4px; font-size: 0.69rem; font-weight: 700; background: ${taskStatus === 'completed' ? 'var(--primary-light)' : '#f1f5f9'}; color: ${taskStatus === 'completed' ? 'var(--primary)' : '#475569'}; border: 1px solid ${taskStatus === 'completed' ? 'var(--border-color)' : 'var(--border-subtle)'}; text-transform: uppercase;">
                                                            TASK: ${taskStatus.replace('_', ' ')}
                                                        </span>
                                                        <span style="display: inline-flex; align-items: center; gap: 2px; padding: 1px 5px; border-radius: 4px; font-size: 0.69rem; font-weight: 700; background: #f0f9ff; color: #0284c7; border: 1px solid #bae6fd;" title="Planned weight/estimated hours">
                                                            Weight: ${l.task_weight || 1} hrs
                                                        </span>
                                                        ${(parseFloat(l.hours_worked || 0) > parseFloat(l.task_weight || 0) || l.is_time_exceeded) ? `
                                                            <span style="display: inline-flex; align-items: center; gap: 2px; padding: 1px 5px; border-radius: 4px; font-size: 0.69rem; font-weight: 700; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca;" title="Time logged exceeds planned task weight">
                                                                ⚠️ Overrun (${parseFloat(l.hours_worked).toFixed(1)} / ${parseFloat(l.task_weight || 1).toFixed(1)} hrs)
                                                            </span>
                                                        ` : ''}
                                                        ${isLate ? `
                                                            <span style="display: inline-flex; align-items: center; gap: 2px; padding: 1px 5px; border-radius: 4px; font-size: 0.69rem; font-weight: 700; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca;" title="Submitted after task deadline">
                                                                ⚠ Late (${daysLate}d &bull; Due: ${dueDate})
                                                            </span>
                                                        ` : dueDate ? `
                                                            <span style="display: inline-flex; align-items: center; gap: 2px; padding: 1px 5px; border-radius: 4px; font-size: 0.69rem; font-weight: 600; background: var(--bg-main); color: #16a34a; border: 1px solid #bbf7d0;" title="Submitted on time">
                                                                ✓ On Time (${dueDate})
                                                            </span>
                                                        ` : ''}
                                                        ${(l.branch_name || l.github_pr_url) ? `
                                                            <div style="display: flex; flex-wrap: wrap; gap: 0.3rem; align-items: center; margin-top: 0.15rem; width: 100%;">
                                                                ${l.branch_name ? `
                                                                    <a href="${l.branch_url || '#'}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 3px; padding: 1px 5px; border-radius: 4px; font-size: 0.69rem; font-weight: 600; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; text-decoration: none;" title="Open GitHub branch">
                                                                        <span>🌿</span> <span>${l.branch_name}</span>
                                                                    </a>
                                                                ` : ''}
                                                                ${l.github_pr_url ? `
                                                                    <a href="${l.github_pr_url}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 3px; padding: 1px 5px; border-radius: 4px; font-size: 0.69rem; font-weight: 600; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; text-decoration: none;" title="View Pull Request">
                                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                                                        <span>PR ↗</span>
                                                                    </a>
                                                                ` : ''}
                                                            </div>
                                                        ` : ''}
                                                    </div>
                                                </td>

                                                <!-- Star Rating -->
                                                <td style="padding: 0.75rem 0.95rem; vertical-align: middle;">
                                                    <div class="star-rating-cell" data-log-id="${l.id}" data-current-rating="${currentRating}">
                                                        <div class="stars-row" style="display: flex; align-items: center; gap: 2px;">
                                                            ${[1, 2, 3, 4, 5].map(starNum => {
                                                                const isFilled = starNum <= currentRating;
                                                                return `
                                                                    <button type="button" class="btn-star-rate" data-log-id="${l.id}" data-star="${starNum}" title="Give ${starNum} Star${starNum > 1 ? 's' : ''}" style="background: none; border: none; padding: 0; cursor: pointer; font-size: 1.15rem; line-height: 1; color: ${isFilled ? '#f59e0b' : '#cbd5e1'}; transition: color 0.15s, transform 0.1s;">
                                                                        ★
                                                                    </button>
                                                                `;
                                                            }).join('')}
                                                        </div>
                                                        <div class="star-rating-feedback" style="font-size: 0.73rem; font-weight: 600; color: ${currentRating > 0 ? '#b45309' : 'var(--text-secondary)'}; margin-top: 2px;">
                                                            ${currentRating > 0 ? `${currentRating}/5 Stars` : 'Click to Rate'}
                                                        </div>
                                                    </div>
                                                </td>

                                                <!-- Status (Separate Column) -->
                                                <td style="padding: 0.75rem 0.95rem; vertical-align: middle; text-align: center;">
                                                    ${isApproved ? `
                                                        <span style="display: inline-flex; align-items: center; gap: 0.25rem; padding: 3px 9px; border-radius: 9999px; font-size: 0.74rem; font-weight: 700; background: var(--primary-light); color: var(--primary); border: 1px solid var(--border-color); white-space: nowrap;">
                                                            ${iconCheckCircle} Approved
                                                        </span>
                                                    ` : isRejected ? `
                                                        <span style="display: inline-flex; align-items: center; gap: 0.25rem; padding: 3px 9px; border-radius: 9999px; font-size: 0.74rem; font-weight: 700; background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; white-space: nowrap;">
                                                            ${iconAlert} Rejected
                                                        </span>
                                                    ` : `
                                                        <span style="display: inline-flex; align-items: center; gap: 0.25rem; padding: 3px 9px; border-radius: 9999px; font-size: 0.74rem; font-weight: 700; background: #fef3c7; color: #d97706; border: 1px solid #fde68a; white-space: nowrap;">
                                                            Pending
                                                        </span>
                                                    `}
                                                </td>

                                                <!-- Action (Separate Column) -->
                                                <td style="padding: 0.75rem 0.95rem; vertical-align: middle; text-align: right;">
                                                    <div style="display: flex; flex-direction: column; align-items: stretch; gap: 0.35rem; width: 100%; max-width: 200px; margin-left: auto;">
                                                        
                                                        <!-- Feedback Button & Pending Controls -->
                                                        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 0.35rem; width: 100%;">
                                                            ${!isApproved ? `
                                                                <button class="btn btn-sm btn-primary shadow-hover btn-approve-log" data-id="${l.id}" data-status="approved" title="Approve Work Log & Complete Task" style="display: flex; align-items: center; justify-content: center; gap: 0.25rem; padding: 2px 7px; font-size: 0.74rem; font-weight: 600; border-radius: 5px; white-space: nowrap; box-sizing: border-box;">
                                                                    ${iconCheck} Approve
                                                                </button>
                                                                <button class="btn btn-sm btn-outline btn-approve-log" data-id="${l.id}" data-status="rejected" title="Reject Log" style="display: flex; align-items: center; justify-content: center; padding: 2px 7px; font-size: 0.74rem; color: #dc2626; border-color: #fca5a5; background: #fff; border-radius: 5px; font-weight: 600; white-space: nowrap; box-sizing: border-box;">
                                                                    Reject
                                                                </button>
                                                            ` : ''}

                                                            <button class="btn btn-sm btn-outline btn-open-feedback-modal" data-task-id="${l.task_id || ''}" data-task-title="${(taskTitle || '').replace(/"/g, '&quot;')}" data-student-id="${l.student_id || ''}" data-student-name="${(studentName || '').replace(/"/g, '&quot;')}" title="Add Feedback for Student" style="display: inline-flex; align-items: center; gap: 0.25rem; padding: 2px 8px; font-size: 0.74rem; color: #2563eb; border: 1px solid #bfdbfe; background: #eff6ff; border-radius: 5px; font-weight: 600; white-space: nowrap; cursor: pointer; transition: all 0.15s ease;">
                                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                                                <span>Feedback</span>
                                                            </button>
                                                        </div>

                                                        <!-- Overrun Action: Notify Coordinator -->
                                                        ${(parseFloat(l.hours_worked || 0) > parseFloat(l.task_weight || 0) || isLate || l.is_time_exceeded) ? `
                                                            <div style="display: flex; justify-content: flex-end; width: 100%;">
                                                                <button class="btn btn-sm btn-notify-coordinator ${l.coordinator_notified ? 'btn-coordinator-notified' : ''}" 
                                                                    data-id="${l.id}" 
                                                                    data-task-title="${(taskTitle || '').replace(/"/g, '&quot;')}"
                                                                    title="${l.coordinator_notified ? 'Coordinator has been alerted. Click to send another alert.' : 'Notify the coordinator about this task time overrun'}"
                                                                    style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.25rem; padding: 2px 6px; font-size: 0.72rem; font-weight: 600; border-radius: 5px; ${l.coordinator_notified ? 'background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;' : 'background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa;'} cursor: pointer; transition: all 0.15s ease; box-sizing: border-box; white-space: nowrap;">
                                                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="flex-shrink: 0;">
                                                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                                                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                                                    </svg>
                                                                    <span>${l.coordinator_notified ? '✓ Coordinator Notified' : 'Notify Coordinator'}</span>
                                                                </button>
                                                            </div>
                                                        ` : ''}

                                                        <!-- Daily Report PDF Group (Date dropdown and Daily PDF button inline) -->
                                                        <div class="row-pdf-report-box" style="margin-top: 0.2rem; width: 100%; display: flex; gap: 0.35rem; align-items: center; justify-content: flex-end;">
                                                            <select class="select-daily-report-date" data-student-id="${l.student_id}" data-log-id="${l.id}" title="Select report date from student_reports" style="flex: 1; min-width: 0; max-width: 115px; font-size: 0.73rem; padding: 2px 4px; border: 1px solid var(--border-color, #cbd5e1); border-radius: 5px; background: #ffffff; color: #1e293b; height: 26px; box-sizing: border-box; outline: none;">
                                                                ${studentReports.length > 0 
                                                                    ? studentReports.map(r => `<option value="${r.report_date}">${r.report_date}</option>`).join('')
                                                                    : '<option value="">No report</option>'
                                                                }
                                                            </select>
                                                            <button type="button" class="btn btn-sm btn-download-daily-pdf" 
                                                                data-student-id="${l.student_id}" 
                                                                data-student-name="${(studentName || '').replace(/"/g, '&quot;')}" 
                                                                data-log-id="${l.id}" 
                                                                title="Download Daily Report PDF for selected date" 
                                                                ${studentReports.length === 0 ? 'disabled style="display: inline-flex; align-items: center; justify-content: center; gap: 0.25rem; height: 26px; padding: 0 0.55rem; font-size: 0.72rem; font-weight: 600; background: #f1f5f9; color: #94a3b8; border: 1px solid #e2e8f0; border-radius: 5px; cursor: not-allowed; white-space: nowrap; flex-shrink: 0; box-sizing: border-box;"' : 'style="display: inline-flex; align-items: center; justify-content: center; gap: 0.25rem; height: 26px; padding: 0 0.55rem; font-size: 0.72rem; font-weight: 600; background: #f0fdf4; color: #15803d; border: 1px solid #86efac; border-radius: 5px; cursor: pointer; white-space: nowrap; flex-shrink: 0; transition: all 0.15s ease; box-sizing: border-box;"'}>
                                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="flex-shrink:0;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                                                <span>Daily PDF</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('');
                                })()}
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

        const downloadWeeklyBtn = container.querySelector('#btn-download-project-weekly-pdf') || container.querySelector('#btn-download-project-reports');
        if (downloadWeeklyBtn) {
            downloadWeeklyBtn.addEventListener('click', () => {
                const pId = parseInt(downloadWeeklyBtn.getAttribute('data-id')) || selectedProjectId;
                const pTitle = downloadWeeklyBtn.getAttribute('data-title') || (projectDetail?.project?.title || 'Project');
                handleDownloadProjectWeeklyPDF(pId, pTitle, downloadWeeklyBtn);
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

        // Notify Coordinator action button
        container.querySelectorAll('.btn-notify-coordinator').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const logId = btn.getAttribute('data-id');
                await handleNotifyCoordinator(logId, btn);
            });
        });

        // Download Daily Report PDF button (near task approval - from student_reports)
        container.querySelectorAll('.btn-download-daily-pdf').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const studentId = parseInt(btn.getAttribute('data-student-id'));
                const studentName = btn.getAttribute('data-student-name') || 'Student';
                const parentBox = btn.closest('.row-pdf-report-box');
                const dateSelect = parentBox ? parentBox.querySelector('.select-daily-report-date') : null;
                const chosenDate = dateSelect ? dateSelect.value : null;
                if (!chosenDate) {
                    showFacultyErrorPopup('No Report in student_reports', 'No report is available in student_reports for this student.');
                    return;
                }
                await handleDownloadDailyReportPDF(studentId, studentName, chosenDate, btn);
            });
        });

        // Download Weekly Report PDF button (near task approval - from student_reports)
        container.querySelectorAll('.btn-download-weekly-pdf').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const studentId = parseInt(btn.getAttribute('data-student-id'));
                const studentName = btn.getAttribute('data-student-name') || 'Student';
                await handleDownloadWeeklyReportPDF(studentId, studentName, btn);
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

        // Star rating hover and click handlers
        container.querySelectorAll('.star-rating-cell').forEach(cell => {
            const logId = cell.getAttribute('data-log-id');
            const starButtons = cell.querySelectorAll('.btn-star-rate');

            starButtons.forEach(btn => {
                const starVal = parseInt(btn.getAttribute('data-star'), 10);

                btn.addEventListener('mouseenter', () => {
                    starButtons.forEach(b => {
                        const bVal = parseInt(b.getAttribute('data-star'), 10);
                        b.style.color = bVal <= starVal ? '#f59e0b' : '#cbd5e1';
                        b.style.transform = bVal <= starVal ? 'scale(1.2)' : 'scale(1)';
                    });
                });

                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await handleRateWorkLog(logId, starVal, cell);
                });
            });

            cell.addEventListener('mouseleave', () => {
                const currentRating = parseInt(cell.getAttribute('data-current-rating'), 10) || 0;
                starButtons.forEach(b => {
                    const bVal = parseInt(b.getAttribute('data-star'), 10);
                    b.style.color = bVal <= currentRating ? '#f59e0b' : '#cbd5e1';
                    b.style.transform = 'scale(1)';
                });
            });
        });
    }

    // ==========================================
    // STAR RATING ACTION (PERSISTS TO student_work_logs)
    // ==========================================
    async function handleRateWorkLog(logId, starVal, cell) {
        const feedbackEl = cell.querySelector('.star-rating-feedback');
        const starButtons = cell.querySelectorAll('.btn-star-rate');

        if (feedbackEl) {
            feedbackEl.textContent = 'Saving...';
            feedbackEl.style.color = '#2563eb';
        }

        try {
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };

            const queryParam = storedUser?.email ? `?email=${encodeURIComponent(storedUser.email)}` : '';
            const res = await fetch(`${apiBase}/faculty/work-logs/${logId}/rate${queryParam}`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ rating: starVal })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                cell.setAttribute('data-current-rating', starVal);
                starButtons.forEach(b => {
                    const bVal = parseInt(b.getAttribute('data-star'), 10);
                    b.style.color = bVal <= starVal ? '#f59e0b' : '#cbd5e1';
                    b.style.transform = 'scale(1)';
                });
                if (feedbackEl) {
                    feedbackEl.textContent = `★ ${starVal}/5 Stars Saved`;
                    feedbackEl.style.color = '#15803d';
                }

                // Update in-memory log
                if (projectDetail && projectDetail.work_logs) {
                    const logObj = projectDetail.work_logs.find(l => String(l.id) === String(logId));
                    if (logObj) {
                        logObj.rating = starVal;
                        logObj.ratings = String(starVal);
                    }
                }
                if (selectedProjectId && workLogsCache.has(selectedProjectId)) {
                    workLogsCache.set(selectedProjectId, projectDetail);
                }
            } else {
                if (feedbackEl) {
                    feedbackEl.textContent = (data && data.error) ? data.error : (data && data.message ? data.message : 'Failed to save');
                    feedbackEl.style.color = '#dc2626';
                }
            }
        } catch (err) {
            console.error('Error saving star rating:', err);
            if (feedbackEl) {
                feedbackEl.textContent = 'Error saving rating';
                feedbackEl.style.color = '#dc2626';
            }
        }
    }

    // ==========================================
    // DOWNLOAD STUDENT REPORT (FROM student_reports TABLE)
    // ==========================================
    async function handleDownloadStudentReport(projectId, projectTitle, btnElement) {
        if (!projectId) return;
        const originalHtml = btnElement ? btnElement.innerHTML : null;
        if (btnElement) {
            btnElement.disabled = true;
            btnElement.innerHTML = `
                <span class="spinner-small" style="display:inline-block; width:12px; height:12px; border:2px solid currentColor; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite;"></span>
                <span>Downloading...</span>
            `;
        }

        try {
            const headers = {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };
            const queryParam = storedUser?.email ? `&email=${encodeURIComponent(storedUser.email)}` : '';
            const res = await fetch(`${apiBase}/faculty/projects/${projectId}/student-reports/download?token=${encodeURIComponent(token || '')}${queryParam}`, {
                method: 'GET',
                headers
            });

            if (!res.ok) {
                let errText = 'Failed to download student reports.';
                try {
                    const errJson = await res.json();
                    if (errJson && errJson.error) errText = errJson.error;
                } catch (_) {}
                throw new Error(errText);
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            const safeTitle = (projectTitle || 'Project').replace(/[^a-zA-Z0-9_\-]/g, '_');
            a.download = `Student_Work_Reports_${safeTitle}.csv`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                a.remove();
            }, 1000);

            actionMessage = `✓ Student work report downloaded successfully for "${projectTitle}".`;
            render();
        } catch (err) {
            console.error('Error downloading student reports:', err);
            showFacultyErrorPopup('Download Failed', err.message || 'Could not download student reports. Please try again.');
        } finally {
            if (btnElement && originalHtml) {
                btnElement.disabled = false;
                btnElement.innerHTML = originalHtml;
            }
        }
    }

    // ==========================================
    // DOWNLOAD PROJECT WEEKLY REPORT AS PDF (FROM student_reports TABLE)
    // ==========================================
    async function handleDownloadProjectWeeklyPDF(projectId, projectTitle, btnElement) {
        if (!projectId) return;
        const originalHtml = btnElement ? btnElement.innerHTML : null;
        if (btnElement) {
            btnElement.disabled = true;
            btnElement.innerHTML = `
                <span class="spinner-small" style="display:inline-block; width:12px; height:12px; border:2px solid currentColor; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite;"></span>
                <span>Generating PDF...</span>
            `;
        }

        try {
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };
            const queryParam = storedUser?.email ? `&email=${encodeURIComponent(storedUser.email)}` : '';
            
            // First attempt to fetch reports filtered by type=weekly from student_reports
            let res = await fetch(`${apiBase}/faculty/projects/${projectId}/student-reports/download?token=${encodeURIComponent(token || '')}${queryParam}&format=json&type=weekly`, { headers });
            let data = res.ok ? await res.json().catch(() => null) : null;
            let reports = (data && data.reports && data.reports.length > 0) ? data.reports : [];

            // If no explicit weekly type, fetch all reports from student_reports for this project
            if (reports.length === 0) {
                res = await fetch(`${apiBase}/faculty/projects/${projectId}/student-reports/download?token=${encodeURIComponent(token || '')}${queryParam}&format=json`, { headers });
                if (res.ok) {
                    data = await res.json().catch(() => null);
                    reports = (data && data.reports && data.reports.length > 0) ? data.reports : [];
                }
            }

            if (!reports || reports.length === 0) {
                showFacultyErrorPopup('No Reports Found', `No student reports found in student_reports for "${projectTitle}".`);
                return;
            }

            await generateAndDownloadProjectWeeklyPDF(data, reports, projectTitle);
            actionMessage = `✓ Weekly report PDF downloaded successfully from student_reports for "${projectTitle}".`;
            render();
        } catch (err) {
            console.error('Error generating project weekly PDF:', err);
            showFacultyErrorPopup('PDF Generation Failed', err.message || 'Could not generate weekly PDF report.');
        } finally {
            if (btnElement && originalHtml) {
                btnElement.disabled = false;
                btnElement.innerHTML = originalHtml;
            }
        }
    }

    // ==========================================
    // PDF GENERATOR: CONSOLIDATED PROJECT WEEKLY REPORT (EXCLUSIVELY FROM student_reports)
    // ==========================================
    async function generateAndDownloadProjectWeeklyPDF(data, reports, projectTitle) {
        const rawProjectTitle = projectTitle || data.project_title || 'Assigned Project';
        const safeProjectTitle = rawProjectTitle.replace(/[^a-zA-Z0-9_\-]/g, '_');
        const exportDate = new Date().toISOString().substring(0, 10);
        const totalWeeklyHours = reports.reduce((acc, r) => acc + (parseFloat(r.hours_worked) || 0), 0).toFixed(1);

        const printableHtml = `
            <div id="pdf-project-weekly-report-wrapper" style="font-family: Arial, Helvetica, sans-serif; color: #1e293b; background: #ffffff; padding: 26px 30px; width: 750px; box-sizing: border-box; line-height: 1.45;">
                <!-- Header -->
                <div style="border-bottom: 2px solid #087f5b; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <div style="font-size: 14px; font-weight: 800; color: #087f5b; letter-spacing: 0.04em; text-transform: uppercase;">Rajagiri College of Social Sciences (Autonomous)</div>
                        <div style="font-size: 11px; font-weight: 600; color: #64748b; margin-top: 2px;">R-Labz Software Development &amp; Research Center</div>
                        <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 8px;">PROJECT WEEKLY WORK REPORT</div>
                    </div>
                    <div style="text-align: right;">
                        <span style="display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; background: #dcfce7; color: #166534; border: 1px solid #bbf7d0;">
                            WEEKLY REPORT
                        </span>
                        <div style="font-size: 11px; color: #64748b; margin-top: 5px;">Export Date: <strong>${exportDate}</strong></div>
                    </div>
                </div>

                <!-- Project Information Banner -->
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px;">
                    <div>
                        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.04em; margin-bottom: 3px;">Project Title</div>
                        <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${rawProjectTitle}</div>
                    </div>
                    <div>
                        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.04em; margin-bottom: 3px;">Total Submissions</div>
                        <div style="font-size: 13px; font-weight: 700; color: #087f5b;">${reports.length} Reports</div>
                    </div>
                    <div>
                        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.04em; margin-bottom: 3px;">Total Hours Logged</div>
                        <div style="font-size: 13px; font-weight: 700; color: #0284c7;">${totalWeeklyHours} hrs</div>
                    </div>
                </div>

                <!-- Summary Table of Reports in student_reports -->
                <div style="margin-bottom: 18px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #334155; margin-bottom: 6px;">Weekly Report Submissions (student_reports)</div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; border: 1px solid #e2e8f0;">
                        <thead>
                            <tr style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1; text-align: left;">
                                <th style="padding: 6px 8px; font-weight: 700; color: #475569;">Student</th>
                                <th style="padding: 6px 8px; font-weight: 700; color: #475569;">Week Period / Date</th>
                                <th style="padding: 6px 8px; font-weight: 700; color: #475569;">Task &amp; Module</th>
                                <th style="padding: 6px 8px; font-weight: 700; color: #475569; text-align: center;">Hours</th>
                                <th style="padding: 6px 8px; font-weight: 700; color: #475569; text-align: right;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reports.map(r => `
                                <tr style="border-bottom: 1px solid #e2e8f0;">
                                    <td style="padding: 6px 8px; font-weight: 600; color: #0f172a;">${r.student_name || 'Student'}</td>
                                    <td style="padding: 6px 8px; color: #475569;">${(r.week_start && r.week_end) ? `${r.week_start} to ${r.week_end}` : (r.report_date || '-')}</td>
                                    <td style="padding: 6px 8px; color: #334155;">${r.task_title || 'General Task'} <span style="color: #64748b;">(${r.module_name || 'General'})</span></td>
                                    <td style="padding: 6px 8px; text-align: center; font-weight: 600; color: #087f5b;">${r.hours_worked ? parseFloat(r.hours_worked).toFixed(1) : '-'} hrs</td>
                                    <td style="padding: 6px 8px; text-align: right; text-transform: uppercase; font-weight: 700; font-size: 10px; color: ${(r.approval_status || '').toLowerCase() === 'approved' ? '#166534' : '#64748b'};">${(r.approval_status || 'pending').toUpperCase()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Detailed Report Cards for Each Weekly Submission -->
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #334155; margin-bottom: 8px;">Detailed Weekly Report Entries</div>
                    ${reports.map((r, idx) => `
                        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; margin-bottom: 12px; page-break-inside: avoid;">
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 8px;">
                                <div>
                                    <span style="font-size: 12px; font-weight: 700; color: #0f172a;">#${idx + 1}. ${r.student_name || 'Student'}</span>
                                    <span style="font-size: 10px; color: #64748b; margin-left: 6px;">(${r.student_email || 'No email'})</span>
                                </div>
                                <div style="font-size: 10px; color: #087f5b; font-weight: 600;">
                                    Period: ${(r.week_start && r.week_end) ? `${r.week_start} to ${r.week_end}` : (r.report_date || '-')}
                                </div>
                            </div>

                            <!-- Work Done / Summary -->
                            <div style="margin-bottom: 8px;">
                                <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 2px;">Work Done / Weekly Summary (student_reports)</div>
                                <div style="background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 4px; padding: 6px 10px; font-size: 11px; color: #1e293b; white-space: pre-wrap; word-break: break-word;">${r.work_done || 'None recorded'}</div>
                            </div>

                            <!-- Tasks Completed -->
                            <div style="margin-bottom: 8px;">
                                <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 2px;">Tasks Completed</div>
                                <div style="background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 4px; padding: 6px 10px; font-size: 10.5px; color: #1e293b; white-space: pre-wrap; word-break: break-word;">${r.tasks_completed || 'None recorded'}</div>
                            </div>

                            <!-- Next Plan & Challenges Grid -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                                <div>
                                    <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 2px;">Next Plan</div>
                                    <div style="background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 4px; padding: 5px 8px; font-size: 10px; color: #334155;">${r.next_plan || 'None recorded'}</div>
                                </div>
                                <div>
                                    <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 2px;">Challenges / Blockers</div>
                                    <div style="background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 4px; padding: 5px 8px; font-size: 10px; color: #334155;">${r.challenges || 'None reported'}</div>
                                </div>
                            </div>

                            <!-- Faculty Assessment & Feedback -->
                            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #166534;">
                                <div><strong>Faculty Feedback:</strong> ${r.feedback || 'None provided yet'}</div>
                                <div><strong>Status:</strong> ${(r.approval_status || 'PENDING').toUpperCase()}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Footer -->
                <div style="border-top: 1px solid #cbd5e1; padding-top: 10px; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8;">
                    <div>Official Student Weekly Report &bull; Data from student_reports table exclusively</div>
                    <div>Exported on ${new Date().toLocaleString()}</div>
                </div>
            </div>
        `;

        const temp = document.createElement('div');
        temp.style.position = 'absolute';
        temp.style.left = '-9999px';
        temp.style.top = '0';
        temp.style.width = '750px';
        temp.innerHTML = printableHtml;
        document.body.appendChild(temp);

        try {
            await html2pdf().set({
                margin: [0.35, 0.4, 0.35, 0.4],
                filename: `Weekly_Report_${safeProjectTitle}_${exportDate}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: 'css', avoid: 'tr' }
            }).from(temp.firstElementChild).save();
        } finally {
            document.body.removeChild(temp);
        }
    }

    // Helper to calculate week start (Monday) and week end (Sunday) safely
    function getWeekRange(dateStr) {
        if (!dateStr) return { start: '', end: '', label: '' };
        const parts = dateStr.split('-');
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dt = new Date(y, m, d);
        const day = dt.getDay();
        const diffToMon = dt.getDate() - day + (day === 0 ? -6 : 1);
        const mon = new Date(y, m, diffToMon);
        const sun = new Date(mon);
        sun.setDate(mon.getDate() + 6);

        const pad = (n) => String(n).padStart(2, '0');
        const startStr = `${mon.getFullYear()}-${pad(mon.getMonth() + 1)}-${pad(mon.getDate())}`;
        const endStr = `${sun.getFullYear()}-${pad(sun.getMonth() + 1)}-${pad(sun.getDate())}`;
        return {
            start: startStr,
            end: endStr,
            label: `${startStr} to ${endStr}`
        };
    }

    // ==========================================
    // DOWNLOAD DAILY REPORT AS PDF (EXCLUSIVELY FROM student_reports TABLE)
    // ==========================================
    async function handleDownloadDailyReportPDF(studentId, studentName, chosenDate, btnElement) {
        if (!chosenDate) {
            showFacultyErrorPopup('Date Required', 'Please select a date from student_reports.');
            return;
        }

        const originalHtml = btnElement.innerHTML;
        btnElement.disabled = true;
        btnElement.innerHTML = `<span class="spinner-small" style="display:inline-block; width:10px; height:10px; border:2px solid currentColor; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite;"></span>`;

        try {
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };
            const queryParam = storedUser?.email ? `&email=${encodeURIComponent(storedUser.email)}` : '';
            const res = await fetch(`${apiBase}/faculty/projects/${selectedProjectId}/students/${studentId}/reports?date=${encodeURIComponent(chosenDate)}${queryParam}`, { headers });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to fetch student report data.');
            }

            const data = await res.json();
            const rep = (data.reports && data.reports.length > 0) 
                ? data.reports.find(r => r.report_date === chosenDate) || data.reports[0]
                : (data.all_reports || []).find(r => r.report_date === chosenDate);

            if (!rep) {
                showFacultyErrorPopup('No Report Found', `No report entry was found in student_reports for date ${chosenDate}.`);
                return;
            }

            await generateAndDownloadDailyPDF(data, rep, chosenDate, studentName);
            actionMessage = `✓ Work report PDF downloaded from student_reports for ${studentName} (${chosenDate}).`;
            render();
        } catch (err) {
            console.error('Daily PDF Error:', err);
            showFacultyErrorPopup('Download Error', err.message || 'Could not generate Daily Report PDF.');
        } finally {
            btnElement.disabled = false;
            btnElement.innerHTML = originalHtml;
        }
    }

    // ==========================================
    // DOWNLOAD WEEKLY REPORT AS PDF (EXCLUSIVELY FROM student_reports TABLE)
    // ==========================================
    async function handleDownloadWeeklyReportPDF(studentId, studentName, btnElement) {
        const originalHtml = btnElement.innerHTML;
        btnElement.disabled = true;
        btnElement.innerHTML = `<span>Generating...</span>`;

        try {
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };
            const queryParam = storedUser?.email ? `&email=${encodeURIComponent(storedUser.email)}` : '';
            const res = await fetch(`${apiBase}/faculty/projects/${selectedProjectId}/students/${studentId}/reports?type=weekly${queryParam}`, { headers });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to fetch student weekly report.');
            }

            const data = await res.json();
            const weeklyReports = (data.weekly_reports && data.weekly_reports.length > 0) 
                ? data.weekly_reports 
                : (data.reports && data.reports.length > 0 ? data.reports : []);

            if (!weeklyReports || weeklyReports.length === 0) {
                showFacultyErrorPopup('No Weekly Report', `No weekly report has been submitted in student_reports for ${studentName}.`);
                return;
            }

            const weeklyRep = weeklyReports[0];
            await generateAndDownloadWeeklyPDF(data, weeklyRep, studentName);
            actionMessage = `✓ Weekly work report PDF downloaded from student_reports for ${studentName}.`;
            render();
        } catch (err) {
            console.error('Weekly PDF Error:', err);
            showFacultyErrorPopup('Download Error', err.message || 'Could not generate Weekly Report PDF.');
        } finally {
            btnElement.disabled = false;
            btnElement.innerHTML = originalHtml;
        }
    }

    // ==========================================
    // PDF GENERATOR: DAILY WORK REPORT (EXCLUSIVELY FROM student_reports)
    // ==========================================
    async function generateAndDownloadDailyPDF(data, rep, reportDate, studentName) {
        const student = data.student || { name: studentName, email: '', designation: 'Student Intern' };
        const project = data.project || projectDetail?.project || {};

        const workDone = rep.work_done || 'No description recorded in student_reports.';
        const tasksCompleted = rep.tasks_completed || 'None recorded';
        const nextPlan = rep.next_plan || 'None recorded';
        const challenges = rep.challenges || 'None reported';
        const remarks = rep.remarks || 'None';
        const feedback = rep.feedback || 'None provided yet';
        const status = (rep.approval_status || 'pending').toUpperCase();
        const totalHours = rep.hours_worked ? parseFloat(rep.hours_worked).toFixed(1) : '-';
        const reportType = (rep.report_type || 'daily').toUpperCase();
        const reportFile = rep.report_file || null;
        const submittedAt = rep.submitted_at || rep.created_at || 'N/A';
        const taskTitle = rep.task_title || (rep.task_id ? `Task #${rep.task_id}` : 'General Project Work');
        const moduleName = rep.module_name || 'General';

        const rawProjectTitle = project.title || 'Project';
        const safeStudentName = (student.name || 'Student').replace(/[^a-zA-Z0-9_\-]/g, '_');

        const printableHtml = `
            <div id="pdf-daily-report-wrapper" style="font-family: Arial, Helvetica, sans-serif; color: #1e293b; background: #ffffff; padding: 26px 30px; width: 750px; box-sizing: border-box; line-height: 1.45;">
                <!-- Header -->
                <div style="border-bottom: 2px solid #087f5b; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <div style="font-size: 14px; font-weight: 800; color: #087f5b; letter-spacing: 0.04em; text-transform: uppercase;">Rajagiri College of Social Sciences (Autonomous)</div>
                        <div style="font-size: 11px; font-weight: 600; color: #64748b; margin-top: 2px;">R-Labz Software Development &amp; Research Center</div>
                        <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 8px;">STUDENT WORK REPORT (${reportType})</div>
                    </div>
                    <div style="text-align: right;">
                        <span style="display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; background: ${status === 'APPROVED' ? '#dcfce7' : (status === 'REJECTED' ? '#fee2e2' : '#fef3c7')}; color: ${status === 'APPROVED' ? '#166534' : (status === 'REJECTED' ? '#991b1b' : '#92400e')}; border: 1px solid ${status === 'APPROVED' ? '#bbf7d0' : (status === 'REJECTED' ? '#fecaca' : '#fde68a')};">
                            ${status}
                        </span>
                        <div style="font-size: 11px; color: #64748b; margin-top: 5px;">Report Date: <strong>${rep.report_date || reportDate}</strong></div>
                    </div>
                </div>

                <!-- Meta Cards Grid -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px;">
                        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.04em; margin-bottom: 4px;">Student Information</div>
                        <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${student.name || 'Student'}</div>
                        <div style="font-size: 11px; color: #475569;">Email: ${student.email || 'N/A'}</div>
                        <div style="font-size: 11px; color: #475569;">Role: ${student.designation || 'Student Developer'}</div>
                    </div>
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px;">
                        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.04em; margin-bottom: 4px;">Project Information</div>
                        <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${rawProjectTitle}</div>
                        <div style="font-size: 11px; color: #475569;">Client: ${project.client_name || 'Rajagiri College'}</div>
                        <div style="font-size: 11px; color: #475569;">Hours Logged: <strong style="color: #087f5b;">${totalHours} ${totalHours !== '-' ? 'hrs' : ''}</strong></div>
                    </div>
                </div>

                <!-- Assignment & Scope Table (from student_reports) -->
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #334155; margin-bottom: 6px;">Report Assignment &amp; Scope</div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #e2e8f0;">
                        <thead>
                            <tr style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1; text-align: left;">
                                <th style="padding: 6px 10px; font-weight: 700; color: #475569;">Task Title</th>
                                <th style="padding: 6px 10px; font-weight: 700; color: #475569;">Module</th>
                                <th style="padding: 6px 10px; font-weight: 700; color: #475569;">Report Type</th>
                                <th style="padding: 6px 10px; font-weight: 700; color: #475569;">Submitted At</th>
                                <th style="padding: 6px 10px; font-weight: 700; color: #475569; text-align: right;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 6px 10px; font-weight: 600; color: #0f172a;">${taskTitle}</td>
                                <td style="padding: 6px 10px; color: #64748b;">${moduleName}</td>
                                <td style="padding: 6px 10px; color: #087f5b; font-weight: 700;">${reportType}</td>
                                <td style="padding: 6px 10px; color: #64748b;">${submittedAt}</td>
                                <td style="padding: 6px 10px; text-align: right; text-transform: uppercase; font-weight: 700; font-size: 10px; color: ${(status === 'APPROVED') ? '#166534' : '#64748b'};">${status}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Work Done Section (from student_reports.work_done) -->
                <div style="margin-bottom: 14px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #334155; margin-bottom: 6px;">Work Done / Description (student_reports)</div>
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 14px; font-size: 12px; color: #1e293b; white-space: pre-wrap; word-break: break-word;">${workDone}</div>
                </div>

                <!-- Tasks Completed Section (from student_reports.tasks_completed) -->
                <div style="margin-bottom: 14px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #334155; margin-bottom: 6px;">Tasks Completed (student_reports)</div>
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; font-size: 11px; color: #1e293b; white-space: pre-wrap; word-break: break-word;">${tasksCompleted}</div>
                </div>

                <!-- Next Plan & Challenges Grid (from student_reports) -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                    <div>
                        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #334155; margin-bottom: 6px;">Next Plan</div>
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; font-size: 11px; color: #334155; min-height: 44px; white-space: pre-wrap; word-break: break-word;">${nextPlan}</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #334155; margin-bottom: 6px;">Challenges / Blockers</div>
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; font-size: 11px; color: #334155; min-height: 44px; white-space: pre-wrap; word-break: break-word;">${challenges}</div>
                    </div>
                </div>

                <!-- Remarks & Attached File (from student_reports) -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                    <div>
                        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #334155; margin-bottom: 6px;">Remarks</div>
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; font-size: 11px; color: #334155; min-height: 38px;">${remarks}</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #334155; margin-bottom: 6px;">Attached File</div>
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; font-size: 11px; color: #334155; min-height: 38px;">${reportFile || 'None'}</div>
                    </div>
                </div>

                <!-- Faculty Assessment Box (from student_reports.feedback & approval_status) -->
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin-bottom: 18px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #166534;">Faculty Assessment &amp; Feedback</span>
                        <span style="font-size: 11px; font-weight: 700; color: #166534;">Status: ${status}</span>
                    </div>
                    <div style="font-size: 11px; color: #166534;">
                        <strong>Faculty Feedback:</strong> ${feedback}
                    </div>
                </div>

                <!-- Footer -->
                <div style="border-top: 1px solid #cbd5e1; padding-top: 10px; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8;">
                    <div>Official Student Report &bull; Data from student_reports table exclusively</div>
                    <div>Exported on ${new Date().toLocaleString()}</div>
                </div>
            </div>
        `;

        const temp = document.createElement('div');
        temp.style.position = 'absolute';
        temp.style.left = '-9999px';
        temp.style.top = '0';
        temp.style.width = '750px';
        temp.innerHTML = printableHtml;
        document.body.appendChild(temp);

        try {
            await html2pdf().set({
                margin: [0.35, 0.4, 0.35, 0.4],
                filename: `Report_${safeStudentName}_${reportDate}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: 'css', avoid: 'tr' }
            }).from(temp.firstElementChild).save();
        } finally {
            document.body.removeChild(temp);
        }
    }

    // ==========================================
    // PDF GENERATOR: WEEKLY WORK REPORT (EXCLUSIVELY FROM student_reports)
    // ==========================================
    async function generateAndDownloadWeeklyPDF(data, weeklyRep, studentName) {
        const student = data.student || { name: studentName, email: '', designation: 'Student Intern' };
        const project = data.project || projectDetail?.project || {};

        const weekStartStr = weeklyRep.week_start || '-';
        const weekEndStr = weeklyRep.week_end || '-';
        const periodLabel = (weeklyRep.week_start && weeklyRep.week_end) ? `${weeklyRep.week_start} to ${weeklyRep.week_end}` : (weeklyRep.report_date || 'Consolidated Week');

        const workDone = weeklyRep.work_done || 'No weekly description recorded in student_reports.';
        const tasksCompleted = weeklyRep.tasks_completed || 'None recorded';
        const nextPlan = weeklyRep.next_plan || 'None recorded';
        const challenges = weeklyRep.challenges || 'None reported';
        const remarks = weeklyRep.remarks || 'None';
        const feedback = weeklyRep.feedback || 'None provided yet';
        const weeklyKey = weeklyRep.weekly_key || '-';
        const reportFile = weeklyRep.report_file || null;
        const submittedAt = weeklyRep.submitted_at || weeklyRep.created_at || 'N/A';
        const status = (weeklyRep.approval_status || 'pending').toUpperCase();
        const totalWeekHours = weeklyRep.hours_worked ? parseFloat(weeklyRep.hours_worked).toFixed(1) : '-';
        const taskTitle = weeklyRep.task_title || (weeklyRep.task_id ? `Task #${weeklyRep.task_id}` : 'Weekly Milestone');
        const moduleName = weeklyRep.module_name || 'General';

        const safeStudentName = (student.name || 'Student').replace(/[^a-zA-Z0-9_\-]/g, '_');
        const rawProjectTitle = project.title || 'Project';

        const printableHtml = `
            <div id="pdf-weekly-report-wrapper" style="font-family: Arial, Helvetica, sans-serif; color: #1e293b; background: #ffffff; padding: 26px 30px; width: 750px; box-sizing: border-box; line-height: 1.45;">
                <!-- Header -->
                <div style="border-bottom: 2px solid #087f5b; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <div style="font-size: 14px; font-weight: 800; color: #087f5b; letter-spacing: 0.04em; text-transform: uppercase;">Rajagiri College of Social Sciences (Autonomous)</div>
                        <div style="font-size: 11px; font-weight: 600; color: #64748b; margin-top: 2px;">R-Labz Software Development &amp; Research Center</div>
                        <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 8px;">STUDENT WEEKLY WORK REPORT</div>
                    </div>
                    <div style="text-align: right;">
                        <span style="display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; background: ${status === 'APPROVED' ? '#dcfce7' : (status === 'REJECTED' ? '#fee2e2' : '#fef3c7')}; color: ${status === 'APPROVED' ? '#166534' : (status === 'REJECTED' ? '#991b1b' : '#92400e')}; border: 1px solid ${status === 'APPROVED' ? '#bbf7d0' : (status === 'REJECTED' ? '#fecaca' : '#fde68a')};">
                            ${status}
                        </span>
                        <div style="font-size: 11px; color: #64748b; margin-top: 5px;">Week Period: <strong>${periodLabel}</strong></div>
                    </div>
                </div>

                <!-- Meta Cards Grid -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px;">
                        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.04em; margin-bottom: 4px;">Student Information</div>
                        <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${student.name || 'Student'}</div>
                        <div style="font-size: 11px; color: #475569;">Email: ${student.email || 'N/A'}</div>
                        <div style="font-size: 11px; color: #475569;">Role: ${student.designation || 'Student Developer'}</div>
                    </div>
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px;">
                        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.04em; margin-bottom: 4px;">Project Information</div>
                        <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${rawProjectTitle}</div>
                        <div style="font-size: 11px; color: #475569;">Client: ${project.client_name || 'Rajagiri College'}</div>
                        <div style="font-size: 11px; color: #475569;">Weekly Hours: <strong style="color: #087f5b;">${totalWeekHours} ${totalWeekHours !== '-' ? 'hrs' : ''}</strong></div>
                    </div>
                </div>

                <!-- Weekly Report Scope (from student_reports) -->
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #334155; margin-bottom: 6px;">Weekly Assignment &amp; Submission</div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #e2e8f0;">
                        <thead>
                            <tr style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1; text-align: left;">
                                <th style="padding: 6px 10px; font-weight: 700; color: #475569;">Task / Module</th>
                                <th style="padding: 6px 10px; font-weight: 700; color: #475569;">Week Start</th>
                                <th style="padding: 6px 10px; font-weight: 700; color: #475569;">Week End</th>
                                <th style="padding: 6px 10px; font-weight: 700; color: #475569;">Weekly Key</th>
                                <th style="padding: 6px 10px; font-weight: 700; color: #475569;">Submitted At</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 6px 10px; font-weight: 600; color: #0f172a;">${taskTitle} (${moduleName})</td>
                                <td style="padding: 6px 10px; color: #64748b;">${weekStartStr}</td>
                                <td style="padding: 6px 10px; color: #64748b;">${weekEndStr}</td>
                                <td style="padding: 6px 10px; color: #087f5b; font-weight: 600;">${weeklyKey}</td>
                                <td style="padding: 6px 10px; color: #64748b;">${submittedAt}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Work Done Section (from student_reports.work_done) -->
                <div style="margin-bottom: 14px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #334155; margin-bottom: 6px;">Work Done / Weekly Summary (student_reports)</div>
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 14px; font-size: 12px; color: #1e293b; white-space: pre-wrap; word-break: break-word;">${workDone}</div>
                </div>

                <!-- Tasks Completed (from student_reports.tasks_completed) -->
                <div style="margin-bottom: 14px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #334155; margin-bottom: 6px;">Tasks Completed (student_reports)</div>
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; font-size: 11px; color: #1e293b; white-space: pre-wrap; word-break: break-word;">${tasksCompleted}</div>
                </div>

                <!-- Next Plan & Challenges Grid (from student_reports) -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                    <div>
                        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #334155; margin-bottom: 6px;">Next Plan</div>
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; font-size: 11px; color: #334155; min-height: 44px; white-space: pre-wrap; word-break: break-word;">${nextPlan}</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #334155; margin-bottom: 6px;">Challenges / Blockers</div>
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; font-size: 11px; color: #334155; min-height: 44px; white-space: pre-wrap; word-break: break-word;">${challenges}</div>
                    </div>
                </div>

                <!-- Remarks & Attached File (from student_reports) -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                    <div>
                        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #334155; margin-bottom: 6px;">Remarks</div>
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; font-size: 11px; color: #334155; min-height: 38px;">${remarks}</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #334155; margin-bottom: 6px;">Attached File</div>
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; font-size: 11px; color: #334155; min-height: 38px;">${reportFile || 'None'}</div>
                    </div>
                </div>

                <!-- Faculty Assessment Box (from student_reports.feedback & approval_status) -->
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #166534;">Faculty Assessment &amp; Feedback</span>
                        <span style="font-size: 11px; font-weight: 700; color: #166534;">Status: ${status}</span>
                    </div>
                    <div style="font-size: 11px; color: #166534;">
                        <strong>Faculty Feedback:</strong> ${feedback}
                    </div>
                </div>

                <!-- Footer -->
                <div style="border-top: 1px solid #cbd5e1; padding-top: 10px; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8;">
                    <div>Official Student Weekly Report &bull; Data from student_reports table exclusively</div>
                    <div>Exported on ${new Date().toLocaleString()}</div>
                </div>
            </div>
        `;

        const temp = document.createElement('div');
        temp.style.position = 'absolute';
        temp.style.left = '-9999px';
        temp.style.top = '0';
        temp.style.width = '750px';
        temp.innerHTML = printableHtml;
        document.body.appendChild(temp);

        try {
            await html2pdf().set({
                margin: [0.35, 0.4, 0.35, 0.4],
                filename: `Weekly_Report_${safeStudentName}_${weekStartStr}_to_${weekEndStr}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: 'css', avoid: 'tr' }
            }).from(temp.firstElementChild).save();
        } finally {
            document.body.removeChild(temp);
        }
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
            <div style="background: var(--surface-card); border-radius: 12px; width: 480px; max-width: 92%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border: 1px solid var(--border-subtle); overflow: hidden;">
                <div style="padding: 1.15rem 1.5rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; background: var(--bg-canvas-light);">
                    <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #2563eb;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        Add Task Feedback
                    </h3>
                    <button id="btn-close-task-feedback-modal" style="background: none; border: none; font-size: 1.3rem; color: var(--text-muted); cursor: pointer; line-height: 1;">&times;</button>
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
    // 6. NOTIFY COORDINATOR ACTION
    // ==========================================
    async function handleNotifyCoordinator(logId, btn) {
        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `
            <span class="spinner-small" style="display:inline-block; width:12px; height:12px; border:2px solid currentColor; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite;"></span>
            <span>Alerting...</span>
        `;

        try {
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };

            const res = await fetch(`${apiBase}/faculty/work-logs/${logId}/notify-coordinator`, {
                method: 'POST',
                headers
            });

            const data = await res.json();
            if (res.ok && data.success) {
                // Update in-memory log
                if (projectDetail && projectDetail.work_logs) {
                    const logObj = projectDetail.work_logs.find(l => String(l.id) === String(logId));
                    if (logObj) {
                        logObj.coordinator_notified = true;
                    }
                }

                actionMessage = `✓ ${data.message || 'Coordinator notified successfully.'}`;
                render();
            } else {
                throw new Error(data.error || data.message || 'Failed to notify coordinator.');
            }
        } catch (err) {
            console.error('Notify coordinator error:', err);
            btn.innerHTML = originalHtml;
            btn.disabled = false;
            showFacultyErrorPopup('Notification Error', err.message || 'Could not notify coordinator. Please try again.');
        }
    }

    // ==========================================
    // 7. DATA FETCHING HELPERS
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

    async function loadProjectWorkLogs(projectId, forceRefresh = false) {
        if (!forceRefresh && workLogsCache.has(projectId)) {
            projectDetail = workLogsCache.get(projectId);
            isLoadingWorkLogs = false;
            currentView = 'work-logs-view';
            render();
            // Perform quick background refresh without blocking user interaction
            fetchProjectWorkLogsInBackground(projectId);
            return;
        }

        isLoadingWorkLogs = true;
        currentView = 'work-logs-view';
        render();

        try {
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };
            const queryParam = storedUser?.email ? `?email=${encodeURIComponent(storedUser.email)}` : '';
            const res = await fetch(`${apiBase}/faculty/projects/${projectId}/work-logs${queryParam}`, { headers });

            if (res.ok) {
                projectDetail = await res.json();
                workLogsCache.set(projectId, projectDetail);
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

    async function fetchProjectWorkLogsInBackground(projectId) {
        try {
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };
            const queryParam = storedUser?.email ? `?email=${encodeURIComponent(storedUser.email)}` : '';
            const res = await fetch(`${apiBase}/faculty/projects/${projectId}/work-logs${queryParam}`, { headers });
            if (res.ok) {
                const freshData = await res.json();
                workLogsCache.set(projectId, freshData);
                if (currentView === 'work-logs-view' && selectedProjectId === projectId) {
                    projectDetail = freshData;
                    render();
                }
            }
        } catch (_) {}
    }

    render();
    loadAssignedProjects();

    return container;
}

export default FacultyVerifyTasks;
