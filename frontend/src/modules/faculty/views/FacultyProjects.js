import '../faculty.css';

export function FacultyProjects() {

    const projects = [
        {
            id: 1,
            name: 'RLabZ ERP',
            client: 'Rajagiri College',
            type: 'ERP',
            status: 'In Progress',
            progress: 70,
            assignedDate: '01 Aug 2026',
            description: 'A comprehensive Enterprise Resource Planning software for managing college activities, academic records, and department workflows.',
            requirementsText: 'Requirements for RLabZ ERP:\n1. Role-based dashboards for Director, Coordinator, Faculty, Students.\n2. GitHub and Sprint integration modules.\n3. Secure authentication and session management.\n4. Dynamic report generation & downloading.',
            students: [
                { name: 'Sandra', role: 'Nova / Lead' },
                { name: 'Anju', role: 'Orbit / Developer' },
                { name: 'Rahul', role: 'Spark / Tester' }
            ],
            github: 'Verified'
        },
        {
            id: 2,
            name: 'Student Management System',
            client: 'Computer Science Department',
            type: 'Web Application',
            status: 'In Progress',
            progress: 50,
            assignedDate: '03 Aug 2026',
            description: 'A web portal to manage student registration, grading, attendance tracking, and reporting for the CS department.',
            requirementsText: 'Requirements for Student Management System:\n1. Fast student profile setup.\n2. Dynamic attendance recording.\n3. Automatic grade calculation.\n4. Notifications for attendance shortage.',
            students: [
                { name: 'Neha', role: 'Orbit / Designer' },
                { name: 'Sam', role: 'Spark / Developer' }
            ],
            github: 'Pending'
        },
        {
            id: 3,
            name: 'Hospital Management System',
            client: 'ABC Hospital',
            type: 'Web Application',
            status: 'In Progress',
            progress: 35,
            assignedDate: '05 Aug 2026',
            description: 'An application designed for hospital receptionists, doctors, and patients to schedule appointments and manage billing.',
            requirementsText: 'Requirements for Hospital Management System:\n1. Patient appointment scheduling.\n2. Doctor schedule management.\n3. Billing and invoicing module.\n4. Electronic health records.',
            students: [
                { name: 'Arun', role: 'Spark / Frontend' },
                { name: 'Megha', role: 'Orbit / Backend' }
            ],
            github: 'Pending'
        }
    ];

    const container = document.createElement('div');
    container.className = 'faculty-projects';

    container.innerHTML = `
        <div class="page-header">
            <h1>My Projects</h1>
            <p>View and manage details of your assigned projects.</p>
        </div>

        <div class="faculty-project-grid">
            ${projects.map(project => `
                <div class="faculty-project-detail-card" style="display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div class="project-card-header">
                            <div>
                                <h2>${project.name}</h2>
                                <p>Client: ${project.client}</p>
                            </div>
                            <span class="faculty-status active">
                                ${project.status}
                            </span>
                        </div>

                        <div class="project-information">
                            <div>
                                <span>Project Type</span>
                                <strong>${project.type}</strong>
                            </div>
                            <div>
                                <span>Students</span>
                                <strong>${project.students.length}</strong>
                            </div>
                            <div>
                                <span>GitHub</span>
                                <strong>${project.github}</strong>
                            </div>
                        </div>

                        <div class="faculty-project-progress">
                            <div class="progress-header">
                                <span>Project Progress</span>
                                <strong>${project.progress}%</strong>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width:${project.progress}%"></div>
                            </div>
                        </div>
                    </div>

                    <button class="faculty-project-view" data-id="${project.id}" style="margin-top: 15px;">
                        View Project
                    </button>
                </div>
            `).join('')}
        </div>
        
        <div class="project-details-container" style="margin-top: 30px;"></div>
    `;

    // Add event listeners for "View Project" buttons
    const detailsContainer = container.querySelector('.project-details-container');
    const viewButtons = container.querySelectorAll('.faculty-project-view');
    
    viewButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const projectId = parseInt(e.target.getAttribute('data-id'));
            const project = projects.find(p => p.id === projectId);
            
            if (project) {
                renderProjectDetails(project, detailsContainer);
            }
        });
    });

    function renderProjectDetails(project, targetElement) {
        targetElement.innerHTML = `
            <div class="faculty-project-details animate-fade-in" style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <div class="faculty-project-detail-header" style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px; margin-bottom: 20px;">
                    <div>
                        <h2 style="margin: 0; color: #1e293b; font-size: 20px;">${project.name} - Detailed View</h2>
                        <p style="margin: 5px 0 0; color: #64748b; font-size: 13px;">Assigned Date: <strong>${project.assignedDate}</strong></p>
                    </div>
                    <button class="faculty-close-button" aria-label="Close" style="border: none; background: #f1f5f9; color: #64748b; width: 30px; height: 30px; border-radius: 50%; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center;">&times;</button>
                </div>
                
                <div class="project-desc-section" style="margin-bottom: 20px;">
                    <h3 style="font-size: 15px; margin: 0 0 8px; color: #475569;">Project Description</h3>
                    <p style="font-size: 14px; color: #334155; line-height: 1.5; margin: 0; background: #f8fafc; padding: 12px; border-radius: 8px; border-left: 3px solid #cbd5e1;">
                        ${project.description}
                    </p>
                </div>

                <div class="students-assigned-section" style="margin-bottom: 25px;">
                    <h3 style="font-size: 15px; margin: 0 0 10px; color: #475569;">Assigned Students</h3>
                    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                            <thead>
                                <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                                    <th style="padding: 10px 15px; font-weight: 600; color: #64748b;">Student Name</th>
                                    <th style="padding: 10px 15px; font-weight: 600; color: #64748b;">Project Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${project.students.map(student => `
                                    <tr style="border-bottom: 1px solid #f1f5f9;">
                                        <td style="padding: 10px 15px; font-weight: 600; color: #1e293b;">${student.name}</td>
                                        <td style="padding: 10px 15px; color: #475569;">${student.role}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="requirements-section" style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
                    <h3 style="font-size: 15px; margin: 0 0 12px; color: #475569;">Requirements Details</h3>
                    <div style="display: flex; gap: 12px;">
                        <button id="view-req-btn" class="btn-edit" style="font-size: 13px; padding: 10px 16px;">
                            👁️ View Requirements
                        </button>
                        <button id="download-req-btn" class="btn-verify" style="font-size: 13px; padding: 10px 16px; background: #087f5b; color: white;">
                            📥 Download Requirements
                        </button>
                    </div>
                    
                    <div id="requirements-display" style="display: none; margin-top: 15px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; font-family: monospace; font-size: 12px; white-space: pre-wrap; color: #1e293b;">
                        ${project.requirementsText}
                    </div>
                </div>
            </div>
        `;

        // Close button logic
        targetElement.querySelector('.faculty-close-button').addEventListener('click', () => {
            targetElement.innerHTML = '';
        });

        // View Requirements toggle logic
        const viewReqBtn = targetElement.querySelector('#view-req-btn');
        const reqDisplay = targetElement.querySelector('#requirements-display');
        viewReqBtn?.addEventListener('click', () => {
            const isHidden = reqDisplay.style.display === 'none';
            reqDisplay.style.display = isHidden ? 'block' : 'none';
            viewReqBtn.textContent = isHidden ? '🙈 Hide Requirements' : '👁️ View Requirements';
        });

        // Download Requirements file generator
        const downloadReqBtn = targetElement.querySelector('#download-req-btn');
        downloadReqBtn?.addEventListener('click', () => {
            const blob = new Blob([project.requirementsText], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${project.name.replace(/\s+/g, '_')}_requirements.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
        
        // Scroll into view smoothly
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    return container;
}

export default FacultyProjects;