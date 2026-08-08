/**
 * RLABZ MODULE MANIFEST
 * 
 * This is the SINGLE shared contract point for the frontend.
 * When a teammate creates a new module, they only need to add an entry here.
 */

export const modules = [
  {
    name: 'auth',
    path: '/auth',
    // The load function dynamically imports the module's router
    loadRoutes: () => import('@/modules/auth/routes.js'),
    sidebar: false, // Auth doesn't appear in the sidebar
  },
  {
    name: 'dashboard',
    path: '/dashboard',
    loadRoutes: () => import('@/modules/dashboard/routes.js'),
    sidebar: true,
    title: 'Director Dashboard',
    icon: 'IconDashboard', // Placeholder for an icon component/class
    requiredPermissions: ['view-dashboard'], // Handled by authGuard
  },
  {
    name: 'project-client',
    path: '/projects',
    loadRoutes: () => import('@/modules/project-client/routes.js'),
    sidebar: true,
    title: 'Projects & Clients',
    icon: 'IconProjects',
    requiredPermissions: ['view-projects'], 
  }
  // Teammates will add their modules here:
  // { name: 'coordinator', ... },
];
