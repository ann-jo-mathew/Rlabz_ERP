export function CoordinatorStudents(route, router) {
  const container = document.createElement('div');
  container.className = 'coordinator-dashboard';

  const students = [
    {
      name: 'Anjali Thomas',
      id: 'RLZ001',
      course: 'MCA',
      designation: 'Nova',
      project: 'Smart Campus Management',
      status: 'Active'
    },
    {
      name: 'Rahul Menon',
      id: 'RLZ002',
      course: 'MCA',
      designation: 'Orbit',
      project: 'Online Food Ordering',
      status: 'Active'
    },
    {
      name: 'Neha Joseph',
      id: 'RLZ003',
      course: 'MCA',
      designation: 'Spark',
      project: 'Library Management System',
      status: 'Active'
    },
    {
      name: 'Arjun Kumar',
      id: 'RLZ004',
      course: 'MCA',
      designation: 'Nova',
      project: 'Hospital Appointment System',
      status: 'Completed'
    },
    {
      name: 'Meera Nair',
      id: 'RLZ005',
      course: 'MCA',
      designation: 'Orbit',
      project: 'Smart Campus Management',
      status: 'Active'
    }
  ];

  function render() {
    const novaCount = students.filter(s => s.designation === 'Nova').length;
    const orbitCount = students.filter(s => s.designation === 'Orbit').length;
    const sparkCount = students.filter(s => s.designation === 'Spark').length;

    container.innerHTML = `
      <div class="coordinator-header">
        <div>
          <h1>Students</h1>
          <p>
            Manage students, project assignments and RLabZ designations.
          </p>
        </div>

        <button class="coordinator-primary-btn" id="add-student-btn">
          + Add Student
        </button>
      </div>

      <!-- Student KPI Cards -->
      <div class="coordinator-kpi-grid">

        <div class="coordinator-kpi-card">
          <span>Total Students</span>
          <strong>${students.length}</strong>
          <small>Registered in RLabZ</small>
        </div>

        <div class="coordinator-kpi-card">
          <span>Nova</span>
          <strong>${novaCount}</strong>
          <small>Lead Developer Track</small>
        </div>

        <div class="coordinator-kpi-card">
          <span>Orbit</span>
          <strong>${orbitCount}</strong>
          <small>Developer Track</small>
        </div>

        <div class="coordinator-kpi-card">
          <span>Spark</span>
          <strong>${sparkCount}</strong>
          <small>Learner Intern Track</small>
        </div>

      </div>

      <!-- Student Table -->
      <div class="coordinator-panel">

        <div class="coordinator-panel-header">
          <div>
            <h2>Student Roster</h2>
            <p>
              View students and their current project assignments.
            </p>
          </div>

          <select id="designation-filter">
            <option value="all">All Designations</option>
            <option value="Nova">Nova</option>
            <option value="Orbit">Orbit</option>
            <option value="Spark">Spark</option>
          </select>
        </div>

        <div class="coordinator-table-wrapper">

          <table class="coordinator-table">

            <thead>
              <tr>
                <th>Student</th>
                <th>ID</th>
                <th>Course</th>
                <th>Designation</th>
                <th>Current Project</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody id="students-table-body">

              ${students.map(student => `
                <tr data-designation="${student.designation}">

                  <td>
                    <strong>${student.name}</strong>
                  </td>

                  <td>${student.id}</td>

                  <td>${student.course}</td>

                  <td>
                    <span class="student-track ${student.designation.toLowerCase()}">
                      ${student.designation}
                    </span>
                  </td>

                  <td>${student.project}</td>

                  <td>
                    <span class="project-status ${
                      student.status.toLowerCase()
                    }">
                      ${student.status}
                    </span>
                  </td>

                </tr>
              `).join('')}

            </tbody>

          </table>

        </div>
      </div>

      <div id="student-modal-root"></div>
    `;

    container
      .querySelector('#designation-filter')
      ?.addEventListener('change', filterStudents);

    container
      .querySelector('#add-student-btn')
      ?.addEventListener('click', showAddStudentModal);
  }

  function filterStudents(event) {
    const selected = event.target.value;

    container
      .querySelectorAll('#students-table-body tr')
      .forEach(row => {

        if (
          selected === 'all' ||
          row.dataset.designation === selected
        ) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }

      });
  }

  function showAddStudentModal() {
    const modalRoot = container.querySelector('#student-modal-root');

    modalRoot.innerHTML = `
      <div class="coordinator-modal-overlay">

        <div class="coordinator-modal">

          <div class="coordinator-modal-header">

            <div>
              <h2>Add Student</h2>
              <p>
                Add a student and assign their RLabZ designation.
              </p>
            </div>

            <button
              id="close-student-modal"
              class="coordinator-close-btn">
              ×
            </button>

          </div>

          <form id="new-student-form">

            <div class="coordinator-form-grid">

              <div class="coordinator-form-group">
                <label>Student Name *</label>

                <input
                  type="text"
                  name="name"
                  placeholder="Enter student name"
                  required
                >
              </div>

              <div class="coordinator-form-group">
                <label>Student ID *</label>

                <input
                  type="text"
                  name="id"
                  placeholder="e.g. RLZ006"
                  required
                >
              </div>

              <div class="coordinator-form-group">
                <label>Course *</label>

                <input
                  type="text"
                  name="course"
                  placeholder="e.g. MCA"
                  required
                >
              </div>

              <div class="coordinator-form-group">
                <label>Designation *</label>

                <select name="designation" required>

                  <option value="">Select designation</option>

                  <option value="Nova">
                    Nova — Lead Developer
                  </option>

                  <option value="Orbit">
                    Orbit — Developer
                  </option>

                  <option value="Spark">
                    Spark — Learner Intern
                  </option>

                </select>
              </div>

              <div class="coordinator-form-group full-width">

                <label>Current Project</label>

                <select name="project">

                  <option value="">
                    Not assigned
                  </option>

                  <option>
                    Smart Campus Management
                  </option>

                  <option>
                    Online Food Ordering
                  </option>

                  <option>
                    Library Management System
                  </option>

                  <option>
                    Hospital Appointment System
                  </option>

                </select>

              </div>

            </div>

            <div class="coordinator-modal-footer">

              <button
                type="button"
                id="cancel-student"
                class="coordinator-secondary-btn">
                Cancel
              </button>

              <button
                type="submit"
                class="coordinator-primary-btn">
                Add Student
              </button>

            </div>

          </form>

        </div>

      </div>
    `;

    modalRoot
      .querySelector('#close-student-modal')
      .addEventListener('click', closeModal);

    modalRoot
      .querySelector('#cancel-student')
      .addEventListener('click', closeModal);

    modalRoot
      .querySelector('#new-student-form')
      .addEventListener('submit', event => {

        event.preventDefault();

        alert('Student added successfully!');

        closeModal();
      });
  }

  function closeModal() {
    const modalRoot =
      container.querySelector('#student-modal-root');

    if (modalRoot) {
      modalRoot.innerHTML = '';
    }
  }

  render();

  return container;
}

export default CoordinatorStudents;