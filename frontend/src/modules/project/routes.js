import { DashboardLayout } from '@/core/layouts/DashboardLayout.js';
import './project.css';
const routes = [
  {
    path: '/projects',
    component: DashboardLayout,
    children: [
      {
        path: '',
        name: 'project-dashboard',
        component: () => import('./views/ProjectDashboard.js')
      },
      {
        path: 'create',
        name: 'project-create',
        component: () => import('./views/ProjectCreate.js')
      },
      {
        path: ':id',
        name: 'project-details',
        component: () => import('./views/ProjectDetails.js')
      }
    ]
  }
];

export default routes;
