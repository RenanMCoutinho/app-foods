import { db, auth } from '../../services/firebase.js';
import {
    collection, getDocs, query, where, getCountFromServer
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export async function initAdminDashboard() {
    // Set admin name
    const user = auth.currentUser;
    if (user) {
        const nameEl = document.querySelector('#admin-name');
        if (nameEl) nameEl.textContent = window.currentUserData?.nome || user.email;
    }

    // Logout
    document.querySelector('.logout-btn')?.addEventListener('click', async () => {
        if (confirm('Deseja sair?')) {
            await signOut(auth);
            window.location.href = '/app-foods/pages/login.html';
        }
    });

    // Load KPIs
    try {
        const [empresasSnap, supervisoresSnap, motoristasSnap, entregasSnap] = await Promise.all([
            getCountFromServer(collection(db, 'empresas')),
            getCountFromServer(query(collection(db, 'usuarios'), where('role', '==', 'supervisor'))),
            getCountFromServer(query(collection(db, 'usuarios'), where('role', '==', 'motorista'))),
            getCountFromServer(collection(db, 'entregas')),
        ]);

        document.querySelector('#kpi-empresas').textContent = empresasSnap.data().count;
        document.querySelector('#kpi-supervisores').textContent = supervisoresSnap.data().count;
        document.querySelector('#kpi-motoristas').textContent = motoristasSnap.data().count;
        document.querySelector('#kpi-entregas').textContent = entregasSnap.data().count;
    } catch (err) {
        console.error('Erro ao carregar KPIs:', err);
    }
}
