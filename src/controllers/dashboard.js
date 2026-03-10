import { db, auth } from '../services/firebase.js';
import { doc, getDoc } from 'firebase/firestore';

export async function initDashboard(page, app) {
    app.preloader.show();

    // Check current authenticated user
    const user = auth.currentUser;
    if (!user) {
        app.preloader.hide();
        app.views.main.router.navigate('/login/');
        return;
    }

    try {
        // Obter o papel (role) do usuário logado
        const userDocRef = doc(db, 'usuarios', user.uid);
        const userDoc = await getDoc(userDocRef);

        let role = 'motorista'; // default fallback

        if (userDoc.exists()) {
            const data = userDoc.data();
            role = data.role || 'motorista';
        }

        app.preloader.hide();

        // Render UI based on role
        renderDashboardUI(page, role, user.email, app);

    } catch (error) {
        app.preloader.hide();
        console.error("Erro ao buscar perfil do usuário", error);
        app.dialog.alert('Erro ao carregar o dashboard.', 'Erros');
    }
}

function renderDashboardUI(page, role, email, app) {
    const $el = page.$el;

    // Limpar conteúdo anterior
    $el.find('.role-based-content').html('');

    // Header
    const welcomeHtml = `
        <div class="block">
            <h2 style="margin-bottom: 5px;">Painel de Controle</h2>
            <p style="margin-top: 0; color: var(--f7-theme-color); font-weight: bold;">[${role.toUpperCase()}] ${email}</p>
        </div>
    `;

    $el.find('.role-based-content').append(welcomeHtml);

    // Botoes e Lógica por Papel
    let buttonsHtml = '<div class="list links-list"><ul>';

    if (role === 'admin') {
        buttonsHtml += `
            <li><a href="/relatorio/"><i class="f7-icons">chart_pie_fill</i> Relatório Geral</a></li>
            <li><a href="/cadastro/"><i class="f7-icons">building_2_fill</i> Gestão de Empresas</a></li>
            <li><a href="#" class="item-link" onclick="app.dialog.alert('Em breve')"><i class="f7-icons">person_2_fill</i> Gestão de Usuários</a></li>
         `;
    } else if (role === 'supervisor') {
        buttonsHtml += `
             <li><a href="/relatorio/"><i class="f7-icons">chart_pie_fill</i> Relatórios Logs</a></li>
             <li><a href="/cadastro/"><i class="f7-icons">building_2_fill</i> Empresas Ativas</a></li>
         `;
    } else if (role === 'motorista') {
        buttonsHtml += `
            <li><a href="/home/"><i class="f7-icons">map_pin_ellipse</i> Meu Dia (Novo Frete)</a></li>
         `;
    }

    buttonsHtml += '</ul></div>';

    $el.find('.role-based-content').append(buttonsHtml);

    // Logout btn
    const logoutHtml = `
       <div class="block">
            <button class="button button-fill color-red button-logout"><i class="f7-icons">square_arrow_right</i> Sair</button>
       </div>
    `;

    $el.find('.role-based-content').append(logoutHtml);

    // Bind Logout events
    $el.find('.button-logout').on('click', () => {
        auth.signOut().then(() => {
            app.views.main.router.navigate('/login/', { clearPreviousHistory: true });
        });
    });
}
