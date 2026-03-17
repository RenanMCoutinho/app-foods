import { auth, db } from '../services/firebase.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

export function initCadastroEmpresa() {
    // Password visibility toggle
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

    const form = document.querySelector('#form-cadastro-empresa');
    const errorEl = document.querySelector('#cadastro-error');
    const successEl = document.querySelector('#cadastro-success');

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = document.querySelector('#cad-nome').value.trim();
        const empresaNome = document.querySelector('#cad-empresa-nome').value.trim();
        const cnpj = document.querySelector('#cad-cnpj').value.trim();
        const email = document.querySelector('#cad-email').value.trim();
        const senha = document.querySelector('#cad-senha').value;
        const confirmar = document.querySelector('#cad-confirmar').value;

        errorEl.classList.add('hidden');
        successEl.classList.add('hidden');

        if (!nome) return showError('Informe o nome do responsável.');
        if (!empresaNome) return showError('Informe o nome da empresa.');
        if (!email) return showError('Informe um e-mail válido.');
        if (senha.length < 6) return showError('A senha deve ter no mínimo 6 caracteres.');
        if (senha !== confirmar) return showError('As senhas não coincidem.');
        return showError('Cadastro público de empresa/supervisor foi desativado. Esse perfil precisa ser criado por um fluxo administrativo seguro.');

        const btn = document.querySelector('#btn-cadastrar');
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Criando conta...';

        try {
            const credential = await createUserWithEmailAndPassword(auth, email, senha);
            const uid = credential.user.uid;

            // Save user profile as supervisor
            await setDoc(doc(db, 'usuarios', uid), {
                nome,
                email,
                role: 'supervisor',
                createdAt: serverTimestamp(),
            });

            // Create initial empresa linked to this supervisor
            await addDoc(collection(db, 'empresas'), {
                nome: empresaNome,
                cnpj: cnpj || '',
                supervisorId: uid,
                tipos: [],
                createdAt: serverTimestamp(),
            });

            successEl.textContent = `Conta criada com sucesso! Redirecionando para o login...`;
            successEl.classList.remove('hidden');
            form.reset();

            setTimeout(() => {
                window.location.href = './login.html';
            }, 2000);

        } catch (err) {
            let msg = `Erro: ${err.code || err.message}`;
            if (err.code === 'auth/email-already-in-use') msg = 'Este e-mail já está em uso.';
            else if (err.code === 'auth/invalid-email') msg = 'E-mail inválido.';
            else if (err.code === 'auth/weak-password') msg = 'Senha muito fraca (mínimo 6 caracteres).';
            else if (err.code === 'auth/operation-not-allowed') msg = 'Login com e-mail/senha não está habilitado no Firebase. Ative em: Authentication → Sign-in method.';
            else if (err.code === 'auth/network-request-failed') msg = 'Sem conexão com a internet.';
            showError(msg);
            console.error('[Firebase Error]', err.code, err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined">business</span> Criar Conta de Empresa';
        }
    });

    function showError(msg) {
        errorEl.textContent = msg;
        errorEl.classList.remove('hidden');
    }
}
