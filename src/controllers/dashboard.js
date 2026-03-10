import { db, auth } from './services/firebase.js';
import {
    collection, getDocs, query, where, orderBy
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

let currentYear, currentMonth;

export async function initDashboard() {
    const user = auth.currentUser;
    if (!user) return;

    // Welcome
    const welcomeEl = document.querySelector('#welcome-message');
    if (welcomeEl) welcomeEl.textContent = `Olá, ${window.currentUserData?.nome || user.email.split('@')[0]}!`;

    // Logout
    document.querySelector('.logout-btn')?.addEventListener('click', async () => {
        if (confirm('Deseja sair?')) {
            await signOut(auth);
            window.location.href = '/app-foods/pages/login.html';
        }
    });

    // Month navigation
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth(); // 0-indexed

    document.querySelector('#btn-mes-anterior')?.addEventListener('click', () => {
        if (currentMonth === 0) { currentMonth = 11; currentYear--; }
        else currentMonth--;
        loadMonth(user.uid);
    });

    document.querySelector('#btn-mes-proximo')?.addEventListener('click', () => {
        if (currentMonth === 11) { currentMonth = 0; currentYear++; }
        else currentMonth++;
        loadMonth(user.uid);
    });

    loadMonth(user.uid);
}

async function loadMonth(motoristaId) {
    // Format month label
    const mesLabel = document.querySelector('#mes-label');
    const dataRef = new Date(currentYear, currentMonth, 1);
    if (mesLabel) mesLabel.textContent = dataRef.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    // Build date range strings (YYYY-MM-DD)
    const startStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    const endStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const kpiTotal = document.querySelector('#kpi-total');
    const kpiGanhos = document.querySelector('#kpi-ganhos');
    const kpiDias = document.querySelector('#kpi-dias');
    const historico = document.querySelector('#historico-mes');

    if (kpiTotal) kpiTotal.textContent = '...';
    if (kpiGanhos) kpiGanhos.textContent = '...';
    if (kpiDias) kpiDias.textContent = '...';

    try {
        const snapshot = await getDocs(
            query(collection(db, 'entregas'),
                where('motoristaId', '==', motoristaId),
                where('data', '>=', startStr),
                where('data', '<=', endStr),
                orderBy('data', 'desc'),
                orderBy('createdAt', 'desc')
            )
        );

        const entregas = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const totalGanhos = entregas.reduce((acc, e) => acc + (e.valor || 0), 0);
        const diasUnicos = new Set(entregas.map(e => e.data)).size;

        if (kpiTotal) kpiTotal.textContent = entregas.length;
        if (kpiGanhos) kpiGanhos.textContent = `R$\u00A0${totalGanhos.toFixed(2).replace('.', ',')}`;
        if (kpiDias) kpiDias.textContent = diasUnicos;

        if (!entregas.length) {
            historico.innerHTML = `<div class="p-8 text-center">
                <span class="material-symbols-outlined text-4xl text-slate-200">bar_chart</span>
                <p class="text-sm text-slate-400 mt-2">Sem entregas neste mês.</p>
            </div>`;
            return;
        }

        // Group by date
        const porData = {};
        entregas.forEach(e => {
            if (!porData[e.data]) porData[e.data] = [];
            porData[e.data].push(e);
        });

        historico.innerHTML = Object.entries(porData).map(([data, items]) => {
            const totalDia = items.reduce((acc, e) => acc + (e.valor || 0), 0);
            const [ano, mes, dia] = data.split('-');
            const dataFmt = new Date(Number(ano), Number(mes) - 1, Number(dia))
                .toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

            const rows = items.map(e => `
                <div class="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div>
                        <p class="text-sm font-semibold">${e.tipoNome || '—'}</p>
                        <p class="text-xs text-slate-400">${e.empresaNome || '—'}</p>
                    </div>
                    <span class="font-bold text-primary text-sm">R$ ${(e.valor || 0).toFixed(2).replace('.', ',')}</span>
                </div>
            `).join('');

            return `<div class="border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div class="flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-slate-800/50">
                    <span class="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">${dataFmt}</span>
                    <span class="text-xs font-black text-primary">R$ ${totalDia.toFixed(2).replace('.', ',')}</span>
                </div>
                ${rows}
            </div>`;
        }).join('');

    } catch (err) {
        console.error('Erro ao carregar mês:', err);
        historico.innerHTML = `<div class="p-8 text-center text-red-400 text-sm">Erro: ${err.message}</div>`;
    }
}
