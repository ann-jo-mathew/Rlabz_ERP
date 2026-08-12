export function CoordinatorProjects(route, router) {
  const container = document.createElement('div');
  container.className = 'coordinator-dashboard';

  const projects = [
    {
      title: 'Smart Campus Management',
      client: 'ABC College',
      type: 'Web Application',
      students: 4,
      progress: 75,
      priority: 'Normal',
      status: 'In Progress'
    },
    {
      title: 'Online Food Ordering',
      client: 'FoodHub Pvt Ltd',
      type: 'Web Application',
      students: 5,
      progress: 55,
      priority: 'Urgent',
      status: 'In Progress'
    },
    {
      title: 'Library Management System',
      client: 'XYZ University',
      type: 'Management System',
      students: 3,
      progress: 90,
      priority: 'Normal',
      status: 'Review'
    },
    {
      title: 'Hospital Appointment System',
      client: 'City Hospital',
      type: 'Healthcare',
      students: 4,
      progress: 100,
      priority: 'Normal',
      status: 'Completed'
    }
  ];

  function render() {
    container.innerHTML = `
      <div class="coordinator-header">
        <div>
          <h1>Projects</h1>
          <p>Manage projects, client requirements and project progress.</p>
        </div>

        <button class="coordinator-primary-btn" id="add-project-btn">
          + Add New Project
        </button>
      </div>

      <div class="coordinator-kpi-grid">

        <div class="coordinator-kpi-card">
          <span>Active Projects</span>
          <strong>12</strong>
          <small>Currently in progress</small>
        </div>

        <div class="coordinator-kpi-card">
          <span>Pending Projects</span>
          <strong>4</strong>
          <small>Awaiting action</small>
        </div>

        <div class="coordinator-kpi-card">
          <span>Completed</span>
          <strong>8</strong>
          <small>Successfully completed</small>
        </div>

        <div class="coordinator-kpi-card">
          <span>Urgent Projects</span>
          <strong>3</strong>
          <small>Require attention</small>
        </div>

      </div>

      <div class="coordinator-panel">

        <div class="coordinator-panel-header">
          <div>
            <h2>Project Overview</h2>
            <p>Track active projects and their current progress.</p>
          </div>

          <select id="project-filter">
            <option value="all">All Projects</option>
            <option value="In Progress">In Progress</option>
            <option value="Review">Review</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div class="coordinator-table-wrapper">

          <table class="coordinator-table">

            <thead>
              <tr>
                <th>Project</th>
                <th>Client</th>
                <th>Type</th>
                <th>Students</th>
                <th>Progress</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody id="projects-table-body">
              ${projects.map(project => `
                <tr data-status="${project.status}">

                  <td>
                    <strong>${project.title}</strong>
                  </td>

                  <td>${project.client}</td>

                  <td>${project.type}</td>

                  <td>${project.students}</td>

                  <td>
                    <div class="coordinator-progress">
                      <div class="coordinator-progress-bg">
                        <div
                          class="coordinator-progress-fill"
                          style="width:${project.progress}%">
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

                  <td>
                    <span class="project-status ${project.status
                      .toLowerCase()
                      .replace(' ', '-')}">
                      ${project.status}
                    </span>
                  </td>

                </tr>
              `).join('')}
            </tbody>

          </table>

        </div>
      </div>

      <div id="project-modal-root"></div>
    `;

    container
      .querySelector('#add-project-btn')
      ?.addEventListener('click', showAddProjectModal);

    container
      .querySelector('#project-filter')
      ?.addEventListener('change', filterProjects);
  }

  function filterProjects(event) {
    const selected = event.target.value;

    container.querySelectorAll('#projects-table-body tr').forEach(row => {
      if (selected === 'all' || row.dataset.status === selected) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  function showAddProjectModal() {
    const modalRoot = container.querySelector('#project-modal-root');

    modalRoot.innerHTML = `
      <div class="coordinator-modal-overlay">

        <div class="coordinator-modal">

          <div class="coordinator-modal-header">
            <div>
              <h2>Add New Project</h2>
              <p>Enter the initial project and client requirements.</p>
            </div>

            <button id="close-project-modal" class="coordinator-close-btn">
              ×
            </button>
          </div>

          <form id="new-project-form">

            <div class="coordinator-form-grid">

              <div class="coordinator-form-group">
                <label>Project Title *</label>
                <input
                  type="text"
                  name="title"
                  placeholder="Enter project title"
                  required
                >
              </div>

              <div class="coordinator-form-group">
                <label>Project Type *</label>
                <select name="type" required>
                  <option value="">Select type</option>
                  <option>Web Application</option>
                  <option>Mobile Application</option>
                  <option>Desktop Application</option>
                  <option>AI / ML Project</option>
                  <option>IoT Project</option>
                  <option>Management System</option>
                  <option>Other</option>
                </select>
              </div>

              <div class="coordinator-form-group">
                <label>Project Source *</label>
                <select name="source" required>
                  <option value="">Select source</option>
                  <option>Faculty</option>
                  <option>Student</option>
                  <option>Alumni</option>
                  <option>Institution</option>
                  <option>External</option>
                </select>
              </div>

              <div class="coordinator-form-group">
                <label>Source Name</label>
                <input
                  type="text"
                  name="sourceName"
                  placeholder="Person / organization name"
                >
              </div>

              <div class="coordinator-form-group">
                <label>Client / Department / Agency *</label>
                <input
                  type="text"
                  name="client"
                  placeholder="Enter client name"
                  required
                >
              </div>

              <div class="coordinator-form-group">
                <label>Contact Details *</label>
                <input
                  type="text"
                  name="contact"
                  placeholder="Phone or email"
                  required
                >
              </div>

              <div class="coordinator-form-group full-width">
                <label>Initial Requirements *</label>
                <textarea
                  name="requirements"
                  rows="4"
                  placeholder="Describe the initial client requirements..."
                  required
                ></textarea>
              </div>

              <div class="coordinator-form-group full-width">
                <label>Expected Deliverables</label>
                <textarea
                  name="deliverables"
                  rows="3"
                  placeholder="List expected deliverables..."
                ></textarea>
              </div>

              <div class="coordinator-form-group">
                <label>Expected Timeline</label>
                <input
                  type="text"
                  name="timeline"
                  placeholder="e.g. 3 months"
                >
              </div>

              <div class="coordinator-form-group">
                <label>Budget Indication</label>
                <input
                  type="number"
                  name="budget"
                  placeholder="Enter estimated budget"
                >
              </div>

              <div class="coordinator-form-group">
                <label>Priority *</label>

                <div class="coordinator-radio-group">

                  <label>
                    <input
                      type="radio"
                      name="priority"
                      value="Normal"
                      checked
                    >
                    Normal
                  </label>

                  <label>
                    <input
                      type="radio"
                      name="priority"
                      value="Urgent"
                    >
                    Urgent
                  </label>

                </div>
              </div>

            </div>

            <div class="coordinator-modal-footer">

              <button
                type="button"
                id="cancel-project"
                class="coordinator-secondary-btn">
                Cancel
              </button>

              <button
                type="submit"
                class="coordinator-primary-btn">
                Create Project
              </button>

            </div>

          </form>

        </div>
      </div>
    `;

    modalRoot
      .querySelector('#close-project-modal')
      .addEventListener('click', closeModal);

    modalRoot
      .querySelector('#cancel-project')
      .addEventListener('click', closeModal);

    modalRoot
      .querySelector('#new-project-form')
      .addEventListener('submit', (event) => {
        event.preventDefault();

        alert('Project created successfully!');

        closeModal();
      });
  }

  function closeModal() {
    const modalRoot = container.querySelector('#project-modal-root');

    if (modalRoot) {
      modalRoot.innerHTML = '';
    }
  }

  render();

  return container;
}

export default CoordinatorProjects;