import { useAuthStore } from '../stores/auth.js';
import { modules } from '../../module-manifest.js';

const MODULE_PATH_MAP = {
  dashboard: '/dashboard',
  director: '/director',
  developer: '/developer',
  coordinator: '/coordinator',
  faculty: '/faculty',
  finance: '/finance',
  student: '/student',
  project: '/projects',
  design: '/design',
  github: '/github',
  certificates: '/certificates',
  communication: '/communication',
  'audit-notifications': '/audit-notifications',
  admin: '/admin',
  profile: '/profile'
};

// ─── Fix 4: cache getSafeDefaultRoute per token — avoids re-scanning all
//            modules on every single navigation event ────────────────────────
let _routeCache = { token: null, role: null, route: null };

export function getSafeDefaultRoute(authStore) {
  if (!authStore || !authStore.isAuthenticated) {
    return '/login';
  }

  // Return cached result when nothing about the session has changed
  const token = authStore.token;
  const role  = authStore.role;
  if (_routeCache.token === token && _routeCache.role === role && _routeCache.route) {
    return _routeCache.route;
  }

  // 1. If user object has a defaultRoute, verify user actually has permission for it
  const cand = authStore.user?.defaultRoute;
  const userModules = authStore.modules || [];
  const userRole = authStore.role;

  if (cand && cand !== '/login') {
    // Check if user has access to cand's module
    const targetMod = modules.find(m => m.path === cand || cand.startsWith(m.path));
    if (targetMod) {
      const modName = targetMod.name;
      const userPerms = authStore.permissions || [];
      const hasAnyPerm = !targetMod.requiredAnyPermissions || targetMod.requiredAnyPermissions.some(p => userPerms.includes(p));
      const hasAdminPerm = modName === 'admin' && (userRole === 'admin' || userPerms.includes('admin.manage_users') || userPerms.includes('system.admin'));
      const hasMod = userModules.includes(modName) || hasAnyPerm || hasAdminPerm;
      const hasRole = !targetMod.allowedRoles || targetMod.allowedRoles.includes(userRole);
      
      if (hasMod && (hasRole || hasAnyPerm || hasAdminPerm)) {
        _routeCache = { token, role, route: cand };
        return cand;
      }
    }
  }

  // 2. Find first accessible module in order
  for (const mod of modules) {
    if (mod.name === 'auth') continue;
    if (mod.name === 'profile') continue;

    const userPerms = authStore.permissions || [];
    const hasAnyPerm = !mod.requiredAnyPermissions || mod.requiredAnyPermissions.some(p => userPerms.includes(p));
    const hasAdminPerm = mod.name === 'admin' && (userRole === 'admin' || userPerms.includes('admin.manage_users') || userPerms.includes('system.admin'));
    const hasMod = userModules.includes(mod.name) || hasAnyPerm || hasAdminPerm;
    const hasRole = !mod.allowedRoles || mod.allowedRoles.includes(userRole);

    if (!hasMod) continue;
    if (!hasRole && !hasAnyPerm && !hasAdminPerm) continue;
    if (mod.requiredAnyPermissions && !hasAnyPerm && !hasAdminPerm) continue;

    const result = mod.path || MODULE_PATH_MAP[mod.name] || '/profile';
    _routeCache = { token, role, route: result };
    return result;
  }

  _routeCache = { token, role, route: '/profile' };
  return '/profile';
}

// Invalidate the cache on logout so the next login gets a fresh computation
export function invalidateRouteCache() {
  _routeCache = { token: null, role: null, route: null };
}

export function authGuard(to, from, next) {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;
  const safeDefaultRoute = getSafeDefaultRoute(authStore);

  // Helper redirect function to prevent infinite recursion
  const safeRedirect = (target) => {
    const dest = (target === to.path || target === to.fullPath) ? (safeDefaultRoute !== to.path ? safeDefaultRoute : '/profile') : target;
    if (dest === to.path) {
      // Already at the destination, proceed to prevent recursive loop
      return next();
    }
    return next(dest);
  };

  // 1. Unauthenticated users accessing protected routes -> redirect to /login
  if (to.meta?.requiresAuth && !isAuthenticated) {
    return next('/login');
  }

  // 2. Authenticated users accessing login pages -> redirect to safe default route
  const isAuthRoute = to.path === '/login' || to.path === '/auth' || to.path === '/auth/login' || to.name === 'login';
  if (isAuthRoute && isAuthenticated) {
    return safeRedirect(safeDefaultRoute);
  }

  // Admin explicitly does not have access to director or developer dashboards
  if (authStore.role === 'admin' && (to.path.startsWith('/director') || to.path.startsWith('/developer') || to.meta?.moduleName === 'director' || to.meta?.moduleName === 'developer')) {
    return safeRedirect(safeDefaultRoute);
  }

  // 3. Module permission check for authenticated users
  if (isAuthenticated && to.meta?.moduleName && to.meta.moduleName !== 'auth' && to.meta.moduleName !== 'profile') {
    const allowedModules = authStore.modules;
    
    // Failsafe: if modules array is entirely missing (stale localStorage), force logout
    if (!allowedModules || !Array.isArray(allowedModules)) {
      authStore.logout();
      return next('/login');
    }

    const targetModule = modules.find(m => m.name === to.meta.moduleName);
    const userPermissions = authStore.permissions || [];
    const hasMatchingPerm = targetModule?.requiredAnyPermissions && Array.isArray(targetModule.requiredAnyPermissions) && targetModule.requiredAnyPermissions.some(p => userPermissions.includes(p));
    const hasAdminPerm = to.meta?.moduleName === 'admin' && (authStore.role === 'admin' || userPermissions.includes('admin.manage_users') || userPermissions.includes('system.admin'));

    if (!allowedModules.includes(to.meta.moduleName) && !hasMatchingPerm && !hasAdminPerm) {
      return safeRedirect(safeDefaultRoute);
    }

    // Check module-level role restrictions from manifest
    // If a user has the specific required permission, that overrides role limitations
    const hasRole = !targetModule?.allowedRoles || targetModule.allowedRoles.includes(authStore.role);
    if (!hasRole && !hasMatchingPerm && !hasAdminPerm) {
      return safeRedirect(safeDefaultRoute);
    }

    // Check module-level requiredAnyPermissions from manifest
    if (targetModule && targetModule.requiredAnyPermissions && Array.isArray(targetModule.requiredAnyPermissions)) {
      const hasAny = targetModule.requiredAnyPermissions.some(p => userPermissions.includes(p));
      if (!hasAny && !hasAdminPerm) {
        return safeRedirect(safeDefaultRoute);
      }
    }
  }

  // 4. Specific granular permissions check
  if (to.meta?.requiredPermissions && isAuthenticated) {
    const userPermissions = authStore.permissions || [];
    const hasPermission = to.meta.requiredPermissions.every(p =>
      userPermissions.includes(p)
    );
    if (!hasPermission) {
      return safeRedirect(safeDefaultRoute);
    }
  }

  if (to.meta?.requiredAnyPermissions && isAuthenticated) {
    const userPermissions = authStore.permissions || [];
    const hasAny = to.meta.requiredAnyPermissions.some(p =>
      userPermissions.includes(p)
    );
    if (!hasAny) {
      return safeRedirect(safeDefaultRoute);
    }
  }

  next();
}
