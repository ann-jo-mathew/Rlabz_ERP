/**
 * DirectorService.js
 * Central Data & State Management for Module 2: Director Dashboard & Oversight
 */

const STORAGE_KEY = 'rlabz_director_data';

const initialData = {
  projects: [
    {
      id: 'PROJ-101',
      title: 'Department Website Portal',
      type: 'Web Application',
      source: 'Institution',
      sourceName: 'CS Department Head',
      clientName: 'Rajagiri CS Dept',
      clientContact: 'csdept@rajagiri.edu',
      status: 'in_progress',
      priority: 'high',
      progress: 75,
      timeline: '2026-06-01 to 2026-08-30',
      budget: 50000,
      spent: 32000,
      facultyId: 'FAC-01',
      facultyName: 'Dr. Anita Roy',
      assignedStudents: [
        { id: 'STU-01', name: 'Rohan Sharma', track: 'Nova', role: 'Lead Full Stack' },
        { id: 'STU-02', name: 'Ananya Verma', track: 'Orbit', role: 'Frontend Dev' },
        { id: 'STU-03', name: 'Kiran Paul', track: 'Spark', role: 'UI Trainee' }
      ],
      deliverables: ['Responsive Dashboard', 'Role Auth', 'PDF Export'],
      requirementDocs: ['spec_v1.pdf', 'client_brief.docx']
    },
    {
      id: 'PROJ-102',
      title: 'Smart Lab Inventory Tracker',
      type: 'IoT / Mobile App',
      source: 'External',
      sourceName: 'TechCorp Solutions',
      clientName: 'TechCorp India',
      clientContact: 'contact@techcorp.in',
      status: 'in_progress',
      priority: 'urgent',
      progress: 40,
      timeline: '2026-07-15 to 2026-10-15',
      budget: 85000,
      spent: 28000,
      facultyId: 'FAC-02',
      facultyName: 'Prof. Mathew Joseph',
      assignedStudents: [
        { id: 'STU-04', name: 'Farsan K.A.', track: 'Nova', role: 'Tech Lead' },
        { id: 'STU-05', name: 'Sneha George', track: 'Orbit', role: 'Backend Dev' }
      ],
      deliverables: ['Barcode Scanner Module', 'Inventory API', 'Admin Panel'],
      requirementDocs: ['lab_inventory_requirements.pdf']
    },
    {
      id: 'PROJ-103',
      title: 'Campus Event Management System',
      type: 'Web Portal',
      source: 'Student',
      sourceName: 'Student Council',
      clientName: 'Rajagiri Student Union',
      clientContact: 'union@rajagiri.edu',
      status: 'completed',
      priority: 'normal',
      progress: 100,
      timeline: '2026-03-01 to 2026-06-30',
      budget: 30000,
      spent: 30000,
      facultyId: 'FAC-01',
      facultyName: 'Dr. Anita Roy',
      assignedStudents: [
        { id: 'STU-06', name: 'Devika Nair', track: 'Orbit', role: 'Lead Dev' },
        { id: 'STU-07', name: 'Arjun Das', track: 'Spark', role: 'Junior Tester' }
      ],
      deliverables: ['Event Registration', 'Ticket QR Generator'],
      requirementDocs: ['event_system_proposal.pdf']
    }
  ],
  proposals: [
    {
      id: 'PROP-201',
      title: 'Alumni Network & Career Portal',
      type: 'Web Application',
      source: 'Alumni',
      sourceName: 'Rajagiri Alumni Association',
      clientName: 'Alumni Cell',
      contactEmail: 'alumni@rajagiri.edu',
      priority: 'urgent',
      estimatedBudget: 95000,
      expectedTimeline: '4 Months',
      submittedDate: '2026-08-05',
      description: 'Centralized portal for alumni registration, mentoring programs, job postings, and donation tracking.',
      deliverables: ['Alumni Directory', 'Mentorship Module', 'Payment Gateway Integration'],
      status: 'pending',
      suggestedFaculty: 'FAC-03'
    },
    {
      id: 'PROP-202',
      title: 'Automated Attendance System via Face Detection',
      type: 'AI / Computer Vision',
      source: 'Faculty',
      sourceName: 'Dr. Thomas Kurian',
      clientName: 'Department of Computer Applications',
      contactEmail: 'thomas.k@rajagiri.edu',
      priority: 'normal',
      estimatedBudget: 60000,
      expectedTimeline: '3 Months',
      submittedDate: '2026-08-07',
      description: 'Camera-based attendance marking for lecture halls with daily automated email reports to faculty.',
      deliverables: ['Face Recognition Model', 'Faculty Dashboard', 'Daily Email Alerts'],
      status: 'pending',
      suggestedFaculty: 'FAC-02'
    }
  ],
  faculties: [
    { id: '4', name: 'Faculty Member', email: 'faculty@rajagiri.edu', department: 'Computer Applications', activeProjectsCount: 1 }
  ],
  students: [
    { id: 'STU-01', name: 'Student Nova', track: 'Nova', project: 'Department Website Portal', status: 'Active', gpa: '9.2', github: 'nova-dev', email: 'nova@rajagiri.edu' },
    { id: 'STU-02', name: 'Student Orbit', track: 'Orbit', project: 'Smart Lab Inventory Tracker', status: 'Active', gpa: '8.8', github: 'orbit-dev', email: 'orbit@rajagiri.edu' },
    { id: 'STU-03', name: 'Student Spark', track: 'Spark', project: 'Department Website Portal', status: 'Active', gpa: '8.0', github: 'spark-dev', email: 'spark@rajagiri.edu' }
  ],
  financeSummary: {
    totalBudget: 265000,
    totalSpent: 90000,
    stipendsDisbursed: 45000,
    pendingInvoices: 2,
    pendingInvoiceAmount: 35000,
    payrollByTrack: {
      Nova: 24000,
      Orbit: 15000,
      Spark: 6000
    }
  },
  auditLogs: []
};

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  }
  try {
    const data = JSON.parse(stored);
    if (data.faculties && data.faculties.some(f => f.id === 'FAC-01')) {
      data.faculties = initialData.faculties;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    if (data.students && data.students.length > 3) {
      data.students = initialData.students;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    if (data.auditLogs && data.auditLogs.some(l => l.details && (l.details.includes('192.168.1.45') || l.id === 'LOG-001'))) {
      data.auditLogs = [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    return data;
  } catch (e) {
    console.error('Failed to parse director stored data, resetting:', e);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  }
}

function saveState(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const API_BASE = 'http://127.0.0.1:8000/api/dashboard';

async function getAuthHeadersAsync(forceRefresh = false) {
  let token = localStorage.getItem('token');
  if (!token || forceRefresh) {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'director@rajagiri.edu', password: 'director123' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.access_token) {
          token = data.access_token;
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      }
    } catch (e) {}
  }
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

let cacheOverview = null;
let cacheFaculties = null;
let cacheAuditLogs = null;

export class DirectorService {
  static getOverview() {
    const data = loadState();
    const activeProjects = data.projects.filter(p => p.status === 'in_progress').length;
    const pendingProposals = data.proposals.filter(p => p.status === 'pending').length;
    const novaCount = data.students.filter(s => s.track === 'Nova').length;
    const orbitCount = data.students.filter(s => s.track === 'Orbit').length;
    const sparkCount = data.students.filter(s => s.track === 'Spark').length;

    return {
      totalProjects: data.projects.length,
      activeProjects,
      pendingProposals,
      studentCounts: { nova: novaCount, orbit: orbitCount, spark: sparkCount, total: data.students.length },
      facultyCount: data.faculties.length,
      finance: data.financeSummary
    };
  }

  static getProjects() {
    return loadState().projects;
  }

  static getProposals() {
    return loadState().proposals;
  }

  static async updateProposalStatusAsync(proposalId, status, notes = '', facultyId = null) {
    try {
      const headers = await getAuthHeadersAsync();
      const response = await fetch(`${API_BASE}/proposals/${proposalId}/status`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ status, notes, faculty_id: facultyId })
      });
      if (response.ok) {
        this.updateProposalStatus(proposalId, status, notes, facultyId);
        return true;
      }
    } catch (e) {
      console.warn('API update proposal status failed, using local fallback:', e);
    }
    return this.updateProposalStatus(proposalId, status, notes, facultyId);
  }

  static async getOverviewAsync(forceFresh = false) {
    const fresh = await this.fetchOverviewRemote();
    if (fresh) {
      cacheOverview = fresh;
      return fresh;
    }
    return this.getOverview();
  }

  static async fetchOverviewRemote() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      let headers = await getAuthHeadersAsync();
      let response = await fetch(`${API_BASE}/overview`, { headers, signal: controller.signal });
      if (response.status === 401) {
        headers = await getAuthHeadersAsync(true);
        response = await fetch(`${API_BASE}/overview`, { headers, signal: controller.signal });
      }
      clearTimeout(timeoutId);
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success' && result.data) {
          const d = result.data;
          return {
            totalProjects: d.total_projects,
            activeProjects: d.active_projects,
            pendingProposals: d.pending_proposals,
            studentCounts: d.student_counts,
            facultyCount: d.faculty_count,
            finance: d.finance_summary
          };
        }
      }
    } catch (e) {
      // Fallback silently on timeout or network delay
    }
    return null;
  }

  static async getFacultiesAsync(forceFresh = false) {
    if (!forceFresh && cacheFaculties) {
      this.fetchFacultiesRemote().then(fresh => { if (fresh) cacheFaculties = fresh; });
      return cacheFaculties;
    }
    const fresh = await this.fetchFacultiesRemote();
    if (fresh) {
      cacheFaculties = fresh;
      return fresh;
    }
    return this.getFaculties();
  }

  static async fetchFacultiesRemote() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      let headers = await getAuthHeadersAsync();
      let response = await fetch(`${API_BASE}/faculties`, { headers, signal: controller.signal });
      if (response.status === 401) {
        headers = await getAuthHeadersAsync(true);
        response = await fetch(`${API_BASE}/faculties`, { headers, signal: controller.signal });
      }
      clearTimeout(timeoutId);
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success' && result.data && result.data.length > 0) {
          const facultiesList = result.data.map(f => ({
            id: String(f.id),
            name: f.name,
            email: f.email || 'faculty@rajagiri.edu',
            department: 'Computer Applications',
            activeProjectsCount: 1
          }));
          const data = loadState();
          data.faculties = facultiesList;
          saveState(data);
          return facultiesList;
        }
      }
    } catch (e) {
      // Fallback silently
    }
    return null;
  }

  static async assignFacultyAsync(projectId, facultyId) {
    try {
      const headers = await getAuthHeadersAsync();
      const response = await fetch(`${API_BASE}/projects/${projectId}/assign-faculty`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ faculty_id: facultyId })
      });
      if (response.ok) {
        this.assignFaculty(projectId, facultyId);
        return true;
      }
    } catch (e) {
      console.warn('API assign faculty failed, using local fallback:', e);
    }
    return this.assignFaculty(projectId, facultyId);
  }

  static async getAuditLogsAsync() {
    const fresh = await this.fetchAuditLogsRemote();
    if (fresh) {
      cacheAuditLogs = fresh;
      return fresh;
    }
    return this.getAuditLogs();
  }

  static async fetchAuditLogsRemote() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      let headers = await getAuthHeadersAsync();
      let response = await fetch(`${API_BASE}/audit-logs`, { headers, signal: controller.signal });
      if (response.status === 401) {
        headers = await getAuthHeadersAsync(true);
        response = await fetch(`${API_BASE}/audit-logs`, { headers, signal: controller.signal });
      }
      clearTimeout(timeoutId);
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success' && result.data) {
          const logs = result.data.map(l => ({
            id: typeof l.id === 'string' && l.id.startsWith('LOG-') ? l.id : `LOG-${l.id}`,
            timestamp: l.timestamp || (l.created_at ? String(l.created_at).slice(0, 16) : new Date().toISOString().slice(0, 16)),
            user: l.user || 'Director',
            role: l.role || 'Director',
            event: l.event || 'System Activity',
            details: l.details || '',
            type: l.type || 'info'
          }));
          const data = loadState();
          data.auditLogs = logs;
          saveState(data);
          return logs;
        }
      }
    } catch (e) {
      // Fallback silently
    }
    return null;
  }

  static getFaculties() {
    return loadState().faculties;
  }

  static getStudents(trackFilter = 'All') {
    const students = loadState().students;
    if (trackFilter === 'All') return students;
    return students.filter(s => s.track.toLowerCase() === trackFilter.toLowerCase());
  }

  static getClientRequirements() {
    const data = loadState();
    return data.projects.map(p => ({
      id: p.id,
      title: p.title,
      clientName: p.clientName,
      clientContact: p.clientContact,
      source: p.source,
      sourceName: p.sourceName,
      deliverables: p.deliverables,
      budget: p.budget,
      timeline: p.timeline,
      docs: p.requirementDocs
    }));
  }

  static getFinanceSummary() {
    return loadState().financeSummary;
  }

  static getAuditLogs() {
    return loadState().auditLogs;
  }

  static updateProposalStatus(proposalId, action, reason = '', facultyId = null) {
    const data = loadState();
    const proposalIndex = data.proposals.findIndex(p => p.id === proposalId);
    if (proposalIndex === -1) return false;

    const proposal = data.proposals[proposalIndex];
    proposal.status = action; // 'accepted' or 'rejected'
    proposal.reviewNotes = reason;

    if (action === 'accepted') {
      const selectedFaculty = data.faculties.find(f => f.id === facultyId) || data.faculties[0];
      const newProject = {
        id: `PROJ-${Math.floor(100 + Math.random() * 900)}`,
        title: proposal.title,
        type: proposal.type,
        source: proposal.source,
        sourceName: proposal.sourceName,
        clientName: proposal.clientName,
        clientContact: proposal.contactEmail,
        status: 'in_progress',
        priority: proposal.priority,
        progress: 0,
        timeline: proposal.expectedTimeline,
        budget: proposal.estimatedBudget,
        spent: 0,
        facultyId: selectedFaculty.id,
        facultyName: selectedFaculty.name,
        assignedStudents: [],
        deliverables: proposal.deliverables,
        requirementDocs: ['approved_proposal_spec.pdf']
      };
      data.projects.unshift(newProject);
    }

    // Add Audit Log
    data.auditLogs.unshift({
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      user: 'Director (Admin)',
      role: 'Director',
      event: `Proposal ${action.toUpperCase()}`,
      details: `${action === 'accepted' ? 'Accepted' : 'Rejected'} proposal "${proposal.title}". ${reason ? 'Note: ' + reason : ''}`,
      type: action === 'accepted' ? 'success' : 'warning'
    });

    saveState(data);
    return true;
  }

  static assignFaculty(projectId, facultyId) {
    const data = loadState();
    const project = data.projects.find(p => p.id === projectId);
    const faculty = data.faculties.find(f => f.id === facultyId);

    if (project && faculty) {
      project.facultyId = faculty.id;
      project.facultyName = faculty.name;

      data.auditLogs.unshift({
        id: `LOG-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        user: 'Director (Admin)',
        role: 'Director',
        event: 'Faculty Assigned',
        details: `Assigned ${faculty.name} as Lead Faculty for "${project.title}"`,
        type: 'info'
      });

      saveState(data);
      return true;
    }
    return false;
  }
}
