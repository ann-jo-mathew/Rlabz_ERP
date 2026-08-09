import { DashboardLayout } from '@/core/layouts/DashboardLayout.js';

const routes = [
  {
    path: '/github',
    component: DashboardLayout,
    children: [
      {
        path: '',
        name: 'github-home',
        component: () => import('./views/GithubHome.js')
      }
    ]
  }
];

export default routes;