import { authStore } from '@/core/stores/auth.js';

function getAuthToken() {
  return authStore?.token || localStorage.getItem('token') || localStorage.getItem('access_token') || null;
}

function formatLabel(value, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getCompletion(project) {
  const modules = Array.isArray(project?.modules) ? project.modules : [];
  const tasks = modules.flatMap((module) => Array.isArray(module.tasks) ? module.tasks : []);
  const total = tasks.length;
  const completed = tasks.filter((task) => String(task.status || '').toLowerCase() === 'completed').length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  return { total, completed, percent };
}

async function fetchStudents() {
  const token = getAuthToken();
  if (!token) return [];
  const response = await fetch('http://127.0.0.1:8000/api/coordinator/students', {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) return [];
  const data = await response.json().catch(() => ({}));
  return Array.isArray(data?.data) ? data.data : [];
}

async function fetchFaculty() {
  const token = getAuthToken();
  if (!token) return [];
  const response = await fetch('http://127.0.0.1:8000/api/coordinator/faculty', {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) return [];
  const data = await response.json().catch(() => ({}));
  return Array.isArray(data?.data) ? data.data : [];
}

async function fetchProjectDetail(projectId) {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required. Please log in again.');
  }

  const response = await fetch(`http://127.0.0.1:8000/api/coordinator/projects/${projectId}`, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || errorData.status || 'Unable to load project details.');
  }

  const data = await response.json();
  return data?.data?.project || data?.project || null;
}

export async function CoordinatorProjectDetail(route, router) {
  const container = document.createElement('div');
  container.className = 'coordinator-dashboard';

  const projectId = route.params?.id;

  if (!projectId) {
    container.innerHTML = `
      <div class="coordinator-panel coordinator-empty-state">
        <h2>Project not found</h2>
        <p>The selected project could not be loaded.</p>
        <button class="coord-btn coord-btn-primary" data-action="back">Back to projects</button>
      </div>
    `;
    container.querySelector('[data-action="back"]')?.addEventListener('click', () => router.push('/coordinator/projects'));
    return container;
  }

  try {
    const project = await fetchProjectDetail(projectId);

    if (!project) {
      throw new Error('Project not found.');
    }

    const completion = getCompletion(project);
    const students = Array.isArray(project.students) ? project.students : [];
    const faculty = Array.isArray(project.faculty) ? project.faculty : [];
    const requirements = Array.isArray(project.requirements) ? project.requirements : [];

    container.innerHTML = `
      <div class="coordinator-header">
        <div>
          <h1>${project.title || 'Project Details'}</h1>
          <p>${project.client_name || project.clientName || 'Client information unavailable'}</p>
        </div>

        <div class="coordinator-header-actions">
          <button class="coord-btn coord-btn-secondary" data-action="back">Back to projects</button>
          <button class="coord-btn coord-btn-primary" id="assign-student-btn">Assign Student</button>
          <button class="coord-btn coord-btn-primary" id="assign-faculty-btn">Assign Faculty</button>
          <button class="coord-btn coord-btn-secondary" id="add-requirement-btn">Add Requirement</button>
          <button class="coord-btn coord-btn-danger" id="close-project-btn">Close Project</button>
        </div>
      </div>

      <div class="coordinator-kpi-grid">
        <div class="coordinator-kpi-card">
          <span>Status</span>
          <strong>${formatLabel(project.status || 'In Progress')}</strong>
          <small>Current project phase</small>
        </div>

        <div class="coordinator-kpi-card">
          <span>Progress</span>
          <strong>${completion.percent}%</strong>
          <small>${completion.completed} of ${completion.total} tasks complete</small>
        </div>

        <div class="coordinator-kpi-card">
          <span>Priority</span>
          <strong>${formatLabel(project.priority || 'Normal')}</strong>
          <small>Project urgency</small>
        </div>

        <div class="coordinator-kpi-card">
          <span>Team Size</span>
          <strong>${students.length + faculty.length}</strong>
          <small>Students and faculty</small>
        </div>
      </div>

      <div class="coordinator-panel coordinator-project-detail-grid">
        <div class="coordinator-detail-card">
          <h2>Project overview</h2>

          <div class="coordinator-detail-list">
            <div><span>Project type</span><strong>${formatLabel(project.project_type || project.type || 'General')}</strong></div>
            <div><span>Source</span><strong>${formatLabel(project.source_type || 'External')}</strong></div>
            <div><span>Source by</span><strong>${project.brought_by || 'Not specified'}</strong></div>
            <div><span>Client</span><strong>${project.client_name || 'Not specified'}</strong></div>
            <div><span>Contact email</span><strong>${project.contact_email || 'Not specified'}</strong></div>
            <div><span>Contact phone</span><strong>${project.contact_phone || 'Not specified'}</strong></div>
            <div><span>Budget</span><strong>${project.budget ? `₹${Number(project.budget).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—'}</strong></div>
            <div><span>Expected timeline</span><strong>${formatDate(project.expected_timeline)}</strong></div>
          </div>
        </div>

        <div class="coordinator-detail-card">
          <h2>Team members</h2>

          <div class="coordinator-member-group">
            <h3>Assigned students</h3>
            ${students.length ? students.map((student) => `
              <div class="coordinator-member-row" data-student-id="${student.id}">
                <span>${student.name || 'Student'}</span>
                <small>${student.email || 'No email provided'}</small>
                <em>${formatLabel(student.pivot?.role || 'Member')}</em>
              </div>
            `).join('') : '<p class="coordinator-empty-copy">No students assigned yet.</p>'}
          </div>

          <div class="coordinator-member-group">
            <h3>Assigned faculty</h3>
            ${faculty.length ? faculty.map((person) => `
              <div class="coordinator-member-row" data-faculty-id="${person.id}">
                <span>${person.name || 'Faculty'}</span>
                <small>${person.email || 'No email provided'}</small>
                <em>${formatLabel((person.role || 'Faculty'))}</em>
              </div>
            `).join('') : '<p class="coordinator-empty-copy">No faculty assigned yet.</p>'}
          </div>
        </div>
      </div>

      <div class="coordinator-panel">
        <div class="coordinator-panel-header">
          <div>
            <h2>Project information</h2>
            <p>Readable summary of the selected project record.</p>
          </div>
        </div>

        <div class="coordinator-project-summary">
          <div>
            <span>Description / requirements</span>
            <p>${project.requirements_text || 'No project requirements have been recorded yet.'}</p>
          </div>
          <div>
            <span>Deliverables</span>
            <p>${project.deliverables || 'No deliverables have been added yet.'}</p>
          </div>
        </div>

        ${requirements.length ? `
          <div class="coordinator-req-list">
            <h3>Recent requirement notes</h3>
            ${requirements.slice(0, 3).map((item) => `
              <div class="coordinator-requirement-item">
                <strong>${item.title || 'Requirement note'}</strong>
                <p>${item.description || item.requirement || 'Requirement details unavailable.'}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;

    container.querySelector('[data-action="back"]')?.addEventListener('click', () => {
      router.push('/coordinator/projects');
    });

    // Modal helpers
    function openModal(html) {
      const overlay = document.createElement('div');
      overlay.className = 'coordinator-modal-overlay';
      overlay.innerHTML = `<div class="coordinator-modal">${html}</div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('.coordinator-close-btn')?.addEventListener('click', () => overlay.remove());
      return overlay;
    }

    async function postJson(url, body) {
      const token = getAuthToken();
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || data.message || 'Request failed');
      return data;
    }

    // Assign student — dropdown populated from the real students API (db_id submitted, name shown)
    container.querySelector('#assign-student-btn')?.addEventListener('click', async () => {
      const assignedIds = new Set(students.map((s) => s.id));

      const html = `
        <div class="coordinator-modal-header">
          <h2>Assign Student</h2>
          <p>Select a student and set their role on this project.</p>
          <button class="coordinator-close-btn">×</button>
        </div>
        <div class="coordinator-form-grid">
          <div class="coordinator-form-group"><label>Student</label><select id="assign-student-id"><option value="">Loading students...</option></select></div>
          <div class="coordinator-form-group"><label>Role</label>
            <select id="assign-student-role">
              <option value="project_lead">Project Lead</option>
              <option value="developer">Developer</option>
              <option value="designer">Designer</option>
              <option value="tester">Tester</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="coordinator-form-group"><label>Assigned date (optional)</label><input type="date" id="assign-student-date" /></div>
        </div>
        <div class="coordinator-modal-footer">
          <button class="coordinator-secondary-btn coordinator-close-btn">Cancel</button>
          <button class="coordinator-primary-btn" id="assign-student-submit">Assign</button>
        </div>
      `;

      const overlay = openModal(html);

      const sel = overlay.querySelector('#assign-student-id');
      const allStudents = await fetchStudents();
      const available = allStudents.filter((s) => !assignedIds.has(s.db_id));
      if (!available.length) {
        sel.innerHTML = `<option value="">No unassigned students available</option>`;
      } else {
        sel.innerHTML = `<option value="">Select a student</option>`;
        available.forEach(s => {
          const opt = document.createElement('option');
          opt.value = s.db_id;
          opt.textContent = s.name + (s.email ? ` (${s.email})` : '');
          sel.appendChild(opt);
        });
      }

      overlay.querySelector('#assign-student-submit').addEventListener('click', async () => {
        const studentId = Number(overlay.querySelector('#assign-student-id').value || 0);
        const role = overlay.querySelector('#assign-student-role').value;
        const assigned_date = overlay.querySelector('#assign-student-date').value || undefined;
        if (!studentId) return alert('Please select or enter a valid student id');
        try {
          await postJson(`http://127.0.0.1:8000/api/coordinator/projects/${projectId}/students`, { student_id: studentId, role, assigned_date });
          alert('Student assigned');
          overlay.remove();
          window.location.reload();
        } catch (err) {
          alert(err.message || 'Failed to assign student');
        }
      });
    });

    // Remove student buttons next to each student row — use data-student-id attribute (do not guess)
    Array.from(container.querySelectorAll('.coordinator-member-row[data-student-id]')).forEach((row) => {
      const name = row.querySelector('span')?.textContent || '';
      const studentId = row.dataset.studentId;
      const btn = document.createElement('button');
      btn.className = 'coordinator-secondary-btn';
      btn.textContent = 'Remove';
      btn.style.marginLeft = '8px';
      row.appendChild(btn);
      btn.addEventListener('click', async () => {
        if (!confirm(`Remove ${name} from project?`)) return;
        if (!studentId) return alert('Student id not available for removal.');
        try {
          const token = getAuthToken();
          const resp = await fetch(`http://127.0.0.1:8000/api/coordinator/projects/${projectId}/students/${studentId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await resp.json().catch(() => ({}));
          if (!resp.ok) throw new Error(data.error || data.message || 'Failed to remove student');
          alert('Student removed');
          window.location.reload();
        } catch (err) {
          alert(err.message || 'Failed to remove student');
        }
      });
    });

    // Assign faculty — dropdown populated from the real faculty API (db_id submitted, name shown)
    container.querySelector('#assign-faculty-btn')?.addEventListener('click', async () => {
      const assignedIds = new Set(faculty.map((f) => f.id));

      const html = `
        <div class="coordinator-modal-header">
          <h2>Assign Faculty</h2>
          <p>Select an eligible faculty member for this project.</p>
          <button class="coordinator-close-btn">×</button>
        </div>
        <div class="coordinator-form-grid">
          <div class="coordinator-form-group"><label>Faculty</label><select id="assign-faculty-id"><option value="">Loading faculty...</option></select></div>
          <div class="coordinator-form-group"><label>Assigned date (optional)</label><input type="date" id="assign-faculty-date" /></div>
        </div>
        <div class="coordinator-modal-footer">
          <button class="coordinator-secondary-btn coordinator-close-btn">Cancel</button>
          <button class="coordinator-primary-btn" id="assign-faculty-submit">Assign</button>
        </div>
      `;

      const overlay = openModal(html);

      const sel = overlay.querySelector('#assign-faculty-id');
      const allFaculty = await fetchFaculty();
      const available = allFaculty.filter((f) => !assignedIds.has(f.db_id));
      if (!available.length) {
        sel.innerHTML = `<option value="">No unassigned faculty available</option>`;
      } else {
        sel.innerHTML = `<option value="">Select faculty</option>`;
        available.forEach(f => {
          const opt = document.createElement('option');
          opt.value = f.db_id;
          opt.textContent = f.name + (f.email ? ` (${f.email})` : '');
          sel.appendChild(opt);
        });
      }

      overlay.querySelector('#assign-faculty-submit').addEventListener('click', async () => {
        const faculty_id = Number(overlay.querySelector('#assign-faculty-id').value || 0);
        const assigned_date = overlay.querySelector('#assign-faculty-date').value || undefined;
        if (!faculty_id) return alert('Please select or enter a valid faculty id');
        try {
          await postJson(`http://127.0.0.1:8000/api/coordinator/projects/${projectId}/faculty`, { faculty_id, assigned_date });
          alert('Faculty assigned');
          overlay.remove();
          window.location.reload();
        } catch (err) {
          alert(err.message || 'Failed to assign faculty');
        }
      });
    });

    // Remove faculty buttons — use data-faculty-id attribute (do not guess)
    Array.from(container.querySelectorAll('.coordinator-member-row[data-faculty-id]')).forEach((row) => {
      const name = row.querySelector('span')?.textContent || '';
      const facultyId = row.dataset.facultyId;
      const btn = document.createElement('button');
      btn.className = 'coordinator-secondary-btn';
      btn.textContent = 'Remove';
      btn.style.marginLeft = '8px';
      row.appendChild(btn);
      btn.addEventListener('click', async () => {
        if (!confirm(`Remove ${name} from project?`)) return;
        if (!facultyId) return alert('Faculty id not available for removal.');
        try {
          const token = getAuthToken();
          const resp = await fetch(`http://127.0.0.1:8000/api/coordinator/projects/${projectId}/faculty/${facultyId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await resp.json().catch(() => ({}));
          if (!resp.ok) throw new Error(data.error || data.message || 'Failed to remove faculty');
          alert('Faculty removed');
          window.location.reload();
        } catch (err) {
          alert(err.message || 'Failed to remove faculty');
        }
      });
    });

    // Add requirement
    container.querySelector('#add-requirement-btn')?.addEventListener('click', () => {
      const html = `
        <div class="coordinator-modal-header">
          <h2>Add Requirement</h2>
          <p>Provide requirement description.</p>
          <button class="coordinator-close-btn">×</button>
        </div>
        <div class="coordinator-form-grid">
          <div class="coordinator-form-group full-width"><label>Description</label><textarea id="req-desc"></textarea></div>
          <div class="coordinator-form-group"><label>Task ID (optional)</label><input type="number" id="req-task" /></div>
        </div>
        <div class="coordinator-modal-footer">
          <button class="coordinator-secondary-btn coordinator-close-btn">Cancel</button>
          <button class="coordinator-primary-btn" id="req-submit">Save</button>
        </div>
      `;

      const overlay = openModal(html);
      overlay.querySelector('#req-submit').addEventListener('click', async () => {
        const description = overlay.querySelector('#req-desc').value || '';
        const task_id = Number(overlay.querySelector('#req-task').value || 0) || undefined;
        if (!description) return alert('Please provide a description');
        try {
          await postJson(`http://127.0.0.1:8000/api/coordinator/projects/${projectId}/requirements`, { description, task_id });
          alert('Requirement saved');
          overlay.remove();
          window.location.reload();
        } catch (err) {
          alert(err.message || 'Failed to save requirement');
        }
      });
    });

    // Close project
    container.querySelector('#close-project-btn')?.addEventListener('click', () => {
      const html = `
        <div class="coordinator-modal-header">
          <h2>Close Project</h2>
          <p>Provide final status and optional remarks.</p>
          <button class="coordinator-close-btn">×</button>
        </div>
        <div class="coordinator-form-grid">
          <div class="coordinator-form-group"><label>Final status</label><input id="close-final-status" placeholder="e.g. completed" /></div>
          <div class="coordinator-form-group full-width"><label>Remarks</label><textarea id="close-remarks"></textarea></div>
        </div>
        <div class="coordinator-modal-footer">
          <button class="coordinator-secondary-btn coordinator-close-btn">Cancel</button>
          <button class="coordinator-primary-btn" id="close-submit">Close Project</button>
        </div>
      `;

      const overlay = openModal(html);
      overlay.querySelector('#close-submit').addEventListener('click', async () => {
        const final_status = overlay.querySelector('#close-final-status').value || '';
        const remarks = overlay.querySelector('#close-remarks').value || undefined;
        if (!final_status) return alert('Please provide final status');
        try {
          await postJson(`http://127.0.0.1:8000/api/coordinator/projects/${projectId}/close`, { final_status, remarks });
          alert('Project closed');
          overlay.remove();
          window.location.reload();
        } catch (err) {
          alert(err.message || 'Failed to close project');
        }
      });
    });

    return container;
  } catch (error) {
    container.innerHTML = `
      <div class="coordinator-panel coordinator-empty-state">
        <h2>Unable to load project details</h2>
        <p>${error.message || 'Something went wrong while retrieving the project.'}</p>
        <button class="coord-btn coord-btn-primary" data-action="back">Back to projects</button>
      </div>
    `;
    container.querySelector('[data-action="back"]')?.addEventListener('click', () => router.push('/coordinator/projects'));
    return container;
  }
}

export default CoordinatorProjectDetail;
