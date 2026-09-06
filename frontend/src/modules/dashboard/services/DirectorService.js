/**
 * DirectorService.js
 * Central Data & State Management for Module 2: Director Dashboard & Oversight
 */

const STORAGE_KEY = 'rlabz_director_data';

const initialData = {
  projects: [],
  proposals: [],
  faculties: [],
  students: [],
  financeSummary: {
    totalBudget: 0,
    totalSpent: 0,
    stipendsDisbursed: 0,
    pendingInvoices: 0,
    pendingInvoiceAmount: 0,
    payrollByTrack: { Nova: 0, Orbit: 0, Spark: 0 }
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
    if (data.projects && data.projects.some(p => p.id === 'PROJ-101' || p.title === 'Department Website Portal')) {
      data.projects = initialData.projects;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
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
  static getCachedOverview() {
    return cacheOverview;
  }

  static getOverview() {
    if (cacheOverview) {
      return cacheOverview;
    }
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
      finance: data.financeSummary,
      activeProjectHealth: (data.projects || []).slice(0, 5).map(p => ({
        id: p.id,
        title: p.title,
        facultyName: p.facultyName || 'Faculty Member',
        status: p.status,
        progress: p.progress || 65
      }))
    };
  }

  static getProjects() {
    return loadState().projects;
  }

  static async getProjectsAsync(forceFresh = false) {
    const fresh = await this.fetchProjectsRemote();
    if (fresh) return fresh;
    return this.getProjects();
  }

  static async fetchProjectsRemote() {
    try {
      let headers = await getAuthHeadersAsync();
      let response = await fetch(`${API_BASE}/projects`, { headers });
      if (response.status === 401) {
        headers = await getAuthHeadersAsync(true);
        response = await fetch(`${API_BASE}/projects`, { headers });
      }
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success' && result.data) {
          const data = loadState();
          data.projects = result.data;
          saveState(data);
          return result.data;
        }
      }
    } catch (e) {}
    return null;
  }

  static getProposals() {
    return loadState().proposals;
  }

  static async getProposalsAsync(forceFresh = false) {
    const fresh = await this.fetchProposalsRemote();
    if (fresh) return fresh;
    return this.getProposals();
  }

  static async fetchProposalsRemote() {
    try {
      let headers = await getAuthHeadersAsync();
      let response = await fetch(`${API_BASE}/proposals`, { headers });
      if (response.status === 401) {
        headers = await getAuthHeadersAsync(true);
        response = await fetch(`${API_BASE}/proposals`, { headers });
      }
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success' && result.data) {
          const data = loadState();
          data.proposals = result.data;
          saveState(data);
          return result.data;
        }
      }
    } catch (e) {}
    return null;
  }

  static async getFinanceSummaryAsync() {
    try {
      let headers = await getAuthHeadersAsync();
      let response = await fetch(`${API_BASE}/finance`, { headers });
      if (response.status === 401) {
        headers = await getAuthHeadersAsync(true);
        response = await fetch(`${API_BASE}/finance`, { headers });
      }
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success' && result.data) {
          const data = loadState();
          data.financeSummary = result.data;
          saveState(data);
          return result.data;
        }
      }
    } catch (e) {}
    return this.getFinanceSummary();
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
    if (!forceFresh && cacheOverview) {
      this.fetchOverviewRemote().then(fresh => { if (fresh) cacheOverview = fresh; });
      return cacheOverview;
    }
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
          const overviewData = {
            totalProjects: d.total_projects,
            activeProjects: d.active_projects,
            pendingProposals: d.pending_proposals,
            pendingProposalsList: (d.pending_proposals_list || []).map(p => ({
              id: String(p.id),
              title: p.title,
              clientName: p.client_name,
              estimatedBudget: p.budget,
              description: p.description,
              status: p.status,
              priority: p.priority
            })),
            studentCounts: d.student_counts,
            facultyCount: d.faculty_count,
            finance: d.finance_summary,
            activeProjectHealth: (d.active_project_health || []).map(p => ({
              id: p.id,
              title: p.title,
              facultyName: p.faculty_name,
              status: p.status,
              progress: p.progress
            }))
          };
          cacheOverview = overviewData;
          return overviewData;
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
            activeProjectsCount: f.active_projects_count !== undefined ? f.active_projects_count : (f.active_projects ? f.active_projects.length : 0),
            activeProjects: f.active_projects || []
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

  static async getClientRequirementsAsync() {
    const fresh = await this.fetchClientRequirementsRemote();
    if (fresh) {
      return fresh;
    }
    return this.getClientRequirements();
  }

  static async fetchClientRequirementsRemote() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      let headers = await getAuthHeadersAsync();
      let response = await fetch(`${API_BASE}/client-requirements`, { headers, signal: controller.signal });
      if (response.status === 401) {
        headers = await getAuthHeadersAsync(true);
        response = await fetch(`${API_BASE}/client-requirements`, { headers, signal: controller.signal });
      }
      clearTimeout(timeoutId);
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success' && result.data && result.data.length > 0) {
          return result.data.map(r => ({
            id: r.id,
            title: r.title,
            type: r.type,
            source: r.source,
            sourceName: r.sourceName,
            clientName: r.clientName,
            clientContact: r.clientContact,
            budget: r.budget,
            timeline: r.timeline,
            requirements: r.requirements,
            deliverables: r.deliverables,
            docs: r.docs
          }));
        }
      }
    } catch (e) {
      // Fallback silently
    }
    return null;
  }

  static async getStudentsAsync(trackFilter = 'All') {
    const fresh = await this.fetchStudentsRemote();
    if (fresh) {
      if (trackFilter === 'All') return fresh;
      return fresh.filter(s => s.track.toLowerCase() === trackFilter.toLowerCase());
    }
    return this.getStudents(trackFilter);
  }

  static async fetchStudentsRemote() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      let headers = await getAuthHeadersAsync();
      let response = await fetch(`${API_BASE}/students`, { headers, signal: controller.signal });
      if (response.status === 401) {
        headers = await getAuthHeadersAsync(true);
        response = await fetch(`${API_BASE}/students`, { headers, signal: controller.signal });
      }
      clearTimeout(timeoutId);
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success' && result.data && result.data.length > 0) {
          const students = result.data.map(s => ({
            id: s.id,
            name: s.name,
            email: s.email,
            track: s.track,
            project: s.project,
            status: s.status,
            gpa: s.gpa,
            github: s.github
          }));
          const data = loadState();
          data.students = students;
          saveState(data);
          return students;
        }
      }
    } catch (e) {
      // Fallback silently
    }
    return null;
  }

  static getFaculties() {
    const data = loadState();
    const projects = data.projects || [];
    return (data.faculties || []).map(f => {
      const assignedProjects = projects.filter(p => (p.facultyId === f.id || String(p.facultyId) === String(f.id)) && p.status !== 'completed' && p.status !== 'rejected');
      return {
        ...f,
        activeProjectsCount: f.activeProjectsCount !== undefined ? f.activeProjectsCount : assignedProjects.length,
        activeProjects: (f.activeProjects && f.activeProjects.length > 0) ? f.activeProjects : assignedProjects
      };
    });
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
