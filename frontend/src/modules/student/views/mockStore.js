/**
 * LocalStorage Mock Data Store for Student Portal
 */

const DEFAULT_PROJECTS = [
  {
    id: 1,
    title: "RLabZ ERP - Student Portal",
    designation: "Orbit",
    status: "In Progress",
    faculty: "Dr. Anjali Thomas",
    timeline: "Aug 2026 - Nov 2026",
    progress: 45,
    description: "Development of Module 6 - Student Portal for the Computer Science Department's ERP system. Covering student dashboards, projects, work logs, meetings, and GitHub integrations.",
    tech: "HTML5, CSS3, JavaScript, Laravel, MySQL",
    members: "Rosha Thankachan, Allen Mathew"
  },
  {
    id: 2,
    title: "CMS Academic Module",
    designation: "Spark",
    status: "Completed",
    faculty: "Prof. Mathew John",
    timeline: "Jan 2026 - May 2026",
    progress: 100,
    description: "Course Management System backend and faculty-facing admin panels.",
    tech: "React, Node.js, Express, MongoDB",
    members: "Rosha Thankachan, Kevin Paul"
  }
];

const DEFAULT_PROPOSALS = [
  {
    id: 101,
    title: "AI-Driven Placement Predictor",
    description: "Predicting student placements using academic and project analytics.",
    tech: "Python, Flask, Scikit-learn, React",
    duration: "3 Months",
    status: "Approved",
    feedback: ""
  },
  {
    id: 102,
    title: "Blockchain-based Certificate Verifier",
    description: "A decentralized verification system for student academic records and course certificates.",
    tech: "Ethereum, Solidity, React.js, Web3.js",
    duration: "4 Months",
    status: "Rejected",
    feedback: "Rejection Reason: Project scope is too wide for a single semester. Consider narrowing the focus to digital signature verification."
  }
];

const DEFAULT_REPORTS = [
  {
    id: 201,
    project: "RLabZ ERP - Student Portal",
    type: "Weekly",
    date: "2026-08-07",
    workDone: "Set up modular routes and custom StudentLayout. Created initial dashboard layout and styling base.",
    challenges: "Synchronizing layout sidebar dynamically without mutating core packages.",
    nextPlan: "Create StudentProjects and StudentProposals views. Implement LocalStorage data store."
  },
  {
    id: 202,
    project: "RLabZ ERP - Student Portal",
    type: "Daily",
    date: "2026-08-08",
    workDone: "Implemented Reports view and Work Logs submission logic.",
    challenges: "None",
    nextPlan: "Develop Meetings list and simple grid calendar view."
  }
];

const DEFAULT_WORK_LOGS = [
  {
    id: 301,
    project: "RLabZ ERP - Student Portal",
    date: "2026-08-07",
    hours: 6,
    description: "Completed routing structure and dynamic sidebar injection logic."
  },
  {
    id: 302,
    project: "RLabZ ERP - Student Portal",
    date: "2026-08-08",
    hours: 4,
    description: "Coded Reports form, Work Log submissions and dashboard UI panels."
  }
];

const DEFAULT_MEETINGS = [
  {
    id: 401,
    title: "Weekly Progress Review",
    project: "RLabZ ERP - Student Portal",
    date: "2026-08-11",
    time: "14:00",
    type: "Sprint Review",
    status: "Scheduled",
    location: "Google Meet: meet.google.com/abc-defg-hij",
    notes: "Agenda:\n1. Showcase current prototype UI screens.\n2. Review work log submissions flow.\n3. Discuss GitHub verification status flow with supervisor."
  },
  {
    id: 402,
    title: "Project Ideation Discussion",
    project: "AI-Driven Placement Predictor",
    date: "2026-08-05",
    time: "10:30",
    type: "One-on-One",
    status: "Completed",
    location: "CS Department Seminar Hall 2",
    notes: "Notes:\n- Discussed proposal objectives.\n- Faculty advised focusing on logistic regression and random forest classification.\n- Proposal approved."
  }
];

const DEFAULT_GITHUB = [
  {
    project: "RLabZ ERP - Student Portal",
    url: "https://github.com/rosha/rlabz-student-portal",
    status: "Verified",
    faculty: "Dr. Anjali Thomas"
  },
  {
    project: "CMS Academic Module",
    url: "https://github.com/rosha/cms-academic-module",
    status: "Verified",
    faculty: "Prof. Mathew John"
  }
];

const DEFAULT_CHAT = [
  {
    project: "RLabZ ERP - Student Portal",
    sender: "student",
    text: "Hello Dr. Anjali, I have started building the Student Portal frontend module as per instructions. Could you review the prototype UI next Tuesday?",
    time: "2026-08-08T15:30:00Z"
  },
  {
    project: "RLabZ ERP - Student Portal",
    sender: "faculty",
    text: "Hello Rosha. Yes, that works. Let's schedule a meeting during the Weekly Progress Review on Tuesday at 2 PM. Please log your hours.",
    time: "2026-08-08T16:15:00Z"
  }
];

function initKey(key, defaultValue) {
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
  }
}

export function initMockStore() {
  initKey('student_projects', DEFAULT_PROJECTS);
  initKey('student_proposals', DEFAULT_PROPOSALS);
  initKey('student_reports', DEFAULT_REPORTS);
  initKey('student_work_logs', DEFAULT_WORK_LOGS);
  initKey('student_meetings', DEFAULT_MEETINGS);
  initKey('student_github', DEFAULT_GITHUB);
  initKey('student_chat_messages', DEFAULT_CHAT);
}

// Retrieve data functions
export function getProjects() {
  initMockStore();
  return JSON.parse(localStorage.getItem('student_projects'));
}

export function getProposals() {
  initMockStore();
  return JSON.parse(localStorage.getItem('student_proposals'));
}

export function getReports() {
  initMockStore();
  return JSON.parse(localStorage.getItem('student_reports'));
}

export function getWorkLogs() {
  initMockStore();
  return JSON.parse(localStorage.getItem('student_work_logs'));
}

export function getMeetings() {
  initMockStore();
  return JSON.parse(localStorage.getItem('student_meetings'));
}

export function getGithub() {
  initMockStore();
  return JSON.parse(localStorage.getItem('student_github'));
}

export function getChatMessages() {
  initMockStore();
  return JSON.parse(localStorage.getItem('student_chat_messages'));
}

// Save data functions
export function saveProposal(proposal) {
  const proposals = getProposals();
  proposals.push({
    id: Date.now(),
    status: 'Pending',
    feedback: '',
    ...proposal
  });
  localStorage.setItem('student_proposals', JSON.stringify(proposals));
}

export function saveReport(report) {
  const reports = getReports();
  reports.push({
    id: Date.now(),
    ...report
  });
  localStorage.setItem('student_reports', JSON.stringify(reports));
}

export function saveWorkLog(workLog) {
  const logs = getWorkLogs();
  logs.push({
    id: Date.now(),
    ...workLog
  });
  localStorage.setItem('student_work_logs', JSON.stringify(logs));
}

export function saveGithubUrl(project, url) {
  const repos = getGithub();
  const index = repos.findIndex(r => r.project === project);
  if (index !== -1) {
    repos[index].url = url;
    repos[index].status = 'Pending';
    repos[index].faculty = '';
  } else {
    repos.push({
      project,
      url,
      status: 'Pending',
      faculty: ''
    });
  }
  localStorage.setItem('student_github', JSON.stringify(repos));
}

export function saveChatMessage(project, text) {
  const msgs = getChatMessages();
  msgs.push({
    project,
    sender: 'student',
    text,
    time: new Date().toISOString()
  });
  localStorage.setItem('student_chat_messages', JSON.stringify(msgs));
}
