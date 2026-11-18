import { useAuthStore } from '@/core/stores/auth.js';

export async function DashboardDispatchLayout(contentChild, route, router) {
  const authStore = useAuthStore();
  if (authStore.role === 'developer') {
    const { DeveloperLayout } = await import('@/modules/developer/DeveloperLayout.js');
    return DeveloperLayout(contentChild, route, router);
  } else {
    const { DirectorLayout } = await import('@/modules/director/DirectorLayout.js');
    return DirectorLayout(contentChild, route, router);
  }
}

const routes = [
  {
    path: '/dashboard',
    component: DashboardDispatchLayout,
    children: [
      {
        path: '',
        name: 'dashboard-home',
        meta: { requiredAnyPermissions: ['view-dashboard'] },
        component: async () => {
          const authStore = useAuthStore();
          return authStore.role === 'developer'
            ? import('@/modules/developer/views/DeveloperHome.js')
            : import('@/modules/director/views/DirectorHome.js');
        }
      },
      {
        path: 'projects',
        name: 'dashboard-projects',
        meta: { requiredAnyPermissions: ['view-projects', 'project.view_global', 'project.view_assigned'] },
        component: async () => {
          const authStore = useAuthStore();
          return authStore.role === 'developer'
            ? import('@/modules/developer/views/DeveloperProjects.js')
            : import('@/modules/director/views/DirectorProjects.js');
        }
      },
      {
        path: 'projects/create',
        name: 'dashboard-projects-create',
        meta: { requiredAnyPermissions: ['project.create'] },
        component: () => import('@/modules/project/views/ProjectCreate.js')
      },
      {
        path: 'projects/:id',
        name: 'dashboard-projects-details',
        meta: { requiredAnyPermissions: ['view-projects', 'project.view_global', 'project.view_assigned'] },
        component: () => import('@/modules/project/views/ProjectDetails.js')
      },
      {
        path: 'students',
        name: 'dashboard-students',
        meta: { requiredAnyPermissions: ['view-student'] },
        component: async () => {
          const authStore = useAuthStore();
          return authStore.role === 'developer'
            ? import('@/modules/developer/views/DeveloperStudents.js')
            : import('@/modules/director/views/DirectorStudents.js');
        }
      },
      {
        path: 'students/:id',
        name: 'dashboard-student-detail',
        meta: { requiredAnyPermissions: ['view-student'] },
        component: async () => {
          const authStore = useAuthStore();
          return authStore.role === 'developer'
            ? import('@/modules/developer/views/DeveloperStudentDetail.js')
            : import('@/modules/director/views/DirectorStudentDetail.js');
        }
      },
      {
        path: 'clients',
        name: 'dashboard-clients',
        meta: { requiredAnyPermissions: ['project.client_requirements.view', 'project.client_requirements.create'] },
        component: async () => {
          const authStore = useAuthStore();
          return authStore.role === 'developer'
            ? import('@/modules/developer/views/DeveloperClients.js')
            : import('@/modules/director/views/DirectorClients.js');
        }
      },
      {
        path: 'finance',
        name: 'dashboard-finance',
        meta: { requiredAnyPermissions: ['view-finance', 'view-finance-readonly'] },
        component: async () => {
          const authStore = useAuthStore();
          return authStore.role === 'developer'
            ? import('@/modules/developer/views/DeveloperFinance.js')
            : import('@/modules/director/views/DirectorFinance.js');
        }
      },
      {
        path: 'audit',
        name: 'dashboard-audit',
        meta: { requiredAnyPermissions: ['view-audit-notifications', 'admin.audit_logs'] },
        component: async () => {
          const authStore = useAuthStore();
          return authStore.role === 'developer'
            ? import('@/modules/developer/views/DeveloperAuditLog.js')
            : import('@/modules/director/views/DirectorAuditLog.js');
        }
      },
      {
        path: 'github',
        name: 'dashboard-github',
        meta: { requiredAnyPermissions: ['view-github'] },
        component: () => import('@/modules/github/views/GithubHome.js')
      }
    ]
  }
];

export default routes;
