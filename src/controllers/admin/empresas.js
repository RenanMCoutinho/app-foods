import { db, auth } from '../../services/firebase.js';
import {
    collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export async function initEmpresas() {
    setupLogout();
    loadEmpresas();

    // Modal controls
    const modal = document.querySelector('#modal-empresa');
    const form = document.querySelector('#form-empresa');
    document.querySelector('#btn-nova-empresa')?.addEventListener('click', () => {
        document.querySelector('#empresa-id').value = '';
        form.reset();
        document.querySelector('#modal-titulo').textContent = 'Nova Empresa';
        modal.classList.remove('hidden');
    });
    document.querySelector('#btn-fechar-modal')?.addEventListener('click', () => modal.classList.add('hidden'));
    modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

    // Search
    document.querySelector('#search-empresa')?.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        document.querySelectorAll('#lista-empresas tr[data-nome]').forEach(tr => {
            tr.style.display = tr.dataset.nome.includes(q) ? '' : 'none';
        });
    });

    // Submit
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.querySelector('#empresa-id').value;
        const data = {
            nome: document.querySelector('#empresa-nome').value.trim(),
            cnpj: document.querySelector('#empresa-cnpj').value.trim(),
            freteValorPadrao: parseFloat(document.querySelector('#empresa-valor').value) || 0,
            updatedAt: serverTimestamp(),
        };
        try {
            if (id) {
                await updateDoc(doc(db, 'empresas', id), data);
            } else {
                await addDoc(collection(db, 'empresas'), { ...data, createdAt: serverTimestamp() });
            }
            modal.classList.add('hidden');
            loadEmpresas();
        } catch (err) {
            alert('Erro ao salvar empresa: ' + err.message);
        }
    });
}

async function loadEmpresas() {
    const tbody = document.querySelector('#lista-empresas');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center p-10 text-slate-400">Carregando...</td></tr>';
    try {
        const snapshot = await getDocs(collection(db, 'empresas'));
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center p-10 text-slate-400">Nenhuma empresa cadastrada.</td></tr>';
            return;
        }
        tbody.innerHTML = snapshot.docs.map(d => {
            const e = d.data();
            return `<tr data-nome="${e.nome?.toLowerCase() || ''}">
                <td class="px-6 py-4 font-semibold">${e.nome || '—'}</td>
                <td class="px-6 py-4 text-slate-500 hidden md:table-cell">${e.cnpj || '—'}</td>
                <td class="px-6 py-4 hidden md:table-cell text-primary font-bold">R$ ${(e.freteValorPadrao || 0).toFixed(2).replace('.', ',')}</td>
                <td class="px-6 py-4">
                    <div class="flex gap-2">
                        <button onclick="editarEmpresa('${d.id}')" class="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><span class="material-symbols-outlined text-lg">edit</span></button>
                        <button onclick="excluirEmpresa('${d.id}')" class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><span class="material-symbols-outlined text-lg">delete</span></button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center p-10 text-red-400">Erro: ${err.message}</td></tr>`;
    }
}

// Expose to window for inline onclick
window.editarEmpresa = async (id) => {
    const snap = await getDocs(collection(db, 'empresas'));
    const d = snap.docs.find(d => d.id === id);
    if (!d) return;
    const e = d.data();
    document.querySelector('#empresa-id').value = id;
    document.querySelector('#empresa-nome').value = e.nome || '';
    document.querySelector('#empresa-cnpj').value = e.cnpj || '';
    document.querySelector('#empresa-valor').value = e.freteValorPadrao || '';
    document.querySelector('#modal-titulo').textContent = 'Editar Empresa';
    document.querySelector('#modal-empresa').classList.remove('hidden');
};

window.excluirEmpresa = async (id) => {
    if (!confirm('Excluir esta empresa?')) return;
    await deleteDoc(doc(db, 'empresas', id));
    loadEmpresas();
};

function setupLogout() {
    document.querySelector('.logout-btn')?.addEventListener('click', async () => {
        if (confirm('Deseja sair?')) {
            await signOut(auth);
            window.location.href = '/app-foods/pages/login.html';
        }
    });
}
