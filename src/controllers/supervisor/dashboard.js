import { db, auth } from '../../services/firebase.js';
import {
    collection, getDocs, query, where, getCountFromServer, orderBy, limit, Timestamp
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export async function initSupervisorDashboard() {
    const user = auth.currentUser;
    if (!user) return;

    // Set welcome message
    const welcomeEl = document.querySelector('#welcome-message');
    if (welcomeEl) welcomeEl.textContent = `Olá, ${window.currentUserData?.nome || user.email}!`;

    // Logout
    document.querySelector('.logout-btn')?.addEventListener('click', async () => {
        if (confirm('Deseja sair?')) {
            await signOut(auth);
            window.location.href = '/app-foods/pages/login.html';
        }
    });

    // Start/end of today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    try {
        const [motoristasSnap, entregasHojeSnap, pendentesSnap] = await Promise.all([
            getCountFromServer(query(collection(db, 'usuarios'), where('role', '==', 'motorista'), where('supervisorId', '==', user.uid))),
            getCountFromServer(query(collection(db, 'entregas'), where('supervisorId', '==', user.uid), where('dataCriacao', '>=', Timestamp.fromDate(startOfDay)))),
            getCountFromServer(query(collection(db, 'entregas'), where('supervisorId', '==', user.uid), where('status', '==', 'pendente'))),
        ]);

        document.querySelector('#kpi-motoristas').textContent = motoristasSnap.data().count;
        document.querySelector('#kpi-entregas-hoje').textContent = entregasHojeSnap.data().count;
        document.querySelector('#kpi-pendentes').textContent = pendentesSnap.data().count;
    } catch (err) {
        console.error('KPI error:', err);
    }

    // Load recent deliveries
    try {
        const tbody = document.querySelector('#lista-entregas-recentes');
        const snapshot = await getDocs(
            query(collection(db, 'entregas'), where('supervisorId', '==', user.uid), orderBy('dataCriacao', 'desc'), limit(5))
        );
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center p-8 text-slate-400">Nenhuma entrega ainda.</td></tr>';
            return;
        }

        // Load motoristas names
        const motoristasSnap = await getDocs(query(collection(db, 'usuarios'), where('supervisorId', '==', user.uid)));
        const motoristasMap = {};
        motoristasSnap.forEach(d => { motoristasMap[d.id] = d.data().nome; });

        const statusColors = { pendente: 'bg-orange-100 text-orange-700', em_rota: 'bg-blue-100 text-blue-700', concluida: 'bg-primary/10 text-primary' };
        const statusLabels = { pendente: 'Pendente', em_rota: 'Em Rota', concluida: 'Concluída' };

        tbody.innerHTML = snapshot.docs.map(d => {
            const e = d.data();
            const colorClass = statusColors[e.status] || 'bg-slate-100 text-slate-700';
            const label = statusLabels[e.status] || e.status;
            return `<tr>
                <td class="px-6 py-4 font-semibold">${motoristasMap[e.motoristaId] || 'Motorista'}</td>
                <td class="px-6 py-4 text-slate-500 hidden md:table-cell">${e.localNome || '—'}</td>
                <td class="px-6 py-4"><span class="px-2 py-1 rounded-full text-xs font-bold ${colorClass}">${label}</span></td>
                <td class="px-6 py-4 font-bold text-primary">R$ ${(e.valor || 0).toFixed(2).replace('.', ',')}</td>
            </tr>`;
        }).join('');
    } catch (err) {
        console.error('Recent deliveries error:', err);
    }
}
