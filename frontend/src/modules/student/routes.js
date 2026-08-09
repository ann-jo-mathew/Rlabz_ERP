import { DashboardLayout } from '@/core/layouts/DashboardLayout.js';

const routes = [
  {
    path: '/student',
    component: DashboardLayout,
    children: [
      {
        path: '',
        name: 'student-dashboard',
        component: () => import('./views/StudentDashboard.js')
      },
      {
        path: 'projects',
        name: 'student-projects',
        component: () => import('./views/StudentProjects.js')
      },
      {
        path: 'proposals',
        name: 'student-proposals',
        component: () => import('./views/StudentProposals.js')
      },
      {
        path: 'reports',
        name: 'student-reports',
        component: () => import('./views/StudentReports.js')
      },
      {
        path: 'meetings',
        name: 'student-meetings',
        component: () => import('./views/StudentMeetings.js')
      },
      {
        path: 'github',
        name: 'student-github',
        component: () => import('./views/StudentGithub.js')
      },
      {
        path: 'chat',
        name: 'student-chat',
        component: () => import('./views/StudentChat.js')
      }
    ]
  }
];

export default routes;
