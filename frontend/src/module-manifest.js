/**
 * RLABZ MODULE MANIFEST
 * 
 * This is the SINGLE shared contract point for the frontend.
 * Other team members will populate their module folders inside src/modules/<name>/
 * and register their loadRoutes functions here.
 */

export const modules = [
  {
    name: 'auth',
    path: '/auth',
    loadRoutes: () => import('@/modules/auth/routes.js'),
    sidebar: false,
  },
  {
    name: 'dashboard',
    path: '/dashboard',
    sidebar: true,
    title: 'Director Dashboard',
    icon: 'IconDashboard',
  },
  {
    name: 'coordinator',
    path: '/coordinator',
    sidebar: true,
    title: 'Co-ordinator Workspace',
    icon: 'IconCoordinator',
  },
  {
    name: 'faculty',
    path: '/faculty',
    sidebar: true,
    title: 'Faculty Portal',
    icon: 'IconFaculty',
  },
  {
    name: 'finance',
    path: '/finance',
    loadRoutes: () => import('@/modules/finance/routes.js'),
    sidebar: true,
    title: 'Finance & Payroll',
    icon: 'IconFinance',
  },
  {
    name: 'student',
    path: '/student',
    loadRoutes: () => import('@/modules/student/routes.js'),
    sidebar: true,
    title: 'Student Portal & Records',
    icon: 'IconStudent',
  },
  {
    name: 'project-client',
    path: '/projects',
    sidebar: true,
    title: 'Projects & Clients',
    icon: 'IconProjects',
  },
  {
    name: 'communication',
    path: '/communication',
    sidebar: true,
    title: 'Communication',
    icon: 'IconCommunication',
  },
  {
    name: 'github',
    path: '/github',
    sidebar: true,
    title: 'GitHub Integration',
    icon: 'IconGithub',
  },
  {
    name: 'certificates',
    path: '/certificates',
    sidebar: true,
    title: 'Certificates & Reporting',
    icon: 'IconCertificates',
  },
  {
    name: 'audit-notifications',
    path: '/audit-notifications',
    sidebar: true,
    title: 'Audit Log & Notifications',
    icon: 'IconAudit',
  }
];
