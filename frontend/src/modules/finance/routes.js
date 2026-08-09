import { FinanceLayout } from './layouts/FinanceLayout.js';

const routes = [
  {
    path: '/finance',
    component: FinanceLayout,
    children: [
      {
        path: '',
        name: 'finance-dashboard',
        component: () => import('./views/FinanceDashboard.js')
      },
      {
        path: 'projects',
        name: 'finance-projects-overview',
        component: () => import('./views/ProjectFinance.js')
      },
      {
        path: 'projects/:id',
        name: 'finance-project',
        component: () => import('./views/ProjectFinance.js')
      },
      {
        path: 'student-payroll',
        name: 'finance-student-payroll',
        component: () => import('./views/StudentPayroll.js')
      },
      {
        path: 'faculty-costs',
        name: 'finance-faculty-costs',
        component: () => import('./views/FacultyCosts.js')
      },
      {
        path: 'transactions',
        name: 'finance-transactions',
        component: () => import('./views/Transactions.js')
      },
      {
        path: 'invoices',
        name: 'finance-invoices',
        component: () => import('./views/InvoicesBills.js')
      },
      {
        path: 'reports',
        name: 'finance-reports',
        component: () => import('./views/FinancialReports.js')
      }
    ]
  }
];

export default routes;
