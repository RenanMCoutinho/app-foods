import { auth } from '../services/firebase.js';
import { signInWithEmailAndPassword } from 'firebase/auth';

export function initLogin(page, app) {
    const loginForm = page.$el.find('#login-form');

    loginForm.on('submit', async (e) => {
        e.preventDefault();
        const email = page.$el.find('input[name="username"]').val();
        const password = page.$el.find('input[name="password"]').val();

        if (!email || !password) {
            app.dialog.alert('Preencha e-mail e senha.', 'DriverLog');
            return;
        }

        app.preloader.show();

        try {
            await signInWithEmailAndPassword(auth, email, password);
            app.preloader.hide();
            // router will automatically catch the state change and redirect
        } catch (error) {
            app.preloader.hide();
            let errorMessage = 'Erro ao fazer login.';
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = 'E-mail ou senha incorretos.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Formato de e-mail inválido.';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Sem conexão com a internet.';
            }
            app.dialog.alert(errorMessage, 'DriverLog');
            console.error('Login error:', error);
        }
    });
}
