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

  const ROLE_LABELS = {
    project_lead: 'Project Lead',
    developer: 'Developer',
    designer: 'Designer',
    tester: 'Tester',
    other: 'Other',
  };

  function roleKey(designation) {
    const label = String(designation || '').toLowerCase().replace(/\s+/g, '_');
    return Object.keys(ROLE_LABELS).includes(label) ? label : 'other';
  }

  function assignmentsOf(student) {
    return Array.isArray(student.assignments) ? student.assignments : [];
  }

  function getUniqueProjects(data) {
    const map = new Map();
    data.forEach((s) => {
      assignmentsOf(s).forEach((a) => {
        if (a.project_id && !map.has(a.project_id)) map.set(a.project_id, a.project_title);
      });
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }

  // A student may belong to multiple projects at once — render one row per student
  // (never duplicate rows), listing every assignment within that row's cells.
  function renderTableRows(data) {
    if (!data.length) {
      return `<tr><td colspan="7" style="text-align:center; padding:2rem;">No students found.</td></tr>`;
    }
    return data.map(student => {
      const assignments = assignmentsOf(student);
      const roleAttr = assignments.map(a => roleKey(a.designation)).join(' ');
      const projectIdAttr = assignments.map(a => a.project_id).join(' ');

      const designationCell = assignments.length
        ? assignments.map(a => `<span class="student-track ${roleKey(a.designation)}">${ROLE_LABELS[roleKey(a.designation)] || a.designation}</span>`).join('<br>')
        : '—';
      const projectCell = assignments.length
        ? assignments.map(a => a.project_title).join('<br>')
        : 'Unassigned';
      const dateCell = assignments.length
        ? assignments.map(a => a.assigned_date || '—').join('<br>')
        : '—';

      return `
      <tr data-roles="${roleAttr}" data-project-ids="${projectIdAttr}">
        <td><strong>${student.name}</strong></td>
        <td>${student.email}</td>
        <td>${student.phone || '—'}</td>
        <td>${designationCell}</td>
        <td>${projectCell}</td>
        <td>${dateCell}</td>
        <td>
          <span class="project-status ${String(student.status || 'unassigned').toLowerCase()}">
            ${student.status}
          </span>
        </td>
      </tr>
    `;
    }).join('');
  }

  function sortStudents(data, sortBy) {
    const copy = [...data];
    copy.sort((a, b) => {
      if (sortBy === 'email') return String(a.email).localeCompare(String(b.email));
      if (sortBy === 'status') return String(a.status).localeCompare(String(b.status));
      if (sortBy === 'project') {
        const pa = assignmentsOf(a)[0]?.project_title || '';
        const pb = assignmentsOf(b)[0]?.project_title || '';
        return pa.localeCompare(pb) || a.name.localeCompare(b.name);
      }
      if (sortBy === 'designation') {
        const da = assignmentsOf(a)[0]?.designation || '';
        const db = assignmentsOf(b)[0]?.designation || '';
        return da.localeCompare(db) || a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });
    return copy;
  }

  function render() {
    const unassignedCount = students.filter(s => s.status === 'Unassigned').length;
    const assignedCount = students.length - unassignedCount;
    const projects = getUniqueProjects(students);

    container.innerHTML = `
      <div class="coordinator-header">
        <div>
          <h1>Students</h1>
          <p>Manage student accounts and view project assignments.</p>
        </div>

        <button class="coordinator-primary-btn" id="add-student-btn">
          + Add Student
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
          <span>Assigned</span>
          <strong id="kpi-assigned">${assignedCount}</strong>
          <small>Currently on a project</small>
        </div>

        <div class="coordinator-kpi-card">
          <span>Unassigned</span>
          <strong id="kpi-unassigned">${unassignedCount}</strong>
          <small>Not yet on a project</small>
        </div>
      </div>

      <!-- Student Table -->
      <div class="coordinator-panel">
        <div class="coordinator-panel-header">
          <div>
            <h2>Student Roster</h2>
            <p>View students and their current project assignments.</p>
          </div>

          <div style="display:flex; gap:0.5rem;">
            <select id="designation-filter">
              <option value="all">All</option>
              <option value="unassigned">Unassigned</option>
              <option value="project_lead">Project Lead</option>
              <option value="developer">Developer</option>
              <option value="designer">Designer</option>
              <option value="tester">Tester</option>
              <option value="other">Other</option>
            </select>

            <select id="project-filter">
              <option value="all">All Projects</option>
              ${projects.map(p => `<option value="${p.id}">${p.title}</option>`).join('')}
            </select>

            <select id="sort-by">
              <option value="name">Sort: Name</option>
              <option value="email">Sort: Email</option>
              <option value="project">Sort: Project</option>
              <option value="designation">Sort: Designation</option>
              <option value="status">Sort: Status</option>
            </select>
          </div>
        </div>

        <div class="coordinator-table-wrapper">
          <table class="coordinator-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Designation</th>
                <th>Project</th>
                <th>Assigned Date</th>
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

    container.querySelector('#designation-filter')?.addEventListener('change', applyFiltersAndSort);
    container.querySelector('#project-filter')?.addEventListener('change', applyFiltersAndSort);
    container.querySelector('#sort-by')?.addEventListener('change', applyFiltersAndSort);
    container.querySelector('#add-student-btn')?.addEventListener('click', showAddStudentModal);
  }

  function applyFiltersAndSort() {
    const roleFilter = container.querySelector('#designation-filter')?.value || 'all';
    const projectFilter = container.querySelector('#project-filter')?.value || 'all';
    const sortBy = container.querySelector('#sort-by')?.value || 'name';

    const tbody = container.querySelector('#students-table-body');
    if (tbody) tbody.innerHTML = renderTableRows(sortStudents(students, sortBy));

    container.querySelectorAll('#students-table-body tr').forEach(row => {
      if (row.dataset.roles === undefined) return; // empty-state row has no dataset.roles

      const roles = row.dataset.roles ? row.dataset.roles.split(' ') : [];
      const projectIds = row.dataset.projectIds ? row.dataset.projectIds.split(' ') : [];

      let show = true;
      if (roleFilter === 'unassigned') {
        show = roles.length === 0;
      } else if (roleFilter !== 'all') {
        show = roles.includes(roleFilter);
      }

      if (show && projectFilter !== 'all') {
        show = projectIds.includes(projectFilter);
      }

      row.style.display = show ? '' : 'none';
    });
  }

  async function showAddStudentModal() {
    const modalRoot = container.querySelector('#student-modal-root');

    modalRoot.innerHTML = `
      <div class="coordinator-modal-overlay">
        <div class="coordinator-modal">
          <div class="coordinator-modal-header">
            <div>
              <h2>Add Student</h2>
              <p>Create a new student account.</p>
            </div>
            <button id="close-student-modal" class="coordinator-close-btn">×</button>
          </div>

          <form id="new-student-form">
            <div class="coordinator-form-grid">
              <div class="coordinator-form-group full-width">
                <label>Name *</label>
                <input type="text" name="name" placeholder="Enter student name" required>
              </div>

              <div class="coordinator-form-group full-width">
                <label>Email *</label>
                <input type="email" name="email" placeholder="name@rajagiri.edu" required>
              </div>

              <div class="coordinator-form-group">
                <label>Password *</label>
                <input type="password" name="password" placeholder="Minimum 6 characters" minlength="6" required>
              </div>

              <div class="coordinator-form-group">
                <label>Phone</label>
                <input type="text" name="phone" placeholder="Optional">
              </div>

              <div class="coordinator-form-group">
                <label>Role</label>
                <input type="text" value="Student" disabled>
              </div>
            </div>

            <div id="student-form-error" style="color:#b91c1c; margin: 0 1rem 0.5rem;"></div>

            <div class="coordinator-modal-footer">
              <button type="button" id="cancel-student" class="coordinator-secondary-btn">Cancel</button>
              <button type="submit" class="coordinator-primary-btn">Add Student</button>
            </div>
          </form>
        </div>
      </div>
    `;

    modalRoot.querySelector('#close-student-modal')?.addEventListener('click', closeModal);
    modalRoot.querySelector('#cancel-student')?.addEventListener('click', closeModal);

    modalRoot.querySelector('#new-student-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const errorEl = modalRoot.querySelector('#student-form-error');
      errorEl.textContent = '';

      const form = event.target;
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());
      if (!payload.phone) delete payload.phone;

      const token = getAuthToken();
      if (!token) {
        errorEl.textContent = 'Authentication required. Please log in.';
        return;
      }

      try {
        const resp = await fetch('http://127.0.0.1:8000/api/coordinator/students', {
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
          const message = body.errors
            ? Object.values(body.errors).flat().join(', ')
            : (body.error || body.message || 'Failed to add student');
          throw new Error(message);
        }

        alert('Student added successfully!');
        closeModal();

        // Refresh full view from backend (also refreshes the project filter dropdown)
        students = await fetchStudents();
        render();

      } catch (err) {
        console.error(err);
        errorEl.textContent = err.message;
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