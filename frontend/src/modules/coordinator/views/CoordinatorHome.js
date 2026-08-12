export function CoordinatorHome(route, router) {
  const container = document.createElement('div');
  container.className = 'coordinator-dashboard';

  const projects = [
    {
      name: 'Smart Campus Management',
      client: 'Rajagiri College',
      students: 'Anjali, Rahul',
      designation: 'Nova',
      progress: 75,
      priority: 'Normal'
    },
    {
      name: 'Online Food Ordering',
      client: 'Campus Cafeteria',
      students: 'Arjun, Neha',
      designation: 'Orbit',
      progress: 55,
      priority: 'Urgent'
    },
    {
      name: 'Library Management System',
      client: 'College Library',
      students: 'Asha, Kevin',
      designation: 'Spark',
      progress: 90,
      priority: 'Normal'
    }
  ];

  container.innerHTML = `
    <div class="coordinator-header">
      <div>
        <h1>Coordinator Workspace</h1>
        <p>Manage projects, students and project operations.</p>
      </div>

      <span class="coordinator-role-badge">
        Co-ordinator
      </span>
    </div>

    <div class="coordinator-kpi-grid">

      <div class="coordinator-kpi-card">
        <span>Active Projects</span>
        <strong>12</strong>
        <small>Currently in progress</small>
      </div>

      <div class="coordinator-kpi-card">
        <span>Students Assigned</span>
        <strong>28</strong>
        <small>Across active projects</small>
      </div>

      <div class="coordinator-kpi-card">
        <span>Meetings This Week</span>
        <strong>5</strong>
        <small>Scheduled meetings</small>
      </div>

      <div class="coordinator-kpi-card">
        <span>Near Completion</span>
        <strong>3</strong>
        <small>Projects ready for closure</small>
      </div>

    </div>

    <div class="coordinator-panel">

      <div class="coordinator-panel-header">
        <div>
          <h2>Projects in Progress</h2>
          <p>Current project progress and student allocation</p>
        </div>

        <button class="coord-btn coord-btn-primary">
          + Add Project
        </button>
      </div>

      <div class="coordinator-table-wrapper">

        <table class="coordinator-table">

          <thead>
            <tr>
              <th>Project</th>
              <th>Client</th>
              <th>Students</th>
              <th>Designation</th>
              <th>Progress</th>
              <th>Priority</th>
            </tr>
          </thead>

          <tbody>
            ${projects.map(project => `
              <tr>

                <td>
                  <strong>${project.name}</strong>
                </td>

                <td>
                  ${project.client}
                </td>

                <td>
                  ${project.students}
                </td>

                <td>
                  <span class="designation-badge ${project.designation.toLowerCase()}">
                    ${project.designation}
                  </span>
                </td>

                <td>
                  <div class="progress-container">
                    <div class="progress-bar">
                      <div
                        class="progress-fill"
                        style="width: ${project.progress}%">
                      </div>
                    </div>

                    <span>${project.progress}%</span>
                  </div>
                </td>

                <td>
                  <span class="priority-badge ${project.priority.toLowerCase()}">
                    ${project.priority}
                  </span>
                </td>

              </tr>
            `).join('')}
          </tbody>

        </table>

      </div>

    </div>
  `;

  return container;
}

export default CoordinatorHome;