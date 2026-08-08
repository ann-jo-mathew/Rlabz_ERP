import { useAuthStore } from '../stores/auth.js';

export function authGuard(to, from, next) {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;

  // 1. Check if route requires auth
  if (to.meta?.requiresAuth && !isAuthenticated) {
    return next({ name: 'login' });
  }

  // 2. Prevent authenticated users from visiting login page
  if (to.name === 'login' && isAuthenticated) {
    return next({ name: 'dashboard' });
  }

  // 3. Check for specific module or permission access
  if (to.meta?.requiredPermissions && isAuthenticated) {
    const hasPermission = to.meta.requiredPermissions.every(p =>
      authStore.permissions.includes(p)
    );
    if (!hasPermission) {
      return next({ name: 'login' });
    }
  }

  next();
}
