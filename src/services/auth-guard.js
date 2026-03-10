import { auth, db } from './firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Role-based paths for redirecting after login.
 * Paths are relative to the /pages/ directory.
 */
const ROLE_DASHBOARDS = {
    admin: '/app-foods/pages/admin/dashboard.html',
    supervisor: '/app-foods/pages/supervisor/dashboard.html',
    motorista: '/app-foods/pages/dashboard.html',
};

const LOGIN_PATH = '/app-foods/pages/login.html';

/**
 * Auth Guard - protects pages and enforces role-based access.
 * @param {string[]} allowedRoles - Roles permitted on this page. Empty = all authenticated users.
 */
export async function initGuard(allowedRoles = [], onReady = null) {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = LOGIN_PATH;
            }
            return;
        }

        // User is logged in — fetch their role
        const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
        const role = userDoc.exists() ? (userDoc.data().role || 'motorista') : 'motorista';

        // If roles are restricted, check access
        if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
            alert('Acesso negado. Você será redirecionado para seu painel.');
            window.location.href = ROLE_DASHBOARDS[role] || ROLE_DASHBOARDS.motorista;
            return;
        }

        // Expose user and role globally for page controllers
        window.currentUser = user;
        window.currentRole = role;
        window.currentUserData = userDoc.exists() ? userDoc.data() : {};

        // Call the page controller initializer now that auth is ready
        if (onReady) onReady(user);
    });
}

/**
 * After login, redirect user to the correct dashboard for their role.
 */
export async function redirectToRoleDashboard(user) {
    const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
    const role = userDoc.exists() ? (userDoc.data().role || 'motorista') : 'motorista';
    window.location.href = ROLE_DASHBOARDS[role] || ROLE_DASHBOARDS.motorista;
}
