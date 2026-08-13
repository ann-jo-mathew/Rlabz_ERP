import '../faculty.css';

export function FacultyReports() {
    const container = document.createElement('div');
    container.className = 'faculty-reports';

    const projects = [
        {
            id: 1,
            name: 'RLabZ ERP',
            client: 'Rajagiri College',
            assignedDate: '01 Aug 2026',
            description: 'A comprehensive Enterprise Resource Planning software for managing college activities, academic records, and department workflows.',
            progress: 70,
            status: 'In Progress',
            students: [
                { name: 'Sandra', role: 'Nova / Lead' },
                { name: 'Anju', role: 'Orbit / Developer' },
                { name: 'Rahul', role: 'Spark / Tester' }
            ],
            sprints: [
                { name: 'Sprint 1: Authentication & Schema', status: 'Verified', dates: '01 Aug - 07 Aug', deliverables: 'Database schema design and JWT auth endpoints.', message: 'Excellent database normalization and secure password hashing.' },
                { name: 'Sprint 2: Dashboard Layout', status: 'Pending Verification', dates: '08 Aug - 14 Aug', deliverables: 'HTML layout, theme customization, and sidebar navigation.', message: '' }
            ]
        },
        {
            id: 2,
            name: 'Student Management System',
            client: 'Computer Science Department',
            assignedDate: '03 Aug 2026',
            description: 'A web portal to manage student registration, grading, attendance tracking, and reporting for the CS department.',
            progress: 50,
            status: 'In Progress',
            students: [
                { name: 'Neha', role: 'Orbit / Designer' },
                { name: 'Sam', role: 'Spark / Developer' }
            ],
            sprints: [
                { name: 'Sprint 1: Database Setup & CRUD APIs', status: 'Verified', dates: '03 Aug - 09 Aug', deliverables: 'PostgreSQL schema setup and CRUD APIs for students.', message: 'All APIs are functioning correctly.' },
                { name: 'Sprint 2: Attendance Tracking UI', status: 'In Progress', dates: '10 Aug - 16 Aug', deliverables: 'Attendance grid and student registration forms.', message: '' }
            ]
        },
        {
            id: 3,
            name: 'Hospital Management System',
            client: 'ABC Hospital',
            assignedDate: '05 Aug 2026',
            description: 'An application designed for hospital receptionists, doctors, and patients to schedule appointments and manage billing.',
            progress: 35,
            status: 'In Progress',
            students: [
                { name: 'Arun', role: 'Spark / Frontend' },
                { name: 'Megha', role: 'Orbit / Backend' }
            ],
            sprints: [
                { name: 'Sprint 1: UI Wireframes & Mockups', status: 'Pending Verification', dates: '05 Aug - 11 Aug', deliverables: 'Figma wireframes for receptionist dashboard and doctor schedules.', message: '' }
            ]
        }
    ];

    container.innerHTML = `
        <div class="page-header">
            <h1>Reports</h1>
            <p>Generate and download comprehensive project status reports.</p>
        </div>

        <div class="report-table-card">
            <table class="faculty-student-table" style="width: 100%;">
                <thead>
                    <tr>
                        <th style="padding: 16px 20px;">Project Title</th>
                        <th style="padding: 16px 20px;">Client</th>
                        <th style="padding: 16px 20px;">Assigned Date</th>
                        <th style="padding: 16px 20px;">Current Progress</th>
                        <th style="padding: 16px 20px; text-align: right;">Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${projects.map(project => `
                        <tr>
                            <td style="padding: 16px 20px; font-weight: 700; color: #1e293b;">${project.name}</td>
                            <td style="padding: 16px 20px; color: #475569;">${project.client}</td>
                            <td style="padding: 16px 20px; color: #475569;">${project.assignedDate}</td>
                            <td style="padding: 16px 20px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div class="progress-bar" style="width: 100px; height: 8px; margin: 0;">
                                        <div class="progress-fill" style="width: ${project.progress}%;"></div>
                                    </div>
                                    <span style="font-weight: 600; color: #087f5b; font-size: 13px;">${project.progress}%</span>
                                </div>
                            </td>
                            <td style="padding: 16px 20px; text-align: right;">
                                <button class="report-btn-download" data-id="${project.id}">
                                    📥 Download Report
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    // Bind download report buttons
    container.querySelectorAll('.report-btn-download').forEach(button => {
        button.addEventListener('click', () => {
            const projectId = parseInt(button.getAttribute('data-id'));
            const project = projects.find(p => p.id === projectId);
            if (project) {
                generateAndDownloadReport(project);
            }
        });
    });

    function generateAndDownloadReport(project) {
        // Build markdown report
        const reportContent = `
# PROJECT PROGRESS REPORT: ${project.name.toUpperCase()}
Generated on: ${new Date().toLocaleDateString()}

============================================================
1. PROJECT OVERVIEW
============================================================
* Project Title: ${project.name}
* Client Name: ${project.client}
* Assigned Date: ${project.assignedDate}
* Current Status: ${project.status}
* Completion Progress: ${project.progress}%

* Project Description:
  ${project.description}

============================================================
2. ASSIGNED STUDENTS DETAILS
============================================================
${project.students.map((s, idx) => `  ${idx + 1}. ${s.name} - Role: ${s.role}`).join('\n')}

============================================================
3. SPRINT DETAILS & DELIVERABLES
============================================================
${project.sprints.map((s, idx) => `
Sprint #${idx + 1}: ${s.name}
------------------------------------------------------------
* Schedule: ${s.dates}
* Verification Status: ${s.status}
* Student Deliverables:
  ${s.deliverables}
* Faculty Message/Feedback:
  ${s.message ? s.message : 'No feedback message.'}
`).join('\n')}

============================================================
4. PROGRESS AUDIT TRAIL SUMMARY
============================================================
Project is currently at ${project.progress}% completion. Sprint schedules have been verified and documented.

Report compiled by Faculty Coordinator.
RLabZ ERP Academic Portal.
        `.trim();

        // Create Blob & Trigger Download
        const blob = new Blob([reportContent], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${project.name.replace(/\s+/g, '_')}_Project_Report.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    return container;
}

export default FacultyReports;
