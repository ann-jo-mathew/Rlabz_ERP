const routes = [
  {
    path: '/certificates',
    children: [
      {
        path: '',
        name: 'certificates-home',
        component: () => import('./views/CertificatesHome.js')
      }
    ]
  }
];

export default routes;