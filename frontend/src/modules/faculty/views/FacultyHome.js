import '../faculty.css';

export function FacultyHome() {
    const container = document.createElement('div');

    container.className = 'faculty-home';

    container.innerHTML = `
        <div class="page-header">
            <h1>Faculty Dashboard</h1>
            <p>Overview of your assigned projects and students.</p>
        </div>

        <div class="faculty-stats">

            <div class="faculty-stat-card">
                <div class="stat-icon">📁</div>
                <div>
                    <h3>4</h3>
                    <p>Projects Assigned</p>
                </div>
            </div>

            <div class="faculty-stat-card">
                <div class="stat-icon">👥</div>
                <div>
                    <h3>12</h3>
                    <p>Total Students</p>
                </div>
            </div>

            <div class="faculty-stat-card">
                <div class="stat-icon">📅</div>
                <div>
                    <h3>2</h3>
                    <p>Meetings Today</p>
                </div>
            </div>

            <div class="faculty-stat-card">
                <div class="stat-icon">🔗</div>
                <div>
                    <h3>3</h3>
                    <p>Pending GitHub Verification</p>
                </div>
            </div>

        </div>

        <div class="faculty-dashboard-section">

            <div class="faculty-section-header">
                <h2>My Projects</h2>
                <button class="faculty-view-btn" id="faculty-view-projects">
                    View All
                </button>
            </div>

            <div class="faculty-project-list">

                <div class="faculty-project-card">
                    <div>
                        <h3>RLabZ ERP</h3>
                        <p>Client: Rajagiri College</p>
                        <span class="faculty-status active">
                            In Progress
                        </span>
                    </div>

                    <div class="faculty-project-progress">
                        <p>Progress: 70%</p>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width:70%"></div>
                        </div>
                    </div>
                </div>

                <div class="faculty-project-card">
                    <div>
                        <h3>Student Management System</h3>
                        <p>Client: Computer Science Department</p>
                        <span class="faculty-status active">
                            In Progress
                        </span>
                    </div>

                    <div class="faculty-project-progress">
                        <p>Progress: 50%</p>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width:50%"></div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    `;

    return container;
}

export default FacultyHome;