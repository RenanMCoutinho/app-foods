import { db, auth } from '../../services/firebase.js';
import {
    collection, getDocs, addDoc, doc, updateDoc, deleteDoc,
    query, where, serverTimestamp
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export async function initSupervisorEmpresas() {
    const user = auth.currentUser;
    if (!user) return;
    setupLogout();
    loadEmpresas(user.uid);

    const modal = document.querySelector('#modal-empresa');
    const form = document.querySelector('#form-empresa');
    const listaTipos = document.querySelector('#lista-tipos');

    document.querySelector('#btn-nova-empresa')?.addEventListener('click', () => {
        document.querySelector('#empresa-id').value = '';
        document.querySelector('#modal-titulo').textContent = 'Nova Empresa';
        form.reset();
        listaTipos.innerHTML = '';
        addTipoRow(); // Start with one row
        modal.classList.remove('hidden');
    });

    document.querySelector('#btn-fechar-modal')?.addEventListener('click', () => modal.classList.add('hidden'));
    modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

    document.querySelector('#btn-add-tipo')?.addEventListener('click', () => addTipoRow());

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.querySelector('#empresa-id').value;

        // Collect tipos from dynamic rows
        const tipos = [];
        listaTipos.querySelectorAll('.tipo-row').forEach(row => {
            const nome = row.querySelector('.tipo-nome').value.trim();
            const valor = parseFloat(row.querySelector('.tipo-valor').value);
            if (nome && !isNaN(valor)) {
                tipos.push({ nome, valor });
            }
        });

        const data = {
            nome: document.querySelector('#empresa-nome').value.trim(),
            cnpj: document.querySelector('#empresa-cnpj').value.trim(),
            tipos,
            supervisorId: user.uid,
            updatedAt: serverTimestamp(),
        };

        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Salvando...';

        try {
            if (id) {
                await updateDoc(doc(db, 'empresas', id), data);
            } else {
                await addDoc(collection(db, 'empresas'), { ...data, createdAt: serverTimestamp() });
            }
            modal.classList.add('hidden');
            loadEmpresas(user.uid);
        } catch (err) {
            alert('Erro ao salvar empresa: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Salvar Empresa';
        }
    });
}

function addTipoRow(nome = '', valor = '') {
    const listaTipos = document.querySelector('#lista-tipos');
    const div = document.createElement('div');
    div.className = 'tipo-row flex gap-2 items-center';
    div.innerHTML = `
        <input type="text" class="tipo-nome flex-1 bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="Nome (ex: Entrega Normal)" value="${nome}" />
        <div class="relative">
            <span class="absolute left-2 top-2.5 text-slate-400 text-xs font-bold">R$</span>
            <input type="number" class="tipo-valor w-24 bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-lg pl-6 pr-2 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="0,00" step="0.01" value="${valor}" />
        </div>
        <button type="button" class="btn-rm-tipo p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <span class="material-symbols-outlined text-lg">remove_circle</span>
        </button>
    `;
    div.querySelector('.btn-rm-tipo').addEventListener('click', () => div.remove());
    listaTipos.appendChild(div);
}

async function loadEmpresas(supervisorId) {
    const container = document.querySelector('#lista-empresas');
    container.innerHTML = '<div class="text-center p-10 text-slate-400">Carregando...</div>';
    try {
        const snapshot = await getDocs(query(collection(db, 'empresas'), where('supervisorId', '==', supervisorId)));
        if (snapshot.empty) {
            container.innerHTML = `<div class="text-center p-12 text-slate-400">
                <span class="material-symbols-outlined text-5xl opacity-20 mb-2">business</span>
                <p class="text-sm">Nenhuma empresa cadastrada. Clique em "Nova Empresa" para começar.</p>
            </div>`;
            return;
        }
        container.innerHTML = snapshot.docs.map(d => {
            const e = d.data();
            const tiposHtml = (e.tipos || []).map(t =>
                `<span class="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
                    ${t.nome} — R$ ${(t.valor || 0).toFixed(2).replace('.', ',')}
                </span>`
            ).join('');
            return `<div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div class="flex items-start justify-between mb-4">
                    <div>
                        <h3 class="font-black text-lg">${e.nome || '—'}</h3>
                        ${e.cnpj ? `<p class="text-sm text-slate-500">${e.cnpj}</p>` : ''}
                    </div>
                    <div class="flex gap-2">
                        <button onclick="editarEmpresa('${d.id}')" class="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                            <span class="material-symbols-outlined">edit</span>
                        </button>
                        <button onclick="excluirEmpresa('${d.id}')" class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <span class="material-symbols-outlined">delete</span>
                        </button>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2">
                    ${tiposHtml || '<span class="text-xs text-slate-400 italic">Nenhum tipo de entrega cadastrado</span>'}
                </div>
            </div>`;
        }).join('');
    } catch (err) {
        container.innerHTML = `<div class="text-center p-10 text-red-400">Erro: ${err.message}</div>`;
    }
}

window.editarEmpresa = async (id) => {
    const user = auth.currentUser;
    const snapshot = await getDocs(query(collection(db, 'empresas'), where('supervisorId', '==', user.uid)));
    const d = snapshot.docs.find(d => d.id === id);
    if (!d) return;
    const e = d.data();
    document.querySelector('#empresa-id').value = id;
    document.querySelector('#empresa-nome').value = e.nome || '';
    document.querySelector('#empresa-cnpj').value = e.cnpj || '';
    document.querySelector('#modal-titulo').textContent = 'Editar Empresa';

    const listaTipos = document.querySelector('#lista-tipos');
    listaTipos.innerHTML = '';
    (e.tipos || []).forEach(t => addTipoRow(t.nome, t.valor));
    if (!e.tipos?.length) addTipoRow();

    document.querySelector('#modal-empresa').classList.remove('hidden');
};

window.excluirEmpresa = async (id) => {
    if (!confirm('Excluir esta empresa?')) return;
    await deleteDoc(doc(db, 'empresas', id));
    loadEmpresas(auth.currentUser?.uid);
};

function addTipoRow(nome = '', valor = '') {
    const listaTipos = document.querySelector('#lista-tipos');
    const div = document.createElement('div');
    div.className = 'tipo-row flex gap-2 items-center';
    div.innerHTML = `
        <input type="text" class="tipo-nome flex-1 bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="Nome (ex: Entrega Normal)" value="${nome}" />
        <div class="relative">
            <span class="absolute left-2 top-2.5 text-slate-400 text-xs font-bold">R$</span>
            <input type="number" class="tipo-valor w-24 bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-lg pl-6 pr-2 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="0,00" step="0.01" value="${valor}" />
        </div>
        <button type="button" class="btn-rm-tipo p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <span class="material-symbols-outlined text-lg">remove_circle</span>
        </button>
    `;
    div.querySelector('.btn-rm-tipo').addEventListener('click', () => div.remove());
    listaTipos.appendChild(div);
}

function setupLogout() {
    document.querySelector('.logout-btn')?.addEventListener('click', async () => {
        if (confirm('Deseja sair?')) {
            await signOut(auth);
            window.location.href = '/app-foods/pages/login.html';
        }
    });
}
