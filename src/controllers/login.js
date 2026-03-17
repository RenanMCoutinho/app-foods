import { auth } from '../services/firebase.js';
import { redirectToRoleDashboard } from '../services/auth-guard.js';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';

export function initLogin() {
    // If already logged in, redirect to role dashboard
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await redirectToRoleDashboard(user);
        }
    });

    const loginForm = document.querySelector('#login-form');
    if (!loginForm) return;

    const errorEl = document.querySelector('#login-error');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm.querySelector('input[name="username"]').value;
        const password = loginForm.querySelector('input[name="password"]').value;

        if (!email || !password) {
            showError('Preencha e-mail e senha.');
            return;
        }

        const btn = loginForm.querySelector('button[type="submit"]');
        btn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Acessando...';
        btn.disabled = true;

        try {
            const credential = await signInWithEmailAndPassword(auth, email, password);
            await redirectToRoleDashboard(credential.user);
        } catch (error) {
            btn.innerHTML = 'Acessar Conta';
            btn.disabled = false;
            let msg = 'Erro ao fazer login.';
            if (['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password'].includes(error.code)) {
                msg = 'E-mail ou senha incorretos.';
            } else if (error.code === 'auth/unauthorized-domain') {
                msg = 'Domínio não autorizado no Firebase. Adicione o domínio publicado nas configurações de Authentication.';
            } else if (error.code === 'auth/invalid-email') {
                msg = 'Formato de e-mail inválido.';
            } else if (error.code === 'auth/invalid-api-key' || error.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.') {
                msg = 'A configuração do Firebase da versão publicada está inválida ou bloqueada para este domínio.';
            } else if (error.code === 'auth/network-request-failed') {
                msg = 'Sem conexão com a internet.';
            }
            showError(msg);
            console.error('Login error:', error);
        }
    });

    function showError(msg) {
        if (errorEl) {
            errorEl.textContent = msg;
            errorEl.classList.remove('hidden');
        } else {
            alert(msg);
        }
    }
}
