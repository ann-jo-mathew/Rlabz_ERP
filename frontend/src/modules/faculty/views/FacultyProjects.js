import '../faculty.css';

export function FacultyProjects() {

    const projects = [
        {
            name: 'RLabZ ERP',
            client: 'Rajagiri College',
            type: 'ERP',
            status: 'In Progress',
            progress: 70,
            students: 5,
            github: 'Verified'
        },
        {
            name: 'Student Management System',
            client: 'Computer Science Department',
            type: 'Web Application',
            status: 'In Progress',
            progress: 50,
            students: 4,
            github: 'Pending'
        },
        {
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
                            <div
                                class="progress-fill"
                                style="width:${project.progress}%">
                            </div>
                        </div>

                    </div>

                    <button class="faculty-project-view">
                        View Project
                    </button>

                </div>
            `).join('')}

        </div>
    `;

    return container;
}

export default FacultyProjects;