import { useAuthStore } from '../stores/auth.js';
import { modules } from '../../module-manifest.js';
import { API_BASE } from '../config/api.js';
import { profilePhotoUrl, applyHeaderAvatar, rememberProfilePhoto } from '../shared/profilePhoto.js';

// Primary profile page per role; roles without their own page use the shared /profile.
const ROLE_PROFILE_ROUTES = {
  coordinator: '/coordinator/profile',
  faculty: '/faculty/profile',
  student: '/student/profile',
};

const BELL_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`;

function formatNotificationTime(value) {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

async function fetchNotifications() {
  const token = localStorage.getItem('token');
  if (!token) return [];
  try {
    const resp = await fetch(`${API_BASE}/notifications`, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) return [];
    const body = await resp.json().catch(() => ({}));
    return Array.isArray(body?.data) ? body.data : [];
  } catch (e) {
    return [];
  }
}

function renderNotificationList(notifications) {
  if (!notifications.length) {
    return `<div style="text-align:center; padding: 2.5rem 1rem; color: var(--text-muted); font-size: 0.9rem;">
      <div style="font-size: 2rem; margin-bottom: 0.5rem;">ðŸ””</div>
      <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">No notifications</div>
      <div style="font-size: 0.78rem;">All pending updates and system alerts will appear here.</div>
    </div>`;
  }

  return notifications.map((n) => {
    const unread = !n.is_read;
    const isUrgent = n.urgency === 'urgent' || n.urgency === 'high';
    const rawType = (n.type || (n.category || 'general')).toLowerCase();
    
    let catBadgeClass = 'fin-cat-info';
    let catLabel = 'General';
    if (rawType.includes('ssl')) {
      catBadgeClass = 'fin-cat-ssl';
      catLabel = 'SSL';
    } else if (rawType.includes('domain')) {
      catBadgeClass = 'fin-cat-domain';
      catLabel = 'Domain';
    } else if (rawType.includes('bill') || rawType.includes('invoice') || rawType.includes('finance')) {
      catBadgeClass = 'fin-cat-billing';
      catLabel = 'Billing';
    } else if (rawType.includes('proj')) {
      catBadgeClass = 'fin-cat-project';
      catLabel = 'Project';
    } else if (rawType.includes('task') || rawType.includes('sprint')) {
      catBadgeClass = 'fin-cat-task';
      catLabel = 'Task';
    }

    const countdownTag = isUrgent 
      ? `<span class="fin-countdown-tag tag-red">Urgent Action</span>`
      : (unread 
        ? `<span class="fin-countdown-tag tag-amber">Unread</span>`
        : `<span class="fin-countdown-tag tag-slate">Info</span>`);

    return `
      <div class="fin-action-card ${isUrgent ? 'card-overdue' : (unread ? 'card-upcoming' : 'card-info')}" data-id="${n.id}" data-unread="${unread ? '1' : '0'}" role="button" tabindex="0">
        <div class="fin-card-header-row">
          <span class="fin-cat-badge ${catBadgeClass}">${n.category || catLabel}</span>
          ${countdownTag}
        </div>
        <div class="fin-card-msg">${n.message}</div>
        <div class="fin-card-meta">
          <span class="fin-project-name">${n.project?.title || 'Academic ERP'}</span>
          <span class="fin-card-time" style="display: flex; align-items: center; gap: 5px;">
            ${unread ? '<span style="width: 7px; height: 7px; border-radius: 50%; background: #00897B; display: inline-block;"></span>' : ''}
            ${formatNotificationTime(n.created_at)}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

function populateSidebarNav(sidebarNav, currentPath, authStore) {
  if (!sidebarNav) return;

  const isFaculty = authStore.role === 'faculty' || currentPath.startsWith('/faculty');
  const isStudent = authStore.role === 'student';
  const isStudentPortal = currentPath.startsWith('/student');
  const isDeveloper = authStore.role === 'developer' || currentPath.startsWith('/developer');
  const isDirector = authStore.role === 'director' || currentPath.startsWith('/director');
  const isDesignHead = authStore.role === 'design_head' || currentPath.startsWith('/design');
  const isAdmin = authStore.role === 'admin' || currentPath.startsWith('/admin');

  let targetPortal = 'default';
  if (isFaculty) {
    targetPortal = 'faculty';
  } else if (isStudent && isStudentPortal) {
    targetPortal = 'student';
  } else if (isAdmin) {
    targetPortal = 'admin';
  } else if (isDeveloper) {
    targetPortal = 'developer';
  } else if (isDirector) {
    targetPortal = 'director';
  } else if (isDesignHead) {
    targetPortal = 'design';
  }

  let studentHasDesignAccess = false;
  if (targetPortal === 'student') {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      studentHasDesignAccess = Boolean(authStore.user?.has_design_access || storedUser?.has_design_access);
    } catch (_) {}
  }

  const needsStudentRerender = targetPortal === 'student' && (
    !sidebarNav.querySelector('a[href="/student/work-logs"]') ||
    sidebarNav.dataset.hasDesignAccess !== String(studentHasDesignAccess)
  );

  if (sidebarNav.dataset.portal !== targetPortal || needsStudentRerender) {
    sidebarNav.dataset.portal = targetPortal;
    if (targetPortal === 'student') {
      sidebarNav.dataset.hasDesignAccess = String(studentHasDesignAccess);
      const studentItems = [
        { title: 'Dashboard', path: '/student', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>`, perm: 'view-student' },
        { title: 'My Projects', path: '/student/projects', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`, perm: 'view-projects' },
        ...(studentHasDesignAccess ? [{ title: 'Design', path: '/student/design', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="m4.93 4.93 4.24 4.24"></path><path d="m14.83 9.17 4.24-4.24"></path><path d="m14.83 14.83 4.24 4.24"></path><path d="m9.17 14.83-4.24 4.24"></path><circle cx="12" cy="12" r="4"></circle></svg>`, perm: 'view-design' }] : []),
        { title: 'Progress Reports', path: '/student/reports', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="9" y1="18" x2="15" y2="18"></line><line x1="10" y1="14" x2="14" y2="14"></line><path d="M21 16V8a2 2 0 0 0-1.95-2H20a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2h.05A2 2 0 0 0 2 8v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2z"></path></svg>`, perm: 'view-student' },
        { title: 'Work Logs', path: '/student/work-logs', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`, perm: 'view-student' },
        { title: 'Certificates', path: '/student/certificates', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>`, anyPerms: ['view-certificates', 'view-certificates-read'] },
        { title: 'Meetings', path: '/student/meetings', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`, perm: 'view-communication' },
        { title: 'GitHub', path: '/student/github', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>`, perm: 'view-github' },
        { title: 'Chat', path: '/student/chat', icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`, perm: 'view-communication' }
      ];

      const userPerms = authStore.permissions || [];
      const visibleStudentItems = studentItems.filter(item => {
        if (item.perm) return userPerms.includes(item.perm);
        if (item.anyPerms) return item.anyPerms.some(p => userPerms.includes(p));
        return true;
      });

      sidebarNav.innerHTML = `
        <ul>
          ${visibleStudentItems.map(item => `
            <li>
              <a href="${item.path}">
                ${item.icon}
                <span>${item.title}</span>
              </a>
            </li>
          `).join('')}
        </ul>
      `;
    } else if (targetPortal === 'faculty') {
      const iconProfile = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
      const iconDashboard = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>`;
      const iconReport = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;
      const iconProjects = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`;
      const iconMeetings = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
      const iconSprints = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>`;
      const iconNotifications = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`;
      const iconStudents = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
      const iconVerifyTask = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`;
      const iconChat = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;

      const facultyItems = [
        { title: 'Dashboard', path: '/faculty', icon: iconDashboard, perm: 'view-faculty' },
        { title: 'Profile', path: '/faculty/profile', icon: iconProfile },
        { title: 'My Project', path: '/faculty/projects', icon: iconProjects, anyPerms: ['view-projects', 'project.view_assigned'] },
        { title: 'Chat', path: '/faculty/chat', icon: iconChat, perm: 'view-communication' },
        { title: 'Students', path: '/faculty/students', icon: iconStudents, anyPerms: ['view-faculty', 'view-student'] },
        { title: 'Assign Module & Task', path: '/faculty/sprints', icon: iconSprints, anyPerms: ['project.module.create', 'project.task.create'] },
        { title: 'Verify Task', path: '/faculty/verify-tasks', icon: iconVerifyTask, perm: 'project.submission.review' },
        { title: 'Meetings', path: '/faculty/meetings', icon: iconMeetings, perm: 'view-communication' },
        { title: 'Report', path: '/faculty/reports', icon: iconReport, perm: 'view-faculty' },
        { title: 'Notifications', path: '/faculty/notifications', icon: iconNotifications, perm: 'view-faculty' }
      ];

      const userPerms = authStore.permissions || [];
      const visibleFacultyItems = facultyItems.filter(item => {
        if (item.perm) return userPerms.includes(item.perm);
        if (item.anyPerms) return item.anyPerms.some(p => userPerms.includes(p));
        return true;
      });

      sidebarNav.innerHTML = `
        <ul>
          ${visibleFacultyItems.map(item => `
            <li>
              <a href="${item.path}">
                ${item.icon}
                <span>${item.title}</span>
              </a>
            </li>
          `).join('')}
        </ul>
      `;
    } else if (targetPortal === 'developer') {
      const iconOverview = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>`;
      const iconProjects = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`;
      const iconStudents = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
      const iconClients = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`;
      const iconFinance = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`;
      const iconAudit = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`;

      const devItems = [
        { title: 'Developer Overview', path: '/developer', icon: iconOverview, perm: 'view-dashboard' },
        { title: 'Projects & Proposals', path: '/developer/projects', icon: iconProjects, anyPerms: ['view-projects', 'project.view_global'] },
        { title: 'Student Track Roster', path: '/developer/students', icon: iconStudents, perm: 'view-student' },
        { title: 'Client Requirements', path: '/developer/clients', icon: iconClients, anyPerms: ['project.client_requirements.view', 'project.client_requirements.create'] },
        { title: 'Finance & Payroll (Read-Only)', path: '/developer/finance', icon: iconFinance, anyPerms: ['view-finance', 'view-finance-readonly'] },
        { title: 'System Audit Log', path: '/developer/audit', icon: iconAudit, perm: 'view-audit-notifications' }
      ];

      const userPerms = authStore.permissions || [];
      const visibleDevItems = devItems.filter(item => {
        if (item.perm) return userPerms.includes(item.perm);
        if (item.anyPerms) return item.anyPerms.some(p => userPerms.includes(p));
        return true;
      });

      sidebarNav.innerHTML = `
        <div class="sidebar-section-title" style="padding: 0.75rem 1.25rem 0.25rem; font-size: 0.7rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">
          Developer Operations
        </div>
        <ul>
          ${visibleDevItems.map(item => `
            <li>
              <a href="${item.path}">
                ${item.icon}
                <span>${item.title}</span>
              </a>
            </li>
          `).join('')}
        </ul>
      `;
    } else if (targetPortal === 'director') {
      const iconOverview = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>`;
      const iconProjects = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`;
      const iconStudents = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
      const iconClients = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`;
      const iconFinance = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`;
      const iconAudit = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`;

      const directorItems = [
        { title: 'Executive Overview', path: '/director', icon: iconOverview, perm: 'view-dashboard' },
        { title: 'Projects & Proposals', path: '/director/projects', icon: iconProjects, anyPerms: ['view-projects', 'project.view_global'] },
        { title: 'Student Track Roster', path: '/director/students', icon: iconStudents, perm: 'view-student' },
        { title: 'Client Requirements', path: '/director/clients', icon: iconClients, anyPerms: ['project.client_requirements.view', 'project.client_requirements.create'] },
        { title: 'Finance & Payroll (Read-Only)', path: '/director/finance', icon: iconFinance, anyPerms: ['view-finance', 'view-finance-readonly'] },
        { title: 'System Audit Log', path: '/director/audit', icon: iconAudit, perm: 'view-audit-notifications' }
      ];

      const userPerms = authStore.permissions || [];
      const visibleDirectorItems = directorItems.filter(item => {
        if (item.perm) return userPerms.includes(item.perm);
        if (item.anyPerms) return item.anyPerms.some(p => userPerms.includes(p));
        return true;
      });

      sidebarNav.innerHTML = `
        <div class="sidebar-section-title" style="padding: 0.75rem 1.25rem 0.25rem; font-size: 0.7rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">
          Director Workspace
        </div>
        <ul>
          ${visibleDirectorItems.map(item => `
            <li>
              <a href="${item.path}">
                ${item.icon}
                <span>${item.title}</span>
              </a>
            </li>
          `).join('')}
        </ul>
      `;
    } else if (targetPortal === 'design') {
      const iconStudio = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`;
      const iconProjects = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`;
      const iconProfile = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
      const iconCommunication = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;

      const designItems = [
        { title: 'Design Studio', path: '/design', icon: iconStudio, perm: 'view-design' },
        { title: 'Projects & Prototypes', path: '/projects', icon: iconProjects, anyPerms: ['view-projects', 'project.view_global', 'project.view_assigned'] },
        { title: 'Team Communication', path: '/communication', icon: iconCommunication, perm: 'view-communication' },
        { title: 'My Profile & Security', path: '/profile', icon: iconProfile }
      ];

      const userPerms = authStore.permissions || [];
      const visibleDesignItems = designItems.filter(item => {
        if (item.perm) return userPerms.includes(item.perm);
        if (item.anyPerms) return item.anyPerms.some(p => userPerms.includes(p));
        return true;
      });

      sidebarNav.innerHTML = `
        <div class="sidebar-section-title" style="padding: 0.75rem 1.25rem 0.25rem; font-size: 0.7rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">
          Design Department
        </div>
        <ul>
          ${visibleDesignItems.map(item => `
            <li>
              <a href="${item.path}">
                ${item.icon}
                <span>${item.title}</span>
              </a>
            </li>
          `).join('')}
        </ul>
      `;
    } else if (targetPortal === 'admin') {
      const iconUsers = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
      const iconProjects = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`;

      const adminItems = [
        { title: 'User Management', path: '/admin', icon: iconUsers, anyPerms: ['system.admin', 'admin.manage_users', 'admin.manage_permissions'] },
        { title: 'Projects', path: '/admin/projects', icon: iconProjects, anyPerms: ['view-projects', 'project.view_global', 'project.view_assigned'] }
      ];

      const userPerms = authStore.permissions || [];
      const visibleAdminItems = adminItems.filter(item => {
        if (item.perm) return userPerms.includes(item.perm);
        if (item.anyPerms) return item.anyPerms.some(p => userPerms.includes(p));
        return true;
      });

      sidebarNav.innerHTML = `
        <div class="sidebar-section-title" style="padding: 0.75rem 1.25rem 0.25rem; font-size: 0.7rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">
          Administration
        </div>
        <ul>
          ${visibleAdminItems.map(item => `
            <li>
              <a href="${item.path}">
                ${item.icon}
                <span>${item.title}</span>
              </a>
            </li>
          `).join('')}
        </ul>
      `;
    } else {
      const iconsMap = {
        IconAdmin: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
        IconDashboard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>`,
        IconCoordinator: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
        IconFaculty: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
        IconFinance: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
        IconStudent: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>`,
        IconProjects: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
        IconCommunication: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
        IconGithub: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>`,
        IconCertificates: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>`,
        IconAudit: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
        IconDesign: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`
      };

      const userAllowedModules = authStore.modules || [];
      const userPermissions = authStore.permissions || [];
      const availableModules = modules.filter(m => {
        if (!m.sidebar) return false;
        if (!userAllowedModules.includes(m.name)) return false;
        if (m.allowedRoles && !m.allowedRoles.includes(authStore.role)) return false;
        if (m.requiredAnyPermissions && Array.isArray(m.requiredAnyPermissions)) {
          if (!m.requiredAnyPermissions.some(p => userPermissions.includes(p))) {
            return false;
          }
        }
        return true;
      });

      const navLinksHTML = availableModules.map(mod => {
        const isActive = currentPath.startsWith(mod.path);
        const iconSvg = iconsMap[mod.icon] || iconsMap.IconDashboard;
        return `
          <li>
            <a href="${mod.path}" class="${isActive ? 'active' : ''}">
              ${iconSvg}
              <span>${mod.title}</span>
            </a>
          </li>
        `;
      }).join('');

      sidebarNav.innerHTML = `<ul>${navLinksHTML}</ul>`;
    }
  }

  // Update active css classes on matching sidebar link
  sidebarNav.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href');
    if (href) {
      let isActive = false;
      if (href === '/faculty' || href === '/developer' || href === '/director' || href === '/student' || href === '/' || href === '/dashboard' || href === '/admin') {
        isActive = currentPath === href || currentPath === href + '/';
      } else if (href === '/faculty/profile') {
        isActive = currentPath === '/faculty/profile' || currentPath.startsWith('/faculty/profile/') || currentPath === '/profile' || currentPath.startsWith('/profile/');
      } else {
        isActive = currentPath === href || currentPath.startsWith(href + '/') ||
          (href === '/projects' && (currentPath.startsWith('/projects') || currentPath.startsWith('/admin/projects'))) ||
          (href === '/admin/students' && (currentPath.startsWith('/admin/students') || currentPath.startsWith('/director/students'))) ||
          (href.startsWith('/developer/') && currentPath.startsWith(href.replace('/developer', '/dashboard'))) ||
          (href.startsWith('/director/') && currentPath.startsWith(href.replace('/director', '/dashboard')));
      }
      if (isActive) {
        a.classList.add('active');
      } else {
        a.classList.remove('active');
      }
    }
  });
}

export function updateSidebar(currentPath) {
  const sidebarNav = document.querySelector('.sidebar-nav');
  if (!sidebarNav) return;
  const authStore = useAuthStore();
  populateSidebarNav(sidebarNav, currentPath, authStore);
}


export function updateTopBarAvatar(photoUrl, name) {
  const authStore = useAuthStore();
  const displayName =
    name || authStore.user?.name || authStore.user?.username || 'User';
  const initial = displayName.charAt(0).toUpperCase() || 'U';

  const avatarTargets = document.querySelectorAll(
    '#user-profile-header .avatar, #finance-user-profile-header .avatar, .topbar .avatar, .user-profile .avatar, .user-avatar, .topbar-avatar, #topbar-user-avatar'
  );

  avatarTargets.forEach(avatarEl => {
    if (photoUrl) {
      avatarEl.style.padding = '0';
      avatarEl.style.overflow = 'hidden';

      // Update an existing image when the target itself is an img element.
      if (avatarEl.tagName === 'IMG') {
        avatarEl.src = photoUrl;
        avatarEl.alt = displayName;
      } else {
        avatarEl.innerHTML = `<img src="${photoUrl}" alt="${displayName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;" />`;
      }
    } else {
      avatarEl.style.padding = '';
      avatarEl.style.overflow = '';

      if (avatarEl.tagName === 'IMG') {
        avatarEl.removeAttribute('src');
        avatarEl.alt = displayName;
      } else {
        avatarEl.textContent = initial;
      }
    }
  });

  const popoverAvatarTargets = document.querySelectorAll(
    '#popover-avatar, #finance-popover-avatar, .profile-popover-avatar'
  );

  popoverAvatarTargets.forEach(popAvatarEl => {
    if (photoUrl) {
      popAvatarEl.style.padding = '0';
      popAvatarEl.style.overflow = 'hidden';
      popAvatarEl.innerHTML = `<img src="${photoUrl}" alt="${displayName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;" />`;
    } else {
      popAvatarEl.style.padding = '';
      popAvatarEl.style.overflow = '';
      popAvatarEl.textContent = initial;
    }
  });
}

export async function DashboardLayout(contentChild, route, router) {
  const authStore = useAuthStore();
  const currentPath = window.location.pathname;

  const wrapper = document.createElement('div');
  const isStudentPortal = currentPath.startsWith('/student');
  wrapper.className = `dashboard-layout animate-fade-in${isStudentPortal ? ' student-layout' : ''}`;

  const user = authStore.user;
  const isStudent = authStore.role === 'student';
  const isFacultyUser = authStore.role === 'faculty' || currentPath.startsWith('/faculty');
  const studentIdentifier = user ? (user.id || user.email || user.username || user.name) : null;
  const studentPhoto = (isStudent && studentIdentifier)
    ? (localStorage.getItem(`student_profile_photo_${String(studentIdentifier).toLowerCase().trim()}`) || user?.avatar || null)
    : (user?.avatar || null);
  const displayName = user?.name || user?.username || 'User';
  const roleName = authStore.role ? authStore.role.replace('_', ' ').toUpperCase() : 'MEMBER';
  const initial = displayName.charAt(0).toUpperCase();
  // Other roles use the server-side profile photo (users.profile_photo_path):
  // render the cached URL immediately, then refresh it from the API below.
  const headerPhoto = isStudent ? studentPhoto : (user?.profile_photo_url || null);

  const designation = user?.designation || (isStudent ? 'Nova' : roleName);
  const email = user?.email || 'student@rajagiri.edu';
  const department = user?.department || 'Computer Applications';
  const course = user?.course || (isStudent ? 'MCA' : null);
  const semester = user?.semester_text || (user?.semester ? `${user.semester}th Semester` : (isStudent ? '2nd Year / 3rd Semester' : null));

  const isDeveloperUser = authStore.role === 'developer' || currentPath.startsWith('/developer') || (route.name && route.name.includes('developer'));
  const isDirectorUser = authStore.role === 'director' || currentPath.startsWith('/director') || (route.name && route.name.includes('director'));
  const isDesignUser = authStore.role === 'design_head' || currentPath.startsWith('/design') || (route.name && route.name.includes('design'));
  const isProfilePage = currentPath.startsWith('/profile') || route.name === 'user-profile';

  let topbarTitle = 'RLABZ ERP';
  if (isDeveloperUser) {
    topbarTitle = 'DEVELOPER DASHBOARD';
  } else if (isDirectorUser) {
    topbarTitle = 'DIRECTOR DASHBOARD';
  } else if (isDesignUser && !isProfilePage) {
    topbarTitle = 'DESIGN STUDIO & ASSETS';
  } else if (isProfilePage) {
    topbarTitle = 'MY PROFILE & SECURITY';
  } else {
    topbarTitle = route.title || (route.name === 'faculty-sprints' ? 'PROJECT MODULES & TASKS' : (route.name ? route.name.toUpperCase().replace(/-/g, ' ') : 'RLABZ ERP'));
  }

  wrapper.innerHTML = `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo" id="sidebar-logo-link" role="link" tabindex="0" title="Go to dashboard" style="cursor: pointer;">
          <img src="/assets/Rlabz_Logo_dark.png" alt="RLabZ ERP" class="sidebar-watermark" style="height: 84px; width: auto;" />
        </div>
      </div>
      <nav class="sidebar-nav">
      </nav>
    </aside>

    <div class="main-wrapper">
      <header class="topbar">
        <div class="topbar-title">${topbarTitle}</div>
        <div style="display:flex; align-items:center; gap:0.85rem;">
          <div class="user-profile" id="user-profile-header">
          <div class="avatar" style="${headerPhoto ? 'padding: 0; overflow: hidden;' : ''}">
            ${headerPhoto ? `<img src="${headerPhoto}" alt="${displayName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;" />` : initial}
          </div>
          <div class="user-details">
            <span class="user-name">${displayName}</span>
            <span class="user-role" style="color: var(--primary-accent); font-weight: 600;">${roleName}</span>
          </div>
          
          <!-- Floating Profile Popover -->
          <div class="profile-popover" id="profile-popover">
            <div class="profile-popover-header">
              <div class="profile-popover-avatar" id="popover-avatar" style="${headerPhoto ? 'padding: 0; overflow: hidden;' : ''}">
                ${headerPhoto ? `<img src="${headerPhoto}" alt="${displayName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;" />` : initial}
              </div>
              <div class="profile-popover-meta">
                <span class="profile-popover-name" id="popover-name">${displayName}</span>
                <span class="profile-popover-role" id="popover-role">${roleName}</span>
              </div>
            </div>
            <div class="profile-popover-body">
              <div class="profile-popover-row">
                <span class="profile-popover-label">Designation:</span>
                <span class="profile-popover-value" id="popover-designation" style="font-weight: 700;">${designation}</span>
              </div>
              <div class="profile-popover-row">
                <span class="profile-popover-label">Email:</span>
                <span class="profile-popover-value" id="popover-email">${email}</span>
              </div>
              <div class="profile-popover-row">
                <span class="profile-popover-label">Department:</span>
                <span class="profile-popover-value" id="popover-department">${department}</span>
              </div>
              ${course ? `
              <div class="profile-popover-row">
                <span class="profile-popover-label">Course:</span>
                <span class="profile-popover-value" id="popover-course">${course}</span>
              </div>` : ''}
              ${semester ? `
              <div class="profile-popover-row">
                <span class="profile-popover-label">Semester:</span>
                <span class="profile-popover-value" id="popover-semester">${semester}</span>
              </div>` : ''}
            </div>
            <div class="profile-popover-footer" style="padding: 10px 14px; background: #f8fafc; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end;">
              <a href="/profile" id="popover-profile-link" style="font-size: 0.8rem; font-weight: 600; color: #059669; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                Profile Settings & Change Password &rarr;
              </a>
            </div>
          </div>
        </div>
        
        <button id="logout-btn" class="logout-icon-btn" title="Logout">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
        </div>
      </header>

      <main class="content-outlet${isStudentPortal ? ' student-content-outlet' : ''}" id="layout-outlet"></main>
    </div>

    <!-- Native Right Floating Bell & Slide-Out Drawer (Exact UI as Finance Dashboard) -->
    <button class="fin-bell-trigger" id="fin-bell-btn" title="View Action Items & Notifications">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
      <span class="fin-bell-badge" id="fin-bell-badge" style="display: none;"></span>
    </button>

    <!-- Drawer Backdrop -->
    <div class="fin-drawer-backdrop" id="fin-drawer-backdrop"></div>

    <!-- Notification Drawer -->
    <div class="fin-notification-drawer" id="fin-notification-drawer">
      <div class="fin-drawer-header">
        <div class="fin-drawer-title-wrap">
          <span class="fin-drawer-title">Action Items &amp; Notifications</span>
          <span class="fin-drawer-count" id="fin-drawer-count" style="display: none;">0</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <a href="/student/notifications" class="fin-btn outline sm" id="btn-drawer-top-view-all" style="font-size: 0.75rem; padding: 4px 10px; font-weight: 700; text-decoration: none; border-radius: 6px;">
            View All ↗
          </a>
          <button class="fin-drawer-close" id="fin-drawer-close" title="Close Drawer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      <div class="fin-drawer-body" id="fin-drawer-body">
        <div style="text-align:center; padding: 2rem; color: var(--text-muted); font-size: 0.9rem;">Loading notifications...</div>
      </div>
    </div>
  `;

  // Populate sidebar navigation
  const sidebarNav = wrapper.querySelector('.sidebar-nav');
  populateSidebarNav(sidebarNav, currentPath, authStore);

  // Native Notification Drawer Controls (Matching Finance Dashboard)
  const bellBtn = wrapper.querySelector('#fin-bell-btn');
  const drawer = wrapper.querySelector('#fin-notification-drawer');
  const backdrop = wrapper.querySelector('#fin-drawer-backdrop');
  const closeBtn = wrapper.querySelector('#fin-drawer-close');
  const drawerBody = wrapper.querySelector('#fin-drawer-body');
  const bellBadge = wrapper.querySelector('#fin-bell-badge');
  const drawerCount = wrapper.querySelector('#fin-drawer-count');

  const openDrawer = () => {
    if (drawer) drawer.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
    if (bellBtn) bellBtn.classList.add('drawer-open');
  };

  const closeDrawer = () => {
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    if (bellBtn) bellBtn.classList.remove('drawer-open');
  };

  if (bellBtn) bellBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);

  function updateBadge(notifications) {
    const unreadCount = notifications.filter((n) => !n.is_read).length;
    if (bellBadge && drawerCount) {
      if (unreadCount > 0) {
        const text = unreadCount > 99 ? '99+' : String(unreadCount);
        bellBadge.textContent = text;
        bellBadge.style.display = 'block';
        drawerCount.textContent = `${text} Unread`;
        drawerCount.style.display = 'inline-block';
        if (bellBtn) bellBtn.classList.add('fin-bell-shake');
      } else {
        bellBadge.style.display = 'none';
        if (notifications.length > 0) {
          drawerCount.textContent = `${notifications.length} Total`;
          drawerCount.style.display = 'inline-block';
        } else {
          drawerCount.style.display = 'none';
        }
        if (bellBtn) bellBtn.classList.remove('fin-bell-shake');
      }
    }
  }

  function bindNotificationItems(notifications) {
    if (!drawerBody) return;
    drawerBody.querySelectorAll('.fin-action-card[data-unread="1"]').forEach((item) => {
      item.addEventListener('click', async () => {
        const id = item.dataset.id;
        const token = localStorage.getItem('token');
        try {
          await fetch(`${API_BASE}/notifications/${id}/read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', Authorization: `Bearer ${token}` },
          });
        } catch (e) {
          // ignore
        }
        const notification = notifications.find((n) => String(n.id) === String(id));
        if (notification) notification.is_read = true;
        drawerBody.innerHTML = renderNotificationList(notifications);
        bindNotificationItems(notifications);
        updateBadge(notifications);
      });
    });
  }

  if (bellBtn && drawer) {
    fetchNotifications().then((notifications) => {
      updateBadge(notifications);
      if (drawerBody) {
        drawerBody.innerHTML = renderNotificationList(notifications);
        bindNotificationItems(notifications);
      }
    });
  }

  // Attach Content Child
  const outlet = wrapper.querySelector('#layout-outlet');
  if (contentChild) {
    if (typeof contentChild === 'function') {
      const childEl = await contentChild(route, router);
      outlet.appendChild(childEl);
    } else {
      outlet.appendChild(contentChild);
    }
  }

  // Bind Logout
  const logoutBtn = wrapper.querySelector('#logout-btn');
  logoutBtn?.addEventListener('click', () => {
    authStore.logout();
    router.push('/auth/login');
  });

  // Bind sidebar logo click â€” goes to the current role's own dashboard
  // (same roleâ†’route mapping AuthController::respondWithToken() already
  // sends down as `user.defaultRoute`), never a generic/other-role page.
  const ROLE_HOME_ROUTES = {
    director: '/dashboard',
    coordinator: '/coordinator',
    finance: '/finance',
    faculty: '/faculty',
    student: '/student',
  };
  const sidebarLogoLink = wrapper.querySelector('#sidebar-logo-link');
  const goToDashboard = () => {
    const target = authStore.user?.defaultRoute || ROLE_HOME_ROUTES[authStore.role] || '/';
    router.push(target);
  };
  sidebarLogoLink?.addEventListener('click', goToDashboard);
  sidebarLogoLink?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goToDashboard();
    }
  });

  // Bind User Profile Header Click
  const userProfileHeader = wrapper.querySelector('#user-profile-header');
  const profilePopover = wrapper.querySelector('#profile-popover');
  if (userProfileHeader && profilePopover) {
    userProfileHeader.style.cursor = 'pointer';
    userProfileHeader.title = 'View Profile & Settings';

    userProfileHeader.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = window.getComputedStyle(profilePopover).display === 'block';
      profilePopover.style.display = isVisible ? 'none' : 'block';
    });

    // Close popover when clicking anywhere else
    document.addEventListener('click', () => {
      profilePopover.style.display = 'none';
    });

    // Prevent popover inside click from closing it
    profilePopover.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    const popoverProfileLink = profilePopover.querySelector('#popover-profile-link');
    if (popoverProfileLink) {
      popoverProfileLink.addEventListener('click', (e) => {
        e.preventDefault();
        profilePopover.style.display = 'none';
        const profileRoute = ROLE_PROFILE_ROUTES[authStore.role] || '/profile';
        if (router && typeof router.push === 'function') {
          router.push(profileRoute);
        } else {
          window.location.href = profileRoute;
        }
      });
    }

    // Sync live profile from database
    const token = localStorage.getItem('token');
    if (token) {
      const endpoint = authStore.role === 'student' ? `${API_BASE}/student/profile` : `${API_BASE}/auth/profile`;
      fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then(r => r.ok ? r.json() : null)
      .then(res => {
        if (!res) return;
        const p = res.user || res;
        const desEl = wrapper.querySelector('#popover-designation');
        const emailEl = wrapper.querySelector('#popover-email');
        const deptEl = wrapper.querySelector('#popover-department');
        const courseEl = wrapper.querySelector('#popover-course');
        const semEl = wrapper.querySelector('#popover-semester');
        const nameEl = wrapper.querySelector('#popover-name');
        
        if (desEl && (p.designation || p.role)) desEl.textContent = p.designation || (p.role ? p.role.replace('_', ' ').toUpperCase() : 'MEMBER');
        if (emailEl && p.email) emailEl.textContent = p.email;
        if (deptEl && p.department) deptEl.textContent = p.department;
        if (courseEl && p.course) courseEl.textContent = p.course;
        if (semEl && (p.semester_text || p.semester)) {
          semEl.textContent = p.semester_text || `${p.semester}th Semester`;
        }
        if (nameEl && p.name) nameEl.textContent = p.name;

        if (user) {
          user.name = p.name || user.name;
          user.department = p.department || user.department;
          if (p.designation) user.designation = p.designation;
          localStorage.setItem('user', JSON.stringify(user));
        }

        // Non-student roles: the header photo comes only from profile_photo_path
        // (returned by /auth/profile). Students keep their existing photo source.
        if (!isStudent && 'profile_photo_path' in p) {
          const photoUrl = profilePhotoUrl(p.profile_photo_path);
          rememberProfilePhoto(photoUrl);
          applyHeaderAvatar(wrapper, photoUrl, p.name || displayName);
        }
      })
      .catch(() => {});
    }
  }

  return wrapper;
}

