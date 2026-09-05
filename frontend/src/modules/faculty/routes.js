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
        path: 'profile',
        name: 'faculty-profile',
        component: () => import('./views/FacultyProfile.js')
      },
      {
        path: 'projects',
        name: 'faculty-projects',
        component: () => import('@/modules/project/views/ProjectDashboard.js')
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
        name: 'faculty-sprints',
        component: () => import('./views/FacultySprints.js')
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