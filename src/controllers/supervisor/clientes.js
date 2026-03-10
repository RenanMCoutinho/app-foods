import { db, auth } from '../../services/firebase.js';
import {
    collection, getDocs, getDoc, addDoc, doc, updateDoc, deleteDoc,
    query, where, serverTimestamp
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export async function initSupervisorClientes() {
    const user = auth.currentUser;
    if (!user) return;
    setupLogout();
    setupCheckboxes();

    await checkEmpresaPai(user.uid);

    const modal = document.querySelector('#modal-empresa');
    const form = document.querySelector('#form-empresa');

    document.querySelector('#btn-nova-empresa')?.addEventListener('click', () => {
        document.querySelector('#empresa-id').value = '';
        document.querySelector('#modal-titulo').textContent = 'Novo Cliente';
        form.reset();

        // Reset all checkboxes and hide value fields
        document.querySelectorAll('.tipo-check').forEach(cb => {
            cb.checked = false;
            const valorField = cb.closest('.tipo-item') ? cb.closest('.tipo-item').querySelector('.valor-field') : null;
            if (valorField) valorField.classList.add('hidden');
        });
        modal.classList.remove('hidden');
    });

    document.querySelector('#btn-fechar-modal')?.addEventListener('click', () => modal.classList.add('hidden'));
    modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Collect selected tipos
        const tipos = [];
        document.querySelectorAll('.tipo-check:checked').forEach(cb => {
            const item = cb.closest('.tipo-item');
            const valor = parseFloat(item.querySelector('.tipo-valor')?.value || '0');
            tipos.push({ nome: cb.dataset.tipo, valor: isNaN(valor) ? 0 : valor });
        });

        const data = {
            nome: document.querySelector('#empresa-nome').value.trim(),
            endereco: document.querySelector('#empresa-endereco').value.trim(),
            cnpj: document.querySelector('#empresa-cnpj').value.trim(),
            tipos,
            supervisorId: user.uid,
            updatedAt: serverTimestamp(),
        };

        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined">progress_activity</span> Salvando...';

        try {
            const id = document.querySelector('#empresa-id').value;
            if (id) {
                await updateDoc(doc(db, 'empresas', id), data);
            } else {
                await addDoc(collection(db, 'empresas'), { ...data, createdAt: serverTimestamp() });
            }
            modal.classList.add('hidden');
            loadEmpresas(user.uid);
        } catch (err) {
            alert('Erro ao salvar: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined">save</span> Salvar Cliente';
        }
    });
}

function setupCheckboxes() {
    document.querySelectorAll('.tipo-check').forEach(cb => {
        cb.addEventListener('change', () => {
            const valorField = cb.closest('.tipo-item').querySelector('.valor-field');
            const hint = cb.closest('label').querySelector('.text-xs.text-slate-400');
            if (cb.checked) {
                valorField.classList.remove('hidden');
                if (hint) hint.textContent = 'Ativo';
                cb.closest('.tipo-item').classList.add('ring-2', 'ring-primary');
            } else {
                valorField.classList.add('hidden');
                if (hint) hint.textContent = 'Clique para ativar';
                cb.closest('.tipo-item').classList.remove('ring-2', 'ring-primary');
            }
        });
    });
}

async function checkEmpresaPai(uid) {
    const alertaBloqueio = document.querySelector('#alerta-bloqueio');
    const btnNovaFilial = document.querySelector('#btn-nova-empresa');
    const matrizNomeEl = document.querySelector('#modal-matriz-nome');

    try {
        const userDoc = await getDoc(doc(db, 'usuarios', uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            const empresaNome = data.empresaNome;

            if (matrizNomeEl) {
                matrizNomeEl.textContent = empresaNome || 'Não informada';
            }

            if (!empresaNome) {
                // Not filled
                if (alertaBloqueio) alertaBloqueio.classList.remove('hidden');
                if (btnNovaFilial) {
                    btnNovaFilial.disabled = true;
                    btnNovaFilial.classList.add('opacity-50', 'cursor-not-allowed');
                }
            } else {
                // Filled
                if (alertaBloqueio) alertaBloqueio.classList.add('hidden');
                if (btnNovaFilial) {
                    btnNovaFilial.disabled = false;
                    btnNovaFilial.classList.remove('opacity-50', 'cursor-not-allowed');
                }
                loadEmpresas(uid);
            }
        }
    } catch (err) {
        console.error('Erro ao verificar empresa matriz', err);
    }
}

async function loadEmpresas(supervisorId) {
    const container = document.querySelector('#lista-empresas');
    if (!container) return;
    container.innerHTML = '<div class="text-center p-10 text-slate-400">Carregando...</div>';
    try {
        const snapshot = await getDocs(query(collection(db, 'empresas'), where('supervisorId', '==', supervisorId)));
        if (snapshot.empty) {
            container.innerHTML = `<div class="text-center p-16 text-slate-400">
                <span class="material-symbols-outlined text-6xl opacity-20 block mb-3">storefront</span>
                <p class="text-sm font-medium">Nenhum cliente cadastrado.</p>
                <p class="text-xs mt-1">Clique em "Novo Cliente" para começar.</p>
            </div>`;
            return;
        }

        const tipoIcons = {
            'Desjejum': { icon: 'wb_sunny', color: 'text-amber-500 bg-amber-50' },
            'Almoço': { icon: 'restaurant', color: 'text-orange-500 bg-orange-50' },
            'Janta': { icon: 'dinner_dining', color: 'text-indigo-500 bg-indigo-50' },
            'Ceia': { icon: 'nightlight', color: 'text-purple-500 bg-purple-50' },
            'B.O': { icon: 'package_2', color: 'text-red-500 bg-red-50' },
        };

        container.innerHTML = snapshot.docs.map(d => {
            const e = d.data();
            const tiposHtml = (e.tipos || []).map(t => {
                const icon = tipoIcons[t.nome] || { icon: 'local_shipping', color: 'text-primary bg-primary/10' };
                return `<div class="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div class="flex items-center gap-2">
                        <span class="${icon.color} p-1.5 rounded-lg">
                            <span class="material-symbols-outlined text-base">${icon.icon}</span>
                        </span>
                        <span class="text-sm font-semibold">${t.nome}</span>
                    </div>
                    <span class="font-black text-primary text-sm">R$ ${(t.valor || 0).toFixed(2).replace('.', ',')}</span>
                </div>`;
            }).join('');

            return `<div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div class="flex items-start justify-between mb-4">
                    <div>
                        <h3 class="font-black text-lg leading-tight">${e.nome || '—'}</h3>
                        ${e.endereco ? `<p class="text-sm text-slate-500 flex items-center gap-1 mt-0.5"><span class="material-symbols-outlined text-sm">pin_drop</span>${e.endereco}</p>` : ''}
                        ${e.cnpj ? `<p class="text-xs text-slate-400 mt-0.5">${e.cnpj}</p>` : ''}
                    </div>
                    <div class="flex gap-2 shrink-0 ml-4">
                        <button onclick="editarEmpresa('${d.id}')" class="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                            <span class="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button onclick="excluirEmpresa('${d.id}')" class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <span class="material-symbols-outlined text-lg">delete</span>
                        </button>
                    </div>
                </div>
                ${tiposHtml
                    ? `<div class="space-y-2">${tiposHtml}</div>`
                    : `<p class="text-xs text-slate-400 italic">Nenhum tipo de entrega configurado.</p>`
                }
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
    document.querySelector('#empresa-endereco').value = e.endereco || '';
    document.querySelector('#empresa-cnpj').value = e.cnpj || '';
    document.querySelector('#modal-titulo').textContent = 'Editar Cliente';

    // Reset all first
    document.querySelectorAll('.tipo-check').forEach(cb => {
        cb.checked = false;
        cb.closest('.tipo-item').querySelector('.valor-field').classList.add('hidden');
        cb.closest('.tipo-item').classList.remove('ring-2', 'ring-primary');
    });

    // Apply saved tipos
    (e.tipos || []).forEach(t => {
        const cb = document.querySelector(`.tipo-check[data-tipo="${t.nome}"]`);
        if (cb) {
            cb.checked = true;
            const item = cb.closest('.tipo-item');
            item.querySelector('.valor-field').classList.remove('hidden');
            item.querySelector('.tipo-valor').value = t.valor || '';
            item.classList.add('ring-2', 'ring-primary');
            const hint = cb.closest('label').querySelector('.text-xs.text-slate-400');
            if (hint) hint.textContent = 'Ativo';
        }
    });

    document.querySelector('#modal-empresa').classList.remove('hidden');
};

window.excluirEmpresa = async (id) => {
    if (!confirm('Excluir este cliente?')) return;
    await deleteDoc(doc(db, 'empresas', id));
    loadEmpresas(auth.currentUser?.uid);
};

function setupLogout() {
    document.querySelector('.logout-btn')?.addEventListener('click', async () => {
        if (confirm('Deseja sair?')) {
            await signOut(auth);
            window.location.href = '/app-foods/pages/login.html';
        }
    });
}
