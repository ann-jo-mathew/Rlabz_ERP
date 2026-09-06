import '../faculty.css';
import html2pdf from 'html2pdf.js';

export function FacultyReports() {
    const container = document.createElement('div');
    container.className = 'faculty-reports';

    let storedUser = null;
    try {
        storedUser = JSON.parse(localStorage.getItem('user'));
    } catch (e) {
        storedUser = null;
    }

    const token = localStorage.getItem('token');
    const apiBase = window.location.port === '8000' ? '/api' : 'http://127.0.0.1:8000/api';

    let projects = [];
    let isLoading = true;
    let selectedReport = null;
    let isModalOpen = false;
    let searchQuery = '';

    function renderUI() {
        container.innerHTML = `
            <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
                <div>
                    <h1>Project Reports</h1>
                    <p>Executive project briefing packs and developmental reports for projects assigned to you.</p>
                </div>
                <div style="position: relative; width: 320px; max-width: 100%;">
                    <input 
                        type="text" 
                        id="input-search-reports-project" 
                        class="premium-input" 
                        placeholder="Search project by name..." 
                        value="${searchQuery}" 
                        style="padding-left: 2.25rem; font-size: 0.88rem; height: 40px; border-radius: 8px;"
                    />
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 12px; top: 13px; color: #94a3b8;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
            </div>

            <div class="report-table-card" style="background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <table class="faculty-student-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                            <th style="padding: 16px 20px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b;">Project Title</th>
                            <th style="padding: 16px 20px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b;">Client / Beneficiary</th>
                            <th style="padding: 16px 20px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b;">Project Category</th>
                            <th style="padding: 16px 20px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b;">Status</th>
                            <th style="padding: 16px 20px; text-align: right; font-size: 12px; text-transform: uppercase; color: #64748b;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="projects-table-body">
                        ${renderTableRows()}
                    </tbody>
                </table>
            </div>

            <!-- Modal Container for View Report -->
            <div id="report-modal-backdrop" style="display: none; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65); z-index: 9999; overflow-y: auto; padding: 30px 15px; align-items: flex-start; justify-content: center;">
                <div id="report-modal-dialog" style="background: #ffffff; width: 100%; max-width: 950px; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2); overflow: hidden; margin: 0 auto; position: relative;">
                    <div id="report-modal-content"></div>
                </div>
            </div>
        `;

        setupTableListeners();
    }

    function renderTableRows() {
        if (isLoading) {
            return `<tr><td colspan="5" style="text-align: center; color: #64748b; padding: 30px;">Loading assigned projects...</td></tr>`;
        }

        const query = searchQuery.trim().toLowerCase();
        const filteredProjects = query
            ? projects.filter(p => (p.title || p.name || '').toLowerCase().includes(query))
            : projects;

        if (!filteredProjects || filteredProjects.length === 0) {
            return `<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 35px;">${query ? `No projects found matching "${searchQuery}".` : 'No projects currently assigned to you.'}</td></tr>`;
        }

        return filteredProjects.map(project => {
            const title = project.title || project.name || 'Untitled Project';
            const client = project.client_name || project.client || 'Institutional Partner';
            const type = project.project_type || 'Web Application';
            const status = (project.status || 'in_progress').toUpperCase();

            let statusBg = '#dcfce7';
            let statusColor = '#166534';
            if (status.includes('CLOSED') || status.includes('COMPLETED')) {
                statusBg = '#e2e8f0';
                statusColor = '#475569';
            }

            return `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 16px 20px; font-weight: 700; color: #1e293b;">
                        ${title}
                    </td>
                    <td style="padding: 16px 20px; color: #475569;">
                        ${client}
                    </td>
                    <td style="padding: 16px 20px; color: #64748b; font-size: 13px;">
                        ${type}
                    </td>
                    <td style="padding: 16px 20px;">
                        <span style="display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; background: ${statusBg}; color: ${statusColor};">
                            ${status}
                        </span>
                    </td>
                    <td style="padding: 16px 20px; text-align: right; white-space: nowrap;">
                        <button class="view-report-btn" data-id="${project.id}" style="background: #087f5b; color: white; border: none; padding: 8px 14px; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer; margin-right: 8px; transition: background 0.2s;">
                            👁 View Briefing Pack
                        </button>
                        <button class="download-report-btn" data-id="${project.id}" style="background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 8px 14px; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer; transition: background 0.2s;">
                            📥 Download PDF
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function setupTableListeners() {
        // Search Input Listener
        const searchInput = container.querySelector('#input-search-reports-project');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value;
                const tbody = container.querySelector('#projects-table-body');
                if (tbody) {
                    tbody.innerHTML = renderTableRows();
                    setupActionButtons();
                }
            });
        }

        setupActionButtons();
    }

    function setupActionButtons() {
        // Bind View Report buttons
        container.querySelectorAll('.view-report-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const projectId = parseInt(btn.getAttribute('data-id'));
                btn.disabled = true;
                btn.textContent = 'Loading...';
                try {
                    const reportData = await fetchReportData(projectId);
                    showReportModal(reportData);
                } catch (err) {
                    alert('Could not load report details for this project.');
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = '👁 View Briefing Pack';
                }
            });
        });

        // Bind Download Report buttons
        container.querySelectorAll('.download-report-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const projectId = parseInt(btn.getAttribute('data-id'));
                const originalText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '⏳ Generating PDF...';
                try {
                    const reportData = await fetchReportData(projectId);
                    await downloadPDF(reportData);
                } catch (err) {
                    alert('Failed to generate PDF report.');
                    console.error(err);
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }
            });
        });
    }

    async function fetchReportData(projectId) {
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
        const queryParam = storedUser?.email ? `?email=${encodeURIComponent(storedUser.email)}` : '';
        const res = await fetch(`${apiBase}/faculty/projects/${projectId}/report${queryParam}`, { headers });
        if (!res.ok) {
            throw new Error(`Failed to fetch report: ${res.status}`);
        }
        return await res.json();
    }

    function showReportModal(data) {
        selectedReport = data;
        const backdrop = container.querySelector('#report-modal-backdrop');
        const content = container.querySelector('#report-modal-content');

        content.innerHTML = generateReportHTML(data, true);
        backdrop.style.display = 'flex';
        isModalOpen = true;

        // Bind modal close button
        content.querySelector('#close-report-modal-btn')?.addEventListener('click', () => {
            backdrop.style.display = 'none';
            isModalOpen = false;
        });

        // Bind download PDF from within modal
        content.querySelector('#modal-download-pdf-btn')?.addEventListener('click', async () => {
            const btn = content.querySelector('#modal-download-pdf-btn');
            btn.disabled = true;
            btn.textContent = 'Generating PDF...';
            try {
                await downloadPDF(selectedReport);
            } finally {
                btn.disabled = false;
                btn.innerHTML = '📥 Download PDF';
            }
        });

        // Close on backdrop click outside dialog
        backdrop.onclick = (e) => {
            if (e.target === backdrop) {
                backdrop.style.display = 'none';
                isModalOpen = false;
            }
        };
    }

    // =========================================================================
    // EXECUTIVE PROJECT BRIEFING PACK TEMPLATE (FOR TECHNICAL & NON-TECHNICAL AUDIENCES)
    // =========================================================================
    function generateReportHTML(data, isInteractive = false) {
        const project = data.project || {};
        const facultyList = data.faculty || [];
        const studentsList = data.students || [];
        const modules = data.modules || [];
        const tasks = data.tasks || [];

        const projectTitle = project.title || 'Institutional Project Briefing';
        const clientName = project.client_name || 'Rajagiri College of Social Sciences';
        const rawStatus = (project.status || 'in_progress').toLowerCase();
        const statusLabel = rawStatus === 'completed' || rawStatus === 'closed' ? 'Completed' : 'Active Development';
        const projectType = project.project_type || 'Digital Information System';
        const timeline = project.expected_timeline || 'Academic Year 2025-2026';

        // Completion & Progress calculations
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => (t.status || '').toLowerCase() === 'completed').length;
        const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (rawStatus === 'completed' ? 100 : 45);

        const totalMilestones = modules.length;
        const completedMilestones = modules.filter(m => (m.status || '').toLowerCase() === 'completed').length;

        // Clean executive narrative
        const executiveScope = project.requirements || project.deliverables || 'Development of a secure, cloud-enabled institutional management and reporting portal to streamline organizational workflows.';

        // Faculty Lead
        const leadFaculty = facultyList[0] || {
            name: storedUser?.name || 'Faculty Supervisor',
            designation: 'Associate Professor',
            department: 'Department of Computer Applications',
            email: storedUser?.email || 'faculty@rajagiri.edu'
        };

        return `
            <div id="printable-report-wrapper" style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; padding: ${isInteractive ? '35px' : '30px'}; background: #ffffff; line-height: 1.5;">
                
                <!-- Institutional Pack Header -->
                <div style="border-bottom: 3px solid #059669; padding-bottom: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <div style="font-size: 11px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;">
                            RAJAGIRI COLLEGE OF SOCIAL SCIENCES (AUTONOMOUS) &bull; RLABZ
                        </div>
                        <h1 style="margin: 0 0 6px; font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1.25;">
                            ${projectTitle}
                        </h1>
                        <div style="font-size: 13px; color: #475569; font-weight: 500;">
                            Executive Project Briefing Pack &bull; Progress & Governance Report
                        </div>
                        <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">
                            Published: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                    ${isInteractive ? `
                        <div style="display: flex; gap: 10px; align-items: center; flex-shrink: 0;">
                            <button id="modal-download-pdf-btn" style="background: #059669; color: white; border: none; padding: 9px 18px; border-radius: 6px; font-weight: 700; font-size: 12px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                📥 Download PDF
                            </button>
                            <button id="close-report-modal-btn" title="Close" style="background: #f1f5f9; border: 1px solid #cbd5e1; font-size: 16px; border-radius: 6px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b;">
                                ✕
                            </button>
                        </div>
                    ` : ''}
                </div>

                <!-- 1. Executive Project Summary -->
                <div style="margin-bottom: 24px;">
                    <div style="font-size: 13px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px;">
                        1. Executive Project Overview
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: #f8fafc; padding: 14px 18px; border-radius: 10px; border: 1px solid #e2e8f0; font-size: 12px; margin-bottom: 12px;">
                        <div>
                            <span style="color: #64748b; display: block; font-size: 11px; font-weight: 600; text-transform: uppercase;">Beneficiary / Client</span>
                            <strong style="color: #0f172a; font-size: 13px;">${clientName}</strong>
                        </div>
                        <div>
                            <span style="color: #64748b; display: block; font-size: 11px; font-weight: 600; text-transform: uppercase;">Solution Category</span>
                            <strong style="color: #0f172a; font-size: 13px;">${projectType}</strong>
                        </div>
                        <div>
                            <span style="color: #64748b; display: block; font-size: 11px; font-weight: 600; text-transform: uppercase;">Current Status</span>
                            <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; background: ${rawStatus === 'completed' ? '#ecfdf5' : '#eff6ff'}; color: ${rawStatus === 'completed' ? '#059669' : '#1d4ed8'};">
                                ${statusLabel.toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <span style="color: #64748b; display: block; font-size: 11px; font-weight: 600; text-transform: uppercase;">Target Schedule</span>
                            <strong style="color: #0f172a; font-size: 13px;">${timeline}</strong>
                        </div>
                    </div>

                    <!-- Purpose & Scope Summary in Plain Language -->
                    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px;">
                        <span style="color: #64748b; display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">
                            Project Objective & Scope
                        </span>
                        <p style="margin: 0; font-size: 12.5px; color: #334155; line-height: 1.55;">
                            ${executiveScope}
                        </p>
                    </div>
                </div>

                <!-- 2. Overall Progress Indicator -->
                <div style="margin-bottom: 24px;">
                    <div style="font-size: 13px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px;">
                        2. Project Completion & Health
                    </div>
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 18px;">
                        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
                            <span style="font-size: 12px; font-weight: 700; color: #1e293b;">
                                Overall Milestone & Task Progress
                            </span>
                            <span style="font-size: 16px; font-weight: 800; color: #059669;">
                                ${progressPercentage}% Complete
                            </span>
                        </div>
                        <div style="width: 100%; height: 8px; background: #e2e8f0; border-radius: 9999px; overflow: hidden; margin-bottom: 10px;">
                            <div style="width: ${progressPercentage}%; height: 100%; background: #059669; border-radius: 9999px;"></div>
                        </div>
                        <div style="font-size: 11.5px; color: #64748b;">
                            &bull; <strong>${completedTasks}</strong> of <strong>${totalTasks}</strong> operational tasks completed and verified.
                            &nbsp;&bull;&nbsp; <strong>${completedMilestones}</strong> of <strong>${totalMilestones}</strong> project modules delivered.
                        </div>
                    </div>
                </div>

                <!-- 3. Project Supervision & Development Team -->
                <div style="margin-bottom: 24px;">
                    <div style="font-size: 13px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px;">
                        3. Project Leadership & Student Team
                    </div>

                    <!-- Faculty Supervisor -->
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
                        <div>
                            <span style="color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; display: block;">Academic Faculty Supervisor</span>
                            <strong style="font-size: 13px; color: #0f172a;">${leadFaculty.name}</strong>
                            <span style="color: #64748b; margin-left: 6px;">(${leadFaculty.designation || 'Associate Professor'}, ${leadFaculty.department || 'Department of Computer Applications'})</span>
                        </div>
                        <div style="color: #059669; font-weight: 600; font-size: 12px;">
                            ${leadFaculty.email}
                        </div>
                    </div>

                    <!-- Student Team Table -->
                    ${studentsList.length === 0 ? `
                        <p style="font-size: 12px; color: #94a3b8; font-style: italic; margin: 0;">No student team members assigned.</p>
                    ` : `
                        <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                            <thead>
                                <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; text-align: left;">
                                    <th style="padding: 10px 14px; color: #64748b; font-weight: 700; font-size: 11px; text-transform: uppercase;">Team Member</th>
                                    <th style="padding: 10px 14px; color: #64748b; font-weight: 700; font-size: 11px; text-transform: uppercase;">Academic Program</th>
                                    <th style="padding: 10px 14px; color: #64748b; font-weight: 700; font-size: 11px; text-transform: uppercase;">Assigned Project Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${studentsList.map(s => {
                                    const roleStr = (s.role || 'developer').replace('_', ' ');
                                    const formattedRole = roleStr.charAt(0).toUpperCase() + roleStr.slice(1);
                                    return `
                                        <tr style="border-bottom: 1px solid #f1f5f9;">
                                            <td style="padding: 10px 14px;">
                                                <strong style="color: #0f172a;">${s.name}</strong>
                                                <span style="color: #64748b; font-size: 11px; display: block;">${s.email}</span>
                                            </td>
                                            <td style="padding: 10px 14px; color: #475569;">
                                                ${s.course || 'MCA'} &bull; Batch ${s.batch || '2025-2027'}
                                            </td>
                                            <td style="padding: 10px 14px;">
                                                <span style="display: inline-block; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; background: #ecfdf5; color: #059669; text-transform: uppercase;">
                                                    ${formattedRole}
                                                </span>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    `}
                </div>

                <!-- 4. Key Milestones & Functional Deliverables -->
                <div style="margin-bottom: 24px;">
                    <div style="font-size: 13px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px;">
                        4. Project Milestones & Deliverables
                    </div>

                    ${modules.length === 0 ? `
                        <p style="font-size: 12px; color: #94a3b8; font-style: italic; margin: 0;">No milestones configured for this project.</p>
                    ` : `
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            ${modules.map((m, idx) => {
                                const mStatus = (m.status || 'in_progress').toLowerCase();
                                const isDone = mStatus === 'completed';
                                return `
                                    <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; background: #ffffff;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                            <div style="font-size: 13px; font-weight: 700; color: #0f172a;">
                                                Milestone ${idx + 1}: ${m.module_name}
                                            </div>
                                            <span style="padding: 2px 8px; border-radius: 4px; font-size: 10.5px; font-weight: 700; text-transform: uppercase; background: ${isDone ? '#ecfdf5' : '#eff6ff'}; color: ${isDone ? '#059669' : '#1d4ed8'};">
                                                ${isDone ? 'COMPLETED' : 'IN PROGRESS'}
                                            </span>
                                        </div>
                                        <div style="font-size: 11.5px; color: #475569; line-height: 1.45;">
                                            ${m.description || 'Milestone deliverables executed by student team under faculty supervision.'}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </div>

                <!-- 5. Key Completed Activities & Focus -->
                <div style="margin-bottom: 24px;">
                    <div style="font-size: 13px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px;">
                        5. Key Verified Activities
                    </div>
                    ${tasks.length === 0 ? `
                        <p style="font-size: 12px; color: #94a3b8; font-style: italic; margin: 0;">No task activity logged.</p>
                    ` : `
                        <table style="width: 100%; border-collapse: collapse; font-size: 11.5px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                            <thead>
                                <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; text-align: left;">
                                    <th style="padding: 8px 12px; color: #64748b; font-weight: 700; font-size: 11px;">Deliverable Task</th>
                                    <th style="padding: 8px 12px; color: #64748b; font-weight: 700; font-size: 11px;">Associated Milestone</th>
                                    <th style="padding: 8px 12px; color: #64748b; font-weight: 700; font-size: 11px;">Assigned Contributor</th>
                                    <th style="padding: 8px 12px; color: #64748b; font-weight: 700; font-size: 11px;">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tasks.slice(0, 10).map(t => {
                                    const isCompleted = (t.status || '').toLowerCase() === 'completed';
                                    return `
                                        <tr style="border-bottom: 1px solid #f1f5f9;">
                                            <td style="padding: 8px 12px; font-weight: 600; color: #0f172a;">${t.title}</td>
                                            <td style="padding: 8px 12px; color: #475569;">${t.module_name || 'General'}</td>
                                            <td style="padding: 8px 12px; color: #334155;">${t.assigned_to_name || 'Team'}</td>
                                            <td style="padding: 8px 12px;">
                                                <span style="display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 700; text-transform: uppercase; background: ${isCompleted ? '#ecfdf5' : '#f1f5f9'}; color: ${isCompleted ? '#059669' : '#475569'};">
                                                    ${isCompleted ? 'VERIFIED' : 'PLANNED'}
                                                </span>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    `}
                </div>

                <!-- 6. Institutional Verification & Formal Sign-Off -->
                <div style="margin-top: 26px; padding: 16px 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 15px;">
                    <div style="max-width: 65%;">
                        <strong style="font-size: 12px; color: #0f172a; display: block; margin-bottom: 4px;">Faculty Supervisor Certification</strong>
                        <p style="margin: 0; font-size: 11px; color: #475569; line-height: 1.45;">
                            This briefing pack certifies that the milestone deliverables and student developmental activities described herein have been verified in accordance with institutional incubation standards.
                        </p>
                    </div>
                    <div style="text-align: right; min-width: 170px;">
                        <div style="border-bottom: 1px solid #0f172a; width: 140px; margin-left: auto; margin-bottom: 5px;"></div>
                        <div style="font-size: 11.5px; font-weight: 700; color: #0f172a;">${leadFaculty.name}</div>
                        <div style="font-size: 10px; color: #64748b;">${leadFaculty.designation || 'Faculty Supervisor'}</div>
                        <div style="font-size: 9.5px; color: #94a3b8; margin-top: 2px;">Rajagiri College of Social Sciences</div>
                    </div>
                </div>

                <!-- Institutional Footer -->
                <div style="margin-top: 20px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 10px;">
                    RLabZ ERP Institutional Incubation &bull; Official Project Briefing Pack &bull; Rajagiri College of Social Sciences (Autonomous)
                </div>
            </div>
        `;
    }

    async function downloadPDF(reportData) {
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.style.width = '850px';
        tempContainer.innerHTML = generateReportHTML(reportData, false);
        document.body.appendChild(tempContainer);

        const projectTitle = reportData.project?.title || 'Project';
        const sanitizedTitle = projectTitle.replace(/[^a-zA-Z0-9_-]/g, '_');

        try {
            await html2pdf().set({
                margin: [0.35, 0.35, 0.35, 0.35],
                filename: `Project_Briefing_Pack_${sanitizedTitle}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: 'css', avoid: 'tr' }
            }).from(tempContainer.querySelector('#printable-report-wrapper')).save();
        } finally {
            document.body.removeChild(tempContainer);
        }
    }

    // Load projects assigned to currently logged-in faculty
    async function loadAssignedProjects() {
        try {
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };
            const queryParam = storedUser?.email ? `?email=${encodeURIComponent(storedUser.email)}` : '';
            const res = await fetch(`${apiBase}/faculty/projects${queryParam}`, { headers });
            if (res.ok) {
                projects = await res.json();
            } else {
                projects = [];
            }
        } catch (err) {
            console.error('Error fetching assigned projects for report:', err);
            projects = [];
        } finally {
            isLoading = false;
            renderUI();
        }
    }

    renderUI();
    loadAssignedProjects();

    return container;
}

export default FacultyReports;
