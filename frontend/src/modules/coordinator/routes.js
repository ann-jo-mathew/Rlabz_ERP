import { CoordinatorLayout } from './CoordinatorLayout.js';

const routes = [
  {
    path: '/coordinator',
    component: CoordinatorLayout,
    children: [
      {
        path: '',
        name: 'coordinator-home',
        component: () => import('./views/CoordinatorHome.js')
      },
      {
        path: 'projects',
        name: 'coordinator-projects',
        component: () => import('./views/CoordinatorProjects.js')
      },
      {
        path: 'projects/:id',
        name: 'coordinator-project-detail',
        component: () => import('./views/CoordinatorProjectDetail.js')
      },
      {
        path: 'students',
        name: 'coordinator-students',
        component: () => import('./views/CoordinatorStudents.js')
      },
      {
        path: 'meetings',
        name: 'coordinator-meetings',
        component: () => import('./views/CoordinatorMeetings.js')
      },
      {
        path: 'certificates',
        name: 'coordinator-certificates',
        component: () => import('../certificates/views/CertificatesHome.js')
      },
      {
        path: 'reports',
        name: 'coordinator-reports',
        component: () => import('./views/CoordinatorReports.js')
      },
      {
        path: 'finance',
        name: 'coordinator-finance',
        component: () => import('./views/CoordinatorFinances.js')
      }
    ]
  }
];

export default routes;