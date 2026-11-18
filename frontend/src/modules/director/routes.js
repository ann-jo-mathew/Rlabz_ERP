import { DirectorLayout } from './DirectorLayout.js';

const directorChildren = [
  {
    path: '',
    name: 'director-dashboard-home',
    title: 'DIRECTOR DASHBOARD',
    meta: { requiredAnyPermissions: ['view-dashboard'] },
    component: () => import('./views/DirectorHome.js')
  },
  {
    path: 'projects',
    name: 'director-dashboard-projects',
    title: 'DIRECTOR DASHBOARD',
    meta: { requiredAnyPermissions: ['view-projects', 'project.view_global', 'project.view_assigned'] },
    component: () => import('./views/DirectorProjects.js')
  },
  {
    path: 'projects/create',
    name: 'director-dashboard-projects-create',
    title: 'DIRECTOR DASHBOARD',
    meta: { requiredAnyPermissions: ['project.create'] },
    component: () => import('@/modules/project/views/ProjectCreate.js')
  },
  {
    path: 'projects/:id',
    name: 'director-dashboard-projects-details',
    title: 'DIRECTOR DASHBOARD',
    meta: { requiredAnyPermissions: ['view-projects', 'project.view_global', 'project.view_assigned'] },
    component: () => import('@/modules/project/views/ProjectDetails.js')
  },
  {
    path: 'students',
    name: 'director-dashboard-students',
    title: 'DIRECTOR DASHBOARD',
    meta: { requiredAnyPermissions: ['view-student'] },
    component: () => import('./views/DirectorStudents.js')
  },
  {
    path: 'students/:id',
    name: 'director-dashboard-student-detail',
    title: 'DIRECTOR DASHBOARD',
    meta: { requiredAnyPermissions: ['view-student'] },
    component: () => import('./views/DirectorStudentDetail.js')
  },
  {
    path: 'clients',
    name: 'director-dashboard-clients',
    title: 'DIRECTOR DASHBOARD',
    meta: { requiredAnyPermissions: ['project.client_requirements.view', 'project.client_requirements.create'] },
    component: () => import('./views/DirectorClients.js')
  },
  {
    path: 'finance',
    name: 'director-dashboard-finance',
    title: 'DIRECTOR DASHBOARD',
    meta: { requiredAnyPermissions: ['view-finance', 'view-finance-readonly'] },
    component: () => import('./views/DirectorFinance.js')
  },
  {
    path: 'audit',
    name: 'director-dashboard-audit',
    title: 'DIRECTOR DASHBOARD',
    meta: { requiredAnyPermissions: ['view-audit-notifications', 'admin.audit_logs'] },
    component: () => import('./views/DirectorAuditLog.js')
  },
  {
    path: 'github',
    name: 'director-dashboard-github',
    title: 'DIRECTOR DASHBOARD',
    meta: { requiredAnyPermissions: ['view-github'] },
    component: () => import('@/modules/github/views/GithubHome.js')
  }
];

const routes = [
  {
    path: '/director',
    name: 'director-dashboard',
    title: 'DIRECTOR DASHBOARD',
    component: DirectorLayout,
    children: directorChildren
  }
];

export default routes;
