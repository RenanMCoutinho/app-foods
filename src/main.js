import Framework7 from 'framework7/bundle';
import 'framework7/css/bundle';
import 'framework7-icons/css/framework7-icons.css';
import '../css/style.css';

import { initHome } from './controllers/home.js';
import { initCadastro } from './controllers/cadastro.js';
import { initRelatorio } from './controllers/relatorio.js';

const app = new Framework7({
    el: '#app',
    name: 'DriverLog',
    theme: 'ios',
    routes: [
        {
            path: '/',
            url: './pages/home.html',
            on: {
                pageInit: function (e, page) {
                    initHome(page, app);
                },
            }
        },
        {
            path: '/cadastro/',
            url: './pages/cadastro.html',
            on: {
                pageInit: function (e, page) {
                    initCadastro(page, app);
                },
            }
        },
        {
            path: '/relatorio/',
            url: './pages/relatorio.html',
            on: {
                pageInit: function (e, page) {
                    initRelatorio(page, app);
                },
            }
        },
    ],
});

app.views.create('.view-main');
