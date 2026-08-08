import { modules } from '../../module-manifest.js';
import { authGuard } from '../guards/authGuard.js';

class VanillaRouter {
  constructor() {
    this.routes = [];
    this.guards = [];
    this.currentRoute = null;
    this.container = null;

    // Listen to browser navigation (back/forward)
    window.addEventListener('popstate', () => {
      this.handleRoute(window.location.pathname);
    });

    // Intercept clicks on links
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (link && link.origin === window.location.origin && !link.hasAttribute('target') && !link.hasAttribute('download')) {
        e.preventDefault();
        const url = new URL(link.href);
        this.push(url.pathname);
      }
    });
  }

  addRoute(route) {
    this.routes.push(route);
  }

  beforeEach(guardFn) {
    this.guards.push(guardFn);
  }

  async push(target) {
    let path = '';
    if (typeof target === 'string') {
      path = target;
    } else if (target && target.name) {
      const matched = this.routes.find(r => r.name === target.name);
      if (matched) path = matched.path;
    } else if (target && target.path) {
      path = target.path;
    }

    if (!path) path = '/';

    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    await this.handleRoute(path);
  }

  match(path) {
    // 1. Direct match
    let match = this.routes.find(r => r.path === path);
    if (match) return match;

    // 2. Trailing slash / root redirect handling
    if (path === '/') {
      return this.routes.find(r => r.path === '/dashboard') || this.routes[0];
    }

    return null;
  }

  async handleRoute(path) {
    if (path === '/') {
      return this.push('/dashboard');
    }

    let targetRoute = this.match(path);
    if (!targetRoute) {
      // Fallback redirect to dashboard
      return this.push('/dashboard');
    }

    // Run navigation guards
    for (const guard of this.guards) {
      let redirectTarget = null;
      const next = (to) => {
        if (to) redirectTarget = to;
      };

      const from = this.currentRoute;
      const to = targetRoute;

      await guard(to, from, next);

      if (redirectTarget) {
        return this.push(redirectTarget);
      }
    }

    this.currentRoute = targetRoute;
    await this.renderRoute(targetRoute);
  }

  async renderRoute(route) {
    if (!this.container) {
      this.container = document.getElementById('app');
    }

    if (!this.container) return;

    // Clear element
    this.container.innerHTML = '';

    // Handle view element creation
    let contentElement = null;

    if (route.component) {
      // Check if component is an async import function or a component object/function
      let componentDef = route.component;
      if (typeof componentDef === 'function' && !componentDef.prototype?.render && componentDef.name !== 'DashboardLayout') {
        const module = await componentDef();
        componentDef = module.default || module;
      }

      if (typeof componentDef === 'function') {
        contentElement = await componentDef(route, this);
      } else if (typeof componentDef.render === 'function') {
        contentElement = await componentDef.render(route, this);
      }
    }

    // If route has layout wrapper
    if (route.layout) {
      const layoutElement = await route.layout(contentElement, route, this);
      this.container.appendChild(layoutElement);
    } else if (contentElement) {
      this.container.appendChild(contentElement);
    }
  }
}

export const router = new VanillaRouter();

export async function setupRouter() {
  // Dynamically load all module routes from the manifest
  for (const module of modules) {
    if (module.loadRoutes) {
      const moduleRoutes = await module.loadRoutes();
      const routesList = moduleRoutes.default || moduleRoutes;

      if (Array.isArray(routesList)) {
        routesList.forEach(route => {
          const processRoute = (r, layoutComponent = null) => {
            const fullRoute = {
              path: r.path,
              name: r.name,
              component: r.component,
              layout: layoutComponent || r.layout,
              meta: {
                ...(r.meta || {}),
                ...(module.requiredPermissions ? { requiresAuth: true, requiredPermissions: module.requiredPermissions } : {})
              }
            };

            if (r.children && Array.isArray(r.children)) {
              r.children.forEach(child => {
                const childPath = r.path + (child.path ? '/' + child.path : '');
                processRoute({
                  ...child,
                  path: childPath,
                  meta: { ...r.meta, ...child.meta }
                }, r.component); // Parent component is layout
              });
            } else {
              router.addRoute(fullRoute);
            }
          };

          processRoute(route);
        });
      }
    }
  }

  // Register global guard
  router.beforeEach(authGuard);

  return router;
}

export function useRouter() {
  return router;
}
