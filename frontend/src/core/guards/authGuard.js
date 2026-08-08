import { useAuthStore } from '../stores/auth.js';

export function authGuard(to, from, next) {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;
  const defaultRoute = authStore.user?.defaultRoute || '/dashboard';

  // 1. Unauthenticated users accessing protected routes -> redirect to /login
  if (to.meta?.requiresAuth && !isAuthenticated) {
    return next('/login');
  }

  // 2. Authenticated users accessing login pages -> redirect to default route
  const isAuthRoute = to.path === '/login' || to.path === '/auth' || to.path === '/auth/login' || to.name === 'login';
  if (isAuthRoute && isAuthenticated) {
    return next(defaultRoute);
  }

  // 3. Module permission check for authenticated users
  if (isAuthenticated && to.meta?.moduleName && to.meta.moduleName !== 'auth') {
    const allowedModules = authStore.modules || [];
    if (!allowedModules.includes(to.meta.moduleName)) {
      return next(defaultRoute);
    }
  }

  // 4. Specific granular permissions check
  if (to.meta?.requiredPermissions && isAuthenticated) {
    const userPermissions = authStore.permissions || [];
    const hasPermission = to.meta.requiredPermissions.every(p =>
      userPermissions.includes(p)
    );
    if (!hasPermission) {
      return next(defaultRoute);
    }
  }

  next();
}
