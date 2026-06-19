import compress from 'astro-compress';
import icon from 'astro-icon';
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
	site: 'https://space.thomasbreindl.me',
	integrations: [
		react(),
		icon({
			include: {
				mdi: ['*'],
				'fa-brands': ['*'],
			},
		}),
		compress({
			img: false,
		}),
	],
	vite: {
		ssr: {
			external: ['svgo'],
			optimizeDeps: { include: ['leaflet'] },
		},
	},
});
