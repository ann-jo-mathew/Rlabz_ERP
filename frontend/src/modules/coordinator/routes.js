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
        component: () => import('@/modules/project/views/ProjectDashboard.js')
      },
      {
        path: 'projects/create',
        name: 'coordinator-projects-create',
        component: () => import('@/modules/project/views/ProjectCreate.js')
      },
      {
        path: 'projects/:id',
        name: 'coordinator-projects-details',
        component: () => import('@/modules/project/views/ProjectDetails.js')
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
        path: 'reports',
        name: 'coordinator-reports',
        component: () => import('./views/CoordinatorReports.js')
      }
    ]
  }
];

export default routes;