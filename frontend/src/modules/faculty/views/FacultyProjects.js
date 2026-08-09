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
            students: 5,
            github: 'Verified'
        },
        {
            id: 2,
            name: 'Student Management System',
            client: 'Computer Science Department',
            type: 'Web Application',
            status: 'In Progress',
            progress: 50,
            students: 4,
            github: 'Pending'
        },
        {
            id: 3,
            name: 'Hospital Management System',
            client: 'ABC Hospital',
            type: 'Web Application',
            status: 'In Progress',
            progress: 35,
            students: 3,
            github: 'Pending'
        }
    ];

    const container = document.createElement('div');
    container.className = 'faculty-projects';

    container.innerHTML = `
        <div class="page-header">
            <h1>My Projects</h1>
            <p>Projects assigned to you.</p>
        </div>

        <div class="faculty-project-grid">
            ${projects.map(project => `
                <div class="faculty-project-detail-card">
                    <div class="project-card-header">
                        <div>
                            <h2>${project.name}</h2>
                            <p>${project.client}</p>
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
                            <strong>${project.students}</strong>
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

                    <button class="faculty-project-view" data-id="${project.id}">
                        View Project
                    </button>
                </div>
            `).join('')}
        </div>
        
        <div class="project-details-container"></div>
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
            <div class="faculty-project-details animate-fade-in">
                <div class="faculty-project-detail-header">
                    <div>
                        <h2>${project.name}</h2>
                        <p>Project Details & Assignment</p>
                    </div>
                    <button class="faculty-close-button" aria-label="Close">&times;</button>
                </div>
                
                <div class="faculty-project-info">
                    <div>
                        <span>Client</span>
                        <strong>${project.client}</strong>
                    </div>
                    <div>
                        <span>Project Type</span>
                        <strong>${project.type}</strong>
                    </div>
                    <div>
                        <span>Current Progress</span>
                        <strong>${project.progress}%</strong>
                    </div>
                </div>

                <div class="faculty-assignment-section">
                    <h2>Assign Students</h2>
                    <p>Add students to this project.</p>
                    
                    <div style="display: flex; gap: 15px; align-items: center; margin-top: 15px;">
                        <select class="faculty-student-select" style="flex: 1;">
                            <option value="">Select a student...</option>
                            <option value="1">John Doe - Frontend Developer</option>
                            <option value="2">Jane Smith - Backend Developer</option>
                            <option value="3">Mike Johnson - UI/UX Designer</option>
                        </select>
                        <button class="faculty-assign-button">Assign Student</button>
                    </div>
                    
                    <div class="assignment-msg-container"></div>
                    
                    <div class="faculty-assignment-grid">
                        <div class="faculty-assignment-card">
                            <div class="designation-icon">JS</div>
                            <h3>Jane Smith</h3>
                            <p>Backend Developer</p>
                        </div>
                        <div class="faculty-assignment-card">
                            <div class="designation-icon">JD</div>
                            <h3>John Doe</h3>
                            <p>Frontend Developer</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Close button logic
        targetElement.querySelector('.faculty-close-button').addEventListener('click', () => {
            targetElement.innerHTML = '';
        });

        // Assign student logic
        targetElement.querySelector('.faculty-assign-button').addEventListener('click', () => {
            const select = targetElement.querySelector('.faculty-student-select');
            if (select.value) {
                const msg = targetElement.querySelector('.assignment-msg-container');
                msg.innerHTML = '<div class="faculty-assignment-message assignment-success">Student successfully assigned to project!</div>';
                
                // Clear message after 3 seconds
                setTimeout(() => {
                    if (msg) msg.innerHTML = '';
                }, 3000);
            }
        });
        
        // Scroll into view smoothly
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    return container;
}

export default FacultyProjects;