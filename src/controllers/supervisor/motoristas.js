import { db, auth } from '../../services/firebase.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

export async function initSupervisorMotoristas() {
    const user = auth.currentUser;
    if (!user) return;
    setupLogout();

    const container = document.querySelector('#lista-motoristas');
    try {
        const snapshot = await getDocs(query(collection(db, 'usuarios'), where('role', '==', 'motorista'), where('supervisorId', '==', user.uid)));
        if (snapshot.empty) {
            container.innerHTML = '<div class="col-span-3 text-center p-10 text-slate-400">Nenhum motorista atribuído a você ainda.</div>';
            return;
        }
        container.innerHTML = snapshot.docs.map(d => {
            const m = d.data();
            return `<div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div class="flex items-center gap-4 mb-4">
                    <div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span class="material-symbols-outlined text-primary text-2xl">person</span>
                    </div>
                    <div>
                        <p class="font-black">${m.nome || '—'}</p>
                        <p class="text-sm text-slate-500">${m.email || ''}</p>
                    </div>
                </div>
                <a href="../supervisor/entregas.html" class="flex items-center gap-2 text-sm text-primary font-semibold hover:underline">
                    <span class="material-symbols-outlined text-sm">inventory_2</span> Ver entregas
                </a>
            </div>`;
        }).join('');
    } catch (err) {
        container.innerHTML = `<div class="col-span-3 text-center p-10 text-red-400">Erro: ${err.message}</div>`;
    }
}

function setupLogout() {
    document.querySelector('.logout-btn')?.addEventListener('click', async () => {
        if (confirm('Deseja sair?')) {
            await signOut(auth);
            window.location.href = '/app-foods/pages/login.html';
        }
    });
}
