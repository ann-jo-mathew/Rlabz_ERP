/**
 * RLABZ STUDENT PORTAL API STORE
 * Fetches and submits student records to/from the Laravel REST backend.
 */

import { API_BASE } from '@/core/config/api.js';
import { useAuthStore } from '@/core/stores/auth.js';

let cachedProjects = [];
let cachedSprints = [];
let cachedReports = [];
let cachedWorkLogs = [];
let cachedMeetings = [];
let cachedGithub = [];
let cachedGithubProjects = [];
let cachedChatMessages = [];
let cachedNotifications = [];
let cachedCertificates = [];
let cachedCalendarEvents = [];
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

function toArray(val) {
  if (Array.isArray(val)) return val;
  if (Array.isArray(val?.data)) return val.data;
  if (Array.isArray(val?.data?.data)) return val.data.data;
  return [];
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
    cachedCertificates = [];
    cachedCalendarEvents = [];
    cachedProfile = null;
    cachedDashboard = null;
    dataLoaded = false;
    lastToken = currentToken;
  }

  if (dataLoaded && !force) return;
  
  try {
    // 1. Fetch projects
    cachedProjects = toArray(await apiFetch('/student/projects'));
    
    // 2. Fetch sprints (modules)
    cachedSprints = toArray(await apiFetch('/student/sprints'));
    
    // 3. Fetch reports
    cachedReports = toArray(await apiFetch('/student/reports'));
    
    // 4. Fetch work logs
    cachedWorkLogs = toArray(await apiFetch('/student/work-logs'));
    
    // 5. Fetch github
    const githubRes = await apiFetch('/student/github');
    cachedGithub = Array.isArray(githubRes) ? githubRes : (githubRes.repos || []);
    cachedGithubProjects = Array.isArray(githubRes) ? [] : (githubRes.projects || []);
    
    // 6. Fetch meetings
    cachedMeetings = toArray(await apiFetch('/student/meetings'));

    // 7. Fetch calendar events (ERP deadlines, sprints, meetings, reviews, reports)
    try {
      cachedCalendarEvents = await apiFetch('/student/calendar-events');
    } catch (err) {
      console.warn('Could not load calendar events endpoint:', err);
      cachedCalendarEvents = [];
    }
    
    // 8. Fetch chats for each project
    cachedChatMessages = [];
    for (const proj of cachedProjects) {
      try {
        const msgs = await apiFetch(`/student/chats/${proj.id}`);
        const mappedMsgs = msgs.map(m => ({
          project: proj.title,
          sender: m.sender,
          senderName: m.senderName,
          text: m.text,
          attachment: m.attachment || null,
          time: m.time
        }));
        cachedChatMessages.push(...mappedMsgs);
      } catch (err) {
        console.warn(`Could not load chat for project ${proj.id}:`, err);
      }
    }

    // 9. Fetch notifications from DB
    try {
      cachedNotifications = await apiFetch('/student/notifications');
    } catch (err) {
      console.warn('Could not load notifications:', err);
      cachedNotifications = [];
    }

    // 9. Fetch the authenticated student's own certificates (backend-scoped by
    // the JWT subject — never trust a client-side project/name match).
    try {
      const certResponse = await apiFetch('/certificates/mine');
      cachedCertificates = Array.isArray(certResponse?.data) ? certResponse.data : [];
    } catch (err) {
      console.warn('Could not load certificates:', err);
      cachedCertificates = [];
    }

    // 10. Fetch unified dashboard (contains assigned tasks, projects, modules, meetings, stats)
    try {
      cachedDashboard = await apiFetch('/student/dashboard');
      if (cachedDashboard) {
        if (cachedDashboard.projects && cachedDashboard.projects.length > 0) {
          cachedProjects = cachedDashboard.projects;
        }
        if ((!cachedMeetings || cachedMeetings.length === 0) && cachedDashboard.meetings && cachedDashboard.meetings.length > 0) {
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
        if (cachedDashboard.has_design_access !== undefined) {
          try {
            const authStore = useAuthStore();
            if (authStore && authStore.user) {
              authStore.user.has_design_access = Boolean(cachedDashboard.has_design_access);
            }
          } catch (_) {}
          try {
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            storedUser.has_design_access = Boolean(cachedDashboard.has_design_access);
            localStorage.setItem('user', JSON.stringify(storedUser));
          } catch (_) {}
        }
        if (cachedDashboard.projects && cachedDashboard.projects.length > 0) {
          cachedProjects = cachedDashboard.projects;
        }
        if ((!cachedMeetings || cachedMeetings.length === 0) && cachedDashboard.meetings && cachedDashboard.meetings.length > 0) {
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

export function getCertificates() {
  return cachedCertificates;
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

export function getGithubProjects() {
  return cachedGithubProjects;
}

export function getChatMessages() {
  return cachedChatMessages;
}

export function getNotifications() {
  return cachedNotifications;
}

export function getCalendarEvents() {
  return cachedCalendarEvents;
}

export async function fetchLiveCalendarEvents(force = true) {
  if (force || !cachedCalendarEvents || cachedCalendarEvents.length === 0) {
    try {
      cachedCalendarEvents = await apiFetch('/student/calendar-events');
    } catch (e) {
      console.warn('Could not fetch live calendar events:', e);
      cachedCalendarEvents = cachedCalendarEvents || [];
    }
  }
  return cachedCalendarEvents;
}

export async function fetchLiveNotifications() {
  try {
    cachedNotifications = await apiFetch('/student/notifications');
    return cachedNotifications;
  } catch (e) {
    console.warn('Could not fetch notifications:', e);
    return cachedNotifications || [];
  }
}

export async function markStudentNotificationRead(id) {
  try {
    await apiFetch(`/student/notifications/${id}/read`, {
      method: 'POST'
    });
    const notif = (cachedNotifications || []).find(n => String(n.id) === String(id));
    if (notif) {
      notif.is_read = true;
      notif.isRead = true;
    }
    if (cachedDashboard && cachedDashboard.notifications) {
      const dNotif = cachedDashboard.notifications.find(n => String(n.id) === String(id));
      if (dNotif) {
        dNotif.is_read = true;
        dNotif.isRead = true;
      }
    }
    window.dispatchEvent(new CustomEvent('student-notifications-updated', { detail: { id, allRead: false } }));
  } catch (e) {
    console.error(`Failed to mark notification ${id} as read:`, e);
  }
}

export async function markAllStudentNotificationsRead() {
  try {
    await apiFetch('/student/notifications/mark-all-read', {
      method: 'POST'
    });
    (cachedNotifications || []).forEach(n => {
      n.is_read = true;
      n.isRead = true;
    });
    if (cachedDashboard && cachedDashboard.notifications) {
      cachedDashboard.notifications.forEach(n => {
        n.is_read = true;
        n.isRead = true;
      });
    }
    window.dispatchEvent(new CustomEvent('student-notifications-updated', { detail: { allRead: true } }));
  } catch (e) {
    console.error('Failed to mark all notifications as read:', e);
  }
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

export async function updateStudentPassword(current_password, new_password, confirm_password) {
  return await apiFetch('/student/change-password', {
    method: 'POST',
    body: JSON.stringify({ current_password, new_password, confirm_password })
  });
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

export async function saveGithubUrl(project, url, projectId = null) {
  await apiFetch('/student/github', {
    method: 'POST',
    body: JSON.stringify({ project, url, projectId })
  });
  await ensureDataLoaded(true); // refresh cache
}

export async function saveGithubBranch(projectId, branchName, branchUrl = '', id = null) {
  const res = await apiFetch('/student/github/branch', {
    method: 'POST',
    body: JSON.stringify({ projectId, branchName, branchUrl, id })
  });
  await ensureDataLoaded(true); // refresh cache
  return res;
}

export async function deleteGithubBranch(branchId) {
  const res = await apiFetch(`/student/github/branch/${branchId}`, {
    method: 'DELETE'
  });
  await ensureDataLoaded(true); // refresh cache
  return res;
}

export async function updateTaskGithub(taskId, githubRepositoryId, githubPrUrl) {
  const res = await apiFetch(`/student/tasks/${taskId}/github`, {
    method: 'POST',
    body: JSON.stringify({
      github_repository_id: githubRepositoryId,
      github_pr_url: githubPrUrl
    })
  });
  await ensureDataLoaded(true); // refresh cache
  return res;
}

export async function fetchLiveChatMessages(projectId, type = 'individual') {
  try {
    const res = await apiFetch(`/student/chats/${projectId}?type=${type}`);
    return Array.isArray(res) ? res : (res.messages || []);
  } catch (err) {
    console.error(`Error loading live chat for project ${projectId}:`, err);
    return [];
  }
}

export async function sendLiveChatMessage(projectId, text, attachment = null, type = 'individual') {
  const payload = { text: text || '', type };
  if (attachment) {
    payload.attachment = attachment;
  }
  return apiFetch(`/student/chats/${projectId}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function saveChatMessage(project, text, attachment = null, type = 'individual') {
  const proj = cachedProjects.find(p => p.title === project || p.id === project);
  if (!proj) return;
  
  const payload = { text: text || '', type };
  if (attachment) {
    payload.attachment = attachment;
  }

  await apiFetch(`/student/chats/${proj.id}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload)
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

// Scoped student profile photo helpers
export function getStudentPhotoKey(user) {
  if (!user) return null;
  const identifier = user.id || user.email || user.username || user.name;
  return identifier ? `student_profile_photo_${String(identifier).toLowerCase().trim()}` : null;
}

export function getStudentProfilePhoto(user) {
  const key = getStudentPhotoKey(user);
  if (!key) return null;
  return localStorage.getItem(key) || null;
}

export function saveStudentProfilePhoto(user, dataUrl) {
  const key = getStudentPhotoKey(user);
  if (key && dataUrl) {
    localStorage.setItem(key, dataUrl);
  }
}

export function removeStudentProfilePhoto(user) {
  const key = getStudentPhotoKey(user);
  if (key) {
    localStorage.removeItem(key);
  }
  try {
    localStorage.removeItem('student_profile_photo'); // clear legacy unscoped key
  } catch (e) {}
}

