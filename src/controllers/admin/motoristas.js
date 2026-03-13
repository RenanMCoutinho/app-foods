import { db, auth } from '../../services/firebase.js';
import {
    collection, getDocs, doc, deleteDoc, query, where, serverTimestamp, setDoc, updateDoc
} from 'firebase/firestore';
import {
    createUserWithEmailAndPassword, signOut
} from 'firebase/auth';

let allSupervisores = [];

export async function initAdminMotoristas() {
    setupLogout();
    // Load supervisores for filters and modal
    const supSnap = await getDocs(query(collection(db, 'usuarios'), where('role', '==', 'supervisor')));
    allSupervisores = supSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Populate filter select
    const filtroSelect = document.querySelector('#filtro-supervisor');
    allSupervisores.forEach(s => {
        filtroSelect.innerHTML += `<option value="${s.id}">${s.nome}</option>`;
    });
    filtroSelect?.addEventListener('change', () => loadMotoristas(filtroSelect.value));

    // Populate modal select
    const modalSelect = document.querySelector('#motorista-supervisor');
    allSupervisores.forEach(s => {
        modalSelect.innerHTML += `<option value="${s.id}">${s.nome}</option>`;
    });

    loadMotoristas();

    const modal = document.querySelector('#modal-motorista');
    const form = document.querySelector('#form-motorista');

    document.querySelector('#btn-novo-motorista')?.addEventListener('click', () => {
        form.reset();
        modal.classList.remove('hidden');
    });
    document.querySelector('#btn-fechar-modal')?.addEventListener('click', () => modal.classList.add('hidden'));
    modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.querySelector('#motorista-nome').value.trim();
        const email = document.querySelector('#motorista-email').value.trim();
        const senha = document.querySelector('#motorista-senha').value;
        const supervisorId = document.querySelector('#motorista-supervisor').value;
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Criando...';
        try {
            const credential = await createUserWithEmailAndPassword(auth, email, senha);
            await setDoc(doc(db, 'usuarios', credential.user.uid), {
                nome, email, role: 'motorista', supervisorId, createdAt: serverTimestamp()
            });
            modal.classList.add('hidden');
            alert(`Motorista "${nome}" criado com sucesso!`);
            loadMotoristas();
        } catch (err) {
            alert('Erro: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Criar Motorista';
        }
    });
}

function escapeHtml(text) {
    if (text === null || text === undefined) {
        return '';
    }
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function loadMotoristas(supervisorId = '') {
    const tbody = document.querySelector('#lista-motoristas');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center p-10 text-slate-400">Carregando...</td></tr>';
    try {
        let q = supervisorId
            ? query(collection(db, 'usuarios'), where('role', '==', 'motorista'), where('supervisorId', '==', supervisorId))
            : query(collection(db, 'usuarios'), where('role', '==', 'motorista'));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center p-10 text-slate-400">Nenhum motorista encontrado.</td></tr>';
            return;
        }
        tbody.innerHTML = snapshot.docs.map(d => {
            const m = d.data();
            const supervisor = allSupervisores.find(s => s.id === m.supervisorId);
            return `<tr>
                <td class="px-6 py-4 font-semibold">${m.nome || '—'}</td>
                <td class="px-6 py-4 text-slate-500 hidden md:table-cell">${m.email || '—'}</td>
                <td class="px-6 py-4 hidden md:table-cell"><span class="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">${supervisor?.nome || 'Sem supervisor'}</span></td>
                <td class="px-6 py-4">
                    <button onclick="excluirMotorista('${d.id}')" class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><span class="material-symbols-outlined text-lg">delete</span></button>
                </td>
            </tr>`;
        }).join('');
    } catch (err) {
        const safeMessage = escapeHtml(err && err.message ? err.message : 'Erro inesperado');
        tbody.innerHTML = `<tr><td colspan="4" class="text-center p-10 text-red-400">Erro: ${safeMessage}</td></tr>`;
    }
}

window.excluirMotorista = async (id) => {
    if (!confirm('Excluir este motorista?')) return;
    await deleteDoc(doc(db, 'usuarios', id));
    loadMotoristas();
};

function setupLogout() {
    document.querySelector('.logout-btn')?.addEventListener('click', async () => {
        if (confirm('Deseja sair?')) {
            await signOut(auth);
            window.location.href = '/app-foods/index.html';
        }
    });
}
