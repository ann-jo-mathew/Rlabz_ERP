import '../faculty.css';

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
                (student.student_name || student.name || '').toLowerCase().includes(searchValue) ||
                (student.student_email || student.email || '').toLowerCase().includes(searchValue) ||
                (student.project_name || student.project || '').toLowerCase().includes(searchValue) ||
                (student.designation || '').toLowerCase().includes(searchValue)
            );

            tableBody.innerHTML = renderTableBody(filteredStudents);
        });
    }

    function renderTableBody(data) {
        if (isLoading) {
            return `<tr><td colspan="4" style="text-align: center; color: #64748b; padding: 25px;">Loading students under your assigned projects...</td></tr>`;
        }

        if (!data || data.length === 0) {
            return `<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 30px;">No students found under your assigned projects.</td></tr>`;
        }

        return data.map(student => {
            const name = student.student_name || student.name || 'Unknown Student';
            const email = student.student_email || student.email || 'No email';
            const project = student.project_name || student.project || 'Unassigned Project';
            const designation = student.designation || 'Nova';
            const designationClass = designation.toLowerCase();

            return `
                <tr>
                    <td style="font-weight: 600; color: #1e293b;">
                        ${name}
                    </td>
                    <td style="color: #475569;">
                        ${email}
                    </td>
                    <td style="color: #1e293b; font-weight: 500;">
                        ${project}
                    </td>
                    <td>
                        <span class="faculty-designation ${designationClass}">
                            ${designation}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    }

    async function loadStudents() {
        try {
            const apiBase = window.location.port === '8000' ? '/api' : 'http://127.0.0.1:8000/api';
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };
            const queryParam = storedUser?.email ? `?email=${encodeURIComponent(storedUser.email)}` : '';
            const res = await fetch(`${apiBase}/faculty/students${queryParam}`, { headers });

            if (res.ok) {
                const data = await res.json();
                students = Array.isArray(data) ? data : [];
            } else {
                // Fallback default sample for assigned projects
                students = [
                    { student_name: 'Student Nova', student_email: 'nova@rajagiri.edu', project_name: 'RLabZ ERP - Student Portal', designation: 'Nova' },
                    { student_name: 'Student Orbit', student_email: 'orbit@rajagiri.edu', project_name: 'RLabZ ERP - Student Portal', designation: 'Orbit' },
                    { student_name: 'Student Spark', student_email: 'spark@rajagiri.edu', project_name: 'RLabZ ERP - Student Portal', designation: 'Spark' }
                ];
            }
        } catch (err) {
            console.warn('Could not fetch students from API, using fallback data:', err);
            students = [
                { student_name: 'Student Nova', student_email: 'nova@rajagiri.edu', project_name: 'RLabZ ERP - Student Portal', designation: 'Nova' },
                { student_name: 'Student Orbit', student_email: 'orbit@rajagiri.edu', project_name: 'RLabZ ERP - Student Portal', designation: 'Orbit' },
                { student_name: 'Student Spark', student_email: 'spark@rajagiri.edu', project_name: 'RLabZ ERP - Student Portal', designation: 'Spark' }
            ];
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