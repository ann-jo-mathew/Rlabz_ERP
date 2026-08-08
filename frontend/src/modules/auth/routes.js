const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('./views/LoginView.js'),
    meta: {
      requiresAuth: false
    }
  },
  {
    path: '/auth',
    name: 'auth',
    component: () => import('./views/LoginView.js'),
    meta: {
      requiresAuth: false
    }
  },
  {
    path: '/auth/login',
    name: 'auth-login',
    component: () => import('./views/LoginView.js'),
    meta: {
      requiresAuth: false
    }
  }
];

export default routes;
