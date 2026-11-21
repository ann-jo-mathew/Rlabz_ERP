import { FacultyLayout } from './FacultyLayout.js';

const routes = [
  {
    path: '/faculty',
    component: FacultyLayout,
    children: [
      {
        path: '',
        name: 'faculty-home',
        component: () => import('./views/FacultyHome.js')
      },
      {
        path: 'projects',
        name: 'faculty-projects',
        component: () => import('@/modules/project/views/ProjectDashboard.js')
      },
      {
        path: 'chat',
        name: 'faculty-chat',
        title: 'PROJECT CHATS',
        component: () => import('./views/FacultyChat.js')
      },
      {
        path: 'projects/:id',
        name: 'faculty-projects-details',
        component: () => import('@/modules/project/views/ProjectDetails.js')
      },
      {
        path: 'students',
        name: 'faculty-students',
        component: () => import('./views/FacultyStudents.js')
      },
      {
        path: 'meetings',
        name: 'faculty-meetings',
        component: () => import('./views/FacultyMeetings.js')
      },
      {
        path: 'sprints',
        name: 'project-modules-and-tasks',
        title: 'PROJECT MODULES & TASKS',
        meta: { requiredAnyPermissions: ['project.module.create', 'project.task.create'] },
        component: () => import('./views/FacultySprints.js')
      },
      {
        path: 'verify-tasks',
        name: 'faculty-verify-tasks',
        meta: { requiredAnyPermissions: ['project.submission.review'] },
        component: () => import('./views/FacultyVerifyTasks.js')
      },
      {
        path: 'verify-task',
        name: 'faculty-verify-task',
        meta: { requiredAnyPermissions: ['project.submission.review'] },
        component: () => import('./views/FacultyVerifyTasks.js')
      },
      {
        path: 'reports',
        name: 'faculty-reports',
        component: () => import('./views/FacultyReports.js')
      },
      {
        path: 'notifications',
        name: 'faculty-notifications',
        component: () => import('./views/FacultyNotifications.js')
      },
    ]
  }
];

export default routes;