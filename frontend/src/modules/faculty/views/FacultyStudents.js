import '../faculty.css';
import { API_BASE } from '@/core/config/api.js';

export function FacultyStudents() {
    const container = document.createElement('div');
    container.className = 'faculty-students';

    let storedUser = null;
    try {
        storedUser = JSON.parse(localStorage.getItem('user'));
    } catch (e) {
        storedUser = null;
    }

    const token = localStorage.getItem('token');
    let students = [];
    let isLoading = true;

    function renderStars(rating) {
        if (!rating || rating <= 0) {
            return `
                <div style="display: inline-flex; align-items: center; gap: 0.4rem; background: var(--bg-canvas-light); border: 1px solid var(--border-subtle); padding: 0.25rem 0.65rem; border-radius: 8px;">
                    <span style="color: #cbd5e1; font-size: 0.9rem; letter-spacing: 1px;">☆☆☆☆☆</span>
                    <span style="font-size: 0.76rem; color: var(--text-secondary); font-style: italic;">Unrated</span>
                </div>
            `;
        }
        const fullStars = Math.min(5, Math.floor(rating));
        const emptyStars = Math.max(0, 5 - fullStars);
        let starsHtml = '';
        for (let i = 0; i < fullStars; i++) starsHtml += '<span style="color: #eab308;">★</span>';
        for (let i = 0; i < emptyStars; i++) starsHtml += '<span style="color: #cbd5e1;">☆</span>';

        return `
            <div style="display: inline-flex; align-items: center; gap: 0.45rem; background: #fffdf5; border: 1px solid #fef08a; padding: 0.25rem 0.65rem; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.03);">
                <span style="font-size: 0.95rem; letter-spacing: 1px; display: inline-flex;">${starsHtml}</span>
                <strong style="font-size: 0.82rem; color: #854d0e;">${Number(rating).toFixed(1)}</strong>
            </div>
        `;
    }

    function renderUI() {
        container.innerHTML = `
            <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
                <div>
                    <h1>Students</h1>
                    <p>Students working on projects assigned to you.</p>
                </div>
                <div style="width: 340px; max-width: 100%;">
                    <input
                        type="text"
                        id="faculty-student-search"
                        class="app-search-input"
                        placeholder="Search student, email, project, designation..."
                    />
                </div>
            </div>

            <div class="faculty-student-table-container">
                <table class="faculty-student-table">
                    <thead>
                        <tr>
                            <th>Student Name</th>
                            <th>Email</th>
                            <th>Project Name</th>
                            <th>Designation</th>
                            <th style="min-width: 180px;">Ratings</th>
                            <th style="min-width: 150px;">Other Projects</th>
                        </tr>
                    </thead>
                    <tbody id="faculty-student-table-body">
                        ${renderTableBody(students)}
                    </tbody>
                </table>
            </div>
        `;

        const searchInput = container.querySelector('#faculty-student-search');
        const tableBody = container.querySelector('#faculty-student-table-body');

        setupOtherProjectsListeners();

        searchInput.addEventListener('input', () => {
            const searchValue = searchInput.value.toLowerCase().trim();

            const filteredStudents = students.filter(student =>
                (student.student_name || '').toLowerCase().includes(searchValue) ||
                (student.student_email || '').toLowerCase().includes(searchValue) ||
                (student.projects || []).some(p => p.toLowerCase().includes(searchValue)) ||
                (student.designations || []).some(d => d.toLowerCase().includes(searchValue)) ||
                (student.other_projects || []).some(op => op.toLowerCase().includes(searchValue))
            );

            tableBody.innerHTML = renderTableBody(filteredStudents);
            setupOtherProjectsListeners();
        });
    }

    function groupStudents(rawList) {
        const studentMap = new Map();

        (rawList || []).forEach(item => {
            const email = (item.student_email || item.email || '').trim();
            const name = (item.student_name || item.name || '').trim();
            const id = item.student_id || item.id || null;
            const key = id ? `id_${id}` : (email ? `email_${email.toLowerCase()}` : `name_${name}`);

            const projectName = (item.project_name || item.project || '').trim();
            const projectId = item.project_id || null;
            const designation = (item.designation || 'Nova').trim();
            const rating = item.avg_rating !== undefined && item.avg_rating !== null ? parseFloat(item.avg_rating) : (item.rating !== undefined && item.rating !== null ? parseFloat(item.rating) : null);
            const ratedCount = item.rated_tasks_count || 0;

            const otherProjects = Array.isArray(item.other_projects) ? item.other_projects : [];

            if (!studentMap.has(key)) {
                studentMap.set(key, {
                    student_id: id,
                    student_name: name || 'Unknown Student',
                    student_email: email || 'No email',
                    projects: projectName ? [projectName] : [],
                    designations: designation ? [designation] : [],
                    other_projects: [...otherProjects],
                    project_ratings: projectName ? [{
                        project_id: projectId,
                        project_name: projectName,
                        rating: rating,
                        rated_count: ratedCount
                    }] : []
                });
            } else {
                const existing = studentMap.get(key);
                if (projectName && !existing.projects.includes(projectName)) {
                    existing.projects.push(projectName);
                    existing.project_ratings.push({
                        project_id: projectId,
                        project_name: projectName,
                        rating: rating,
                        rated_count: ratedCount
                    });
                }
                if (designation && !existing.designations.includes(designation)) {
                    existing.designations.push(designation);
                }
                otherProjects.forEach(op => {
                    if (!existing.other_projects.includes(op)) {
                        existing.other_projects.push(op);
                    }
                });
            }
        });

        return Array.from(studentMap.values());
    }

    function renderTableBody(data) {
        if (isLoading) {
            return `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 25px;">Loading students under your assigned projects...</td></tr>`;
        }

        if (!data || data.length === 0) {
            return `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 30px;">No students found under your assigned projects.</td></tr>`;
        }

        return data.map(student => {
            const name = student.student_name || 'Unknown Student';
            const email = student.student_email || 'No email';
            const projects = student.projects && student.projects.length > 0 ? student.projects : ['Unassigned Project'];
            const designations = student.designations && student.designations.length > 0 ? student.designations : ['Nova'];
            const pRatings = student.project_ratings && student.project_ratings.length > 0 ? student.project_ratings : [{ rating: null, project_name: '' }];
            const otherProjects = student.other_projects || [];
            const safeStudentId = student.student_id ? `student-${student.student_id}` : `student-${Math.random().toString(36).substring(2, 8)}`;

            return `
                <tr>
                    <td style="font-weight: 600; color: #1e293b; vertical-align: middle;">
                        ${name}
                    </td>
                    <td style="color: #475569; vertical-align: middle;">
                        ${email}
                    </td>
                    <td style="color: #1e293b; font-weight: 500; vertical-align: middle;">
                        <div style="display: flex; flex-direction: column; gap: 0.35rem;">
                            ${projects.map(p => `
                                <div style="display: inline-flex; align-items: center; gap: 0.4rem;">
                                    <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--primary, var(--primary)); flex-shrink: 0;"></span>
                                    <span>${p}</span>
                                </div>
                            `).join('')}
                        </div>
                    </td>
                    <td style="vertical-align: middle;">
                        <div style="display: flex; flex-wrap: wrap; gap: 0.35rem;">
                            ${designations.map(des => `
                                <span class="faculty-designation ${des.toLowerCase()}">
                                    ${des}
                                </span>
                            `).join('')}
                        </div>
                    </td>
                    <td style="vertical-align: middle;">
                        <div style="display: flex; flex-direction: column; gap: 0.45rem;">
                            ${pRatings.map(pr => `
                                <div>
                                    ${renderStars(pr.rating)}
                                    ${student.projects.length > 1 && pr.project_name ? `
                                        <span style="display: block; font-size: 0.72rem; color: var(--text-secondary); margin-top: 2px;">${pr.project_name}</span>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </td>
                    <td style="vertical-align: middle; text-align: left;">
                        <button 
                            type="button" 
                            class="btn btn-outline btn-sm btn-show-other-projects" 
                            data-student-id="${safeStudentId}" 
                            data-student-name="${name}" 
                            data-other-projects="${encodeURIComponent(JSON.stringify(otherProjects))}"
                            style="display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; padding: 0.35rem 0.75rem; border-radius: 6px;"
                            title="Show other projects this student is working in"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                            <span>Other Projects (${otherProjects.length})</span>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function setupOtherProjectsListeners() {
        const tableBody = container.querySelector('#faculty-student-table-body');
        if (!tableBody) return;

        tableBody.querySelectorAll('.btn-show-other-projects').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const studentName = btn.getAttribute('data-student-name') || 'Student';
                let otherProjList = [];
                try {
                    otherProjList = JSON.parse(decodeURIComponent(btn.getAttribute('data-other-projects') || '[]'));
                } catch (err) {
                    otherProjList = [];
                }
                openOtherProjectsModal(studentName, otherProjList);
            });
        });
    }

    function openOtherProjectsModal(studentName, otherProjects) {
        let modalBackdrop = document.getElementById('faculty-other-projects-modal');
        if (modalBackdrop) modalBackdrop.remove();

        modalBackdrop = document.createElement('div');
        modalBackdrop.id = 'faculty-other-projects-modal';
        modalBackdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(15, 23, 42, 0.45);
            backdrop-filter: blur(2px);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        `;

        modalBackdrop.innerHTML = `
            <div style="background: var(--surface-card, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); max-width: 480px; width: 100%; overflow: hidden; animation: fadeInScale 0.2s ease;">
                <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color, #e2e8f0); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h3 style="margin: 0 0 2px; font-size: 1.1rem; font-weight: 700; color: var(--text-main, #0f172a);">Other Projects</h3>
                        <p style="margin: 0; font-size: 0.82rem; color: var(--text-muted, #64748b);">Projects allocated to <strong style="color: var(--text-main, #1e293b);">${studentName}</strong> outside your mentorship.</p>
                    </div>
                    <button type="button" id="btn-close-other-proj-modal" style="background: none; border: none; font-size: 1.4rem; color: var(--text-secondary, #64748b); cursor: pointer; padding: 0 4px; line-height: 1;">&times;</button>
                </div>
                <div style="padding: 1.5rem; max-height: 360px; overflow-y: auto;">
                    ${otherProjects.length === 0 ? `
                        <div style="text-align: center; padding: 1.5rem 0; color: var(--text-muted, #64748b); font-size: 0.9rem;">
                            <div style="margin-bottom: 0.5rem; font-size: 1.5rem;">📁</div>
                            <p style="margin: 0;">This student is not currently enrolled in any other projects.</p>
                        </div>
                    ` : `
                        <div style="display: flex; flex-direction: column; gap: 0.65rem;">
                            ${otherProjects.map((pName, idx) => `
                                <div style="display: flex; align-items: center; gap: 0.6rem; padding: 0.75rem 1rem; background: var(--bg-main, #f8fafc); border: 1px solid var(--border-color, #e2e8f0); border-radius: 8px;">
                                    <span style="display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: var(--primary-light, #ecfdf5); color: var(--primary, #059669); font-size: 0.75rem; font-weight: 700; flex-shrink: 0;">
                                        ${idx + 1}
                                    </span>
                                    <span style="font-size: 0.92rem; font-weight: 600; color: var(--text-main, #0f172a); word-break: break-word;">
                                        ${pName}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
                <div style="padding: 0.85rem 1.5rem; background: var(--bg-main, #f8fafc); border-top: 1px solid var(--border-color, #e2e8f0); display: flex; justify-content: flex-end;">
                    <button type="button" id="btn-ok-other-proj-modal" class="btn btn-primary btn-sm" style="padding: 0.4rem 1.25rem;">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modalBackdrop);

        const closeModal = () => modalBackdrop.remove();
        modalBackdrop.querySelector('#btn-close-other-proj-modal').addEventListener('click', closeModal);
        modalBackdrop.querySelector('#btn-ok-other-proj-modal').addEventListener('click', closeModal);
        modalBackdrop.addEventListener('click', (e) => {
            if (e.target === modalBackdrop) closeModal();
        });
    }

    async function loadStudents() {
        try {
            const apiBase = API_BASE;
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };
            const queryParam = storedUser?.email ? `?email=${encodeURIComponent(storedUser.email)}` : '';
            const res = await fetch(`${apiBase}/faculty/students${queryParam}`, { headers });

            if (res.ok) {
                const data = await res.json();
                students = groupStudents(Array.isArray(data) ? data : []);
            } else {
                students = [];
            }
        } catch (err) {
            console.warn('Could not fetch students from API:', err);
            students = [];
        } finally {
            isLoading = false;
            const tableBody = container.querySelector('#faculty-student-table-body');
            if (tableBody) {
                tableBody.innerHTML = renderTableBody(students);
                setupOtherProjectsListeners();
            }
        }
    }

    renderUI();
    loadStudents();

    return container;
}

export default FacultyStudents;