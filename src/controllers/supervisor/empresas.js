import { db, auth } from '../../services/firebase.js';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export async function initSupervisorEmpresas() {
    const user = auth.currentUser;
    if (!user) return;
    setupLogout();

    await loadEmpresaPai(user.uid);
    setupFormPai(user.uid);
}

function setupLogout() {
    document.querySelector('.logout-btn')?.addEventListener('click', async () => {
        if (confirm('Deseja sair?')) {
            await signOut(auth);
            window.location.href = '/app-foods/index.html';
        }
    });
}

async function loadEmpresaPai(uid) {
    const paiNomeInput = document.querySelector('#pai-nome');
    const paiCnpjInput = document.querySelector('#pai-cnpj');
    const btnSalvarPai = document.querySelector('#btn-salvar-pai');

    try {
        const userDoc = await getDoc(doc(db, 'usuarios', uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            if (paiNomeInput) paiNomeInput.value = data.empresaNome || '';
            if (paiCnpjInput) paiCnpjInput.value = data.empresaCnpj || '';

            if (data.empresaNome && btnSalvarPai) {
                btnSalvarPai.innerHTML = '<span class="material-symbols-outlined">edit</span> Alterar Matriz';
            }
        }
    } catch (err) {
        console.error('Erro ao buscar dados da matriz', err);
    }
}

function setupFormPai(uid) {
    const formPai = document.querySelector('#form-empresa-pai');
    formPai?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.querySelector('#pai-nome').value.trim();
        const cnpj = document.querySelector('#pai-cnpj').value.trim();
        const btn = document.querySelector('#btn-salvar-pai');

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Salvando...';
        }

        try {
            await updateDoc(doc(db, 'usuarios', uid), {
                empresaNome: nome,
                empresaCnpj: cnpj
            });
            if (window.currentUserData) {
                window.currentUserData.empresaNome = nome;
                window.currentUserData.empresaCnpj = cnpj;
            }
            alert('Dados da Matriz salvos com sucesso!');
            await loadEmpresaPai(uid);
        } catch (err) {
            alert('Erro ao salvar Matriz: ' + err.message);
        } finally {
            if (btn) {
                btn.disabled = false;
            }
        }
    });
}
