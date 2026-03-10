import { db, auth } from './services/firebase.js';
import {
    collection, getDocs, addDoc, deleteDoc, doc, query, where, orderBy, serverTimestamp, Timestamp
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

let empresas = [];
let entregasDia = [];

export async function initTelaDia() {
    const user = auth.currentUser;
    if (!user) return;

    // Date display
    const hoje = new Date();
    const dataHojeEl = document.querySelector('#data-hoje');
    if (dataHojeEl) {
        dataHojeEl.textContent = hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    }

    // Logout
    document.querySelector('.logout-btn')?.addEventListener('click', async () => {
        if (confirm('Deseja sair?')) {
            await signOut(auth);
            window.location.href = '/app-foods/pages/login.html';
        }
    });

    // Get supervisor of this motorista
    const supervisorId = window.currentUserData?.supervisorId;

    // Load empresas from supervisor
    await loadEmpresas(supervisorId);

    // Load today's deliveries
    await loadEntregasDia(user.uid);

    // Empresa select change handler
    document.querySelector('#select-empresa')?.addEventListener('change', (e) => {
        const empresaId = e.target.value;
        renderTipos(empresaId);
    });
}

async function loadEmpresas(supervisorId) {
    const select = document.querySelector('#select-empresa');
    try {
        const q = supervisorId
            ? query(collection(db, 'empresas'), where('supervisorId', '==', supervisorId))
            : collection(db, 'empresas');
        const snapshot = await getDocs(q);
        empresas = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        empresas.forEach(e => {
            select.innerHTML += `<option value="${e.id}">${e.nome}</option>`;
        });
    } catch (err) {
        console.error('Erro ao carregar empresas', err);
    }
}

function renderTipos(empresaId) {
    const cardTipos = document.querySelector('#card-tipos');
    const listaTipos = document.querySelector('#lista-tipos');
    if (!empresaId) {
        cardTipos.classList.add('hidden');
        return;
    }
    const empresa = empresas.find(e => e.id === empresaId);
    if (!empresa || !empresa.tipos?.length) {
        listaTipos.innerHTML = '<p class="text-sm text-slate-400 italic">Esta empresa não tem tipos de entrega cadastrados.</p>';
        cardTipos.classList.remove('hidden');
        return;
    }

    listaTipos.innerHTML = empresa.tipos.map((t, idx) => `
        <button class="btn-add-entrega w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 hover:bg-primary/10 hover:border-primary/30 border border-slate-200 dark:border-slate-700 rounded-xl transition-all group"
            data-empresa-id="${empresa.id}" data-empresa-nome="${empresa.nome}" data-tipo-nome="${t.nome}" data-valor="${t.valor}">
            <div class="text-left">
                <p class="font-bold text-sm group-hover:text-primary">${t.nome}</p>
                <p class="text-xs text-slate-500">Toque para registrar</p>
            </div>
            <div class="flex items-center gap-2">
                <span class="font-black text-primary text-base">R$ ${(t.valor || 0).toFixed(2).replace('.', ',')}</span>
                <div class="h-8 w-8 rounded-full bg-primary/10 group-hover:bg-primary flex items-center justify-center transition-all">
                    <span class="material-symbols-outlined text-primary group-hover:text-white text-lg">add</span>
                </div>
            </div>
        </button>
    `).join('');

    // Attach click handlers
    listaTipos.querySelectorAll('.btn-add-entrega').forEach(btn => {
        btn.addEventListener('click', () => registrarEntrega(btn.dataset));
    });

    cardTipos.classList.remove('hidden');
}

async function registrarEntrega({ empresaId, empresaNome, tipoNome, valor }) {
    const user = auth.currentUser;
    if (!user) return;

    const btn = document.querySelector(`.btn-add-entrega[data-tipo-nome="${tipoNome}"][data-empresa-id="${empresaId}"]`);
    if (btn) {
        btn.disabled = true;
        btn.classList.add('opacity-50');
    }

    try {
        const hoje = new Date();
        const dataStr = hoje.toISOString().split('T')[0]; // YYYY-MM-DD
        const docRef = await addDoc(collection(db, 'entregas'), {
            motoristaId: user.uid,
            supervisorId: window.currentUserData?.supervisorId || '',
            empresaId,
            empresaNome,
            tipoNome,
            valor: parseFloat(valor),
            data: dataStr,
            status: 'concluida',
            createdAt: serverTimestamp(),
        });

        // Add to local list
        entregasDia.push({ id: docRef.id, empresaNome, tipoNome, valor: parseFloat(valor), data: dataStr });
        renderEntregasDia();
    } catch (err) {
        alert('Erro ao registrar entrega: ' + err.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.classList.remove('opacity-50');
        }
    }
}

async function loadEntregasDia(motoristaId) {
    const hoje = new Date();
    const dataStr = hoje.toISOString().split('T')[0];
    try {
        const snapshot = await getDocs(
            query(collection(db, 'entregas'),
                where('motoristaId', '==', motoristaId),
                where('data', '==', dataStr),
                orderBy('createdAt', 'desc')
            )
        );
        entregasDia = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        renderEntregasDia();
    } catch (err) {
        console.error('Erro ao carregar entregas do dia', err);
    }
}

function renderEntregasDia() {
    const container = document.querySelector('#lista-entregas-dia');
    const contagemEl = document.querySelector('#contagem-dia');
    const totalEl = document.querySelector('#total-dia');

    const total = entregasDia.reduce((acc, e) => acc + (e.valor || 0), 0);
    if (totalEl) totalEl.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    if (contagemEl) contagemEl.textContent = entregasDia.length;

    if (!entregasDia.length) {
        container.innerHTML = `<div class="p-8 text-center">
            <span class="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-700">inbox</span>
            <p class="text-sm text-slate-400 mt-2">Nenhuma entrega registrada hoje.<br>Selecione uma empresa e adicione!</p>
        </div>`;
        return;
    }

    container.innerHTML = entregasDia.map(e => `
        <div class="flex items-center justify-between px-5 py-4" id="entrega-item-${e.id}">
            <div>
                <p class="font-bold text-sm">${e.tipoNome}</p>
                <p class="text-xs text-slate-500">${e.empresaNome}</p>
            </div>
            <div class="flex items-center gap-3">
                <span class="font-black text-primary">R$ ${(e.valor || 0).toFixed(2).replace('.', ',')}</span>
                <button onclick="removerEntrega('${e.id}')" class="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <span class="material-symbols-outlined text-base">remove_circle</span>
                </button>
            </div>
        </div>
    `).join('');
}

window.removerEntrega = async (id) => {
    if (!confirm('Remover esta entrega do dia?')) return;
    await deleteDoc(doc(db, 'entregas', id));
    entregasDia = entregasDia.filter(e => e.id !== id);
    renderEntregasDia();
};
