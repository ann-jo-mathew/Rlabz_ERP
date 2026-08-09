import { modules } from '../../module-manifest.js';
import { authGuard } from '../guards/authGuard.js';
import { useAuthStore } from '../stores/auth.js';

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
    // 1. Direct exact match first
    const exactMatch = this.routes.find(r => r.path === path);
    if (exactMatch) return { route: exactMatch, params: {} };

    // 2. Root redirect
    if (path === '/') {
      const r = this.routes.find(r => r.path === '/dashboard') || this.routes[0];
      return r ? { route: r, params: {} } : null;
    }

    // 3. Dynamic segment matching (e.g. /finance/projects/:id)
    for (const r of this.routes) {
      if (!r.path.includes(':')) continue;
      const routeParts = r.path.split('/');
      const pathParts  = path.split('/');
      if (routeParts.length !== pathParts.length) continue;

      const params = {};
      const matched = routeParts.every((part, i) => {
        if (part.startsWith(':')) {
          params[part.slice(1)] = pathParts[i];
          return true;
        }
        return part === pathParts[i];
      });

      if (matched) return { route: r, params };
    }

    return null;
  }

  async handleRoute(path) {
    const authStore = useAuthStore();
    const defaultRoute = authStore.user?.defaultRoute || '/dashboard';

    if (path === '/') {
      return this.push(authStore.isAuthenticated ? defaultRoute : '/login');
    }

    const matchResult = this.match(path);
    if (!matchResult) {
      return this.push(authStore.isAuthenticated ? defaultRoute : '/login');
    }

    const targetRoute = { ...matchResult.route, params: matchResult.params || {} };

    // Run navigation guards
    for (const guard of this.guards) {
      let redirectTarget = null;
      const next = (to) => { if (to) redirectTarget = to; };
      await guard(targetRoute, this.currentRoute, next);
      if (redirectTarget) return this.push(redirectTarget);
    }

    this.currentRoute = targetRoute;
    await this.renderRoute(targetRoute);
  }

  async renderRoute(route) {
    if (!this.container) {
      this.container = document.getElementById('app');
    }

    if (!this.container) return;

    this.navId = (this.navId || 0) + 1;
    const currentNavId = this.navId;

    const layoutName = route.layout ? route.layout.name : 'none';
    const isSameLayout = this.currentLayoutName === layoutName && this.container.querySelector('.dashboard-layout');

    let outlet = null;

    if (isSameLayout) {
      outlet = this.container.querySelector('#layout-outlet');
      if (outlet) {
        outlet.innerHTML = '<div class="spinner" style="border-top-color: var(--primary); margin: 40px auto; display: block; width: 32px; height: 32px;"></div>';
      }
    } else {
      this.container.innerHTML = '<div class="spinner" style="border-top-color: var(--primary); margin: 40px auto; display: block; width: 32px; height: 32px;"></div>';
    }

    let contentElement = null;
    
    try {
      if (route.component) {
        let componentDef = route.component;
        if (typeof componentDef === 'function' && componentDef.name !== 'DashboardLayout') {
          const result = componentDef(route, this);
          if (result && typeof result.then === 'function') {
            const module = await result;
            if (this.navId !== currentNavId) return;
            componentDef = module.default || module;
            if (typeof componentDef === 'function') {
              contentElement = await componentDef(route, this);
            } else {
              contentElement = componentDef;
            }
          } else {
            contentElement = result;
          }
        } else if (componentDef && typeof componentDef.render === 'function') {
          contentElement = await componentDef.render(route, this);
        }
      }
    } catch (e) {
      console.error('Error rendering component:', e);
      contentElement = document.createElement('div');
      contentElement.innerHTML = `<div class="alert-error" style="margin: 2rem;">Failed to load view content.</div>`;
    }

    if (this.navId !== currentNavId) return;

    if (isSameLayout) {
      // Update outlet content
      if (outlet) {
        outlet.innerHTML = '';
        if (contentElement) {
          outlet.appendChild(contentElement);
        }
      }
      // Update sidebar and active state to reflect the new route
      const currentPath = window.location.pathname;
      const { updateSidebar } = await import('../layouts/DashboardLayout.js');
      updateSidebar(currentPath);
      // Update topbar title
      const topbarTitle = this.container.querySelector('.topbar-title');
      if (topbarTitle && route.name) {
        topbarTitle.textContent = route.name.toUpperCase().replace(/-/g, ' ');
      }
    } else {
      this.container.innerHTML = '';
      if (route.layout) {
        const layoutElement = await route.layout(contentElement, route, this);
        if (this.navId !== currentNavId) return;
        this.container.appendChild(layoutElement);
        this.currentLayoutName = layoutName;
      } else if (contentElement) {
        this.container.appendChild(contentElement);
        this.currentLayoutName = 'none';
      }
    }
  }
}

export const router = new VanillaRouter();

export async function setupRouter() {
  // Dynamically load module routes from manifest
  const { DashboardLayout } = await import('../layouts/DashboardLayout.js');
  // Styled placeholder for modules not yet implemented
  const UnderConstructionComponent = (route) => {
    const el = document.createElement('div');
    el.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center;padding:2rem;';
    el.innerHTML = `
      <div style="font-size:3.5rem;margin-bottom:1rem">🚧</div>
      <h2 style="font-size:1.5rem;font-weight:800;color:var(--text-main);margin-bottom:0.5rem">${route.name ? route.name.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) : 'Module'}</h2>
      <p style="color:var(--text-muted);max-width:400px">This module is under active development. Check back soon!</p>
      <div style="margin-top:1.5rem;padding:0.6rem 1.5rem;background:linear-gradient(135deg,#059669,#047857);color:#fff;border-radius:8px;font-weight:600;font-size:0.9rem;display:inline-block">Coming Soon</div>
    `;
    return el;
  };

  for (const module of modules) {
    if (module.loadRoutes) {
      try {
        const moduleRoutes = await module.loadRoutes();
        const routesList = moduleRoutes.default || moduleRoutes;

        if (Array.isArray(routesList)) {
          routesList.forEach(route => {
            const processRoute = (r, layoutComponent = null) => {
              const baseMeta = {
                moduleName: module.name,
                requiresAuth: module.name !== 'auth',
                ...(r.meta || {}),
                ...(module.requiredPermissions ? { requiredPermissions: module.requiredPermissions } : {})
              };

              if (r.children && Array.isArray(r.children)) {
                // Register parent path using its index child (path: '') as the component
                const indexChild = r.children.find(c => c.path === '' || c.path === '/');
                if (indexChild) {
                  router.addRoute({
                    path: r.path,
                    name: r.name || (module.name + '-index'),
                    component: indexChild.component,
                    layout: r.component,  // parent component is the layout (DashboardLayout)
                    meta: { ...baseMeta, ...indexChild.meta }
                  });
                }
                // Register all children
                r.children.forEach(child => {
                  if (child.path === '' || child.path === '/') return; // already registered as parent
                  const childPath = r.path + '/' + child.path;
                  router.addRoute({
                    path: childPath,
                    name: child.name,
                    component: child.component,
                    layout: r.component,  // DashboardLayout is the parent component
                    meta: { ...baseMeta, ...child.meta }
                  });
                });
              } else {
                router.addRoute({
                  path: r.path,
                  name: r.name,
                  component: r.component,
                  layout: layoutComponent || r.layout,
                  meta: baseMeta
                });
              }
            };

            processRoute(route);
          });
        }
      } catch (err) {
        console.warn(`Could not load routes for module ${module.name}, registering layout fallback:`, err);
        // Still register the path so it doesn't 404
        router.addRoute({
          path: module.path,
          name: module.name,
          component: UnderConstructionComponent,
          layout: DashboardLayout,
          meta: { moduleName: module.name, requiresAuth: true }
        });
      }
    } else if (module.sidebar) {
      // Register route with a styled Under Construction page
      router.addRoute({
        path: module.path,
        name: module.name,
        component: UnderConstructionComponent,
        layout: DashboardLayout,
        meta: {
          moduleName: module.name,
          requiresAuth: true
        }
      });
    }
  }

  // Register global guard
  router.beforeEach(authGuard);

  return router;
}

export function useRouter() {
  return router;
}
