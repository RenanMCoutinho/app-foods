import Framework7 from 'framework7/bundle';
import 'framework7/css/bundle';
import 'framework7-icons/css/framework7-icons.css';
import '../css/style.css';

import { initHome } from './controllers/home.js';
import { initCadastro } from './controllers/cadastro.js';
import { initRelatorio } from './controllers/relatorio.js';
import { initDashboard } from './controllers/dashboard.js';
import { initLogin } from './controllers/login.js';

import homeHtml from '../pages/home.html?url';
import cadastroHtml from '../pages/cadastro.html?url';
import relatorioHtml from '../pages/relatorio.html?url';
import dashboardHtml from '../pages/dashboard.html?url';
import loginHtml from '../pages/login.html?url';

import { auth } from './services/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';

const app = new Framework7({
    el: '#app',
    name: 'DriverLog',
    theme: 'ios',
    routes: [
        {
            path: '/',
            url: dashboardHtml,
            on: {
                pageInit: function (e, page) {
                    initDashboard(page, app);
                },
            }
        },
        {
            path: '/home/',
            url: homeHtml,
            on: {
                pageInit: function (e, page) {
                    initHome(page, app);
                },
            }
        },
        {
            path: '/cadastro/',
            url: cadastroHtml,
            on: {
                pageInit: function (e, page) {
                    initCadastro(page, app);
                },
            }
        },
        {
            path: '/relatorio/',
            url: relatorioHtml,
            on: {
                pageInit: function (e, page) {
                    initRelatorio(page, app);
                },
            }
        },
        {
            path: '/login/',
            url: loginHtml,
            on: {
                pageInit: function (e, page) {
                    initLogin(page, app);
                },
            }
        },
    ],
});

let appInitialized = false;

onAuthStateChanged(auth, (user) => {
    if (!appInitialized) {
        app.views.create('.view-main', {
            url: '/'
        });
        appInitialized = true;
    }

    const mainView = app.views.main;

    // We MUST wait for the router to be ready, Framework7 is async
    setTimeout(() => {
        if (user) {
            // Go home if authenticated and currently on login
            if (mainView.router.currentRoute.path === '/login/') {
                mainView.router.navigate('/', { clearPreviousHistory: true });
            }
        } else {
            // Force user to login if not already there
            if (mainView.router.currentRoute.path !== '/login/') {
                mainView.router.navigate('/login/', { clearPreviousHistory: true });
            }
        }
    }, 100);
});
