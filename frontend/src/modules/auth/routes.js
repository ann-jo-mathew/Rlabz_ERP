const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('./views/LoginView.js'),
    meta: {
      requiresAuth: false
    }
  }
];

export default routes;
