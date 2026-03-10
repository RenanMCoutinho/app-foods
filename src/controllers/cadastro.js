import { auth, db } from '../services/firebase.js';
import {
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import {
    doc, setDoc, addDoc, collection, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

export function initCadastro() {
    const tabMotorista = document.querySelector('#tab-motorista');
    const tabEmpresa = document.querySelector('#tab-empresa');
    const camposEmpresa = document.querySelector('#campos-empresa');
    const roleInput = document.querySelector('#role-selecionado');
    const badgeTitulo = document.querySelector('#badge-titulo');
    const badgeDesc = document.querySelector('#badge-desc');
    const badgeIcone = document.querySelector('#badge-icone');
    const form = document.querySelector('#form-cadastro');

    // --- Tab switching ---
    function setTab(role) {
        const isEmpresa = role === 'supervisor';
        roleInput.value = role;

        tabMotorista.className = `tab-btn flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-black transition-all ${!isEmpresa ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-slate-700'
            }`;
        tabEmpresa.className = `tab-btn flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-black transition-all ${isEmpresa ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-slate-700'
            }`;

        camposEmpresa.classList.toggle('hidden', !isEmpresa);

        // Update badge
        if (isEmpresa) {
            badgeTitulo.textContent = 'Cadastro como Empresa / Supervisor';
            badgeDesc.textContent = 'Você poderá gerenciar entregas e motoristas.';
            badgeIcone.textContent = 'business';
        } else {
            badgeTitulo.textContent = 'Cadastro como Motorista';
            badgeDesc.textContent = 'Você poderá registrar suas entregas diárias.';
            badgeIcone.textContent = 'directions_car';
        }
    }

    tabMotorista.addEventListener('click', () => setTab('motorista'));
    tabEmpresa.addEventListener('click', () => setTab('supervisor'));

    // --- Password toggle ---
    document.querySelector('#toggle-senha')?.addEventListener('click', () => {
        const input = document.querySelector('#cad-senha');
        const icone = document.querySelector('#olho-icone');
        if (input.type === 'password') {
            input.type = 'text';
            icone.textContent = 'visibility_off';
        } else {
            input.type = 'password';
            icone.textContent = 'visibility';
        }
    });

    // --- Form Submit ---
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = document.querySelector('#cad-nome').value.trim();
        const email = document.querySelector('#cad-email').value.trim();
        const senha = document.querySelector('#cad-senha').value;
        const confirmar = document.querySelector('#cad-confirmar').value;
        const role = roleInput.value; // 'motorista' | 'supervisor'
        const empresaNome = document.querySelector('#cad-empresa-nome')?.value.trim();
        const cnpj = document.querySelector('#cad-cnpj')?.value.trim();

        const errorEl = document.querySelector('#cadastro-error');
        const successEl = document.querySelector('#cadastro-success');

        errorEl.classList.add('hidden');
        successEl.classList.add('hidden');

        // Validations
        if (!nome) return showError('Informe seu nome completo.');
        if (!email) return showError('Informe um e-mail válido.');
        if (senha.length < 6) return showError('A senha deve ter no mínimo 6 caracteres.');
        if (senha !== confirmar) return showError('As senhas não coincidem.');

        const btn = document.querySelector('#btn-cadastrar');
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Criando conta...';

        try {
            // Create Firebase Auth user
            const credential = await createUserWithEmailAndPassword(auth, email, senha);
            const uid = credential.user.uid;

            // Save user profile in Firestore
            await setDoc(doc(db, 'usuarios', uid), {
                nome,
                email,
                role,
                createdAt: serverTimestamp(),
            });

            // If empresa, also save in empresas collection
            if (role === 'supervisor' && empresaNome) {
                await addDoc(collection(db, 'empresas'), {
                    nome: empresaNome,
                    cnpj: cnpj || '',
                    supervisorId: uid,
                    tipos: [],
                    createdAt: serverTimestamp(),
                });
            }

            // Show success
            successEl.textContent = `Conta criada com sucesso! Redirecionando para o login...`;
            successEl.classList.remove('hidden');
            form.reset();

            setTimeout(() => {
                window.location.href = './login.html';
            }, 2000);

        } catch (err) {
            let msg = 'Erro ao criar conta.';
            if (err.code === 'auth/email-already-in-use') msg = 'Este e-mail já está em uso.';
            else if (err.code === 'auth/invalid-email') msg = 'E-mail inválido.';
            else if (err.code === 'auth/network-request-failed') msg = 'Sem conexão com a internet.';
            showError(msg);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined">person_add</span> Criar Conta';
        }

        function showError(msg) {
            errorEl.textContent = msg;
            errorEl.classList.remove('hidden');
        }
    });
}
