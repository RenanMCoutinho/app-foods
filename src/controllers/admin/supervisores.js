import { db, auth } from '../../services/firebase.js';
import {
    collection, getDocs, doc, deleteDoc, query, where, getCountFromServer
} from 'firebase/firestore';
import {
    signOut
} from 'firebase/auth';
import { escapeHtml, escapeJsString } from '../../utils/sanitize.js';

export async function initSupervisores() {
    setupLogout();
    loadSupervisores();

    const modal = document.querySelector('#modal-supervisor');
    const form = document.querySelector('#form-supervisor');

    document.querySelector('#btn-novo-supervisor')?.addEventListener('click', () => {
        form.reset();
        modal.classList.remove('hidden');
    });
    document.querySelector('#btn-fechar-modal')?.addEventListener('click', () => modal.classList.add('hidden'));
    modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        alert('Criação de supervisor pelo frontend foi bloqueada por segurança. Para esse perfil, use um backend com Admin SDK ou Cloud Functions.');
    });
}

async function loadSupervisores() {
    const tbody = document.querySelector('#lista-supervisores');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center p-10 text-slate-400">Carregando...</td></tr>';
    try {
        const snapshot = await getDocs(query(collection(db, 'usuarios'), where('role', '==', 'supervisor')));
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center p-10 text-slate-400">Nenhum supervisor encontrado.</td></tr>';
            return;
        }

        // For each supervisor, count their motoristas
        const rows = await Promise.all(snapshot.docs.map(async (d) => {
            const s = d.data();
            const motoristaCount = await getCountFromServer(
                query(collection(db, 'usuarios'), where('role', '==', 'motorista'), where('supervisorId', '==', d.id))
            );
            return `<tr>
                <td class="px-6 py-4 font-semibold">${escapeHtml(s.nome || '—')}</td>
                <td class="px-6 py-4 text-slate-500 hidden md:table-cell">${escapeHtml(s.email || '—')}</td>
                <td class="px-6 py-4"><span class="bg-blue-50 text-blue-700 font-bold text-xs px-2 py-1 rounded-full">${motoristaCount.data().count} motoristas</span></td>
                <td class="px-6 py-4">
                    <button onclick="excluirSupervisor('${escapeJsString(d.id)}')" class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><span class="material-symbols-outlined text-lg">delete</span></button>
                </td>
            </tr>`;
        }));
        tbody.innerHTML = rows.join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center p-10 text-red-400">Erro: ${err.message}</td></tr>`;
    }
}

window.excluirSupervisor = async (id) => {
    if (!confirm('Excluir este supervisor? Seus motoristas ficarão sem supervisor.')) return;
    await deleteDoc(doc(db, 'usuarios', id));
    loadSupervisores();
};

function setupLogout() {
    document.querySelector('.logout-btn')?.addEventListener('click', async () => {
        if (confirm('Deseja sair?')) {
            await signOut(auth);
            window.location.href = '/app-foods/index.html';
        }
    });
}
