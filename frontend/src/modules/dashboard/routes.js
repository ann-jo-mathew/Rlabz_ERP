import { DirectorLayout } from './DirectorLayout.js';

const routes = [
  {
    path: '/dashboard',
    component: DirectorLayout,
    children: [
      {
        path: '',
        name: 'director-dashboard-home',
        component: () => import('./views/DirectorHome.js')
      },
      {
        path: 'projects',
        name: 'director-dashboard-projects',
        component: () => import('./views/DirectorProjects.js')
      },
      {
        path: 'students',
        name: 'director-dashboard-students',
        component: () => import('./views/DirectorStudents.js')
      },
      {
        path: 'clients',
        name: 'director-dashboard-clients',
        component: () => import('./views/DirectorClients.js')
      },
      {
        path: 'finance',
        name: 'director-dashboard-finance',
        component: () => import('./views/DirectorFinance.js')
      },
      {
        path: 'audit',
        name: 'director-dashboard-audit',
        component: () => import('./views/DirectorAuditLog.js')
      },
      {
        path: 'github',
        name: 'director-dashboard-github',
        component: () => import('@/modules/github/views/GithubHome.js')
      }
    ]
  }
];

export default routes;
