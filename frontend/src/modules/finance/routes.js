import { DashboardLayout } from '@/core/layouts/DashboardLayout.js';

const routes = [
  {
    path: '/finance',
    component: DashboardLayout,
    children: [
      {
        path: '',
        name: 'finance-dashboard',
        component: () => import('./views/FinanceDashboard.js')
      },
      {
        path: 'projects/:id',
        name: 'finance-project',
        component: () => import('./views/ProjectFinance.js')
      },
      {
        path: 'student-payments',
        name: 'finance-student-payments',
        component: () => import('./views/StudentPayroll.js')
      }
    ]
  }
];

export default routes;
