import { FacultyLayout } from '../faculty/FacultyLayout.js';

const routes = [
    {
        path: '/github',
        component: FacultyLayout,
        children: [
            {
                path: '',
                name: 'github-home',
                component: () => import('./views/GithubHome.js')
            }
        ]
    }
];

export default routes;