import '../faculty.css';
import { showFacultySuccessPopup, showFacultyErrorPopup, showCustomConfirmModal } from '../facultyPopup.js';

export function FacultySprints() {
    const container = document.createElement('div');
    container.className = 'faculty-sprints';

    let storedUser = null;
    try {
        storedUser = JSON.parse(localStorage.getItem('user'));
    } catch (e) {
        storedUser = null;
    }

    const token = localStorage.getItem('token');
    const apiBase = window.location.port === '8000' ? '/api' : 'http://127.0.0.1:8000/api';

    // State management
    let currentView = 'project-list'; // 'project-list' | 'project-detail'
    let assignedProjects = [];
    let selectedProjectId = null;
    let projectDetail = null; // { project, project_students, modules, tasks }
    let activeTab = 'assign-module'; // 'assign-module' | 'assign-task'
    let isLoadingProjects = true;
    let isLoadingDetail = false;
    let searchQuery = '';

    // State for student dropdown in Assign Module
    let selectedStudentIdsForModule = new Set();
    let isStudentDropdownOpen = false;

    const todayStr = new Date().toISOString().split('T')[0];

    // Standard Monochromatic Stroke SVG Icons (No Emojis)
    const iconFolder = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`;
    const iconTask = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px;"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`;
    const iconLayers = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px;"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`;
    const iconList = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px;"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`;
    const iconUser = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
    const iconCalendar = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;

    function render() {
        if (currentView === 'project-list') {
            renderProjectListView();
        } else {
            renderProjectDetailView();
        }
    }

    // ==========================================
    // 1. PROJECT LIST VIEW (MATCHING MY PROJECT)
    // ==========================================
    function renderProjectListView() {
        container.innerHTML = `
            <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
                <div>
                    <h1>Assign Module & Task</h1>
                    <p>Select a project assigned to you to configure modules, assign student teams, and distribute tasks.</p>
                </div>
                <div style="position: relative; width: 320px; max-width: 100%;">
                    <input 
                        type="text" 
                        id="input-search-sprints-project" 
                        class="premium-input" 
                        placeholder="Search project by name..." 
                        value="${searchQuery}" 
                        style="padding-left: 2.25rem; font-size: 0.88rem; height: 40px; border-radius: 8px;"
                    />
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 12px; top: 13px; color: #94a3b8;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
            </div>

            <div class="faculty-card-panel" style="padding: 0; overflow: hidden;">
                <table class="premium-table" style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="background: var(--bg-main, #f8fafc); border-bottom: 2px solid var(--border-color, #e2e8f0);">
                            <th style="padding: 1rem 1.5rem; font-size: 0.85rem; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em;">Project Title</th>
                            <th style="padding: 1rem 1.5rem; font-size: 0.85rem; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em;">Client Name</th>
                            <th style="padding: 1rem 1.5rem; font-size: 0.85rem; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em;">Project Type</th>
                            <th style="padding: 1rem 1.5rem; font-size: 0.85rem; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em;">Status</th>
                            <th style="padding: 1rem 1.5rem; font-size: 0.85rem; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em; text-align: right;">Action</th>
                        </tr>
                    </thead>
                    <tbody id="projects-table-body">
                        ${renderProjectRows()}
                    </tbody>
                </table>
            </div>
            <style>
                .faculty-sprints .project-row-clickable:hover {
                    background: var(--bg-surface, #f8fafc) !important;
                }
                .faculty-sprints .project-row-clickable:hover td:first-child {
                    color: var(--primary, #059669) !important;
                }
            </style>
        `;

        setupProjectListListeners();
    }

    function renderProjectRows() {
        if (isLoadingProjects) {
            return `<tr><td colspan="5" style="text-align: center; color: var(--text-muted, #64748b); padding: 2.5rem; font-size: 0.95rem;">Loading assigned projects...</td></tr>`;
        }

        const query = searchQuery.trim().toLowerCase();
        const filteredProjects = query
            ? assignedProjects.filter(p => (p.title || p.name || '').toLowerCase().includes(query))
            : assignedProjects;

        if (!filteredProjects || filteredProjects.length === 0) {
            return `<tr><td colspan="5" style="text-align: center; color: var(--text-muted, #64748b); padding: 2.5rem; font-size: 0.95rem;">${query ? `No projects found matching "${searchQuery}".` : 'No projects currently assigned to you.'}</td></tr>`;
        }

        return filteredProjects.map(p => {
            const title = p.title || p.name || 'Untitled Project';
            const client = p.client_name || p.client || 'Department of Computer Science';
            const type = p.project_type || 'Web Application';
            const status = (p.status || 'in_progress').toLowerCase();

            return `
                <tr class="project-row-clickable" data-project-id="${p.id}" style="border-bottom: 1px solid var(--border-color, #e2e8f0); transition: background 0.15s ease; cursor: pointer;">
                    <td style="padding: 1.1rem 1.5rem; font-weight: 700; color: var(--text-main, #0f172a); font-size: 0.95rem;">
                        ${title}
                    </td>
                    <td style="padding: 1.1rem 1.5rem; color: var(--text-muted, #475569); font-size: 0.92rem;">
                        ${client}
                    </td>
                    <td style="padding: 1.1rem 1.5rem; color: var(--text-muted, #64748b); font-size: 0.9rem;">
                        ${type}
                    </td>
                    <td style="padding: 1.1rem 1.5rem;">
                        <span class="status-badge ${status.replace(' ', '_')}">
                            ${status.toUpperCase()}
                        </span>
                    </td>
                    <td style="padding: 1.1rem 1.5rem; text-align: right;">
                        <button class="btn btn-sm btn-primary shadow-hover view-project-btn" data-id="${p.id}">
                            👁 View
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function setupProjectListListeners() {
        const searchInput = container.querySelector('#input-search-sprints-project');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value;
                const tbody = container.querySelector('#projects-table-body');
                if (tbody) {
                    tbody.innerHTML = renderProjectRows();
                    setupViewButtons();
                }
            });
        }
        setupViewButtons();
    }

    function setupViewButtons() {
        container.querySelectorAll('#projects-table-body tr.project-row-clickable').forEach(row => {
            row.addEventListener('click', (e) => {
                const btn = e.target.closest('.view-project-btn');
                const pId = parseInt(btn ? btn.getAttribute('data-id') : row.getAttribute('data-project-id'));
                if (pId) {
                    selectedProjectId = pId;
                    loadProjectDetail(pId);
                }
            });
        });
    }

    // ==========================================
    // 2. PROJECT DETAIL VIEW (MATCHING MY PROJECT)
    // ==========================================
    function renderProjectDetailView() {
        if (isLoadingDetail || !projectDetail) {
            container.innerHTML = `
                <div style="padding: 3rem; text-align: center;">
                    <p style="color: var(--text-muted, #64748b); font-size: 1rem;">Loading project modules, student teams, and tasks...</p>
                </div>
            `;
            return;
        }

        const project = projectDetail.project || {};
        const students = projectDetail.project_students || [];
        const modules = projectDetail.modules || [];
        const tasks = projectDetail.tasks || [];

        const rawTitle = project.title || 'Project Details';
        const projectTitle = rawTitle.replace(/\s*[-–—]\s*Student Portal/gi, '').replace(/Student Portal/gi, '').trim() || 'Project Details';
        const projectDesc = project.requirements || project.deliverables || 'Academic project under faculty supervision.';
        const clientName = project.client_name || 'Rajagiri College';
        const status = (project.status || 'in_progress').toLowerCase();
        const isClosed = status === 'closed';

        container.innerHTML = `
            <!-- Project Summary Header (Name & Short Description) with Back Button on top right -->
            <div class="faculty-card-panel" style="margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <h1 style="margin: 0; font-size: 1.45rem; font-weight: 700; color: var(--text-main, #0f172a);">${projectTitle}</h1>
                            <span class="status-badge ${status.replace(' ', '_')}">
                                ${status.toUpperCase()}
                            </span>
                        </div>
                        <p style="margin: 0.5rem 0 0; color: var(--text-muted, #475569); font-size: 0.92rem; line-height: 1.5; max-width: 850px;">
                            ${projectDesc}
                        </p>
                        <div style="margin-top: 0.75rem; font-size: 0.85rem; color: var(--text-muted, #64748b);">
                            Client: <strong style="color: var(--text-main, #0f172a);">${clientName}</strong> &nbsp;|&nbsp; 
                            Project Students: <strong style="color: var(--primary, #059669);">${students.length}</strong> &nbsp;|&nbsp; 
                            Modules: <strong style="color: var(--text-main, #0f172a);">${modules.length}</strong> &nbsp;|&nbsp; 
                            Tasks: <strong style="color: var(--text-main, #0f172a);">${tasks.length}</strong>
                        </div>
                    </div>
                    <div>
                        <button id="btn-back-projects" class="btn-back-nav" title="Return to Projects">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            <span>Back to Projects</span>
                        </button>
                    </div>
                </div>
            </div>

            ${isClosed ? `
                <div style="background: #fff1f2; border: 1px solid #fecaca; color: #991b1b; padding: 0.9rem 1.25rem; border-radius: 10px; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color: #dc2626; flex-shrink: 0;">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <div>
                        <strong style="display: block; font-size: 0.93rem; color: #991b1b;">Project Closed</strong>
                        <span style="font-size: 0.86rem; color: #7f1d1d;">This project has been marked as closed. Creating new modules, assigning modules, and assigning tasks are disabled.</span>
                    </div>
                </div>
            ` : ''}

            <!-- Sub Navigation Tabs: Assign Module | Assign Task | Existing Modules | Existing Tasks -->
            <div class="project-tabs" style="display: flex; gap: 0.5rem; border-bottom: 1px solid var(--border-color, #e2e8f0); margin-bottom: 1.5rem; flex-wrap: wrap;">
                <button id="tab-btn-assign-module" class="tab-btn ${activeTab === 'assign-module' ? 'active' : ''}" style="background: none; border: none; padding: 0.6rem 1.15rem; font-weight: 700; font-size: 0.92rem; cursor: pointer; border-bottom: 2px solid ${activeTab === 'assign-module' ? 'var(--primary, #059669)' : 'transparent'}; color: ${activeTab === 'assign-module' ? 'var(--primary, #059669)' : 'var(--text-muted, #64748b)'}; display: inline-flex; align-items: center; gap: 0.45rem;">
                    ${iconFolder} Assign Module ${isClosed ? '<span style="font-size: 0.7rem; background: #fee2e2; color: #991b1b; padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 700; margin-left: 0.25rem;">Closed</span>' : ''}
                </button>
                <button id="tab-btn-assign-task" class="tab-btn ${activeTab === 'assign-task' ? 'active' : ''}" style="background: none; border: none; padding: 0.6rem 1.15rem; font-weight: 700; font-size: 0.92rem; cursor: pointer; border-bottom: 2px solid ${activeTab === 'assign-task' ? 'var(--primary, #059669)' : 'transparent'}; color: ${activeTab === 'assign-task' ? 'var(--primary, #059669)' : 'var(--text-muted, #64748b)'}; display: inline-flex; align-items: center; gap: 0.45rem;">
                    ${iconTask} Assign Task ${isClosed ? '<span style="font-size: 0.7rem; background: #fee2e2; color: #991b1b; padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 700; margin-left: 0.25rem;">Closed</span>' : ''}
                </button>
                <button id="tab-btn-existing-modules" class="tab-btn ${activeTab === 'existing-modules' ? 'active' : ''}" style="background: none; border: none; padding: 0.6rem 1.15rem; font-weight: 700; font-size: 0.92rem; cursor: pointer; border-bottom: 2px solid ${activeTab === 'existing-modules' ? 'var(--primary, #059669)' : 'transparent'}; color: ${activeTab === 'existing-modules' ? 'var(--primary, #059669)' : 'var(--text-muted, #64748b)'}; display: inline-flex; align-items: center; gap: 0.45rem;">
                    ${iconLayers} Existing Modules
                    <span class="status-badge ${activeTab === 'existing-modules' ? 'completed' : 'todo'}" style="padding: 0.15rem 0.5rem; font-size: 0.72rem;">
                        ${modules.length}
                    </span>
                </button>
                <button id="tab-btn-existing-tasks" class="tab-btn ${activeTab === 'existing-tasks' ? 'active' : ''}" style="background: none; border: none; padding: 0.6rem 1.15rem; font-weight: 700; font-size: 0.92rem; cursor: pointer; border-bottom: 2px solid ${activeTab === 'existing-tasks' ? 'var(--primary, #059669)' : 'transparent'}; color: ${activeTab === 'existing-tasks' ? 'var(--primary, #059669)' : 'var(--text-muted, #64748b)'}; display: inline-flex; align-items: center; gap: 0.45rem;">
                    ${iconList} Existing Tasks
                    <span class="status-badge ${activeTab === 'existing-tasks' ? 'completed' : 'todo'}" style="padding: 0.15rem 0.5rem; font-size: 0.72rem;">
                        ${tasks.length}
                    </span>
                </button>
            </div>

            <!-- Feedback Message Banner -->
            <div id="action-msg-container" style="margin-bottom: 1.25rem;"></div>

            <!-- TAB CONTENT CONTAINER -->
            <div id="tab-content-area">
                ${renderActiveTabContent()}
            </div>
        `;

        setupProjectDetailListeners();
    }

    function renderActiveTabContent() {
        if (activeTab === 'assign-module') return renderAssignModuleSection();
        if (activeTab === 'assign-task') return renderAssignTaskSection();
        if (activeTab === 'existing-modules') return renderExistingModulesSection();
        if (activeTab === 'existing-tasks') return renderExistingTasksSection();
        return renderAssignModuleSection();
    }

    // -------------------------------------------------------------
    // 1. SECTION: ASSIGN MODULE FORM (FOCUSED VIEW WITHOUT LIST SQUISHING)
    // -------------------------------------------------------------
    function renderAssignModuleSection() {
        const project = projectDetail.project || {};
        const isClosed = (project.status || '').toLowerCase() === 'closed';

        if (isClosed) {
            return `
                <div style="max-width: 680px; margin: 0 auto;">
                    <div class="faculty-card-panel" style="text-align: center; padding: 3rem 2rem; border: 1px dashed #fca5a5; border-radius: 12px; background: #fff5f5;">
                        <div style="width: 54px; height: 54px; margin: 0 auto 1.25rem; border-radius: 50%; background: #fee2e2; color: #dc2626; display: flex; align-items: center; justify-content: center;">
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                        </div>
                        <h3 style="margin: 0 0 0.5rem; color: #991b1b; font-size: 1.2rem; font-weight: 700;">Module Assignment Disabled</h3>
                        <p style="color: #7f1d1d; font-size: 0.95rem; line-height: 1.5; margin: 0 auto 1.5rem; max-width: 480px;">
                            This project has been marked as <strong>Closed</strong>. You cannot create new modules or assign students to modules for closed projects.
                        </p>
                        <button type="button" id="btn-view-existing-modules" class="btn btn-outline btn-sm" style="color: #991b1b; border-color: #fca5a5; background: #ffffff;">
                            View Existing Modules →
                        </button>
                    </div>
                </div>
            `;
        }

        const students = projectDetail.project_students || [];
        const modules = projectDetail.modules || [];

        return `
            <div style="max-width: 680px; margin: 0 auto;">
                <div class="faculty-card-panel">
                    <h2 style="margin: 0 0 0.35rem; font-size: 1.18rem; font-weight: 700; color: var(--text-main, #0f172a);">Assign Module</h2>
                    <p style="margin: 0 0 1.25rem; font-size: 0.85rem; color: var(--text-muted, #64748b);">
                        Select a module from the <strong>modules table</strong> or create a new module, and assign multiple students from this project.
                    </p>

                    <form id="form-assign-module">
                        <!-- 1. MODULE DROPDOWN FROM MODULES TABLE -->
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-main, #0f172a); margin-bottom: 0.4rem;">
                                Select Module (from Modules table) *
                            </label>
                            <select id="select-module-dropdown" class="premium-input" required>
                                <option value="">-- Select a module from this project --</option>
                                ${modules.map(m => {
                                    const assigned = m.assigned_students || [];
                                    const isAssigned = assigned.length > 0;
                                    const names = assigned.map(s => s.name).join(', ');
                                    const label = isAssigned 
                                        ? `${m.module_name} — [Assigned: ${names}]` 
                                        : `${m.module_name} — [Unassigned]`;
                                    return `<option value="${m.id}" data-assigned="${isAssigned ? 'true' : 'false'}">${label}</option>`;
                                }).join('')}
                                <option value="new">+ Create New Module</option>
                            </select>
                            <div id="module-assignment-info-banner" style="display: none; margin-top: 0.6rem; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.85rem; line-height: 1.45;"></div>
                        </div>

                        <!-- DYNAMIC NEW MODULE FIELDS (ONLY SHOWN IF '+ Create New Module' IS SELECTED) -->
                        <div id="container-new-module" style="display: none; padding: 1rem; background: var(--bg-main, #f8fafc); border: 1px dashed var(--border-color, #cbd5e1); border-radius: var(--radius-md, 8px); margin-bottom: 1rem;">
                            <div class="form-group" style="margin-bottom: 0.75rem;">
                                <label style="display: block; font-size: 0.82rem; font-weight: 600; color: var(--text-main, #0f172a); margin-bottom: 0.35rem;">
                                    New Module Name *
                                </label>
                                <input
                                    type="text"
                                    id="input-new-module-name"
                                    class="premium-input"
                                    placeholder="e.g. Sprint 5: Payment Gateway & Invoicing"
                                />
                            </div>

                            <div class="form-group" style="margin-bottom: 0;">
                                <label style="display: block; font-size: 0.82rem; font-weight: 600; color: var(--text-main, #0f172a); margin-bottom: 0.35rem;">
                                    Description (Optional)
                                </label>
                                <textarea
                                    id="input-new-module-desc"
                                    class="premium-input"
                                    style="height: 60px; resize: vertical;"
                                    placeholder="Key deliverables and scope..."
                                ></textarea>
                            </div>
                        </div>

                        <!-- 2. MULTIPLE STUDENTS SELECTION IN A DROPDOWN -->
                        <div class="form-group" style="margin-bottom: 1.5rem; position: relative;">
                            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-main, #0f172a); margin-bottom: 0.4rem;">
                                Assign Students to Module (Select Multiple in Dropdown) *
                            </label>
                            
                            <div class="student-multi-dropdown" style="position: relative;">
                                <button type="button" id="btn-student-dropdown-toggle" class="premium-input" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; text-align: left; background: var(--bg-main, #f8fafc);">
                                    <span id="student-dropdown-label" style="color: var(--text-muted, #64748b); font-size: 0.9rem;">
                                        Select students to assign...
                                    </span>
                                    <span style="font-size: 0.75rem; color: var(--text-muted, #64748b);">▼</span>
                                </button>

                                <div id="student-dropdown-menu" style="display: none; position: absolute; top: calc(100% + 4px); left: 0; right: 0; max-height: 280px; overflow-y: auto; background: #ffffff; border: 1px solid var(--border-color, #cbd5e1); border-radius: var(--radius-md, 8px); box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0,0,0,0.1)); z-index: 60; padding: 0.5rem;">
                                    <div style="display: flex; justify-content: space-between; padding: 0.25rem 0.5rem 0.5rem; border-bottom: 1px solid var(--border-color, #e2e8f0); font-size: 0.75rem;">
                                        <button type="button" id="btn-select-all-students" style="background: none; border: none; color: var(--primary, #059669); font-weight: 600; cursor: pointer; padding: 0;">Select All</button>
                                        <button type="button" id="btn-clear-students" style="background: none; border: none; color: var(--text-muted, #64748b); cursor: pointer; padding: 0;">Clear</button>
                                    </div>
                                    <div style="display: flex; flex-direction: column; gap: 0.25rem; padding-top: 0.5rem;">
                                        ${students.length === 0 ? `
                                            <div style="font-size: 0.8rem; color: var(--text-muted, #94a3b8); padding: 0.5rem; text-align: center;">No students assigned to this project yet.</div>
                                        ` : students.map(s => {
                                            const studentModules = (projectDetail.modules || []).filter(m => 
                                                (m.assigned_students || []).some(st => st.student_id === s.student_id)
                                            );
                                            const studentTasks = (projectDetail.tasks || []).filter(t => t.assigned_to === s.student_id);

                                            return `
                                                <label style="display: flex; align-items: flex-start; gap: 0.65rem; padding: 0.55rem 0.65rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; transition: background 0.15s ease; border-bottom: 1px solid #f1f5f9;">
                                                    <input
                                                        type="checkbox"
                                                        value="${s.student_id}"
                                                        data-name="${s.name}"
                                                        class="module-student-checkbox"
                                                        style="width: 16px; height: 16px; margin-top: 3px; accent-color: var(--primary, #059669); cursor: pointer;"
                                                    />
                                                    <div style="flex: 1; min-width: 0;">
                                                        <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem; flex-wrap: wrap;">
                                                            <strong style="color: var(--text-main, #0f172a); font-size: 0.88rem;">${s.name}</strong>
                                                            <span style="color: var(--text-muted, #64748b); font-size: 0.76rem;">${s.designation || 'Student'} &bull; ${s.email}</span>
                                                        </div>
                                                        <div style="margin-top: 4px; display: flex; flex-wrap: wrap; gap: 0.35rem; align-items: center; font-size: 0.76rem;">
                                                            ${studentModules.length > 0 ? `
                                                                <span style="background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; padding: 1px 6px; border-radius: 4px; font-weight: 600;">
                                                                    Modules (${studentModules.length}): ${studentModules.map(m => m.module_name).join(', ')}
                                                                </span>
                                                            ` : `
                                                                <span style="background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; padding: 1px 6px; border-radius: 4px;">
                                                                    No modules assigned yet
                                                                </span>
                                                            `}
                                                            <span style="background: #f1f5f9; color: #475569; padding: 1px 6px; border-radius: 4px;">
                                                                ${studentTasks.length} task${studentTasks.length === 1 ? '' : 's'} assigned
                                                            </span>
                                                        </div>
                                                    </div>
                                                </label>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>
                            </div>

                            <!-- Selected Students Badges / Summary -->
                            <div id="selected-students-pills" style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.6rem;"></div>
                        </div>

                        <button type="submit" id="btn-submit-module" class="btn btn-primary shadow-hover" style="width: 100%;">
                            Assign Students to Module
                        </button>
                    </form>
                </div>
            </div>
        `;
    }

    // -------------------------------------------------------------
    // 2. SECTION: ASSIGN TASK FORM (FOCUSED VIEW WITHOUT LIST SQUISHING)
    // -------------------------------------------------------------
    function renderAssignTaskSection() {
        const project = projectDetail.project || {};
        const isClosed = (project.status || '').toLowerCase() === 'closed';

        if (isClosed) {
            return `
                <div style="max-width: 680px; margin: 0 auto;">
                    <div class="faculty-card-panel" style="text-align: center; padding: 3rem 2rem; border: 1px dashed #fca5a5; border-radius: 12px; background: #fff5f5;">
                        <div style="width: 54px; height: 54px; margin: 0 auto 1.25rem; border-radius: 50%; background: #fee2e2; color: #dc2626; display: flex; align-items: center; justify-content: center;">
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                        </div>
                        <h3 style="margin: 0 0 0.5rem; color: #991b1b; font-size: 1.2rem; font-weight: 700;">Task Assignment Disabled</h3>
                        <p style="color: #7f1d1d; font-size: 0.95rem; line-height: 1.5; margin: 0 auto 1.5rem; max-width: 480px;">
                            This project has been marked as <strong>Closed</strong>. You cannot assign new tasks or create tasks for closed projects.
                        </p>
                        <button type="button" id="btn-view-existing-tasks" class="btn btn-outline btn-sm" style="color: #991b1b; border-color: #fca5a5; background: #ffffff;">
                            View Existing Tasks →
                        </button>
                    </div>
                </div>
            `;
        }

        const modules = projectDetail.modules || [];

        return `
            <div style="max-width: 680px; margin: 0 auto;">
                <div class="faculty-card-panel">
                    <h2 style="margin: 0 0 0.35rem; font-size: 1.18rem; font-weight: 700; color: var(--text-main, #0f172a);">Assign Task</h2>
                    <p style="margin: 0 0 1.25rem; font-size: 0.85rem; color: var(--text-muted, #64748b);">
                        The task belongs to a module and can <strong>only be assigned to students who belong to that particular module</strong>. Task status will be set to <strong>To Do</strong>.
                    </p>

                    <form id="form-assign-task">
                        <!-- 1. MODULE DROPDOWN -->
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-main, #0f172a); margin-bottom: 0.4rem;">
                                Select Module *
                            </label>
                            <select id="select-task-module" class="premium-input" required>
                                <option value="">-- Select a module from this project --</option>
                                ${modules.map(m => {
                                    const teamCount = (m.assigned_students || []).length;
                                    return `<option value="${m.id}">${m.module_name} (${teamCount} student${teamCount === 1 ? '' : 's'} in team)</option>`;
                                }).join('')}
                            </select>
                        </div>

                        <!-- 2. TASK DROPDOWN FROM TASKS TABLE UNDER SELECTED MODULE -->
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-main, #0f172a); margin-bottom: 0.4rem;">
                                Select Task (from Tasks table) *
                            </label>
                            <select id="select-task-dropdown" class="premium-input" required disabled>
                                <option value="">-- First choose a module above --</option>
                            </select>
                        </div>

                        <!-- DYNAMIC NEW TASK INPUTS (SHOWN WHEN '+ Create New Task' IS CHOSEN) -->
                        <div id="container-new-task" style="display: none; padding: 1rem; background: var(--bg-main, #f8fafc); border: 1px dashed var(--border-color, #cbd5e1); border-radius: var(--radius-md, 8px); margin-bottom: 1rem;">
                            <div class="form-group" style="margin-bottom: 0.75rem;">
                                <label style="display: block; font-size: 0.82rem; font-weight: 600; color: var(--text-main, #0f172a); margin-bottom: 0.35rem;">
                                    New Task Title *
                                </label>
                                <input
                                    type="text"
                                    id="input-task-title"
                                    class="premium-input"
                                    placeholder="e.g. Implement routes guard & JWT verification"
                                />
                            </div>

                            <div class="form-group" style="margin-bottom: 0;">
                                <label style="display: block; font-size: 0.82rem; font-weight: 600; color: var(--text-main, #0f172a); margin-bottom: 0.35rem;">
                                    Task Description
                                </label>
                                <textarea
                                    id="input-task-desc"
                                    class="premium-input"
                                    style="height: 55px; resize: vertical;"
                                    placeholder="Specific deliverables and acceptance criteria..."
                                ></textarea>
                            </div>
                        </div>

                        <!-- TASK PREVIEW INFO (IF EXISTING TASK CHOSEN) -->
                        <div id="container-task-preview" style="display: none; padding: 0.75rem 1rem; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: var(--radius-md, 8px); margin-bottom: 1rem; font-size: 0.85rem; color: #1e40af;"></div>

                        <!-- 3. STUDENT DROPDOWN (ONLY STUDENTS BELONGING TO SELECTED MODULE) -->
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-main, #0f172a); margin-bottom: 0.4rem;">
                                Assign To Student (Module Team Members Only) *
                            </label>
                            <select id="select-task-student" class="premium-input" required disabled>
                                <option value="">-- First choose a module above --</option>
                            </select>
                            <div id="module-students-hint" style="font-size: 0.8rem; color: var(--text-muted, #64748b); margin-top: 0.4rem;">
                                Only students assigned to this specific module appear in this list.
                            </div>
                            <!-- Selected Student's Currently Assigned Tasks Specifically -->
                            <div id="student-assigned-tasks-preview" style="display: none; margin-top: 0.5rem; padding: 0.65rem 0.85rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.82rem; color: #334155;"></div>
                        </div>

                        <!-- 4. DUE DATE -->
                        <div class="form-group" style="margin-bottom: 1.5rem;">
                            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-main, #0f172a); margin-bottom: 0.4rem;">
                                Due Date
                            </label>
                            <input
                                type="date"
                                id="input-task-due"
                                class="premium-input"
                                min="${todayStr}"
                            />
                        </div>

                        <button type="submit" id="btn-submit-task" class="btn btn-primary shadow-hover" style="width: 100%;">
                            Assign Task (Status: To Do)
                        </button>
                    </form>
                </div>
            </div>
        `;
    }

    // -------------------------------------------------------------
    // 3. SECTION: EXISTING MODULES (DEDICATED FULL-WIDTH VIEW)
    // -------------------------------------------------------------
    function renderExistingModulesSection() {
        const project = projectDetail.project || {};
        const isClosed = (project.status || '').toLowerCase() === 'closed';
        const modules = projectDetail.modules || [];

        return `
            <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
                    <div>
                        <h2 style="margin: 0 0 0.25rem; font-size: 1.2rem; font-weight: 700; color: var(--text-main, #0f172a);">
                            Existing Project Modules (${modules.length})
                        </h2>
                        <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted, #64748b);">
                            All configured modules for this project and their assigned student development team members.
                        </p>
                    </div>
                    ${!isClosed ? `
                    <button id="btn-goto-assign-module" class="btn btn-primary btn-sm shadow-hover" style="display: inline-flex; align-items: center; gap: 0.45rem; width: max-content; padding: 0.5rem 1.25rem;">
                        ${iconFolder} + Assign Students / Create Module
                    </button>
                    ` : ''}
                </div>

                ${modules.length === 0 ? `
                    <div class="faculty-card-panel" style="text-align: center; color: var(--text-muted, #94a3b8); padding: 3rem 2rem;">
                        <div style="font-size: 1.5rem; margin-bottom: 0.75rem; color: var(--text-muted, #94a3b8);">${iconLayers}</div>
                        <h3 style="margin: 0 0 0.35rem; font-size: 1.05rem; font-weight: 700; color: var(--text-main, #0f172a);">No modules created yet</h3>
                        <p style="margin: 0 0 1.25rem; font-size: 0.88rem; color: var(--text-muted, #64748b);">
                            Get started by creating your first module and assigning student team members.
                        </p>
                        ${!isClosed ? `
                        <button id="btn-empty-create-module" class="btn btn-primary btn-sm shadow-hover">
                            + Create First Module
                        </button>
                        ` : ''}
                    </div>
                ` : `
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 1.15rem;">
                        ${modules.map(m => {
                            const assigned = m.assigned_students || [];
                            return `
                                <div class="module-card" style="background: var(--bg-card, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 10px; padding: 1.25rem; box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.04)); display: flex; flex-direction: column; justify-content: space-between;">
                                    <div>
                                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.65rem;">
                                            <h4 style="margin: 0; font-size: 1.08rem; font-weight: 700; color: var(--text-main, #0f172a);">${m.module_name}</h4>
                                            <span class="status-badge ${assigned.length > 0 ? 'completed' : 'todo'}" style="font-size: 0.72rem; flex-shrink: 0;">
                                                ${assigned.length} Student${assigned.length === 1 ? '' : 's'}
                                            </span>
                                        </div>
                                        <p style="margin: 0 0 1rem; font-size: 0.86rem; color: var(--text-muted, #64748b); line-height: 1.45;">
                                            ${m.description || 'No description provided.'}
                                        </p>
                                    </div>

                                    <div style="border-top: 1px solid var(--border-color, #f1f5f9); padding-top: 0.85rem; margin-top: auto;">
                                        <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted, #64748b); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.04em;">
                                            Assigned Students
                                        </div>
                                        <div style="display: flex; flex-wrap: wrap; gap: 0.45rem;">
                                            ${assigned.length === 0 ? `
                                                <span style="font-size: 0.82rem; color: var(--text-muted, #94a3b8); font-style: italic;">No students assigned to this module yet.</span>
                                            ` : assigned.map(s => `
                                                <span style="background: var(--primary-light, #ecfdf5); color: var(--primary, #059669); border: 1px solid #a7f3d0; padding: 0.25rem 0.65rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.35rem;">
                                                    ${iconUser} ${s.name} ${s.designation ? `(${s.designation})` : ''}
                                                    ${!isClosed ? `
                                                    <button
                                                        type="button"
                                                        class="btn-remove-module-student"
                                                        data-module-id="${m.id}"
                                                        data-student-id="${s.student_id}"
                                                        title="Remove student from this module"
                                                        style="background: none; border: none; color: var(--primary, #059669); cursor: pointer; font-weight: bold; font-size: 12px; padding: 0 2px; line-height: 1;"
                                                    >&times;</button>
                                                    ` : ''}
                                                </span>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>
        `;
    }

    // -------------------------------------------------------------
    // 4. SECTION: EXISTING TASKS (DEDICATED FULL-WIDTH VIEW)
    // -------------------------------------------------------------
    function renderExistingTasksSection() {
        const project = projectDetail.project || {};
        const isClosed = (project.status || '').toLowerCase() === 'closed';
        const tasks = projectDetail.tasks || [];

        return `
            <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
                    <div>
                        <h2 style="margin: 0 0 0.25rem; font-size: 1.2rem; font-weight: 700; color: var(--text-main, #0f172a);">
                            Existing Project Tasks (${tasks.length})
                        </h2>
                        <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted, #64748b);">
                            Comprehensive list of all assigned student tasks, associated modules, assignees, deadlines, and delivery statuses.
                        </p>
                    </div>
                    ${!isClosed ? `
                    <button id="btn-goto-assign-task" class="btn btn-primary btn-sm shadow-hover" style="display: inline-flex; align-items: center; gap: 0.45rem; width: max-content; padding: 0.5rem 1.25rem;">
                        ${iconTask} + Assign New Task
                    </button>
                    ` : ''}
                </div>

                ${tasks.length === 0 ? `
                    <div class="faculty-card-panel" style="text-align: center; color: var(--text-muted, #94a3b8); padding: 3rem 2rem;">
                        <div style="font-size: 1.5rem; margin-bottom: 0.75rem; color: var(--text-muted, #94a3b8);">${iconList}</div>
                        <h3 style="margin: 0 0 0.35rem; font-size: 1.05rem; font-weight: 700; color: var(--text-main, #0f172a);">No tasks created yet</h3>
                        <p style="margin: 0 0 1.25rem; font-size: 0.88rem; color: var(--text-muted, #64748b);">
                            Assign your first task to a student belonging to a project module.
                        </p>
                        ${!isClosed ? `
                        <button id="btn-empty-create-task" class="btn btn-primary btn-sm shadow-hover">
                            + Assign First Task
                        </button>
                        ` : ''}
                    </div>
                ` : `
                    <div class="faculty-card-panel" style="padding: 0; overflow: hidden; border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                        <table class="premium-table" style="width: 100%; border-collapse: collapse; text-align: left;">
                            <thead>
                                <tr style="background: var(--bg-main, #f8fafc); border-bottom: 2px solid var(--border-color, #e2e8f0);">
                                    <th style="padding: 1rem 1.25rem; font-size: 0.82rem; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em; width: 34%;">Task Title & Scope</th>
                                    <th style="padding: 1rem 1.25rem; font-size: 0.82rem; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em; width: 22%;">Module</th>
                                    <th style="padding: 1rem 1.25rem; font-size: 0.82rem; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em; width: 24%;">Assigned Student</th>
                                    <th style="padding: 1rem 1.25rem; font-size: 0.82rem; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em; width: 10%;">Due Date</th>
                                    <th style="padding: 1rem 1.25rem; font-size: 0.82rem; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em; width: 10%; text-align: right;">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tasks.map(t => {
                                    const status = (t.status || 'todo').toLowerCase();
                                    return `
                                        <tr style="border-bottom: 1px solid var(--border-color, #f1f5f9); transition: background 0.15s ease;">
                                            <td style="padding: 1rem 1.25rem;">
                                                <strong style="display: block; font-size: 0.92rem; color: var(--text-main, #0f172a); margin-bottom: 2px;">${t.title}</strong>
                                                ${t.description ? `<p style="margin: 0; font-size: 0.82rem; color: var(--text-muted, #64748b); line-height: 1.4;">${t.description}</p>` : ''}
                                            </td>
                                            <td style="padding: 1rem 1.25rem; font-size: 0.85rem; color: var(--text-main, #334155);">
                                                <span style="display: inline-flex; align-items: center; gap: 4px; font-weight: 600;">
                                                    ${iconFolder} ${t.module_name || 'General'}
                                                </span>
                                            </td>
                                            <td style="padding: 1rem 1.25rem; font-size: 0.85rem;">
                                                <div style="font-weight: 600; color: var(--text-main, #0f172a); display: flex; align-items: center; gap: 4px;">
                                                    ${iconUser} ${t.assigned_to_name || 'Unassigned'}
                                                </div>
                                            </td>
                                            <td style="padding: 1rem 1.25rem; font-size: 0.82rem; color: var(--text-muted, #64748b); white-space: nowrap;">
                                                ${t.due_date ? `${iconCalendar} ${t.due_date}` : '—'}
                                            </td>
                                            <td style="padding: 1rem 1.25rem; text-align: right;">
                                                <span class="status-badge ${status.replace(' ', '_')}">
                                                    ${status.replace('_', ' ').toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;
    }

    // ==========================================
    // 3. EVENT LISTENERS AND DYNAMIC INTERACTIONS
    // ==========================================
    function setupProjectDetailListeners() {
        const msgContainer = container.querySelector('#action-msg-container');

        // Back to Projects button
        const backBtn = container.querySelector('#btn-back-projects');
        backBtn?.addEventListener('click', () => {
            currentView = 'project-list';
            projectDetail = null;
            render();
        });

        // Tab Switching (4 Distinct Tabs)
        const tabAssignModule = container.querySelector('#tab-btn-assign-module');
        const tabAssignTask = container.querySelector('#tab-btn-assign-task');
        const tabExistingModules = container.querySelector('#tab-btn-existing-modules');
        const tabExistingTasks = container.querySelector('#tab-btn-existing-tasks');

        tabAssignModule?.addEventListener('click', () => {
            activeTab = 'assign-module';
            render();
        });

        tabAssignTask?.addEventListener('click', () => {
            activeTab = 'assign-task';
            render();
        });

        tabExistingModules?.addEventListener('click', () => {
            activeTab = 'existing-modules';
            render();
        });

        tabExistingTasks?.addEventListener('click', () => {
            activeTab = 'existing-tasks';
            render();
        });

        // Quick navigation buttons from existing tabs to forms
        container.querySelector('#btn-goto-assign-module')?.addEventListener('click', () => {
            activeTab = 'assign-module';
            render();
        });

        container.querySelector('#btn-empty-create-module')?.addEventListener('click', () => {
            activeTab = 'assign-module';
            render();
        });

        container.querySelector('#btn-goto-assign-task')?.addEventListener('click', () => {
            activeTab = 'assign-task';
            render();
        });

        container.querySelector('#btn-empty-create-task')?.addEventListener('click', () => {
            activeTab = 'assign-task';
            render();
        });

        container.querySelector('#btn-view-existing-modules')?.addEventListener('click', () => {
            activeTab = 'existing-modules';
            render();
        });

        container.querySelector('#btn-view-existing-tasks')?.addEventListener('click', () => {
            activeTab = 'existing-tasks';
            render();
        });

        // -------------------------------------------------------------------
        // ASSIGN MODULE FORM LOGIC
        // -------------------------------------------------------------------
        const formModule = container.querySelector('#form-assign-module');
        const selectModule = container.querySelector('#select-module-dropdown');
        const containerNewModule = container.querySelector('#container-new-module');
        const newModuleNameInput = container.querySelector('#input-new-module-name');
        const newModuleDescInput = container.querySelector('#input-new-module-desc');

        // Multi-select dropdown elements
        const dropdownToggle = container.querySelector('#btn-student-dropdown-toggle');
        const dropdownMenu = container.querySelector('#student-dropdown-menu');
        const dropdownLabel = container.querySelector('#student-dropdown-label');
        const studentPills = container.querySelector('#selected-students-pills');
        const selectAllBtn = container.querySelector('#btn-select-all-students');
        const clearBtn = container.querySelector('#btn-clear-students');

        // Toggle student dropdown menu
        dropdownToggle?.addEventListener('click', (e) => {
            e.stopPropagation();
            isStudentDropdownOpen = !isStudentDropdownOpen;
            if (dropdownMenu) dropdownMenu.style.display = isStudentDropdownOpen ? 'block' : 'none';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (dropdownMenu && !dropdownMenu.contains(e.target) && e.target !== dropdownToggle) {
                isStudentDropdownOpen = false;
                dropdownMenu.style.display = 'none';
            }
        });

        function updateStudentPillsAndLabel() {
            const checkedBoxes = container.querySelectorAll('.module-student-checkbox:checked');
            selectedStudentIdsForModule = new Set(Array.from(checkedBoxes).map(cb => parseInt(cb.value)));

            if (selectedStudentIdsForModule.size === 0) {
                if (dropdownLabel) dropdownLabel.textContent = 'Select students to assign...';
                if (studentPills) studentPills.innerHTML = '';
            } else {
                const count = selectedStudentIdsForModule.size;
                if (dropdownLabel) dropdownLabel.textContent = `${count} student${count > 1 ? 's' : ''} selected`;

                if (studentPills) {
                    const students = projectDetail?.project_students || [];
                    studentPills.innerHTML = Array.from(selectedStudentIdsForModule).map(id => {
                        const s = students.find(item => item.student_id === id);
                        const sName = s ? s.name : `Student #${id}`;
                        return `
                            <span style="background: var(--primary-light, #ecfdf5); color: var(--primary, #059669); border: 1px solid #a7f3d0; padding: 2px 8px; border-radius: 9999px; font-size: 0.78rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                                👤 ${sName}
                                <button type="button" class="remove-pill-btn" data-id="${id}" style="background: none; border: none; color: var(--primary, #059669); cursor: pointer; font-weight: bold; font-size: 11px; padding: 0;">✕</button>
                            </span>
                        `;
                    }).join('');

                    // Bind remove button on each pill
                    studentPills.querySelectorAll('.remove-pill-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const removeId = btn.getAttribute('data-id');
                            const cb = container.querySelector(`.module-student-checkbox[value="${removeId}"]`);
                            if (cb) cb.checked = false;
                            updateStudentPillsAndLabel();
                        });
                    });
                }
            }
        }

        // Checkbox changes inside dropdown
        container.querySelectorAll('.module-student-checkbox').forEach(cb => {
            cb.addEventListener('change', updateStudentPillsAndLabel);
        });

        // Select All & Clear
        selectAllBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            container.querySelectorAll('.module-student-checkbox').forEach(cb => cb.checked = true);
            updateStudentPillsAndLabel();
        });

        clearBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            container.querySelectorAll('.module-student-checkbox').forEach(cb => cb.checked = false);
            updateStudentPillsAndLabel();
        });

        let previousModuleVal = '';

        function applyModuleSelection(val, isReassign = false) {
            const banner = container.querySelector('#module-assignment-info-banner');

            if (val === 'new') {
                if (containerNewModule) containerNewModule.style.display = 'block';
                if (newModuleNameInput) newModuleNameInput.required = true;
                if (banner) banner.style.display = 'none';
                // Clear checkboxes for fresh creation
                container.querySelectorAll('.module-student-checkbox').forEach(cb => cb.checked = false);
                updateStudentPillsAndLabel();
            } else if (val) {
                if (containerNewModule) containerNewModule.style.display = 'none';
                if (newModuleNameInput) newModuleNameInput.required = false;

                // Pre-check students already assigned to this module
                const modId = parseInt(val);
                const modules = projectDetail?.modules || [];
                const matchedMod = modules.find(m => m.id === modId);
                const currentAssigned = (matchedMod?.assigned_students || []).map(s => s.student_id);

                container.querySelectorAll('.module-student-checkbox').forEach(cb => {
                    const sId = parseInt(cb.value);
                    cb.checked = currentAssigned.includes(sId);
                });
                updateStudentPillsAndLabel();

                if (banner && matchedMod) {
                    banner.style.display = 'block';
                    if (isReassign) {
                        banner.style.background = '#fffbeb';
                        banner.style.border = '1px solid #fde68a';
                        banner.style.color = '#92400e';
                        banner.innerHTML = `
                            <strong style="color: #b45309;">⚠️ Re-assigning Module "${matchedMod.module_name}"</strong><br/>
                            Currently assigned students: <strong>${(matchedMod.assigned_students || []).map(s => s.name).join(', ')}</strong>.<br/>
                            <span style="font-size: 0.8rem;">You can update the student checkboxes in the dropdown below and click "Assign Students to Module" to apply changes.</span>
                        `;
                    } else if (currentAssigned.length > 0) {
                        banner.style.background = '#eff6ff';
                        banner.style.border = '1px solid #bfdbfe';
                        banner.style.color = '#1e40af';
                        banner.innerHTML = `
                            <strong>Assigned Module:</strong> "${matchedMod.module_name}" is assigned to <strong>${(matchedMod.assigned_students || []).map(s => s.name).join(', ')}</strong>.
                        `;
                    } else {
                        banner.style.background = '#f0fdf4';
                        banner.style.border = '1px solid #bbf7d0';
                        banner.style.color = '#166534';
                        banner.innerHTML = `
                            <strong>Unassigned Module:</strong> "${matchedMod.module_name}" has no students assigned yet. Select students below to assign.
                        `;
                    }
                }
            } else {
                if (containerNewModule) containerNewModule.style.display = 'none';
                if (newModuleNameInput) newModuleNameInput.required = false;
                if (banner) banner.style.display = 'none';
                container.querySelectorAll('.module-student-checkbox').forEach(cb => cb.checked = false);
                updateStudentPillsAndLabel();
            }
        }

        // When module dropdown changes:
        selectModule?.addEventListener('change', () => {
            const val = selectModule.value;
            if (val && val !== 'new') {
                const modId = parseInt(val);
                const modules = projectDetail?.modules || [];
                const matchedMod = modules.find(m => m.id === modId);
                const assigned = matchedMod?.assigned_students || [];

                if (assigned.length > 0) {
                    showCustomConfirmModal({
                        title: 'Module Already Assigned',
                        message: `Module "${matchedMod.module_name}" already assigned. Want to re-assign..?`,
                        detailsHtml: `
                            <strong>Currently Assigned Students:</strong><br/>
                            ${assigned.map(s => `&bull; ${s.name} (${s.email})`).join('<br/>')}
                        `,
                        confirmText: 'Yes, Re-assign',
                        cancelText: 'Cancel',
                        onConfirm: () => {
                            previousModuleVal = val;
                            applyModuleSelection(val, true);
                        },
                        onCancel: () => {
                            selectModule.value = previousModuleVal;
                        }
                    });
                    return;
                }
            }

            previousModuleVal = val;
            applyModuleSelection(val, false);
        });

        // Submit Assign Module
        if (formModule) {
            formModule.addEventListener('submit', async (e) => {
                e.preventDefault();

                if ((projectDetail?.project?.status || '').toLowerCase() === 'closed') {
                    showFacultyErrorPopup('Project Closed', 'Cannot assign modules. This project is closed.');
                    return;
                }

                const moduleIdVal = selectModule.value;
                if (!moduleIdVal) {
                    if (msgContainer) {
                        msgContainer.innerHTML = `
                            <div style="background: #fef2f2; border: 1px solid #f87171; color: #991b1b; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.9rem; font-weight: 600;">
                                ⚠ Please select a module or choose '+ Create New Module'.
                            </div>
                        `;
                    }
                    return;
                }

                const checkedStudentIds = Array.from(selectedStudentIdsForModule);
                if (checkedStudentIds.length === 0) {
                    if (msgContainer) {
                        msgContainer.innerHTML = `
                            <div style="background: #fef2f2; border: 1px solid #f87171; color: #991b1b; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.9rem; font-weight: 600;">
                                ⚠ Please select at least one student from the dropdown to assign to this module.
                            </div>
                        `;
                    }
                    return;
                }

                const submitBtn = container.querySelector('#btn-submit-module');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Assigning Students...';

                try {
                    const headers = {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    };

                    const payload = {
                        module_id: moduleIdVal,
                        new_module_name: moduleIdVal === 'new' ? newModuleNameInput.value.trim() : null,
                        new_description: moduleIdVal === 'new' ? newModuleDescInput.value.trim() : null,
                        student_ids: checkedStudentIds
                    };

                    const res = await fetch(`${apiBase}/faculty/projects/${selectedProjectId}/modules`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(payload)
                    });

                    const data = await res.json();

                    if (res.ok) {
                        const isNew = moduleIdVal === 'new';
                        const modName = isNew 
                            ? (newModuleNameInput?.value.trim() || 'New Module')
                            : ((projectDetail?.modules || []).find(m => m.id === parseInt(moduleIdVal))?.module_name || 'Module');

                        if (isNew) {
                            showFacultySuccessPopup(
                                'New Module Added & Assigned',
                                `Module "${modName}" was successfully added and assigned to ${checkedStudentIds.length} student(s).`
                            );
                        } else {
                            showFacultySuccessPopup(
                                'Module Assigned',
                                `Module "${modName}" was successfully assigned to ${checkedStudentIds.length} student(s).`
                            );
                        }

                        if (msgContainer) {
                            msgContainer.innerHTML = `
                                <div style="background: #ecfdf5; border: 1px solid #86efac; color: #166534; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.9rem; font-weight: 600;">
                                    ✓ Students successfully assigned to module!
                                </div>
                            `;
                        }
                        await loadProjectDetail(selectedProjectId);
                    } else {
                        if (msgContainer) {
                            msgContainer.innerHTML = `
                                <div style="background: #fef2f2; border: 1px solid #f87171; color: #991b1b; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.9rem; font-weight: 600;">
                                    ⚠ Error: ${data.error || 'Could not assign students'}
                                </div>
                            `;
                        }
                    }
                } catch (err) {
                    console.error(err);
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Assign Students to Module';
                }
            });
        }

        // Remove student from module button (in the right-hand list)
        container.querySelectorAll('.btn-remove-module-student').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const mId = btn.getAttribute('data-module-id');
                const sId = btn.getAttribute('data-student-id');

                showCustomConfirmModal({
                    title: 'Remove Student from Module',
                    message: 'Are you sure you want to remove this student from the module?',
                    confirmText: 'Yes, Remove',
                    cancelText: 'Cancel',
                    onConfirm: async () => {
                        try {
                            const headers = {
                                'Content-Type': 'application/json',
                                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                            };
                            const res = await fetch(`${apiBase}/faculty/modules/${mId}/students/${sId}`, {
                                method: 'DELETE',
                                headers
                            });
                            if (res.ok) {
                                showFacultySuccessPopup('Student Removed', 'Student has been removed from this module.');
                                await loadProjectDetail(selectedProjectId);
                            }
                        } catch (err) {
                            console.error('Error removing student from module:', err);
                        }
                    }
                });
            });
        });

        // -------------------------------------------------------------------
        // ASSIGN TASK FORM LOGIC (MODULE DROPDOWN -> TASKS DROPDOWN -> MODULE STUDENTS ONLY)
        // -------------------------------------------------------------------
        const formTask = container.querySelector('#form-assign-task');
        const taskModuleSelect = container.querySelector('#select-task-module');
        const taskDropdown = container.querySelector('#select-task-dropdown');
        const taskStudentSelect = container.querySelector('#select-task-student');
        const studentsHint = container.querySelector('#module-students-hint');
        const containerNewTask = container.querySelector('#container-new-task');
        const taskTitleInput = container.querySelector('#input-task-title');
        const taskDescInput = container.querySelector('#input-task-desc');
        const taskPreview = container.querySelector('#container-task-preview');

        let previousTaskVal = '';

        function updateStudentTaskPreview(studentId) {
            const previewEl = container.querySelector('#student-assigned-tasks-preview');
            if (!previewEl) return;

            if (!studentId) {
                previewEl.style.display = 'none';
                previewEl.innerHTML = '';
                return;
            }

            const tasks = projectDetail?.tasks || [];
            const studentTasks = tasks.filter(t => t.assigned_to === studentId);
            const students = projectDetail?.project_students || [];
            const studentObj = students.find(s => s.student_id === studentId);
            const sName = studentObj ? studentObj.name : `Student #${studentId}`;

            previewEl.style.display = 'block';
            previewEl.innerHTML = `
                <div style="font-weight: 700; color: #0f172a; margin-bottom: 0.35rem; display: flex; justify-content: space-between; align-items: center;">
                    <span>Assigned Tasks for ${sName} (${studentTasks.length}):</span>
                </div>
                ${studentTasks.length === 0 ? `
                    <div style="color: #64748b; font-size: 0.8rem;">No other tasks currently assigned to this student in this project.</div>
                ` : `
                    <div style="display: flex; flex-direction: column; gap: 0.3rem; max-height: 120px; overflow-y: auto;">
                        ${studentTasks.map(t => `
                            <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px; padding: 4px 8px; font-size: 0.78rem;">
                                <span style="color: #1e293b; font-weight: 600;">${t.title}</span>
                                <div style="display: flex; gap: 0.4rem; align-items: center;">
                                    <span style="color: #64748b; font-size: 0.74rem;">${t.module_name || 'Module'}</span>
                                    <span class="status-badge ${t.status.replace(' ', '_')}" style="padding: 1px 5px; font-size: 0.7rem;">
                                        ${t.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            `;
        }

        function applyTaskSelection(taskIdVal, isReassign = false) {
            if (taskIdVal === 'new') {
                if (containerNewTask) containerNewTask.style.display = 'block';
                if (taskTitleInput) taskTitleInput.required = true;
                if (taskPreview) taskPreview.style.display = 'none';
                taskStudentSelect.value = '';
                updateStudentTaskPreview(null);
            } else if (taskIdVal && taskIdVal !== '') {
                if (containerNewTask) containerNewTask.style.display = 'none';
                if (taskTitleInput) taskTitleInput.required = false;

                const taskId = parseInt(taskIdVal);
                const tasks = projectDetail?.tasks || [];
                const matchedTask = tasks.find(t => t.id === taskId);

                if (matchedTask && taskPreview) {
                    taskPreview.style.display = 'block';
                    if (isReassign) {
                        taskPreview.style.background = '#fffbeb';
                        taskPreview.style.border = '1px solid #fde68a';
                        taskPreview.style.color = '#92400e';
                        taskPreview.innerHTML = `
                            <div style="display: flex; align-items: center; gap: 0.4rem; font-weight: 700; color: #b45309; margin-bottom: 0.25rem;">
                                <span>⚠️ Re-assigning Task: "${matchedTask.title}"</span>
                            </div>
                            <span style="font-size: 0.8rem; color: #78350f;">Currently assigned to: <strong>${matchedTask.assigned_to_name || 'Unassigned'}</strong> &bull; Current Status: <strong>${matchedTask.status.toUpperCase()}</strong> &bull; Due: <strong>${matchedTask.due_date || 'None'}</strong></span>
                            ${matchedTask.description ? `<p style="margin: 4px 0 0; font-size: 0.8rem; color: #78350f;">${matchedTask.description}</p>` : ''}
                            <div style="margin-top: 6px; font-size: 0.78rem; color: #b45309; font-weight: 600;">
                                Select a different student or update due date below, then click "Assign Task" to update.
                            </div>
                        `;
                    } else {
                        taskPreview.style.background = '#eff6ff';
                        taskPreview.style.border = '1px solid #bfdbfe';
                        taskPreview.style.color = '#1e40af';
                        taskPreview.innerHTML = `
                            <strong>Selected Task:</strong> ${matchedTask.title}<br />
                            <span style="font-size: 0.8rem;">Current Assignment: <strong>${matchedTask.assigned_to_name || 'Unassigned'}</strong> &bull; Current Status: <strong>${matchedTask.status.toUpperCase()}</strong></span>
                            ${matchedTask.description ? `<p style="margin: 4px 0 0; font-size: 0.8rem; color: #334155;">${matchedTask.description}</p>` : ''}
                        `;
                    }

                    // If task already has assigned student, pre-select if in module
                    if (matchedTask.assigned_to) {
                        taskStudentSelect.value = matchedTask.assigned_to;
                        updateStudentTaskPreview(matchedTask.assigned_to);
                    } else {
                        taskStudentSelect.value = '';
                        updateStudentTaskPreview(null);
                    }
                    if (matchedTask.due_date) {
                        const dueInput = container.querySelector('#input-task-due');
                        if (dueInput) dueInput.value = matchedTask.due_date;
                    }
                }
            } else {
                if (containerNewTask) containerNewTask.style.display = 'none';
                if (taskPreview) taskPreview.style.display = 'none';
                if (taskTitleInput) taskTitleInput.required = false;
                updateStudentTaskPreview(null);
            }
        }

        // When Task Module changes:
        taskModuleSelect?.addEventListener('change', () => {
            const moduleId = parseInt(taskModuleSelect.value);
            previousTaskVal = '';

            if (!moduleId) {
                taskDropdown.innerHTML = `<option value="">-- First choose a module above --</option>`;
                taskDropdown.disabled = true;
                taskStudentSelect.innerHTML = `<option value="">-- First choose a module above --</option>`;
                taskStudentSelect.disabled = true;
                if (containerNewTask) containerNewTask.style.display = 'none';
                if (taskPreview) taskPreview.style.display = 'none';
                if (studentsHint) studentsHint.innerHTML = 'Only students assigned to this specific module appear in this list.';
                updateStudentTaskPreview(null);
                return;
            }

            const modules = projectDetail?.modules || [];
            const tasks = projectDetail?.tasks || [];
            const matchedModule = modules.find(m => m.id === moduleId);

            // 1. Populate Tasks Dropdown from Tasks table under this module with assigned info
            const moduleTasks = tasks.filter(t => t.module_id === moduleId);
            taskDropdown.disabled = false;
            taskDropdown.innerHTML = `
                <option value="">-- Select a task under this module --</option>
                ${moduleTasks.map(t => {
                    const isAssigned = !!t.assigned_to;
                    const assignedText = isAssigned ? `— [Assigned to: ${t.assigned_to_name || 'Student'}]` : `— [Unassigned]`;
                    return `<option value="${t.id}">${t.title} ${assignedText} (${t.status.toUpperCase()})</option>`;
                }).join('')}
                <option value="new">+ Create / Add New Task</option>
            `;

            // 2. Populate Students Dropdown with ONLY students assigned to this module and show their tasks count
            const assignedStudents = matchedModule?.assigned_students || [];

            if (assignedStudents.length === 0) {
                taskStudentSelect.disabled = true;
                taskStudentSelect.innerHTML = `<option value="">⚠ No students assigned to this module yet!</option>`;
                if (studentsHint) {
                    studentsHint.innerHTML = `<span style="color: #dc2626; font-weight: 600;">⚠ No students belong to this module. Please assign students in the 'Assign Module' tab first.</span>`;
                }
            } else {
                taskStudentSelect.disabled = false;
                taskStudentSelect.innerHTML = `
                    <option value="">-- Select student assigned to this module --</option>
                    ${assignedStudents.map(s => {
                        const studentTasks = (projectDetail.tasks || []).filter(t => t.assigned_to === s.student_id);
                        const modTasks = studentTasks.filter(t => t.module_id === moduleId);
                        return `
                            <option value="${s.student_id}">
                                ${s.name} ${s.designation ? `(${s.designation})` : ''} — [${modTasks.length} task(s) in this module, ${studentTasks.length} total]
                            </option>
                        `;
                    }).join('')}
                `;
                if (studentsHint) {
                    studentsHint.innerHTML = `<span style="color: var(--primary, #059669); font-weight: 600;">✓ Showing ${assignedStudents.length} student(s) assigned to this module.</span>`;
                }
            }

            if (containerNewTask) containerNewTask.style.display = 'none';
            if (taskPreview) taskPreview.style.display = 'none';
            updateStudentTaskPreview(null);
        });

        // When Task Dropdown selection changes:
        taskDropdown?.addEventListener('change', () => {
            const taskIdVal = taskDropdown.value;

            if (taskIdVal && taskIdVal !== 'new') {
                const taskId = parseInt(taskIdVal);
                const tasks = projectDetail?.tasks || [];
                const matchedTask = tasks.find(t => t.id === taskId);

                if (matchedTask && matchedTask.assigned_to) {
                    // Already assigned task! Prompt custom confirmation modal (not browser localhost msg)
                    showCustomConfirmModal({
                        title: 'Task Already Assigned',
                        message: `Task "${matchedTask.title}" already assigned. Want to re-assign..?`,
                        detailsHtml: `
                            <strong>Currently Assigned To:</strong> ${matchedTask.assigned_to_name || 'Student #' + matchedTask.assigned_to}<br/>
                            <strong>Current Status:</strong> ${matchedTask.status.toUpperCase()}<br/>
                            <strong>Due Date:</strong> ${matchedTask.due_date || 'No due date'}
                        `,
                        confirmText: 'Yes, Re-assign',
                        cancelText: 'Cancel',
                        onConfirm: () => {
                            previousTaskVal = taskIdVal;
                            applyTaskSelection(taskIdVal, true);
                        },
                        onCancel: () => {
                            taskDropdown.value = previousTaskVal;
                        }
                    });
                    return;
                }
            }

            previousTaskVal = taskIdVal;
            applyTaskSelection(taskIdVal, false);
        });

        // When Task Student selection changes:
        taskStudentSelect?.addEventListener('change', () => {
            const studentId = parseInt(taskStudentSelect.value);
            updateStudentTaskPreview(studentId);
        });

        // Submit Assign Task (Sets status to 'todo')
        if (formTask) {
            formTask.addEventListener('submit', async (e) => {
                e.preventDefault();

                if ((projectDetail?.project?.status || '').toLowerCase() === 'closed') {
                    showFacultyErrorPopup('Project Closed', 'Cannot assign tasks. This project is closed.');
                    return;
                }

                const moduleId = parseInt(taskModuleSelect.value);
                const taskIdVal = taskDropdown.value;
                const studentId = parseInt(taskStudentSelect.value);
                const dueDate = container.querySelector('#input-task-due')?.value || null;

                if (!moduleId) {
                    showFacultyErrorPopup('Module Required', 'Please choose a module first.');
                    return;
                }

                if (!taskIdVal) {
                    showFacultyErrorPopup('Task Required', 'Please select a task from the dropdown or choose + Create New Task.');
                    return;
                }

                if (!studentId) {
                    showFacultyErrorPopup('Student Required', 'Please choose a student assigned to this module.');
                    return;
                }

                const submitBtn = container.querySelector('#btn-submit-task');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Assigning Task (To Do)...';

                try {
                    const headers = {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    };

                    const payload = {
                        module_id: moduleId,
                        task_id: taskIdVal,
                        new_title: taskIdVal === 'new' ? taskTitleInput.value.trim() : null,
                        new_description: taskIdVal === 'new' ? taskDescInput.value.trim() : null,
                        assigned_to: studentId,
                        due_date: dueDate,
                        status: 'todo'
                    };

                    const res = await fetch(`${apiBase}/faculty/tasks`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(payload)
                    });

                    const data = await res.json();

                    if (res.ok) {
                        const isNew = taskIdVal === 'new';
                        const tTitle = isNew
                            ? (taskTitleInput?.value.trim() || 'New Task')
                            : ((projectDetail?.tasks || []).find(t => t.id === parseInt(taskIdVal))?.title || 'Task');
                        const studentObj = (projectDetail?.project_students || []).find(s => s.student_id === studentId);
                        const sName = studentObj ? studentObj.name : 'assigned student';

                        if (isNew) {
                            showFacultySuccessPopup(
                                'New Task Added & Assigned',
                                `Task "${tTitle}" was successfully added and assigned to ${sName} with status To Do.`
                            );
                        } else {
                            showFacultySuccessPopup(
                                'Task Assigned',
                                `Task "${tTitle}" was successfully assigned to ${sName} with status To Do.`
                            );
                        }

                        if (msgContainer) {
                            msgContainer.innerHTML = `
                                <div style="background: #ecfdf5; border: 1px solid #86efac; color: #166534; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.9rem; font-weight: 600;">
                                    ✓ Task successfully assigned with status <strong>TO DO</strong>!
                                </div>
                            `;
                        }
                        await loadProjectDetail(selectedProjectId);
                    } else {
                        if (msgContainer) {
                            msgContainer.innerHTML = `
                                <div style="background: #fef2f2; border: 1px solid #f87171; color: #991b1b; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.9rem; font-weight: 600;">
                                    ⚠ Error: ${data.error || 'Could not assign task'}
                                </div>
                            `;
                        }
                    }
                } catch (err) {
                    console.error(err);
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Assign Task (Status: To Do)';
                }
            });
        }
    }

    // ==========================================
    // 4. DATA FETCHING HELPERS
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
                    { id: 1, title: 'RLabZ ERP - Student Portal', client_name: 'Department of Computer Science', project_type: 'Web Application', status: 'in_progress' },
                    { id: 2, title: 'CMS Academic Module', client_name: 'Academic Administration Office', project_type: 'Academic Module', status: 'closed' }
                ];
            }
        } catch (err) {
            console.warn('Could not fetch projects:', err);
            assignedProjects = [
                { id: 1, title: 'RLabZ ERP - Student Portal', client_name: 'Department of Computer Science', project_type: 'Web Application', status: 'in_progress' },
                { id: 2, title: 'CMS Academic Module', client_name: 'Academic Administration Office', project_type: 'Academic Module', status: 'closed' }
            ];
        } finally {
            isLoadingProjects = false;
            if (currentView === 'project-list') {
                render();
            }
        }
    }

    async function loadProjectDetail(projectId) {
        isLoadingDetail = true;
        currentView = 'project-detail';
        render();

        try {
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };
            const res = await fetch(`${apiBase}/faculty/projects/${projectId}/modules-tasks`, { headers });
            if (res.ok) {
                projectDetail = await res.json();
                if ((projectDetail.project?.status || '').toLowerCase() === 'closed') {
                    activeTab = 'existing-modules';
                } else {
                    activeTab = 'assign-module';
                }
            } else {
                throw new Error('Failed to fetch project detail');
            }
        } catch (err) {
            console.error('Error loading project detail:', err);
            alert('Could not load project modules and student assignments.');
            currentView = 'project-list';
        } finally {
            isLoadingDetail = false;
            render();
        }
    }

    render();
    loadAssignedProjects();

    return container;
}

export default FacultySprints;
