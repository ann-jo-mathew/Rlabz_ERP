import { authStore } from '@/core/stores/auth.js';

function getAuthToken() {
  return authStore?.token || localStorage.getItem('token') || localStorage.getItem('access_token') || null;
}

async function fetchStudents() {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required. Please log in again.');

  const resp = await fetch('http://127.0.0.1:8000/api/coordinator/students', {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body.error || body.message || 'Failed to load students');
  }

  const body = await resp.json();
  return Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []);
}

async function fetchProjects() {
  const token = getAuthToken();
  if (!token) return [];

  const resp = await fetch('http://127.0.0.1:8000/api/coordinator/projects', {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.ok) return [];
  const body = await resp.json().catch(() => ({}));
  return Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []);
}

async function fetchEligibleStudents() {
  const token = getAuthToken();
  if (!token) return [];

  const resp = await fetch('http://127.0.0.1:8000/api/coordinator/students/eligible', {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.ok) return [];
  const body = await resp.json().catch(() => ({}));
  return Array.isArray(body?.data) ? body.data : [];
}

export async function CoordinatorStudents(route, router) {
  const container = document.createElement('div');
  container.className = 'coordinator-dashboard';

  let students = [];

  try {
    students = await fetchStudents();
  } catch (err) {
    console.error('Failed to load students from API:', err);
    students = [];
  }

  function renderTableRows(data) {
    if (!data.length) {
      return `<tr><td colspan="6" style="text-align:center; padding:2rem;">No students found.</td></tr>`;
    }
    return data.map(student => `
      <tr data-designation="${student.designation}">
        <td><strong>${student.name}</strong></td>
        <td>${student.id}</td>
        <td>${student.course}</td>
        <td>
          <span class="student-track ${String(student.designation || '').toLowerCase()}">
            ${student.designation}
          </span>
        </td>
        <td>${student.project}</td>
        <td>
          <span class="project-status ${String(student.status || 'active').toLowerCase()}">
            ${student.status}
          </span>
        </td>
      </tr>
    `).join('');
  }

  function render() {
    const novaCount = students.filter(s => String(s.designation).toLowerCase() === 'nova').length;
    const orbitCount = students.filter(s => String(s.designation).toLowerCase() === 'orbit').length;
    const sparkCount = students.filter(s => String(s.designation).toLowerCase() === 'spark').length;

    container.innerHTML = `
      <div class="coordinator-header">
        <div>
          <h1>Students</h1>
          <p>Manage students, project assignments and RLabZ designations.</p>
        </div>

        <button class="coordinator-primary-btn" id="add-student-btn">
          + Assign Student
        </button>
      </div>

      <!-- Student KPI Cards -->
      <div class="coordinator-kpi-grid">
        <div class="coordinator-kpi-card">
          <span>Total Students</span>
          <strong id="kpi-total">${students.length}</strong>
          <small>Registered in RLabZ</small>
        </div>

        <div class="coordinator-kpi-card">
          <span>Nova</span>
          <strong id="kpi-nova">${novaCount}</strong>
          <small>Lead Developer Track</small>
        </div>

        <div class="coordinator-kpi-card">
          <span>Orbit</span>
          <strong id="kpi-orbit">${orbitCount}</strong>
          <small>Developer Track</small>
        </div>

        <div class="coordinator-kpi-card">
          <span>Spark</span>
          <strong id="kpi-spark">${sparkCount}</strong>
          <small>Learner Intern Track</small>
        </div>
      </div>

      <!-- Student Table -->
      <div class="coordinator-panel">
        <div class="coordinator-panel-header">
          <div>
            <h2>Student Roster</h2>
            <p>View students and their current project assignments.</p>
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
              ${renderTableRows(students)}
            </tbody>
          </table>
        </div>
      </div>

      <div id="student-modal-root"></div>
    `;

    container.querySelector('#designation-filter')?.addEventListener('change', filterStudents);
    container.querySelector('#add-student-btn')?.addEventListener('click', showAddStudentModal);
  }

  function filterStudents(event) {
    const selected = event.target.value;
    container.querySelectorAll('#students-table-body tr').forEach(row => {
      if (selected === 'all' || row.dataset.designation?.toLowerCase() === selected.toLowerCase()) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  async function showAddStudentModal() {
    const modalRoot = container.querySelector('#student-modal-root');
    const [projects, eligibleStudents] = await Promise.all([fetchProjects(), fetchEligibleStudents()]);

    const projectOptionsHtml = projects.length
      ? projects.map(p => `<option value="${p.id}">${p.title}</option>`).join('')
      : '<option value="">No projects available</option>';

    const studentOptionsHtml = eligibleStudents.length
      ? eligibleStudents.map(s => `<option value="${s.id}">${s.name}${s.email ? ` (${s.email})` : ''}</option>`).join('')
      : '<option value="">No unassigned students available</option>';

    modalRoot.innerHTML = `
      <div class="coordinator-modal-overlay">
        <div class="coordinator-modal">
          <div class="coordinator-modal-header">
            <div>
              <h2>Assign Student</h2>
              <p>Assign an existing, unassigned student to a project.</p>
            </div>
            <button id="close-student-modal" class="coordinator-close-btn">×</button>
          </div>

          <form id="new-student-form">
            <div class="coordinator-form-grid">
              <div class="coordinator-form-group full-width">
                <label>Student *</label>
                <select name="student_id" required>
                  <option value="">Select a student</option>
                  ${studentOptionsHtml}
                </select>
              </div>

              <div class="coordinator-form-group full-width">
                <label>Project *</label>
                <select name="project_id" required>
                  <option value="">Select a project</option>
                  ${projectOptionsHtml}
                </select>
              </div>

              <div class="coordinator-form-group">
                <label>Role *</label>
                <select name="role" required>
                  <option value="project_lead">Project Lead</option>
                  <option value="developer">Developer</option>
                  <option value="designer">Designer</option>
                  <option value="tester">Tester</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div class="coordinator-form-group">
                <label>Assigned Date</label>
                <input type="date" name="assigned_date">
              </div>
            </div>

            <div class="coordinator-modal-footer">
              <button type="button" id="cancel-student" class="coordinator-secondary-btn">Cancel</button>
              <button type="submit" class="coordinator-primary-btn">Assign Student</button>
            </div>
          </form>
        </div>
      </div>
    `;

    modalRoot.querySelector('#close-student-modal')?.addEventListener('click', closeModal);
    modalRoot.querySelector('#cancel-student')?.addEventListener('click', closeModal);

    modalRoot.querySelector('#new-student-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.target;
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());
      const projectId = payload.project_id;
      delete payload.project_id;
      if (!payload.assigned_date) delete payload.assigned_date;

      const token = getAuthToken();
      if (!token) {
        alert('Authentication required. Please log in.');
        return;
      }

      try {
        const resp = await fetch(`http://127.0.0.1:8000/api/coordinator/projects/${projectId}/students`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const body = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          throw new Error(body.error || body.message || 'Failed to assign student');
        }

        alert('Student assigned successfully!');
        closeModal();

        // Refresh list from backend
        students = await fetchStudents();
        const tbody = container.querySelector('#students-table-body');
        if (tbody) tbody.innerHTML = renderTableRows(students);

        // Update KPI stats
        container.querySelector('#kpi-total').textContent = students.length;
        container.querySelector('#kpi-nova').textContent = students.filter(s => String(s.designation).toLowerCase() === 'nova').length;
        container.querySelector('#kpi-orbit').textContent = students.filter(s => String(s.designation).toLowerCase() === 'orbit').length;
        container.querySelector('#kpi-spark').textContent = students.filter(s => String(s.designation).toLowerCase() === 'spark').length;

      } catch (err) {
        console.error(err);
        alert(`Error: ${err.message}`);
      }
    });
  }

  function closeModal() {
    const modalRoot = container.querySelector('#student-modal-root');
    if (modalRoot) modalRoot.innerHTML = '';
  }

  render();

  return container;
}

export default CoordinatorStudents;