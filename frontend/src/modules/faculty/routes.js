import { FacultyLayout } from './FacultyLayout.js';

const routes = [
  {
    path: '/faculty',
    component: FacultyLayout,
    children: [
      {
        path: '',
        name: 'faculty-home',
        component: () => import('./views/FacultyHome.js')
      },
      {
        path: 'profile',
        name: 'faculty-profile',
        component: () => import('./views/FacultyProfile.js')
      },
      {
        path: 'projects',
        name: 'faculty-projects',
        component: () => import('./views/FacultyProjects.js')
      },
      {
        path: 'students',
        name: 'faculty-students',
        component: () => import('./views/FacultyStudents.js')
      },
    ]
  }
];

export default routes;