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
    { id: 'FAC-01', name: 'Dr. Anita Roy', department: 'Computer Science', activeProjectsCount: 2 },
    { id: 'FAC-02', name: 'Prof. Mathew Joseph', department: 'Information Technology', activeProjectsCount: 1 },
    { id: 'FAC-03', name: 'Dr. Thomas Kurian', department: 'Computer Applications', activeProjectsCount: 0 },
    { id: 'FAC-04', name: 'Prof. Sandra Paul', department: 'Data Science', activeProjectsCount: 1 }
  ],
  students: [
    { id: 'STU-01', name: 'Rohan Sharma', track: 'Nova', project: 'Department Website Portal', status: 'Active', gpa: '9.2', github: 'rohan-sharma-dev', email: 'rohan@student.rajagiri.edu' },
    { id: 'STU-04', name: 'Farsan K.A.', track: 'Nova', project: 'Smart Lab Inventory Tracker', status: 'Active', gpa: '9.4', github: 'farsan-ka', email: 'farsan@student.rajagiri.edu' },
    { id: 'STU-08', name: 'Siddharth V.', track: 'Nova', project: 'Unassigned', status: 'Available', gpa: '9.1', github: 'sid-v', email: 'sid@student.rajagiri.edu' },
    { id: 'STU-02', name: 'Ananya Verma', track: 'Orbit', project: 'Department Website Portal', status: 'Active', gpa: '8.6', github: 'ananya-v', email: 'ananya@student.rajagiri.edu' },
    { id: 'STU-05', name: 'Sneha George', track: 'Orbit', project: 'Smart Lab Inventory Tracker', status: 'Active', gpa: '8.8', github: 'sneha-g', email: 'sneha@student.rajagiri.edu' },
    { id: 'STU-06', name: 'Devika Nair', track: 'Orbit', project: 'Campus Event Management System', status: 'Completed', gpa: '8.5', github: 'devika-nair', email: 'devika@student.rajagiri.edu' },
    { id: 'STU-03', name: 'Kiran Paul', track: 'Spark', project: 'Department Website Portal', status: 'Active', gpa: '7.9', github: 'kiran-p', email: 'kiran@student.rajagiri.edu' },
    { id: 'STU-07', name: 'Arjun Das', track: 'Spark', project: 'Campus Event Management System', status: 'Completed', gpa: '8.0', github: 'arjun-das', email: 'arjun@student.rajagiri.edu' },
    { id: 'STU-09', name: 'Meera Nair', track: 'Spark', project: 'Unassigned', status: 'Available', gpa: '7.8', github: 'meera-n', email: 'meera@student.rajagiri.edu' }
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
  auditLogs: [
    { id: 'LOG-001', timestamp: '2026-08-09 18:40', user: 'Director (Admin)', role: 'Director', event: 'System Login', details: 'Logged in from IP 192.168.1.45', type: 'info' },
    { id: 'LOG-002', timestamp: '2026-08-09 16:15', user: 'Finance Head', role: 'Finance Head', event: 'Payroll Release', details: 'Approved Monthly Stipend Release for August', type: 'success' },
    { id: 'LOG-003', timestamp: '2026-08-08 14:20', user: 'Co-ordinator', role: 'Co-ordinator', event: 'Proposal Submitted', details: 'Submitted Proposal PROP-202 (Attendance System)', type: 'info' },
    { id: 'LOG-004', timestamp: '2026-08-07 11:05', user: 'Director (Admin)', role: 'Director', event: 'Faculty Assigned', details: 'Assigned Prof. Mathew Joseph to PROJ-102', type: 'success' }
  ]
};

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse director stored data, resetting:', e);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  }
}

function saveState(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

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
