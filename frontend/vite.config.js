import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
var __dirname = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            workbox: { globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'] },
            manifest: {
                name: 'PalletMS',
                short_name: 'PalletMS',
                description: 'Pallet tracking',
                theme_color: '#0f172a',
                background_color: '#0f172a',
                display: 'standalone',
                orientation: 'portrait',
                start_url: '/',
                icons: [
                    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
                    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
                ],
            },
        }),
    ],
    resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
    server: { port: 5173, proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true } } },
});
