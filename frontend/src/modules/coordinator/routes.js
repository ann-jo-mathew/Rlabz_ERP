import { CoordinatorLayout } from './CoordinatorLayout.js';

const routes = [
  {
    path: '/coordinator',
    component: CoordinatorLayout,
    children: [
      {
        path: '',
        name: 'coordinator-home',
        meta: { requiredAnyPermissions: ['view-coordinator'] },
        component: () => import('./views/CoordinatorHome.js')
      },
      {
        path: 'projects',
        name: 'coordinator-projects',
        meta: { requiredAnyPermissions: ['view-projects', 'project.view_global'] },
        component: () => import('./views/CoordinatorProjects.js')
      },
      {
        path: 'projects/create',
        name: 'coordinator-projects-create',
        meta: { requiredAnyPermissions: ['project.create'] },
        component: () => import('@/modules/project/views/ProjectCreate.js')
      },
      {
        path: 'projects/:id',
        name: 'coordinator-projects-details',
        meta: { requiredAnyPermissions: ['view-projects', 'project.view_global'] },
        component: () => import('./views/CoordinatorProjectDetail.js')
      },
      {
        path: 'students',
        name: 'coordinator-students',
        meta: { requiredAnyPermissions: ['view-student'] },
        component: () => import('./views/CoordinatorStudents.js')
      },
      {
        path: 'meetings',
        name: 'coordinator-meetings',
        meta: { requiredAnyPermissions: ['view-communication'] },
        component: () => import('./views/CoordinatorMeetings.js')
      },
      {
        path: 'certificates',
        name: 'coordinator-certificates',
        meta: { requiredAnyPermissions: ['view-certificates', 'view-certificates-read'] },
        component: () => import('../certificates/views/CertificatesHome.js')
      },
      {
        path: 'reports',
        name: 'coordinator-reports',
        meta: { requiredAnyPermissions: ['view-coordinator'] },
        component: () => import('./views/CoordinatorReports.js')
      },
      {
        path: 'finance',
        name: 'coordinator-finance',
        meta: { requiredAnyPermissions: ['view-finance', 'view-finance-readonly'] },
        component: () => import('./views/CoordinatorFinances.js')
      },
      {
        path: 'notifications',
        name: 'coordinator-notifications',
        meta: { requiredAnyPermissions: ['view-coordinator'] },
        component: () => import('./views/CoordinatorNotifications.js').then(m => m.CoordinatorNotifications)
      },
      {
        path: 'profile',
        name: 'coordinator-profile',
        component: () => import('./views/CoordinatorProfile.js')
      }
    ]
  }
];

export default routes;