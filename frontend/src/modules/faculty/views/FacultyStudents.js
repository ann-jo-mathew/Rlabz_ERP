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
                <div style="display: inline-flex; align-items: center; gap: 0.4rem; background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.25rem 0.65rem; border-radius: 8px;">
                    <span style="color: #cbd5e1; font-size: 0.9rem; letter-spacing: 1px;">☆☆☆☆☆</span>
                    <span style="font-size: 0.76rem; color: #94a3b8; font-style: italic;">Unrated</span>
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
                <div style="position: relative; width: 340px; max-width: 100%;">
                    <input 
                        type="text" 
                        id="faculty-student-search" 
                        class="premium-input" 
                        placeholder="Search student, email, project, designation..." 
                        style="padding-left: 2.25rem; font-size: 0.88rem; height: 40px; border-radius: 8px;"
                    />
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 12px; top: 13px; color: #94a3b8;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
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

        searchInput.addEventListener('input', () => {
            const searchValue = searchInput.value.toLowerCase().trim();

            const filteredStudents = students.filter(student =>
                (student.student_name || '').toLowerCase().includes(searchValue) ||
                (student.student_email || '').toLowerCase().includes(searchValue) ||
                (student.projects || []).some(p => p.toLowerCase().includes(searchValue)) ||
                (student.designations || []).some(d => d.toLowerCase().includes(searchValue))
            );

            tableBody.innerHTML = renderTableBody(filteredStudents);
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

            if (!studentMap.has(key)) {
                studentMap.set(key, {
                    student_id: id,
                    student_name: name || 'Unknown Student',
                    student_email: email || 'No email',
                    projects: projectName ? [projectName] : [],
                    designations: designation ? [designation] : [],
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
            }
        });

        return Array.from(studentMap.values());
    }

    function renderTableBody(data) {
        if (isLoading) {
            return `<tr><td colspan="5" style="text-align: center; color: #64748b; padding: 25px;">Loading students under your assigned projects...</td></tr>`;
        }

        if (!data || data.length === 0) {
            return `<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 30px;">No students found under your assigned projects.</td></tr>`;
        }

        return data.map(student => {
            const name = student.student_name || 'Unknown Student';
            const email = student.student_email || 'No email';
            const projects = student.projects && student.projects.length > 0 ? student.projects : ['Unassigned Project'];
            const designations = student.designations && student.designations.length > 0 ? student.designations : ['Nova'];
            const pRatings = student.project_ratings && student.project_ratings.length > 0 ? student.project_ratings : [{ rating: null, project_name: '' }];

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
                                        <span style="display: block; font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">${pr.project_name}</span>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
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
                // Fallback default sample for assigned projects
                students = groupStudents([
                    { student_name: 'Student Nova', student_email: 'nova@rajagiri.edu', project_name: 'RLabZ ERP - Student Portal', designation: 'Nova' },
                    { student_name: 'Student Orbit', student_email: 'orbit@rajagiri.edu', project_name: 'RLabZ ERP - Student Portal', designation: 'Orbit' },
                    { student_name: 'Student Spark', student_email: 'spark@rajagiri.edu', project_name: 'RLabZ ERP - Student Portal', designation: 'Spark' }
                ]);
            }
        } catch (err) {
            console.warn('Could not fetch students from API, using fallback data:', err);
            students = groupStudents([
                { student_name: 'Student Nova', student_email: 'nova@rajagiri.edu', project_name: 'RLabZ ERP - Student Portal', designation: 'Nova' },
                { student_name: 'Student Orbit', student_email: 'orbit@rajagiri.edu', project_name: 'RLabZ ERP - Student Portal', designation: 'Orbit' },
                { student_name: 'Student Spark', student_email: 'spark@rajagiri.edu', project_name: 'RLabZ ERP - Student Portal', designation: 'Spark' }
            ]);
        } finally {
            isLoading = false;
            const tableBody = container.querySelector('#faculty-student-table-body');
            if (tableBody) {
                tableBody.innerHTML = renderTableBody(students);
            }
        }
    }

    renderUI();
    loadStudents();

    return container;
}

export default FacultyStudents;