import { db, auth } from '../../services/firebase.js';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

let todasEmpresas = [];

export async function initSupervisorMotoristas() {
    const user = auth.currentUser;
    if (!user) return;
    setupLogout();

    // Carregar empresas do supervisor uma vez para usar no modal
    try {
        const empSnap = await getDocs(query(collection(db, 'empresas'), where('supervisorId', '==', user.uid)));
        todasEmpresas = empSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
        console.error('Erro ao carregar empresas', e);
    }

    const container = document.querySelector('#lista-motoristas');
    try {
        const snapshot = await getDocs(query(collection(db, 'usuarios'), where('role', '==', 'motorista'), where('supervisorId', '==', user.uid)));
        if (snapshot.empty) {
            container.innerHTML = '<div class="col-span-3 text-center p-10 text-slate-400">Nenhum motorista atribuído a você ainda.</div>';
            return;
        }

        container.innerHTML = snapshot.docs.map(d => {
            const m = d.data();
            m.id = d.id;
            const linkados = m.empresasIds?.length || 0;
            return `<div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative group">
                <div class="flex items-center gap-4 mb-4">
                    <div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span class="material-symbols-outlined text-primary text-2xl">person</span>
                    </div>
                    <div>
                        <p class="font-black">${m.nome || '—'}</p>
                        <p class="text-sm text-slate-500">${m.email || ''}</p>
                    </div>
                </div>
                <div class="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p class="text-xs text-slate-500"><strong class="text-slate-700 dark:text-slate-300">${linkados}</strong> empresa(s) vinculada(s)</p>
                    <button onclick="abrirModalVincular('${m.id}', '${m.nome}', '${(m.empresasIds || []).join(',')}')" 
                        class="flex items-center gap-1 text-xs text-primary font-bold hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
                        <span class="material-symbols-outlined text-sm">link</span> Vincular
                    </button>
                </div>
            </div>`;
        }).join('');
    } catch (err) {
        container.innerHTML = `<div class="col-span-3 text-center p-10 text-red-400">Erro: ${err.message}</div>`;
    }

    setupModal();
}

function setupModal() {
    const modal = document.querySelector('#modal-vincular');
    const btnFechar = document.querySelector('#btn-fechar-modal');
    const btnSalvar = document.querySelector('#btn-salvar-vinculo');

    btnFechar?.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    // Close on backdrop click
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });

    btnSalvar?.addEventListener('click', async () => {
        const motoristaId = document.querySelector('#modal-motorista-id').value;
        const btn = document.querySelector('#btn-salvar-vinculo');

        // Pega todos os checkboxes marcados
        const checkboxes = document.querySelectorAll('.check-empresa:checked');
        const empresasIds = Array.from(checkboxes).map(chk => chk.value);

        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Salvando...';

        try {
            await updateDoc(doc(db, 'usuarios', motoristaId), {
                empresasIds: empresasIds
            });
            modal.classList.add('hidden');
            // Recarrega a lista
            initSupervisorMotoristas();
        } catch (err) {
            alert('Erro ao salvar vínculos: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined">save</span> Salvar Vínculos';
        }
    });

    window.abrirModalVincular = (id, nome, empresasIdsStr) => {
        const empresasAtuais = empresasIdsStr ? empresasIdsStr.split(',') : [];
        document.querySelector('#nome-motorista-modal').textContent = nome;
        document.querySelector('#modal-motorista-id').value = id;

        const listaContainer = document.querySelector('#lista-empresas-checkbox');

        if (todasEmpresas.length === 0) {
            listaContainer.innerHTML = '<p class="text-sm text-slate-500 italic">Você ainda não tem empresas cadastradas.</p>';
        } else {
            listaContainer.innerHTML = todasEmpresas.map(emp => {
                const checked = empresasAtuais.includes(emp.id) ? 'checked' : '';
                return `
                <label class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                    <input type="checkbox" value="${emp.id}" class="check-empresa w-5 h-5 text-primary border-slate-300 rounded focus:ring-primary" ${checked}>
                    <span class="font-medium text-slate-800 dark:text-slate-200 text-sm">${emp.nome}</span>
                </label>
                `;
            }).join('');
        }

        modal.classList.remove('hidden');
    };
}

function setupLogout() {
    document.querySelector('.logout-btn')?.addEventListener('click', async () => {
        if (confirm('Deseja sair?')) {
            await signOut(auth);
            window.location.href = '/app-foods/pages/login.html';
        }
    });
}
