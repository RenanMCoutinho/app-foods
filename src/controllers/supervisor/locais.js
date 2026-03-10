import { db, auth } from '../../services/firebase.js';
import {
    collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, serverTimestamp
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export async function initLocais() {
    const user = auth.currentUser;
    if (!user) return;
    setupLogout();
    loadLocais(user.uid);

    const modal = document.querySelector('#modal-local');
    const form = document.querySelector('#form-local');

    document.querySelector('#btn-novo-local')?.addEventListener('click', () => {
        document.querySelector('#local-id').value = '';
        document.querySelector('#modal-titulo').textContent = 'Novo Local';
        form.reset();
        modal.classList.remove('hidden');
    });
    document.querySelector('#btn-fechar-modal')?.addEventListener('click', () => modal.classList.add('hidden'));
    modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.querySelector('#local-id').value;
        const data = {
            nome: document.querySelector('#local-nome').value.trim(),
            endereco: document.querySelector('#local-endereco').value.trim(),
            supervisorId: user.uid,
            updatedAt: serverTimestamp(),
        };
        try {
            if (id) {
                await updateDoc(doc(db, 'locais', id), data);
            } else {
                await addDoc(collection(db, 'locais'), { ...data, createdAt: serverTimestamp() });
            }
            modal.classList.add('hidden');
            loadLocais(user.uid);
        } catch (err) {
            alert('Erro: ' + err.message);
        }
    });
}

async function loadLocais(supervisorId) {
    const tbody = document.querySelector('#lista-locais');
    tbody.innerHTML = '<tr><td colspan="3" class="text-center p-10 text-slate-400">Carregando...</td></tr>';
    try {
        const snapshot = await getDocs(query(collection(db, 'locais'), where('supervisorId', '==', supervisorId)));
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center p-10 text-slate-400">Nenhum local cadastrado.</td></tr>';
            return;
        }
        tbody.innerHTML = snapshot.docs.map(d => {
            const l = d.data();
            return `<tr>
                <td class="px-6 py-4 font-semibold">${l.nome || '—'}</td>
                <td class="px-6 py-4 text-slate-500 hidden md:table-cell">${l.endereco || '—'}</td>
                <td class="px-6 py-4">
                    <div class="flex gap-2">
                        <button onclick="editarLocal('${d.id}')" class="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg"><span class="material-symbols-outlined text-lg">edit</span></button>
                        <button onclick="excluirLocal('${d.id}')" class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><span class="material-symbols-outlined text-lg">delete</span></button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center p-10 text-red-400">Erro: ${err.message}</td></tr>`;
    }
}

window.editarLocal = async (id) => {
    const snapshot = await getDocs(query(collection(db, 'locais'), where('supervisorId', '==', auth.currentUser?.uid)));
    const d = snapshot.docs.find(d => d.id === id);
    if (!d) return;
    const l = d.data();
    document.querySelector('#local-id').value = id;
    document.querySelector('#local-nome').value = l.nome || '';
    document.querySelector('#local-endereco').value = l.endereco || '';
    document.querySelector('#modal-titulo').textContent = 'Editar Local';
    document.querySelector('#modal-local').classList.remove('hidden');
};

window.excluirLocal = async (id) => {
    if (!confirm('Excluir este local?')) return;
    await deleteDoc(doc(db, 'locais', id));
    loadLocais(auth.currentUser?.uid);
};

function setupLogout() {
    document.querySelector('.logout-btn')?.addEventListener('click', async () => {
        if (confirm('Deseja sair?')) {
            await signOut(auth);
            window.location.href = '/app-foods/pages/login.html';
        }
    });
}
