import { DashboardLayout } from '@/core/layouts/DashboardLayout.js';

const routes = [
  {
    path: '/projects',
    component: DashboardLayout,
    children: [
      {
        path: '',
        name: 'projects-home',
        component: () => import('./views/ProjectsHome.js')
      }
    ]
  }
];

export default routes;
