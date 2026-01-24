import react from '@vitejs/plugin-react-swc';
import million from 'million/compiler';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        // @ts-expect-error - React plugin needs default enforcement
        million.vite({ auto: true }),
        // @ts-expect-error - React plugin needs default enforcement
        { ...react() },
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
                enabled: false,
            },

            // Offline
            workbox: {
                globPatterns: ['**/*'],
            },
        }),
    ],
});
