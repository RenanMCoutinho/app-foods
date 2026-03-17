import { db, auth } from '../../services/firebase.js';
import { collection, getDocs, doc, updateDoc, getDoc, query, where, limit } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { escapeAttribute, escapeHtml, escapeJsString } from '../../utils/sanitize.js';

let minhaMatriz = null;
let motoristasRenderizados = [];

export async function initSupervisorMotoristas() {
    setupLogout();

    const user = auth.currentUser;
    if (!user) return;

    // Load Minha Matriz (Empresa Pai) to know who I am
    try {
        const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
        if (userDoc.exists()) {
            minhaMatriz = userDoc.data();
        }
    } catch (e) {
        console.error('Erro ao buscar dados da matriz do supervisor', e);
    }

    setupModal();

    // Configurar o campo de busca
    const searchForm = document.querySelector('#form-busca-motorista');
    const searchInput = document.querySelector('#input-busca-motorista');

    // Ao carregar, mostrar TODOS automático (limitado preventivamente)
    await loadMotoristas();

    searchForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const termo = searchInput.value.trim().toLowerCase();
        await loadMotoristas(termo);
    });
}

async function loadMotoristas(termoBusca = '') {
    const user = auth.currentUser;
    if (!user) return;

    const container = document.querySelector('#lista-motoristas');
    container.innerHTML = '<div class="col-span-3 text-center p-10 text-slate-400">Buscando motoristas...</div>';

    try {
        let q;
        if (termoBusca) {
            // Buscando todos não é muito performático no front pra DB grande, ms como é app pequeno:
            q = query(collection(db, 'usuarios'), where('role', '==', 'motorista'));
        } else {
            // Auto mostrar ao carregar: limitamos a 50 p/ evitar lentidão.
            q = query(collection(db, 'usuarios'), where('role', '==', 'motorista'), limit(50));
        }

        const snap = await getDocs(q);
        let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        if (termoBusca) {
            list = list.filter(m =>
                (m.nome || '').toLowerCase().includes(termoBusca) ||
                (m.email || '').toLowerCase().includes(termoBusca)
            ).slice(0, 30);
        }

        motoristasRenderizados = list;
        renderMotoristasGrid(list, container);

    } catch (err) {
        container.innerHTML = `<div class="col-span-3 text-center p-10 text-red-400">Erro: ${err.message}</div>`;
    }
}

function renderMotoristasGrid(lista, container) {
    const user = auth.currentUser;
    if (!lista || lista.length === 0) {
        container.innerHTML = '<div class="col-span-3 text-center p-10 text-slate-400">Nenhum motorista encontrado.</div>';
        return;
    }

    container.innerHTML = lista.map(m => {
        const matrizesVinculadas = m.matrizesVinculadas || [];
        const isVinculado = matrizesVinculadas.includes(user.uid) || m.supervisorId === user.uid;

        return `<div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border ${isVinculado ? 'border-primary/50 ring-1 ring-primary/20' : 'border-slate-200 dark:border-slate-800'} shadow-sm relative group transition-all">
            <div class="flex items-center gap-4 mb-4">
                <div class="h-12 w-12 rounded-full ${isVinculado ? 'bg-primary/20' : 'bg-slate-100 dark:bg-slate-800'} flex items-center justify-center transition-colors">
                    <span class="material-symbols-outlined ${isVinculado ? 'text-primary' : 'text-slate-400'} text-2xl">person</span>
                </div>
                <div>
                    <p class="font-black text-slate-900 dark:text-white truncate max-w-[150px]" title="${escapeAttribute(m.nome || '—')}">${escapeHtml(m.nome || '—')}</p>
                    <p class="text-[11px] text-slate-500 truncate max-w-[150px]" title="${escapeAttribute(m.email || '')}">${escapeHtml(m.email || '')}</p>
                </div>
            </div>
            <div class="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <p class="text-[11px] leading-tight text-slate-500">Matriz Vinculada:<br><strong class="${isVinculado ? 'text-primary' : 'text-slate-400'} text-sm">${isVinculado ? 'Sim' : 'Não'}</strong></p>
                <button onclick="abrirModalVincular('${escapeJsString(m.id)}', ${isVinculado})" 
                    class="flex items-center justify-center gap-1.5 text-xs text-white ${isVinculado ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'} font-bold px-3 py-2 rounded-lg transition-colors shadow-sm">
                    <span class="material-symbols-outlined text-[16px]">${isVinculado ? 'link_off' : 'link'}</span> ${isVinculado ? 'Desvincular' : 'Vincular'}
                </button>
            </div>
        </div>`;
    }).join('');
}

function setupModal() {
    const modal = document.querySelector('#modal-vincular');
    const btnFechar = document.querySelector('#btn-fechar-modal');
    const btnCancelar = document.querySelector('#btn-cancelar-vinculo');
    const btnSalvar = document.querySelector('#btn-salvar-vinculo');

    const closeHandler = () => modal.classList.add('hidden');
    btnFechar?.addEventListener('click', closeHandler);
    btnCancelar?.addEventListener('click', closeHandler);
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeHandler();
    });

    btnSalvar?.addEventListener('click', async () => {
        const user = auth.currentUser;
        const motoristaId = document.querySelector('#modal-motorista-id').value;
        const isDesvincular = btnSalvar.dataset.action === 'desvincular';

        btnSalvar.disabled = true;
        const originalText = btnSalvar.innerHTML;
        btnSalvar.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Aguarde...';

        try {
            const mDoc = await getDoc(doc(db, 'usuarios', motoristaId));
            if (mDoc.exists()) {
                let matrizesVinculadas = mDoc.data().matrizesVinculadas || [];

                if (isDesvincular) {
                    matrizesVinculadas = matrizesVinculadas.filter(uid => uid !== user.uid);
                } else {
                    if (!matrizesVinculadas.includes(user.uid)) {
                        matrizesVinculadas.push(user.uid);
                    }
                }

                await updateDoc(doc(db, 'usuarios', motoristaId), {
                    matrizesVinculadas: matrizesVinculadas,
                    supervisorId: isDesvincular ? null : user.uid // Keeps backwards compatibility
                });

                modal.classList.add('hidden');
                initSupervisorMotoristas(); // Reload fresh
            }
        } catch (err) {
            alert('Erro ao alterar vínculo: ' + err.message);
        } finally {
            btnSalvar.disabled = false;
            btnSalvar.innerHTML = originalText;
        }
    });

    window.abrirModalVincular = (id, isVinculado) => {
        const motorista = motoristasRenderizados.find((item) => item.id === id);
        document.querySelector('#nome-motorista-modal').textContent = motorista?.nome || 'Motorista';
        document.querySelector('#modal-motorista-id').value = id;
        document.querySelector('#nome-matriz-modal').textContent = (minhaMatriz && minhaMatriz.empresaNome) ? minhaMatriz.empresaNome : 'Sua Matriz (Não configurada)';

        const btnSalvar = document.querySelector('#btn-salvar-vinculo');

        if (isVinculado) {
            btnSalvar.dataset.action = 'desvincular';
            btnSalvar.innerHTML = '<span class="material-symbols-outlined">link_off</span> Desvincular';
            btnSalvar.className = "flex-1 bg-red-500 hover:bg-red-600 text-white font-black py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2";
        } else {
            btnSalvar.dataset.action = 'vincular';
            btnSalvar.innerHTML = '<span class="material-symbols-outlined">link</span> Vincular';
            btnSalvar.className = "flex-1 bg-primary hover:bg-primary/90 text-white font-black py-3 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2";
        }

        modal.classList.remove('hidden');
    };
}

function setupLogout() {
    document.querySelector('.logout-btn')?.addEventListener('click', async () => {
        if (confirm('Deseja sair?')) {
            await signOut(auth);
            window.location.href = '/app-foods/index.html';
        }
    });
}
