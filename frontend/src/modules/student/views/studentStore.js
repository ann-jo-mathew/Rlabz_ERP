/**
 * RLABZ STUDENT PORTAL API STORE
 * Fetches and submits student records to/from the Laravel REST backend.
 */

import { API_BASE } from '@/core/config/api.js';

let cachedProjects = [];
let cachedSprints = [];
let cachedReports = [];
let cachedWorkLogs = [];
let cachedMeetings = [];
let cachedGithub = [];
let cachedChatMessages = [];
let cachedNotifications = [];
let cachedProfile = null;
let cachedDashboard = null;

let dataLoaded = false;
let lastToken = null;

// Helper to make API requests with Authorization JWT Header
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  // Only set Content-Type to application/json when not using FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || response.statusText);
  }
  
  return response.json();
}

export async function ensureDataLoaded(force = false) {
  const currentToken = localStorage.getItem('token');
  
  // Reset cache if user session changes
  if (currentToken !== lastToken) {
    cachedProjects = [];
    cachedSprints = [];
    cachedReports = [];
    cachedWorkLogs = [];
    cachedMeetings = [];
    cachedGithub = [];
    cachedChatMessages = [];
    cachedNotifications = [];
    cachedProfile = null;
    cachedDashboard = null;
    dataLoaded = false;
    lastToken = currentToken;
  }

  if (dataLoaded && !force) return;
  
  try {
    // 1. Fetch projects
    cachedProjects = await apiFetch('/student/projects');
    
    // 2. Fetch sprints (modules)
    cachedSprints = await apiFetch('/student/sprints');
    
    // 3. Fetch reports
    cachedReports = await apiFetch('/student/reports');
    
    // 4. Fetch work logs
    cachedWorkLogs = await apiFetch('/student/work-logs');
    
    // 5. Fetch github
    cachedGithub = await apiFetch('/student/github');
    
    // 6. Fetch meetings
    cachedMeetings = await apiFetch('/student/meetings');
    
    // 7. Fetch chats for each project
    cachedChatMessages = [];
    for (const proj of cachedProjects) {
      try {
        const msgs = await apiFetch(`/student/chats/${proj.id}`);
        const mappedMsgs = msgs.map(m => ({
          project: proj.title,
          sender: m.sender,
          text: m.text,
          time: m.time
        }));
        cachedChatMessages.push(...mappedMsgs);
      } catch (err) {
        console.warn(`Could not load chat for project ${proj.id}:`, err);
      }
    }

    // 8. Fetch notifications from DB
    try {
      cachedNotifications = await apiFetch('/student/notifications');
    } catch (err) {
      console.warn('Could not load notifications:', err);
      cachedNotifications = [];
    }

    // 10. Fetch unified dashboard (contains assigned tasks, projects, modules, meetings, stats)
    try {
      cachedDashboard = await apiFetch('/student/dashboard');
      if (cachedDashboard) {
        if (cachedDashboard.projects && cachedDashboard.projects.length > 0) {
          cachedProjects = cachedDashboard.projects;
        }
        if (cachedDashboard.meetings && cachedDashboard.meetings.length > 0) {
          cachedMeetings = cachedDashboard.meetings;
        }
        if (cachedDashboard.notifications && cachedDashboard.notifications.length > 0) {
          cachedNotifications = cachedDashboard.notifications;
        }
      }
    } catch (err) {
      console.warn('Could not load unified dashboard:', err);
    }
    
    dataLoaded = true;
  } catch (error) {
    console.error('Error loading backend student data:', error);
  }
}

export function getDashboardData() {
  return cachedDashboard;
}

export async function fetchLiveDashboard(force = true) {
  if (force || !cachedDashboard) {
    try {
      cachedDashboard = await apiFetch('/student/dashboard');
      if (cachedDashboard) {
        if (cachedDashboard.projects && cachedDashboard.projects.length > 0) {
          cachedProjects = cachedDashboard.projects;
        }
        if (cachedDashboard.meetings && cachedDashboard.meetings.length > 0) {
          cachedMeetings = cachedDashboard.meetings;
        }
        if (cachedDashboard.notifications && cachedDashboard.notifications.length > 0) {
          cachedNotifications = cachedDashboard.notifications;
        }
      }
    } catch (e) {
      console.error('Failed to fetch live dashboard:', e);
    }
  }
  return cachedDashboard;
}

export async function updateStudentTaskStatus(taskId, status, type = 'task') {
  const result = await apiFetch(`/student/tasks/${taskId}/status`, {
    method: 'POST',
    body: JSON.stringify({ status, type })
  });
  await fetchLiveDashboard(true);
  return result;
}

export function getProjects() {
  return cachedProjects;
}

export function getSprints() {
  return cachedSprints;
}

export function getReports() {
  return cachedReports;
}

export function getWorkLogs() {
  return cachedWorkLogs;
}

export function getMeetings() {
  return cachedMeetings;
}

export function getGithub() {
  return cachedGithub;
}

export function getChatMessages() {
  return cachedChatMessages;
}

export function getNotifications() {
  return cachedNotifications;
}

export function getStudentProfile() {
  return cachedProfile;
}

export async function fetchLiveStudentProfile() {
  try {
    const profile = await apiFetch('/student/profile');
    cachedProfile = profile;
    return profile;
  } catch (e) {
    return null;
  }
}

export async function getProjectTasks(projectId) {
  if (!projectId) return [];
  try {
    return await apiFetch(`/student/projects/${projectId}/tasks`);
  } catch (e) {
    console.error(`Failed to fetch tasks for project ${projectId}:`, e);
    return [];
  }
}

export async function saveReport(report) {
  const isFormData = report instanceof FormData;
  await apiFetch('/student/reports', {
    method: 'POST',
    body: isFormData ? report : JSON.stringify(report)
  });
  await ensureDataLoaded(true); // refresh cache
}

export async function saveWorkLog(workLog) {
  await apiFetch('/student/work-logs', {
    method: 'POST',
    body: JSON.stringify(workLog)
  });
  await ensureDataLoaded(true); // refresh cache
}

export async function saveGithubUrl(project, url) {
  await apiFetch('/student/github', {
    method: 'POST',
    body: JSON.stringify({ project, url })
  });
  await ensureDataLoaded(true); // refresh cache
}

export async function saveChatMessage(project, text) {
  const proj = cachedProjects.find(p => p.title === project);
  if (!proj) return;
  
  await apiFetch(`/student/chats/${proj.id}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text })
  });
  await ensureDataLoaded(true); // refresh cache
}

export async function saveSprint(sprint) {
  await apiFetch('/student/sprints', {
    method: 'POST',
    body: JSON.stringify(sprint)
  });
  await ensureDataLoaded(true); // refresh cache
}
