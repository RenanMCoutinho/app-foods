import { db, auth } from '../../services/firebase.js';
import {
    collection, getDocs, addDoc, doc, updateDoc, deleteDoc,
    query, where, orderBy, serverTimestamp
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';

let allMotoristas = [];
let allEmpresas = [];
let allLocais = [];

export async function initSupervisorEntregas() {
    const user = auth.currentUser;
    if (!user) return;
    setupLogout();

    // Pre-fetch selects data
    const [motSnap, empSnap, locSnap] = await Promise.all([
        getDocs(query(collection(db, 'usuarios'), where('role', '==', 'motorista'))),
        getDocs(collection(db, 'empresas')),
        getDocs(query(collection(db, 'locais'), where('supervisorId', '==', user.uid))),
    ]);
    allMotoristas = motSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    allEmpresas = empSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    allLocais = locSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Populate motorista filter + modal
    const filtroMot = document.querySelector('#filtro-motorista');
    const modalMot = document.querySelector('#entrega-motorista');
    allMotoristas.forEach(m => {
        const opt = `<option value="${m.id}">${m.nome}</option>`;
        if (filtroMot) filtroMot.innerHTML += opt;
        if (modalMot) modalMot.innerHTML += opt;
    });

    // Populate empresa modal
    const modalEmp = document.querySelector('#entrega-empresa');
    allEmpresas.forEach(e => {
        if (modalEmp) modalEmp.innerHTML += `<option value="${e.id}" data-valor="${e.freteValorPadrao || 0}">${e.nome}</option>`;
    });

    // Auto-fill valor from empresa
    modalEmp?.addEventListener('change', () => {
        const selected = modalEmp.options[modalEmp.selectedIndex];
        const valorPadrao = selected?.dataset.valor;
        if (valorPadrao) document.querySelector('#entrega-valor').placeholder = `Padrão: R$ ${parseFloat(valorPadrao).toFixed(2)}`;
    });

    // Populate local modal
    const modalLoc = document.querySelector('#entrega-local');
    allLocais.forEach(l => {
        if (modalLoc) modalLoc.innerHTML += `<option value="${l.id}">${l.nome}</option>`;
    });

    // Filters
    document.querySelector('#filtro-status')?.addEventListener('change', reloadTable);
    filtroMot?.addEventListener('change', reloadTable);

    loadEntregas(user.uid);

    // Modal
    const modal = document.querySelector('#modal-entrega');
    const form = document.querySelector('#form-entrega');
    document.querySelector('#btn-nova-entrega')?.addEventListener('click', () => {
        document.querySelector('#entrega-id').value = '';
        document.querySelector('#modal-titulo').textContent = 'Nova Entrega';
        form.reset();
        modal.classList.remove('hidden');
    });
    document.querySelector('#btn-fechar-modal')?.addEventListener('click', () => modal.classList.add('hidden'));
    modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.querySelector('#entrega-id').value;
        const motoristaId = document.querySelector('#entrega-motorista').value;
        const empresaId = document.querySelector('#entrega-empresa').value;
        const localEl = document.querySelector('#entrega-local');
        const localId = localEl?.value || '';
        const localNome = localId ? allLocais.find(l => l.id === localId)?.nome || '' : '';
        const empresaVlr = allEmpresas.find(emp => emp.id === empresaId)?.freteValorPadrao || 0;
        const valorInput = parseFloat(document.querySelector('#entrega-valor').value);
        const data = {
            motoristaId,
            empresaId,
            localId,
            localNome,
            supervisorId: user.uid,
            tipo: document.querySelector('#entrega-tipo').value,
            valor: isNaN(valorInput) ? empresaVlr : valorInput,
            status: 'pendente',
            updatedAt: serverTimestamp(),
        };
        try {
            if (id) {
                await updateDoc(doc(db, 'entregas', id), data);
            } else {
                await addDoc(collection(db, 'entregas'), { ...data, dataCriacao: serverTimestamp() });
            }
            modal.classList.add('hidden');
            loadEntregas(user.uid);
        } catch (err) {
            alert('Erro: ' + err.message);
        }
    });
}

async function loadEntregas(supervisorId) {
    const tbody = document.querySelector('#lista-entregas');
    const statusFilter = document.querySelector('#filtro-status')?.value;
    const motFilter = document.querySelector('#filtro-motorista')?.value;

    tbody.innerHTML = '<tr><td colspan="6" class="text-center p-10 text-slate-400">Carregando...</td></tr>';

    // Build query
    let constraints = [where('supervisorId', '==', supervisorId), orderBy('dataCriacao', 'desc')];
    if (statusFilter) constraints.push(where('status', '==', statusFilter));
    if (motFilter) constraints.push(where('motoristaId', '==', motFilter));

    try {
        const snapshot = await getDocs(query(collection(db, 'entregas'), ...constraints));
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center p-10 text-slate-400">Nenhuma entrega encontrada.</td></tr>';
            return;
        }
        const statusColors = { pendente: 'bg-orange-100 text-orange-700', em_rota: 'bg-blue-100 text-blue-700', concluida: 'bg-primary/10 text-primary' };
        const statusLabels = { pendente: 'Pendente', em_rota: 'Em Rota', concluida: 'Concluída' };
        tbody.innerHTML = snapshot.docs.map(d => {
            const e = d.data();
            const motorista = allMotoristas.find(m => m.id === e.motoristaId);
            const empresa = allEmpresas.find(emp => emp.id === e.empresaId);
            const cc = statusColors[e.status] || 'bg-slate-100 text-slate-700';
            const lbl = statusLabels[e.status] || e.status;
            return `<tr>
                <td class="px-6 py-4 font-semibold">${motorista?.nome || '—'}</td>
                <td class="px-6 py-4 text-slate-500 hidden md:table-cell">${empresa?.nome || '—'}</td>
                <td class="px-6 py-4 text-slate-500 hidden lg:table-cell">${e.localNome || '—'}</td>
                <td class="px-6 py-4"><span class="px-2 py-1 rounded-full text-xs font-bold ${cc}">${lbl}</span></td>
                <td class="px-6 py-4 font-bold text-primary">R$ ${(e.valor || 0).toFixed(2).replace('.', ',')}</td>
                <td class="px-6 py-4">
                    <div class="flex gap-2">
                        <button onclick="editarEntrega('${d.id}')" class="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg"><span class="material-symbols-outlined text-lg">edit</span></button>
                        <button onclick="excluirEntrega('${d.id}')" class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><span class="material-symbols-outlined text-lg">delete</span></button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center p-10 text-red-400">Erro: ${err.message}</td></tr>`;
    }
}

function reloadTable() {
    loadEntregas(auth.currentUser?.uid);
}

window.excluirEntrega = async (id) => {
    if (!confirm('Excluir esta entrega?')) return;
    await deleteDoc(doc(db, 'entregas', id));
    loadEntregas(auth.currentUser?.uid);
};

window.editarEntrega = async (id) => {
    const snapshot = await getDocs(query(collection(db, 'entregas'), where('supervisorId', '==', auth.currentUser?.uid)));
    const d = snapshot.docs.find(d => d.id === id);
    if (!d) return;
    const e = d.data();
    document.querySelector('#entrega-id').value = id;
    document.querySelector('#entrega-motorista').value = e.motoristaId || '';
    document.querySelector('#entrega-empresa').value = e.empresaId || '';
    document.querySelector('#entrega-local').value = e.localId || '';
    document.querySelector('#entrega-tipo').value = e.tipo || 'Normal';
    document.querySelector('#entrega-valor').value = e.valor || '';
    document.querySelector('#modal-titulo').textContent = 'Editar Entrega';
    document.querySelector('#modal-entrega').classList.remove('hidden');
};

function setupLogout() {
    document.querySelector('.logout-btn')?.addEventListener('click', async () => {
        if (confirm('Deseja sair?')) {
            await signOut(auth);
            window.location.href = '/app-foods/index.html';
        }
    });
}
