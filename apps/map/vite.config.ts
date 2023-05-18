import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeManifestIcons: true,
            manifest: {
                name: 'Offline Repeater Map',
                short_name: 'Repeater Map',
                description: 'Repeater map for offline use',
                theme_color: '#ffffff',
                icons: [
                    {
                        src: '/vite.svg',
                        sizes: '192x192',
                        type: 'image/svg+xml',
                    },
                    {
                        src: '/vite.svg',
                        sizes: '512x512',
                        type: 'image/svg+xml',
                    },
                ],
            },
            devOptions: {
                enabled: true,
            },

            // Offline
            workbox: {
                globPatterns: ['**/*'],
            },
        }),
    ],
});
