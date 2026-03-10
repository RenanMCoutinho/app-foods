import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    base: '/app-foods/',
    server: {
        open: true
    },
    build: {
        rollupOptions: {
            input: {
                main: './index.html',
                login: './pages/login.html',
                cadastro: './pages/cadastro.html',
                cadastroEmpresa: './pages/cadastro-empresa.html',
                // Motorista
                dashboard: './pages/dashboard.html',
                home: './pages/home.html',
                relatorio: './pages/relatorio.html',
                // Admin
                adminDashboard: './pages/admin/dashboard.html',
                adminEmpresas: './pages/admin/empresas.html',
                adminSupervisores: './pages/admin/supervisores.html',
                adminMotoristas: './pages/admin/motoristas.html',
                // Supervisor
                supervisorDashboard: './pages/supervisor/dashboard.html',
                supervisorEmpresas: './pages/supervisor/empresas.html',
                supervisorEntregas: './pages/supervisor/entregas.html',
                supervisorMotoristas: './pages/supervisor/motoristas.html',

            }
        }
    },
    plugins: [
        VitePWA({
            registerType: 'autoUpdate',
            devOptions: {
                enabled: true /* Habilita o PWA durante o desenvolvimento (npm run dev) */
            },
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
            manifest: {
                name: 'DriverLog',
                short_name: 'DriverLog',
                description: 'Aplicativo de gerenciamento logístico e fretes para motoristas.',
                theme_color: '#0b9e4a',
                background_color: '#f7f9fc',
                display: 'standalone',
                orientation: 'portrait',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            }
        })
    ]
})
